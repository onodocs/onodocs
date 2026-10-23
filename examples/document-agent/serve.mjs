import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { once } from "node:events";
import { build } from "esbuild";
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
  const bundle = await build({ entryPoints: [join(import.meta.dirname, "main.js")], bundle: true, format: "esm", platform: "browser", write: false });
  const active = new Map(), replies = new Map();
  const provider = options.provider ?? createOpenAIProvider({ apiKey: () => process.env.OPENAI_API_KEY ?? "", model: "gpt-6-luna" });
  const server = createServer(async (request, response) => {
    const origin = `http://127.0.0.1:${server.address().port}`, url = new URL(request.url, origin);
    let session = /(?:^|; )onodocs_agent=([a-f0-9-]+)/.exec(request.headers.cookie ?? "")?.[1];
    if (!session) { session = crypto.randomUUID(); response.setHeader("Set-Cookie", `onodocs_agent=${session}; HttpOnly; SameSite=Strict; Path=/`); }
    const send = (status, value) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(value)); };
    try {
      if (request.method === "GET") {
        if (url.pathname === "/main.js") { response.setHeader("Content-Type", "text/javascript"); response.end(bundle.outputFiles[0].contents); return; }
        const files = { "/": [join(import.meta.dirname, "index.html"), "text/html"], "/style.css": [join(import.meta.dirname, "style.css"), "text/css"], "/sample.docx": [join(import.meta.dirname, "./sample.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] };
        if (!files[url.pathname]) return send(404, { error: "Not found" });
        response.setHeader("Content-Type", files[url.pathname][1]); response.end(await readFile(files[url.pathname][0])); return;
      }
      if (request.headers.origin !== origin) return send(403, { error: "Use the same-origin example page." });
      db.prepare("DELETE FROM records WHERE id LIKE 'attachment:%' AND json_extract(value,'$.expires')<?").run(Date.now());
      if (request.method === "DELETE" && url.pathname.startsWith("/api/attachments/")) {
        db.prepare("DELETE FROM records WHERE id=?").run(`attachment:${session}:${url.pathname.slice('/api/attachments/'.length)}`);
        return send(200, {});
      }
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 128 * 1024) return send(413, { error: "Request too large" }); chunks.push(chunk); }
      const body = Buffer.concat(chunks);
      if (url.pathname === "/api/attachments") {
        const name = decodeURIComponent(request.headers["x-filename"] ?? ""); let text;
        if (name.endsWith(".txt")) text = new TextDecoder("utf-8", { fatal: true }).decode(body);
        else if (name.endsWith(".docx")) { const doc = await openDocument(body); try { text = extractDocument(doc).markdown; } finally { doc.dispose(); } }
        else return send(415, { error: "Only UTF-8 TXT and DOCX attachments are supported." });
        if (Buffer.byteLength(text) > 24000) return send(413, { error: "Attachment context is too large." });
        const id = crypto.randomUUID(); save(`attachment:${session}:${id}`, { name, text, expires: Date.now() + 86400000 }); return send(200, { id, name, mediaType: name.endsWith(".txt") ? "text/plain" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      }
      const input = JSON.parse(body.toString());
      if (url.pathname === "/api/agent/reply") {
        const pending = replies.get(input.id);
        if (!pending || pending.session !== session || pending.request !== input.request) return send(409, { error: "Unknown tool request" });
        replies.delete(input.id); pending.resolve(input.result); return send(200, {});
      }
      if (url.pathname !== "/api/agent") return send(404, { error: "Not found" });
      if (active.has(session) || read(`request:${session}:${input.id}`)) return send(409, { error: "This turn is active or has already been submitted." });
      if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/.test(input.id)) return send(400, { error: "Invalid request" });
      save(`request:${session}:${input.id}`, { started: Date.now() });
      const controller = new AbortController(); active.set(session, controller); response.on("close", () => controller.abort());
      response.writeHead(200, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" });
      const emit = event => response.write(JSON.stringify(event) + "\n");
      const bridge = { reference: agentApiReference, dispose() {}, async call(call, signal) {
        const id = crypto.randomUUID();
        const result = new Promise((resolve, reject) => { const abort = () => { replies.delete(id); reject(signal.reason); }; replies.set(id, { session, request: input.id, resolve(value) { signal.removeEventListener("abort", abort); resolve(value); } }); signal.addEventListener("abort", abort, { once: true }); });
        emit({ type: "api", id, call }); return result;
      } };
      try {
        for await (const event of runAgentTurn({ provider, bridge, ...createUsageMeter(store("usage"), session, request.socket.remoteAddress), async commit(value) { save(`conversation:${session}`, value); }, async attachments(message) { return message.attachments.map(file => { const stored = read(`attachment:${session}:${file.id}`)?.value; if (!stored) throw new Error("Unknown attachment for this session."); return { type: "input_text", text: `Attachment ${stored.name}:\n${stored.text}` }; }); } }, read(`conversation:${session}`)?.value ?? { input: [] }, input, controller.signal)) emit(event);
      } catch (error) { if (!response.destroyed) emit({ type: "error", message: error.message }); }
      finally { active.delete(session); for (const [id, value] of replies) if (value.session === session) replies.delete(id); response.end(); }
    } catch (error) { if (!response.headersSent) send(400, { error: error.message }); else response.end(); }
  });
  server.on("close", () => { for (const controller of active.values()) controller.abort(); db.close(); });
  server.listen(port, "127.0.0.1"); await once(server, "listening"); return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { const server = await serveAgent(); console.log(`OnoDocs document agent: http://127.0.0.1:${server.address().port}`); }
