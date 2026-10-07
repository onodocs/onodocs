import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const destination = resolve(process.argv[2] ?? "public");
await mkdir(destination, { recursive: true });
await copyFile(new URL("../view-document/sample.docx", import.meta.url), resolve(destination, "sample.docx"));
await copyFile(new URL("./style.css", import.meta.url), resolve(destination, "style.css"));
