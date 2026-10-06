import { openDocument } from "@onodocs/sdk";
import { extractContent } from "./extract.ts";
import sample from "../view-document/sample.docx";

const status = document.querySelector<HTMLOutputElement>("#status")!;
const file = document.querySelector<HTMLInputElement>("#file")!;
const format = document.querySelector<HTMLSelectElement>("#format")!;
const output = document.querySelector<HTMLTextAreaElement>("#output")!;
const cancel = document.querySelector<HTMLButtonElement>("#cancel")!;
const copy = document.querySelector<HTMLButtonElement>("#copy")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
let controller: AbortController | undefined;
let content: ReturnType<typeof extractContent> | undefined;

function showOutput() {
  output.value = !content ? "" : format.value === "text" ? content.text : JSON.stringify(format.value === "tables" ? content.tables : content.deliveryTables, null, 2);
}

async function open(source: File | Uint8Array) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  content = undefined;
  showOutput();
  copy.disabled = download.disabled = true;
  cancel.disabled = false;
  status.textContent = "Extracting document…";
  try {
    const doc = await openDocument(source, { signal });
    if (signal.aborted) return;
    content = extractContent(doc);
    showOutput();
    copy.disabled = download.disabled = false;
    status.textContent = `Ready · ${content.paragraphs.length} body paragraphs · ${content.tables.length} tables · ${content.deliveryTables.length} delivery tables. Everything stays in this browser.`;
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
    status.textContent = "Copy unavailable. The output is selected; use Ctrl+C or Command+C.";
  }
});
download.addEventListener("click", () => {
  const plain = format.value === "text";
  const url = URL.createObjectURL(new Blob([output.value], { type: plain ? "text/plain;charset=utf-8" : "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = plain ? "document-text.txt" : `${format.value}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener("pagehide", event => { if (!event.persisted) { controller?.abort(); content = undefined; } });
void open(sample);
