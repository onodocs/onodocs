import { openDocument } from "@onodocs/sdk/browser";
import sample from "../view-document/sample.docx";
const pages = document.querySelector("#pages");
const status = document.querySelector("#status");
const file = document.querySelector("#file");
const cancel = document.querySelector("#cancel");
let stop = () => {
};
async function open(source) {
  stop();
  const controller = new AbortController();
  const { signal } = controller;
  let doc;
  let view;
  stop = () => {
    controller.abort();
    view?.dispose();
    doc?.dispose();
  };
  status.textContent = "Opening document\u2026";
  cancel.disabled = false;
  try {
    doc = await openDocument(source, {
      container: pages,
      signal,
      viewOptions: { zoom: "fit-width" },
      onProgress(progress) {
        if (signal.aborted) return;
        view = progress.view;
        status.textContent = progress.pages.length ? `Loading\u2026 ${progress.pages.length} pages available` : `Loading: ${progress.stage}\u2026`;
      }
    });
    if (signal.aborted) {
      doc.dispose();
      return;
    }
    view = doc.view;
    await view.whenRendered();
    if (!signal.aborted) status.textContent = `Ready \xB7 ${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"}. Select text to copy it.`;
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
document.querySelector("#sample").addEventListener("click", () => {
  void open(sample);
});
cancel.addEventListener("click", () => {
  stop();
  cancel.disabled = true;
  status.textContent = "Loading cancelled. Choose another file or open the sample.";
});
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) stop();
});
void open(sample);
