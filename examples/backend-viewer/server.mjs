import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { createRenderer } from "@onodocs/sdk/server";

const directory = import.meta.dirname;
const html = await readFile(new URL("./index.html", import.meta.url));
const client = await build({ absWorkingDir: directory, entryPoints: ["client.js"], bundle: true, format: "esm", platform: "browser", write: false });
const renderer = await createRenderer({ channel: "chrome" });
try {
  const input = process.argv[2] ?? new URL("./sample.docx", import.meta.url);
  const doc = await renderer.openDocument(await readFile(input));
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET") {
        response.writeHead(405, { Allow: "GET" }).end();
        return;
      }
      const path = new URL(request.url, "http://localhost").pathname;
      let body, type;
      if (path === "/") {
        body = html;
        type = "text/html; charset=utf-8";
      } else if (path === "/client.js") {
        body = client.outputFiles[0].contents;
        type = "text/javascript; charset=utf-8";
      } else if (path === "/document") {
        body = await doc.manifest({ format: "json" });
        type = "application/json";
      } else {
        const match = /^\/document\/pages\/(\d+)$/.exec(path);
        const index = match ? Number(match[1]) : -1;
        if (!Number.isSafeInteger(index) || index < 0 || index >= doc.pages.length) {
          response.writeHead(404).end("Not found");
          return;
        }
        body = await doc.page(index, { format: "json" });
        type = "application/json";
      }
      response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      response.end(body);
    } catch (error) {
      console.error(error);
      response.writeHead(500).end("Unable to load the document.");
    }
  });
  const port = Number(process.env.PORT ?? 5175);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  console.log(`Backend viewer: http://127.0.0.1:${server.address().port}`);
  await new Promise(resolve => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
} finally {
  await renderer.dispose();
}
