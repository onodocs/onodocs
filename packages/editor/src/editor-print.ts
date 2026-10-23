export async function openPrintPreview(pdf: () => Promise<Uint8Array<ArrayBuffer>>, title: string, signal: AbortSignal): Promise<void> {
  const preview = window.open("", "_blank");
  if (!preview) throw new Error("Allow pop-ups to open print preview, or use Download PDF and print the downloaded file.");
  preview.opener = null; preview.document.title = `${title} — Print`;
  const message = preview.document.createElement("p"); message.textContent = "Preparing print preview…"; message.style.cssText = "font:16px system-ui;padding:24px"; preview.document.body.append(message);
  let url: string | undefined;
  const timer = window.setInterval(() => { if (preview.closed) release(); }, 1000);
  function release(): void { window.clearInterval(timer); signal.removeEventListener("abort", release); if (url) { URL.revokeObjectURL(url); url = undefined; } }
  signal.addEventListener("abort", release, { once: true });
  try {
    const bytes = await pdf();
    if (preview.closed || signal.aborted) { release(); if (!preview.closed) preview.close(); return; }
    url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    preview.location.replace(url);
  } catch (error) {
    release(); if (!preview.closed) message.textContent = "Print preview could not be prepared. Return to the editor and try again, or download the PDF.";
    throw error;
  }
}
