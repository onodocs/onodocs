import { readFile } from "node:fs/promises";
import { openDocument } from "@onodocs/sdk";
import { toAscii } from "./sdk/ascii.ts";

const bytes = await readFile(process.argv[2] ?? new URL("./view-document/sample.docx", import.meta.url));
const doc = await openDocument(bytes);
console.log(toAscii(doc.content.one()));
console.log(JSON.stringify(doc.content.tables().map(table => table.textRows), null, 2));

console.log("Sample source: https://github.com/onodocs/onodocs/blob/main/examples/analyze.ts");
