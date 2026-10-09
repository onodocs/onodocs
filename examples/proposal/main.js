import { demoLicense } from "../sdk/license";
import { openTemplate } from "@onodocs/sdk/browser";
import { createEditor, createTemplateEditor } from "@onodocs/editor";
import templateBytes from "./sample.docx";
import logoBytes from "./logo.png";
import { sample, proposalData } from "./data.js";

const app = document.querySelector("#app");
app.innerHTML = `<nav class="steps" aria-label="Proposal workflow"><button type="button" data-step="design"><span>1</span> Design template</button><button type="button" data-step="data"><span>2</span> Enter data</button><button type="button" data-step="document" disabled><span>3</span> Edit generated document</button></nav>
<p id="status" role="status" aria-live="polite">Preparing the proposal template…</p>
<section id="design-step" class="step" aria-label="Design template" hidden><div class="step-heading"><div><h1>Design a reusable proposal</h1><p>Change the wording, formatting or data bindings. Each new proposal uses this template.</p></div><button type="button" class="primary" data-next="data">Use this template</button></div><div id="designer"></div></section>
<section id="data-step" class="step" aria-label="Enter data" hidden><div class="step-heading"><div><h1>Prepare a client proposal</h1><p>Prepare the scope and fees. Your branded proposal includes an optional support plan and contacts for the studio and delivery leads.</p></div></div><form id="details"><div class="data-columns"><fieldset><legend>Business details</legend><label>Client company<input name="client" required></label><div class="pair"><label>Contact<input name="contact" required></label><label>Proposal date<input name="date" type="date" required></label></div><label>Project title<input name="project" required></label><label>Overview<textarea name="summary" rows="4" required></textarea></label><label>Delivery plan<input name="timeline" required></label><label class="check"><input name="includeSupport" type="checkbox">Include two post-launch review calls at no extra charge</label></fieldset><fieldset><legend>Scope & investment</legend><p class="hint">Fees in USD. Quantity is the number of studio days.</p><div id="items"></div><p id="empty-items" class="hint" hidden>No services yet. Add a line item or generate a proposal with a zero total.</p><button type="button" class="quiet" id="add">Add line item</button><div class="total"><span>Total investment</span><output id="total"></output></div></fieldset></div><div class="data-actions"><p id="generation-note">Generate a document, then refine its wording and download it from the editor.</p><button class="primary" type="submit">Generate proposal</button></div></form><p class="privacy">Your data and documents stay in this browser. Refreshing starts a new proposal.</p><details class="developer"><summary>Use this in your application</summary><p>The same Word template is used in all three steps. Field bindings are stored in the document; the application calculates service amounts and the total from your data.</p><button type="button" class="text-button" id="json">Download business data</button><p>Use Download template in the designer’s Template tab to save your reusable document.</p></details></section>
<section id="document-step" class="step" aria-label="Edit generated document" hidden><div class="step-heading"><div><h1>Your generated proposal</h1><p id="document-note">Edit this copy, then use File to download Word or PDF.</p></div></div><div id="document"></div></section>
<dialog id="regenerate" aria-labelledby="regenerate-title"><form method="dialog"><h2 id="regenerate-title">Generate a replacement proposal?</h2><p>This uses your current template and business data. Changes made in the generated document will be replaced.</p><p>Cancel and return to Edit generated document to download a copy first.</p><div class="dialog-actions"><button value="cancel">Cancel</button><button class="primary" value="generate">Replace proposal</button></div></form></dialog>`;

const form = app.querySelector("#details"), items = app.querySelector("#items"), status = app.querySelector("#status"), dialog = app.querySelector("#regenerate");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
const documentOptions = { licenseKey, defaultFont: "Arial", defaultFontSize: 11, signal: lifetime.signal };
const logo = { bytes: logoBytes, mediaType: "image/png" };
let busy = false, disposed = false, stale = false, generatedData;
export let editor, designer;

function report(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
  if (error) window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" }));
}

function row(item) {
  const entry = document.createElement("div");
  entry.className = "item";
  entry.innerHTML = `<label>Service<input name="description" required></label><div class="item-numbers"><label>Days<input name="quantity" type="number" min="0.5" step="0.5" required></label><label>Rate (USD)<input name="rate" type="number" min="0" step="0.01" required></label><button type="button" class="remove" aria-label="Remove line item">Remove</button></div>`;
  for (const key of ["description", "quantity", "rate"]) entry.querySelector(`[name="${key}"]`).value = item[key];
  entry.querySelector("button").addEventListener("click", () => {
    const next = entry.nextElementSibling ?? entry.previousElementSibling;
    entry.remove();
    changed();
    (next?.querySelector("input") ?? app.querySelector("#add")).focus();
  });
  items.append(entry);
}

function values() {
  return proposalData({ ...Object.fromEntries(["client", "contact", "project", "date", "summary", "timeline"].map(key => [key, form.elements.namedItem(key).value])), includeSupport: form.elements.namedItem("includeSupport").checked, studioLead: sample.studioLead, deliveryLead: sample.deliveryLead, items: [...items.children].map(entry => ({ description: entry.querySelector('[name="description"]').value, quantity: entry.querySelector('[name="quantity"]').valueAsNumber, rate: entry.querySelector('[name="rate"]').valueAsNumber })) });
}

