import { openDocument } from "@onodocs/sdk";
import { extractContent } from "./extract.js";
import sample from "../view-document/sample.docx";
const status = document.querySelector("#status");
const file = document.querySelector("#file");
const format = document.querySelector("#format");
const output = document.querySelector("#output");
const cancel = document.querySelector("#cancel");
const copy = document.querySelector("#copy");
const download = document.querySelector("#download");
let controller;
let content;
function showOutput() {
  output.value = !content ? "" : format.value === "text" ? content.text : JSON.stringify(format.value === "tables" ? content.tables : content.deliveryTables, null, 2);
}
async function open(source) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  content = void 0;
  showOutput();
  copy.disabled = download.disabled = true;
  cancel.disabled = false;
  status.textContent = "Extracting document\u2026";
  try {
    const doc = await openDocument(source, { signal });
    if (signal.aborted) return;
    content = extractContent(doc);
    showOutput();
    copy.disabled = download.disabled = false;
    status.textContent = `Ready \xB7 ${content.paragraphs.length} body ${content.paragraphs.length === 1 ? "paragraph" : "paragraphs"} \xB7 ${content.tables.length} ${content.tables.length === 1 ? "table" : "tables"} \xB7 ${content.deliveryTables.length} delivery ${content.deliveryTables.length === 1 ? "table" : "tables"}. Your file and extracted content stay in this browser.`;
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
cancel.addEventListener("click", () => {
  controller?.abort();
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
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
});
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    controller?.abort();
    content = void 0;
  }
});
void open(sample);
