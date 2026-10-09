import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { sdk: { type: "string" }, canvas: { type: "string" } } });
const root = import.meta.dirname, npm = process.env.npm_execpath;
if (!npm) throw new Error("Run npm run build from packages/editor.");
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const dependencies = { ...manifest.dependencies }, fingerprint = createHash("sha256").update(root).update(JSON.stringify(manifest));
for (const name of ["sdk", "canvas"]) if (values[name]) {
  if (values[name].endsWith(".tgz")) { const archive = resolve(values[name]); dependencies[`@onodocs/${name}`] = `file:${archive.replaceAll("\\", "/")}`; fingerprint.update(await readFile(archive)); }
  else dependencies[`@onodocs/${name}`] = values[name];
}
const workspace = join(homedir(), ".tmp", "onodocs", "editor-source", fingerprint.update(JSON.stringify(dependencies)).digest("hex").slice(0, 12));
const output = join(workspace, "package");
await mkdir(output, { recursive: true });
for (const directory of ["src", "dist"]) await rm(join(output, directory), { recursive: true, force: true });
await cp(join(root, "src"), join(output, "src"), { recursive: true });
for (const file of ["tsconfig.json", "LICENSE", "THIRD-PARTY-NOTICES"]) await copyFile(join(root, file), join(output, file));
const installed = { ...manifest, scripts: {}, dependencies };
await writeFile(join(output, "package.json"), JSON.stringify(installed, null, 2) + "\n");
execFileSync(process.execPath, [npm, "install", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: output, stdio: "inherit", windowsHide: true });
execFileSync(process.execPath, [join(output, "node_modules/typescript/bin/tsc"), "--project", join(output, "tsconfig.json")], { cwd: output, stdio: "inherit", windowsHide: true });
await writeFile(join(output, "package.json"), JSON.stringify({ ...manifest, scripts: {}, devDependencies: {} }, null, 2) + "\n");
const [packed] = JSON.parse(execFileSync(process.execPath, [npm, "pack", "--ignore-scripts", "--pack-destination", workspace, "--json"], { cwd: output, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", windowsHide: true }));
console.log(`Built editor: ${output}`);
console.log(`Install in your application: npm install "${join(workspace, packed.filename)}"`);
