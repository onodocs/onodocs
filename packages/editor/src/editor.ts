import { openDocument, type BrowserDocument, type BrowserOptions } from "@onodocs/sdk/browser";
import { createDocument, type CanvasDocument, type DocumentView, type DocumentAttachment } from "@onodocs/canvas";
import type { DocumentEdit, DocumentSelection, TextFormatting } from "@onodocs/sdk";
import { createDocumentPackage } from "@onodocs/sdk";
import { createForm, type FormAnswers, type FormDefinition } from "@onodocs/sdk/forms";
import { createFormPanel } from "./form-panel.js";
import { editorIcons } from "./editor-icons.js";
import { readClipboard, writeClipboard } from "./editor-clipboard.js";
import { createReviewPanel, type EditorReviewOptions } from "./editor-review.js";
export type { EditorReviewOptions } from "./editor-review.js";
export { createTemplateEditor } from "./template-editor.js";
export type { TemplateEditor, TemplateEditorOptions } from "./template-editor.js";

export type EditorMode = "view" | "edit" | "review" | "form";
export type EditorCommand = DocumentEdit extends infer T ? T extends DocumentEdit ? Omit<T, "selection"> : never : never;
export interface EditorOptions {
  readonly container: HTMLElement;
  readonly document?: BrowserOptions;
  readonly toolbar?: readonly string[] | false;
  readonly fonts?: readonly string[];
  readonly styles?: readonly Readonly<{ id: string; label: string }>[];
  readonly readOnly?: boolean;
  readonly mode?: EditorMode;
  readonly allowedModes?: readonly EditorMode[];
  readonly form?: FormDefinition;
  readonly onModeChange?: (mode: EditorMode) => void;
  readonly onFormComplete?: (result: Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>) => void | Promise<void>;
  readonly review?: EditorReviewOptions;
  readonly onChange?: (editor: WordEditor, change: EditorChange) => void | Promise<void>;
  readonly onError?: (error: unknown) => void;
  readonly commands?: readonly Readonly<{ id: string; label: string; modes?: readonly EditorMode[]; ribbon?: Readonly<{ tab: string; group: string; icon?: string }>; execute: (editor: WordEditor) => void | Promise<void> }>[];
}
export interface EditorChange {
  readonly edit?: DocumentEdit;
  readonly review?: import("@onodocs/sdk").DocumentReviewCommand;
  readonly paragraphs?: readonly Readonly<{ id: string; text: string }>[];
}
export interface EditorSynchronization {
  readonly bytes?: Uint8Array<ArrayBuffer>;
  readonly allowedModes?: readonly EditorMode[];
}
export interface WordEditor {
  readonly view: DocumentView | undefined;
  synchronize(load: () => Promise<EditorSynchronization | undefined>): Promise<void>;
  readonly document: BrowserDocument | undefined;
  readonly selection: DocumentSelection | undefined;
  readonly element: HTMLElement;
  readonly mode: EditorMode;
  readonly allowedModes: readonly EditorMode[];
  setMode(mode: EditorMode): Promise<void>;
  fill(answers: FormAnswers): Promise<void>;
  answers(): FormAnswers;
  completeForm(): Promise<Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>>;
  open(input: ArrayBuffer | Uint8Array | Blob, name?: string): Promise<void>;
  restore(input: ArrayBuffer | Uint8Array | Blob): Promise<void>;
  newDocument(): Promise<void>;
  execute(command: EditorCommand): Promise<void>;
  review(command: import("@onodocs/sdk").DocumentReviewCommand): Promise<void>;
  select(selection: DocumentSelection): void;
  find(text: string): readonly DocumentSelection[];
  replaceAll(text: string, replacement: string): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  save(): Promise<Uint8Array<ArrayBuffer>>;
  pdf(): Promise<Uint8Array<ArrayBuffer>>;
  dispose(): void;
}
interface Snapshot {
  readonly mode: EditorMode;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly start: number;
  readonly end: number;
  readonly selection: DocumentSelection;
  readonly formatting: TextFormatting;
}

