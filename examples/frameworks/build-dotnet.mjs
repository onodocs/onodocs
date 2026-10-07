import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await import("./prepare.mjs");
await build({ entryPoints: ["viewer.ts"], bundle: true, format: "esm", platform: "browser", target: "es2022", outfile: "wwwroot/viewer.js" });
const result = spawnSync("dotnet", ["build", "--nologo"], { stdio: "inherit", windowsHide: true });
process.exitCode = result.status ?? 1;
