"use client";

import { useEffect, useRef, useState } from "react";
import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { CanvasDocument } from "@onodocs/canvas";

export interface DocxViewerProps {
  source: File | ArrayBuffer | Uint8Array;
  licenseKey?: string;
}

export function DocxViewer({ source, licenseKey = "" }: DocxViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const cancel = useRef<() => void>(() => {});
  const [status, setStatus] = useState("Opening document…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = host.current!;
    const controller = new AbortController();
    const { signal } = controller;
    let doc: BrowserDocument | undefined;
    let canvasDocument: CanvasDocument | undefined;
    const stop = () => { controller.abort(); canvasDocument?.dispose(); doc?.dispose(); };
    cancel.current = () => {
      stop();
      setLoading(false);
      setStatus("Loading cancelled. Choose another file or open the sample.");
    };
    setLoading(true);
    setStatus("Opening document…");

    async function open() {
      try {
        const { openDocument } = await import("@onodocs/sdk/browser");
        const { createDocument } = await import("@onodocs/canvas");
        if (signal.aborted) return;
        doc = await openDocument(source, {
          signal,
          licenseKey,
          onProgress(progress) {
            if (signal.aborted) return;
            canvasDocument ??= createDocument(progress.document, { container, viewOptions: { zoom: "fit-width" } });
            const count = progress.document.pages.length;
            setStatus(count ? `Loading… ${count} ${count === 1 ? "page" : "pages"} available` : `Loading: ${progress.stage}…`);
          }
        });
        if (signal.aborted) { doc.dispose(); return; }
        await canvasDocument!.view!.whenRendered();
        if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" })); setStatus(`Ready · ${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"}. Select text to copy it.`); }
      } catch (error) {
        canvasDocument?.dispose();
        doc?.dispose();
        if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); setStatus(`Unable to open document. ${error instanceof Error ? error.message : "Try another Word file."}`); }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    void open();
    return stop;
  }, [source, licenseKey]);

  return <section className="docx-viewer" aria-label="Word viewer">
    <div className="viewer-status"><output aria-live="polite">{status}</output><button type="button" disabled={!loading} onClick={() => cancel.current()}>Cancel loading</button></div>
    <div className="viewer-viewport"><div ref={host} /></div>
  </section>;
}
