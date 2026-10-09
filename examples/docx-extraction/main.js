import { openDocument } from "@onodocs/sdk";
import { openDocument as openPreview } from "@onodocs/sdk/browser";
import { createDocument } from "@onodocs/canvas";
import { extractContent } from "./extract.js";
import { demoLicense } from "../sdk/license";
import sample from "../view-document/sample.docx";
const status = document.querySelector("#status");
const file = document.querySelector("#file");
const format = document.querySelector("#format");
const output = document.querySelector("#output");
const cancel = document.querySelector("#cancel");
const copy = document.querySelector("#copy");
const download = document.querySelector("#download");
const pages = document.querySelector("#pages");
const documentName = document.querySelector("#document-name");
const advanced = document.querySelector("#advanced");
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
let controller;
let content;
let stopPreview = () => {
};
function showOutput() {
  output.value = !content ? "" : format.value === "text" ? content.text : JSON.stringify(format.value === "tables" ? content.tables : format.value === "deliveries" ? content.deliveryTables : { text: content.text, paragraphs: content.paragraphs, tables: content.tables }, null, 2);
}
async function open(source) {
  controller?.abort();
  stopPreview();
  pages.replaceChildren();
  controller = new AbortController();
  const { signal } = controller;
  let preview;
  let canvas;
  stopPreview = () => {
    canvas?.dispose();
    preview?.dispose();
  };
  documentName.textContent = source instanceof File ? source.name : "Brand launch brief";
  content = void 0;
  showOutput();
  copy.disabled = download.disabled = true;
  cancel.disabled = false;
  status.textContent = "Extracting document\u2026";
  try {
    const doc = await openDocument(source, { signal });
    try {
      if (signal.aborted) return;
      content = extractContent(doc);
    } finally {
      doc.dispose();
    }
    window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
    showOutput();
    copy.disabled = download.disabled = false;
    const summary = `${content.paragraphs.length} body ${content.paragraphs.length === 1 ? "paragraph" : "paragraphs"} \xB7 ${content.tables.length} ${content.tables.length === 1 ? "table" : "tables"}`;
    status.textContent = `Extracted ${summary}. Preparing the source preview\u2026`;
    try {
      preview = await openPreview(source, { signal, licenseKey });
      if (signal.aborted) {
        preview.dispose();
        return;
      }
      canvas = createDocument(preview, { container: pages, viewOptions: { zoom: "fit-width" } });
      await canvas.view.whenRendered();
      if (!signal.aborted) status.textContent = `Ready \xB7 ${summary}. Your file and extracted content stay in this browser.`;
    } catch (error) {
      canvas?.dispose();
      preview?.dispose();
      if (!signal.aborted) status.textContent = `Ready \xB7 ${summary}. Source preview unavailable. ${error instanceof Error ? error.message : "The extracted content is still available."}`;
    }
  } catch (error) {
    if (!signal.aborted) status.textContent = `Unable to extract document. ${error instanceof Error ? error.message : "Try another Word file."}`;
  } finally {
    if (!signal.aborted) cancel.disabled = true;
  }
}
file.addEventListener("change", () => {
  const selected = file.files?.[0];
  file.value = "";
  if (selected) void open(selected);
});
document.querySelector("#sample").addEventListener("click", () => {
  void open(sample);
});
format.addEventListener("change", showOutput);
advanced.addEventListener("toggle", () => {
  format.querySelector('[value="deliveries"]').hidden = !advanced.open;
  if (!advanced.open && format.value === "deliveries") {
    format.value = "tables";
    showOutput();
  }
});
document.querySelector("#query-deliveries").addEventListener("click", () => {
  format.value = "deliveries";
  showOutput();
});
cancel.addEventListener("click", () => {
  controller?.abort();
  stopPreview();
  pages.replaceChildren();
  content = void 0;
  showOutput();
  copy.disabled = download.disabled = true;
  cancel.disabled = true;
  status.textContent = "Extraction cancelled. Choose another file or open the sample.";
});
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent = "Output copied.";
  } catch {
    output.focus();
    output.select();
    status.textContent = "The output is selected. Press Ctrl+C or Command+C to copy it.";
  }
});
download.addEventListener("click", () => {
  const plain = format.value === "text";
  const url = URL.createObjectURL(new Blob([output.value], { type: plain ? "text/plain;charset=utf-8" : "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = plain ? "document-text.txt" : `${format.value}.json`;
  link.click();
  window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" }));
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
});
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    lifetime.abort();
    controller?.abort();
    stopPreview();
    content = void 0;
  }
});
void open(sample);
