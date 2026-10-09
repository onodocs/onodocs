import { demoLicense } from "../sdk/license";
import { createFormDesigner, openForm } from "@onodocs/editor/forms";
import { zipSync, strToU8 } from "fflate";
import { recoveryStore } from "../application/recovery.js";

const container = document.querySelector("main"), status = document.querySelector("#status"), outputs = document.querySelector("#outputs"), dialog = document.querySelector("#draft-choice");
let bytes, definition, designer, filling, recovery, saved, completed, busy = false;
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
function report(message) { status.textContent = message; }
function invalidate() { if (completed) report("Answers changed. Complete the form again to download the updated request."); completed = undefined; outputs.hidden = true; }
function download(data, name, type) { const url = URL.createObjectURL(new Blob([data], { type })), link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
async function run(handler) {
  if (busy) return;
  busy = true; document.body.setAttribute("aria-busy", "true"); container.inert = true; document.querySelector("#actions").inert = true;
  try { await handler(); } catch (error) { report(error.message); }
  finally { busy = false; document.body.setAttribute("aria-busy", "false"); container.inert = false; document.querySelector("#actions").inert = false; }
}
function choose(title, message, confirm) {
  dialog.returnValue = "cancel";
  dialog.querySelector("h2").textContent = title; dialog.querySelector("p").textContent = message; dialog.querySelector('[value="yes"]').textContent = confirm;
  return new Promise(resolve => { dialog.addEventListener("close", () => resolve(dialog.returnValue === "yes"), { once: true }); dialog.showModal(); });
}
async function stores() {
  const rules = new TextEncoder().encode(JSON.stringify(definition)), source = new Uint8Array(bytes.length + rules.length);
  source.set(bytes); source.set(rules, bytes.length);
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", source))].map(value => value.toString(16).padStart(2, "0")).join("");
  recovery = recoveryStore(`onodocs-equipment:${hash}:recovery`); saved = recoveryStore(`onodocs-equipment:${hash}:saved`);
}
async function fill(input) {
  const next = await openForm({ container, input, definition, document: { licenseKey }, recovery, persist: value => saved.write(value), signal: lifetime.signal, onEvent(event) {
    if (event.type === "change") invalidate();
    if (event.type === "error") report("Your draft could not be saved in this browser. Keep this page open, allow browser storage and retry Save draft.");
  }, onComplete(result) { completed = result; outputs.hidden = false; report("Request complete. Download the Word document and structured answers below. Nothing has been submitted to a purchasing team."); outputs.scrollIntoView({ block: "nearest" }); } });
  designer?.dispose(); designer = undefined; filling?.dispose(); filling = next; invalidate(); document.querySelector("#project").hidden = false;
  document.querySelector("#draft-actions").hidden = false;
  report("Fill the answer fields beside the document. Valid changes are saved in this browser after you leave a field.");
}
async function preview() {
  if (filling) return;
  if (designer) { ({ bytes, definition } = await designer.save()); await stores(); }
  await fill(bytes);
  let draft;
  try { draft = await recovery.read() ?? await saved.read(); }
  catch { report("Browser draft storage is unavailable. Allow browser storage and retry Save draft before leaving this page."); return; }
  if (draft && await choose("Resume your saved request?", "A draft for this template and its field rules is stored in this browser. Cancel keeps the blank form; the stored draft remains until your next save.", "Restore draft")) { await fill(draft); report("Saved draft restored. Review the answers before completing your request."); }
}
async function design() {
  if (filling) { await filling.save(); bytes = await filling.application.editor.save(); filling.dispose(); filling = undefined; }
  designer?.dispose(); invalidate(); document.querySelector("#draft-actions").hidden = true;
  designer = createFormDesigner({ container, document: { licenseKey }, onPreview: () => run(preview), onExportProject: () => run(exportProject), onError(error) { report(error.message); } });
  document.querySelector("#project").hidden = true;
  await designer.open(bytes, definition); report("Authoring mode. Define permitted fields, then choose Fill form to try the result.");
}
async function initialize() {
  const [documentResponse, rulesResponse] = await Promise.all([fetch("./sample.docx", { signal: lifetime.signal }), fetch("./definition.json", { signal: lifetime.signal })]);
  if (!documentResponse.ok || !rulesResponse.ok) throw new Error("The request template could not be loaded. Choose Retry loading.");
  bytes = new Uint8Array(await documentResponse.arrayBuffer()); definition = await rulesResponse.json(); await stores(); await preview();
  document.querySelector("#retry").hidden = true; document.querySelector("#actions").hidden = false;
}
function action(selector, handler) { document.querySelector(selector).addEventListener("click", () => void run(handler)); }
action("#retry", initialize);
action("#design", design); action("#preview", preview);
action("#save", async () => { await filling.save(); report("Draft saved in this browser. You can close this page and restore it later."); });
action("#draft", async () => { await filling.save(); const data = await filling.application.editor.save(); download(data, "equipment-request-draft.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); report("Word draft downloaded. Use Open Word draft to continue on this page."); });
action("#new", async () => { if (!await choose("Start a new request?", "This removes the draft for this form from this browser and clears the current answers. Download a Word draft first if you need to keep them.", "Start new request")) return; filling?.dispose(); filling = undefined; await recovery.remove(); await saved.remove(); await fill(bytes); });
action("#word", async () => download(completed.bytes, "completed.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
action("#pdf", async () => download(await filling.application.editor.pdf(), "equipment-request.pdf", "application/pdf"));
action("#answers", async () => download(JSON.stringify(completed.answers, null, 2), "answers.json", "application/json"));
action("#template", async () => { if (designer) ({ bytes, definition } = await designer.save()); download(bytes, "template.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); });
async function exportProject() {
  const source = designer ? await designer.save() : { bytes, definition };
  const files = {};
  for (const name of ["index.html", "style.css", "main.js", "serve.mjs", "brand-mark.svg", "recovery.js", "LICENSE", "THIRD-PARTY-NOTICES"]) {
    const response = await fetch(`./source/${name}.txt`);
    if (!response.ok) throw new Error("Project source could not be loaded. Please retry the export.");
    files[name === "recovery.js" ? "examples/application/recovery.js" : `examples/document-forms/${name}`] = new Uint8Array(await response.arrayBuffer());
  }
  files["LICENSE"] = files["examples/document-forms/LICENSE"];
  files["THIRD-PARTY-NOTICES"] = files["examples/document-forms/THIRD-PARTY-NOTICES"];
  files["examples/document-forms/sample.docx"] = source.bytes;
  files["examples/document-forms/definition.json"] = strToU8(JSON.stringify(source.definition, null, 2));
  files["examples/sdk/license.ts"] = strToU8('export async function demoLicense(signal: AbortSignal): Promise<string> { signal.throwIfAborted(); return ""; }\n');
  files["package.json"] = strToU8(JSON.stringify({ name: "onodocs-form-project", private: true, type: "module", scripts: { start: "node examples/document-forms/serve.mjs" }, dependencies: { "@onodocs/sdk": "0.5.0", "@onodocs/canvas": "0.5.0", "@onodocs/editor": "0.5.0", esbuild: "^0.25.0", fflate: "^0.8.2" } }, null, 2));
  files["START.txt"] = strToU8("Requires Node.js 22 or later.\nRun npm install, then npm start.\nOpen http://127.0.0.1:5192.\nThe Word template and matching form rules are in examples/document-forms.\nSource: https://github.com/onodocs/onodocs/tree/main/examples/document-forms\n");
  download(zipSync(files), "form-project.zip", "application/zip"); report("Form project downloaded. Extract it and follow START.txt to run your form locally.");
}
action("#project", exportProject);
action("#rules", async () => { if (designer) ({ bytes, definition } = await designer.save()); download(JSON.stringify(definition, null, 2), "form.json", "application/json"); });
document.querySelector("#resume").addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; void run(async () => { if (!await choose("Open a Word draft?", "This replaces the visible answers. Use a draft downloaded from this form. The same field rules will apply.", "Open draft")) return; await fill(new Uint8Array(await file.arrayBuffer())); await filling.save(); report("Word draft opened and saved in this browser. Review the answers before completing."); }).finally(() => { event.target.value = ""; }); });
document.querySelector("#document").addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; void run(async () => { filling?.dispose(); filling = undefined; bytes = new Uint8Array(await file.arrayBuffer()); definition = { title: file.name.replace(/\.docx$/i, ""), fields: [] }; await design(); }); });
document.querySelector("#definition").addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; void run(async () => { const next = JSON.parse(await file.text()); if (designer) ({ bytes } = await designer.save()); if (filling) { await filling.save(); bytes = await filling.application.editor.save(); filling.dispose(); filling = undefined; } definition = next; await design(); }); });
container.addEventListener("input", invalidate);
window.addEventListener("pagehide", () => { lifetime.abort(); designer?.dispose(); filling?.dispose(); }, { once: true });
await run(initialize);
export { designer, filling };
