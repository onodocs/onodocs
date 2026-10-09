import { openDocument, type BrowserDocument } from "@onodocs/sdk/browser";
import { createDocument, type CanvasDocument } from "@onodocs/canvas";
import sample from "../view-document/sample.docx";

const pages = document.querySelector<HTMLElement>("#pages")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;
const file = document.querySelector<HTMLInputElement>("#file")!;
const cancel = document.querySelector<HTMLButtonElement>("#cancel")!;
let stop = () => {};

async function open(source: File | Uint8Array) {
  stop();
  const controller = new AbortController();
  const { signal } = controller;
  let doc: BrowserDocument | undefined;
  let canvasDocument: CanvasDocument | undefined;
  stop = () => { controller.abort(); canvasDocument?.dispose(); doc?.dispose(); };
  status.textContent = "Opening document…";
  cancel.disabled = false;
  try {
    doc = await openDocument(source, {
      signal,
      onProgress(progress) {
        if (signal.aborted) return;
        canvasDocument ??= createDocument(progress.document, { container: pages, viewOptions: { zoom: "fit-width" } });
        const count = progress.document.pages.length;
        status.textContent = count ? `Loading… ${count} ${count === 1 ? "page" : "pages"} available` : `Loading: ${progress.stage}…`;
      }
    });
    if (signal.aborted) { doc.dispose(); return; }
    await canvasDocument!.view!.whenRendered();
    if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" })); status.textContent = `Ready · ${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"}. Select text to copy it.`; }
  } catch (error) {
    canvasDocument?.dispose();
    doc?.dispose();
    if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); status.textContent = `Unable to open document. ${error instanceof Error ? error.message : "Try another Word file."}`; }
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
cancel.addEventListener("click", () => {
  stop();
  cancel.disabled = true;
  status.textContent = "Loading cancelled. Choose another file or open the sample.";
});
window.addEventListener("pagehide", event => { if (!event.persisted) stop(); });
void open(sample);