export function createEditor(options: EditorOptions): WordEditor {
  let mode = options.mode ?? (options.readOnly ? "view" : "edit");
  const allowedModes = [...(options.allowedModes ?? (options.readOnly ? ["view" as const] : ["view" as const, "edit" as const, ...(options.review ? ["review" as const] : []), ...(options.form ? ["form" as const] : [])]))];
  function validateMode(value: EditorMode): void {
    if (!["view", "edit", "review", "form"].includes(value) || !allowedModes.includes(value) || options.readOnly && value !== "view") throw new Error("This document mode is not available.");
    if (value === "review" && !options.review) throw new Error("Review mode requires reviewer options.");
    if (value === "form" && !options.form) throw new Error("Form mode requires a form definition.");
  }
  for (const value of allowedModes) validateMode(value);
  validateMode(mode);
  const host = document.createElement("div"), root = host.attachShadow({ mode: "open" });
  host.className = "onodocs-editor";
  const style = document.createElement("style");
  style.textContent = `
:host{display:block;position:relative;color:var(--onodocs-color,#29313d);background:var(--onodocs-background,#eceef1);font:13px "Segoe UI",Arial,sans-serif}*{box-sizing:border-box}
[hidden]{display:none!important}
:host([data-mode=form]){display:grid;grid-template-columns:minmax(0,1fr) 310px}:host([data-mode=form]) nav,:host([data-mode=form]) footer{grid-column:1/-1}:host([data-mode=form]) main{grid-column:1;grid-row:2;width:calc(100% - 40px)}:host([data-mode=form]) .form-panel{grid-column:2;grid-row:2;align-self:start;margin:28px 16px 28px 0}.form-panel{background:white;border:1px solid #dce1e6;padding:20px;margin:20px auto;max-width:860px}.form-panel label{display:grid;gap:5px;margin:12px 0}.form-panel input,.form-panel select,.form-panel textarea{position:static;opacity:1;width:100%;height:auto;min-height:34px;padding:8px;border:1px solid #a9b5bd}.form-panel textarea{min-height:80px;font:inherit}.form-panel input[type=number]{width:100%}.form-panel select{max-width:none}.form-panel input[type=checkbox]{width:20px}.form-panel small[role=alert]{color:#a32828}.form-panel button{background:#176d60;color:white}
nav{position:sticky;top:0;z-index:5;background:var(--onodocs-toolbar-background,#fff);border-bottom:1px solid #d7dce2;box-shadow:0 2px 5px #25304006;padding:0 16px}
.tool-group{display:flex;align-items:center;gap:3px;padding-right:10px;margin-right:4px;border-right:1px solid #e0e4e9}.tool-group:last-child{border-right:0;margin-right:0;padding-right:0}
.ribbon-header{display:flex;align-items:center;gap:12px;border-bottom:1px solid #e6e9ee;min-height:42px}.quick-access{display:flex;gap:2px;padding-right:10px;border-right:1px solid #e0e4e9}.ribbon-tabs{display:flex;align-self:stretch;gap:2px;overflow-x:auto;scrollbar-width:thin}.ribbon-tabs button{height:100%;min-height:42px;border-radius:0;border-bottom:3px solid transparent;padding:8px 14px 6px}.ribbon-tabs button[aria-selected=true]{color:var(--onodocs-accent,#a33327);border-bottom-color:currentColor;font-weight:600}.ribbon-tabs button[data-context]{color:#346e66}.ribbon-header>select{margin-left:auto;flex:none}.ribbon-panel{display:flex;align-items:stretch;gap:0;min-height:106px;padding:10px 3px 6px;overflow-x:auto;scrollbar-width:thin}.ribbon-panel .tool-group{flex:none;flex-direction:column;justify-content:space-between;align-items:stretch;gap:5px;padding:0 14px;margin:0}.ribbon-panel .tool-group:first-child{padding-left:0}.tool-content{display:flex;flex-direction:column;justify-content:center;gap:4px;flex:1}.tool-line{display:flex;align-items:center;gap:3px}.group-caption{display:block;text-align:center;font-size:11px;color:#687380;line-height:16px}.ribbon-panel .large-button{height:66px;min-width:62px;flex-direction:column;gap:7px;padding:7px 10px}.large-button svg{width:25px;height:25px}.ribbon-panel select[aria-label="Font family"]{width:145px}.ribbon-panel select[aria-label="Paragraph style"]{min-width:150px;max-width:210px;height:54px;font-size:16px}.ribbon-panel select[aria-label="Paragraph alignment"],.ribbon-panel select[aria-label="List"]{width:133px}.ribbon-panel input[type=color]{border-color:#dce1e6}
button,select,input{font:inherit;color:inherit;border:1px solid transparent;border-radius:5px;background:transparent;height:32px;padding:5px 8px}button{display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap}button.icon-button{width:32px;padding:6px}svg{width:18px;height:18px;flex:none;pointer-events:none}button:hover:not(:disabled){background:#f0f2f5}button:disabled{opacity:.32;cursor:default}button[aria-pressed=true]{color:var(--onodocs-accent,#a33327);background:var(--onodocs-selection,#fae9e5)}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--onodocs-accent,#b43829);outline-offset:2px}.ribbon-tabs button:focus-visible{outline-offset:-5px}
select,input{border-color:#dce1e6;background:white}select{max-width:170px}input[type=number]{width:58px}input[type=color]{width:32px;padding:6px;border-color:transparent;cursor:pointer}
main{max-width:860px;margin:28px auto;min-height:300px;box-shadow:0 1px 5px #1e293b18}textarea{position:absolute;width:1px;height:1px;opacity:0;border:0;padding:0;resize:none;overflow:hidden;z-index:2}textarea[aria-label="Document text"]{pointer-events:none}textarea.composing{opacity:1;width:220px;background:white;pointer-events:auto}footer{padding:9px 24px;background:var(--onodocs-toolbar-background,white);border-top:1px solid #dce1e6;color:#66717f;font-size:12px}footer[data-error=true]{color:#a62a24}
dialog{border:1px solid #d7dce2;border-radius:10px;padding:24px;width:380px;max-width:90vw;color:inherit;background:white;box-shadow:0 12px 48px #17212d26}dialog::backdrop{background:#10203055}dialog form{display:grid;gap:14px}dialog h2{margin:0 0 8px;font-size:18px;font-weight:600}dialog label{display:grid;gap:6px}dialog input,dialog input[type=number]{width:100%;height:36px}dialog button{border-color:#dce1e6}dialog button[type=submit]{background:var(--onodocs-accent,#b43829);color:white;border:0}
@media(max-width:900px){:host([data-mode=form]){grid-template-columns:1fr}:host([data-mode=form]) .form-panel{grid-column:1;grid-row:3;margin:16px}nav{padding:0 10px}main{margin:16px 12px}.tool-group{padding-right:6px;margin-right:0}select{max-width:140px}.ribbon-header{gap:6px}.ribbon-tabs button{padding-inline:11px}.ribbon-panel .tool-group{padding-inline:10px}}
@media(max-width:600px){.tool-group{flex:none}nav button,nav input,nav select{height:44px}button.icon-button{width:44px}nav input[type=color]{width:44px}main{margin:12px 8px}.ribbon-header{flex-wrap:wrap;gap:0}.quick-access{border:0;padding:0}.ribbon-tabs{order:2;width:100%;border-top:1px solid #edf0f3}.ribbon-tabs button{min-height:44px;padding-inline:14px}.ribbon-header>select{margin-left:auto}.ribbon-panel{min-height:132px}.ribbon-panel .large-button{height:88px;min-width:76px}.ribbon-panel select[aria-label="Paragraph style"]{height:60px}}
`;
  const toolbar = document.createElement("nav"), preview = document.createElement("main"), input = document.createElement("textarea"), status = document.createElement("footer");
  toolbar.setAttribute("aria-label", "Document tools"); toolbar.setAttribute("part", "toolbar");
  preview.setAttribute("aria-label", "Word document"); preview.setAttribute("part", "pages");
  input.setAttribute("aria-label", "Document text"); input.setAttribute("aria-multiline", "true"); input.spellcheck = false; input.autocomplete = "off";
  status.setAttribute("role", "status"); status.setAttribute("part", "status");
  root.append(style, toolbar, preview, input, status); options.container.append(host);
  const lifetime = new AbortController(), undo: Snapshot[] = [], redo: Snapshot[] = [], controls = new Map<string, HTMLButtonElement | HTMLInputElement | HTMLSelectElement>();
  const ribbonTabs = new Map<string, { button: HTMLButtonElement; panel: HTMLElement; names: readonly string[]; context?: string }>();
  const tableActions = ["insertRow", "insertColumn", "deleteRow", "deleteColumn", "delete"] as const;
  let activeRibbon = "Home";
  let doc: BrowserDocument | undefined, canvas: CanvasDocument | undefined, selection: DocumentSelection | undefined, formatting: TextFormatting = {}, queue = Promise.resolve(), pending = 0, composing = false, disposed = false, filename = "document.docx";
  let formPanel: ReturnType<typeof createFormPanel> | undefined;
  let selectedImage: string | undefined;
  let reviewPanel: ReturnType<typeof createReviewPanel> | undefined;
  let typing: { text: string } | undefined;
  let inputText = "", inputStart = 0, inputEnd = 0;
  let inputParagraphs: { id: string; start: number; length: number }[] = [];
  const objectOutlines: DocumentAttachment[] = [];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const paragraphs = () => requireDocument().query.paragraphs().all();
  const collapsed = (s: DocumentSelection) => s.start.paragraphId === s.end.paragraphId && s.start.offset === s.end.offset;
  const report = (message: string, error = false) => { if (status.textContent !== message) status.textContent = message; status.dataset.error = String(error); };
  function requireDocument(): BrowserDocument { if (disposed) throw new Error("Editor is disposed."); if (!doc) throw new Error("Open a document first."); return doc; }
  function requireSelection(): DocumentSelection { requireDocument(); if (!selection) throw new Error("Select document text first."); return selection; }
  function editable(): void { requireDocument(); if (mode !== "edit") throw new Error("Editing is unavailable in this document mode."); }
  function enqueue<T>(action: () => Promise<T>): Promise<T> {
    typing = undefined;
    pending++; input.setAttribute("aria-busy", "true");
    const result = queue.then(async () => { if (disposed) throw new Error("Editor is disposed."); return action(); });
    queue = result.then(() => {}, error => { if (!disposed) { report(error instanceof Error ? error.message : String(error), true); options.onError?.(error); } }).finally(() => { pending--; if (!disposed) { input.setAttribute("aria-busy", String(pending > 0)); updateToolbar(); } });
    return result;
  }
  function event(action: () => Promise<unknown>): void { void action().catch(error => { if (!disposed) report(error instanceof Error ? error.message : String(error), true); }); }
  function syncInput(): void {
    if (!doc || !selection || composing) return;
    const first = doc.query.get(selection.start.paragraphId);
    if (first?.kind !== "paragraph") return;
    const all = selection.start.paragraphId === selection.end.paragraphId ? [first] : paragraphs();
    const values = all.length === 1 ? all : all.slice(all.findIndex(p => p.id === first.id), all.findIndex(p => p.id === selection!.end.paragraphId) + 1);
    let offset = 0;
    inputParagraphs = values.map(p => { const value = { id: p.id, start: offset, length: p.text.length }; offset += p.text.length + 1; return value; });
    inputText = values.map(p => p.text).join("\n"); inputStart = selection.start.offset; inputEnd = (inputParagraphs.at(-1)?.start ?? 0) + selection.end.offset;
    if (input.value !== inputText) input.value = inputText;
    if (input.selectionStart !== inputStart || input.selectionEnd !== inputEnd) input.setSelectionRange(inputStart, inputEnd);
  }
  function focus(): void { if (selection) canvas?.view?.setSelection(selection); syncInput(); if (mode === "edit") input.focus({ preventScroll: true }); }
  function selectInput(): void {
    if (pending || composing || !selection || !inputParagraphs.length || input.value !== inputText || input.selectionStart === inputStart && input.selectionEnd === inputEnd) return;
    const position = (offset: number) => { const p = inputParagraphs.find(p => offset <= p.start + p.length) ?? inputParagraphs.at(-1)!; return { paragraphId: p.id, offset: Math.min(p.length, Math.max(0, offset - p.start)) }; };
    inputStart = input.selectionStart; inputEnd = input.selectionEnd;
    selection = { start: position(inputStart), end: position(inputEnd) }; formatting = {}; selectedImage = undefined;
    canvas?.view?.setSelection(selection); outlineSelection(); updateToolbar();
  }
  input.addEventListener("select", selectInput);
  input.addEventListener("beforeinput", selectInput);
  input.setAttribute("aria-description", "Edit the current paragraph. Use F6 or Escape for document tools. In tables, Tab and Shift+Tab move between cells.");
  function updateToolbar(): void {
    const paragraph = doc?.query.get(selection?.start.paragraphId ?? ""), inTable = !!paragraph && !!doc!.query.within(paragraph).closest("table").first();
    for (const [name, control] of controls) {
      const reviewControl = name === "review" || name.startsWith("review:");
      control.disabled = !doc && !["open", "new"].includes(name) || mode !== "edit" && !["open", "save", "pdf", "find", "mode"].includes(name) && !reviewControl;
      if (name === "undo") control.disabled = !undo.length || mode === "view" || mode !== "edit" && undo.at(-1)?.mode !== mode;
      if (name === "redo") control.disabled = !redo.length || mode === "view" || mode !== "edit" && redo.at(-1)?.mode !== mode;
      if (name === "imageTools") control.disabled ||= !selectedImage;
      if (name.startsWith("table:")) control.disabled ||= !inTable;
      if (["review:newComment", "review:acceptAll", "review:rejectAll"].includes(name)) control.disabled ||= mode !== "edit" && mode !== "review";
      if (name === "review:tracking") { control.disabled ||= mode !== "edit"; control.setAttribute("aria-pressed", String(!!reviewPanel?.state?.tracking)); }
      if (["review:previousComment", "review:nextComment"].includes(name)) control.disabled ||= !reviewPanel?.state?.comments.some(comment => !comment.parentId && comment.selection);
      if (["review:previousChange", "review:nextChange", "review:acceptAll", "review:rejectAll"].includes(name)) control.disabled ||= !reviewPanel?.state?.revisions.length;
    }
    host.dataset.mode = mode;
    input.readOnly = mode !== "edit";
    input.setAttribute("aria-readonly", String(input.readOnly));
    const modeControl = controls.get("mode"); if (modeControl) { modeControl.value = mode; modeControl.disabled = false; }
    for (const [name, control] of controls) {
      const custom = options.commands?.find(command => command.id === name);
      const reviewControl = name === "review" || name.startsWith("review:");
      const visible = custom ? (custom.modes ?? ["edit"]).includes(mode) : mode === "edit" || ["open", "save", "pdf", "find", "mode", "undo", "redo"].includes(name) || reviewControl;
      if (custom) control.disabled = !doc || !visible;
      control.hidden = !visible || mode === "form" && reviewControl || mode === "view" && ["undo", "redo"].includes(name);
    }
    for (const group of toolbar.querySelectorAll<HTMLElement>(".tool-group,.tool-line,.quick-access")) group.hidden = [...group.querySelectorAll<HTMLElement>("[data-command]")].every(control => control.hidden);
    for (const tab of ribbonTabs.values()) tab.button.hidden = !tab.names.some(name => { const control = controls.get(name); return control && !control.hidden; }) || !!tab.context && !!controls.get(tab.context)?.disabled;
    if (ribbonTabs.size) {
      const current = ribbonTabs.get(activeRibbon), home = ribbonTabs.get("Home");
      selectRibbon(current && !current.button.hidden ? activeRibbon : home && !home.button.hidden ? "Home" : [...ribbonTabs].find(([, tab]) => !tab.button.hidden)?.[0] ?? "File");
    }
    if (formPanel) formPanel.element.hidden = mode !== "form";
    if (!doc || !selection) return;
    const format = currentFormatting();
    for (const name of ["bold", "italic", "underline", "strike"] as const) controls.get(name)?.setAttribute("aria-pressed", String(!!format[name]));
    const values = { font: format.fontFamily ?? options.document?.defaultFont ?? "Calibri", size: String(format.fontSize ?? 11), color: format.color ?? "#000000", alignment: paragraph?.kind === "paragraph" ? paragraph.alignment : "left", style: paragraph?.kind === "paragraph" ? paragraph.style ?? "" : "", list: paragraph?.kind === "paragraph" && paragraph.list ? paragraph.list.kind === "bullet" ? "bullet" : "decimal" : "" };
    values.style = doc.semantic.policyViews.textFormatting.domains.flatMap(domain => domain.paragraphStyles).find(style => style.paragraphContextualStyleId === values.style)?.styleId ?? values.style;
    for (const [name, value] of Object.entries(values)) { const control = controls.get(name); if (control && root.activeElement !== control) { if (name === "font" && control instanceof HTMLSelectElement && ![...control.options].some(o => o.value === value)) control.add(new Option(value)); control.value = value; } }
    input.style.fontFamily = values.font; input.style.fontSize = `${values.size}pt`;
  }
  function currentFormatting(): TextFormatting {
    const p = doc?.query.get(selection?.start.paragraphId ?? "");
    let offset = 0, chosen: TextFormatting = {};
    if (p) for (const run of doc!.query.within(p).runs()) { chosen = run.formatting; offset += run.text.length; if (offset > selection!.start.offset || collapsed(selection!) && offset === selection!.start.offset) break; }
    return { ...chosen, ...formatting };
  }
  async function snapshot(): Promise<Snapshot> { const range = requireSelection(), all = paragraphs(); return { mode, bytes: await requireDocument().save({ fields: "preserve" }), start: all.findIndex(p => p.id === range.start.paragraphId), end: all.findIndex(p => p.id === range.end.paragraphId), selection: range, formatting: { ...formatting } }; }
  async function mount(bytes: ArrayBuffer | Uint8Array | Blob): Promise<void> {
    const next = await openDocument(bytes, { commentDisplay: "hidden", ...(options.review ? { revisionView: "accepted" as const } : {}), ...options.document, signal: options.document?.signal ? AbortSignal.any([options.document.signal, lifetime.signal]) : lifetime.signal });
    if (disposed) { next.dispose(); throw new Error("Editor is disposed."); }
    for (const outline of objectOutlines.splice(0)) outline.dispose(); selectedImage = undefined;
    canvas?.dispose(); doc?.dispose(); doc = next;
    canvas = createDocument(doc, { container: preview, viewOptions: { zoom: "fit-width", input, onSelectionChange(next) { if (pending || composing) return; if (JSON.stringify(next) !== JSON.stringify(selection)) formatting = {}; selection = next; selectedImage = undefined; syncInput(); outlineSelection(); updateToolbar(); } } });
    formPanel?.element.remove(); formPanel = undefined;
    if (options.form) {
      const form = createForm(next, options.form);
      formPanel = createFormPanel({ ...form, fill: answers => result.fill(answers), complete: () => result.completeForm(), answers: () => result.answers() }, field => {
        const control = requireDocument().query.contentControls().where({ tag: field.tag }).first();
        const paragraph = control && (requireDocument().query.within(control).paragraphs().first() ?? requireDocument().query.within(control).closest("paragraph").first());
        if (paragraph) result.select({ start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } });
      }, options.onFormComplete);
      root.append(formPanel.element);
    }
    const first = paragraphs()[0]; selection = first ? { start: { paragraphId: first.id, offset: 0 }, end: { paragraphId: first.id, offset: 0 } } : undefined;
    const styles = controls.get("style") as HTMLSelectElement | undefined;
    if (styles && !options.styles) { styles.replaceChildren(new Option("Default paragraph", "")); for (const policy of doc.semantic.policyViews.textFormatting.domains.flatMap(domain => domain.paragraphStyles)) if (policy.styleType === "paragraph") styles.add(new Option(policy.styleId, policy.styleId)); }
    await reviewPanel?.refresh();
  }
  async function apply(command: EditorCommand): Promise<void> {
    editable(); const previous = await snapshot(), before = paragraphs(), edit = { ...command, selection: requireSelection() } as DocumentEdit;
    const imageIndex = selectedImage ? requireDocument().query.images().all().findIndex(image => image.id === selectedImage) : -1;
    const review = options.review ? await requireDocument().readReview() : undefined;
    if (review?.tracking && command.kind !== "replace" && command.kind !== "format") throw new Error("Stop tracking before changing document structure.");
    if (review?.tracking && command.kind === "format") {
      const range = requireSelection(), all = paragraphs(), index = all.findIndex(p => p.id === range.start.paragraphId), endIndex = all.findIndex(p => p.id === range.end.paragraphId);
      await requireDocument().review({ kind: "trackedFormat", selection: range, formatting: command.formatting, identity: options.review!.identity() });
      selection = { start: { ...range.start, paragraphId: paragraphs()[index]!.id }, end: { ...range.end, paragraphId: paragraphs()[endIndex]!.id } };
    } else if (review && command.kind === "replace" && (review.tracking || review.comments.length || review.revisions.length)) {
      const range = requireSelection(), index = paragraphs().findIndex(p => p.id === range.start.paragraphId);
      await requireDocument().review(review.tracking ? { kind: "trackedReplace", selection: range, text: command.text, identity: options.review!.identity() } : { kind: "replaceText", selection: range, text: command.text });
      const caret = { paragraphId: paragraphs()[index]!.id, offset: range.start.offset + command.text.length }; selection = { start: caret, end: caret };
    } else selection = await requireDocument().edit({ ...command, selection: requireSelection() } as DocumentEdit);
    if (command.kind === "replace" || command.kind === "paste") formatting = {};
    selectedImage = command.kind === "imageProperties" && !command.remove ? requireDocument().query.images().at(imageIndex)?.id : undefined;
    outlineSelection();
    undo.push(previous); redo.length = 0; focus(); updateToolbar(); report("Document changed."); await options.onChange?.(result, { edit, paragraphs: before });
    await reviewPanel?.refresh();
  }
  function outlineSelection(): void {
    for (const outline of objectOutlines.splice(0)) outline.dispose();
    const paragraph = doc?.query.get(selection?.start.paragraphId ?? "");
    const target = selectedImage ? doc?.query.get(selectedImage) : paragraph && doc!.query.within(paragraph).closest("table").first();
    if (!target || !canvas?.view) return;
    for (const fragment of doc!.geometry.fragments(target)) {
      const outline = document.createElement("div"); outline.setAttribute("aria-hidden", "true");
      Object.assign(outline.style, { width: "100%", height: "100%", outline: "2px solid var(--onodocs-accent,#b43829)", outlineOffset: "1px", pointerEvents: "none" });
      objectOutlines.push(canvas.view.attach(outline, { anchor: fragment, interactive: false }));
    }
  }
  function selectObject(e: PointerEvent): void {
    if (e.type === "pointerdown" && e.pointerType === "touch" || e.type === "click" && e.pointerType !== "touch") return;
    if (e.button !== 0 || pending || !doc || !canvas?.view || (e.target as Element).closest("button,input,textarea,select,a")) return;
    const hit = canvas.view.hitTest({ x: e.clientX, y: e.clientY }), target = hit && doc.query.get(hit.elementId);
    selectedImage = undefined;
    if (target?.kind === "image" || target?.kind === "cell" || target?.kind === "table") {
      const paragraph = target.kind === "image" ? doc.query.within(target).closest("paragraph").first() : doc.query.within(target).paragraphs().first();
      if (paragraph) {
        e.preventDefault(); e.stopPropagation();
        selection = { start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: 0 } };
        focus(); selectedImage = target.kind === "image" ? target.id : undefined; outlineSelection(); updateToolbar();
        report(target.kind === "image" ? "Image selected. Use Image properties to resize or delete it." : "Table selected. Use Table tools to change rows and columns.");
      }
    } else outlineSelection();
  }
  preview.addEventListener("pointerdown", selectObject, { capture: true });
  preview.addEventListener("click", selectObject, { capture: true });
  async function history(direction: "undo" | "redo"): Promise<void> {
    requireDocument(); const from = direction === "undo" ? undo : redo, to = direction === "undo" ? redo : undo, entry = from.at(-1);
    if (mode === "view" || mode !== "edit" && entry && entry.mode !== mode) throw new Error("This history operation is unavailable in the current mode.");
    if (!entry) return;
    const previous = await snapshot(); await mount(entry.bytes);
    const all = paragraphs(); selection = { start: { paragraphId: all[entry.start]!.id, offset: entry.selection.start.offset }, end: { paragraphId: all[entry.end]!.id, offset: entry.selection.end.offset } };
    formatting = entry.formatting; from.pop(); to.push({ ...previous, mode: entry.mode }); focus(); await options.onChange?.(result, {});
  }
  async function replace(text: string, paragraphBreaks = true): Promise<void> { await apply({ kind: "replace", text, paragraphBreaks, ...(Object.keys(formatting).length ? { formatting } : {}) }); }
  async function remove(backward: boolean, word = false): Promise<void> {
    if (selectedImage) return apply({ kind: "imageProperties", imageId: selectedImage, remove: true });
    const range = requireSelection(); if (!collapsed(range)) return replace("");
    const all = paragraphs(), index = all.findIndex(p => p.id === range.start.paragraphId), p = all[index]!, offset = range.start.offset;
    if (backward && offset === 0) { if (!index || all[index - 1]!.parent !== p.parent) return; selection = { start: { paragraphId: all[index - 1]!.id, offset: all[index - 1]!.text.length }, end: range.end }; }
    else if (!backward && offset === p.text.length) { if (index === all.length - 1 || all[index + 1]!.parent !== p.parent) return; selection = { start: range.start, end: { paragraphId: all[index + 1]!.id, offset: 0 } }; }
    else { const units = word ? new Intl.Segmenter(undefined, { granularity: "word" }) : segmenter, boundaries = [...units.segment(p.text)].map(s => s.index).concat(p.text.length), next = backward ? boundaries.filter(n => n < offset).at(-1) ?? 0 : boundaries.find(n => n > offset) ?? p.text.length; selection = { start: { paragraphId: p.id, offset: backward ? next : offset }, end: { paragraphId: p.id, offset: backward ? offset : next } }; }
    await replace("");
  }
  function format(value: TextFormatting): Promise<void> { return enqueue(async () => { editable(); if (collapsed(requireSelection())) { formatting = { ...formatting, ...value }; focus(); } else { await apply({ kind: "format", formatting: value }); formatting = {}; } }); }
  input.addEventListener("beforeinput", e => { if (mode !== "edit") { e.preventDefault(); return; } if (e.isComposing || composing) return; e.preventDefault(); if (e.inputType === "insertText") { if (typing) typing.text += e.data ?? ""; else { const batch = { text: e.data ?? "" }; event(() => enqueue(async () => { if (typing === batch) typing = undefined; await replace(batch.text); })); typing = batch; } return; } event(() => enqueue(async () => { if ( e.inputType === "insertReplacementText") await replace(e.data ?? ""); else if (e.inputType === "insertParagraph") await replace("\n"); else if (e.inputType === "insertLineBreak") await replace("\n", false); else if (e.inputType.startsWith("delete")) await remove(e.inputType.includes("Backward"), e.inputType.includes("Word")); else if (e.inputType === "historyUndo") await history("undo"); else if (e.inputType === "historyRedo") await history("redo"); })); });
  input.addEventListener("paste", e => {
    e.preventDefault();
    if (mode !== "edit") return;
    const html = e.clipboardData?.getData("text/html") ?? "", text = e.clipboardData?.getData("text/plain") ?? "";
    event(() => enqueue(async () => {
      const content = html ? readClipboard(html) : undefined;
      if (content?.paragraphs.length) { await apply({ kind: "paste", paragraphs: content.paragraphs }); if (content.convertedObjects) report("Pasted formatted text. Tables and images were converted to text."); }
      else if (text) await replace(text);
    }));
  });
  for (const kind of ["copy", "cut"] as const) input.addEventListener(kind, e => {
    if (!selection || collapsed(selection) || !e.clipboardData) return;
    e.preventDefault();
    if (pending) return;
    const content = writeClipboard(requireDocument().query, selection);
    e.clipboardData.setData("text/plain", content.text); e.clipboardData.setData("text/html", content.html);
    if (kind === "cut" && mode === "edit") event(() => enqueue(() => replace("")));
  });
  let compositionSelection: DocumentSelection | undefined;
  input.addEventListener("compositionstart", () => { if (mode !== "edit") return; selectInput(); composing = true; compositionSelection = selection; if (pending) event(() => enqueue(async () => { compositionSelection = selection; })); input.classList.add("composing"); });
  input.addEventListener("compositionend", e => { if (!composing) return; composing = false; input.classList.remove("composing"); if (!e.data) { selection = compositionSelection; focus(); return; } event(() => enqueue(async () => { selection = compositionSelection; await replace(e.data); })); });
  input.addEventListener("keydown", e => {
    if (e.isComposing || mode !== "edit") return;
    const command = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
    if (command && ["b", "i", "u"].includes(key)) { e.preventDefault(); const property = ({ b: "bold", i: "italic", u: "underline" } as const)[key as "b" | "i" | "u"]; event(() => format({ [property]: !currentFormatting()[property] })); }
    else if (command && (key === "z" || key === "y")) { e.preventDefault(); event(() => enqueue(() => history(key === "y" || e.shiftKey ? "redo" : "undo"))); }
    else if (e.key === "Enter") { e.preventDefault(); event(() => enqueue(() => replace("\n", !e.shiftKey))); }
    else if (e.key === "Tab") {
      const doc = requireDocument(), paragraph = selection && doc.query.get(selection.start.paragraphId), cell = paragraph && doc.query.within(paragraph).closest("cell").first();
      if (cell && !command) {
        e.preventDefault(); event(() => enqueue(async () => {
          const doc = requireDocument(), paragraph = selection && doc.query.get(selection.start.paragraphId), current = paragraph && doc.query.within(paragraph).closest("cell").first();
          if (!current) return;
          const cells = current.parent.parent.rows.flatMap(row => row.cells), index = cells.findIndex(cell => cell.id === current.id);
          let target = cells[index + (e.shiftKey ? -1 : 1)];
          if (!target && !e.shiftKey) {
            await apply({ kind: "table", action: "insertRow" });
            const doc = requireDocument(), paragraph = doc.query.get(selection!.start.paragraphId)!;
            const table = doc.query.within(paragraph).closest("table").first()!;
            target = table.rows.at(-1)?.cells[0];
          }
          const next = target && requireDocument().query.within(target).paragraphs().first();
          if (next) result.select({ start: { paragraphId: next.id, offset: 0 }, end: { paragraphId: next.id, offset: next.text.length } });
        }));
      } else if (!e.shiftKey) { e.preventDefault(); event(() => enqueue(() => replace("\t", false))); }
    }
  });
  host.addEventListener("keydown", e => {
    if (e.key === "Escape" && root.activeElement === input || e.key === "F6") {
      if (composing || root.querySelector("dialog[open]")) return;
      e.preventDefault();
      if (toolbar.contains(root.activeElement)) focus();
      else if (ribbonTabs.size) ribbonTabs.get(activeRibbon)?.button.focus();
      else [...controls.values()].find(control => !control.disabled && !control.closest("[hidden]"))?.focus();
    }
  });
  toolbar.addEventListener("mousedown", e => { if ((e.target as Element).closest("button")) e.preventDefault(); });
  function button(name: string, label: string, action: () => Promise<unknown>): void { const control = document.createElement("button"); control.type = "button"; control.textContent = label; control.addEventListener("click", () => event(action)); controls.set(name, control); }
  function select(name: string, label: string, choices: readonly Readonly<{ value: string; label: string }>[], action: (value: string) => Promise<unknown>): void { const control = document.createElement("select"); control.setAttribute("aria-label", label); for (const choice of choices) control.add(new Option(choice.label, choice.value)); control.addEventListener("change", () => event(() => action(control.value))); controls.set(name, control); }
  function field(name: string, label: string, type: string, value: string, action: (value: string) => Promise<unknown>): void { const control = document.createElement("input"); control.type = type; control.value = value; control.setAttribute("aria-label", label); if (type === "number") { control.min = "0.5"; control.step = "0.5"; } control.addEventListener("change", () => event(() => action(control.value))); controls.set(name, control); }
  function form(title: string, fields: readonly Readonly<{ name: string; label: string; value?: string; type?: string; step?: string }>[], submit: (values: Readonly<Record<string, string>>) => Promise<unknown>, remove?: () => Promise<unknown>): Promise<void> {
    const dialog = document.createElement("dialog"), form = document.createElement("form"), heading = document.createElement("h2"); heading.textContent = title; dialog.setAttribute("aria-label", title); form.append(heading);
    for (const field of fields) { const label = document.createElement("label"), input = document.createElement("input"); label.textContent = field.label; input.name = field.name; input.type = field.type ?? "text"; if (input.type === "number") input.step = field.step ?? "any"; input.value = field.value ?? ""; label.append(input); form.append(label); }
    const apply = document.createElement("button"), cancel = document.createElement("button"); apply.type = "submit"; apply.textContent = "Apply"; cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", () => dialog.close()); form.append(apply, cancel); if (remove) { const button = document.createElement("button"); button.type = "button"; button.textContent = "Delete image"; button.addEventListener("click", () => { dialog.close(); event(remove); }); form.append(button); } dialog.append(form); root.append(dialog);
    form.addEventListener("submit", e => { e.preventDefault(); const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)])); dialog.close(); event(() => submit(values)); });
    dialog.addEventListener("close", () => { dialog.remove(); focus(); }); dialog.showModal(); return Promise.resolve();
  }
  function fieldNotice(fields: readonly import("@onodocs/sdk").DocumentFieldStatus[]) { const pending = fields.filter(field => field.status === "unsupported" || field.status === "requires-layout"); if (pending.length) report(`Exported with cached fields: ${pending.map(field => field.command).join(", ")}. Update these fields in Word.`, true); }
  async function download(pdf: boolean): Promise<void> { const bytes = pdf ? await result.pdf() : await result.save(), url = URL.createObjectURL(new Blob([bytes], { type: pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename.replace(/\.docx$/i, "") + (pdf ? ".pdf" : ".docx"); anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  button("open", "Open Word", async () => { const picker = document.createElement("input"); picker.type = "file"; picker.accept = ".docx"; picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) event(() => result.open(file, file.name)); }); picker.click(); });
  button("new", "New document", () => result.newDocument());
  button("save", "Download Word", () => download(false)); button("pdf", "Download PDF", () => download(true));
  button("undo", "Undo", () => result.undo()); button("redo", "Redo", () => result.redo());
  for (const [name, label] of [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"], ["strike", "Strikethrough"]] as const) button(name, label, () => format({ [name]: !currentFormatting()[name] }));
  select("font", "Font family", (options.fonts ?? ["Arial", "Calibri", "Times New Roman", "Georgia", "Verdana", "Courier New"]).map(value => ({ value, label: value })), value => format({ fontFamily: value }));
  field("size", "Font size", "number", "12", value => format({ fontSize: Number(value) })); field("color", "Text color", "color", "#202b38", value => format({ color: value }));
  select("alignment", "Paragraph alignment", [{ value: "left", label: "Align left" }, { value: "center", label: "Center" }, { value: "right", label: "Align right" }, { value: "both", label: "Justify" }], value => result.execute({ kind: "align", alignment: value as "left" | "center" | "right" | "both" }));
  select("style", "Paragraph style", (options.styles ?? []).map(s => ({ value: s.id, label: s.label })), value => result.execute({ kind: "style", style: value || null }));
  select("list", "List", [{ value: "", label: "No list" }, { value: "bullet", label: "Bullets" }, { value: "decimal", label: "Numbering" }], value => result.execute({ kind: "list", list: value as "bullet" | "decimal" || null }));
  button("table", "Insert table", () => form("Insert table", [{ name: "rows", label: "Rows", value: "2", type: "number", step: "1" }, { name: "columns", label: "Columns", value: "2", type: "number", step: "1" }], v => result.execute({ kind: "insertTable", rows: Number(v.rows), columns: Number(v.columns) })));
  for (const action of tableActions) button(`table:${action}`, ({ insertRow: "Insert row below", insertColumn: "Insert column right", deleteRow: "Delete row", deleteColumn: "Delete column", delete: "Delete table" })[action], () => result.execute({ kind: "table", action }));
  button("imageTools", "Image properties", async () => {
    const image = selectedImage && requireDocument().query.get(selectedImage); if (!image || image.kind !== "image") return;
    await form("Image properties", [{ name: "width", label: "Width (points)", type: "number", value: String(image.width) }, { name: "height", label: "Height (points)", type: "number", value: String(image.height) }], values => result.execute({ kind: "imageProperties", imageId: image.id, width: Number(values.width), height: Number(values.height) }), () => result.execute({ kind: "imageProperties", imageId: image.id, remove: true }));
  });
  button("link", "Link", () => form("Link selected text", [{ name: "target", label: "URL or #bookmark (empty removes link)" }], v => result.execute({ kind: "link", target: v.target || null })));
  button("image", "Insert image", async () => { const picker = document.createElement("input"); picker.type = "file"; picker.accept = "image/png,image/jpeg"; picker.addEventListener("change", () => { const file = picker.files?.[0]; if (!file) return; event(async () => { const bitmap = await createImageBitmap(file); const width = Math.min(bitmap.width * .75, 432), height = width * bitmap.height / bitmap.width; bitmap.close(); await form("Insert image after paragraph", [{ name: "width", label: "Width (points)", type: "number", value: String(width) }, { name: "height", label: "Height (points)", type: "number", value: String(height) }, { name: "description", label: "Image description" }], async v => result.execute({ kind: "image", bytes: new Uint8Array(await file.arrayBuffer()), mediaType: file.type as "image/png" | "image/jpeg", width: Number(v.width), height: Number(v.height), description: v.description ?? "" })); }); }); picker.click(); });
  button("page", "Page settings", () => {
    const document = requireDocument();
    const section = document.layout.sections.find(section => section.transitionIndex === selectedSectionIndex());
    const size = section?.page;
    return form("Page settings", [{ name: "width", label: "Width (points)", value: String(Number(size?.width ?? 11906n) / 20), type: "number" }, { name: "height", label: "Height (points)", value: String(Number(size?.height ?? 16838n) / 20), type: "number" }, ...(["top", "right", "bottom", "left"] as const).map(name => ({ name, label: `${name} margin (points)`, value: String(Number(section?.margins[name] ?? 1440n) / 20), type: "number" }))], v => result.execute({ kind: "page", width: Number(v.width), height: Number(v.height), margins: { top: Number(v.top), right: Number(v.right), bottom: Number(v.bottom), left: Number(v.left) } }));
  });
  for (const kind of ["header", "footer"] as const) button(kind, kind === "header" ? "Header" : "Footer", () => {
    const document = requireDocument(), section = document.semantic.headerFooterSectionIntents.find(section => section.sectionIndex === selectedSectionIndex());
    const story = section?.slots.find(slot => slot.kind === kind && slot.variant === "default")?.story;
    return form(`Set default ${kind}`, [{ name: "text", label: "Text", value: story ? document.query.get(story.scopeId.serialized)?.text ?? "" : "" }], v => result.execute({ kind, text: v.text ?? "" }));
  });
  function selectedSectionIndex(): number | undefined {
    const document = requireDocument(), paragraph = document.query.get(requireSelection().start.paragraphId);
    return document.semantic.sectionPageIntent.transitions.find(section => section.sourceOrder >= (paragraph?.source?.ordinal ?? 0n))?.index;
  }
  button("find", "Find", () => form("Find text", [{ name: "text", label: "Search text" }], async v => { const matches = result.find(v.text ?? ""); if (matches[0]) result.select(matches[0]); report(`${matches.length} matches.`); }));
  button("replace", "Replace", () => form("Replace all", [{ name: "text", label: "Search text" }, { name: "replacement", label: "Replacement" }], v => result.replaceAll(v.text ?? "", v.replacement ?? "")));
  if (options.review) {
    button("review", "Show comments", async () => reviewPanel?.show("comments"));
    button("review:newComment", "New comment", async () => reviewPanel?.newComment());
    for (const [kind, label] of [["comment", "Comment"], ["change", "Change"]] as const) for (const [direction, step] of [["previous", -1], ["next", 1]] as const) button(`review:${direction}${label}`, `${direction === "previous" ? "Previous" : "Next"} ${kind}`, async () => reviewPanel?.navigate(kind, step));
    button("review:tracking", "Track changes", async () => { const state = await requireDocument().readReview(); await result.review({ kind: "trackChanges", enabled: !state.tracking }); });
    button("review:changes", "Show changes", async () => reviewPanel?.show("changes"));
    button("review:acceptAll", "Accept all changes", () => result.review({ kind: "revision", accept: true }));
    button("review:rejectAll", "Reject all changes", () => result.review({ kind: "revision", accept: false }));
    button("review:compare", "Compare documents", async () => reviewPanel?.show("compare"));
    if (options.review.history) button("review:history", "Version history", async () => reviewPanel?.show("history"));
  }
  for (const command of options.commands ?? []) button(command.id, command.label, async () => { if (!(command.modes ?? ["edit"]).includes(mode)) throw new Error("This command is unavailable in the current mode."); await command.execute(result); });
  select("mode", "Document mode", allowedModes.map(value => ({ value, label: ({ view: "Viewing", edit: "Editing", review: "Reviewing", form: "Filling form" })[value] })), async value => { try { await result.setMode(value as EditorMode); } finally { controls.get("mode")!.value = mode; } });
  const shortcuts: Readonly<Record<string, string>> = { bold: "Ctrl+B", italic: "Ctrl+I", underline: "Ctrl+U", undo: "Ctrl+Z", redo: "Ctrl+Y" };
  const toolLabels: Readonly<Record<string, string>> = { new: "New", open: "Open", save: "Word", pdf: "PDF", table: "Table", image: "Pictures", page: "Page setup", imageTools: "Size & properties", review: "Comments & changes" };
  const enabledTools = new Set(options.toolbar === false ? [] : options.toolbar ?? controls.keys());
  if (enabledTools.has("tableTools")) for (const action of tableActions) enabledTools.add(`table:${action}`);
  if (enabledTools.has("review")) for (const name of controls.keys()) if (name.startsWith("review:")) enabledTools.add(name);
  function appendTool(parent: HTMLElement, name: string, large = false): void {
    const control = controls.get(name); if (!control || !enabledTools.has(name)) return;
    const label = control.getAttribute("aria-label") ?? control.textContent ?? name;
    control.title = label + (shortcuts[name] ? ` (${shortcuts[name]})` : "");
    control.dataset.command = name;
    if (control instanceof HTMLButtonElement) {
      control.setAttribute("aria-label", label);
      const markup = editorIcons[options.commands?.find(command => command.id === name)?.ribbon?.icon ?? name] ?? (name.startsWith("table:") ? editorIcons.tableTools : name.startsWith("review:") ? editorIcons.review : undefined);
      if (markup) {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" })) icon.setAttribute(key, value);
        icon.innerHTML = markup;
        control.replaceChildren(icon);
        const labeled = large || name === "find" || name === "replace" || name === "review" || name.startsWith("review:");
        if (labeled) { const text = document.createElement("span"); text.textContent = toolLabels[name] ?? label; control.append(text); }
        if (large || !labeled) control.classList.add(large ? "large-button" : "icon-button");
      }
    }
    parent.append(control);
  }
  function selectRibbon(name: string, focusTab = false): void {
    activeRibbon = name;
    for (const [key, tab] of ribbonTabs) {
      const active = key === name && !tab.button.hidden;
      tab.button.setAttribute("aria-selected", String(active)); tab.button.tabIndex = active ? 0 : -1; tab.panel.hidden = !active;
      if (active && focusTab) { tab.button.focus({ preventScroll: true }); tab.button.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    }
  }
  if (options.toolbar !== false) {
    const header = document.createElement("div"), quick = document.createElement("div"), tabs = document.createElement("div");
    header.className = "ribbon-header"; quick.className = "quick-access"; quick.setAttribute("role", "group"); quick.setAttribute("aria-label", "History");
    appendTool(quick, "undo"); appendTool(quick, "redo");
    tabs.className = "ribbon-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Ribbon tabs");
    header.append(quick, tabs);
    if (options.allowedModes && allowedModes.length > 1) { enabledTools.add("mode"); appendTool(header, "mode"); }
    toolbar.append(header);
    const definitions = [
      { name: "File", groups: [{ label: "Document", rows: [["new", "open"]] }, { label: "Download", rows: [["save", "pdf"]] }] },
      { name: "Home", groups: [{ label: "Font", rows: [["font", "size"], ["bold", "italic", "underline", "strike", "color"]] }, { label: "Paragraph", rows: [["list"], ["alignment"]] }, { label: "Styles", rows: [["style"]] }, { label: "Editing", rows: [["find"], ["replace"]] }, { label: "Commands", rows: [(options.commands ?? []).filter(command => !command.ribbon).map(command => command.id)] }] },
      { name: "Insert", groups: [{ label: "Tables", rows: [["table"]] }, { label: "Illustrations", rows: [["image"]] }, { label: "Links", rows: [["link"]] }, { label: "Header & footer", rows: [["header", "footer"]] }] },
      { name: "Layout", groups: [{ label: "Page setup", rows: [["page"]] }] },
      { name: "Review", groups: [{ label: "Comments", rows: [["review:newComment", "review"], ["review:previousComment", "review:nextComment"]] }, { label: "Tracking", rows: [["review:tracking"], ["review:changes"]] }, { label: "Changes", rows: [["review:acceptAll", "review:rejectAll"], ["review:previousChange", "review:nextChange"]] }, { label: "Compare", rows: [["review:compare"], ["review:history"]] }] },
      { name: "Table", context: "table:insertRow", groups: [{ label: "Insert", rows: [["table:insertRow", "table:insertColumn"]] }, { label: "Delete", rows: [["table:deleteRow", "table:deleteColumn", "table:delete"]] }] },
      { name: "Picture", context: "imageTools", groups: [{ label: "Picture", rows: [["imageTools"]] }] },
    ];
    for (const command of options.commands ?? []) {
      if (!command.ribbon) continue;
      let tab = definitions.find(tab => tab.name === command.ribbon!.tab);
      if (!tab) { tab = { name: command.ribbon.tab, groups: [] }; definitions.push(tab); }
      let group = tab.groups.find(group => group.label === command.ribbon!.group);
      if (!group) { group = { label: command.ribbon.group, rows: [[]] }; tab.groups.push(group); }
      group.rows[0]!.push(command.id);
    }
    for (const definition of definitions) {
      const names = definition.groups.flatMap(group => group.rows.flat()).filter(name => controls.has(name) && enabledTools.has(name));
      if (!names.length) continue;
      const tab = document.createElement("button"), panel = document.createElement("div");
      const id = String(ribbonTabs.size);
      tab.type = "button"; tab.textContent = definition.name; tab.id = `ribbon-tab-${id}`; tab.setAttribute("role", "tab"); tab.setAttribute("aria-label", definition.name); tab.setAttribute("aria-controls", `ribbon-panel-${id}`);
      if (definition.context) tab.dataset.context = definition.context;
      panel.id = `ribbon-panel-${id}`; panel.className = "ribbon-panel"; panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id);
      panel.addEventListener("focusin", event => {
        if (!(event.target instanceof HTMLElement)) return;
        const control = event.target.getBoundingClientRect(), viewport = panel.getBoundingClientRect();
        if (control.left < viewport.left + 4) panel.scrollLeft += control.left - viewport.left - 4;
        else if (control.right > viewport.right - 4) panel.scrollLeft += control.right - viewport.right + 4;
      });
      tab.addEventListener("click", () => selectRibbon(definition.name, true));
      ribbonTabs.set(definition.name, { button: tab, panel, names, ...(definition.context ? { context: definition.context } : {}) });
      tabs.append(tab); toolbar.append(panel);
      for (const definitionGroup of definition.groups) {
        const group = document.createElement("div"), content = document.createElement("div"), caption = document.createElement("span");
        group.className = "tool-group"; group.setAttribute("role", "group"); group.setAttribute("aria-label", definitionGroup.label); content.className = "tool-content"; caption.className = "group-caption"; caption.textContent = definitionGroup.label;
        for (const names of definitionGroup.rows) {
          const row = document.createElement("div"); row.className = "tool-line";
          for (const name of names) appendTool(row, name, definition.name !== "Home" && definition.name !== "Review");
          if (row.children.length) content.append(row);
        }
        if (content.children.length) { group.append(content, caption); panel.append(group); }
      }
    }
    tabs.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      const visible = [...ribbonTabs].filter(([, tab]) => !tab.button.hidden), index = visible.findIndex(([, tab]) => tab.button === e.target);
      if (index < 0) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? visible.length - 1 : (index + (e.key === "ArrowLeft" ? -1 : 1) + visible.length) % visible.length;
      selectRibbon(visible[next]![0], true);
    });
  }
  if (!toolbar.children.length) toolbar.hidden = true;
  const result: WordEditor = {
    get view() { return canvas?.view; },
    synchronize(load) { return enqueue(async () => {
      if (composing) return;
      const before = paragraphs(), range = selection, start = before.findIndex(p => p.id === range?.start.paragraphId), end = before.findIndex(p => p.id === range?.end.paragraphId);
      const next = await load();
      if (!next) return;
      if (next.allowedModes) {
        const previous = [...allowedModes]; allowedModes.splice(0, allowedModes.length, ...next.allowedModes);
        try { if (!allowedModes.length) throw new Error("At least one mode is required."); for (const value of allowedModes) validateMode(value); }
        catch (error) { allowedModes.splice(0, allowedModes.length, ...previous); throw error; }
        if (!allowedModes.includes(mode)) mode = allowedModes[0]!;
        const control = controls.get("mode");
        if (control instanceof HTMLSelectElement) control.replaceChildren(...allowedModes.map(value => new Option(value[0]!.toUpperCase() + value.slice(1), value)));
      }
      if (next.bytes) {
        await mount(next.bytes); undo.length = 0; redo.length = 0; formatting = {};
        const all = paragraphs(), first = all[start], last = all[end];
        if (range && first && last) selection = { start: { paragraphId: first.id, offset: Math.min(range.start.offset, first.text.length) }, end: { paragraphId: last.id, offset: Math.min(range.end.offset, last.text.length) } };
      }
      outlineSelection(); updateToolbar(); await reviewPanel?.setMode();
      if (selection) canvas?.view?.setSelection(selection);
    }); },
    get mode() { return mode; }, get allowedModes() { return allowedModes; },
    async setMode(next) {
      validateMode(next);
      if (composing) throw new Error("Finish composing text before changing mode.");
      await formPanel?.flush();
      return enqueue(async () => { if (composing) throw new Error("Finish composing text before changing mode."); if (next === mode) return; mode = next; if (mode === "form") formPanel?.refresh(); input.value = ""; input.blur(); selectedImage = undefined; outlineSelection(); updateToolbar(); await reviewPanel?.setMode(); report(({ view: "Viewing document.", edit: "Editing document.", review: "Reviewing document.", form: "Filling designated answer regions." })[mode]); options.onModeChange?.(mode); });
    },
    fill(answers) { return enqueue(async () => {
      if (mode !== "form" || !options.form) throw new Error("Answers can only be changed in form mode.");
      const previous = await snapshot();
      await createForm(requireDocument(), options.form).fill(answers, { signal: lifetime.signal });
      undo.push(previous); redo.length = 0; formPanel?.refresh(); await options.onChange?.(result, {});
    }); },
    answers() { if (!options.form) throw new Error("This editor has no form definition."); return createForm(requireDocument(), options.form).answers(); },
    async completeForm() { await formPanel?.flush(); return enqueue(async () => { if (mode !== "form" || !options.form) throw new Error("Completion requires form mode."); return createForm(requireDocument(), options.form).complete({ signal: lifetime.signal }); }); },
    get document() { return doc; }, get selection() { return selection; }, element: host,
    open(bytes, name = "document.docx") { return enqueue(async () => { await mount(bytes); filename = name; undo.length = 0; redo.length = 0; formatting = {}; focus(); report("Ready."); }); },
    restore(bytes) { return enqueue(async () => { editable(); const previous = await snapshot(); await mount(bytes); undo.push(previous); redo.length = 0; formatting = {}; focus(); await options.onChange?.(result, {}); report("Version restored."); }); },
    newDocument() { return enqueue(async () => { if (mode !== "edit") throw new Error("Creating a document requires editing mode."); await mount(await createDocumentPackage(lifetime.signal)); filename = "document.docx"; undo.length = 0; redo.length = 0; formatting = {}; focus(); report("Ready."); }); },
    execute(command) { return enqueue(() => apply(command)); },
    review(command) { return enqueue(async () => {
      requireDocument();
      if (mode !== "edit" && (mode !== "review" || !["comment", "reply", "resolveComment", "deleteComment", "revision"].includes(command.kind))) throw new Error("This review action is unavailable in the current mode.");
      const previous = await snapshot(), before = paragraphs();
      await requireDocument().review(command);
      const all = paragraphs(), paragraph = all[Math.min(previous.start, all.length - 1)];
      if (paragraph) { const caret = { paragraphId: paragraph.id, offset: Math.min(previous.selection.start.offset, paragraph.text.length) }; selection = { start: caret, end: caret }; }
      undo.push(previous); redo.length = 0; focus(); updateToolbar(); await options.onChange?.(result, { review: command, paragraphs: before }); await reviewPanel?.refresh();
    }); },
    select(range) { requireDocument(); selectedImage = undefined; selection = range; focus(); outlineSelection(); updateToolbar(); },
    find(text) { if (!text) return []; return requireDocument().query.findText(text).map(match => ({ start: { paragraphId: match.paragraph.id, offset: match.start }, end: { paragraphId: match.paragraph.id, offset: match.end } })); },
    replaceAll(text, replacement) { return enqueue(async () => {
      editable(); if (!text) throw new TypeError("Search text must not be empty.");
      const indexes = new Map(paragraphs().map((p, index) => [p.id, index]));
      const matches = result.find(text).map(range => ({ range, index: indexes.get(range.start.paragraphId)! }));
      if (!matches.length) return;
      const previous = await snapshot();
      const review = options.review ? await requireDocument().readReview() : undefined;
      try { for (const { range, index } of matches.reverse()) {
        const paragraphId = paragraphs()[index]!.id, target = { start: { paragraphId, offset: range.start.offset }, end: { paragraphId, offset: range.end.offset } };
        if (review && (review.tracking || review.comments.length || review.revisions.length)) {
          await requireDocument().review(review.tracking ? { kind: "trackedReplace", selection: target, text: replacement, identity: options.review!.identity() } : { kind: "replaceText", selection: target, text: replacement });
          const caret = { paragraphId: paragraphs()[index]!.id, offset: range.start.offset + replacement.length }; selection = { start: caret, end: caret };
        } else selection = await requireDocument().edit({ kind: "replace", selection: target, text: replacement, paragraphBreaks: false });
      } }
      catch (error) { await mount(previous.bytes); const all = paragraphs(); selection = { start: { paragraphId: all[previous.start]!.id, offset: previous.selection.start.offset }, end: { paragraphId: all[previous.end]!.id, offset: previous.selection.end.offset } }; formatting = previous.formatting; focus(); throw error; }
      undo.push(previous); redo.length = 0; focus(); await options.onChange?.(result, {}); await reviewPanel?.refresh();
    }); },
    async undo() { await formPanel?.flush(); return enqueue(() => history("undo")); }, async redo() { await formPanel?.flush(); return enqueue(() => history("redo")); },
    async save() { await formPanel?.flush(); return enqueue(() => requireDocument().save({ onFieldStatus: fieldNotice })); }, async pdf() { await formPanel?.flush(); return enqueue(() => requireDocument().pdf({ onFieldStatus: fieldNotice })); },
    dispose() { if (disposed) return; disposed = true; lifetime.abort(); canvas?.dispose(); doc?.dispose(); undo.length = 0; redo.length = 0; host.remove(); },
  };
  if (options.review) { reviewPanel = createReviewPanel(root, result, options.review, lifetime.signal, updateToolbar); void reviewPanel.setMode(); }
  updateToolbar(); report("Open a Word document.");
  return result;
}
