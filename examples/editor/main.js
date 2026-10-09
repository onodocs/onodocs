import { createEditor } from "@onodocs/sdk/editor";
import { demoLicense } from "../sdk/license";

const lifetime = new AbortController();
const container = document.querySelector("#app");
const status = document.createElement("p");
status.setAttribute("role", "status");
container.before(status);
export const editor = createEditor({ container, document: { licenseKey: await demoLicense(lifetime.signal), signal: lifetime.signal }, onError: error => { status.textContent = error.message; } });
try {
  const response = await fetch("./sample.docx", { signal: lifetime.signal });
  if (!response.ok) throw new Error("The sample could not be loaded. Use Open Word to choose your own document.");
  await editor.open(await response.arrayBuffer(), "sample.docx");
} catch (error) { status.textContent = error.message; }
window.addEventListener("pagehide", () => { lifetime.abort(); editor.dispose(); }, { once: true });
