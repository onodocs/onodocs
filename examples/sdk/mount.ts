import { openDocument, type BrowserDocument } from "@onodocs/sdk/browser";
import { createDocument, type CanvasDocument } from "@onodocs/canvas";

export function mountDocument(container: HTMLElement, url: string, onError: (error: unknown) => void = console.error) {
  const controller = new AbortController();
  let document: BrowserDocument | undefined;
  let canvasDocument: CanvasDocument | undefined;
  void (async () => {
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: "same-origin" });
      if (!response.ok) throw new Error(`Document request failed (${response.status})`);
      document = await openDocument(await response.arrayBuffer(), { signal: controller.signal, onProgress(progress) {
        canvasDocument ??= createDocument(progress.document, { container, viewOptions: { zoom: "fit-width" } });
      } });
      if (controller.signal.aborted) document.dispose();
    } catch (error) {
      document?.dispose();
      if (!controller.signal.aborted) onError(error);
    }
  })();
  return () => { controller.abort(); canvasDocument?.dispose(); document?.dispose(); };
}
