import { openDocument, type BrowserDocument, type DocumentView } from "@onodocs/sdk/browser";

export function mountDocument(container: HTMLElement, url: string, onError: (error: unknown) => void = console.error) {
  const controller = new AbortController();
  let document: BrowserDocument | undefined;
  let view: DocumentView | undefined;
  void (async () => {
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: "same-origin" });
      if (!response.ok) throw new Error(`Document request failed (${response.status})`);
      document = await openDocument(await response.arrayBuffer(), { signal: controller.signal, container, viewOptions: { zoom: "fit-width" }, onProgress(progress) { view = progress.view; } });
      if (controller.signal.aborted) document.dispose();
    } catch (error) {
      document?.dispose();
      if (!controller.signal.aborted) onError(error);
    }
  })();
  return () => { controller.abort(); view?.dispose(); document?.dispose(); };
}
