import { createEditor } from "@onodocs/editor";
import { demoLicense } from "../sdk/license";
import report from "./sample.docx";
import brief from "../view-document/sample.docx";
import plan from "./plan.docx";

if (new URLSearchParams(location.search).has("embedded")) document.querySelector(".demo-header").hidden = true;

const lifetime = new AbortController();
const container = document.querySelector("#app");
const status = document.querySelector("#status");
const picker = document.querySelector("#sample");
const samples = { report: { bytes: report, name: "Project report.docx" }, brief: { bytes: brief, name: "Brand launch brief.docx" }, plan: { bytes: plan, name: "Meeting notes.docx" } };
let sampleDocument;
let selectedSample = "";
let dirty = false;
export const editor = createEditor({ container, document: { licenseKey: await demoLicense(lifetime.signal), signal: lifetime.signal }, allowedModes: ["view", "edit"], onChange: () => { dirty = true; window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_edit" })); }, onError: error => { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); status.textContent = error.message; } });

async function openSample(name) {
  const sample = samples[name];
  if (!sample) return;
  if (editor.document && (dirty || editor.document !== sampleDocument) && !window.confirm("Opening a sample replaces the current document. Download your work from File first if you want to keep it. Continue?")) {
    picker.value = selectedSample;
    return;
  }
  picker.disabled = true;
  status.textContent = "Opening sample…";
  try {
    await editor.open(sample.bytes, sample.name);
    window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
    sampleDocument = editor.document;
    selectedSample = name;
    dirty = false;
    picker.value = selectedSample;
    status.textContent = "";
  } catch (error) {
    window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" }));
    status.textContent = error instanceof Error ? error.message : "The sample could not be opened. Use File to open another document.";
    picker.value = selectedSample;
  } finally { picker.disabled = false; }
}

picker.addEventListener("change", () => { void openSample(picker.value); });
window.addEventListener("pagehide", event => { if (!event.persisted) { lifetime.abort(); editor.dispose(); } });
void openSample("report");
