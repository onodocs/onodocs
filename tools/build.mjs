import { build, context } from "esbuild";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const outdir = join(homedir(), ".tmp/onodocs-samples/dist");
await mkdir(outdir, { recursive: true });
for (const file of ["index.html", "style.css", "workflows.html", "workflows.css"]) await copyFile(`examples/sdk/${file}`, join(outdir, file));
await copyFile("index.html", join(outdir, "samples.html"));
await cp("guides", join(outdir, "guides"), { recursive: true });
for (const directory of ["docx-viewer", "javascript-viewer"]) {
  await mkdir(join(outdir, directory), { recursive: true });
  for (const file of ["index.html", "style.css"]) await copyFile(`examples/docx-viewer/${file}`, join(outdir, directory, file));
}
await mkdir(join(outdir, "react-docx-viewer"), { recursive: true });
for (const file of ["index.html", "style.css"]) await copyFile(`examples/react-docx-viewer/${file}`, join(outdir, "react-docx-viewer", file));
await copyFile("examples/view-document/sample.docx", join(outdir, "react-docx-viewer/sample.docx"));
let html = await readFile(join(outdir, "workflows.html"), "utf8");
for (const [name, formatter] of [["ascii", "toAscii"], ["ast", "tree"]]) {
  const source = (await readFile(`examples/sdk/${name}.ts`, "utf8")).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  html = html.replace(`<code id="${name}-code" data-source="examples/sdk/${name}.ts"></code>`, `<code id="${name}-code">${source}\n\nconst output = ${formatter}(doc.query.one());</code>`);
}
await writeFile(join(outdir, "workflows.html"), html);
const options = { entryPoints: { document: "examples/sdk/document.ts", workflows: "examples/sdk/workflows.ts", "docx-viewer/main": "examples/docx-viewer/main.ts", "javascript-viewer/main": "examples/docx-viewer/main.js", "react-docx-viewer/main": "examples/react-docx-viewer/main.tsx" }, bundle: true, format: "esm", platform: "browser", target: "es2022", loader: { ".docx": "binary" }, outdir };
if (process.argv.includes("--serve")) {
  const session = await context(options);
  await session.watch();
  await session.serve({ host: "127.0.0.1", port: 5174, servedir: outdir });
  console.log("Samples: http://127.0.0.1:5174/samples.html");
} else {
  await build(options);
  console.log(`Built samples: ${outdir}`);
}
