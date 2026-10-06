import { openDocument, type BrowserDocument, type DocumentView } from "@onodocs/sdk/browser";
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
  let view: DocumentView | undefined;
  stop = () => { controller.abort(); view?.dispose(); doc?.dispose(); };
  status.textContent = "Opening document…";
  cancel.disabled = false;
  try {
    doc = await openDocument(source, {
      container: pages,
      signal,
      viewOptions: { zoom: "fit-width" },
      onProgress(progress) {
        if (signal.aborted) return;
        view = progress.view;
        status.textContent = progress.pages.length ? `Loading… ${progress.pages.length} ${progress.pages.length === 1 ? "page" : "pages"} available` : `Loading: ${progress.stage}…`;
      }
    });
    if (signal.aborted) { doc.dispose(); return; }
    view = doc.view;
    await view!.whenRendered();
    if (!signal.aborted) status.textContent = `Ready · ${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"}. Select text to copy it.`;
  } catch (error) {
    view?.dispose();
    doc?.dispose();
    if (!signal.aborted) status.textContent = `Unable to open document. ${error instanceof Error ? error.message : "Try another Word file."}`;
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
