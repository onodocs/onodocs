import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export async function serveEditor(port = 5190) {
  const root = import.meta.dirname;
  const bundle = await build({ entryPoints: [`${root}/main.js`], bundle: true, format: "esm", platform: "browser", write: false });
  const files = new Map([["/", ["index.html", "text/html"]], ["/style.css", ["style.css", "text/css"]], ["/brand-mark.svg", ["brand-mark.svg", "image/svg+xml"]], ["/sample.docx", ["sample.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]]]);
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (pathname === "/main.js") { response.writeHead(200, { "Content-Type": "text/javascript" }); response.end(bundle.outputFiles[0].contents); return; }
      const file = files.get(pathname);
      if (!file) { response.writeHead(404); response.end(); return; }
      const bytes = await readFile(`${root}/${file[0]}`);
      response.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" }); response.end(bytes);
    } catch { response.writeHead(500); response.end("Unable to load editor sample."); }
  });
  await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await serveEditor(Number(process.env.PORT ?? 5190));
  console.log(`OnoDocs editor: http://127.0.0.1:${server.address().port}`);
}
