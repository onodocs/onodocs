import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

export async function serveForms(port = 5192, root = import.meta.dirname) {
  const bundle = await build({ entryPoints: [resolve(root, "main.js")], bundle: true, format: "esm", platform: "browser", write: false });
  const files = new Map([["/brand-mark.svg", ["brand-mark.svg", "image/svg+xml"]], ["/", ["index.html", "text/html"]], ["/style.css", ["style.css", "text/css"]], ["/sample.docx", [resolve(import.meta.dirname, "sample.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]], ["/definition.json", [resolve(import.meta.dirname, "definition.json"), "application/json"]]]);
  for (const name of ["index.html", "style.css", "main.js", "serve.mjs", "brand-mark.svg", "LICENSE", "THIRD-PARTY-NOTICES"]) files.set(`/source/${name}.txt`, [name, "text/plain"]);
  files.set("/source/recovery.js.txt", [resolve(import.meta.dirname, "../application/recovery.js"), "text/javascript"]);
  files.set("/demo.css", [resolve(root, "../demo.css"), "text/css"]);
  files.set("/source/demo.css.txt", [resolve(root, "../demo.css"), "text/plain"]);
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, "http://localhost").pathname;
      if (path === "/examples/") { response.writeHead(302, { Location: "https://onodocs.com/examples/" }).end(); return; }
      if (path === "/main.js") { response.writeHead(200, { "Content-Type": "text/javascript" }).end(bundle.outputFiles[0].contents); return; }
      const file = files.get(path); if (!file) { response.writeHead(404).end(); return; }
      response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" }).end(await readFile(resolve(root, file[0])));
    } catch { response.writeHead(500).end("Unable to load the forms sample."); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const server = await serveForms(Number(process.env.PORT ?? 5192)); console.log(`OnoDocs forms: http://127.0.0.1:${server.address().port}`); }
