import { demoLicense } from "../sdk/license";
import { openTemplate } from "@onodocs/sdk/browser";
import { createEditor } from "@onodocs/editor";
import { sample, proposalData } from "./data.js";

const app = document.querySelector("#app");
app.innerHTML = `<div class="workspace"><aside><div class="intro"><p class="eyebrow">FROM BRIEF TO PROPOSAL</p><h1>Make it yours.</h1><p>Set the scope, preview your proposal, then refine the wording before sending.</p></div><form id="details"><fieldset><legend>01 <span>Business details</span></legend><label>Client company<input name="client" required></label><div class="pair"><label>Contact<input name="contact" required></label><label>Proposal date<input name="date" type="date" required></label></div><label>Project title<input name="project" required></label><label>Overview<textarea name="summary" rows="4" required></textarea></label><label>Delivery plan<input name="timeline" required></label></fieldset><fieldset><legend>02 <span>Scope & investment</span></legend><p class="hint">Fees in USD. Quantity is the number of studio days.</p><div id="items"></div><button type="button" class="quiet" id="add">+ Add line item</button><div class="total"><span>Total investment</span><output id="total"></output></div></fieldset><button class="primary generate" type="submit">Generate proposal</button></form><p class="privacy">Your data and documents stay in this browser. Refreshing this page starts a new proposal.</p><details class="developer"><summary>Use this in your application</summary><p>This example uses a reusable Word template and the public OnoDocs APIs.</p><div class="links"><a href="./sample.docx" download="northline-proposal-template.docx">Download Word template</a><button class="text-button" id="json">Download business data</button></div><p><a href="/developers/document-workflows/#generation">Integration guide</a> · <a href="https://github.com/onodocs/onodocs/tree/main/examples/proposal">Source on GitHub</a></p></details></aside><section class="document-panel" aria-label="Proposal workspace"><div class="document-heading"><div><p class="eyebrow">03 PREVIEW & REFINE</p><h2>Your proposal</h2></div><span class="badge">WORD TEMPLATE</span></div><div class="document-actions"><div class="mode-buttons"><button id="preview" aria-pressed="true">Preview</button><button id="edit" aria-pressed="false">Edit wording</button></div><div class="downloads"><button id="word" disabled>Download Word</button><button id="pdf" disabled>Download PDF</button></div></div><p id="status" role="status" aria-live="polite">Preparing your sample proposal…</p><div id="document"></div></section></div><dialog id="regenerate"><form method="dialog"><h2>Replace your edited proposal?</h2><p>Generating again uses the business details on the left and replaces wording changes made in the document.</p><div class="dialog-actions"><button value="cancel">Keep editing</button><button class="primary" value="generate">Generate new proposal</button></div></form></dialog>`;