function changed() {
  stale = true;
  const data = values();
  app.querySelector("#total").textContent = Number.isFinite(data.total) ? currency.format(data.total) : "Complete the line items";
  app.querySelector("#empty-items").hidden = items.children.length > 0;
  if (generatedData) {
    app.querySelector("#generation-note").textContent = "Generating again replaces the existing document. You can return to it and download your edits first.";
    app.querySelector("#document-note").textContent = "This copy uses the previous template and data. Generate again from Enter data to update it.";
  }
}

async function run(action) {
  if (busy || disposed) return;
  busy = true;
  app.setAttribute("aria-busy", "true");
  for (const element of app.querySelectorAll(".step, .steps")) element.inert = true;
  try { await action(); }
  catch (error) { if (!disposed) report(error instanceof Error ? error.message : String(error), true); }
  finally {
    busy = false;
    app.setAttribute("aria-busy", "false");
    for (const element of app.querySelectorAll(".step, .steps")) element.inert = element.hidden;
  }
}

async function showStep(step) {
  for (const button of app.querySelectorAll("[data-step]")) {
    if (button.dataset.step === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  for (const section of app.querySelectorAll(".step")) {
    section.hidden = section.id !== `${step}-step`;
    section.setAttribute("aria-hidden", String(section.hidden));
  }
  if (step === "design") {
    report("Template changes apply to future proposals. Your generated document stays separate.");
    if (!designer) {
      designer = createTemplateEditor({ container: app.querySelector("#designer"), sampleData: { ...proposalData(sample), logo }, document: documentOptions, allowedModes: ["view", "edit"], onChange() { if (!designer.previewing) { changed(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_edit" })); } }, onError(error) { report(error instanceof Error ? error.message : String(error), true); } });
      await designer.open(templateBytes, "northline-proposal-template.docx");
    }
  } else if (step === "data") {
    report(generatedData ? "Your existing proposal is kept until you choose Generate proposal and confirm replacement." : "Use the sample business details or enter your own, then generate your proposal.");
  } else {
    report(generatedData ? `${generatedData.client} · ${currency.format(generatedData.total)}${stale ? " · Previous data" : ""}` : "Opening your proposal…");
  }
  window.scrollTo({ top: 0 });
}

async function generate() {
  const data = values();
  report("Generating your proposal…");
  const source = designer ? await designer.saveTemplate() : templateBytes;
  const template = await openTemplate(source, documentOptions);
  let bytes;
  try { bytes = await template.generate({ ...data, logo }, { locale: "en-US", signal: lifetime.signal }); }
  finally { template.dispose(); }
  if (!editor) editor = createEditor({ container: app.querySelector("#document"), mode: "edit", allowedModes: ["view", "edit"], document: documentOptions, onChange() { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_edit" })); report("Document updated. These edits are included in Word and PDF downloads; your reusable template is unchanged."); }, onError(error) { report(error instanceof Error ? error.message : String(error), true); } });
  await showStep("document");
  await editor.open(bytes, "proposal.docx");
  window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_generate" }));
  generatedData = data;
  stale = false;
  app.querySelector('[data-step="document"]').disabled = false;
  app.querySelector("#generation-note").textContent = "Your generated proposal is kept while you work here. Generating again asks before replacing it.";
  app.querySelector("#document-note").textContent = "Edit this copy, then use File to download Word or PDF.";
  report(`${data.items.length} ${data.items.length === 1 ? "service" : "services"} · ${currency.format(data.total)} · Ready to edit or download.`);
}

form.addEventListener("input", changed);
form.addEventListener("submit", event => {
  event.preventDefault();
  if (generatedData) dialog.showModal();
  else void run(generate);
});
dialog.addEventListener("close", () => { if (dialog.returnValue === "generate") void run(generate); });
for (const button of app.querySelectorAll("[data-step], [data-next]")) button.addEventListener("click", () => void run(() => showStep(button.dataset.step ?? button.dataset.next)));
app.querySelector("#add").addEventListener("click", () => {
  row({ description: "Additional service", quantity: 1, rate: 900 });
  changed();
  items.lastElementChild.querySelector("input").focus();
});
app.querySelector("#json").addEventListener("click", () => {
  if (!form.reportValidity()) return;
  const data = values();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "proposal-data.json";
  link.click();
  window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" }));
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (const key of ["client", "contact", "project", "date", "summary", "timeline"]) form.elements.namedItem(key).value = sample[key];
form.elements.namedItem("includeSupport").checked = sample.includeSupport;
sample.items.forEach(row);
changed();
window.addEventListener("pagehide", event => {
  if (!event.persisted) {
    disposed = true;
    lifetime.abort();
    designer?.dispose();
    editor?.dispose();
  }
});
await run(() => showStep(app.dataset.start ?? "data"));

window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
