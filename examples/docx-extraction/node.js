import { readFile } from "node:fs/promises";
import { openDocument } from "@onodocs/sdk";
import { extractContent } from "./extract.js";
const bytes = await readFile(process.argv[2] ?? new URL("../view-document/sample.docx", import.meta.url));
const doc = await openDocument(bytes);
console.log(JSON.stringify(extractContent(doc), null, 2));
console.error("Sample source: https://github.com/onodocs/onodocs/tree/main/examples/docx-extraction");
