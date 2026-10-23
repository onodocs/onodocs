export function showScreenshot(root: ShadowRoot, insert: (image: Blob, description: string) => Promise<void>, signal: AbortSignal): void {
  const dialog = document.createElement("dialog"), form = document.createElement("form"), title = document.createElement("h2"), sources = document.createElement("div"), preview = document.createElement("img"), placeholder = document.createElement("p"), help = document.createElement("p"), error = document.createElement("p"), actions = document.createElement("div"), style = document.createElement("style");
  title.textContent = "Screenshot"; dialog.className = "screenshot-dialog"; form.className = "screenshot-form"; sources.className = "screenshot-sources"; actions.className = "dialog-actions"; preview.alt = "Screenshot preview"; preview.hidden = true; placeholder.textContent = "Choose a screen, paste a screenshot, or select an image file."; help.className = "design-help"; help.textContent = "Screen capture stops after one frame. Use Picture Format / Crop after insertion to trim the image."; error.setAttribute("role", "alert"); error.hidden = true;
  style.textContent = ".screenshot-dialog{width:650px}.screenshot-form{width:100%;min-width:0}.screenshot-sources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.screenshot-sources button{border:1px solid #d7dce2;white-space:normal;height:auto;min-height:48px;padding:8px;flex-direction:column}.screenshot-form img{display:block;width:100%;max-height:38vh;object-fit:contain;background:#edf0f4;border:1px solid #d7dce2}.screenshot-form img[hidden]{display:none}.screenshot-form input{width:100%}.screenshot-form>.dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:8px}";
  const description = document.createElement("input"), label = document.createElement("label"); label.textContent = "Alternative text"; description.value = "Screenshot"; label.append(description);
  let image: Blob | undefined, url: string | undefined, stream: MediaStream | undefined, busy = false, closed = false;
  const lifetime = new AbortController();
  function stopCapture(): void { stream?.getTracks().forEach(track => track.stop()); stream = undefined; }
  function close(): void { if (closed) return; closed = true; lifetime.abort(); stopCapture(); if (url) URL.revokeObjectURL(url); signal.removeEventListener("abort", close); dialog.close(); dialog.remove(); }
  function update(): void { for (const button of sources.querySelectorAll("button")) button.disabled = busy; capture.disabled ||= !navigator.mediaDevices?.getDisplayMedia; submit.disabled = busy || !image; description.disabled = busy; }
  async function run(action: () => Promise<void>): Promise<void> { if (busy || closed) return; busy = true; error.hidden = true; update(); try { await action(); } catch (cause) { if (!closed) { error.textContent = cause instanceof DOMException && cause.name === "NotAllowedError" ? "Permission was not granted. Try again, paste a screenshot, or choose an image file." : cause instanceof Error ? cause.message : String(cause); error.hidden = false; } } finally { busy = false; if (!closed) update(); } }
  async function choose(blob: Blob): Promise<void> {
    if (!["image/png", "image/jpeg"].includes(blob.type)) throw new Error("Choose a PNG or JPEG image.");
    const bitmap = await createImageBitmap(blob); bitmap.close(); if (closed) return;
    if (url) URL.revokeObjectURL(url); image = blob; url = URL.createObjectURL(blob); preview.src = url; preview.hidden = false; placeholder.hidden = true;
  }
  function button(label: string, glyph: string, action: () => Promise<void>): HTMLButtonElement { const value = document.createElement("button"); value.type = "button"; value.textContent = label; const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("fill", "none"); icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "1.5"); icon.setAttribute("aria-hidden", "true"); icon.innerHTML = glyph; value.prepend(icon); value.addEventListener("click", () => { void run(action); }); sources.append(value); return value; }
  const capture = button("Capture screen", '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M6 7h4M6 7v4M18 13h-4M18 13V9"/>', async () => {
    const captured = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    if (closed) { captured.getTracks().forEach(track => track.stop()); return; }
    stream = captured; const video = document.createElement("video"); video.muted = true; video.playsInline = true; video.srcObject = captured;
    try {
      await video.play();
      await new Promise<void>((resolve, reject) => {
        const done = () => { lifetime.signal.removeEventListener("abort", cancel); captured.getVideoTracks()[0]?.removeEventListener("ended", cancel); resolve(); };
        const cancel = () => { video.cancelVideoFrameCallback(frame); lifetime.signal.removeEventListener("abort", cancel); captured.getVideoTracks()[0]?.removeEventListener("ended", cancel); reject(new Error("Screen capture ended before a frame was available.")); };
        const frame = video.requestVideoFrameCallback(done); lifetime.signal.addEventListener("abort", cancel, { once: true }); captured.getVideoTracks()[0]?.addEventListener("ended", cancel, { once: true });
        if (closed || captured.getVideoTracks()[0]?.readyState === "ended") cancel();
      });
      const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d")!.drawImage(video, 0, 0); stopCapture();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("Unable to capture this screen. Try another window or paste a screenshot."); await choose(blob);
    } finally { stopCapture(); video.pause(); video.srcObject = null; }
  });
  button("Paste image", '<path d="M8 4H5v18h15V4h-3M8 2h9v5H8zM8 17l3-4 3 3 2-2 2 3"/>', async () => {
    if (!navigator.clipboard?.read) throw new Error("Use your keyboard paste shortcut or choose an image file.");
    for (const item of await navigator.clipboard.read()) { const type = item.types.find(type => type === "image/png" || type === "image/jpeg"); if (type) { await choose(await item.getType(type)); return; } }
    throw new Error("The clipboard has no PNG or JPEG image.");
  });
  button("Choose image", '<path d="M2 6h8l2 3h10l-3 12H2zM3 6V3h7l2 3h8v3"/>', async () => {
    const file = document.createElement("input"); file.type = "file"; file.accept = "image/png,image/jpeg"; file.addEventListener("change", () => { const image = file.files?.[0]; if (image) void run(() => choose(image)); }, { once: true }); file.click();
  });
  dialog.addEventListener("paste", event => { if (event.target === description) return; const file = [...event.clipboardData?.files ?? []].find(file => ["image/png", "image/jpeg"].includes(file.type)); if (!file) return; event.preventDefault(); event.stopPropagation(); void run(() => choose(file)); });
  const cancel = document.createElement("button"), submit = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", close); submit.type = "submit"; submit.textContent = "Insert"; actions.append(cancel, submit);
  form.addEventListener("submit", event => { event.preventDefault(); void run(async () => { if (!image) return; await insert(image, description.value); close(); }); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); }); dialog.addEventListener("close", close); signal.addEventListener("abort", close, { once: true });
  form.append(title, sources, placeholder, preview, label, help, error, actions); dialog.append(style, form); root.append(dialog); update(); dialog.showModal();
}
