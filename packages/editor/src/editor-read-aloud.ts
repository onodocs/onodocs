export function showReadAloud(root: ShadowRoot, body: readonly string[], selected: readonly string[], signal: AbortSignal, focus: () => void): { close(): void } {
  const dialog = document.createElement("dialog"), form = document.createElement("form"), title = document.createElement("h2"), scope = document.createElement("select"), voice = document.createElement("select"), rate = document.createElement("select"), passage = document.createElement("p"), status = document.createElement("p"), error = document.createElement("p"), playback = document.createElement("div"), actions = document.createElement("div"), style = document.createElement("style");
  const synth = window.speechSynthesis, lifetime = new AbortController();
  dialog.ariaLabel = "Read Aloud"; dialog.className = "read-aloud-dialog"; title.textContent = "Read Aloud";
  style.textContent = `.read-aloud-dialog{width:470px}.read-aloud-settings{display:grid;grid-template-columns:2fr 1fr;gap:12px}.read-aloud-settings label{min-width:0}.read-aloud-passage{max-height:160px;overflow:auto;line-height:1.6;white-space:pre-wrap;margin:0;padding:12px;background:#f3f5f7;border-radius:4px;overflow-wrap:anywhere}.read-aloud-playback{display:flex;justify-content:center;gap:12px}.read-aloud-playback button{width:44px;height:44px;min-width:44px}.read-aloud-playback svg{width:20px;height:20px}.read-aloud-dialog [role=status]{margin:0;min-height:20px}.read-aloud-dialog small{line-height:1.5}`;
  const field = (caption: string, input: HTMLSelectElement) => { const label = document.createElement("label"); label.textContent = caption; label.append(input); return label; };
  scope.add(new Option("Document body", "body")); if (selected.some(text => text.trim())) scope.add(new Option("Selection", "selection")); scope.value = scope.options.length > 1 ? "selection" : "body";
  for (const speed of [0.5, 0.75, 1, 1.25, 1.5, 2]) rate.add(new Option(`${speed}×`, String(speed))); rate.value = "1";
  const settings = document.createElement("div"), notice = document.createElement("small"); settings.className = "read-aloud-settings"; settings.append(field("Voice", voice), field("Speed", rate));
  notice.textContent = "Uses voices installed on this device. Document text stays on your device.";
  passage.className = "read-aloud-passage"; status.setAttribute("role", "status"); error.setAttribute("role", "alert"); playback.className = "read-aloud-playback"; playback.setAttribute("role", "group"); playback.ariaLabel = "Playback"; actions.className = "dialog-actions";
  const previous = document.createElement("button"), play = document.createElement("button"), next = document.createElement("button"), stop = document.createElement("button"), close = document.createElement("button");
  const icons = { Previous: '<path d="M5 5v14m13-14-8 7 8 7z"/>', Play: '<path d="m7 4 13 8-13 8z"/>', Pause: '<path d="M7 4v16M17 4v16"/>', Next: '<path d="M19 5v14M6 5l8 7-8 7z"/>', Stop: '<path d="M5 5h14v14H5z"/>' };
  function icon(button: HTMLButtonElement, label: keyof typeof icons): void { button.type = "button"; button.ariaLabel = label; button.title = label; button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[label]}</svg>`; }
  icon(previous, "Previous"); icon(play, "Play"); icon(next, "Next"); icon(stop, "Stop"); close.type = "button"; close.textContent = "Close";
  playback.append(previous, play, next, stop); actions.append(close); form.append(title, field("Read", scope), settings, passage, status, playback, notice, error, actions); dialog.append(style, form); root.append(dialog);
  let voices: SpeechSynthesisVoice[] = [], chunks: string[] = [], index = 0, offset = 0, utterance: SpeechSynthesisUtterance | undefined, state: "idle" | "playing" | "paused" = "idle", closed = false;
  function update(): void {
    play.disabled = !voices.length || !chunks.length; previous.disabled = index === 0; next.disabled = index >= chunks.length - 1; stop.disabled = state === "idle" && index === 0;
    icon(play, state === "playing" ? "Pause" : "Play"); passage.textContent = chunks[index] ?? "No text to read.";
    status.textContent = !synth ? "Read Aloud is unavailable in this browser." : !voices.length ? "No local voices available. Install a device voice or use another browser." : !chunks.length ? "No text to read." : `${state === "playing" ? "Reading" : state === "paused" ? "Paused" : "Ready"} · ${index + 1} of ${chunks.length}`;
  }
  function cancel(): void { if (utterance) { utterance = undefined; synth.cancel(); } }
  function stopReading(): void { cancel(); state = "idle"; offset = 0; error.textContent = ""; }
  function speak(): void {
    cancel(); error.textContent = "";
    const selectedVoice = voices.find(item => item.voiceURI === voice.value); if (!selectedVoice || !chunks[index]) { update(); return; }
    const start = offset, current = new SpeechSynthesisUtterance(chunks[index]!.slice(start)); utterance = current; state = "playing";
    current.voice = selectedVoice; current.lang = selectedVoice.lang; current.rate = Number(rate.value);
    current.onboundary = event => { if (utterance === current) offset = start + event.charIndex; };
    current.onend = () => { if (utterance !== current) return; utterance = undefined; offset = 0; if (index + 1 < chunks.length) { index++; speak(); } else { state = "idle"; update(); status.textContent = "Reading complete."; } };
    current.onerror = event => { if (utterance !== current) return; utterance = undefined; state = "idle"; update(); error.textContent = `Unable to read aloud (${event.error}). Try another voice.`; };
    update(); synth.speak(current);
  }
  function chooseText(): void {
    stopReading(); index = 0;
    const sentences = new Intl.Segmenter(undefined, { granularity: "sentence" });
    chunks = (scope.value === "selection" ? selected : body).flatMap(text => [...sentences.segment(text)].map(value => value.segment.trim()).filter(Boolean)); update();
  }
  function refreshVoices(): void {
    const current = voice.value; voices = synth?.getVoices().filter(item => item.localService) ?? [];
    voice.replaceChildren(...voices.map(item => new Option(`${item.name} (${item.lang})`, item.voiceURI)));
    voice.value = voices.find(item => item.voiceURI === current)?.voiceURI ?? voices.find(item => item.default)?.voiceURI ?? voices[0]?.voiceURI ?? ""; voice.disabled = !voices.length; update();
  }
  function dismiss(): void { if (closed) return; closed = true; stopReading(); lifetime.abort(); signal.removeEventListener("abort", dismiss); dialog.close(); dialog.remove(); if (!signal.aborted) focus(); }
  play.addEventListener("click", () => { if (state === "playing") { cancel(); state = "paused"; update(); } else { if (state === "idle") offset = 0; speak(); } });
  for (const [button, step] of [[previous, -1], [next, 1]] as const) button.addEventListener("click", () => { const playing = state === "playing"; cancel(); index += step; offset = 0; if (playing) speak(); else update(); });
  stop.addEventListener("click", () => { stopReading(); index = 0; update(); });
  for (const select of [voice, rate]) select.addEventListener("change", () => { if (state === "playing") speak(); });
  scope.addEventListener("change", chooseText); close.addEventListener("click", dismiss); form.addEventListener("submit", event => event.preventDefault()); dialog.addEventListener("cancel", event => { event.preventDefault(); dismiss(); });
  synth?.addEventListener("voiceschanged", refreshVoices, { signal: lifetime.signal }); window.addEventListener("pagehide", dismiss, { signal: lifetime.signal }); signal.addEventListener("abort", dismiss, { once: true });
  chooseText(); refreshVoices(); dialog.showModal(); (play.disabled ? close : play).focus();
  return { close: dismiss };
}
