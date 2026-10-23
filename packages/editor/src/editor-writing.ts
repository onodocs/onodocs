import type { DocumentQuery, DocumentSelection } from "@onodocs/sdk";
import type { WordEditor } from "./editor.js";

export interface EditorWritingRequest {
  readonly document: DocumentQuery<"document">;
  readonly selection?: DocumentSelection;
  readonly signal: AbortSignal;
}
export interface EditorWritingSuggestion {
  readonly title: string;
  readonly description?: string;
  readonly selection: DocumentSelection;
  readonly replacements: readonly string[];
}
export interface EditorWritingOptions {
  readonly name: string;
  readonly check?: (request: EditorWritingRequest) => Promise<readonly EditorWritingSuggestion[]>;
  readonly rewrite?: (request: EditorWritingRequest & Readonly<{ instruction: string }>) => Promise<readonly EditorWritingSuggestion[]>;
  readonly synonyms?: (request: EditorWritingRequest) => Promise<readonly EditorWritingSuggestion[]>;
}

export function showWriting(root: ShadowRoot, editor: WordEditor, kind: "check" | "rewrite" | "synonyms", provider: EditorWritingOptions, signal: AbortSignal, focus: () => void): void {
  const dialog = document.createElement("dialog"), heading = document.createElement("h2"), source = document.createElement("p"), settings = document.createElement("div"), scope = document.createElement("select"), instruction = document.createElement("textarea"), run = document.createElement("button"), status = document.createElement("p"), body = document.createElement("div"), list = document.createElement("select"), detail = document.createElement("section"), description = document.createElement("p"), original = document.createElement("blockquote"), replacements = document.createElement("select"), preview = document.createElement("p"), error = document.createElement("p"), actions = document.createElement("div"), ignore = document.createElement("button"), close = document.createElement("button"), apply = document.createElement("button"), style = document.createElement("style");
  const title = { check: "Spelling and grammar", rewrite: "Writing assistance", synonyms: "Thesaurus" }[kind];
  dialog.className = "writing-dialog"; dialog.ariaLabel = title; heading.textContent = title; source.textContent = `Provided by ${provider.name}.`;
  style.textContent = `.writing-dialog{width:720px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);overflow:auto}.writing-settings{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}.writing-settings label{margin:0}.writing-settings textarea{position:static;opacity:1;width:100%;min-height:70px;padding:8px;resize:vertical;font:inherit}.writing-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:18px}.writing-body>select{width:100%;height:220px}.writing-body section{min-width:0}.writing-body section p,.writing-body blockquote{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}.writing-body blockquote{margin:12px 0;padding:10px;border-left:3px solid #bdc7d1;background:#f3f5f7;max-height:130px;overflow:auto}.writing-body select{max-width:100%}.writing-preview{padding:10px;background:#edf7ef;max-height:130px;overflow:auto}.writing-dialog .dialog-actions{display:flex;flex-direction:row;justify-content:flex-end;gap:8px}.writing-dialog .writing-apply{background:var(--onodocs-accent,#b43829);color:white;border-color:transparent}.writing-dialog [role=status]{min-height:20px}.writing-dialog [role=alert]:empty{display:none}@media(max-width:550px){.writing-body{grid-template-columns:1fr}.writing-body>select{height:110px}.writing-settings{grid-template-columns:1fr}.writing-settings>button{justify-self:end}}`;
  settings.className = "writing-settings"; body.className = "writing-body"; preview.className = "writing-preview"; actions.className = "dialog-actions";
  status.setAttribute("role", "status"); error.setAttribute("role", "alert"); list.ariaLabel = "Suggestions"; list.size = 6; replacements.ariaLabel = "Replacement";
  const range = editor.selection;
  let snapshot = editor.document!.snapshot(), suggestions: readonly EditorWritingSuggestion[] = [], busy = false, applying = false, closed = false, request: AbortController | undefined;
  const hasSelection = !!range && (range.start.paragraphId !== range.end.paragraphId || range.start.offset !== range.end.offset);
  scope.add(new Option("Whole document", "document")); if (hasSelection) scope.add(new Option("Selected text", "selection")); scope.value = hasSelection ? "selection" : "document";
  const field = document.createElement("label");
  if (kind === "rewrite") { field.textContent = "What would you like to change?"; instruction.placeholder = "For example, make this clearer and more concise"; field.append(instruction); }
  else if (kind === "check") { field.textContent = "Check"; field.append(scope); }
  else { field.textContent = "Find alternatives for the selected text."; }
  run.textContent = kind === "check" ? "Check text" : kind === "rewrite" ? "Get suggestions" : "Look up";
  for (const button of [run, ignore, close, apply]) button.type = "button";
  ignore.textContent = "Ignore"; close.textContent = "Close"; apply.textContent = "Apply"; apply.className = "writing-apply";
  settings.append(field, run); detail.append(description, original, replacements, preview); body.append(list, detail); actions.append(ignore, close, apply); dialog.append(style, heading, source, settings, status, body, error, actions); root.append(dialog);
  function current(): EditorWritingSuggestion | undefined { return suggestions[list.selectedIndex]; }
  function selectedText(selection: DocumentSelection): string {
    const paragraphs = snapshot.paragraphs().all(), first = paragraphs.findIndex(p => p.id === selection.start.paragraphId), last = paragraphs.findIndex(p => p.id === selection.end.paragraphId);
    return paragraphs.slice(first, last + 1).map((p, i) => p.text.slice(i === 0 ? selection.start.offset : 0, i === last - first ? selection.end.offset : p.text.length)).join("\n");
  }
  function update(): void {
    body.hidden = !suggestions.length; ignore.hidden = !suggestions.length; apply.hidden = !suggestions.length;
    run.disabled = busy; scope.disabled = busy; instruction.disabled = busy; list.disabled = busy; replacements.disabled = busy;
    ignore.disabled = busy || !current(); apply.disabled = busy || editor.mode !== "edit" || replacements.selectedIndex < 0; close.disabled = applying;
  }
  function show(): void {
    const item = current(); description.textContent = item?.description ?? item?.title ?? ""; original.textContent = item ? selectedText(item.selection) : "";
    replacements.replaceChildren(...(item?.replacements ?? []).map((value, i) => new Option(value || "Delete text", String(i)))); replacements.selectedIndex = replacements.options.length ? 0 : -1;
    preview.textContent = item?.replacements[0] ?? ""; update();
  }
  function dismiss(): void { if (closed) return; closed = true; request?.abort(); signal.removeEventListener("abort", dismiss); dialog.close(); dialog.remove(); if (!signal.aborted) focus(); }
  async function check(): Promise<void> {
    if (busy) return;
    error.textContent = "";
    if (kind !== "check" && !hasSelection) { error.textContent = "Select text in the document first."; return; }
    if (kind === "rewrite" && !instruction.value.trim()) { error.textContent = "Describe the change you want."; instruction.focus(); return; }
    const next = editor.document!.snapshot();
    if (next !== snapshot && (kind !== "check" || scope.value === "selection")) { error.textContent = "The document changed. Close this dialog and select the text again."; return; }
    suggestions = []; list.replaceChildren(); show(); snapshot = next; request?.abort(); const operation = new AbortController(); request = operation; busy = true; status.textContent = "Getting suggestions…"; update();
    try {
      const input: EditorWritingRequest = { document: snapshot, signal: operation.signal, ...(kind !== "check" || scope.value === "selection" ? { selection: range! } : {}) };
      const result = await (kind === "rewrite" ? provider.rewrite!({ ...input, instruction: instruction.value.trim() }) : provider[kind]!(input));
      if (closed || operation.signal.aborted) return;
      if (editor.document?.snapshot() !== snapshot) throw new Error("The document changed. Check the current text again.");
      suggestions = result; list.replaceChildren(...suggestions.map((item, i) => new Option(item.title, String(i)))); list.selectedIndex = suggestions.length ? 0 : -1; show();
      status.textContent = suggestions.length ? `${suggestions.length} ${suggestions.length === 1 ? "suggestion" : "suggestions"}. Review a replacement before applying.` : "No suggestions returned.";
    } catch (cause) { if (!closed && !operation.signal.aborted) { error.textContent = cause instanceof Error ? cause.message : String(cause); status.textContent = "Unable to get suggestions. Try again."; } }
    finally { if (!closed) { busy = false; update(); } }
  }
  run.addEventListener("click", () => { void check(); }); list.addEventListener("change", show);
  replacements.addEventListener("change", () => { preview.textContent = current()?.replacements[replacements.selectedIndex] ?? ""; });
  ignore.addEventListener("click", () => { const index = list.selectedIndex; suggestions = suggestions.filter((_, i) => i !== index); list.remove(index); list.selectedIndex = Math.min(index, suggestions.length - 1); status.textContent = suggestions.length ? `${suggestions.length} suggestions remaining.` : "No suggestions remaining."; show(); });
  apply.addEventListener("click", () => { void (async () => {
    const item = current(), replacement = item?.replacements[replacements.selectedIndex]; if (!item || replacement === undefined || busy) return;
    busy = true; applying = true; error.textContent = ""; update();
    try { await editor.execute({ kind: "replace", selection: item.selection, text: replacement, paragraphBreaks: true }, undefined, { ifUnchangedSince: snapshot, mode: "edit", signal }); dismiss(); }
    catch (cause) { if (!closed) error.textContent = cause instanceof Error ? cause.message : String(cause); }
    finally { if (!closed) { busy = false; applying = false; update(); } }
  })(); });
  close.addEventListener("click", dismiss); dialog.addEventListener("cancel", event => { event.preventDefault(); if (!applying) dismiss(); }); signal.addEventListener("abort", dismiss, { once: true });
  status.textContent = kind === "check" ? "Choose the text to check." : "Review suggestions before changing your document."; update(); dialog.showModal(); (kind === "rewrite" ? instruction : run).focus();
}
