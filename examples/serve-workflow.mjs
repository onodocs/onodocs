import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { build } from "esbuild";

const name = process.argv[2];
if (!["editor", "proposal", "document-forms", "agreement-review", "ai-report"].includes(name)) throw new Error("Choose editor, proposal, document-forms, agreement-review or ai-report.");
const root = resolve(import.meta.dirname, name);
const entry = name === "ai-report" ? "start.js" : "main.js";
const bundle = await build({ entryPoints: [resolve(root, entry)], bundle: true, format: "esm", platform: "browser", write: false });
const types = { ".html": "text/html", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname.startsWith("/developers/") || pathname === "/examples/") { response.writeHead(302, { Location: `https://onodocs.com${request.url}` }).end(); return; }
    if (pathname === `/${entry}`) { response.writeHead(200, { "Content-Type": "text/javascript" }).end(bundle.outputFiles[0].contents); return; }
    const path = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!path.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(await readFile(path));
  } catch { response.writeHead(404).end("Not found"); }
});
server.listen(Number(process.env.PORT ?? 5198), "127.0.0.1", () => console.log(`OnoDocs ${name}: http://127.0.0.1:${server.address().port}`));
