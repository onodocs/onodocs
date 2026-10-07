import { openDocument } from "@onodocs/canvas";

const status = document.querySelector("#status");
let doc;
try {
  doc = await openDocument("/document", {
    container: document.querySelector("#pages"),
    viewOptions: { zoom: "fit-width" }
  });
  window.addEventListener("pagehide", event => { if (!event.persisted) doc.dispose(); });
  await doc.view.whenRendered();
  status.textContent = `${doc.pages.length} pages. Select text to copy it.`;
} catch (error) {
  doc?.dispose();
  status.textContent = error.message;
}
