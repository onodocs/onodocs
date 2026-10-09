import { createEditor } from "@onodocs/editor";

const status = document.querySelector("#status");
const lifetime = new AbortController();
const editor = createEditor({ container: document.querySelector("#app"), document: { signal: lifetime.signal }, onError: error => { status.textContent = error.message; } });
try {
  const response = await fetch("./sample.docx", { signal: lifetime.signal });
  if (!response.ok) throw new Error("Unable to load the sample. Use Open Word to choose a document.");
  await editor.open(await response.arrayBuffer(), "sample.docx");
} catch (error) { status.textContent = error.message; }
window.addEventListener("pagehide", event => { if (!event.persisted) { lifetime.abort(); editor.dispose(); } });
