import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

const archive = "onodocs-sdk-0.1.9.tgz";
mkdirSync("vendor", { recursive: true });
if (!existsSync(`vendor/${archive}`)) execFileSync("gh", ["release", "download", "sdk-v0.1.9", "--repo", "onodocs/onodocs", "--pattern", archive, "--dir", "vendor"], { stdio: "inherit" });
execFileSync(process.execPath, [process.env.npm_execpath, "install"], { stdio: "inherit" });
