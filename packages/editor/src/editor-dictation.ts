import type { WordEditor } from "./editor.js";
import { editorIcons } from "./editor-icons.js";

export interface EditorDictationOptions {
  readonly name: string;
  readonly language?: string;
  readonly listen: (request: Readonly<{ language: string; signal: AbortSignal; onTranscript: (text: string) => void }>) => Promise<void>;
}

export function showDictation(root: ShadowRoot, editor: WordEditor, provider: EditorDictationOptions, signal: AbortSignal, focus: () => void): void {
  const snapshot = editor.document!.snapshot(), selection = editor.selection!;
  const dialog = document.createElement("dialog"), heading = document.createElement("h2"), source = document.createElement("p"), settings = document.createElement("div"), languageLabel = document.createElement("label"), language = document.createElement("input"), record = document.createElement("button"), transcriptLabel = document.createElement("label"), transcript = document.createElement("textarea"), status = document.createElement("p"), error = document.createElement("p"), actions = document.createElement("div"), cancel = document.createElement("button"), insert = document.createElement("button"), style = document.createElement("style");
  dialog.className = "dictation-dialog"; dialog.ariaLabel = "Dictate"; heading.textContent = "Dictate"; source.textContent = `Provided by ${provider.name}. Review the transcript before inserting it.`;
  style.textContent = `.dictation-dialog{width:560px;max-width:calc(100vw - 24px)}.dictation-settings{display:flex;align-items:end;gap:12px;margin:16px 0}.dictation-settings label{flex:1;min-width:0}.dictation-settings input{position:static;opacity:1}.dictation-settings button{display:flex;gap:8px;align-items:center;min-height:36px}.dictation-settings svg{width:20px;height:20px}.dictation-dialog textarea{position:static;opacity:1;width:100%;height:200px;max-height:35dvh;resize:vertical;padding:10px;border:1px solid #b8c1cb;border-radius:4px;background:white;color:#29313d;font:inherit;line-height:1.5}.dictation-dialog .dialog-actions{display:flex;flex-direction:row;gap:8px;justify-content:flex-end}.dictation-dialog .dictation-insert{background:var(--onodocs-accent,#b43829);color:white;border-color:transparent}.dictation-dialog [role=alert]:empty{display:none}`;
  settings.className = "dictation-settings"; actions.className = "dialog-actions"; insert.className = "dictation-insert";
  languageLabel.textContent = "Language"; language.value = provider.language ?? navigator.language; language.placeholder = "en-US"; languageLabel.append(language); transcriptLabel.textContent = "Transcript"; transcriptLabel.append(transcript);
  status.setAttribute("role", "status"); error.setAttribute("role", "alert"); cancel.textContent = "Cancel"; insert.textContent = "Insert text";
  for (const button of [record, cancel, insert]) button.type = "button";
  settings.append(languageLabel, record); actions.append(cancel, insert); dialog.append(style, heading, source, settings, transcriptLabel, status, error, actions); root.append(dialog);
  let recording: AbortController | undefined, busy = false, closed = false;
  function update(): void {
    const label = recording ? "Stop dictation" : "Start dictation"; record.ariaLabel = label; record.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${recording ? '<rect x="5" y="5" width="14" height="14" rx="1"/>' : editorIcons.dictate}</svg><span>${recording ? "Stop" : "Start"}</span>`;
    language.disabled = !!recording || busy; transcript.readOnly = !!recording || busy; record.disabled = busy; cancel.disabled = busy; insert.disabled = busy || !!recording || !transcript.value.trim();
  }
  function stop(): void { const current = recording; recording = undefined; current?.abort(); }
  function dismiss(): void { if (closed) return; closed = true; stop(); signal.removeEventListener("abort", dismiss); dialog.close(); dialog.remove(); if (!signal.aborted) focus(); }
  async function start(): Promise<void> {
    if (recording) { stop(); status.textContent = "Stopped. Review or edit the transcript."; update(); return; }
    error.textContent = "";
    let tag: string; try { tag = Intl.getCanonicalLocales(language.value.trim())[0]!; if (!tag) throw new Error(); } catch { error.textContent = "Enter a language tag such as en-US or uk-UA."; language.focus(); return; }
    const operation = new AbortController(), prefix = transcript.value; recording = operation; status.textContent = "Listening…"; update();
    try {
      await provider.listen({ language: tag, signal: operation.signal, onTranscript(text) { if (closed || recording !== operation || operation.signal.aborted) return; transcript.value = prefix + (prefix && text && !/\s$/.test(prefix) && !/^\s/.test(text) ? " " : "") + text; update(); } });
      if (closed || recording !== operation) return; status.textContent = "Finished. Review or edit the transcript.";
    } catch (cause) { if (!closed && recording === operation && !operation.signal.aborted) { error.textContent = cause instanceof Error ? cause.message : String(cause); status.textContent = "Dictation stopped. Your transcript is retained."; } }
    finally { if (!closed && recording === operation) { recording = undefined; update(); } }
  }
  record.addEventListener("click", () => { void start(); }); transcript.addEventListener("input", update); cancel.addEventListener("click", dismiss);
  insert.addEventListener("click", () => { void (async () => {
    if (busy || recording || !transcript.value.trim()) return; busy = true; error.textContent = ""; update();
    try { await editor.execute({ kind: "replace", selection, text: transcript.value, paragraphBreaks: true }, undefined, { ifUnchangedSince: snapshot, mode: "edit", signal }); dismiss(); }
    catch (cause) { if (!closed) error.textContent = cause instanceof Error ? cause.message : String(cause); }
    finally { if (!closed) { busy = false; update(); } }
  })(); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) dismiss(); }); signal.addEventListener("abort", dismiss, { once: true });
  status.textContent = "Start when you are ready."; update(); dialog.showModal(); record.focus();
}
