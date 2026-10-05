import { readFile } from "node:fs/promises";
import { openDocument } from "@onodocs/sdk";
import { toAscii } from "./sdk/ascii.ts";

const bytes = await readFile(process.argv[2] ?? new URL("./view-document/sample.docx", import.meta.url));
const doc = await openDocument(bytes);
console.log(toAscii(doc.query.one()));
console.log(JSON.stringify(doc.query.tables().map(table => table.textRows), null, 2));
