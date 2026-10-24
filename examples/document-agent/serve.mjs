import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { once } from "node:events";
import { build, context } from "esbuild";
import { openDocument, extractDocument } from "@onodocs/sdk";
import { agentApiReference, createUsageMeter, runAgentTurn } from "@onodocs/agent/server";
import { createOpenAIProvider } from "@onodocs/agent/openai";

export async function serveAgent(port = 5198, options = {}) {
  const directory = join(homedir(), ".tmp/onodocs/agent-example"); await mkdir(directory, { recursive: true });
  const db = new DatabaseSync(options.database ?? join(directory, "sessions.sqlite"));
  db.exec("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, token TEXT NOT NULL, value TEXT NOT NULL)");
  const read = id => { const row = db.prepare("SELECT token,value FROM records WHERE id=?").get(id); return row && { token: row.token, value: JSON.parse(row.value) }; };
  const store = id => ({ async load() { return read(id); }, async compareExchange(token, next) { return (token === undefined ? db.prepare("INSERT OR IGNORE INTO records VALUES (?,?,?)").run(id, next.token, JSON.stringify(next.value)) : db.prepare("UPDATE records SET token=?,value=? WHERE id=? AND token=?").run(next.token, JSON.stringify(next.value), id, token)).changes === 1; } });
  const save = (id, value) => db.prepare("INSERT INTO records VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,value=excluded.value").run(id, crypto.randomUUID(), JSON.stringify(value));
  const clients = new Set();
  let bundle, watcher;
  const editorSource = resolve(import.meta.dirname, "../../packages/editor/src");
  const settings = { define: { "import.meta.env.DEV": JSON.stringify(Boolean(options.dev)) }, ...(options.dev ? { alias: { "@onodocs/editor/application": join(editorSource, "application.ts"), "@onodocs/editor": join(editorSource, "index.ts") } } : {}), entryPoints: [join(import.meta.dirname, "main.js")], bundle: true, format: "esm", platform: "browser", write: false };
  if (options.dev) {
    watcher = await context({ ...settings, plugins: [{ name: "live-reload", setup(build) {
      build.onLoad({ filter: /main\.js$/ }, async args => args.path === join(import.meta.dirname, "main.js") ? { contents: await readFile(args.path, "utf8"), loader: "js", watchFiles: [join(import.meta.dirname, "index.html"), join(import.meta.dirname, "style.css")] } : undefined);
      build.onEnd(result => { if (!result.errors.length) { bundle = result; for (const client of clients) client.write("event: change\ndata: reload\n\n"); } });
    } }] });
    await watcher.rebuild();
    await watcher.watch();
  } else bundle = await build(settings);
  const workerBundle = await build({ entryPoints: [fileURLToPath(new URL("./script-worker.js", import.meta.resolve("@onodocs/agent")))], bundle: true, format: "esm", platform: "browser", write: false });
  const active = new Map(), replies = new Map(), conversations = new Map(), transcripts = new Map();
  const provider = options.provider ?? createOpenAIProvider({ apiKey: () => process.env.OPENAI_API_KEY ?? "", model: "gpt-6-luna", serviceTier: "fast", reasoningEffort: "high" });
  const server = createServer(async (request, response) => {
    const origin = `http://127.0.0.1:${server.address().port}`, url = new URL(request.url, origin);
    let session = /(?:^|; )onodocs_agent=([a-f0-9-]+)/.exec(request.headers.cookie ?? "")?.[1];
    if (!session) { session = crypto.randomUUID(); response.setHeader("Set-Cookie", `onodocs_agent=${session}; HttpOnly; SameSite=Strict; Path=/`); }
    const send = (status, value) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(value)); };
    try {
      if (request.method === "GET") {
        if (url.pathname === "/api/transcript") {
          const chat = url.searchParams.get("chat");
          if (!chat || !/^[a-f0-9-]{36}$/.test(chat)) return send(400, { error: "Missing chat identity" });
          return send(200, transcripts.get(session + ":" + chat) ?? { status: "No messages yet", instructions: agentApiReference, input: [], usage: null });
        }
        if (options.dev) response.setHeader("Cache-Control", "no-store");
        if (options.dev && url.pathname === "/__dev/events") { response.writeHead(200, { "Content-Type": "text/event-stream", Connection: "keep-alive" }); response.write(": connected\n\n"); clients.add(response); response.on("close", () => clients.delete(response)); return; }
        if (url.pathname === "/script-worker.js") { response.setHeader("Content-Type", "text/javascript"); response.end(workerBundle.outputFiles[0].contents); return; }
        if (url.pathname === "/main.js") { response.setHeader("Content-Type", "text/javascript"); response.end(bundle.outputFiles[0].contents); return; }
        const files = { "/transcript": [join(import.meta.dirname, "transcript.html"), "text/html"], "/transcript.js": [join(import.meta.dirname, "transcript.js"), "text/javascript"], "/": [join(import.meta.dirname, "index.html"), "text/html"], "/style.css": [join(import.meta.dirname, "style.css"), "text/css"], "/sample.docx": [options.document ?? join(import.meta.dirname, "sample.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] };
        if (!files[url.pathname]) return send(404, { error: "Not found" });
        response.setHeader("Content-Type", files[url.pathname][1]);
        const content = await readFile(files[url.pathname][0]);
        response.end(options.dev && url.pathname === "/" ? content.toString().replace("</body>", '<script>new EventSource("/__dev/events").addEventListener("change", () => location.reload());</script></body>') : content); return;
      }
      if (request.headers.origin !== origin) return send(403, { error: "Use the same-origin example page." });
      db.prepare("DELETE FROM records WHERE id LIKE 'attachment:%' AND json_extract(value,'$.expires')<?").run(Date.now());
      if (request.method === "DELETE" && url.pathname.startsWith("/api/attachments/")) {
        db.prepare("DELETE FROM records WHERE id=?").run(`attachment:${session}:${url.pathname.slice('/api/attachments/'.length)}`);
        return send(200, {});
      }
      const chat = request.headers["x-onodocs-chat"];
      const conversationKey = typeof chat === "string" && /^[a-f0-9-]{36}$/.test(chat) ? session + ":" + chat : undefined;
      if (request.method === "DELETE" && url.pathname === "/api/agent") {
        if (!conversationKey) return send(400, { error: "Missing chat identity" });
        active.get(conversationKey)?.abort(); conversations.delete(conversationKey); return send(200, {});
      }
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (!options.dev && size > 128 * 1024) return send(413, { error: "Request too large" }); chunks.push(chunk); }
      const body = Buffer.concat(chunks);
      if (url.pathname === "/api/attachments") {
        const name = decodeURIComponent(request.headers["x-filename"] ?? ""); let text;
        if (name.endsWith(".txt")) text = new TextDecoder("utf-8", { fatal: true }).decode(body);
        else if (name.endsWith(".docx")) { const doc = await openDocument(body); try { text = extractDocument(doc).markdown; } finally { doc.dispose(); } }
        else return send(415, { error: "Only UTF-8 TXT and DOCX attachments are supported." });
        if (!options.dev && Buffer.byteLength(text) > 24000) return send(413, { error: "Attachment context is too large." });
        const id = crypto.randomUUID(); save(`attachment:${session}:${id}`, { name, text, expires: Date.now() + 86400000 }); return send(200, { id, name, mediaType: name.endsWith(".txt") ? "text/plain" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      }
      const input = JSON.parse(body.toString());
      if (url.pathname === "/api/agent/reply") {
        const pending = replies.get(input.id);
        if (!pending || pending.session !== session || pending.request !== input.request) return send(409, { error: "Unknown tool request" });
        replies.delete(input.id); pending.resolve(input.result); return send(200, {});
      }
      if (url.pathname !== "/api/agent") return send(404, { error: "Not found" });
      if (!conversationKey) return send(400, { error: "Missing chat identity" });
      if (active.has(conversationKey) || read(`request:${session}:${input.id}`)) return send(409, { error: "This turn is active or has already been submitted." });
      if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/.test(input.id)) return send(400, { error: "Invalid request" });
      save(`request:${session}:${input.id}`, { started: Date.now() });
      const controller = new AbortController(); active.set(conversationKey, controller); response.on("close", () => controller.abort());
      response.writeHead(200, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" });
      const emit = event => response.write(JSON.stringify(event) + "\n");
      const usage = { responses: [], turn: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, unreportedResponses: 0 }, conversation: read(`usage:${conversationKey}`)?.value ?? { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, unreportedResponses: 0 } };
      const transcript = { status: "Running", instructions: agentApiReference, input: [...(conversations.get(conversationKey)?.input ?? []), { role: "user", content: input.message.text }], usage };
      transcripts.set(conversationKey, transcript);
      const recordingProvider = { async respond(request) {
        transcript.instructions = request.instructions; transcript.input = request.input;
        const entry = { round: usage.responses.length + 1, startedAt: new Date().toISOString() };
        usage.responses.push(entry);
        save(`usage:${conversationKey}:${input.id}`, usage);
        try {
          const result = await provider.respond(request);
          entry.usage = { ...result.usage, totalTokens: result.usage.inputTokens + result.usage.outputTokens };
          for (const key of ["inputTokens", "outputTokens", "cachedTokens", "totalTokens"]) { usage.turn[key] += entry.usage[key]; usage.conversation[key] += entry.usage[key]; }
          return result;
        } finally {
          entry.completedAt = new Date().toISOString();
          if (!entry.usage) { usage.turn.unreportedResponses++; usage.conversation.unreportedResponses++; }
          save(`usage:${conversationKey}:${input.id}`, usage);
          save(`usage:${conversationKey}`, usage.conversation);
        }
      } };
      const bridge = { reference: agentApiReference, dispose() {}, async call(call, signal) {
        const id = crypto.randomUUID();
        const result = new Promise((resolve, reject) => { const abort = () => { replies.delete(id); reject(signal.reason); }; replies.set(id, { session, request: input.id, resolve(value) { signal.removeEventListener("abort", abort); resolve(value); } }); signal.addEventListener("abort", abort, { once: true }); });
        emit({ type: "api", id, call }); return result;
      } };
      try {
        for await (const event of runAgentTurn({ provider: recordingProvider, bridge, pageImages: true, tools: options.tools ?? [], instructions: options.instructions ?? "", ...(options.dev ? { limits: false, async reserve() { return crypto.randomUUID(); }, async settle() {} } : createUsageMeter(store("usage"), session, request.socket.remoteAddress)), async commit(value) { transcript.input = value.input; transcript.status = "Completed"; conversations.set(conversationKey, value); save(`transcript:${conversationKey}:${input.id}`, { completedAt: new Date().toISOString(), ...value, usage }); }, async attachments(message) { return message.attachments.map(file => { const stored = read(`attachment:${session}:${file.id}`)?.value; if (!stored) throw new Error("Unknown attachment for this session."); return { type: "input_text", text: `Attachment ${stored.name}:\n${stored.text}` }; }); } }, conversations.get(conversationKey) ?? { input: [] }, input, controller.signal)) emit(event);
      } catch (error) { transcript.status = controller.signal.aborted ? "Stopped" : "Failed"; transcript.error = error.message; if (!response.destroyed) emit({ type: "error", message: error.message }); }
      finally { active.delete(conversationKey); for (const [id, value] of replies) if (value.session === session && value.request === input.id) replies.delete(id); response.end(); }
    } catch (error) { if (!response.headersSent) send(400, { error: error.message }); else response.end(); }
  });
  server.on("close", () => { for (const controller of active.values()) controller.abort(); for (const client of clients) client.end(); void watcher?.dispose(); db.close(); });
  server.listen(port, "127.0.0.1"); await once(server, "listening"); return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { const server = await serveAgent(5198, { dev: process.argv.includes("--watch"), document: process.env.ONODOCS_SAMPLE_DOCUMENT }); console.log(`OnoDocs document agent: http://127.0.0.1:${server.address().port}`); }
