import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { createCollaborationService, CollaborationAccessError } from "@onodocs/sdk/collaboration";

export async function serveCollaboration({ port = 5195, database = join(homedir(), ".tmp/onodocs/collaboration-demo.sqlite") } = {}) {
  await mkdir(dirname(database), { recursive: true });
  const db = new DatabaseSync(database);
  db.exec("CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, token TEXT NOT NULL, bytes BLOB NOT NULL, metadata TEXT NOT NULL)");
  db.exec("CREATE TABLE IF NOT EXISTS receipts (document_id TEXT NOT NULL, user TEXT NOT NULL, id TEXT NOT NULL, digest TEXT NOT NULL, PRIMARY KEY (document_id, user, id))");
  const initial = await readFile(new URL("sample.docx", import.meta.url));
  db.prepare("INSERT OR IGNORE INTO documents VALUES (?, ?, ?, ?)").run("brief", crypto.randomUUID(), initial, JSON.stringify({ checkpoint: crypto.randomUUID() }));
  const users = new Map([["alex", { id: "alex", name: "Alex Morgan", role: "edit" }], ["sam", { id: "sam", name: "Sam Rivera", role: "edit" }], ["jo", { id: "jo", name: "Jo Chen", role: "review" }]]);
  const storage = {
    async load(id) { const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id); if (!row) throw new Error("Document not found"); return { token: row.token, bytes: new Uint8Array(row.bytes), ...JSON.parse(row.metadata) }; },
    async receipt(id, user, mutationId) { return db.prepare("SELECT digest FROM receipts WHERE document_id = ? AND user = ? AND id = ?").get(id, user, mutationId)?.digest; },
    async compareExchange(id, token, next, receipt) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const changed = db.prepare("UPDATE documents SET token = ?, bytes = ?, metadata = ? WHERE id = ? AND token = ?").run(next.token, next.bytes, JSON.stringify({ checkpoint: next.checkpoint }), id, token).changes === 1;
        if (changed) db.prepare("INSERT INTO receipts VALUES (?, ?, ?, ?)").run(id, receipt.user, receipt.id, receipt.digest);
        db.exec("COMMIT"); return changed;
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  };
  let service = createCollaborationService({ storage, async authorize(id, user) { return id === "brief" ? users.get(user) : undefined; } });
  const bundle = await build({ entryPoints: [fileURLToPath(new URL("main.js", import.meta.url))], bundle: true, format: "esm", platform: "browser", write: false });
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store"); response.setHeader("X-Content-Type-Options", "nosniff");
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/collaboration" && request.method === "POST") {
        if (request.headers.origin !== `http://${request.headers.host}` || !request.headers["content-type"]?.startsWith("application/json")) { response.writeHead(403).end(); return; }
        const user = request.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith("demo-user="))?.slice("demo-user=".length);
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const reply = await service.exchange("brief", JSON.parse(Buffer.concat(chunks).toString("utf8")), user);
        response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(reply)); return;
      }
      if (url.pathname === "/main.js") { response.writeHead(200, { "Content-Type": "text/javascript" }).end(bundle.outputFiles[0].contents); return; }
      if (url.pathname === "/") {
        const user = url.searchParams.get("user");
        if (users.has(user)) response.setHeader("Set-Cookie", `demo-user=${user}; HttpOnly; SameSite=Strict; Path=/`);
        response.writeHead(200, { "Content-Type": "text/html" }).end(await readFile(new URL("index.html", import.meta.url))); return;
      }
      response.writeHead(404).end();
    } catch (error) { response.writeHead(error instanceof CollaborationAccessError ? 403 : error instanceof TypeError || error instanceof SyntaxError ? 400 : 500).end("Unable to synchronize document."); }
  });
  server.once("close", () => db.close());
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  return { server, users, storage, restart() { service = createCollaborationService({ storage, async authorize(id, user) { return users.get(user); } }); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server } = await serveCollaboration({ port: Number(process.env.PORT ?? 5195) });
  console.log(`Open http://127.0.0.1:${server.address().port}/?user=alex and /?user=sam in separate browser profiles. Demo identities are not production authentication.`);
}
