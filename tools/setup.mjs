import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const { asset, tag } = JSON.parse(readFileSync(new URL("../sdk-release.json", import.meta.url), "utf8"));
mkdirSync("vendor", { recursive: true });
if (!existsSync(`vendor/${asset}`)) execFileSync("gh", ["release", "download", tag, "--repo", "onodocs/onodocs", "--pattern", asset, "--dir", "vendor"], { stdio: "inherit" });
execFileSync(process.execPath, [process.env.npm_execpath, "install"], { stdio: "inherit" });
