import { openDocument } from "@onodocs/sdk";
import { openDocument as openPreview, type BrowserDocument } from "@onodocs/sdk/browser";
import { createDocument, type CanvasDocument } from "@onodocs/canvas";
import { extractContent } from "./extract.ts";
import { demoLicense } from "../sdk/license";
import sample from "../view-document/sample.docx";

const status = document.querySelector<HTMLOutputElement>("#status")!;
const file = document.querySelector<HTMLInputElement>("#file")!;
const format = document.querySelector<HTMLSelectElement>("#format")!;
const output = document.querySelector<HTMLTextAreaElement>("#output")!;
const cancel = document.querySelector<HTMLButtonElement>("#cancel")!;
const copy = document.querySelector<HTMLButtonElement>("#copy")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const pages = document.querySelector<HTMLElement>("#pages")!;
const documentName = document.querySelector<HTMLElement>("#document-name")!;
const advanced = document.querySelector<HTMLDetailsElement>("#advanced")!;
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
let controller: AbortController | undefined;
let content: ReturnType<typeof extractContent> | undefined;
let stopPreview = () => {};

function showOutput() {
  output.value = !content ? "" : format.value === "text" ? content.text : JSON.stringify(format.value === "tables" ? content.tables : format.value === "deliveries" ? content.deliveryTables : { text: content.text, paragraphs: content.paragraphs, tables: content.tables }, null, 2);
}

async function open(source: File | Uint8Array) {
  controller?.abort();
  stopPreview();
  pages.replaceChildren();
  controller = new AbortController();
  const { signal } = controller;
  let preview: BrowserDocument | undefined;
  let canvas: CanvasDocument | undefined;
  stopPreview = () => { canvas?.dispose(); preview?.dispose(); };
  documentName.textContent = source instanceof File ? source.name : "Brand launch brief";
  content = undefined;
  showOutput();
  copy.disabled = download.disabled = true;
  cancel.disabled = false;
  status.textContent = "Extracting document…";
  try {
    const doc = await openDocument(source, { signal });
    try {
      if (signal.aborted) return;
      content = extractContent(doc);
    } finally { doc.dispose(); }
    window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
    showOutput();
    copy.disabled = download.disabled = false;
    const summary = `${content.paragraphs.length} body ${content.paragraphs.length === 1 ? "paragraph" : "paragraphs"} · ${content.tables.length} ${content.tables.length === 1 ? "table" : "tables"}`;
    status.textContent = `Extracted ${summary}. Preparing the source preview…`;
    try {
      preview = await openPreview(source, { signal, licenseKey });
      if (signal.aborted) { preview.dispose(); return; }
      canvas = createDocument(preview, { container: pages, viewOptions: { zoom: "fit-width" } });
      await canvas.view!.whenRendered();
      if (!signal.aborted) status.textContent = `Ready · ${summary}. Your file and extracted content stay in this browser.`;
    } catch (error) {
      canvas?.dispose();
      preview?.dispose();
      if (!signal.aborted) status.textContent = `Ready · ${summary}. Source preview unavailable. ${error instanceof Error ? error.message : "The extracted content is still available."}`;
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
document.querySelector("#sample")!.addEventListener("click", () => { void open(sample); });
format.addEventListener("change", showOutput);
advanced.addEventListener("toggle", () => {
  format.querySelector<HTMLOptionElement>('[value="deliveries"]')!.hidden = !advanced.open;
  if (!advanced.open && format.value === "deliveries") { format.value = "tables"; showOutput(); }
});
document.querySelector("#query-deliveries")!.addEventListener("click", () => { format.value = "deliveries"; showOutput(); });
cancel.addEventListener("click", () => {
  controller?.abort();
  stopPreview();
  pages.replaceChildren();
  content = undefined;
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
  link.click(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" }));
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener("pagehide", event => { if (!event.persisted) { lifetime.abort(); controller?.abort(); stopPreview(); content = undefined; } });
void open(sample);
