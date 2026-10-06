import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const { asset, tag } = JSON.parse(readFileSync(new URL("../sdk-release.json", import.meta.url), "utf8"));
mkdirSync("vendor", { recursive: true });
if (!existsSync(`vendor/${asset}`)) {
  const response = await fetch(`https://github.com/onodocs/onodocs/releases/download/${tag}/${asset}`);
  if (!response.ok) throw new Error(`SDK download failed (${response.status}). Download ${asset} from https://github.com/onodocs/onodocs/releases/tag/${tag} into vendor/ and retry.`);
  writeFileSync(`vendor/${asset}`, new Uint8Array(await response.arrayBuffer()));
}
execFileSync(process.execPath, [process.env.npm_execpath, "install"], { stdio: "inherit" });