const form = app.querySelector("#details"), items = app.querySelector("#items"), status = app.querySelector("#status"), dialog = app.querySelector("#regenerate");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
let template, edited = false, stale = false, busy = false, disposed = false, generatedData;
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
export const editor = createEditor({ container: app.querySelector("#document"), mode: "view", allowedModes: ["view", "edit"], toolbar: ["undo", "redo", "bold", "italic", "underline", "size", "alignment", "list", "find"], document: { licenseKey, defaultFont: "Arial", defaultFontSize: 11, signal: lifetime.signal }, onModeChange: showMode, onChange() { edited = true; report("Wording updated. Both downloads include your changes."); }, onError(error) { report(error.message, true); } });
function report(message, error = false) { status.textContent = message; status.dataset.error = String(error); }
function row(item) {
  const entry = document.createElement("div"); entry.className = "item";
  entry.innerHTML = `<label>Service<input name="description" required></label><div class="item-numbers"><label>Days<input name="quantity" type="number" min="0.5" step="0.5" required></label><label>Rate (USD)<input name="rate" type="number" min="0" step="0.01" required></label><button type="button" class="remove" aria-label="Remove line item">Remove</button></div>`;
  for (const key of ["description", "quantity", "rate"]) entry.querySelector(`[name="${key}"]`).value = item[key];
  entry.querySelector("button").addEventListener("click", () => { if (items.children.length === 1) return; entry.remove(); changed(); });
  items.append(entry);
}
function values() {
  return proposalData({ ...Object.fromEntries(["client", "contact", "project", "date", "summary", "timeline"].map(key => [key, form.elements.namedItem(key).value])), items: [...items.children].map(entry => ({ description: entry.querySelector('[name="description"]').value, quantity: entry.querySelector('[name="quantity"]').valueAsNumber, rate: entry.querySelector('[name="rate"]').valueAsNumber })) });
}
function changed() {
  stale = true;
  const data = values(); app.querySelector("#total").textContent = Number.isFinite(data.total) ? currency.format(data.total) : "Complete the line items";
  for (const button of items.querySelectorAll("button")) button.disabled = items.children.length === 1;
  if (editor.document) report("Business details changed. Generate again to use them. Current downloads keep the existing proposal.");
}
function download(bytes, type, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type })), link = document.createElement("a");
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function run(action) {
  if (busy || disposed) return;
  busy = true; app.setAttribute("aria-busy", "true"); form.inert = true;
  app.querySelector("#document").inert = true;
  for (const button of app.querySelectorAll(".document-actions button")) button.disabled = true;
  try { await action(); } catch (error) { if (!disposed) report(error.message, true); }
  finally { busy = false; app.setAttribute("aria-busy", "false"); form.inert = false; app.querySelector("#document").inert = false; for (const button of app.querySelectorAll(".document-actions button")) button.disabled = !editor.document; }
}
async function mode(value) {
  await editor.setMode(value);
  showMode(value);
}
function showMode(value) {
  app.querySelector("#preview").setAttribute("aria-pressed", String(value === "view"));
  app.querySelector("#edit").setAttribute("aria-pressed", String(value === "edit"));
}
async function generate() {
  const data = values();
  report("Generating your proposal…");
  if (!template) {
    const response = await fetch("./sample.docx", { signal: lifetime.signal });
    if (!response.ok) throw new Error("The proposal template could not be loaded. Choose Generate proposal to retry.");
    template = await openTemplate(await response.arrayBuffer(), { licenseKey, defaultFont: "Arial", defaultFontSize: 11, signal: lifetime.signal });
  }
  const bytes = await template.generate(data, { locale: "en-US", fields: "require-current", signal: lifetime.signal });
  await editor.open(bytes, "proposal.docx"); await mode("view");
  generatedData = data; edited = false; stale = false;
  report(`${data.items.length} services · ${currency.format(data.total)} · Ready to preview, edit or download.`);
}
form.addEventListener("input", changed);
form.addEventListener("submit", event => { event.preventDefault(); if (edited) dialog.showModal(); else void run(generate); });
dialog.addEventListener("close", () => { if (dialog.returnValue === "generate") void run(generate); });
app.querySelector("#add").addEventListener("click", () => { row({ description: "Additional service", quantity: 1, rate: 900 }); changed(); items.lastElementChild.querySelector("input").focus(); });
app.querySelector("#preview").addEventListener("click", () => void run(() => mode("view")));
app.querySelector("#edit").addEventListener("click", () => void run(async () => { await mode("edit"); report("Click the document to refine its wording. Use the toolbar to format your changes."); }));
for (const type of ["word", "pdf"]) app.querySelector(`#${type}`).addEventListener("click", () => void run(async () => {
  const bytes = type === "word" ? await editor.save() : await editor.pdf();
  const filename = generatedData.client.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "client";
  download(bytes, type === "word" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf", `${filename}-proposal.${type === "word" ? "docx" : "pdf"}`);
  report(stale ? "Downloaded the existing proposal. Generate again to include the changed business details." : "Downloaded with your latest wording changes.");
}));
app.querySelector("#json").addEventListener("click", () => download(JSON.stringify(values(), null, 2), "application/json", "proposal-data.json"));
for (const key of ["client", "contact", "project", "date", "summary", "timeline"]) form.elements.namedItem(key).value = sample[key];
sample.items.forEach(row); changed();
window.addEventListener("pagehide", event => { if (!event.persisted) { disposed = true; lifetime.abort(); template?.dispose(); editor.dispose(); } });
const initialPosition = { left: window.scrollX, top: window.scrollY };
await run(generate);
window.scrollTo(initialPosition);
