import { build, context } from "esbuild";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const outdir = join(homedir(), ".tmp/onodocs-samples/dist");
await mkdir(outdir, { recursive: true });
await copyFile("examples/editor/brand-mark.svg", join(outdir, "brand-mark.svg"));
await copyFile("examples/demo.css", join(outdir, "demo.css"));
await mkdir(join(outdir, "samples"), { recursive: true });
await copyFile("examples/demo.css", join(outdir, "samples/demo.css"));
const workflowEntries = {};
for (const name of ["editor", "proposal", "template-editor", "document-forms", "agreement-review", "ai-report"]) {
  const directory = join(outdir, "samples", name);
  await mkdir(directory, { recursive: true });
  const assets = ["index.html", "style.css", ...(["ai-report", "template-editor"].includes(name) ? [] : ["sample.docx"]), ...(["document-forms", "agreement-review", "ai-report"].includes(name) ? ["brand-mark.svg"] : []), ...(name === "document-forms" ? ["definition.json"] : [])];
  for (const file of assets) await copyFile(`examples/${name}/${file}`, join(directory, file));
  const entry = name === "ai-report" ? "start" : "main";
  workflowEntries[`samples/${name}/${entry}`] = `examples/${name}/${entry}.js`;
}
const formSource = join(outdir, "samples/document-forms/source");
await mkdir(formSource, { recursive: true });
for (const name of ["index.html", "style.css", "main.js", "serve.mjs", "brand-mark.svg", "LICENSE", "THIRD-PARTY-NOTICES"]) await copyFile(`examples/document-forms/${name}`, join(formSource, `${name}.txt`));
await copyFile("examples/application/recovery.js", join(formSource, "recovery.js.txt"));
await copyFile("examples/demo.css", join(formSource, "demo.css.txt"));
for (const file of ["index.html", "style.css", "loading.css", "workflows.html", "workflows.css"]) await copyFile(`examples/sdk/${file}`, join(outdir, file));
await copyFile("index.html", join(outdir, "samples.html"));
await mkdir(join(outdir, "examples"), { recursive: true });
await copyFile("index.html", join(outdir, "examples/index.html"));
await cp("guides", join(outdir, "guides"), { recursive: true });
await cp("guides", join(outdir, "developers"), { recursive: true });
for (const directory of ["docx-viewer", "javascript-viewer"]) {
  await mkdir(join(outdir, directory), { recursive: true });
  for (const file of ["index.html", "style.css"]) await copyFile(`examples/docx-viewer/${file}`, join(outdir, directory, file));
}
await mkdir(join(outdir, "react-docx-viewer"), { recursive: true });
for (const file of ["index.html", "style.css"]) await copyFile(`examples/react-docx-viewer/${file}`, join(outdir, "react-docx-viewer", file));
await copyFile("examples/view-document/sample.docx", join(outdir, "react-docx-viewer/sample.docx"));
for (const directory of ["docx-extraction", "javascript-extraction", "samples/docx-extraction"]) {
  await mkdir(join(outdir, directory), { recursive: true });
  for (const file of ["index.html", "style.css"]) await copyFile(`examples/docx-extraction/${file}`, join(outdir, directory, file));
  await copyFile("examples/view-document/sample.docx", join(outdir, directory, "sample.docx"));
}
let html = await readFile(join(outdir, "workflows.html"), "utf8");
const aiSource = (await readFile("examples/sdk/draft-email.mjs", "utf8")).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
html = html.replace('<code id="ai-code" data-source="examples/sdk/draft-email.mjs"></code>', `<code id="ai-code">${aiSource}</code>`);
for (const [name, formatter] of [["ascii", "toAscii"], ["ast", "tree"]]) {
  const source = `import { readFile } from "node:fs/promises";\nimport { openDocument } from "@onodocs/sdk";\n\n${await readFile(`examples/sdk/${name}.ts`, "utf8")}\nconst doc = await openDocument(await readFile(process.argv[2]));\nconsole.log(${formatter}(doc.query.one()));\n`;
  const escaped = source.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  html = html.replace(`<code id="${name}-code" data-source="examples/sdk/${name}.ts"></code>`, `<code id="${name}-code">${escaped}</code>`);
}
await writeFile(join(outdir, "workflows.html"), html);
for (const [directory, files] of [["sdk", ["index.html", "style.css", "loading.css"]], ["workflows", ["workflows.html", "workflows.css", "loading.css"]]]) {
  await mkdir(join(outdir, "samples", directory), { recursive: true });
  for (const file of files) await copyFile(join(outdir, file), join(outdir, "samples", directory, file));
}
await copyFile("examples/sdk/template.docx", join(outdir, "samples/sdk/template.docx"));
await copyFile("examples/view-document/sample.docx", join(outdir, "samples/sdk/sample.docx"));
workflowEntries["samples/sdk/document"] = "examples/sdk/document.ts";
workflowEntries["samples/workflows/workflows"] = "examples/sdk/workflows.ts";
const options = { entryPoints: { ...workflowEntries, document: "examples/sdk/document.ts", workflows: "examples/sdk/workflows.ts", "docx-viewer/main": "examples/docx-viewer/main.ts", "javascript-viewer/main": "examples/docx-viewer/main.js", "react-docx-viewer/main": "examples/react-docx-viewer/main.tsx", "docx-extraction/main": "examples/docx-extraction/main.ts", "samples/docx-extraction/main": "examples/docx-extraction/main.ts", "javascript-extraction/main": "examples/docx-extraction/main.js" }, bundle: true, format: "esm", platform: "browser", target: "es2022", loader: { ".docx": "binary", ".png": "binary" }, outdir };
if (process.argv.includes("--serve")) {
  const session = await context(options);
  await session.watch();
  await session.serve({ host: "127.0.0.1", port: 5174, servedir: outdir });
  console.log("Samples: http://127.0.0.1:5174/samples.html");
} else {
  await build(options);
  console.log(`Built samples: ${outdir}`);
}
