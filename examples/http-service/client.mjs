import { readFile, writeFile } from "node:fs/promises";

const base = process.env.ONODOCS_SERVICE_URL ?? "http://127.0.0.1:5191";
const headers = { Authorization: `Bearer ${process.env.ONODOCS_SERVICE_TOKEN}` };
async function request(path, method = "GET", body) {
  const response = await fetch(new URL(path, base), { method, headers, body });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
const document = await (await request("/documents", "POST", await readFile(process.argv[2]))).json();
try { await writeFile(process.argv[3], new Uint8Array(await (await request(`${document.url}/pdf`)).arrayBuffer())); }
finally { await request(document.url, "DELETE"); }
