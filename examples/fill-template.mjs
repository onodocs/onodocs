import { readFile, writeFile } from "node:fs/promises";
import { openDocument } from "@onodocs/sdk";

const [input, output, tag, text] = process.argv.slice(2);
if (!input || !output || !tag || text === undefined) throw new Error('Usage: node examples/fill-template.mjs input.docx output.docx customer "Willow Design"');

const document = await openDocument(await readFile(input), { licenseKey: process.env.ONODOCS_LICENSE_KEY });
try {
  await document.update({ target: document.query.contentControls().where({ tag }).one(), text });
  await writeFile(output, await document.save());
} finally {
  document.dispose();
}
