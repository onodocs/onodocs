import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { CanvasDocument } from "@onodocs/canvas";

export function mountDocument(container: HTMLElement, source: string | File, onError: (error: unknown) => void = console.error, onStatus: (status: string) => void = () => {}) {
  const controller = new AbortController();
  let document: BrowserDocument | undefined;
  let canvasDocument: CanvasDocument | undefined;
  onStatus("Opening document…");
  void (async () => {
    try {
      const [{ openDocument }, { createDocument }] = await Promise.all([import("@onodocs/sdk/browser"), import("@onodocs/canvas")]);
      controller.signal.throwIfAborted();
      let input: File | ArrayBuffer;
      if (typeof source === "string") {
        const response = await fetch(source, { signal: controller.signal, credentials: "same-origin" });
        if (!response.ok) throw new Error(`Document request failed (${response.status})`);
        input = await response.arrayBuffer();
      } else input = source;
      document = await openDocument(input, { signal: controller.signal, onProgress(progress) {
        if (controller.signal.aborted) return;
        canvasDocument ??= createDocument(progress.document, { container, viewOptions: { zoom: "fit-width" } });
        onStatus(`Loading… ${progress.document.pages.length} pages available`);
      } });
      if (controller.signal.aborted) { document.dispose(); return; }
      await canvasDocument!.view!.whenRendered();
      if (!controller.signal.aborted) onStatus(`Ready. ${document.pages.length} pages. Select text to copy it.`);
    } catch (error) {
      canvasDocument?.dispose();
      document?.dispose();
      if (!controller.signal.aborted) onError(error);
    }
  })();
  return () => { controller.abort(); canvasDocument?.dispose(); document?.dispose(); };
}
