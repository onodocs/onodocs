import { showDictation, type EditorDictationOptions } from "./editor-dictation.js";
import { showProtection, type EditorProtectionOptions } from "./editor-protection.js";
export type { EditorDictationOptions } from "./editor-dictation.js";
export type { EditorProtectionOptions, EditorProtectionRequest, EditorProtectionState } from "./editor-protection.js";
import { showWriting, type EditorWritingOptions } from "./editor-writing.js";
export type { EditorWritingOptions, EditorWritingRequest, EditorWritingSuggestion } from "./editor-writing.js";
import { showEquation } from "./editor-equation.js";
import { configureDropCapForm } from "./editor-drop-cap.js";
import { wordArtStyles, wordArtGallery } from "./editor-word-art.js";
import { shadowPresets, themeEffectSets, drawingEffectsGallery } from "./editor-drawing-effects.js";
import { textEffects, textEffectsGallery } from "./editor-text-effects.js";
import { openPrintPreview } from "./editor-print.js";
import { showScreenshot } from "./editor-screenshot.js";
import { createComparison } from "./editor-comparison.js";
import { showQuickParts, type QuickPart } from "./editor-quick-parts.js";
import { showBibliographySources, showCitation } from "./editor-bibliography.js";
import { tableDrawing, tableSizeSketch } from "./editor-table-drawing.js";
import { tableBorderPainter } from "./editor-border-painter.js";
import { createTabStopEditor } from "./editor-tabs.js";
import { arrangeObjects } from "./editor-arrangement.js";
import { openDesigner } from "./editor-designers.js";
import { createMailings, highlightMergeFields } from "./editor-mailings.js";
import { createRuler } from "./editor-ruler.js";
import { showReadAloud } from "./editor-read-aloud.js";
import { showAccessibility } from "./editor-accessibility.js";
import { insertIcons, insertIconGallery, insertIconBytes } from "./editor-insert-icons.js";
import { diagramContent, diagramGallery } from "./editor-diagrams.js";
import { shapeCatalog, shapeGallery } from "./editor-shapes.js";
import { documentStyleSets, documentSpacingSets, documentStyleCommands, documentThemes, documentFontSets, documentThemeCommands, themeColorLabels, coverPageDesigns, coverPageParagraphs, defaultDesignCommands, type DefaultDocumentDesign } from "./editor-design.js";
import { showBookmarks } from "./editor-bookmarks.js";
import { openDocument, type BrowserDocument, type BrowserDocumentState, type BrowserOptions } from "@onodocs/sdk/browser";
import { createSelectionPane } from "./editor-selection.js";
import { createOutline } from "./editor-outline.js";
import { createNavigationPane } from "./editor-navigation.js";
import { formattingMarks } from "./editor-formatting-marks.js";
import { createDocument, type CanvasDocument, type DocumentView, type DocumentAttachment } from "@onodocs/canvas";
import type { DocumentEdit, DocumentParagraph, DocumentSelection, TextFormatting, ParagraphPropertyPatch, DocumentParagraphStyle } from "@onodocs/sdk";
import { createDocumentPackage, textHighlightColors, standardTableStyles } from "@onodocs/sdk";
import { createForm, createFormDefinition, type DocumentForm, type FormAnswers, type FormDefinition } from "@onodocs/sdk/forms";
import { createFormPanel } from "./form-panel.js";
import { configureChartForm } from "./editor-chart.js";
import { editorIcons } from "./editor-icons.js";
import { createClipboardChart, createClipboardImage, readImageFile, readClipboard, writeClipboard, readClipboardCells, writeClipboardCells } from "./editor-clipboard.js";
import { createReviewPanel, type EditorReviewOptions } from "./editor-review.js";
export type { EditorReviewOptions } from "./editor-review.js";
export { createTemplateEditor } from "./template-editor.js";
export type { TemplateEditor, TemplateEditorOptions } from "./template-editor.js";

export type EditorMode = "view" | "edit" | "review" | "form";
const modeLabels = { view: "Viewing", edit: "Editing", review: "Reviewing", form: "Filling form" };
export type EditorCommand = DocumentEdit extends infer T ? T extends DocumentEdit ? "selection" extends keyof T ? Omit<T, "selection"> & Readonly<{ selection?: DocumentSelection }> : T : never : never;
export interface EditorOptions {
  readonly container: HTMLElement;
  readonly document?: BrowserOptions;
  readonly toolbar?: readonly string[] | false;
  readonly fonts?: readonly string[];
  readonly writing?: EditorWritingOptions;
  readonly dictation?: EditorDictationOptions;
  readonly protection?: EditorProtectionOptions;
  readonly defaultFormattingStorageKey?: string | false;
  readonly quickPartsStorageKey?: string | false;
  readonly styles?: readonly Readonly<{ id: string; label: string }>[];
  readonly readOnly?: boolean;
  readonly mode?: EditorMode;
  readonly allowedModes?: readonly EditorMode[];
  readonly form?: FormDefinition;
  readonly captureHistory?: () => (() => void);
  readonly onModeChange?: (mode: EditorMode) => void;
  readonly onFormComplete?: (result: Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>) => void | Promise<void>;
  readonly review?: EditorReviewOptions;
  readonly onChange?: (editor: WordEditor, change: EditorChange) => void | Promise<void>;
  readonly onError?: (error: unknown) => void;
  readonly commands?: readonly Readonly<{ id: string; label: string; modes?: readonly EditorMode[]; quickAccess?: boolean; icon?: string; ribbon?: Readonly<{ tab: string; group: string; icon?: string }>; execute: (editor: WordEditor) => void | Promise<void> }>[];
}
export interface EditorChange {
  readonly bytes?: Uint8Array<ArrayBuffer>;
  readonly history?: "undo" | "redo";
  readonly replaceAll?: Readonly<{ text: string; replacement: string }>;
  readonly edit?: DocumentEdit;
  readonly review?: import("@onodocs/sdk").DocumentReviewCommand;
  readonly paragraphs?: readonly Readonly<{ id: string; text: string }>[];
}
export interface EditorOperationOptions {
  readonly signal?: AbortSignal;
  readonly ifUnchangedSince?: import("@onodocs/sdk").DocumentQuery<"document">;
  readonly mode?: EditorMode;
  readonly selection?: DocumentSelection;
  readonly scroll?: boolean;
}
export interface EditorSynchronization {
  readonly bytes?: Uint8Array<ArrayBuffer>;
  readonly allowedModes?: readonly EditorMode[];
}
export interface EditorCellSelection { readonly tableId: string; readonly rowIndex: number; readonly columnIndex: number; readonly rowCount: number; readonly columnCount: number; }
type StoredCellSelection = Omit<EditorCellSelection, "tableId"> & Readonly<{ tableIndex: number }>;

export interface WordEditor {
  readonly reviewDisplay: "accepted" | "markup" | "original";
  readonly reviewFilter: import("@onodocs/sdk").ReviewFilter;
  setReviewDisplay(display: "accepted" | "markup" | "original", comments?: boolean, filter?: import("@onodocs/sdk").ReviewFilter): Promise<void>;
  readonly cellSelection: EditorCellSelection | undefined;
  selectCells(selection: EditorCellSelection): void;
  readonly view: DocumentView | undefined;
  synchronize(load: () => Promise<EditorSynchronization | undefined>): Promise<void>;
  readonly document: BrowserDocument | undefined;
  /** Current user selection or caret; read before editing because edits can move it. */
  readonly selection: DocumentSelection | undefined;
  readonly element: HTMLElement;
  readonly mode: EditorMode;
  readonly allowedModes: readonly EditorMode[];
  setMode(mode: EditorMode, options?: EditorOperationOptions): Promise<void>;
  fill(answers: FormAnswers, options?: EditorOperationOptions): Promise<void>;
  answers(): FormAnswers;
  completeForm(options?: EditorOperationOptions): Promise<Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>>;
  open(input: ArrayBuffer | Uint8Array | Blob, name?: string, options?: EditorOperationOptions): Promise<void>;
  restore(input: ArrayBuffer | Uint8Array | Blob, options?: EditorOperationOptions): Promise<void>;
  newDocument(options?: EditorOperationOptions): Promise<void>;
  execute(command: EditorCommand | undefined, update?: () => void | Promise<void>, options?: EditorOperationOptions): Promise<import("@onodocs/sdk").DocumentEditResult | import("@onodocs/sdk").DocumentReviewResult | undefined>;
  review(command: import("@onodocs/sdk").DocumentReviewCommand, options?: EditorOperationOptions): Promise<import("@onodocs/sdk").DocumentReviewResult>;
  select(selection: DocumentSelection, scroll?: boolean): void;
  find(text: string): readonly DocumentSelection[];
  replaceAll(text: string, replacement: string, options?: EditorOperationOptions): Promise<void>;
  undo(options?: EditorOperationOptions): Promise<void>;
  redo(options?: EditorOperationOptions): Promise<void>;
  save(): Promise<Uint8Array<ArrayBuffer>>;
  pdf(): Promise<Uint8Array<ArrayBuffer>>;
  dispose(): void;
}
interface Snapshot {
  readonly state: BrowserDocumentState;
  readonly imageIndex?: number;
  readonly drawingIndex?: number;
  readonly ribbon: string;
  readonly cells: StoredCellSelection | undefined;
  readonly restoreState: (() => void) | undefined;
  readonly mode: EditorMode;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly start: number;
  readonly end: number;
  readonly selection: DocumentSelection;
  readonly formatting: TextFormatting;
}

export function createEditor(options: EditorOptions): WordEditor {
  const formDefinition = options.form ? createFormDefinition(options.form) : undefined;
  let documentForm: DocumentForm | undefined;
  let mode = options.mode ?? (options.readOnly ? "view" : "edit");
  const allowedModes = [...(options.allowedModes ?? (options.readOnly ? ["view" as const] : ["view" as const, "edit" as const, ...(options.review ? ["review" as const] : []), ...(formDefinition ? ["form" as const] : [])]))];
  function validateMode(value: EditorMode): void {
    if (!["view", "edit", "review", "form"].includes(value) || !allowedModes.includes(value) || options.readOnly && value !== "view") throw new Error("This document mode is not available.");
    if (value === "review" && !options.review) throw new Error("Review mode requires reviewer options.");
    if (value === "form" && !formDefinition) throw new Error("Form mode requires a form definition.");
  }
  for (const value of allowedModes) validateMode(value);
  validateMode(mode);
  const host = document.createElement("div"), root = host.attachShadow({ mode: "open" });
  host.className = "onodocs-editor";
  const style = document.createElement("style");
  style.textContent = `
:host{display:block;position:relative;color:var(--onodocs-color,#29313d);background:var(--onodocs-background,#eceef1);font:13px "Segoe UI",Arial,sans-serif}*{box-sizing:border-box}
[hidden]{display:none!important}
:host([data-continuous]) main{max-width:none}:host([data-continuous]) main section{box-shadow:none}
.navigation-pane{background:white;border-right:1px solid #d7dce2;padding:14px;min-width:0;position:sticky;top:var(--editor-toolbar-height,0px);align-self:start;max-height:calc(100dvh - var(--editor-toolbar-height,0px));overflow:auto}.navigation-pane header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.navigation-pane input{position:static;width:100%;opacity:1;height:34px}.navigation-case{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px}.navigation-case input{width:16px;height:16px}.navigation-list mark{background:#fff1a3;color:inherit}.navigation-tabs{display:flex;border-bottom:1px solid #dce1e6;margin:12px 0}.navigation-tabs button{flex:1;padding:6px;border-radius:0;border-bottom:2px solid transparent}.navigation-tabs [aria-selected=true]{border-bottom-color:var(--onodocs-accent,#b43829);font-weight:600}.navigation-list{display:flex;flex-direction:column;gap:4px}.navigation-list button{text-align:left;justify-content:flex-start;white-space:normal;height:auto;min-height:32px;line-height:1.4}.navigation-list [aria-current=true]{background:#e3edf8}.selection-pane select{width:100%;height:34px;margin-top:8px}.selection-list button{display:flex;gap:10px;align-items:flex-start}.selection-list button>span{display:grid;min-width:0;overflow-wrap:anywhere}.selection-list small{font-size:11px;color:#66717f}.selection-list svg{flex:none;width:20px;height:20px}
.navigation-list p{line-height:1.5;color:#66717f}.navigation-arrows{display:flex;align-items:center;gap:5px}.navigation-arrows p{margin-right:auto}.navigation-arrows button{width:28px}:host([data-navigation-pane]){display:grid;grid-template-columns:280px minmax(0,1fr)}:host([data-navigation-pane]) nav,:host([data-navigation-pane]) footer{grid-column:1/-1}:host([data-navigation-pane]) main{grid-column:2;grid-row:2;width:calc(100% - 40px)}:host([data-navigation-pane]) .navigation-pane{grid-column:1;grid-row:2}:host([data-compact][data-navigation-pane]){display:block}:host([data-compact]) .navigation-pane{position:fixed;left:0;top:0;bottom:0;height:100dvh;max-height:100dvh;overscroll-behavior:contain;width:min(290px,100vw);z-index:7}

:host([data-focus]){position:fixed!important;inset:0;z-index:2147483000;overflow:auto;overscroll-behavior:contain;height:100dvh;max-width:none!important;border-radius:0!important}:host([data-focus])>nav{display:none}:host([data-focus])>main,:host([data-focus][data-compact])>main{margin-top:56px}.exit-focus{position:fixed;right:18px;top:12px;z-index:10;background:var(--onodocs-toolbar-background,#fff);border:1px solid #b8c1cb;box-shadow:0 2px 8px #0002;height:34px;padding:4px 12px}:host([data-dark]){--onodocs-background:#20242a;--onodocs-toolbar-background:#2d333b;--onodocs-color:#edf0f4;--onodocs-accent:#ffb2a5;color-scheme:dark}:host([data-dark]) nav,:host([data-dark]) footer{background:#2d333b;color:#edf0f4}:host([data-dark]) button,:host([data-dark]) select,:host([data-dark]) input{color:inherit}:host([data-dark]) select,:host([data-dark]) input:not([type=color]){background:#343c46;border-color:#687480}:host([data-dark]) button:hover,:host([data-dark]) button[aria-pressed=true]{background:#465262}:host([data-dark]) .group-caption,:host([data-dark][data-compact]) .group-caption,:host([data-dark]) .tool-field>span{color:#c2cbd6}:host([data-dark]) dialog,:host([data-dark]) aside,:host([data-dark]) [popover]{color:#29313d;color-scheme:light}:host([data-dark]) dialog input:not([type=color]),:host([data-dark]) dialog select,:host([data-dark]) aside input:not([type=color]),:host([data-dark]) aside select{background:white;color:#29313d}:host([data-dark]) dialog button:hover,:host([data-dark]) aside button:hover{background:#e9edf2}:host([data-dark]) dialog button[type=submit]{background:#b43829;color:white}
.selection-object{display:flex;align-items:center;gap:6px}.selection-object>input{width:18px;height:18px;flex:0 0 18px}.selection-object>button{flex:1;min-width:0}.selection-object:has(input:checked){background:#e8f1fb;border-radius:4px}.ruler-markers{position:absolute;top:0;height:100%;cursor:crosshair}.ruler-marker{position:absolute!important;transform:translateX(-50%);padding:0!important;width:12px!important;min-width:0!important;height:10px!important;min-height:0!important;border:1px solid #4c657b!important;border-radius:0!important;background:#e2edf6!important;touch-action:none;cursor:ew-resize;z-index:2}.ruler-marker[data-marker=first]{top:0;clip-path:polygon(0 0,100% 0,50% 100%)}.ruler-marker[data-marker=hanging],.ruler-marker[data-marker=trailing]{bottom:5px;clip-path:polygon(50% 0,100% 100%,0 100%)}.ruler-marker[data-marker=leading]{bottom:0;height:5px!important}.ruler-marker[data-marker^=tab-]{bottom:5px;width:14px!important;height:14px!important;background:transparent!important;border:0!important}.ruler-marker[data-marker^=margin-]{top:7px;height:12px!important;width:5px!important;background:#8898a6!important;z-index:1}.ruler-marker svg{width:14px;height:14px}.ruler-marker:focus-visible{outline:2px solid #b43829!important;outline-offset:3px}.page-ruler{position:relative;height:28px;width:100%;overflow:hidden;border-top:1px solid #dce1e6;background:var(--onodocs-background,#eceef1);color:var(--onodocs-color,#29313d);flex:0 0 100%}.page-ruler>select{position:absolute;right:0;top:0;height:26px;width:66px;font-size:11px;z-index:1}.ruler-scale{position:absolute;top:0;height:26px;background:var(--onodocs-toolbar-background,#fff);border-bottom:1px solid #aeb9c4}.ruler-tick{position:absolute;bottom:0;height:5px;border-left:1px solid #9ba7b3}.ruler-tick.major{height:10px}.ruler-tick>span{position:absolute;bottom:8px;left:2px;font-size:10px;line-height:12px}.ruler-description{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}:host([data-compact]) .page-ruler{height:44px}:host([data-compact]) .page-ruler .ruler-scale{top:16px}:host([data-compact]) .page-ruler select{min-height:44px;height:44px;padding:0 6px;font-size:14px}
:host([data-horizontal])>main{max-width:none;width:calc(100% - 40px);overflow:auto;max-height:calc(100dvh - var(--editor-toolbar-height,0px) - 56px);overscroll-behavior:contain;min-width:0}:host([data-horizontal]) main *{scroll-margin-top:0px}:host([data-horizontal][data-compact])>main{width:calc(100% - 8px)}
main *{scroll-margin-top:var(--editor-scroll-clearance,0px)}
:host([data-mode=form]){display:grid;grid-template-columns:minmax(0,1fr) 310px}:host([data-mode=form]) nav,:host([data-mode=form]) footer{grid-column:1/-1}:host([data-mode=form]) main{grid-column:1;grid-row:2;width:calc(100% - 40px)}:host([data-mode=form]) .form-panel{grid-column:2;grid-row:2;align-self:start;margin:28px 16px 28px 0}.form-panel{background:white;border:1px solid #dce1e6;padding:20px;margin:20px auto;max-width:860px}.form-panel label{display:grid;gap:5px;margin:12px 0}.form-panel input,.form-panel select,.form-panel textarea{position:static;opacity:1;width:100%;height:auto;min-height:34px;padding:8px;border:1px solid #a9b5bd}.form-panel textarea{min-height:80px;font:inherit}.form-panel input[type=number]{width:100%}.form-panel select{max-width:none}.form-panel input[type=checkbox]{width:20px}.form-panel small[role=alert]{color:#a32828}.form-panel button{background:#176d60;color:white}

.ribbon-panel[data-ribbon="Home"] .tool-group{padding-inline:10px}.ribbon-panel[data-ribbon="Home"] .tool-group:has(.group-launcher){padding-right:24px}.ribbon-panel[data-ribbon="Home"] .tool-group:first-child{padding-left:0}.ribbon-panel[data-ribbon="Home"] .group-caption{display:none}.ribbon-panel[data-ribbon="Home"] .tool-content{gap:3px}.ribbon-panel[data-ribbon="Home"] select[aria-label="Font family"]{width:125px}.ribbon-panel[data-ribbon="Home"] input[aria-label="Font size"]{width:46px}.ribbon-panel[data-ribbon="Home"] select[aria-label="Change case"]{width:46px;padding-inline:4px}.ribbon-panel[data-ribbon="Home"] .current-style{width:104px!important;min-width:0;height:67px!important}.ribbon-panel[data-ribbon="Home"] .tool-group[aria-label="Clipboard"] .tool-content{display:grid;grid-template-columns:52px 32px 32px;grid-template-rows:32px 16px 16px;gap:0 3px}.ribbon-panel[data-ribbon="Home"] .tool-group[aria-label="Clipboard"] .tool-line{display:contents}.ribbon-panel[data-ribbon="Home"] [data-command="paste"]{grid-column:1;grid-row:1/3;flex-direction:column;height:48px;gap:1px;padding:2px}.ribbon-panel[data-ribbon="Home"] [data-command="paste"] svg{width:22px;height:22px}.ribbon-panel[data-ribbon="Home"] [data-command="pasteOptions"]{grid-column:1;grid-row:3;width:52px;height:16px;min-height:16px;padding:0}.ribbon-panel[data-ribbon="Home"] [data-command="pasteOptions"] svg{width:14px;height:14px}.ribbon-panel[data-ribbon="Home"] [data-command="cut"]{grid-column:2;grid-row:1}.ribbon-panel[data-ribbon="Home"] [data-command="copy"]{grid-column:3;grid-row:1}.ribbon-panel[data-ribbon="Home"] [data-command="formatPainter"]{grid-column:2;grid-row:2/4}.ribbon-panel[data-ribbon="Home"] [data-command="find"],.ribbon-panel[data-ribbon="Home"] [data-command="replace"]{width:32px;padding:6px}.ribbon-panel[data-ribbon="Home"] [data-command="find"] span,.ribbon-panel[data-ribbon="Home"] [data-command="replace"] span{display:none}.ribbon-icon-select{display:inline-flex;position:relative;align-items:center;width:44px;height:32px;flex:none;border-radius:4px}.ribbon-icon-select>svg{width:18px;height:18px;margin-left:7px;pointer-events:none}.ribbon-icon-select::after{content:"";position:absolute;right:6px;top:13px;width:5px;height:5px;border-right:1px solid;border-bottom:1px solid;transform:rotate(45deg);pointer-events:none}.ribbon-icon-select>select{position:absolute;inset:0;width:100%!important;max-width:none!important;height:100%;opacity:0;cursor:pointer}.ribbon-icon-select:hover{background:#e9edf2}.ribbon-icon-select:focus-within{outline:2px solid var(--onodocs-accent,#b43829);outline-offset:-2px}.ribbon-icon-select:has(:disabled){opacity:.4}.ribbon-icon-select:has(:disabled)>select{cursor:default}:host([data-dark]) .ribbon-icon-select:hover{background:#465262}:host([data-compact]) .ribbon-icon-select{width:48px;height:44px}:host([data-compact]) .ribbon-icon-select::after{top:19px}:host([data-compact]) .ribbon-panel[data-ribbon="Home"] .tool-group[aria-label="Clipboard"] .tool-content{grid-template-columns:72px 44px 44px;grid-template-rows:44px 22px 22px}:host([data-compact]) .ribbon-panel[data-ribbon="Home"] [data-command="pasteOptions"]{width:72px;height:44px;min-height:44px;grid-row:2/4}:host([data-compact]) .ribbon-panel[data-ribbon="Home"] [data-command="paste"]{height:44px;grid-row:1;flex-direction:row}:host([data-compact]) .ribbon-panel[data-ribbon="Home"] [data-command="find"],:host([data-compact]) .ribbon-panel[data-ribbon="Home"] [data-command="replace"]{width:44px}
nav{position:sticky;top:0;z-index:5;background:var(--onodocs-toolbar-background,#fff);border-bottom:1px solid #d7dce2;box-shadow:0 2px 5px #25304006;padding:0 16px}
.tool-group{display:flex;align-items:center;gap:3px;padding-right:10px;margin-right:4px;border-right:1px solid #e0e4e9}.tool-group:last-child{border-right:0;margin-right:0;padding-right:0}
.bibliography-citation{width:680px}.citation-source-list{grid-column:1/-1;max-height:230px;overflow:auto;border:1px solid #dce1e6;border-radius:4px;padding:8px}.citation-source-list>label{display:flex!important;flex-direction:row!important;gap:10px;padding:8px;align-items:start}.citation-source-list input{width:auto!important;min-width:0!important;margin:3px 0}.citation-source-list span{display:grid;gap:4px}.citation-source-list small{color:#617080}.citation-switch{display:flex!important;flex-direction:row!important;align-items:center;gap:8px}.citation-switch input{width:auto!important;min-width:0!important}.bibliography-citation svg{width:18px;height:18px}.bibliography-citation form>button{justify-self:end}.bibliography-citation .dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:8px}dialog.bibliography-manager{width:680px}.bibliography-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}.bibliography-toolbar svg{width:18px;height:18px}.bibliography-manager>input{margin-bottom:12px}.bibliography-body{display:grid;grid-template-columns:1fr 1fr;gap:18px}.bibliography-body select{height:260px}.bibliography-details{overflow-wrap:anywhere;min-width:0}.bibliography-details h3{margin-top:0}.bibliography-details p{line-height:1.5}.bibliography-authors{grid-column:1/-1;min-width:0;border:1px solid #dce1e6;padding:12px;display:grid;gap:12px}.bibliography-author-row{display:grid;grid-template-columns:1fr 1fr 1fr 32px;gap:6px;align-items:end}.bibliography-author-rows{display:grid;gap:12px}.bibliography-authors>button{justify-self:start}.bibliography-source-editor .dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:8px}.bibliography-source-editor [hidden]{display:none!important}@media(max-width:480px){.bibliography-body{grid-template-columns:1fr}.bibliography-body select{height:140px}.bibliography-author-row{grid-template-columns:1fr 1fr}.bibliography-author-row>button{justify-self:end}}.table-drawing-cell{position:relative;padding:0!important;min-width:0!important;min-height:0!important;width:100%!important;height:100%!important;background:transparent!important;border:0!important;border-radius:0!important;cursor:crosshair;touch-action:none}.table-drawing-cell:focus-visible{outline:2px solid #2675b8!important;outline-offset:-2px}.table-drawing-cell>span{position:absolute;pointer-events:none}.table-size-sketch{grid-column:1/-1;position:relative;height:180px;border:1px solid #cbd2da;background:linear-gradient(#e3e8ef 1px,transparent 1px),linear-gradient(90deg,#e3e8ef 1px,transparent 1px);background-size:18px 18px;cursor:crosshair;touch-action:none}.table-size-sketch>div{position:absolute;left:0;top:0;border:2px solid #2675b8;background:#2675b81a;pointer-events:none}[data-format-painter] canvas{cursor:crosshair}.border-painter-edge{padding:0!important;min-width:0!important;min-height:0!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important;background:transparent!important;cursor:crosshair}.border-painter-edge::after{content:"";position:absolute;background:#3479bc55;pointer-events:none}.border-painter-edge[data-axis=y]::after{left:0;right:0;top:calc(50% - 1px);height:2px}.border-painter-edge[data-axis=x]::after{top:0;bottom:0;left:calc(50% - 1px);width:2px}.border-painter-edge:hover::after,.border-painter-edge:focus-visible::after{background:#3479bc}.border-painter-edge:focus-visible{outline:2px solid #3479bc!important}.ribbon-panel select[aria-label="Select"]{width:90px;min-width:90px}.paragraph-style-card{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:5px;min-width:108px;height:65px;padding:8px!important;overflow:hidden}.paragraph-style-card .style-name{font-size:11px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.paragraph-style-card[aria-pressed=true]{outline:2px solid var(--onodocs-accent,#b43829)}.ribbon-panel .current-style{width:150px!important;height:60px!important}.style-gallery-popup{position:fixed;inset:auto;margin:0;width:min(480px,calc(100vw - 16px));max-height:70vh;padding:12px;border:1px solid #ccd3da;border-radius:6px;background:white;box-shadow:0 8px 30px #0003}.style-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:6px;max-height:45vh;overflow:auto}.style-actions{display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #dce1e6;margin-top:12px;padding-top:10px}.styles-pane{background:white;border-left:1px solid #d7dce2;padding:14px;min-width:0;position:sticky;top:var(--editor-toolbar-height,0px);align-self:start;max-height:calc(100dvh - var(--editor-toolbar-height,0px));overflow:auto}.styles-pane header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.styles-pane input{position:static;opacity:1;width:100%;height:34px;margin-bottom:12px}.style-pane-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.styles-pane .paragraph-style-card{width:100%;min-width:0}.styles-pane .style-actions{flex-wrap:wrap}:host([data-styles-pane]){display:grid;grid-template-columns:minmax(0,1fr) 290px}:host([data-styles-pane]) nav,:host([data-styles-pane]) footer{grid-column:1/-1}:host([data-styles-pane]) main{grid-column:1;grid-row:2;width:calc(100% - 40px)}:host([data-styles-pane]) .styles-pane{grid-column:2;grid-row:2}:host([data-compact][data-styles-pane]){display:block}:host([data-compact]) .styles-pane{position:fixed;right:0;top:0;bottom:0;height:100dvh;max-height:100dvh;overscroll-behavior:contain;width:min(290px,100vw);z-index:7}.style-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px}.style-edit-form>h2,.style-edit-form>.actions{grid-column:1/-1}.style-edit-form>label{margin:0!important}.ribbon-header{display:flex;align-items:center;gap:12px;border-bottom:1px solid #e6e9ee;min-height:42px}.quick-access{display:flex;gap:2px;padding-right:10px;border-right:1px solid #e0e4e9}.ribbon-tabs{display:flex;align-self:stretch;gap:2px;overflow-x:auto;scrollbar-width:thin}.ribbon-tabs button{height:100%;min-height:42px;border-radius:0;border-bottom:3px solid transparent;padding:8px 14px 6px}.ribbon-tabs button[aria-selected=true]{color:var(--onodocs-accent,#a33327);border-bottom-color:currentColor;font-weight:600}.ribbon-tabs button[data-context]{color:#346e66}.ribbon-header>select{margin-left:auto;flex:none}.ribbon-panel{display:flex;align-items:stretch;gap:0;padding:6px 3px 4px;overflow-x:auto;scrollbar-width:thin}.ribbon-panel .tool-group{position:relative;flex:none;flex-direction:column;justify-content:space-between;align-items:stretch;gap:4px;padding:0 14px;margin:0}.ribbon-panel .tool-group:first-child{padding-left:0}.tool-content{display:flex;flex-direction:column;justify-content:center;gap:4px;flex:1}.tool-line{display:flex;align-items:center;gap:3px}.group-caption{display:block;text-align:center;font-size:11px;color:#687380;line-height:16px}.ribbon-panel .large-button{height:32px;min-width:62px;gap:7px;padding:5px 8px}.large-button svg{width:20px;height:20px}.ribbon-panel select[aria-label="Font family"]{width:145px}.ribbon-panel select[aria-label="Paragraph style"]{min-width:150px;max-width:210px;height:54px;font-size:16px}.ribbon-panel select[aria-label="Paragraph alignment"],.ribbon-panel select[aria-label="List"]{width:133px}.ribbon-panel input[type=color]{border-color:#dce1e6}.ribbon-panel .labeled-field{display:flex;gap:6px;align-items:center}.ribbon-panel .labeled-field>span{display:block;width:85px;font-size:12px}.ribbon-panel select[aria-label="AutoFit"]{width:115px}.ribbon-panel[data-ribbon="Review"] .tool-group{padding-left:10px;padding-right:10px}.ribbon-panel[data-ribbon="Table Layout"] .tool-group{padding-left:5px;padding-right:5px}.ribbon-panel[data-ribbon="Table Layout"] .large-button{font-size:12px;padding-left:5px;padding-right:5px;gap:4px;min-width:32px}.ribbon-panel select[aria-label="Select table cells"]{width:114px}.ribbon-panel button.group-launcher{position:absolute;bottom:0;right:2px;width:18px;min-width:18px;height:18px;padding:2px}.group-launcher svg{width:12px;height:12px}.color-grid{display:grid;grid-template-columns:repeat(4,32px);gap:5px}.color-grid button{width:32px;height:32px;border:1px solid #ccd3da;padding:4px}.color-grid button span{width:22px;height:22px;border:1px solid #0003}.color-actions{display:flex;gap:6px;border-top:1px solid #e0e4e9;padding-top:8px;margin-top:8px}.color-actions button{width:auto}.ribbon-panel select[aria-label="Change case"]{width:58px}.ribbon-panel select[aria-label="Line spacing"]{width:65px}.ribbon-panel input[aria-label="Indent left"],.ribbon-panel input[aria-label="Indent right"],.ribbon-panel input[aria-label="Spacing before"],.ribbon-panel input[aria-label="Spacing after"]{width:64px}
:host([data-split]){display:block;--split-space:calc(100dvh - var(--editor-toolbar-height,0px) - 128px)}:host([data-split])>main{width:calc(100% - 24px);max-width:none;min-width:0;height:calc(var(--split-space)*var(--split-ratio,.5));max-height:none;margin:8px 12px;overflow:auto;overscroll-behavior:contain;border:1px solid #cbd3dc}.split-pane{margin:0 12px 8px;border:1px solid #cbd3dc;height:calc(var(--split-space)*(1 - var(--split-ratio,.5)));display:flex;flex-direction:column;min-height:0}.split-pane[hidden]{display:none}.split-pages{overflow:auto;overscroll-behavior:contain;flex:1;min-height:0}.split-handle{display:flex;align-items:center;justify-content:space-between;padding:3px 8px;background:#e1e6ed;cursor:row-resize;touch-action:none;font-size:12px}.split-handle:focus-visible{outline:2px solid #b43829}.split-handle button{font-size:12px;height:28px;padding:3px 8px}.split-pages *,:host([data-split])>main *{scroll-margin-top:0}:host([data-split])>.styles-pane,:host([data-split])>.navigation-pane,:host([data-split])>.selection-pane{position:fixed;right:0;top:var(--editor-toolbar-height,0px);bottom:0;z-index:8;width:280px}dialog:has(.quick-parts-form){width:720px}.quick-parts-body{display:grid;grid-template-columns:minmax(180px,1fr) minmax(200px,1fr);gap:20px}.quick-parts-body>select{height:280px;width:100%;max-width:none;border:1px solid #d7dce2;padding:4px}.quick-parts-body option{padding:7px}.quick-part-preview{white-space:pre-wrap;overflow:auto;max-height:140px;border:1px solid #d7dce2;padding:12px;font-size:13px}.quick-parts-form>.dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:12px}.quick-part-tools{display:flex;gap:8px;flex-wrap:wrap}.quick-part-insert{background:var(--onodocs-accent,#b43829);color:white}@media(max-width:540px){.quick-parts-body{grid-template-columns:1fr;gap:12px}.quick-parts-body>select{height:130px}.quick-part-preview{max-height:90px}}dialog:has(.tabs-form){width:520px}.tab-stop-list{display:grid;gap:10px;max-height:45vh;overflow:auto;padding:2px}.tab-stop-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 32px;gap:8px;align-items:end}.tab-stop-row>button{min-width:0!important;width:32px!important}.tab-stop-row label{min-width:0;margin:0!important}.tab-stop-row input,.tab-stop-row select{width:100%;min-width:0}.tab-stop-actions{display:flex;justify-content:space-between;gap:8px}.table-sort-form{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px!important}.table-sort-form>h2,.table-sort-form>.dialog-actions,.table-sort-form>[role=alert]{grid-column:1/-1}.table-sort-form select{min-width:0;width:100%;padding:5px 2px}.table-sort-form>.checkbox-field{grid-column:2/-1}.watermark-form{grid-template-columns:1fr 1fr}.watermark-form>h2,.watermark-form>label:nth-of-type(2),.watermark-form>.design-help,.watermark-form>.dialog-actions,.watermark-form>[role=alert]{grid-column:1/-1}.watermark-form>.dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:12px}.page-border-preview{display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #d7dce2;border-radius:4px;padding:12px;grid-column:1/-1}.page-border-preview legend{font-size:13px}.theme-preview{display:grid;gap:16px;border:1px solid #d7dce2;padding:16px;border-radius:4px}.theme-preview strong{font-size:24px}.theme-swatches{display:flex;gap:4px}.theme-swatches>span{width:30px;height:24px;border:1px solid #0002}dialog:has(.theme-colors-form){width:460px}.theme-colors-form{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important}.theme-colors-form>h2,.theme-colors-form>label:first-of-type,.theme-colors-form>.checkbox-field,.theme-colors-form>.dialog-actions,.theme-colors-form>[role=alert]{grid-column:1/-1}.theme-colors-form>.dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:12px}.theme-colors-form input[type=color]{padding:2px;height:32px}@media(max-width:480px){.theme-colors-form{grid-template-columns:repeat(2,minmax(0,1fr))}}.design-help{font-size:13px;line-height:1.5;margin:0}.design-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.design-card{height:auto;white-space:normal;display:flex;flex-direction:column;align-items:stretch;text-align:left;padding:12px;gap:10px;min-width:0}.design-card[aria-checked=true]{border-color:var(--onodocs-accent,#b43829);background:#faeee9}.design-preview{display:flex;flex-direction:column;white-space:pre-line;min-height:92px;overflow:hidden}.design-preview>span+span{font-size:11px}.design-card small{font-size:11px;color:#687380}.symbol-gallery{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}.symbol-gallery button{height:38px;padding:4px;font-size:23px;border:1px solid #dfe3e8}.document-statistics{width:100%;border-collapse:collapse}.document-statistics th,.document-statistics td{padding:9px 0;border-bottom:1px solid #e3e7ec}.document-statistics th{text-align:left;font-weight:400}.document-statistics td{text-align:right;font-variant-numeric:tabular-nums}button,select,input{font:inherit;color:inherit;border:1px solid transparent;border-radius:5px;background:transparent;height:32px;padding:5px 8px}button{display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap}button.icon-button{width:32px;padding:6px}svg{width:18px;height:18px;flex:none;pointer-events:none}button:hover:not(:disabled){background:#f0f2f5}button:disabled{opacity:.32;cursor:default}button[aria-pressed=true]{color:var(--onodocs-accent,#a33327);background:var(--onodocs-selection,#fae9e5)}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--onodocs-accent,#b43829);outline-offset:2px}.ribbon-tabs button:focus-visible{outline-offset:-5px}
select,input{border-color:#dce1e6;background:white}select{max-width:170px}input[type=number]{width:58px}input[type=color]{width:32px;padding:6px;border-color:transparent;cursor:pointer}
main{max-width:860px;margin:28px auto;min-height:300px;box-shadow:0 1px 5px #1e293b18}textarea{position:absolute;width:1px;height:1px;opacity:0;border:0;padding:0;resize:none;overflow:hidden;z-index:2}textarea[aria-label="Document text"]{pointer-events:none}textarea.composing{opacity:1;width:220px;background:white;pointer-events:auto}footer{padding:9px 24px;background:var(--onodocs-toolbar-background,white);border-top:1px solid #dce1e6;color:#66717f;font-size:12px}footer[data-error=true]{color:#a62a24}
.insert-icons-form{grid-template-columns:1fr 1fr}.insert-icons-form>h2,.insert-icons-form>.insert-icon-gallery,.insert-icons-form>.design-help,.insert-icons-form>label:last-of-type,.insert-icons-form>.dialog-actions,.insert-icons-form>[role=alert]{grid-column:1/-1}.insert-icon-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;max-height:260px;overflow:auto}.insert-icon-gallery button{height:72px;min-width:0;flex-direction:column;font-size:11px;white-space:normal;gap:3px;padding:4px;border:1px solid #e1e5e9}.insert-icon-gallery svg{width:30px;height:30px}.insert-icon-gallery button[aria-pressed=true]{border-color:var(--onodocs-accent,#b43829);background:#faeee9}.insert-icons-form>.dialog-actions{position:sticky;bottom:-24px;background:white;padding-bottom:8px}.shape-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;grid-column:1/-1}.shape-gallery button{height:66px;min-width:0;flex-direction:column;white-space:normal;font-size:10px;padding:5px}.shape-gallery svg{width:28px;height:28px}.shape-gallery [aria-pressed=true]{outline:2px solid var(--onodocs-accent,#b43829)}textarea.shape-text{position:static;opacity:1;width:100%;height:100px;resize:vertical;border:1px solid #ccd3da;padding:8px;pointer-events:auto}.cover-page-form{grid-template-columns:repeat(2,minmax(0,1fr))}.cover-page-form>h2,.cover-page-form>.cover-page-gallery,.cover-page-form>label:has([name=title]),.cover-page-form>label:has([name=subtitle]),.cover-page-form>.design-help,.cover-page-form>.dialog-actions,.cover-page-form>[role=alert]{grid-column:1/-1}.cover-page-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;border:0;padding:0;margin:0}.cover-page-gallery legend{font-size:12px;margin-bottom:8px}.cover-page-gallery label{position:relative;text-align:center;cursor:pointer;gap:5px!important}.cover-page-gallery input{position:absolute;opacity:0;width:1px;height:1px}.cover-page-preview{display:flex;flex-direction:column;justify-content:center;gap:6px;height:112px;padding:12px 8px;text-align:left;border:1px solid #ccd3da;border-radius:3px;background:white;box-shadow:0 1px 3px #0001}.cover-page-preview strong{font-size:18px;color:#4472c4}.cover-page-preview small{font-size:10px;color:#66717f}.cover-page-centered{text-align:center}.cover-page-accent strong{background:#4472c4;color:white;padding:6px 2px}.cover-page-gallery input:checked+.cover-page-preview{outline:2px solid var(--onodocs-accent,#b43829);outline-offset:2px}.cover-page-gallery input:focus-visible+.cover-page-preview{outline-style:dashed}
.bookmark-dialog select{height:148px}.bookmark-dialog .dialog-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.bookmark-dialog .dialog-actions button{min-width:0;padding:5px 4px}.bookmark-dialog small{line-height:1.5;color:#66717f}.rotation-presets{display:flex;gap:8px;flex-wrap:wrap}.rotation-presets button{flex:1}.picture-position-form fieldset{border:0;min-width:0;padding:0;display:grid;gap:14px}.picture-position-form legend{font-weight:600;margin-bottom:10px}.picture-position-form input:disabled{opacity:.5}
.picture-position-grid{display:grid;grid-template-columns:repeat(3,48px);gap:6px;justify-content:center;margin:8px auto}.picture-position-grid button{padding:5px;justify-content:center}
.picture-resize-handle{padding:0;border:1.5px solid var(--onodocs-accent,#b43829);border-radius:2px;background:#fff;touch-action:none;min-width:0;min-height:0}.picture-resize-handle:focus-visible{outline:2px solid #2675b8;outline-offset:2px}.picture-resize-preview{display:none;outline:1px dashed var(--onodocs-accent,#b43829);background:#2675b81a;pointer-events:none}
.table-resize-handle{padding:0;min-width:0;min-height:0;border:0;background:transparent;border-radius:0;touch-action:none}.table-resize-handle:hover,.table-resize-handle:focus-visible,.table-resize-handle[data-dragging]{background:#2675b866;outline:1px solid #2675b8}.table-resize-handle[data-axis=x]{cursor:col-resize}.table-resize-handle[data-axis=y]{cursor:row-resize}
.ribbon-panel .table-style-card{height:76px;min-width:76px;flex-direction:column;gap:6px;padding:5px}.table-style-card svg{width:64px;height:36px}.table-style-card span{font-size:11px}.table-style-card[aria-pressed=true]{outline:2px solid var(--onodocs-accent,#b43829)}
dialog{border:1px solid #d7dce2;border-radius:10px;padding:24px;width:380px;max-width:90vw;color:inherit;background:white;box-shadow:0 12px 48px #17212d26}dialog::backdrop{background:#10203055}dialog{max-height:85dvh;overflow:auto}dialog select{width:100%;max-width:none;height:36px}dialog [role=alert]{margin:0;color:#a62a24;white-space:normal}.ribbon-menu{position:fixed;inset:auto;margin:0;padding:5px;border:1px solid #d7dce2;border-radius:6px;box-shadow:0 6px 20px #17212d26;background:white;color:inherit}.ribbon-menu button{display:flex;width:100%;justify-content:flex-start}dialog form{display:grid;gap:14px}dialog:has(form.wide-form){width:560px}dialog .wide-form{grid-template-columns:repeat(2,minmax(0,1fr))}dialog .wide-form>h2,dialog .wide-form>.dialog-actions,dialog .wide-form>[role=alert]{grid-column:1/-1}@media(max-width:480px){dialog .wide-form{grid-template-columns:1fr}}dialog h2{margin:0 0 8px;font-size:18px;font-weight:600}dialog label{display:grid;gap:6px}dialog input,dialog input[type=number]{width:100%;height:36px}dialog button{border-color:#dce1e6}dialog .dialog-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-top:14px;border-top:1px solid #e6e9ee;margin-top:4px}dialog .dialog-actions button{min-width:76px}dialog .dialog-actions .destructive{margin-right:auto;color:#a62a24}dialog label{font-size:13px}dialog .checkbox-field{display:flex;align-items:center;gap:8px}dialog input[type=checkbox]{width:16px;height:16px}dialog button[type=submit]{background:var(--onodocs-accent,#b43829);color:white;border:0}
@media(max-width:900px){:host([data-mode=form]){grid-template-columns:1fr}:host([data-mode=form]) .form-panel{grid-column:1;grid-row:3;margin:16px}nav{padding:0 10px}main{margin:16px 12px}.tool-group{padding-right:6px;margin-right:0}select{max-width:140px}.ribbon-header{gap:6px}.ribbon-tabs button{padding-inline:11px}.ribbon-panel .tool-group{padding-inline:10px}}
.mobile-tools-toggle,.mobile-tool-category{display:none}.tool-field{display:contents}.tool-field>span{display:none}
:host([data-compact]) nav{padding:0 8px;touch-action:manipulation}:host([data-compact]) .ribbon-header{height:52px;min-height:52px;gap:4px;border:0;flex-wrap:nowrap}:host([data-compact]) .quick-access{border:0;padding:0;gap:0}:host([data-compact]) .ribbon-tabs{display:none}:host([data-compact]) .mobile-tools-toggle{display:inline-flex;min-width:76px;margin-right:auto;font-weight:600}:host([data-compact]) .ribbon-header>select{min-width:0;max-width:140px;margin-left:0;flex:0 1 140px}
:host([data-compact]) button,:host([data-compact]) select,:host([data-compact]) input{min-height:44px}:host([data-compact]) select,:host([data-compact]) input{font-size:16px}:host([data-compact]) button.icon-button,:host([data-compact]) input[type=color]{width:44px}:host([data-compact]) main{margin:8px 4px}:host([data-compact]) footer{padding:6px 12px}
:host([data-compact]) .ribbon-tools{position:absolute;top:100%;left:0;right:0;max-height:min(60dvh,440px);overflow-y:auto;overscroll-behavior:contain;background:var(--onodocs-toolbar-background,#fff);border-bottom:1px solid #d7dce2;box-shadow:0 10px 20px #25304026;padding:12px 16px 16px;scroll-padding:12px}
:host([data-compact]) .mobile-tool-category{display:block;width:100%;max-width:none;margin-bottom:12px;font-weight:600;position:sticky;top:0;z-index:1}:host([data-compact]) .ribbon-panel{flex-direction:column;overflow:visible;padding:0;gap:12px}:host([data-compact]) .ribbon-panel .tool-group{padding:0 0 12px;border:0;border-bottom:1px solid #e6e9ee;gap:6px}:host([data-compact]) .ribbon-panel .tool-group:last-child{border:0;padding-bottom:0}:host([data-compact]) .group-caption{order:-1;text-align:left;font-weight:600;color:#536170}:host([data-compact]) .tool-content{flex-direction:row;flex-wrap:wrap;justify-content:flex-start;gap:8px}:host([data-compact]) .tool-line{flex-wrap:wrap;gap:6px}:host([data-compact]) .ribbon-panel .large-button{height:auto;min-height:44px;white-space:normal;text-align:left}:host([data-compact]) .ribbon-panel select[aria-label="Paragraph style"]{height:44px;max-width:100%}:host([data-compact]) .tool-field{display:flex;flex-direction:column;gap:4px;max-width:100%}:host([data-compact]) .tool-field>span{display:block;font-size:11px;color:#687380}
:host([data-compact][data-mode=form]){grid-template-columns:minmax(0,1fr)}:host([data-compact][data-mode=form]) .form-panel{grid-column:1;grid-row:3;margin:12px}:host([data-compact]) dialog:not(.template-data-dialog):not(.designer-dialog){padding:16px}:host([data-compact]) dialog input{height:44px}:host([data-compact]) .theme-colors-form>.dialog-actions{bottom:-16px}

.ribbon-panel .group-caption{display:none}
.ribbon-tabs button{padding-inline:8px}
.quick-access .large-button{gap:6px;padding-inline:8px}
.ribbon-menu-trigger::after{content:"";width:5px;height:5px;border-right:1px solid;border-bottom:1px solid;transform:rotate(45deg);margin:-3px 2px 0 5px;flex:none}
.ribbon-command-menu{min-width:190px;max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);overflow:auto}
.ribbon-command-menu button{gap:8px;padding:6px 10px;height:34px;white-space:nowrap}
.ribbon-command-menu button>svg{width:18px;height:18px;flex:none}
.ribbon-command-menu .tool-field{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 10px}
.ribbon-command-menu .tool-field>span{display:block}
.ribbon-command-menu select{max-width:160px}
.ribbon-command-menu.alignment-menu:popover-open{display:grid;grid-template-columns:repeat(3,40px);gap:3px;min-width:0}
.ribbon-command-menu.alignment-menu button{width:40px;justify-content:center;padding:6px}
.ribbon-command-menu.alignment-menu button>span{display:none}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]){min-height:77px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .tool-group{padding:0 8px;gap:0}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .tool-group:first-child{padding-left:0}
:host(:not([data-compact])) .ribbon-panel[data-ribbon="Table Layout"] .tool-group{padding-inline:5px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .tool-content{gap:3px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .tool-line{min-height:32px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) button{min-width:0;height:32px;min-height:32px;padding:5px 6px;gap:5px;font-size:12px;white-space:nowrap}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) button>svg{width:18px;height:18px;flex:none}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) button.icon-button{width:32px;padding:6px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .table-style-card{width:54px;min-width:54px;padding:3px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .table-style-card>svg{width:48px;height:26px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .table-style-card>span{display:none}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .labeled-field>span{width:80px;font-size:12px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) .labeled-field input{width:56px}
:host(:not([data-compact])) .ribbon-panel:not([data-ribbon="Home"]) select{max-width:128px}
:host(:not([data-compact])) .ribbon-panel[data-ribbon="Layout"] select{width:108px}
:host(:not([data-compact])) .ribbon-panel select[data-command="bibliography:style"]{width:155px;max-width:155px}
.ribbon-panel button[data-command^="table:look:"]>svg{display:none}
.ribbon-panel button[data-command^="table:look:"]::before{content:"";width:13px;height:13px;border:1px solid #98a4b2;border-radius:2px;flex:none}
.ribbon-panel button[data-command^="table:look:"][aria-pressed=true]::before{content:"✓";display:grid;place-items:center;background:var(--onodocs-accent,#b43829);border-color:transparent;color:white;font-size:11px}
:host([data-compact]) .ribbon-command-menu button{height:44px}

:host(:not([data-compact])) .ribbon-panel .labeled-field:has([data-command="zoom"])>span{width:auto;order:1}
:host(:not([data-compact])) .ribbon-panel .labeled-field input[data-command="zoom"]{width:68px}
input[data-command="zoom"]::-webkit-inner-spin-button{opacity:1}
:host(:not([data-compact])) .ribbon-panel button.zoom-step{width:28px;font-size:18px}
:host(:not([data-compact])) .ribbon-panel .labeled-field:has([data-command="zoom"]){gap:3px;margin-right:3px}
:host(:not([data-compact])) .ribbon-panel select[data-command="view:multiple"]{width:90px}
`;
  const toolbar = document.createElement("nav"), preview = document.createElement("main"), input = document.createElement("textarea"), status = document.createElement("footer");
  toolbar.setAttribute("aria-label", "Document tools"); toolbar.setAttribute("part", "toolbar");
  preview.setAttribute("aria-label", "Word document"); preview.setAttribute("part", "pages");
  input.setAttribute("aria-label", "Document text"); input.setAttribute("aria-multiline", "true"); input.spellcheck = false; input.autocomplete = "off";
  status.setAttribute("role", "status"); status.setAttribute("part", "status");
  const sidebar = document.createElement("slot"); sidebar.name = "sidebar"; sidebar.style.display = "contents";
  const splitPane = document.createElement("section"), splitHandle = document.createElement("div"), splitPages = document.createElement("div"), splitClose = document.createElement("button");
  splitPane.className = "split-pane"; splitPane.hidden = true; splitPane.setAttribute("aria-label", "Second document pane"); splitPages.className = "split-pages"; splitPages.tabIndex = 0;
  splitHandle.className = "split-handle"; splitHandle.tabIndex = 0; splitHandle.setAttribute("role", "separator"); splitHandle.setAttribute("aria-label", "Resize split panes"); splitHandle.setAttribute("aria-orientation", "horizontal"); splitHandle.setAttribute("aria-valuemin", "20"); splitHandle.setAttribute("aria-valuemax", "80"); splitHandle.setAttribute("aria-valuenow", "50");
  splitClose.type = "button"; splitClose.textContent = "Remove split"; splitHandle.append("Second view", splitClose); splitPane.append(splitHandle, splitPages);
  root.append(style, toolbar, preview, splitPane, input, status, sidebar); options.container.append(host);
  function updateScrollClearance(): void { host.style.setProperty("--editor-toolbar-height", `${toolbar.getBoundingClientRect().height}px`); if (zoom === "fit-page") updateZoom(); preview.style.setProperty("--editor-scroll-clearance", `${/auto|scroll/.test(getComputedStyle(preview).overflowY) ? 0 : toolbar.getBoundingClientRect().height}px`); }
  const toolbarSize = new ResizeObserver(updateScrollClearance);
  toolbarSize.observe(toolbar); toolbarSize.observe(preview);
  const lifetime = new AbortController(), undo: Snapshot[] = [], redo: Snapshot[] = [], controls = new Map<string, HTMLButtonElement | HTMLInputElement | HTMLSelectElement>();
  const historyStates = new Set<BrowserDocumentState>();
  let createdStates: BrowserDocumentState[] = [];
  function remember(stack: Snapshot[], entry: Snapshot): void { stack.push(entry); historyStates.add(entry.state); }
  function clearHistory(stack: Snapshot[]): void { for (const entry of stack.splice(0)) { historyStates.delete(entry.state); entry.state.dispose(); } }
  const ribbonTabs = new Map<string, { button: HTMLButtonElement; panel: HTMLElement; names: readonly string[]; context?: string }>();
  const tableActions = ["insertRow", "insertColumn", "deleteRow", "deleteColumn", "delete"] as const;
  const compactWidth = window.matchMedia("(pointer: coarse)").matches ? 1024 : 760;
  let ribbonChoice = 0;
  let activeRibbon = "Home", compact = host.getBoundingClientRect().width <= compactWidth, mobileToolsOpen = false;
  const mobileToolsToggle = document.createElement("button"), mobileCategory = document.createElement("select"), ribbonTools = document.createElement("div");
  host.toggleAttribute("data-compact", compact);
  function setMobileTools(open: boolean): void {
    mobileToolsOpen = compact && open;
    ribbonTools.hidden = compact && !mobileToolsOpen;
    mobileToolsToggle.setAttribute("aria-expanded", String(mobileToolsOpen));
    mobileToolsToggle.textContent = mobileToolsOpen ? "Done" : "Tools";
  }
  const editorSize = new ResizeObserver(entries => {
    const next = entries[0]!.contentRect.width <= compactWidth;
    if (next === compact) return;
    const focused = toolbar.contains(root.activeElement);
    compact = next; host.toggleAttribute("data-compact", compact); setMobileTools(false);
    if (focused) (compact ? mobileToolsToggle : ribbonTabs.get(activeRibbon)?.button)?.focus({ preventScroll: true });
  });
  editorSize.observe(host);
  let doc: BrowserDocument | undefined, canvas: CanvasDocument | undefined, selection: DocumentSelection | undefined, formatting: TextFormatting = {}, queue = Promise.resolve(), pending = 0, composing = false, disposed = false, filename = "document.docx";
  let readAloud: ReturnType<typeof showReadAloud> | undefined;
  let comparison: ReturnType<typeof createComparison> | undefined;
  let splitView: DocumentView | undefined, splitEnabled = false, secondaryActive = false, splitRatio = .5;
  function activeView(): DocumentView | undefined { return secondaryActive && splitView ? splitView : canvas?.view; }
  function selectionChanged(next: DocumentSelection | undefined): void {
    if (pending && !navigating || composing) return;
    if (JSON.stringify(next) !== JSON.stringify(selection)) { formatting = {}; selectedCells = undefined; selectedDrawing = undefined; selectedImage = undefined; }
    selection = next; syncInput(); outlineSelection(); updateToolbar();
  }
  function activatePane(secondary: boolean): void {
    if (secondaryActive === secondary || secondary && !splitView || composing) return;
    secondaryActive = secondary;
    const view = activeView(); if (!view) return;
    view.element.append(input); selection = view.selection ?? selection;
    formatting = {}; selectedCells = undefined; selectedDrawing = undefined; selectedImage = undefined; syncInput();
    marksSnapshot = mergeSnapshot = drawingGridSnapshot = gridlineSnapshot = undefined;
    if (selection) view.setSelection(selection, false);
    outlineSelection(); updateToolbar();
  }
  function mountSplit(): void {
    splitPane.hidden = false; host.setAttribute("data-split", "");
    splitView = canvas!.mount(splitPages, { zoom: zoom === "fit-page" ? "fit-width" : zoom, input, title: "Second document view", onSelectionChange: next => { if (secondaryActive) selectionChanged(next); } });
  }
  function removeSplit(): void {
    if (!splitEnabled) return;
    const current = selection; activatePane(false); selection = current; splitEnabled = false; splitView?.dispose(); splitView = undefined; splitPane.hidden = true; host.removeAttribute("data-split"); updateZoom(); updateToolbar(); focus();
  }
  preview.addEventListener("pointerdown", () => activatePane(false), { capture: true });
  splitPages.addEventListener("pointerdown", () => activatePane(true), { capture: true });
  preview.addEventListener("focusin", () => activatePane(false)); splitPages.addEventListener("focusin", () => activatePane(true));
  splitClose.addEventListener("click", removeSplit);
  function resizeSplit(ratio: number): void { splitRatio = Math.max(.2, Math.min(.8, ratio)); host.style.setProperty("--split-ratio", String(splitRatio)); splitHandle.setAttribute("aria-valuenow", String(Math.round(splitRatio * 100))); updateZoom(); }
  splitHandle.addEventListener("keydown", event => { if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return; event.preventDefault(); resizeSplit(event.key === "Home" ? .2 : event.key === "End" ? .8 : splitRatio + (event.key === "ArrowDown" ? .05 : -.05)); });
  splitHandle.addEventListener("pointerdown", event => { if (event.button !== 0 || event.target === splitClose) return; event.preventDefault(); const start = event.clientY, ratio = splitRatio, height = preview.clientHeight + splitPane.clientHeight; splitHandle.setPointerCapture(event.pointerId); const move = (next: PointerEvent) => resizeSplit(ratio + (next.clientY - start) / height); const end = () => { splitHandle.removeEventListener("pointermove", move); splitHandle.removeEventListener("pointerup", end); splitHandle.removeEventListener("pointercancel", end); }; splitHandle.addEventListener("pointermove", move); splitHandle.addEventListener("pointerup", end); splitHandle.addEventListener("pointercancel", end); });
  let formPanel: ReturnType<typeof createFormPanel> | undefined;
  let paintingBorders: false | "paint" | "erase" | "draw" = false;
  let selectedImage: string | undefined;
  let selectedDrawing: string | undefined;
  let selectionPane: ReturnType<typeof createSelectionPane> | undefined;
  let headerFooterSectionIndex: number | undefined;
  let selectedCells: StoredCellSelection | undefined;
  let reviewDisplay: "accepted" | "markup" | "original" = options.document?.revisionView ?? "accepted", reviewComments = options.document?.commentDisplay === "markers", explicitReviewDisplay = !!options.review;
  let reviewFilter: import("@onodocs/sdk").ReviewFilter = { ...options.document?.reviewFilter };
  let reviewPanel: ReturnType<typeof createReviewPanel> | undefined;
  let layoutMode: "print" | "web" | "draft" = "print";
  let reflowTimer: ReturnType<typeof setTimeout> | undefined;
  let pageMovement: "vertical" | "horizontal" = "vertical", pagesAcross = 1;
  let ruler: ReturnType<typeof createRuler> | undefined, showRuler = false;
  let navigating = false;
  let focusView = false, darkWorkspace = false, previousReadingMode: EditorMode = mode, focusScroll = { left: 0, top: 0 };
  let changeNotifications: Promise<void>[] = [];
  let typing: { text: string } | undefined;
  let painter: { formatting: TextFormatting; paragraph: ParagraphPropertyPatch; list: { kind: "bullet" | "decimal"; level: number } | null | undefined; repeat: boolean } | undefined;
  let painterSample: typeof painter;
  let outlineView: ReturnType<typeof createOutline> | undefined;
  let navigationPane: ReturnType<typeof createNavigationPane> | undefined;
  let stylePane: HTMLElement | undefined, styleFilter: HTMLInputElement | undefined, styleList: HTMLElement | undefined;
  let styleSnapshot: ReturnType<BrowserDocument["snapshot"]> | undefined;
  let styleChoices: readonly DocumentParagraphStyle[] = [];
  let clipboardWrite: Promise<ReturnType<typeof writeClipboard>> | undefined;
  let opening: AbortController | undefined;
  let inputText = "", inputStart = 0, inputEnd = 0;
  let inputParagraphs: { id: string; start: number; length: number }[] = [];
  const objectOutlines: DocumentAttachment[] = [];
  const gridlineOutlines: DocumentAttachment[] = [];
  let showMarks = false, marksSnapshot: ReturnType<BrowserDocument["snapshot"]> | undefined;
  let markAttachments: DocumentAttachment[] = [];
  let showMergeFields = false, mergeSnapshot: ReturnType<BrowserDocument["snapshot"]> | undefined;
  let mergeHighlights: DocumentAttachment[] = [];
  let zoom: number | "fit-width" | "fit-page" = "fit-width";
  let showDrawingGrid = false, drawingGridSnapshot: ReturnType<BrowserDocument["snapshot"]> | undefined;
  const drawingGrids: DocumentAttachment[] = [];
  let showGridlines = false, gridlineSnapshot: ReturnType<BrowserDocument["snapshot"]> | undefined;
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const paragraphQueries = new WeakMap<BrowserDocument["content"], readonly DocumentParagraph[]>();
  function paragraphs(): readonly DocumentParagraph[] {
    const query = requireDocument().snapshot();
    let values = paragraphQueries.get(query);
    if (!values) { values = query.paragraphs().all(); paragraphQueries.set(query, values); }
    return values;
  }
  const collapsed = (s: DocumentSelection) => s.start.paragraphId === s.end.paragraphId && s.start.offset === s.end.offset;
  const report = (message: string, error = false) => { if (status.textContent !== message) status.textContent = message; status.dataset.error = String(error); };
  let sessionDesign: DefaultDocumentDesign | null | undefined;
  const defaultDesignStorageKey = options.defaultFormattingStorageKey ?? "onodocs.editor.default-formatting";
  async function newDocumentBytes(signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
    const bytes = await createDocumentPackage(signal);
    let design = sessionDesign;
    if (design === undefined && defaultDesignStorageKey !== false) {
      try {
        const stored = localStorage.getItem(defaultDesignStorageKey);
        if (stored) {
          const value: unknown = JSON.parse(stored);
          if (!value || typeof value !== "object" || !("styles" in value) || !Array.isArray(value.styles) || !value.styles.some(style => style?.isDefault === true) || !value.styles.every(style => style && typeof style === "object" && (style.isDefault === true || Number.isInteger(style.headingLevel) && style.headingLevel >= 1 && style.headingLevel <= 9))) throw new Error("Invalid saved document design. Reset it in Design > Set as Default.");
          design = value as DefaultDocumentDesign;
        }
      } catch (error) { if (error instanceof DOMException && error.name === "SecurityError") return bytes; throw error; }
    }
    if (!design) return bytes;
    const blank = await openDocument(bytes, { ...options.document, signal });
    try { await blank.edit({ kind: "batch", commands: defaultDesignCommands(blank.paragraphStyles().all(), design) }); return await blank.save(); }
    finally { blank.dispose(); }
  }
  function requireDocument(): BrowserDocument { if (disposed) throw new Error("Editor is disposed."); if (!doc) throw new Error("Open a document first."); return doc; }
  function requireSelection(): DocumentSelection { requireDocument(); if (!selection) throw new Error("Select document text first."); return selection; }
  function editable(): void { requireDocument(); if (mode !== "edit") throw new Error("Editing is unavailable in this document mode."); }
  function enqueue<T>(action: () => Promise<T>, notify = true, signal?: AbortSignal): Promise<T> {
    typing = undefined;
    pending++; input.setAttribute("aria-busy", "true");
    const notifications: Promise<void>[] = [];
    const operation = queue.then(async () => {
      if (disposed) throw new Error("Editor is disposed.");
      changeNotifications = notifications;
      const states: BrowserDocumentState[] = []; createdStates = states;
      try { return await action(); }
      finally { for (const state of states) if (!historyStates.has(state)) state.dispose(); }
    });
    const failed = (error: unknown) => { if (!disposed && !signal?.aborted) { report(error instanceof Error ? error.message : String(error), true); options.onError?.(error); } };
    queue = operation.then(() => {}, failed).finally(() => { pending--; if (!disposed) { input.setAttribute("aria-busy", String(pending > 0)); updateToolbar(); } });
    const completed = operation.then(async value => { try { await Promise.all(notifications); } catch (error) { failed(error); throw error; } return value; });
    if (notify) return completed;
    void completed.catch(() => {});
    return operation;
  }
  async function fill(answers: FormAnswers): Promise<void> {
    if (mode !== "form" || !formDefinition) throw new Error("Answers can only be changed in form mode.");
    const previous = await snapshot();
    await documentForm!.fill(answers, { signal: lifetime.signal });
    remember(undo, previous); clearHistory(redo); formPanel?.refresh(); await changed({});
  }
  async function changed(change: EditorChange): Promise<void> {
    readAloud?.close(); readAloud = undefined;
    if (!options.onChange) return;
    const bytes = await requireDocument().save({ fields: "preserve" });
    const notification = Promise.resolve().then(() => options.onChange!(result, { ...change, bytes }));
    void notification.catch(() => {});
    changeNotifications.push(notification);
  }
  async function event(action: () => Promise<unknown>): Promise<void> { try { await action(); } catch (error) { if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) report(error instanceof Error ? error.message : String(error), true); } finally { if (!disposed && mobileToolsOpen && !root.activeElement) mobileCategory.focus({ preventScroll: true }); } }
  function syncInput(): void {
    if (!doc || !selection || composing) return;
    const first = doc.content.get(selection.start.paragraphId);
    if (first?.kind !== "paragraph") return;
    const all = selection.start.paragraphId === selection.end.paragraphId ? [first] : paragraphs();
    const values = all.length === 1 ? all : all.slice(all.findIndex(p => p.id === first.id), all.findIndex(p => p.id === selection!.end.paragraphId) + 1);
    let offset = 0;
    inputParagraphs = values.map(p => { const value = { id: p.id, start: offset, length: p.text.length }; offset += p.text.length + 1; return value; });
    inputText = values.map(p => p.text).join("\n"); inputStart = selection.start.offset; inputEnd = (inputParagraphs.at(-1)?.start ?? 0) + selection.end.offset;
    if (input.value !== inputText) input.value = inputText;
    input.setSelectionRange(inputStart, inputEnd);
  }
  function focus(scroll = true): void { const view = activeView(); if (view && input.parentElement !== view.element) view.element.append(input); if (selection) activeView()?.setSelection(selection, scroll && !mobileToolsOpen); syncInput(); if (mode === "edit" && !mobileToolsOpen) input.focus({ preventScroll: true }); }
  function selectInput(): void {
    if (pending || composing || !selection || !inputParagraphs.length || input.value !== inputText || input.selectionStart === inputStart && input.selectionEnd === inputEnd) return;
    const position = (offset: number) => { const p = inputParagraphs.find(p => offset <= p.start + p.length) ?? inputParagraphs.at(-1)!; return { paragraphId: p.id, offset: Math.min(p.length, Math.max(0, offset - p.start)) }; };
    inputStart = input.selectionStart; inputEnd = input.selectionEnd;
    selection = { start: position(inputStart), end: position(inputEnd) }; formatting = {}; selectedDrawing = undefined; selectedImage = undefined; selectedCells = undefined;
    activeView()?.setSelection(selection); outlineSelection(); updateToolbar();
  }
  input.addEventListener("select", selectInput);
  input.addEventListener("beforeinput", selectInput);
  input.setAttribute("aria-description", "Edit the current paragraph. Use F6 or Escape for document tools. In tables, Tab and Shift+Tab move between cells.");
  const tableStyleOptions = [["firstRow", "Header row"], ["lastRow", "Total row"], ["firstColumn", "First column"], ["lastColumn", "Last column"], ["bandedRows", "Banded rows"], ["bandedColumns", "Banded columns"]] as const;
  function updateToolbar(): void {
    if (mode !== "edit") paintingBorders = false;
    controls.get("table:borderPainter")?.setAttribute("aria-pressed", String(paintingBorders === "paint"));
    controls.get("table:eraser")?.setAttribute("aria-pressed", String(paintingBorders === "erase"));
    for (const name of ["drawTable", "table:drawTable"]) controls.get(name)?.setAttribute("aria-pressed", String(paintingBorders === "draw"));
    for (const value of ["vertical", "horizontal"]) controls.get(`view:${value}`)?.setAttribute("aria-pressed", String(pageMovement === value));
    const pageCount = controls.get("view:multiple"); if (pageCount) pageCount.value = String(pagesAcross);
    ruler?.setVisible(showRuler && layoutMode === "print"); ruler?.update(); controls.get("view:ruler")?.setAttribute("aria-pressed", String(showRuler));
    if (host.hasAttribute("data-review-open")) {
      selectionPane?.dispose(); selectionPane = undefined; navigationPane?.element.remove(); navigationPane = undefined;
      stylePane?.remove(); stylePane = undefined; styleList = undefined; styleFilter = undefined; host.removeAttribute("data-styles-pane");
    }
    controls.get("view:read")?.setAttribute("aria-pressed", String(mode === "view" && !outlineView && layoutMode === "print"));
    if ((mode === "form" || host.hasAttribute("data-review-open")) && outlineView) { outlineView.dispose(); outlineView = undefined; host.removeAttribute("data-outline"); }
    controls.get("view:outline")?.setAttribute("aria-pressed", String(!!outlineView));
    controls.get("view:print")?.setAttribute("aria-pressed", String(mode !== "view" && !outlineView && layoutMode === "print"));
    for (const value of ["web", "draft"]) controls.get(`view:${value}`)?.setAttribute("aria-pressed", String(layoutMode === value && !outlineView));
    controls.get("view:dark")?.setAttribute("aria-pressed", String(darkWorkspace));
    controls.get("view:focus")?.setAttribute("aria-pressed", String(focusView));
    updateStyleChoices();
    const bibliography = doc?.content.first()?.bibliography, citationStyle = controls.get("bibliography:style");
    if (citationStyle) { const name = `${bibliography?.styleName ?? ""} ${bibliography?.style ?? ""}`; citationStyle.value = /\bMLA(?:\b|Ninth)/i.test(name) ? "mla" : !name.trim() || /\bAPA(?:\b|Seventh)/i.test(name) ? "apa" : ""; }
    if (doc) { navigationPane?.refresh(); selectionPane?.refresh(); outlineView?.refresh(); }
    if (selectionPane) selectionPane.element.hidden = mode === "form";
    controls.get("selectionPane")?.setAttribute("aria-pressed", String(!!selectionPane));
    if (navigationPane) navigationPane.element.hidden = mode === "form";
    host.toggleAttribute("data-navigation-pane", (!!navigationPane || !!selectionPane) && mode !== "form");
    controls.get("navigationPane")?.setAttribute("aria-pressed", String(!!navigationPane));
    tableGridlines();
    const marked = showMarks ? doc?.snapshot() : undefined;
    if (marked !== marksSnapshot) { for (const mark of markAttachments) mark.dispose(); markAttachments = []; marksSnapshot = marked; if (marked && activeView()) markAttachments = formattingMarks(doc!, activeView()!); }
    const merged = showMergeFields ? doc?.snapshot() : undefined;
    if (merged !== mergeSnapshot) { for (const mark of mergeHighlights) mark.dispose(); mergeHighlights = []; mergeSnapshot = merged; if (merged && activeView()) mergeHighlights = highlightMergeFields(doc!, activeView()!); }
    controls.get("merge:highlight")?.setAttribute("aria-pressed", String(showMergeFields));
    controls.get("formattingMarks")?.setAttribute("aria-pressed", String(showMarks));
    const gridded = showDrawingGrid ? doc?.snapshot() : undefined;
    if (gridded !== drawingGridSnapshot) {
      for (const grid of drawingGrids.splice(0)) grid.dispose(); drawingGridSnapshot = gridded;
      if (gridded && activeView()) for (const page of doc!.pages) {
        const grid = document.createElement("div"); grid.className = "drawing-grid"; grid.setAttribute("aria-hidden", "true");
        Object.assign(grid.style, { width: "100%", height: "100%", pointerEvents: "none", backgroundImage: "linear-gradient(#7f94a633 1px,transparent 1px),linear-gradient(90deg,#7f94a633 1px,transparent 1px)", backgroundSize: "24px 24px" });
        drawingGrids.push(activeView()!.attach(grid, { anchor: page, interactive: false }));
      }
    }
    controls.get("view:gridlines")?.setAttribute("aria-pressed", String(showDrawingGrid));
    for (const [name, value] of [["zoomWidth", "fit-width"], ["zoomPage", "fit-page"]] as const) controls.get(name)?.setAttribute("aria-pressed", String(zoom === value && pagesAcross === 1));
    const picture = selectedImage && doc?.content.get(selectedImage), drawing = selectedDrawing && doc?.content.get(selectedDrawing);
    controls.get("formatPainter")?.setAttribute("aria-pressed", String(!!painter));
    preview.toggleAttribute("data-format-painter", !!painter);
    controls.get("table:gridlines")?.setAttribute("aria-pressed", String(showGridlines));
    const paragraph = doc?.content.get(selection?.start.paragraphId ?? ""), inTable = !!paragraph && !!doc!.content.within(paragraph).closest("table").first();
    for (const [name, control] of controls) {
      const reviewControl = name === "review" || name.startsWith("view:") || name.startsWith("review:");
      control.disabled = !doc && !["open", "new"].includes(name) || mode !== "edit" && !["open", "save", "pdf", "print", "find", "mode", "formattingMarks", "merge:highlight", "view:gridlines", "zoom", "zoomOut", "zoomIn", "zoomReset", "zoomWidth", "zoomPage", "navigationPane", "selectionPane", "bookmark", "wordCount", "readAloud", "accessibility", "protect", "note:show", "note:return", "note:nextFootnote", "note:nextEndnote"].includes(name) && !reviewControl && !name.startsWith("view:");
      if (name === "view:read" && !allowedModes.includes("view")) control.disabled = true;
      if (name === "undo") control.disabled = !undo.length || mode === "view" || mode !== "edit" && undo.at(-1)?.mode !== mode;
      if (name === "redo") control.disabled = !redo.length || mode === "view" || mode !== "edit" && redo.at(-1)?.mode !== mode;
      if (["pageBreak", "blankPage", "breaks"].includes(name)) control.disabled ||= !!inTable || paragraph?.kind !== "paragraph" || paragraph.story !== "body";
      if (name === "dictate") control.disabled ||= !selection || !!selectedCells || !!selectedImage || !!selectedDrawing;
      if (["writing:rewrite", "writing:synonyms"].includes(name)) control.disabled ||= !selection || collapsed(selection) || !!selectedCells || !!selectedImage || !!selectedDrawing;
      if (name === "sort") control.disabled ||= !!selectedCells || !selection || selection.start.paragraphId === selection.end.paragraphId;
      if (name === "formatPainter") control.disabled ||= !!selectedImage || !!selectedCells;
      if (name === "imageTools" || name.startsWith("picture:")) control.disabled ||= !selectedImage;
      if (name === "chart:axes") control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.chart?.axes;
      if (name === "chart:series") control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.chart;
      if (name.startsWith("chart:")) control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.chart || name !== "chart:delete" && name !== "chart:properties" && !drawing.chart.dataEditable;
      if (name.startsWith("shape:")) control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.shape && !(drawing.group && ["properties", "delete", "position", "wrap", "align", "rotate", "forward", "backward", "front", "back", "group", "ungroup"].includes(name.slice(6)));
      if (name.startsWith("arrange:")) control.disabled ||= !selectedImage && (!drawing || drawing.kind !== "drawing" || !drawing.shape && !drawing.group);
      if (name === "arrange:group" || name === "shape:group" || name === "picture:group") control.disabled ||= (selectionPane?.selectedIds.length ?? 0) < 2;
      if (name === "arrange:size") control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.group;
      if (name === "arrange:ungroup" || name === "shape:ungroup") control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.group;
      if (name === "shape:textBox" || name === "shape:wordArt") control.disabled ||= !drawing || drawing.kind !== "drawing" || !drawing.shape?.textBox;
      if (["forward", "backward", "front", "back"].some(action => name === `picture:${action}` || name === `arrange:${action}` || name === `shape:${action}`)) control.disabled ||= picture && picture.kind === "image" ? picture.placement === "inline" : !drawing || drawing.kind !== "drawing" || (drawing.shape ?? drawing.group)?.layout.wrap === "inline";
      if (name === "contents" || name === "contents:level" || name === "crossReference" || name === "insert:crossReference" || name === "caption" || name === "note:footnote" || name === "note:endnote") control.disabled ||= paragraph?.kind !== "paragraph" || paragraph.story !== "body";
      if (name === "note:return") control.disabled ||= !currentNote();
      if (name === "note:show") control.disabled ||= !doc?.content.stories().all().some(story => story.note);
      if (name === "note:nextFootnote" || name === "note:nextEndnote") control.disabled ||= !doc?.content.stories().all().some(story => story.note && story.story === (name === "note:nextFootnote" ? "footnote" : "endnote"));
      if (name === "note:settings") control.disabled ||= paragraph?.kind !== "paragraph" || paragraph.story !== "body" && !currentNote();
      if (["header", "footer", "pageNumber"].includes(name)) control.disabled ||= selectedSectionIndex() === undefined;
      if (["closeHeaderFooter", "goHeader", "goFooter"].includes(name)) control.disabled ||= paragraph?.kind !== "paragraph" || !["header", "footer"].includes(paragraph.story ?? "");
      if (["page", "paperSize", "orientation", "pageMargins", "columns", "lineNumbers"].includes(name)) control.disabled ||= paragraph?.kind !== "paragraph" || paragraph.sectionIndex === undefined;
      if (["clearFormatting", "changeCase"].includes(name)) control.disabled ||= !selection || collapsed(selection) || !!selectedCells;
      if (name === "copy" || name === "cut") control.disabled ||= !selectedImage && !(drawing && drawing.kind === "drawing" && drawing.chart) && !selectedCells && (!selection || collapsed(selection));
      if (name.startsWith("table:")) control.disabled ||= !inTable;
      if (["table:mergeCells", "table:unmergeCells"].includes(name)) control.disabled ||= !selectedCells;
      if (["review:newComment", "review:insertComment", "review:deleteComment", "review:accept", "review:reject", "review:acceptAll", "review:rejectAll"].includes(name)) control.disabled ||= mode !== "edit" && mode !== "review";
      if (name === "review:tracking") { control.disabled ||= mode !== "edit"; control.setAttribute("aria-pressed", String(!!reviewPanel?.state?.tracking)); }
      if (["review:previousComment", "review:nextComment", "review:deleteComment"].includes(name)) control.disabled ||= !reviewPanel?.state?.comments.some(comment => !comment.parentId && comment.selection);
      if (["review:previousChange", "review:nextChange", "review:accept", "review:reject", "review:acceptAll", "review:rejectAll"].includes(name)) control.disabled ||= !reviewPanel?.state?.revisions.length;
    }
    const display = controls.get("review:display"); if (display) display.value = reviewDisplay;
    controls.get("review:markers")?.setAttribute("aria-pressed", String(reviewComments));
    host.dataset.mode = mode;
    input.readOnly = mode !== "edit";
    input.setAttribute("aria-readonly", String(input.readOnly));
    const modeControl = controls.get("mode"); if (modeControl) { modeControl.value = mode; modeControl.disabled = false; }
    for (const [name, control] of controls) {
      const custom = options.commands?.find(command => command.id === name);
      const reviewControl = name === "review" || name.startsWith("view:") || name.startsWith("review:");
      const visible = custom ? (custom.modes ?? ["edit"]).includes(mode) : mode === "edit" || ["open", "save", "pdf", "print", "find", "mode", "undo", "redo", "formattingMarks", "merge:highlight", "view:gridlines", "zoom", "zoomOut", "zoomIn", "zoomReset", "zoomWidth", "zoomPage", "navigationPane", "selectionPane", "bookmark", "wordCount", "readAloud", "accessibility", "protect", "note:show", "note:return", "note:nextFootnote", "note:nextEndnote"].includes(name) || reviewControl || name.startsWith("view:");
      if (custom) control.disabled = !doc || !visible;
      control.hidden = !visible || mode === "form" && reviewControl || mode === "view" && ["undo", "redo"].includes(name) || !!drawing && drawing.kind === "drawing" && !!drawing.group && ["shape:effects", "shape:fill", "shape:outline", "shape:preset", "shape:text", "shape:textBox", "shape:wordArt"].includes(name);
    }
    for (const [name, menu] of Object.entries(menuDefinitions)) {
      const trigger = controls.get(name)!, items = menu.commands.flatMap(command => { const control = controls.get(command); return control && enabledTools.has(command) ? [control] : []; });
      trigger.hidden = items.every(control => control.hidden); trigger.disabled = items.every(control => control.hidden || control.disabled);
    }
    for (const group of toolbar.querySelectorAll<HTMLElement>(".tool-group,.tool-line,.quick-access")) group.hidden = [...group.querySelectorAll<HTMLElement>("[data-command]")].every(control => control.hidden);
    for (const tab of ribbonTabs.values()) tab.button.hidden = !tab.names.some(name => { const control = controls.get(name); return control && !control.hidden; }) || !!tab.context && !!controls.get(tab.context)?.disabled;
    if (ribbonTabs.size) {
      const current = ribbonTabs.get(activeRibbon), home = ribbonTabs.get("Home");
      selectRibbon(current && !current.button.hidden ? activeRibbon : home && !home.button.hidden ? "Home" : [...ribbonTabs].find(([, tab]) => !tab.button.hidden)?.[0] ?? "File");
    }
    if (inTable && paragraph) {
      const row = doc!.content.within(paragraph).closest("row").one();
      controls.get("table:rowSplit")?.setAttribute("aria-pressed", String(!row.properties.authored.cantSplit));
      controls.get("table:repeatHeader")?.setAttribute("aria-pressed", String(!!row.properties.authored.header));
      const { cell, table } = selectedTable(), look = table.properties.authored.look;
      for (const [key] of tableStyleOptions) controls.get("table:look:" + key)?.setAttribute("aria-pressed", String(look?.[key] ?? key.startsWith("banded")));
      for (const style of standardTableStyles) controls.get("table:style:" + style.id)?.setAttribute("aria-pressed", String(table.properties.authored.styleId === style.id));
      const stylePicker = controls.get("table:style"); if (stylePicker && root.activeElement !== stylePicker) stylePicker.value = table.properties.authored.styleId ?? "";
      for (const vertical of ["top", "center", "bottom"]) for (const horizontal of ["left", "center", "right"]) controls.get(`table:align:${vertical}:${horizontal}`)?.setAttribute("aria-pressed", String((cell.properties.authored.verticalAlignment ?? "top") === vertical && paragraph.kind === "paragraph" && paragraph.alignment === horizontal));
    }
    if (paragraph?.kind === "paragraph") {
      const control = controls.get("lineSpacing"), line = paragraph.properties.effective.lineSpacing, value = line && "multiple" in line ? String(line.multiple) : line ? "custom" : "1";
      if (control instanceof HTMLSelectElement && root.activeElement !== control) { if (![...control.options].some(option => option.value === value)) control.add(new Option(value === "custom" ? "Custom" : value, value)); control.value = value; }
    }
    if (paragraph?.kind === "paragraph") for (const name of ["indentStart", "indentEnd", "spacingBefore", "spacingAfter"] as const) { const control = controls.get(name); if (control && root.activeElement !== control) control.value = String(paragraph.properties.effective[name] ?? 0); }
    controls.get("view:sideBySide")?.setAttribute("aria-pressed", String(!!comparison));
    controls.get("view:syncScroll")?.setAttribute("aria-pressed", String(!!comparison?.synchronized));
    const syncScroll = controls.get("view:syncScroll"); if (syncScroll) syncScroll.disabled = !comparison;
    controls.get("view:split")?.setAttribute("aria-pressed", String(splitEnabled));
    if (comparison || splitEnabled) for (const name of ["view:horizontal", "view:multiple"]) { const control = controls.get(name); if (control) control.disabled = true; }
    controls.get("stylesPane")?.setAttribute("aria-expanded", String(!!stylePane && mode === "edit"));
    if (formPanel) formPanel.element.hidden = mode !== "form";
    if (!doc || !selection) return;
    const format = currentFormatting();
    for (const name of ["bold", "italic", "underline", "strike"] as const) controls.get(name)?.setAttribute("aria-pressed", String(!!format[name]));
    for (const alignment of ["subscript", "superscript"]) controls.get(alignment)?.setAttribute("aria-pressed", String(format.verticalAlignment === alignment));
    const values = { font: format.fontFamily ?? options.document?.defaultFont ?? "Calibri", size: String(format.fontSize ?? 11), color: format.color ?? "#000000", alignment: paragraph?.kind === "paragraph" ? paragraph.alignment : "left", style: paragraph?.kind === "paragraph" ? paragraph.styleId ?? "" : "", list: paragraph?.kind === "paragraph" && paragraph.list ? paragraph.list.kind === "bullet" ? "bullet" : "decimal" : "" };
    for (const [name, value] of Object.entries(values)) { const control = controls.get(name); if (control && root.activeElement !== control) { if ((name === "font" || name === "style" && !options.styles) && control instanceof HTMLSelectElement && ![...control.options].some(o => o.value === value)) control.add(new Option(value)); control.value = value; } }
    for (const name of ["alignment", "list", "lineSpacing"]) { const control = controls.get(name); if (control instanceof HTMLSelectElement) updateRibbonSelect(control); }
    const gallery = controls.get("styleGallery");
    if (gallery) { const selected = styleChoices.find(style => style.id === values.style); styleCard(gallery, selected ?? { id: "", name: "Default paragraph" }); }
    styleList?.querySelectorAll<HTMLButtonElement>("[data-style-id]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.styleId === values.style)));
    if (stylePane) stylePane.hidden = mode !== "edit";
    host.toggleAttribute("data-styles-pane", !!stylePane && mode === "edit");
    input.style.fontFamily = values.font; input.style.fontSize = `${values.size}pt`;
  }
  function currentFormatting(): TextFormatting {
    const p = doc?.content.get(selection?.start.paragraphId ?? "");
    let offset = 0, chosen: TextFormatting = {};
    if (p) for (const run of doc!.content.within(p).runs()) { chosen = run.properties.effective; offset += run.text.length; if (offset > selection!.start.offset || collapsed(selection!) && offset === selection!.start.offset) break; }
    return { ...chosen, ...formatting };
  }
  async function snapshot(): Promise<Snapshot> { const range = requireSelection(), all = paragraphs(), state = await requireDocument().captureState(); createdStates.push(state); return { state, mode, ribbon: activeRibbon, ...(selectedDrawing ? { drawingIndex: requireDocument().content.descendants().all().filter(element => element.kind === "drawing").findIndex(element => element.id === selectedDrawing) } : {}), ...(selectedImage ? { imageIndex: requireDocument().content.images().all().findIndex(image => image.id === selectedImage) } : {}), cells: selectedCells, restoreState: options.captureHistory?.(), bytes: await requireDocument().save({ fields: "preserve" }), start: all.findIndex(p => p.id === range.start.paragraphId), end: all.findIndex(p => p.id === range.end.paragraphId), selection: range, formatting: { ...formatting } }; }
  async function mount(bytes: ArrayBuffer | Uint8Array | Blob, signal = lifetime.signal): Promise<void> {
    ++linkHoverSequence; preview.removeAttribute("title"); splitPages.removeAttribute("title");
    painter = undefined; painterSample = undefined; paintingBorders = false;
    const next = await openDocument(bytes, { ...options.document, layoutView: layoutPolicy(), commentDisplay: reviewComments ? "markers" : "hidden", reviewFilter, ...(explicitReviewDisplay ? { revisionView: reviewDisplay } : {}), signal: AbortSignal.any([lifetime.signal, signal, ...(options.document?.signal ? [options.document.signal] : [])]) });
    if (disposed) { next.dispose(); throw new Error("Editor is disposed."); }
    if (signal.aborted) { next.dispose(); signal.throwIfAborted(); }
    for (const outline of objectOutlines.splice(0)) outline.dispose(); selectedDrawing = undefined; selectedImage = undefined; selectedCells = undefined;
    readAloud?.close(); readAloud = undefined;
    const splitScroll = splitPages.scrollTop, primaryScroll = preview.scrollTop, wasSecondary = secondaryActive;
    canvas?.dispose(); splitView = undefined; secondaryActive = false; doc?.dispose(); doc = next;
    canvas = createDocument(doc, { container: preview, viewOptions: { pageMovement, zoom: zoom === "fit-page" ? "fit-width" : zoom, input, onSelectionChange: next => { if (!secondaryActive) selectionChanged(next); } } });
    if (splitEnabled) { mountSplit(); secondaryActive = wasSecondary; requestAnimationFrame(() => { if (!disposed && splitEnabled) { splitPages.scrollTop = splitScroll; preview.scrollTop = primaryScroll; } }); }
    formPanel?.element.remove(); formPanel = undefined;
    documentForm = formDefinition ? createForm(next, formDefinition) : undefined;
    if (documentForm) {
      formPanel = createFormPanel({ ...documentForm, fill: answers => enqueue(() => fill(answers), false), complete: () => result.completeForm(), answers: () => result.answers() }, field => {
        const control = requireDocument().content.contentControls().where({ tag: field.tag }).first();
        const paragraph = control && (requireDocument().content.within(control).paragraphs().first() ?? requireDocument().content.within(control).closest("paragraph").first());
        if (paragraph) result.select({ start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } }, false);
      }, options.onFormComplete);
      root.append(formPanel.element);
    }
    const first = paragraphs()[0]; selection = first ? { start: { paragraphId: first.id, offset: 0 }, end: { paragraphId: first.id, offset: 0 } } : undefined;
    const styles = controls.get("style") as HTMLSelectElement | undefined;
    updateZoom();
    if (styles && !options.styles) { styles.replaceChildren(new Option("Default paragraph", "")); for (const style of doc.paragraphStyles()) styles.add(new Option(style.name, style.id)); }
    const tableStyles = controls.get("table:style") as HTMLSelectElement | undefined;
    if (tableStyles) { tableStyles.replaceChildren(new Option("No table style", "")); for (const style of doc.tableStyles()) tableStyles.add(new Option(style.name, style.id)); }
    await reviewPanel?.refresh();
  }
  async function apply(command: EditorCommand | undefined, update?: () => void | Promise<void>, scroll = true): Promise<import("@onodocs/sdk").DocumentEditResult | import("@onodocs/sdk").DocumentReviewResult | undefined> {
    let change: import("@onodocs/sdk").DocumentEditResult | import("@onodocs/sdk").DocumentReviewResult | undefined;
    editable(); const previous = await snapshot(), before = paragraphs(), beforeQuery = requireDocument().snapshot(), edit = command ? { ...command, selection: requireSelection() } as DocumentEdit : undefined;
    if (command) {
      const drawingIndex = selectedDrawing ? requireDocument().content.descendants().all().filter(element => element.kind === "drawing").findIndex(element => element.id === selectedDrawing) : -1;
      const imageIndex = selectedImage ? requireDocument().content.images().all().findIndex(image => image.id === selectedImage) : -1;
      const review = options.review ? await requireDocument().readReview() : undefined;
      if (review?.tracking && command.kind !== "replace" && command.kind !== "format") throw new Error("Stop tracking before changing document structure.");
      if (review?.tracking && command.kind === "format") {
        const range = requireSelection(), all = paragraphs(), index = all.findIndex(p => p.id === range.start.paragraphId), endIndex = all.findIndex(p => p.id === range.end.paragraphId);
        change = await requireDocument().review({ kind: "trackedFormat", selection: range, formatting: command.formatting, identity: options.review!.identity() });
        selection = { start: { ...range.start, paragraphId: paragraphs()[index]!.id }, end: { ...range.end, paragraphId: paragraphs()[endIndex]!.id } };
      } else if (review && command.kind === "replace" && (review.tracking || review.comments.length || review.revisions.length)) {
        const range = requireSelection(), index = paragraphs().findIndex(p => p.id === range.start.paragraphId);
        change = await requireDocument().review(review.tracking ? { kind: "trackedReplace", selection: range, text: command.text, identity: options.review!.identity() } : { kind: "replaceText", selection: range, text: command.text, paragraphBreaks: command.paragraphBreaks === true });
        const lines = !review.tracking && command.paragraphBreaks === true ? command.text.split("\n") : [command.text], caret = { paragraphId: paragraphs()[index + lines.length - 1]!.id, offset: (lines.length === 1 ? range.start.offset : 0) + lines.at(-1)!.length }; selection = { start: caret, end: caret };
        if (command.formatting && command.text.length) {
          const inserted = { start: { paragraphId: paragraphs()[index]!.id, offset: range.start.offset }, end: caret };
          try {
            if (review.tracking) change = await requireDocument().review({ kind: "trackedFormat", selection: inserted, formatting: command.formatting, identity: options.review!.identity() });
            else change = await requireDocument().edit({ kind: "format", selection: inserted, formatting: command.formatting });
          } catch (error) { await restoreSnapshot(previous, scroll); throw error; }
          selection = { start: { ...caret, paragraphId: paragraphs()[index + lines.length - 1]!.id }, end: { ...caret, paragraphId: paragraphs()[index + lines.length - 1]!.id } };
        }
      } else { const result = await requireDocument().edit({ ...command, selection: requireSelection() } as DocumentEdit); selection = result.selection; change = result;
        const propertyOnly = (edit: EditorCommand): boolean => edit.kind === "bibliographyStyle" || edit.kind === "bibliographySource" || edit.kind === "page" || edit.kind === "watermark" || edit.kind === "theme" || edit.kind === "documentProperties" || edit.kind === "properties" || edit.kind === "paragraphStyle" || edit.kind === "batch" && edit.commands.every(propertyOnly);
        selectedCells = propertyOnly(command) ? previous.cells : undefined;
        if (propertyOnly(command) || command.kind === "list" || command.kind === "batch" && command.commands.every(edit => edit.kind === "properties" || edit.kind === "list")) {
          const all = paragraphs(), bibliographyEdit = (edit: EditorCommand): boolean => edit.kind === "bibliographySource" || edit.kind === "bibliographyStyle" || edit.kind === "batch" && edit.commands.some(bibliographyEdit);
          const ordinaryBefore = before.filter(paragraph => !paragraph.bibliography), ordinaryAfter = all.filter(paragraph => !paragraph.bibliography);
          const bibliographyBefore = before.filter(paragraph => paragraph.bibliography?.selection.start.paragraphId === paragraph.id), bibliographyAfter = all.filter(paragraph => paragraph.bibliography?.selection.start.paragraphId === paragraph.id);
          const point = (value: DocumentSelection["start"], index: number) => {
            let offset = value.offset, target = all[index]!;
            if (bibliographyEdit(command)) {
              const paragraph = before[index]!;
              if (paragraph.bibliography) { const ordinal = bibliographyBefore.findIndex(value => value.id === paragraph.bibliography!.selection.start.paragraphId); target = bibliographyAfter[ordinal] ?? all[0]!; offset = 0; }
              else { target = ordinaryAfter[ordinaryBefore.indexOf(paragraph)] ?? all[0]!;
                const oldRuns = beforeQuery.within(paragraph).runs().all(), newRuns = requireDocument().content.within(target).runs().all(), runIndex = oldRuns.findIndex(run => offset >= run.selection.start.offset && offset <= run.selection.end.offset), oldRun = oldRuns[runIndex], newRun = newRuns[runIndex];
                if (oldRun && newRun) offset = newRun.selection.start.offset + (offset === oldRun.selection.end.offset ? newRun.text.length : Math.min(offset - oldRun.selection.start.offset, newRun.text.length));
              }
            }
            return { paragraphId: target.id, offset: Math.min(offset, target.text.length) };
          };
          selection = { start: point(previous.selection.start, previous.start), end: point(previous.selection.end, previous.end) };
        }
      }
      if (command.kind === "replace" || command.kind === "paste" || command.kind === "pasteTable") formatting = {};
      const visualPropertiesOnly = command.kind === "batch" && command.commands.every(edit => (edit.kind === "chartProperties" || edit.kind === "imageProperties" || edit.kind === "shapeProperties" || edit.kind === "groupProperties") && !edit.remove);
      selectedDrawing = ((command.kind === "chartProperties" || command.kind === "shapeProperties" || command.kind === "groupProperties") && !command.remove || visualPropertiesOnly) ? requireDocument().content.descendants().all().filter(element => element.kind === "drawing")[drawingIndex]?.id : undefined;
      if ((command.kind === "shapeGroup" || command.kind === "chart" || command.kind === "shape" || command.kind === "group") && selection) selectedDrawing = requireDocument().content.within(requireDocument().content.get(selection.start.paragraphId)!).descendants().all().find(element => element.kind === "drawing")?.id;
      selectedImage = (command.kind === "imageProperties" && !command.remove || visualPropertiesOnly) ? requireDocument().content.images().at(imageIndex)?.id : undefined;
    }
    try { await update?.(); } catch (error) { await restoreSnapshot(previous, scroll); throw error; }
    outlineSelection();
    remember(undo, previous); clearHistory(redo); await activeView()?.whenRendered({ visibleOnly: true }); focus(scroll); updateToolbar(); report("Document changed."); await changed({ ...(edit ? { edit } : {}), paragraphs: before });
    await reviewPanel?.refresh();
    return change;
  }
  function tableGridlines(): void {
    const snapshot = showGridlines && mode === "edit" ? doc?.snapshot() : undefined;
    if (snapshot === gridlineSnapshot) return;
    for (const outline of gridlineOutlines.splice(0)) outline.dispose();
    gridlineSnapshot = snapshot;
    if (!snapshot || !activeView()) return;
    const drawn = new Set<string>();
    for (const cell of snapshot.tables().cells()) for (const fragment of doc!.geometry.fragments(cell)) {
      const bounds = fragment.rectangle, key = `${fragment.pageIndex}:${bounds.x}:${bounds.y}:${bounds.width}:${bounds.height}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const outline = document.createElement("div"); outline.className = "table-gridline"; outline.setAttribute("aria-hidden", "true");
      Object.assign(outline.style, { width: "100%", height: "100%", boxSizing: "border-box", border: "1px dotted #7f94a6", pointerEvents: "none" });
      gridlineOutlines.push(activeView()!.attach(outline, { anchor: fragment, interactive: false }));
    }
  }
  function outlineSelection(): void {
    for (const outline of objectOutlines.splice(0)) outline.dispose();
    const paragraph = doc?.content.get(selection?.start.paragraphId ?? "");
    const target = selectedImage || selectedDrawing ? doc?.content.get((selectedImage ?? selectedDrawing)!) : paragraph && doc!.content.within(paragraph).closest("table").first();
    if (!target || !activeView()) return;
    const cells = selectedCells ? selectedTable().cells : [];
    for (const fragment of cells.length ? cells.flatMap(cell => doc!.geometry.fragments(cell)) : doc!.geometry.fragments(target)) {
      const outline = document.createElement("div"); outline.setAttribute("aria-hidden", "true");
      Object.assign(outline.style, { width: "100%", height: "100%", outline: "2px solid var(--onodocs-accent,#b43829)", outlineOffset: "1px", background: cells.length ? "#2675b82b" : "transparent", pointerEvents: "none" });
      objectOutlines.push(activeView()!.attach(outline, { anchor: fragment, interactive: false }));
    }
    if (mode === "edit" && target.kind === "table") {
      if (paintingBorders === "draw") objectOutlines.push(...tableDrawing(doc!, activeView()!, target, (command, label) => event(async () => { await result.execute(command); root.querySelector<HTMLButtonElement>(`.table-drawing-cell[aria-label="${CSS.escape(label)}"]`)?.focus({ preventScroll: true }); report("Divider drawn. Draw another divider, or press Escape to finish."); }), report));
      else if (paintingBorders) objectOutlines.push(...tableBorderPainter(doc!, activeView()!, target, () => ({ style: borderStyle, width: borderWidth, color: borderColor }), (command, label) => event(async () => { await result.execute(command); root.querySelector<HTMLButtonElement>(`.border-painter-edge[aria-label="${CSS.escape(label)}"]`)?.focus({ preventScroll: true }); report(paintingBorders === "erase" ? "Edge erased. Choose another edge, or press Escape to finish." : "Border painted. Choose another edge, or press Escape to finish."); }), paintingBorders));
      else tableResizeHandles(target);
    }
    if (mode === "edit" && (target.kind === "image" || target.kind === "drawing" && (target.chart || target.shape || target.group))) pictureResizeHandles();
  }
  function pictureResizeHandles(): void {
    const drawing = selectedDrawing && requireDocument().content.get(selectedDrawing);
    const image = drawing && drawing.kind === "drawing" && drawing.chart ? { element: drawing, width: drawing.chart.width, height: drawing.chart.height, target: { kind: "chartProperties" as const, drawingId: drawing.id } } : selectedVisual(); if (!image) return;
    const name = image.element.kind === "image" ? "picture" : image.element.chart ? "chart" : image.element.group ? "group" : "shape";
    const view = activeView()!, ratio = image.width / image.height;
    for (const fragment of requireDocument().geometry.fragments(image.element)) {
      const preview = document.createElement("div"); preview.className = "picture-resize-preview";
      const attachment = view.attach(preview, { anchor: fragment, interactive: false }); objectOutlines.push(attachment);
      for (const [horizontal, vertical, label] of [[1, 0.5, `Resize ${name} width`], [0.5, 1, `Resize ${name} height`], [1, 1, `Resize ${name} proportionally`]] as const) {
        const node = document.createElement("button"); node.type = "button"; node.className = "picture-resize-handle"; node.setAttribute("aria-label", label); node.title = `${label}. Drag or use arrow keys. Shift changes by 10 points; Shift-drag the corner to unlock proportions.`;
        node.style.cursor = horizontal === 0.5 ? "ns-resize" : vertical === 0.5 ? "ew-resize" : "nwse-resize";
        let drag: { pointer: number; x: number; y: number; scale: number; width: number; height: number } | undefined;
        const round = (value: number) => Math.round(Math.max(0.05, value) * 20) / 20;
        const reset = () => { const previous = drag; drag = undefined; preview.style.display = "none"; if (previous && node.hasPointerCapture(previous.pointer)) node.releasePointerCapture(previous.pointer); return previous; };
        async function commit(width: number, height: number): Promise<void> {
          await result.execute({ ...image!.target, width: round(width), height: round(height) });
          root.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.focus({ preventScroll: true });
        }
        node.addEventListener("pointerdown", pointer => {
          if (pointer.button !== 0 || pending) return;
          pointer.preventDefault(); pointer.stopPropagation();
          const origin = view.toClient(fragment.pageIndex, { x: 0, y: 0 }), step = view.toClient(fragment.pageIndex, { x: 20, y: 0 });
          drag = { pointer: pointer.pointerId, x: pointer.clientX, y: pointer.clientY, scale: step.x - origin.x, width: image.width, height: image.height };
          node.focus({ preventScroll: true }); node.setPointerCapture(pointer.pointerId);
        });
        node.addEventListener("pointermove", pointer => {
          if (!drag) return;
          const t = fragment.transform, determinant = t.a * t.d - t.b * t.c;
          if (!determinant) return;
          const dx = (pointer.clientX - drag.x) / drag.scale, dy = (pointer.clientY - drag.y) / drag.scale;
          const localX = (t.d * dx - t.c * dy) / determinant, localY = (t.a * dy - t.b * dx) / determinant;
          let width = horizontal === 0.5 ? image.width : image.width + localX, height = vertical === 0.5 ? image.height : image.height + localY;
          if (horizontal === 1 && vertical === 1 && !pointer.shiftKey) {
            const factor = Math.max(0.05 / Math.min(image.width, image.height), 1 + (localX * image.width + localY * image.height) / (image.width * image.width + image.height * image.height));
            width = image.width * factor; height = image.height * factor;
          }
          drag.width = round(width); drag.height = round(height);
          Object.assign(preview.style, { display: "block", width: `${drag.width / image.width * 100}%`, height: `${drag.height / image.height * 100}%` });
          report(`${name === "picture" ? "Picture" : "Shape"} size: ${drag.width.toFixed(1)} × ${drag.height.toFixed(1)} pt`);
        });
        node.addEventListener("pointerup", () => { const previous = reset(); if (previous && (previous.width !== image.width || previous.height !== image.height)) event(() => commit(previous.width, previous.height)); });
        node.addEventListener("pointercancel", reset); node.addEventListener("lostpointercapture", () => { if (drag) reset(); });
        node.addEventListener("keydown", key => {
          if (key.key === "Escape" && drag) { key.preventDefault(); key.stopPropagation(); reset(); return; }
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key.key)) return;
          key.preventDefault(); key.stopPropagation();
          const delta = (key.key === "ArrowRight" || key.key === "ArrowDown" ? 1 : -1) * (key.shiftKey ? 10 : 1);
          const width = horizontal === 0.5 ? image.width : round(image.width + delta), height = vertical === 0.5 ? image.height : horizontal === 1 ? width / ratio : round(image.height + delta);
          event(() => commit(width, height));
        });
        objectOutlines.push(view.attach(node, { anchor: fragment, offset: { x: fragment.rectangle.width * horizontal - 75, y: fragment.rectangle.height * vertical - 75 }, size: { width: 150, height: 150 }, interactive: true }));
      }
    }
  }
  function tableResizeHandles(table: import("@onodocs/sdk").DocumentTable): void {
    const document = requireDocument(), view = activeView()!, widths = tableColumnWidths(table), total = widths.reduce((sum, width) => sum + width, 0), rtl = table.properties.authored.rightToLeft;
    function handle(fragment: ReturnType<typeof document.geometry.fragments>[number], axis: "x" | "y", offset: number, label: string, value: number, maximum: number, direction: number, commit: (value: number) => Promise<unknown>): void {
      const node = globalThis.document.createElement("button"); node.type = "button"; node.className = "table-resize-handle"; node.dataset.axis = axis; node.setAttribute("role", "separator"); node.setAttribute("aria-label", label); node.title = `${label}. Drag or use arrow keys; Shift changes by 10 points.`;
      node.setAttribute("aria-orientation", axis === "x" ? "vertical" : "horizontal"); node.setAttribute("aria-valuemin", "0.05"); node.setAttribute("aria-valuenow", String(value));
      if (Number.isFinite(maximum)) node.setAttribute("aria-valuemax", String(maximum));
      const constrained = (delta: number) => Math.round(Math.max(0.05, Math.min(maximum, value + delta * direction)) * 20) / 20;
      let drag: { pointer: number; client: number; scale: number; cssScale: number; next: number } | undefined;
      const reset = () => { const previous = drag; drag = undefined; node.style.translate = ""; delete node.dataset.dragging; node.setAttribute("aria-valuenow", String(value)); if (previous && node.hasPointerCapture(previous.pointer)) node.releasePointerCapture(previous.pointer); return previous; };
      node.addEventListener("pointerdown", event => {
        if (event.button !== 0 || pending) return;
        event.preventDefault(); event.stopPropagation();
        const origin = view.toClient(fragment.pageIndex, { x: 0, y: 0 }), step = view.toClient(fragment.pageIndex, { x: 20, y: 20 }), bounds = node.getBoundingClientRect();
        drag = { pointer: event.pointerId, client: axis === "x" ? event.clientX : event.clientY, scale: axis === "x" ? step.x - origin.x : step.y - origin.y, cssScale: axis === "x" ? bounds.height / node.offsetHeight : bounds.width / node.offsetWidth, next: value };
        node.focus({ preventScroll: true }); node.dataset.dragging = ""; node.setPointerCapture(event.pointerId);
      });
      node.addEventListener("pointermove", event => {
        if (!drag) return;
        drag.next = constrained(((axis === "x" ? event.clientX : event.clientY) - drag.client) / drag.scale);
        const delta = (drag.next - value) / direction * drag.scale / drag.cssScale;
        node.style.translate = axis === "x" ? `${delta}px 0` : `0 ${delta}px`; node.setAttribute("aria-valuenow", String(drag.next)); report(`${label}: ${drag.next.toFixed(1)} pt`);
      });
      async function apply(next: number): Promise<void> {
        await commit(next);
        root.querySelector<HTMLElement>(`[role="separator"][aria-label="${label}"]`)?.focus({ preventScroll: true });
      }
      node.addEventListener("pointerup", () => { const previous = reset(); if (previous && previous.next !== value) event(() => apply(previous.next)); });
      node.addEventListener("pointercancel", reset); node.addEventListener("lostpointercapture", () => { if (drag) reset(); });
      node.addEventListener("keydown", key => {
        if (key.key === "Escape" && drag) { key.preventDefault(); reset(); return; }
        const keys = axis === "x" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"], index = keys.indexOf(key.key);
        if (index < 0) return;
        key.preventDefault(); key.stopPropagation(); event(() => apply(constrained((index ? 1 : -1) * (key.shiftKey ? 10 : 1))));
      });
      objectOutlines.push(view.attach(node, { anchor: fragment, offset: axis === "x" ? { x: offset - 45, y: 0 } : { x: 0, y: offset - 45 }, size: axis === "x" ? { width: 90, height: fragment.rectangle.height } : { width: fragment.rectangle.width, height: 90 }, interactive: true }));
    }
    for (const fragment of document.geometry.fragments(table)) {
      let edge = 0;
      for (let column = 0; column < widths.length; column++) {
        edge += widths[column]!;
        const index = column, value = widths[index]!, adjacent = widths[index + 1];
        handle(fragment, "x", (rtl ? total - edge : edge) / total * fragment.rectangle.width, `Resize column ${index + 1}`, value, adjacent === undefined ? Infinity : value + adjacent - 0.05, rtl ? -1 : 1, width => {
          const next = [...widths]; next[index] = width; if (adjacent !== undefined) next[index + 1] = adjacent + value - width;
          return result.execute({ kind: "properties", targetId: table.id, table: { columnWidths: next, layout: "fixed", width: { points: next.reduce((sum, width) => sum + width, 0) } } });
        });
      }
    }
    for (const [index, row] of table.rows.entries()) {
      const fragments = document.geometry.fragments(row), height = row.properties.authored.header ? Math.max(0, ...fragments.map(fragment => fragment.bounds.height / 20)) : fragments.reduce((sum, fragment) => sum + fragment.bounds.height / 20, 0);
      for (const fragment of fragments) handle(fragment, "y", fragment.rectangle.height, `Resize row ${index + 1}`, height, Infinity, 1, points => result.execute({ kind: "properties", targetId: row.id, row: { height: { points, rule: "atLeast" } } }));
    }
  }
  function selectObject(e: PointerEvent): void {
    if (e.type === "pointerdown" && e.pointerType === "touch" || e.type === "click" && e.pointerType !== "touch") return;
    if (e.button !== 0 || pending || !doc || !activeView() || (e.target as Element).closest("button,input,textarea,select,a")) return;
    const hit = activeView()!.hitTest({ x: e.clientX, y: e.clientY }), target = hit && doc.content.get(hit.elementId);
    const hitCell = target && doc.content.within(target).closest("cell").first();
    if (e.shiftKey && hitCell && selection && doc.content.within(doc.content.get(selection.start.paragraphId)!).closest("table").first()) {
      const current = selectedTable(), table = doc.content.within(hitCell).closest("table").one();
      if (current.table.id === table.id) {
        const start = current.range ?? { rowIndex: table.rows.indexOf(current.row), columnIndex: current.cell.columnIndex, rowCount: 1, columnCount: current.cell.columnSpan };
        const end = hitCell.mergedRange ?? { rowIndex: table.rows.indexOf(doc.content.within(hitCell).closest("row").one()), columnIndex: hitCell.columnIndex, rowCount: 1, columnCount: hitCell.columnSpan };
        const rowIndex = Math.min(start.rowIndex, end.rowIndex), columnIndex = Math.min(start.columnIndex, end.columnIndex);
        e.preventDefault(); e.stopPropagation();
        event(async () => result.selectCells({ tableId: table.id, rowIndex, columnIndex, rowCount: Math.max(start.rowIndex + start.rowCount, end.rowIndex + end.rowCount) - rowIndex, columnCount: Math.max(start.columnIndex + start.columnCount, end.columnIndex + end.columnCount) - columnIndex })); return;
      }
    }
    selectedDrawing = undefined; selectedImage = undefined; selectedCells = undefined;
    if (target?.kind === "image" || target?.kind === "drawing" || target?.kind === "cell" || target?.kind === "table") {
      const paragraph = target.kind === "image" || target.kind === "drawing" ? doc.content.within(target).closest("paragraph").first() : doc.content.within(target).paragraphs().first();
      if (paragraph) {
        e.preventDefault(); e.stopPropagation();
        const caret = hit?.caret ? { paragraphId: hit.caret.paragraphId, offset: hit.caret.offset } : { paragraphId: paragraph.id, offset: 0 };
        selection = { start: caret, end: caret };
        focus(); selectedImage = target.kind === "image" ? target.id : undefined; selectedDrawing = target.kind === "drawing" ? target.id : undefined; if (target.kind === "drawing" && (target.chart || target.shape || target.group)) activeRibbon = target.chart ? "Chart Design" : "Shape Format"; outlineSelection(); updateToolbar();
        report(target.kind === "drawing" && target.chart ? "Chart selected. Drag a resize handle or use Chart Design." : target.kind === "drawing" ? "Shape selected. Drag a resize handle or use Shape Format." : target.kind === "image" ? "Picture selected. Drag a resize handle or use Picture Format." : "Table selected. Use Table tools to change rows and columns.");
      }
    } else outlineSelection();
  }
  let linkPointer: { id: number; x: number; y: number; dragged: boolean } | undefined;
  for (const surface of [preview, splitPages]) surface.addEventListener("pointerdown", e => { linkPointer = { id: e.pointerId, x: e.clientX, y: e.clientY, dragged: false }; }, { capture: true });
  for (const surface of [preview, splitPages]) surface.addEventListener("pointermove", e => { if (linkPointer?.id === e.pointerId && Math.hypot(e.clientX - linkPointer.x, e.clientY - linkPointer.y) > 4) linkPointer.dragged = true; }, { capture: true });
  for (const surface of [preview, splitPages]) surface.addEventListener("pointercancel", () => { linkPointer = undefined; }, { capture: true });
  let linkHoverFrame = 0, linkHoverSequence = 0;
  for (const surface of [preview, splitPages]) {
    surface.addEventListener("pointermove", e => {
      const sequence = ++linkHoverSequence; cancelAnimationFrame(linkHoverFrame);
      linkHoverFrame = requestAnimationFrame(() => event(async () => {
        const document = doc, view = surface === splitPages ? splitView : canvas?.view;
        if (!document || !view || e.buttons || (e.target as Element).closest("button,input,textarea,select,a")) { surface.removeAttribute("title"); return; }
        const location = view.fromClient({ x: e.clientX, y: e.clientY });
        if (!location) { surface.removeAttribute("title"); return; }
        const page = await document.pages[location.pageIndex]!.load(lifetime.signal);
        if (sequence !== linkHoverSequence || doc !== document || (surface === splitPages ? splitView : canvas?.view) !== view) return;
        const link = [...page.hitRegions].reverse().find(region => region.kind !== "comment" && location.point.x >= region.rectangle.x && location.point.x <= region.rectangle.x + region.rectangle.width && location.point.y >= region.rectangle.y && location.point.y <= region.rectangle.y + region.rectangle.height);
        if (link?.kind === "externalHyperlink") surface.title = link.tooltip || link.target;
        else if (link?.kind === "internalHyperlink") surface.title = `Go to page ${link.destination.pageIndex + 1}`;
        else surface.removeAttribute("title");
      }));
    });
    surface.addEventListener("pointerleave", () => { ++linkHoverSequence; cancelAnimationFrame(linkHoverFrame); surface.removeAttribute("title"); });
  }
  lifetime.signal.addEventListener("abort", () => cancelAnimationFrame(linkHoverFrame), { once: true });
  for (const surface of [preview, splitPages]) surface.addEventListener("click", e => {
    const dragged = linkPointer?.dragged; linkPointer = undefined;
    if (dragged || e.button !== 0 || mode !== "view" && !e.ctrlKey && !e.metaKey || !doc || !activeView() || (e.target as Element).closest("button,input,textarea,select,a")) return;
    const document = doc, view = activeView()!, location = view.fromClient({ x: e.clientX, y: e.clientY });
    if (!location) return;
    event(async () => {
      const page = await document.pages[location.pageIndex]!.load(lifetime.signal);
      if (doc !== document || activeView() !== view) return;
      const link = [...page.hitRegions].reverse().find(region => region.kind !== "comment" && location.point.x >= region.rectangle.x && location.point.x <= region.rectangle.x + region.rectangle.width && location.point.y >= region.rectangle.y && location.point.y <= region.rectangle.y + region.rectangle.height);
      if (link?.kind === "internalHyperlink") {
        const hit = document.geometry.hitTest(link.destination.pageIndex, link.destination);
        if (hit?.caret) { const point = { paragraphId: hit.caret.paragraphId, offset: hit.caret.offset }; result.select({ start: point, end: point }); }
        else if (hit) view.scrollTo(hit.fragment);
        else view.scrollTo(link.destination.pageIndex);
      } else if (link?.kind === "externalHyperlink") {
        if (!/^(https?:\/\/|mailto:)/i.test(link.target)) throw new Error("This link uses an unsupported address type.");
        window.open(link.target, "_blank", "noopener,noreferrer");
      }
    });
  }, { capture: true });
  for (const surface of [preview, splitPages]) surface.addEventListener("pointerdown", selectObject, { capture: true });
  for (const surface of [preview, splitPages]) surface.addEventListener("click", selectObject, { capture: true });
  async function restoreSnapshot(entry: Snapshot, scroll = true): Promise<void> {
    if (entry.state.disposed) await mount(entry.bytes);
    else { await entry.state.restore(); formPanel?.refresh(); await reviewPanel?.refresh(); }
    const all = paragraphs(), start = all[Math.min(entry.start, all.length - 1)]!, end = all[Math.min(entry.end, all.length - 1)]!;
    selection = { start: { paragraphId: start.id, offset: Math.min(entry.selection.start.offset, start.text.length) }, end: { paragraphId: end.id, offset: Math.min(entry.selection.end.offset, end.text.length) } };
    formatting = entry.formatting; entry.restoreState?.(); focus(scroll); selectedCells = entry.cells; selectedDrawing = entry.drawingIndex === undefined ? undefined : requireDocument().content.descendants().all().filter(element => element.kind === "drawing")[entry.drawingIndex]?.id; selectedImage = entry.imageIndex === undefined ? undefined : requireDocument().content.images().at(entry.imageIndex)?.id; outlineSelection();
  }
  async function history(direction: "undo" | "redo", signal?: AbortSignal, scroll = true): Promise<void> {
    requireDocument(); const from = direction === "undo" ? undo : redo, to = direction === "undo" ? redo : undo, entry = from.at(-1);
    if (mode === "view" || mode !== "edit" && entry && entry.mode !== mode) throw new Error("This history operation is unavailable in the current mode.");
    if (!entry) return;
    const ribbon = activeRibbon, choice = ribbonChoice, previous = await snapshot(); await restoreSnapshot(entry, scroll);
    if (signal?.aborted) { await restoreSnapshot(previous, scroll); signal.throwIfAborted(); }
    from.pop(); historyStates.delete(entry.state); entry.state.dispose(); remember(to, { ...previous, mode: entry.mode }); await changed({ history: direction });
    if (choice === ribbonChoice) activeRibbon = selectedImage && entry.ribbon === "Picture Format" ? entry.ribbon : ribbon; updateToolbar();
  }
  async function replace(text: string, paragraphBreaks = true): Promise<void> { if (selectedCells) return replaceSelectedCells((paragraphBreaks ? text.split("\n") : [text]).map(text => ({ runs: [{ text, formatting }] }))); await apply({ kind: "replace", text, paragraphBreaks, ...(Object.keys(formatting).length ? { formatting } : {}) }); }
  async function remove(backward: boolean, word = false): Promise<void> {
    if (selectedCells) return replaceSelectedCells([]);
    if (selectedDrawing) { const drawing = requireDocument().content.get(selectedDrawing); if (drawing?.kind === "drawing" && (drawing.chart || drawing.shape || drawing.group)) await apply({ kind: drawing.chart ? "chartProperties" : drawing.group ? "groupProperties" : "shapeProperties", drawingId: selectedDrawing, remove: true }); else report("This drawing type cannot be edited yet.", true); return; }
    if (selectedImage) { await apply({ kind: "imageProperties", imageId: selectedImage, remove: true }); return; }
    const range = requireSelection(); if (!collapsed(range)) return replace("");
    const all = paragraphs(), index = all.findIndex(p => p.id === range.start.paragraphId), p = all[index]!, offset = range.start.offset;
    if (backward && offset === 0) { if (!index || all[index - 1]!.parent !== p.parent) return; selection = { start: { paragraphId: all[index - 1]!.id, offset: all[index - 1]!.text.length }, end: range.end }; }
    else if (!backward && offset === p.text.length) { if (index === all.length - 1 || all[index + 1]!.parent !== p.parent) return; selection = { start: range.start, end: { paragraphId: all[index + 1]!.id, offset: 0 } }; }
    else { const units = word ? new Intl.Segmenter(undefined, { granularity: "word" }) : segmenter, boundaries = [...units.segment(p.text)].map(s => s.index).concat(p.text.length), next = backward ? boundaries.filter(n => n < offset).at(-1) ?? 0 : boundaries.find(n => n > offset) ?? p.text.length; selection = { start: { paragraphId: p.id, offset: backward ? next : offset }, end: { paragraphId: p.id, offset: backward ? offset : next } }; }
    await replace("");
  }
  function format(value: TextFormatting): Promise<void> { return enqueue(async () => { editable(); if (selectedCells) { const range = selectedCells; await apply({ kind: "batch", commands: selectedTable().cells.flatMap(cell => requireDocument().content.within(cell).paragraphs().map(paragraph => ({ kind: "format" as const, selection: paragraph.selection, formatting: value }))) }); selectedCells = range; outlineSelection(); formatting = {}; } else if (collapsed(requireSelection())) { formatting = { ...formatting, ...value }; if (value.fontFamily !== undefined) { const { fontTheme, ...rest } = formatting; formatting = rest; } if (value.color !== undefined) { const { colorTheme, ...rest } = formatting; formatting = rest; } focus(); updateToolbar(); } else { await apply({ kind: "format", formatting: value }); formatting = {}; } }); }
  input.addEventListener("beforeinput", e => { if (mode !== "edit") { e.preventDefault(); return; } if (e.isComposing || composing) return; e.preventDefault(); if (e.inputType === "insertText") { if (typing) typing.text += e.data ?? ""; else { const batch = { text: e.data ?? "" }; const task = enqueue(async () => { if (typing === batch) typing = undefined; await replace(batch.text); }); typing = batch; event(() => task); } return; } event(() => enqueue(async () => { if ( e.inputType === "insertReplacementText") await replace(e.data ?? ""); else if (e.inputType === "insertParagraph") await replace("\n"); else if (e.inputType === "insertLineBreak") await replace("\n", false); else if (e.inputType.startsWith("delete")) await remove(e.inputType.includes("Backward"), e.inputType.includes("Word")); else if (e.inputType === "historyUndo") await history("undo"); else if (e.inputType === "historyRedo") await history("redo"); })); });
  function imageInsertionWidth(): number {
    const document = requireDocument(), paragraph = document.content.get(requireSelection().start.paragraphId);
    const cells = selectedCells ? selectedTable().cells : paragraph ? document.content.within(paragraph).closest("cell").all() : [];
    let width = 432;
    for (const cell of cells) {
      const fragment = document.geometry.fragments(cell)[0], margins = cell.properties.effective.margins;
      if (!fragment) continue;
      const available = fragment.rectangle.width / 20 - (margins?.start ?? 0) - (margins?.end ?? 0);
      if (available > 0) width = Math.min(width, available);
    }
    return width;
  }
  async function pasteContent(clipboard: { html: string; text: string; image?: Blob }): Promise<void> {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId), inTable = paragraph && requireDocument().content.within(paragraph).closest("table").first();
    const grid = readClipboardCells(clipboard.html, clipboard.text);
    if (grid) {
      if (!inTable) {
        const change = await apply({ kind: "pasteTable", selection: requireSelection(), content: grid });
        const table = change?.tables[0];
        if (table) result.selectCells({ tableId: table.id, rowIndex: 0, columnIndex: 0, rowCount: grid.rows, columnCount: grid.columns });
        return;
      }
      const { table, row, cell } = selectedTable(), tableIndex = requireDocument().content.tables().all().indexOf(table);
      const rowIndex = selectedCells?.rowIndex ?? table.rows.indexOf(row), columnIndex = selectedCells?.columnIndex ?? cell.columnIndex;
      if (selectedCells && (selectedCells.rowCount !== 1 || selectedCells.columnCount !== 1) && (selectedCells.rowCount !== grid.rows || selectedCells.columnCount !== grid.columns)) throw new Error("Select a rectangle matching the copied cells, or place the cursor in its starting cell.");
      await apply({ kind: "table", action: "pasteCells", tableId: table.id, rowIndex, columnIndex, content: grid });
      result.selectCells({ tableId: requireDocument().content.tables().at(tableIndex)!.id, rowIndex, columnIndex, rowCount: grid.rows, columnCount: grid.columns });
      return;
    }
    const content = clipboard.html ? readClipboard(clipboard.html) : clipboard.image ? { paragraphs: [{ runs: [{ text: "", image: await readImageFile(clipboard.image, imageInsertionWidth()) }] }], convertedObjects: false } : undefined;
    if (content && (selectedCells || paragraph?.story !== "body" || paragraph.parent?.kind !== "story")) content.paragraphs = content.paragraphs.map(value => value.dropCap ? { ...value, dropCap: null } : value);
    if (selectedCells) {
      if (content?.convertedObjects) throw new Error("Select clipboard text or a single text table to paste into cells.");
      await replaceSelectedCells(content?.paragraphs.length ? content.paragraphs : clipboard.text.split(/\r\n|\r|\n/).map(text => ({ runs: [{ text }] })), true);
    } else if (content?.paragraphs.length) {
      await apply({ kind: "paste", paragraphs: content.paragraphs });
      if (content.convertedObjects) report("Pasted formatted text. Tables and images were converted to text.");
    } else if (clipboard.text) await replace(clipboard.text);
  }
  async function replaceSelectedCells(paragraphs: Extract<DocumentEdit, { kind: "paste" }>["paragraphs"], fill = false): Promise<void> {
    const range = selectedCells!, { table, cells } = selectedTable();
    const visible = new Set(table.rows.flatMap((row, index) => row.cells.filter(cell => !cell.mergedRange || cell.mergedRange.rowIndex === index).map(cell => cell.id)));
    let first = true;
    await apply({ kind: "table", action: "replaceCells", tableId: table.id, cells: cells.map(cell => {
      const content = visible.has(cell.id) && (first || fill) ? paragraphs : [];
      if (visible.has(cell.id)) first = false;
      return { cellId: cell.id, paragraphs: content };
    }) });
    selectedCells = range; outlineSelection(); updateToolbar();
  }
  function clipboardContent(images: ReadonlyMap<string, string> = new Map(), charts: ReadonlyMap<string, string> = new Map()): ReturnType<typeof writeClipboard> {
    if (selectedImage) {
      const picture = requireDocument().content.get(selectedImage);
      if (picture?.kind !== "image" || !images.has(picture.id)) throw new Error("Select a picture to copy.");
      return { text: picture.description ?? "", html: createClipboardImage(picture, images.get(picture.id)!).outerHTML };
    }
    if (selectedDrawing) {
      const chart = requireDocument().content.get(selectedDrawing);
      if (chart?.kind !== "drawing" || !charts.has(chart.id)) throw new Error("Select a native chart to copy.");
      const html = createClipboardChart(chart, charts.get(chart.id)!);
      return { text: html.textContent ?? "", html: html.outerHTML };
    }
    if (selectedCells) { const { table } = selectedTable(); return writeClipboardCells(requireDocument().content, table, selectedCells, images, charts); }
    const range = requireSelection();
    if (collapsed(range)) throw new Error("Select text or table cells to copy.");
    return writeClipboard(requireDocument().content, range, undefined, images, charts);
  }
  async function prepareClipboard(): Promise<ReturnType<typeof writeClipboard>> {
    const doc = requireDocument(), snapshot = doc.snapshot(), images = new Map<string, string>(), charts = new Map<string, string>();
    const paragraphs = doc.content.paragraphs().all(), indices = new Map(paragraphs.map((paragraph, index) => [paragraph.id, index]));
    const range = selectedCells ? undefined : requireSelection();
    const candidates = selectedImage || selectedDrawing ? [doc.content.get((selectedImage ?? selectedDrawing)!)!] : selectedCells ? selectedTable().table.rows.slice(selectedCells.rowIndex, selectedCells.rowIndex + selectedCells.rowCount).flatMap(row => row.cells.filter(cell => cell.columnIndex >= selectedCells!.columnIndex && cell.columnIndex < selectedCells!.columnIndex + selectedCells!.columnCount).flatMap(cell => doc.content.within(cell).descendants().all())) : doc.content.descendants().all().filter(element => {
      if (element.kind !== "image" && element.kind !== "drawing") return false;
      let paragraph = element.parent; while (paragraph && paragraph.kind !== "paragraph") paragraph = paragraph.parent;
      const start = indices.get(range!.start.paragraphId)!, end = indices.get(range!.end.paragraphId)!, index = indices.get(paragraph?.id ?? "")!;
      const offset = element.position?.offset;
      if (offset === undefined) return false;
      return index >= start && index <= end && (index !== start || offset >= range!.start.offset) && (index !== end || offset < range!.end.offset || offset === range!.end.offset && offset === paragraph?.text.length);
    });
    for (const element of candidates) {
      if (element.kind !== "image" && element.kind !== "drawing" || images.has(element.id) || charts.has(element.id)) continue;
      if (element.kind === "drawing" && !element.chart) throw new Error("Copying this drawing is not supported yet.");
      const data = element.kind === "image" ? await doc.imageData(element.id) : await doc.chartContent(element.id);
      const mediaType = "mediaType" in data && typeof data.mediaType === "string" ? data.mediaType : undefined;
      if (mediaType && !["image/png", "image/jpeg"].includes(mediaType)) throw new Error("Copying this image format is not supported yet. Use a PNG or JPEG image.");
      let binary = ""; for (let offset = 0; offset < data.bytes.length; offset += 8192) binary += String.fromCharCode(...data.bytes.subarray(offset, offset + 8192));
      if (mediaType) images.set(element.id, `data:${mediaType};base64,${btoa(binary)}`); else charts.set(element.id, btoa(binary));
    }
    if (doc !== requireDocument() || doc.snapshot() !== snapshot) throw new Error("The document changed. Select the content and copy again.");
    return clipboardContent(images, charts);
  }
  input.addEventListener("paste", e => {
    e.preventDefault();
    if (mode !== "edit") return;
    const html = e.clipboardData?.getData("text/html") ?? "", text = e.clipboardData?.getData("text/plain") ?? "", image = [...e.clipboardData?.files ?? []].find(file => ["image/png", "image/jpeg"].includes(file.type));
    const copying = clipboardWrite;
    event(() => enqueue(async () => {
      const clipboard = copying ? await copying : { html, text, ...(image ? { image } : {}) };
      await pasteContent(clipboard);
    }));
  });
  for (const kind of ["copy", "cut"] as const) input.addEventListener(kind, e => {
    if (!e.clipboardData || !pending && !selectedImage && !selectedDrawing && !selectedCells && (!selection || collapsed(selection))) return;
    e.preventDefault();
    if (pending || selectedDrawing || requireDocument().content.images().first() || requireDocument().content.descendants().all().some(element => element.kind === "drawing")) {
      event(async () => {
        const content = enqueue(async () => {
          return prepareClipboard();
        });
        const written = navigator.clipboard.write([new ClipboardItem({ "text/plain": content.then(value => new Blob([value.text], { type: "text/plain" })), "text/html": content.then(value => new Blob([value.html], { type: "text/html" })) })]);
        const copying = clipboardWrite = Promise.all([content, written]).then(([value]) => value);
        void copying.catch(() => {});
        await enqueue(async () => {
          try { await copying; if (kind === "cut" && mode === "edit") await remove(false); }
          finally { if (clipboardWrite === copying) clipboardWrite = undefined; }
        });
      });
      return;
    }
    let content: ReturnType<typeof writeClipboard>;
    try { content = clipboardContent(); } catch (error) { report(error instanceof Error ? error.message : String(error)); return; }
    e.clipboardData.setData("text/plain", content.text); e.clipboardData.setData("text/html", content.html);
    if (kind === "cut" && mode === "edit") event(() => enqueue(() => remove(false)));
  });
  let compositionSelection: DocumentSelection | undefined;
  input.addEventListener("compositionstart", () => { if (mode !== "edit") return; selectInput(); composing = true; compositionSelection = selection; if (pending) event(() => enqueue(async () => { compositionSelection = selection; })); input.classList.add("composing"); });
  input.addEventListener("compositionend", e => { if (!composing) return; composing = false; input.classList.remove("composing"); if (!e.data) { selection = compositionSelection; focus(); return; } event(() => enqueue(async () => { selection = compositionSelection; await replace(e.data); })); });
  input.addEventListener("keydown", e => {
    if (e.isComposing || mode !== "edit") return;
    const command = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
    if (pending && !navigating && (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key) || command && key === "a")) {
      e.preventDefault(); e.stopImmediatePropagation();
      const next = new KeyboardEvent("keydown", { key: e.key, code: e.code, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, bubbles: true, cancelable: true });
      event(() => enqueue(async () => { navigating = true; try { input.dispatchEvent(next); } finally { navigating = false; } }));
      return;
    }
    if (command && ["b", "i", "u"].includes(key)) { e.preventDefault(); const property = ({ b: "bold", i: "italic", u: "underline" } as const)[key as "b" | "i" | "u"]; event(() => format({ [property]: !currentFormatting()[property] })); }
    else if (command && (key === "z" || key === "y")) { e.preventDefault(); event(() => enqueue(() => history(key === "y" || e.shiftKey ? "redo" : "undo"))); }
    else if (command && e.key === "Enter") { e.preventDefault(); event(() => enqueue(() => apply({ kind: "break", type: e.shiftKey ? "column" : "page" }))); }
    else if (e.key === "Enter") {
      e.preventDefault(); event(() => enqueue(async () => {
        const range = requireSelection(), paragraph = requireDocument().content.get(range.start.paragraphId);
        if (!e.shiftKey && collapsed(range) && paragraph?.kind === "paragraph" && paragraph.list && !paragraph.text.length && requireDocument().content.within(paragraph).descendants().all().every(element => element.kind === "run")) await apply({ kind: "list", list: null });
        else await replace("\n", !e.shiftKey);
      }));
    }
    else if (e.key === "Tab") {
      const doc = requireDocument(), paragraph = selection && doc.content.get(selection.start.paragraphId), cell = paragraph && doc.content.within(paragraph).closest("cell").first();
      if ((cell || pending && !e.shiftKey) && !command) {
        e.preventDefault(); event(() => enqueue(async () => {
          const doc = requireDocument(), paragraph = selection && doc.content.get(selection.start.paragraphId), current = paragraph && doc.content.within(paragraph).closest("cell").first();
          if (!current) { if (!e.shiftKey) await replace("\t", false); return; }
          const cells = doc.content.within(current).closest("table").one().rows.flatMap(row => row.cells), index = cells.findIndex(cell => cell.id === current.id);
          let target = cells[index + (e.shiftKey ? -1 : 1)];
          if (!target && !e.shiftKey) {
            await apply({ kind: "table", tableId: requireDocument().content.within(current).closest("table").one().id, action: "insertRow" });
            const doc = requireDocument(), paragraph = doc.content.get(selection!.start.paragraphId)!;
            const table = doc.content.within(paragraph).closest("table").first()!;
            target = table.rows.at(-1)?.cells[0];
          }
          const next = target && requireDocument().content.within(target).paragraphs().first();
          if (next) result.select({ start: { paragraphId: next.id, offset: 0 }, end: { paragraphId: next.id, offset: next.text.length } });
        }));
      } else if (!e.shiftKey) { e.preventDefault(); event(() => enqueue(() => replace("\t", false))); }
    }
  });
  for (const surface of [preview, splitPages]) surface.addEventListener("pointerdown", () => setMobileTools(false), { capture: true });
  input.addEventListener("focus", () => setMobileTools(false));
  host.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" && !e.altKey && doc) { e.preventDefault(); event(() => openNavigation(true)); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "Digit8") { e.preventDefault(); showMarks = !showMarks; updateToolbar(); return; }
    if (e.key === "Escape" && focusView && !root.querySelector("dialog[open]")) { e.preventDefault(); setFocusView(false); return; }
    if (e.key === "Escape" && paintingBorders) { e.preventDefault(); paintingBorders = false; outlineSelection(); updateToolbar(); report("Table edge tool off."); focus(); return; }
    if (e.key === "Escape" && painter) { e.preventDefault(); painter = undefined; updateToolbar(); report("Format Painter canceled."); return; }
    if (e.key === "Escape" && mobileToolsOpen && !root.querySelector("dialog[open]")) {
      e.preventDefault(); setMobileTools(false); mobileToolsToggle.focus({ preventScroll: true }); return;
    }
    if (e.key === "Escape" && root.activeElement === input || e.key === "F6") {
      if (composing || root.querySelector("dialog[open]")) return;
      e.preventDefault();
      if (toolbar.contains(root.activeElement)) { setMobileTools(false); focus(); }
      else if (focusView) exitFocus.focus({ preventScroll: true });
      else if (compact && !toolbar.hidden) mobileToolsToggle.focus({ preventScroll: true });
      else if (ribbonTabs.size) ribbonTabs.get(activeRibbon)?.button.focus();
      else [...controls.values()].find(control => !control.disabled && !control.closest("[hidden]"))?.focus();
    }
  });
  toolbar.addEventListener("mousedown", e => { if ((e.target as Element).closest("button")) e.preventDefault(); });
  function button(name: string, label: string, action: () => Promise<unknown>): void { const control = document.createElement("button"); control.type = "button"; control.textContent = label; control.addEventListener("click", () => event(action)); controls.set(name, control); }
  button("formatPainter", "Format Painter", async () => {
    if (painter) { painter = undefined; updateToolbar(); report("Format Painter canceled."); return; }
    const source = requireSelection(), paragraph = requireDocument().content.get(source.start.paragraphId);
    if (paragraph?.kind !== "paragraph") return;
    painter = painterSample = { formatting: { bold: false, italic: false, underline: false, strike: false, verticalAlignment: "baseline", highlight: "none", fontSize: 11, fontFamily: "Calibri", color: "#000000", ...currentFormatting() }, paragraph: { ...paragraph.properties.effective, styleId: paragraph.styleId }, list: paragraph.list ? ["bullet", "decimal"].includes(paragraph.list.kind) ? { kind: paragraph.list.kind as "bullet" | "decimal", level: paragraph.list.level } : undefined : null, repeat: false };
    updateToolbar(); report("Select text or click a word to paint its formatting. Double-click Format Painter to keep using it; Escape cancels."); focus();
  });
  controls.get("formatPainter")!.addEventListener("dblclick", () => { if (painterSample) { painter = { ...painterSample, repeat: true }; updateToolbar(); report("Format Painter stays active. Select text to format; Escape cancels."); } });
  async function paintFormatting(): Promise<void> {
    const sample = painter;
    if (!sample || pending || mode !== "edit" || !selection || selectedImage || selectedCells) return;
    const doc = requireDocument(), paragraph = doc.content.get(selection.start.paragraphId);
    if (paragraph?.kind !== "paragraph") return;
    let range = selection;
    if (collapsed(range)) {
      const word = [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(paragraph.text)].find(word => word.isWordLike && word.index <= range.start.offset && word.index + word.segment.length >= range.start.offset);
      if (!word) return;
      range = { start: { paragraphId: paragraph.id, offset: word.index }, end: { paragraphId: paragraph.id, offset: word.index + word.segment.length } };
    }
    const last = doc.content.get(range.end.paragraphId), commands: Extract<DocumentEdit, { kind: "batch" }>["commands"][number][] = [{ kind: "format", selection: range, formatting: sample.formatting }];
    if (range.start.offset === 0 && last?.kind === "paragraph" && range.end.offset === last.text.length) {
      const all = paragraphs(), start = all.indexOf(paragraph), end = all.indexOf(last), keys = new Set(all.slice(start, end + 1).flatMap(p => Object.keys(p.properties.effective)));
      for (const key of Object.keys(sample.paragraph)) keys.add(key);
      const properties = Object.fromEntries([...keys].map(key => [key, sample.paragraph[key as keyof ParagraphPropertyPatch] ?? null])) as ParagraphPropertyPatch;
      commands.push({ kind: "properties", selection: range, paragraph: properties });
      if (sample.list !== undefined) commands.push({ kind: "list", selection: range, list: sample.list?.kind ?? null, ...(sample.list ? { level: sample.list.level } : {}) });
    }
    selection = range;
    await enqueue(async () => { await apply(commands.length === 1 ? commands[0] : { kind: "batch", commands }); });
    if (!sample.repeat && painter === sample) painter = undefined;
    updateToolbar(); report(sample.repeat ? "Formatting applied. Format Painter remains active; Escape cancels." : "Formatting applied.");
  }
  for (const surface of [preview, splitPages]) surface.addEventListener("pointerup", () => { if (painter) queueMicrotask(() => event(paintFormatting)); });
  input.addEventListener("keyup", e => { if (painter && e.key === "Shift") event(paintFormatting); });
  select("selectText", "Select", [{ value: "", label: "Select" }, { value: "all", label: "Select all" }, { value: "paragraph", label: "Current paragraph" }, { value: "word", label: "Current word" }], async value => {
    controls.get("selectText")!.value = "";
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId);
    if (paragraph?.kind !== "paragraph") return;
    if (value === "all") {
      focus(); input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true, cancelable: true }));
    } else if (value === "paragraph") result.select(paragraph.selection);
    else if (value === "word") {
      const offset = requireSelection().start.offset, word = [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(paragraph.text)].find(word => word.isWordLike && word.index <= offset && word.index + word.segment.length >= offset);
      if (word) result.select({ start: { paragraphId: paragraph.id, offset: word.index }, end: { paragraphId: paragraph.id, offset: word.index + word.segment.length } });
    }
    if (value && painter) await paintFormatting();
  });
  for (const kind of ["copy", "cut"] as const) button(kind, kind === "copy" ? "Copy" : "Cut", () => enqueue(async () => {
    const content = await prepareClipboard();
    try { await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([content.text], { type: "text/plain" }), "text/html": new Blob([content.html], { type: "text/html" }) })]); }
    catch { throw new Error(`Clipboard access was unavailable. Select the text and use ${kind === "copy" ? "Ctrl+C or ⌘C" : "Ctrl+X or ⌘X"}.`); }
    if (kind === "cut") await remove(false); else report(selectedImage ? "Copied picture." : selectedDrawing ? "Copied chart." : selectedCells ? "Copied table cells." : "Copied formatted text.");
  }));
  for (const plain of [false, true]) button(plain ? "pasteText" : "paste", plain ? "Paste text only" : "Paste", () => enqueue(async () => {
    let html = "", text = "", image: Blob | undefined;
    try {
      if (plain) text = await navigator.clipboard.readText();
      else for (const item of await navigator.clipboard.read()) {
        if (item.types.includes("text/html")) html = await (await item.getType("text/html")).text();
        if (item.types.includes("text/plain")) text = await (await item.getType("text/plain")).text();
        const mediaType = item.types.find(type => ["image/png", "image/jpeg"].includes(type));
        if (mediaType) image = await item.getType(mediaType);
        if (html || image || text) break;
      }
    } catch { throw new Error("Clipboard access was unavailable. Place the cursor in the document and use Ctrl+V or ⌘V."); }
    if (!html && !text && !image) throw new Error("The clipboard has no supported text or picture to paste.");
    await pasteContent({ html, text, ...(image ? { image } : {}) });
  }));
  button("pasteOptions", "Paste options", async () => {
    const trigger = controls.get("pasteOptions")!, rect = trigger.getBoundingClientRect(), menu = document.createElement("div");
    menu.className = "ribbon-menu"; menu.popover = "auto"; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "Paste options");
    for (const name of ["paste", "pasteText"]) {
      if (!enabledTools.has(name)) continue;
      const source = controls.get(name)!, item = document.createElement("button"); item.type = "button"; item.setAttribute("role", "menuitem"); item.textContent = source.getAttribute("aria-label") ?? source.textContent; item.disabled = source.disabled;
      item.addEventListener("click", () => { menu.hidePopover(); source.click(); }); menu.append(item);
    }
    trigger.setAttribute("aria-expanded", "true");
    menu.addEventListener("toggle", e => { if ((e as ToggleEvent).newState === "closed") { trigger.setAttribute("aria-expanded", "false"); menu.remove(); } });
    menu.addEventListener("keydown", e => {
      const items = [...menu.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")], index = items.indexOf(root.activeElement as HTMLButtonElement);
      if (items.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); items[(index + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]!.focus(); }
      if (e.key === "Escape") { e.preventDefault(); menu.hidePopover(); trigger.focus(); }
    });
    root.append(menu); menu.style.left = Math.max(8, Math.min(rect.left, innerWidth - 200)) + "px"; menu.style.top = Math.min(rect.bottom, innerHeight - 110) + "px"; menu.showPopover(); menu.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  });
  controls.get("pasteOptions")!.setAttribute("aria-haspopup", "menu");
  select("changeCase", "Change case", [{ value: "", label: "Aa" }, { value: "sentence", label: "Sentence case" }, { value: "lower", label: "lowercase" }, { value: "upper", label: "UPPERCASE" }, { value: "title", label: "Capitalize Each Word" }, { value: "toggle", label: "tOGGLE cASE" }], async value => {
    if (!value) return;
    try { await result.execute({ kind: "changeCase", letterCase: value as "upper" | "lower" | "title" | "sentence" | "toggle" }); }
    finally { controls.get("changeCase")!.value = ""; }
  });
  function select(name: string, label: string, choices: readonly Readonly<{ value: string; label: string }>[], action: (value: string) => Promise<unknown>): void { const control = document.createElement("select"); control.setAttribute("aria-label", label); for (const choice of choices) control.add(new Option(choice.label, choice.value)); control.addEventListener("change", () => event(() => action(control.value))); controls.set(name, control); }
  function field(name: string, label: string, type: string, value: string, action: (value: string) => Promise<unknown>): void { const control = document.createElement("input"); control.type = type; control.value = value; control.setAttribute("aria-label", label); if (type === "number") { control.min = "0.5"; control.step = "0.5"; } control.addEventListener("change", () => event(() => action(control.value))); controls.set(name, control); }
  function form(title: string, fields: readonly Readonly<{ name: string; label: string; value?: string; type?: string; step?: string; min?: string; max?: string; choices?: readonly Readonly<{ value: string; label: string }>[] }>[], submit: ((values: Readonly<Record<string, string>>) => Promise<unknown>) | undefined, remove?: (() => Promise<unknown>) | Readonly<{ label: string; execute: () => Promise<unknown> }>, configure?: (form: HTMLFormElement) => void): Promise<void> {
    setMobileTools(false);
    const dialog = document.createElement("dialog"), form = document.createElement("form"), heading = document.createElement("h2"); heading.textContent = title; dialog.setAttribute("aria-label", title); form.append(heading); if (fields.length > 6) form.className = "wide-form";
    function close(): void { dialog.close(); dialog.remove(); focus(); }
    for (const field of fields) {
      const label = document.createElement("label"), input = document.createElement(field.choices ? "select" : "input"); label.textContent = field.label; input.name = field.name;
      if (input instanceof HTMLSelectElement) for (const choice of field.choices ?? []) input.add(new Option(choice.label, choice.value));
      else { input.type = field.type ?? "text"; if (input.type === "number") { input.step = field.step ?? "any"; if (field.min !== undefined) input.min = field.min; if (field.max !== undefined) input.max = field.max; } }
      input.value = field.value ?? ""; if (input instanceof HTMLInputElement && input.type === "checkbox") { input.checked = field.value === "true"; input.value = "true"; label.className = "checkbox-field"; label.prepend(input); } else label.append(input); form.append(label);
    }
    configure?.(form);
    const apply = document.createElement("button"), cancel = document.createElement("button"); apply.type = "submit"; apply.textContent = "Apply"; cancel.type = "button"; cancel.textContent = submit ? "Cancel" : "Close"; cancel.addEventListener("click", close); const actions = document.createElement("div"); actions.className = "dialog-actions"; actions.append(...form.querySelectorAll("[data-dialog-action]"), cancel); if (submit) actions.append(apply); form.append(actions); if (remove) { const button = document.createElement("button"); button.type = "button"; button.textContent = typeof remove === "function" ? "Delete image" : remove.label; button.className = "destructive"; button.addEventListener("click", () => { void run(typeof remove === "function" ? remove : remove.execute); }); actions.prepend(button); } dialog.append(form); root.append(dialog);
    const error = document.createElement("p"); error.setAttribute("role", "alert"); error.hidden = true; form.insertBefore(error, actions);
    let submitting = false;
    async function run(action: () => Promise<unknown>): Promise<void> {
      if (submitting) return;
      submitting = true; error.hidden = true;
      const buttons = [...form.querySelectorAll("button")]; for (const button of buttons) button.disabled = true;
      try { await action(); close(); }
      catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); error.hidden = false; }
      finally { submitting = false; for (const button of buttons) button.disabled = false; }
    }
    form.addEventListener("submit", e => {
      e.preventDefault();
      const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)]));
      if (submit) void run(() => submit(values));
    });
    dialog.addEventListener("cancel", e => { e.preventDefault(); if (!submitting) close(); }); dialog.showModal(); return Promise.resolve();
  }
  function fieldNotice(fields: readonly import("@onodocs/sdk").DocumentFieldStatus[]) { const pending = fields.filter(field => field.status === "unsupported" || field.status === "requires-layout"); if (pending.length) report(`Exported with cached fields: ${pending.map(field => field.command).join(", ")}. Update these fields in Word.`, true); }
  async function download(pdf: boolean): Promise<void> { const bytes = pdf ? await result.pdf() : await result.save(), url = URL.createObjectURL(new Blob([bytes], { type: pdf ? "application/pdf" : "application/octet-stream" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = pdf ? filename.replace(/\.(docx|docm|dotx|dotm)$/i, "") + ".pdf" : /\.(docx|docm|dotx|dotm)$/i.test(filename) ? filename : filename + ".docx"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  button("open", "Open Word", async () => { const picker = document.createElement("input"); picker.type = "file"; picker.accept = ".docx,.docm,.dotx,.dotm"; picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) event(() => result.open(file, file.name)); }); picker.click(); });
  button("new", "New document", () => result.newDocument());
  let quickParts: readonly QuickPart[] = [];
  button("quickParts", "Quick Parts", async () => {
    const key = options.quickPartsStorageKey ?? "onodocs.editor.quick-parts";
    if (key !== false) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (!Array.isArray(value) || !value.every(item => item && ["id", "name", "category", "text", "html"].every(property => typeof item[property] === "string"))) throw new Error("The saved Quick Parts library is unreadable.");
        quickParts = value as QuickPart[];
      } else quickParts = [];
    }
    const snapshot = requireDocument().snapshot();
    showQuickParts(root, quickParts, parts => { if (key !== false) localStorage.setItem(key, JSON.stringify(parts)); quickParts = parts; }, () => enqueue(async () => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Close Quick Parts and select the content again.");
      const content = await prepareClipboard();
      if (!selectedCells && !selectedImage && !selectedDrawing) {
        const range = requireSelection(), all = paragraphs(), first = all.findIndex(p => p.id === range.start.paragraphId), last = all.findIndex(p => p.id === range.end.paragraphId);
        const selected = all.slice(first, last + 1);
        if (selected.some(paragraph => requireDocument().content.within(paragraph).descendants().all().some(element => element.kind === "drawing" && !element.chart))) throw new Error("Quick Parts supports text, tables, pictures and charts. Shapes cannot be saved yet.");
        if (selected.length > 1 && new Set(selected.map(paragraph => requireDocument().content.within(paragraph).closest("cell").first()?.id)).size > 1) throw new Error("Select table cells to save a table as a Quick Part.");
      }
      return content;
    }), part => enqueue(async () => { if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Close Quick Parts and choose an insertion point again."); await pasteContent(part); }), lifetime.signal);
    const help = root.querySelector(".quick-parts-form .design-help"); if (help) help.textContent += key === false ? " Saved parts last for this editor session." : " Saved parts are stored in this browser on this device for this website.";
  });
  for (const [kind, label] of [["form", "Form designer"], ["template", "Template designer"]] as const) button(`designer:${kind}`, label, async () => { setMobileTools(false); await openDesigner({ kind, root, editor: result, document: options.document, signal: lifetime.signal }); });
  button("print", "Print", async () => {
    if (!navigator.pdfViewerEnabled) { await download(true); report("PDF downloaded. Open it in a PDF viewer to choose pages and print."); return; }
    await openPrintPreview(() => result.pdf(), filename, lifetime.signal); report("Print preview opened. Choose the printer, pages and copies in the PDF viewer.");
  });
  button("save", "Download Word", () => download(false)); button("pdf", "Download PDF", () => download(true));
  button("undo", "Undo", () => result.undo()); button("redo", "Redo", () => result.redo());
  for (const [name, label] of [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"], ["strike", "Strikethrough"]] as const) button(name, label, () => format({ [name]: !currentFormatting()[name] }));
  for (const alignment of ["subscript", "superscript"] as const) button(alignment, alignment === "subscript" ? "Subscript" : "Superscript", () => format({ verticalAlignment: currentFormatting().verticalAlignment === alignment ? "baseline" : alignment }));
  for (const [name, label, direction] of [["growFont", "Grow font", 1], ["shrinkFont", "Shrink font", -1]] as const) button(name, label, () => {
    const size = currentFormatting().fontSize ?? 11, sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const next = direction > 0 ? sizes.find(value => value > size) ?? size + 2 : [...sizes].reverse().find(value => value < size) ?? Math.max(0.5, size - 1);
    return format({ fontSize: next });
  });
  button("highlight", "Text highlight color", async () => {
    const popup = document.createElement("div"), grid = document.createElement("div"), actions = document.createElement("div"); popup.className = "ribbon-menu"; popup.popover = "auto"; popup.setAttribute("role", "dialog"); popup.setAttribute("aria-label", "Text highlight color"); grid.className = "color-grid"; actions.className = "color-actions";
    for (const [name, color] of Object.entries(textHighlightColors)) {
      const button = document.createElement("button"), swatch = document.createElement("span"); button.type = "button"; button.setAttribute("aria-label", name); button.title = name; button.setAttribute("aria-pressed", String(currentFormatting().highlight === name)); swatch.style.background = color; button.append(swatch);
      button.addEventListener("click", () => { popup.hidePopover(); event(() => format({ highlight: name as keyof typeof textHighlightColors })); }); grid.append(button);
    }
    const clear = document.createElement("button"); clear.type = "button"; clear.textContent = "No color"; clear.addEventListener("click", () => { popup.hidePopover(); event(() => format({ highlight: "none" })); }); actions.append(clear); popup.append(grid, actions);
    const trigger = controls.get("highlight")!, bounds = trigger.getBoundingClientRect(); popup.style.left = Math.min(bounds.left, window.innerWidth - 160) + "px"; popup.style.top = bounds.bottom + "px";
    popup.addEventListener("toggle", e => { if ((e as ToggleEvent).newState === "closed") { trigger.setAttribute("aria-expanded", "false"); popup.remove(); } });
    popup.addEventListener("keydown", e => { const buttons = [...grid.querySelectorAll("button")], index = buttons.indexOf(root.activeElement as HTMLButtonElement); if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) && index >= 0) { e.preventDefault(); buttons[(index + ({ ArrowLeft: 15, ArrowRight: 1, ArrowUp: 12, ArrowDown: 4 }[e.key] ?? 0)) % buttons.length]!.focus(); } if (e.key === "Escape") { e.preventDefault(); popup.hidePopover(); trigger.focus(); } });
    root.append(popup); trigger.setAttribute("aria-expanded", "true"); popup.showPopover(); grid.querySelector("button")!.focus();
  });
  controls.get("highlight")!.setAttribute("aria-haspopup", "dialog");
  button("clearFormatting", "Clear formatting", () => result.execute({ kind: "format", formatting: { textEffect: null, bold: null, italic: null, underline: null, strike: null, fontSize: null, fontFamily: null, color: null, highlight: null, verticalAlignment: null } }));
  button("textEffects", "Text effects", () => form("Text effects", [{ name: "effect", label: "Effect", value: currentFormatting().textEffect ?? "none", choices: textEffects }], values => format({ textEffect: values.effect as NonNullable<TextFormatting["textEffect"]> }), undefined, textEffectsGallery));
  button("fontDialog", "Font settings", () => {
    const value = currentFormatting();
    return form("Font", [
      { name: "family", label: "Font family", value: value.fontFamily ?? "Calibri" },
      { name: "size", label: "Size (points)", type: "number", min: "0.5", step: "0.5", value: String(value.fontSize ?? 11) },
      { name: "style", label: "Font style", value: value.bold ? value.italic ? "boldItalic" : "bold" : value.italic ? "italic" : "regular", choices: [{ value: "regular", label: "Regular" }, { value: "bold", label: "Bold" }, { value: "italic", label: "Italic" }, { value: "boldItalic", label: "Bold italic" }] },
      { name: "color", label: "Font color", type: "color", value: value.color ?? "#000000" },
      { name: "underline", label: "Underline", value: String(!!value.underline), choices: [{ value: "false", label: "None" }, { value: "true", label: "Single" }] },
      { name: "strike", label: "Strikethrough", value: String(!!value.strike), choices: [{ value: "false", label: "Off" }, { value: "true", label: "On" }] },
      { name: "vertical", label: "Position", value: value.verticalAlignment ?? "baseline", choices: [{ value: "baseline", label: "Normal" }, { value: "superscript", label: "Superscript" }, { value: "subscript", label: "Subscript" }] },
      { name: "highlight", label: "Highlight", value: value.highlight ?? "none", choices: [{ value: "none", label: "No color" }, ...Object.keys(textHighlightColors).map(value => ({ value, label: value }))] }
    ], values => format({ fontFamily: values.family!, fontSize: Number(values.size), bold: values.style === "bold" || values.style === "boldItalic", italic: values.style === "italic" || values.style === "boldItalic", color: values.color!, underline: values.underline === "true", strike: values.strike === "true", verticalAlignment: values.vertical as NonNullable<TextFormatting["verticalAlignment"]>, highlight: values.highlight as NonNullable<TextFormatting["highlight"]> }));
  });
  select("font", "Font family", (options.fonts ?? ["Arial", "Calibri", "Times New Roman", "Georgia", "Verdana", "Courier New"]).map(value => ({ value, label: value })), value => format({ fontFamily: value }));
  field("size", "Font size", "number", "12", value => format({ fontSize: Number(value) })); field("color", "Text color", "color", "#202b38", value => format({ color: value }));
  select("alignment", "Paragraph alignment", [{ value: "left", label: "Align left" }, { value: "center", label: "Center" }, { value: "right", label: "Align right" }, { value: "both", label: "Justify" }], value => result.execute({ kind: "align", alignment: value as "left" | "center" | "right" | "both" }));
  function updateStyleChoices(): void {
    const snapshot = doc?.snapshot();
    if (snapshot === styleSnapshot) return;
    styleSnapshot = snapshot;
    styleChoices = doc ? doc.paragraphStyles().all() : [];
    if (options.styles) { const all = new Map(styleChoices.map(style => [style.id, style])); styleChoices = options.styles.map(style => ({ ...all.get(style.id), id: style.id, name: style.label })); }
    if (styleList) renderStyleList();
  }
  function styleCard(button: HTMLElement, item: DocumentParagraphStyle): void {
    const sample = document.createElement("span"), name = document.createElement("span"), format = item.formatting, theme = doc?.content.first()?.theme;
    sample.className = "style-sample"; sample.textContent = "AaBbCc";
    sample.style.fontFamily = (format?.fontTheme ? theme?.fonts?.[format.fontTheme === "major" ? "heading" : "body"] : undefined) ?? format?.fontFamily ?? "Calibri"; sample.style.fontSize = `${Math.min(24, Math.max(12, format?.fontSize ?? (item.headingLevel ? 22 - item.headingLevel : 14)))}px`;
    sample.style.fontWeight = format?.bold || !format && item.headingLevel ? "bold" : "normal"; sample.style.fontStyle = format?.italic ? "italic" : "normal"; sample.style.color = (format?.colorTheme ? theme?.colors?.[format.colorTheme] : undefined) ?? format?.color ?? "inherit";
    name.className = "style-name"; name.textContent = item.name; button.replaceChildren(sample, name); button.title = item.name;
  }
  function renderStyleList(): void {
    if (!styleList) return;
    const filter = styleFilter?.value.trim().toLocaleLowerCase() ?? "";
    styleList.replaceChildren();
    for (const item of styleChoices.filter(style => !filter || style.name.toLocaleLowerCase().includes(filter))) {
      const button = document.createElement("button"); button.type = "button"; button.className = "paragraph-style-card"; button.dataset.styleId = item.id; button.setAttribute("aria-label", `Apply ${item.name}`); styleCard(button, item);
      button.addEventListener("mousedown", event => event.preventDefault());
      button.addEventListener("click", () => event(() => applyParagraphStyle(item.id))); styleList.append(button);
    }
    if (!styleList.children.length) { const empty = document.createElement("p"); empty.textContent = "No matching styles."; styleList.append(empty); }
  }
  function applyParagraphStyle(styleId: string | null): Promise<unknown> {
    return selectedCells ? paintParagraphs({ styleId }) : result.execute({ kind: "style", styleId });
  }
  button("styleGallery", "Style gallery", async () => {
    if (root.querySelector(".style-gallery-popup")) return;
    const trigger = controls.get("styleGallery")!, rect = trigger.getBoundingClientRect(), popup = document.createElement("div"), grid = document.createElement("div"); popup.className = "style-gallery-popup"; popup.popover = "auto"; popup.setAttribute("aria-label", "Paragraph styles"); grid.className = "style-gallery-grid";
    for (const item of [{ id: "", name: "Default paragraph" }, ...styleChoices]) {
      const button = document.createElement("button"); button.type = "button"; button.className = "paragraph-style-card"; button.setAttribute("aria-label", `Apply ${item.name}`); styleCard(button, item);
      button.addEventListener("click", () => { popup.hidePopover(); event(() => applyParagraphStyle(item.id || null)); }); grid.append(button);
    }
    const footer = document.createElement("div"), more = document.createElement("button"), create = document.createElement("button"); footer.className = "style-actions"; more.type = create.type = "button"; more.textContent = "Styles pane"; create.textContent = "Create style…";
    more.addEventListener("click", () => { popup.hidePopover(); event(openStylesPane); }); create.addEventListener("click", () => { popup.hidePopover(); event(() => editStyle(true)); }); footer.append(more, create); popup.append(grid, footer);
    (trigger as HTMLButtonElement).popoverTargetElement = popup;
    popup.addEventListener("toggle", () => { const open = popup.matches(":popover-open"); trigger.setAttribute("aria-expanded", String(open)); if (open) grid.querySelector("button")?.focus(); else { popup.remove(); (trigger as HTMLButtonElement).popoverTargetElement = null; } });
    popup.addEventListener("keydown", event => { const buttons = [...grid.querySelectorAll("button")], index = buttons.indexOf(root.activeElement as HTMLButtonElement); if (index >= 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const count = Math.max(1, Math.floor(grid.clientWidth / 112)), offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -count : count; buttons[Math.max(0, Math.min(buttons.length - 1, index + offset))]!.focus(); } if (event.key === "Escape") { popup.hidePopover(); trigger.focus(); } });
    root.append(popup); popup.style.left = Math.max(8, Math.min(rect.left, innerWidth - 500)) + "px"; popup.style.top = Math.min(rect.bottom, innerHeight - 300) + "px";
  });
  controls.get("styleGallery")!.setAttribute("aria-haspopup", "dialog"); controls.get("styleGallery")!.setAttribute("aria-expanded", "false"); controls.get("styleGallery")!.classList.add("paragraph-style-card", "current-style");
  async function openStylesPane(): Promise<void> {
    if (outlineView) closeOutline();
    reviewPanel?.hide();
    selectionPane?.dispose(); selectionPane = undefined;
    navigationPane?.element.remove(); navigationPane = undefined; host.removeAttribute("data-navigation-pane");
    if (stylePane) { styleFilter?.focus(); return; }
    stylePane = document.createElement("aside"); stylePane.className = "styles-pane"; stylePane.setAttribute("aria-label", "Styles");
    const header = document.createElement("header"), title = document.createElement("strong"), close = document.createElement("button"); title.textContent = "Styles"; close.type = "button"; close.textContent = "×"; close.setAttribute("aria-label", "Close Styles");
    close.addEventListener("click", closeStylesPane); header.append(title, close);
    styleFilter = document.createElement("input"); styleFilter.type = "search"; styleFilter.placeholder = "Search styles"; styleFilter.setAttribute("aria-label", "Search styles"); styleFilter.addEventListener("input", renderStyleList);
    styleList = document.createElement("div"); styleList.className = "style-pane-list";
    const footer = document.createElement("div"); footer.className = "style-actions";
    for (const [label, create] of [["New style…", true], ["Modify…", false]] as const) { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.addEventListener("click", () => event(() => editStyle(create))); footer.append(button); }
    stylePane.append(header, styleFilter, styleList, footer); root.append(stylePane); host.setAttribute("data-styles-pane", ""); renderStyleList(); updateToolbar(); styleFilter.focus();
  }
  function closeStylesPane(): void {
    stylePane?.remove(); stylePane = undefined; styleList = undefined; styleFilter = undefined; host.removeAttribute("data-styles-pane"); updateToolbar(); focus();
  }
  button("stylesPane", "Styles pane", async () => { if (stylePane) closeStylesPane(); else await openStylesPane(); });
  function editStyle(create: boolean): Promise<void> {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId), currentId = paragraph?.kind === "paragraph" ? paragraph.styleId : undefined, current = styleChoices.find(style => style.id === currentId), format = create ? currentFormatting() : current?.formatting ?? currentFormatting();
    const id = create ? `Style${Date.now().toString(36)}` : current?.id;
    const { styleId: _, ...paragraphProperties } = paragraph?.kind === "paragraph" ? paragraph.properties.effective : {};
    if (!id) throw new Error("Apply a named paragraph style before modifying it.");
    return form(create ? "Create style" : "Modify style", [
      { name: "name", label: "Name", value: create ? "New style" : current!.name },
      { name: "base", label: "Based on", value: create ? currentId ?? "" : "keep", choices: [...(!create ? [{ value: "keep", label: "Keep current inheritance" }] : []), { value: "", label: "No parent style" }, ...styleChoices.filter(style => style.id !== id).map(style => ({ value: style.id, label: style.name }))] },
      { name: "font", label: "Font family", value: (format.fontTheme ? requireDocument().content.first()?.theme?.fonts?.[format.fontTheme === "major" ? "heading" : "body"] : undefined) ?? format.fontFamily ?? "Calibri" },
      { name: "size", label: "Font size", type: "number", min: "0.5", step: "0.5", value: String(format.fontSize ?? 11) },
      { name: "emphasis", label: "Font style", value: format.bold && format.italic ? "both" : format.bold ? "bold" : format.italic ? "italic" : "regular", choices: [{ value: "regular", label: "Regular" }, { value: "bold", label: "Bold" }, { value: "italic", label: "Italic" }, { value: "both", label: "Bold italic" }] },
      { name: "color", label: "Text color", type: "color", value: (format.colorTheme ? requireDocument().content.first()?.theme?.colors?.[format.colorTheme] : undefined) ?? format.color ?? "#000000" },
      { name: "heading", label: "Outline level", value: String(current?.headingLevel ?? 0), choices: [{ value: "0", label: "Body text" }, ...Array.from({ length: 9 }, (_, index) => ({ value: String(index + 1), label: `Heading ${index + 1}` }))] },
      { name: "alignment", label: "Alignment", value: current?.paragraph?.alignment ?? paragraphProperties.alignment ?? "left", choices: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }, { value: "both", label: "Justify" }, { value: "start", label: "Leading edge" }, { value: "end", label: "Trailing edge" }, { value: "distribute", label: "Distributed" }] },
      { name: "before", label: "Space before (points)", type: "number", min: "0", step: "0.5", value: String(current?.paragraph?.spacingBefore ?? paragraphProperties.spacingBefore ?? 0) },
      { name: "after", label: "Space after (points)", type: "number", min: "0", step: "0.5", value: String(current?.paragraph?.spacingAfter ?? paragraphProperties.spacingAfter ?? 0) }
    ], values => result.execute({ kind: "paragraphStyle", action: create ? "create" : "update", styleId: id, name: values.name!, ...(values.base === "keep" ? {} : { basedOn: values.base || null }), headingLevel: Number(values.heading) || null, paragraph: { ...(create ? paragraphProperties : {}), alignment: values.alignment as "left" | "center" | "right" | "both" | "start" | "end" | "distribute", spacingBefore: Number(values.before), spacingAfter: Number(values.after), spacingBeforeAuto: false, spacingAfterAuto: false, spacingBeforeLines: null, spacingAfterLines: null }, formatting: { ...(create ? format : {}), fontTheme: null, colorTheme: null, fontFamily: values.font!, fontSize: Number(values.size), bold: ["bold", "both"].includes(values.emphasis!), italic: ["italic", "both"].includes(values.emphasis!), color: values.color! } }), undefined, form => form.classList.add("style-edit-form"));
  }
  function themePreview(form: HTMLFormElement, theme: typeof documentThemes[number]): void {
    let preview = form.querySelector<HTMLElement>(".theme-preview");
    if (!preview) { preview = document.createElement("div"); preview.className = "theme-preview"; form.append(preview); }
    const title = document.createElement("strong"), body = document.createElement("span"), swatches = document.createElement("span"); title.textContent = "Document heading"; title.style.fontFamily = theme.fonts.heading; title.style.color = theme.colors.accent1; body.textContent = "A paragraph of text in your document."; body.style.fontFamily = theme.fonts.body; body.style.color = theme.colors.dark1; swatches.className = "theme-swatches";
    for (const color of [theme.colors.accent1, theme.colors.accent2, theme.colors.accent3, theme.colors.accent4, theme.colors.accent5, theme.colors.accent6]) { const swatch = document.createElement("span"); swatch.style.background = color; swatches.append(swatch); }
    preview.replaceChildren(title, body, swatches);
  }
  button("design:effects", "Effects", () => {
    const effects = requireDocument().content.first()?.theme?.effects ?? [null, null, null];
    return form("Theme effects", [{ name: "effect", label: "Effect set", value: "custom", choices: [{ value: "custom", label: "Current effects" }, ...themeEffectSets] }], values => values.effect === "custom" ? Promise.resolve() : result.execute({ kind: "theme", effects: themeEffectSets.find(set => set.value === values.effect)!.effects }), undefined, form => drawingEffectsGallery(form, true, effects));
  });
  button("design:theme", "Themes", () => form("Document theme", [
    { name: "preset", label: "Theme", value: "office", choices: documentThemes.map(theme => ({ value: theme.id, label: theme.name })) },
    { name: "bind", label: "Use theme in default and heading styles", type: "checkbox", value: "true" }
  ], values => { const theme = documentThemes.find(theme => theme.id === values.preset)!; return result.execute({ kind: "batch", commands: documentThemeCommands(requireDocument().paragraphStyles().all(), { kind: "theme", colors: theme.colors, fonts: theme.fonts }, values.bind === "true", values.bind === "true") }); }, undefined, form => {
    themePreview(form, documentThemes[0]); form.querySelector("select")!.addEventListener("change", event => themePreview(form, documentThemes.find(theme => theme.id === (event.target as HTMLSelectElement).value)!));
    const help = document.createElement("p"); help.className = "design-help"; help.textContent = "Theme-linked text and drawings update throughout the document. Direct formatting stays unchanged."; form.append(help);
  }));
  button("design:fonts", "Theme fonts", () => {
    const fonts = requireDocument().content.first()?.theme?.fonts;
    return form("Theme fonts", [
      { name: "preset", label: "Font set", value: "custom", choices: [{ value: "custom", label: "Current / custom" }, ...documentFontSets.map((font, index) => ({ value: String(index), label: font.name }))] },
      { name: "heading", label: "Heading font", value: fonts?.heading || "Calibri" },
      { name: "body", label: "Body font", value: fonts?.body || "Calibri" },
      { name: "bind", label: "Use theme fonts in default and heading styles", type: "checkbox", value: "true" }
    ], values => result.execute({ kind: "batch", commands: documentThemeCommands(requireDocument().paragraphStyles().all(), { kind: "theme", fonts: { heading: values.heading!, body: values.body! } }, values.bind === "true", false) }), undefined, form => {
      const heading = form.querySelector<HTMLInputElement>('[name="heading"]')!, body = form.querySelector<HTMLInputElement>('[name="body"]')!, preset = form.querySelector<HTMLSelectElement>('[name="preset"]')!;
      const update = () => { heading.style.fontFamily = heading.value; body.style.fontFamily = body.value; }; update();
      preset.addEventListener("change", () => { const font = documentFontSets[Number(preset.value)]; if (font) { heading.value = font.heading; body.value = font.body; update(); } });
      for (const input of [heading, body]) input.addEventListener("input", () => { preset.value = "custom"; update(); });
    });
  });
  button("design:colors", "Theme colors", () => {
    const colors = { ...documentThemes[0].colors, ...requireDocument().content.first()?.theme?.colors };
    return form("Theme colors", [
      { name: "preset", label: "Color set", value: "custom", choices: [{ value: "custom", label: "Current / custom" }, ...documentThemes.map(theme => ({ value: theme.id, label: theme.name }))] },
      ...Object.entries(themeColorLabels).map(([name, label]) => ({ name, label, type: "color", value: colors[name as keyof typeof themeColorLabels] })),
      { name: "bind", label: "Use theme colors in default and heading styles", type: "checkbox", value: "true" }
    ], values => result.execute({ kind: "batch", commands: documentThemeCommands(requireDocument().paragraphStyles().all(), { kind: "theme", colors: Object.fromEntries(Object.keys(themeColorLabels).map(name => [name, values[name]!])) }, false, values.bind === "true") }), undefined, form => {
      form.className = "theme-colors-form";
      const preset = form.querySelector<HTMLSelectElement>("select")!;
      preset.addEventListener("change", () => { const theme = documentThemes.find(theme => theme.id === preset.value); if (theme) for (const name of Object.keys(themeColorLabels)) form.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value = theme.colors[name as keyof typeof themeColorLabels]; });
      for (const input of form.querySelectorAll<HTMLInputElement>('input[type="color"]')) input.addEventListener("input", () => { preset.value = "custom"; });
    });
  });
  button("design:watermark", "Watermark", () => {
    const existing = requireDocument().content.descendants().all().find(element => element.kind === "drawing" && element.story === "header" && element.description.startsWith("Watermark: "));
    const current = existing?.kind === "drawing" ? existing.textPath : undefined;
    return form("Watermark", [
    { name: "preset", label: "Preset", value: current ? "custom" : "draft", choices: [{ value: "draft", label: "Draft" }, { value: "confidential", label: "Confidential" }, { value: "sample", label: "Sample" }, { value: "custom", label: "Custom" }] },
    { name: "text", label: "Text", value: current?.text ?? "DRAFT" },
    { name: "font", label: "Font family", value: current?.fontFamily ?? "Arial" },
    { name: "color", label: "Color", type: "color", value: current?.color ?? "#808080" },
    { name: "opacity", label: "Opacity (%)", type: "number", min: "0", max: "100", value: String(current ? Math.round(current.opacity * 100) : 25) },
    { name: "width", label: "Width (pt)", type: "number", min: "1", value: String(current?.width ?? 360) },
    { name: "rotation", label: "Layout", value: String(current?.rotation ?? 315), choices: [{ value: "315", label: "Diagonal" }, { value: "0", label: "Horizontal" }] }
  ], values => result.execute({ kind: "watermark", text: values.text!, fontFamily: values.font!, color: values.color!, opacity: Number(values.opacity) / 100, width: Number(values.width), rotation: Number(values.rotation) }), { label: "Remove", execute: () => result.execute({ kind: "watermark", text: null }) }, form => {
    form.className = "watermark-form";
    const preset = form.elements.namedItem("preset") as HTMLSelectElement, text = form.elements.namedItem("text") as HTMLInputElement;
    preset.addEventListener("change", () => { if (preset.value !== "custom") text.value = preset.value.toUpperCase(); });
    text.addEventListener("input", () => { preset.value = "custom"; });
    const hint = document.createElement("p"); hint.className = "design-help"; hint.textContent = "Applies to every page. Existing header text and pictures are preserved."; form.append(hint);
  }); });
  button("design:color", "Page color", () => form("Page color", [
    { name: "color", label: "Page background", type: "color", value: requireDocument().content.first()?.backgroundColor ?? "#ffffff" }
  ], values => result.execute({ kind: "documentProperties", backgroundColor: values.color! }), { label: "No color", execute: () => result.execute({ kind: "documentProperties", backgroundColor: null }) }));
  button("design:borders", "Page borders", () => {
    const current = currentPageProperties().borders, border = current && Object.values(current.sides).find(Boolean);
    return form("Page borders", [
      { name: "style", label: "Style", value: border?.style ?? "single", choices: [{ value: "none", label: "No border" }, { value: "single", label: "Single line" }, { value: "double", label: "Double line" }, { value: "threeDEmboss", label: "Embossed" }, { value: "threeDEngrave", label: "Engraved" }, { value: "inset", label: "Inset" }, { value: "outset", label: "Outset" }] },
      { name: "color", label: "Color", type: "color", value: border?.color ?? "#000000" },
      { name: "width", label: "Width (points)", type: "number", min: "0.25", step: "0.25", value: String(border?.width ?? 1) },
      { name: "space", label: "Distance (points)", type: "number", min: "0", step: "1", value: String(border?.space ?? 24) },
      { name: "offset", label: "Measure from", value: current?.offsetFrom ?? "page", choices: [{ value: "page", label: "Edge of page" }, { value: "text", label: "Text" }] },
      { name: "display", label: "Pages", value: current?.display ?? "allPages", choices: [{ value: "allPages", label: "All pages" }, { value: "firstPage", label: "First page only" }, { value: "notFirstPage", label: "All except first page" }] },
      { name: "scope", label: "Apply to", value: "section", choices: [{ value: "section", label: "This section" }, { value: "document", label: "Whole document" }] }
    ], values => {
      const sides = Object.fromEntries((["top", "left", "bottom", "right"] as const).map(side => [side, values[side] === "on" ? { style: values.style!, color: values.color!, width: Number(values.width), space: Number(values.space) } : null]));
      const borders = values.style === "none" ? null : { sides, offsetFrom: values.offset as "page" | "text", display: values.display as "allPages" | "firstPage" | "notFirstPage" };
      const sections = values.scope === "document" ? requireDocument().content.sections().all() : requireDocument().content.sections().all().filter(section => section.index === (selectedSectionIndex() ?? 0));
      return result.execute({ kind: "batch", commands: sections.map(section => { const paragraph = bodySectionParagraph(section.index); return { kind: "page", borders, selection: { start: paragraph.selection.start, end: paragraph.selection.start } }; }) });
    }, undefined, form => {
      form.classList.add("wide-form");
      const preview = document.createElement("fieldset"), title = document.createElement("legend"); preview.className = "page-border-preview"; title.textContent = "Borders"; preview.append(title);
      for (const side of ["top", "left", "bottom", "right"] as const) {
        const label = document.createElement("label"), input = document.createElement("input"); label.className = "checkbox-field"; input.type = "checkbox"; input.name = side; input.checked = current ? !!current.sides[side] : true; label.append(input, side[0]!.toUpperCase() + side.slice(1)); preview.append(label);
      }
      form.append(preview);
    });
  });
  button("design:default", "Set as Default", () => form("Default document design", [
    { name: "scope", label: "Use for new blank documents", value: defaultDesignStorageKey === false ? "session" : "browser", choices: [{ value: "session", label: "This editor session" }, ...(defaultDesignStorageKey === false ? [] : [{ value: "browser", label: "This browser" }])] }
  ], async values => {
    const source = requireDocument(), styles = source.paragraphStyles().all(), normal = styles.find(style => style.isDefault) ?? styles.find(style => style.id === "Normal");
    if (!normal) throw new Error("Choose a document with a default paragraph style.");
    const theme = source.content.first()?.theme;
    const design: DefaultDocumentDesign = { ...(theme ? { theme } : {}), styles: styles.filter(style => style.id === normal.id || style.headingLevel).map(style => ({ ...style, isDefault: style.id === normal.id })) };
    if (values.scope === "browser" && defaultDesignStorageKey !== false) localStorage.setItem(defaultDesignStorageKey, JSON.stringify(design));
    sessionDesign = design;
    report("Default design saved for new blank documents.");
  }, { label: "Reset defaults", execute: async () => { if (defaultDesignStorageKey !== false) localStorage.removeItem(defaultDesignStorageKey); sessionDesign = null; report("New blank documents will use the standard design."); } }, form => {
    const help = document.createElement("p"); help.className = "design-help"; help.textContent = "Use this document's theme, default paragraph style and heading styles for new blank documents. Existing files keep their design. Browser defaults are stored on this device for this website."; form.append(help);
    const summary = document.createElement("p"), normal = requireDocument().paragraphStyles().all().find(style => style.isDefault); summary.className = "design-help"; summary.textContent = `Default text: ${normal?.formatting?.fontFamily ?? "Theme font"}, ${normal?.formatting?.fontSize ?? 11} pt`; form.append(summary);
  }));
  function designGallery(spacing: boolean): Promise<void> {
    const sets = spacing ? documentSpacingSets : documentStyleSets;
    return form(spacing ? "Document paragraph spacing" : "Document style set", [
      { name: "preset", label: "Preset", value: sets[0]!.id, choices: sets.map(set => ({ value: set.id, label: set.name })) }
    ], values => result.execute({ kind: "batch", commands: documentStyleCommands(requireDocument().paragraphStyles().all(), values.preset!, spacing) }), undefined, form => {
      const select = form.querySelector<HTMLSelectElement>("select")!, label = select.closest("label")!;
      label.hidden = true;
      const help = document.createElement("p"), gallery = document.createElement("div");
      help.className = "design-help"; help.textContent = spacing ? "Applies spacing to the default paragraph and heading styles. Direct paragraph spacing stays unchanged." : "Updates the default paragraph and heading styles throughout the document. Direct formatting stays unchanged.";
      gallery.className = "design-gallery"; gallery.setAttribute("role", "radiogroup"); gallery.setAttribute("aria-label", spacing ? "Paragraph spacing presets" : "Document style sets");
      for (const set of sets) {
        const card = document.createElement("button"), name = document.createElement("strong"), preview = document.createElement("span"), detail = document.createElement("small");
        card.type = "button"; card.className = "design-card"; card.setAttribute("role", "radio"); card.setAttribute("aria-label", set.name); card.setAttribute("aria-checked", String(set.id === select.value)); card.tabIndex = set.id === select.value ? 0 : -1;
        name.textContent = set.name; preview.className = "design-preview"; preview.style.lineHeight = String(set.multiple); preview.style.gap = `${Math.min(10, set.after)}px`;
        const heading = document.createElement("span"), body = document.createElement("span"); heading.textContent = "Document title"; heading.style.fontSize = `${Math.min(22, set.headingSize)}px`; heading.style.fontWeight = set.bold ? "600" : "400"; body.textContent = "A paragraph of text.\nAnother line of text."; preview.append(heading, body);
        detail.textContent = `${set.multiple} line spacing · ${set.after} pt after`; card.append(name, preview, detail);
        card.addEventListener("click", () => { select.value = set.id; for (const button of gallery.querySelectorAll<HTMLButtonElement>("button")) { const checked = button === card; button.setAttribute("aria-checked", String(checked)); button.tabIndex = checked ? 0 : -1; } }); gallery.append(card);
      }
      gallery.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return; event.preventDefault(); const cards = [...gallery.querySelectorAll<HTMLButtonElement>("button")], index = cards.indexOf(root.activeElement as HTMLButtonElement), next = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + cards.length) % cards.length; cards[next]!.click(); cards[next]!.focus(); });
      label.after(help, gallery);
    });
  }
  button("design:styles", "Style sets", () => designGallery(false));
  button("design:spacing", "Paragraph spacing", () => designGallery(true));
  select("style", "Paragraph style", (options.styles ?? []).map(s => ({ value: s.id, label: s.label })), value => result.execute({ kind: "style", styleId: value || null }));
  select("list", "List", [{ value: "", label: "No list" }, { value: "bullet", label: "Bullets" }, { value: "decimal", label: "Numbering" }], value => result.execute({ kind: "list", list: value as "bullet" | "decimal" || null }));
  button("multilevelList", "Multilevel list", () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId);
    const list = paragraph?.kind === "paragraph" ? paragraph.list : undefined;
    return form("Multilevel list", [
      { name: "kind", label: "List", value: list ? "current" : "decimal", choices: [...(list ? [{ value: "current", label: "Keep existing numbering" }] : []), { value: "decimal", label: "Numbered list" }, { value: "bullet", label: "Bulleted list" }] },
      { name: "level", label: "Level", value: String((list?.level ?? 0) + 1), choices: Array.from({ length: 9 }, (_, index) => ({ value: String(index + 1), label: `Level ${index + 1}` })) }
    ], values => result.execute({ kind: "list", ...(values.kind === "current" ? {} : { list: values.kind as "bullet" | "decimal" }), level: Number(values.level) - 1 }));
  });
  for (const [name, label, property] of [["indentStart", "Indent left", "indentStart"], ["indentEnd", "Indent right", "indentEnd"], ["spacingBefore", "Spacing before", "spacingBefore"], ["spacingAfter", "Spacing after", "spacingAfter"]] as const) {
    field(name, label, "number", "0", value => result.execute({ kind: "properties", paragraph: { [property]: Number(value), ...(property === "spacingBefore" ? { spacingBeforeAuto: false, spacingBeforeLines: null } : property === "spacingAfter" ? { spacingAfterAuto: false, spacingAfterLines: null } : {}) } }));
    controls.get(name)!.setAttribute("step", "1"); controls.get(name)!.setAttribute("min", name.startsWith("indent") ? "-1584" : "0");
  }
  for (const [name, label, direction] of [["decreaseIndent", "Decrease indent", -1], ["increaseIndent", "Increase indent", 1]] as const) button(name, label, () => {
    const range = requireSelection(), all = paragraphs(), start = all.findIndex(paragraph => paragraph.id === range.start.paragraphId), end = all.findIndex(paragraph => paragraph.id === range.end.paragraphId);
    return result.execute({ kind: "batch", commands: all.slice(Math.min(start, end), Math.max(start, end) + 1).map(paragraph => paragraph.list ? { kind: "list", selection: paragraph.selection, level: Math.max(0, Math.min(8, paragraph.list.level + direction)) } : { kind: "properties", selection: paragraph.selection, paragraph: { indentStart: Math.max(0, (paragraph.properties.effective.indentStart ?? 0) + direction * 36) } }) });
  });
  select("lineSpacing", "Line spacing", [1, 1.15, 1.5, 2, 2.5, 3].map(value => ({ value: String(value), label: String(value) })), value => value === "custom" ? Promise.resolve() : result.execute({ kind: "properties", paragraph: { lineSpacing: { multiple: Number(value) } } }));
  function paintParagraphs(paragraph: ParagraphPropertyPatch): Promise<unknown> {
    return result.execute(selectedCells ? { kind: "batch", commands: selectedTable().cells.flatMap(cell => requireDocument().content.within(cell).paragraphs().map(p => ({ kind: "properties" as const, selection: p.selection, paragraph }))) } : { kind: "properties", paragraph });
  }
  function updateZoom(): void {
    if (!canvas?.view || !doc) return;
    for (const [view, viewport] of [[canvas.view, preview], [splitView, splitPages]] as const) {
      if (!view) continue;
      const page = doc.pages[view.visiblePages[0] ?? 0];
      if (!page) continue;
      viewport.style.maxWidth = "";
      const height = Math.max(100, splitEnabled ? viewport.clientHeight - 16 : pageMovement === "horizontal" ? Math.min(window.innerHeight - Math.max(0, viewport.getBoundingClientRect().top) - 24, parseFloat(getComputedStyle(viewport).maxHeight)) - 18 : window.innerHeight - toolbar.getBoundingClientRect().height - Math.max(0, toolbar.getBoundingClientRect().top) - 48);
      const size = pagesAcross > 1 ? doc.pages.reduce((size, page) => ({ width: Math.max(size.width, page.size.width), height: Math.max(size.height, page.size.height) }), { width: 0, height: 0 }) : page.size;
      const factor = Math.min(Math.max(1, viewport.clientWidth - 16 * (pagesAcross - 1)) / (size.width / 15 * pagesAcross), height / (size.height / 15));
      if (pagesAcross > 1) viewport.style.maxWidth = `${Math.ceil(size.width / 15 * factor * pagesAcross + 16 * (pagesAcross - 1)) + 2}px`;
      view.setZoom(layoutMode === "web" ? typeof zoom === "number" ? zoom : 1 : layoutMode === "draft" && zoom === "fit-page" ? "fit-width" : zoom === "fit-page" ? factor : zoom);
    }
    const zoomControl = controls.get("zoom"), page = doc.pages[canvas.view.visiblePages[0] ?? 0];
    if (zoomControl && page) zoomControl.value = String(Math.round(typeof zoom === "number" ? zoom * 100 : (canvas.view.toClient(canvas.view.visiblePages[0] ?? 0, { x: page.size.width, y: 0 }).x - canvas.view.toClient(canvas.view.visiblePages[0] ?? 0, { x: 0, y: 0 }).x) / (page.size.width / 15) * 100));
    if (layoutMode === "web" && doc.layoutView.mode === "web" && doc.layoutView.width !== continuousWidth()) scheduleContinuousReflow();
  }
  function continuousWidth(): number { return Math.max(721, Math.round(preview.clientWidth * 15 / (typeof zoom === "number" ? zoom : 1))); }
  function layoutPolicy(): import("@onodocs/sdk/browser").DocumentLayoutView {
    return layoutMode === "print" ? { mode: "print" } : { mode: layoutMode, width: layoutMode === "web" ? continuousWidth() : 10080 };
  }
  async function changeLayout(value: typeof layoutMode): Promise<void> {
    await enqueue(async () => {
      closeOutline();
      const previous = layoutMode, previousZoom = zoom;
      layoutMode = value; zoom = 1;
      host.toggleAttribute("data-continuous", value !== "print");
      try { await requireDocument().setLayoutView(layoutPolicy(), { signal: lifetime.signal }); }
      catch (error) { layoutMode = previous; zoom = previousZoom; host.toggleAttribute("data-continuous", previous !== "print"); throw error; }
      pageMovement = "vertical"; pagesAcross = 1; zoom = 1; host.removeAttribute("data-horizontal");
      canvas?.view?.setPageMovement("vertical"); splitView?.setPageMovement("vertical");
      updateZoom(); focus(); updateToolbar();
    }, false);
  }
  function scheduleContinuousReflow(): void {
    if (layoutMode !== "web" || !doc) return;
    clearTimeout(reflowTimer);
    reflowTimer = setTimeout(() => { void event(() => enqueue(async () => {
      if (layoutMode !== "web" || !doc) return;
      await doc.setLayoutView(layoutPolicy(), { signal: lifetime.signal });
      updateZoom(); focus(false); updateToolbar();
    }, false)); }, 100);
  }
  const continuousSize = new ResizeObserver(scheduleContinuousReflow);
  continuousSize.observe(preview);
  window.addEventListener("resize", updateZoom, { signal: lifetime.signal });
  function setFocusView(value: boolean): void {
    if (value && outlineView) closeOutline();
    if (value === focusView) return;
    if (value) {
      focusScroll = { left: window.scrollX, top: window.scrollY };
      reviewPanel?.hide(); navigationPane?.element.remove(); navigationPane = undefined; selectionPane?.dispose(); selectionPane = undefined;
      stylePane?.remove(); stylePane = undefined; styleList = undefined; styleFilter = undefined; host.removeAttribute("data-styles-pane");
    }
    focusView = value; host.toggleAttribute("data-focus", value); exitFocus.hidden = !value;
    updateToolbar(); updateZoom();
    if (value) { host.scrollTop = 0; exitFocus.focus({ preventScroll: true }); }
    else { window.scrollTo(focusScroll.left, focusScroll.top); controls.get("view:focus")?.focus({ preventScroll: true }); }
  }
  const exitFocus = document.createElement("button"); exitFocus.type = "button"; exitFocus.className = "exit-focus"; exitFocus.textContent = "Exit Focus"; exitFocus.setAttribute("aria-label", "Exit Focus"); exitFocus.hidden = true; exitFocus.addEventListener("click", () => setFocusView(false)); root.append(exitFocus);
  button("view:focus", "Focus", async () => setFocusView(!focusView));
  for (const [value, label] of [["vertical", "Vertical"], ["horizontal", "Side to side"]] as const) button(`view:${value}`, label, async () => {
    if (layoutMode !== "print") await changeLayout("print");
    const page = activeView()?.visiblePages[0] ?? 0; pageMovement = value; pagesAcross = 1; host.toggleAttribute("data-horizontal", value === "horizontal");
    activeView()?.setPageMovement(value); if (value === "horizontal") zoom = "fit-page"; updateZoom(); updateToolbar(); activeView()?.scrollTo(page, { inline: "start" });
  });
  select("view:multiple", "Pages across", [1, 2, 3, 4].map(value => ({ value: String(value), label: `${value} ${value === 1 ? "page" : "pages"}` })), async value => {
    if (layoutMode !== "print") await changeLayout("print");
    const page = activeView()?.visiblePages[0] ?? 0; pagesAcross = Number(value); pageMovement = pagesAcross === 1 ? "vertical" : "horizontal"; zoom = pagesAcross === 1 ? "fit-width" : "fit-page";
    host.toggleAttribute("data-horizontal", pageMovement === "horizontal"); activeView()?.setPageMovement(pageMovement); updateZoom(); updateToolbar(); activeView()?.scrollTo(page, { inline: "start" });
  });
  button("view:split", "Split", async () => {
    if (outlineView) closeOutline();
    if (splitEnabled) { removeSplit(); return; }
    comparison?.dispose(); comparison = undefined; splitEnabled = true; pageMovement = "vertical"; pagesAcross = 1; host.removeAttribute("data-horizontal"); canvas?.view?.setPageMovement("vertical");
    mountSplit(); updateScrollClearance(); updateZoom(); updateToolbar();
    splitView?.scrollTo(canvas?.view?.visiblePages[0] ?? 0, { block: "start" });
  });
  button("view:sideBySide", "View Side by Side", async () => {
    if (outlineView) closeOutline();
    if (comparison) { comparison.dispose(); comparison = undefined; updateScrollClearance(); updateZoom(); updateToolbar(); return; }
    const picker = document.createElement("input"); picker.type = "file"; picker.accept = ".docx,.docm,.dotx,.dotm";
    picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) event(async () => {
      const reference = await openDocument(file, { ...options.document, signal: lifetime.signal });
      if (disposed) { reference.dispose(); return; }
      removeSplit(); comparison?.dispose(); pageMovement = "vertical"; pagesAcross = 1; zoom = "fit-width"; host.removeAttribute("data-horizontal"); activeView()?.setPageMovement("vertical");
      comparison = createComparison(root, host, preview, reference, file.name, () => doc && activeView() ? { document: doc, view: activeView()! } : undefined, () => { comparison?.dispose(); comparison = undefined; updateScrollClearance(); updateZoom(); updateToolbar(); }, updateToolbar);
      updateScrollClearance(); updateZoom(); updateToolbar(); report("Reference document opened beside the editable document.");
    }); }); picker.click();
  });
  button("view:syncScroll", "Synchronous Scrolling", async () => { comparison?.setSynchronized(!comparison.synchronized); updateToolbar(); });
  button("view:ruler", "Ruler", async () => { showRuler = !showRuler; ruler?.setVisible(showRuler); updateToolbar(); });
  button("view:dark", "Dark workspace", async () => { darkWorkspace = !darkWorkspace; host.toggleAttribute("data-dark", darkWorkspace); updateToolbar(); });
  button("view:read", "Read mode", async () => { await changeLayout("print"); if (mode !== "view") previousReadingMode = mode; await result.setMode("view"); pagesAcross = 1; zoom = "fit-width"; updateZoom(); updateToolbar(); });
  function closeOutline(): void { outlineView?.dispose(); outlineView = undefined; host.removeAttribute("data-outline"); updateToolbar(); updateZoom(); focus(); }
  button("view:outline", "Outline", async () => {
    if (outlineView) { closeOutline(); return; }
    if (focusView) setFocusView(false);
    reviewPanel?.hide(); setMobileTools(false);
    outlineView = createOutline(root, requireDocument, () => selection, range => result.select(range), command => result.execute(command), () => mode === "edit", closeOutline);
    host.setAttribute("data-outline", ""); updateToolbar(); outlineView.focus();
  });
  button("view:print", "Print layout", async () => { await changeLayout("print"); const next = previousReadingMode !== "view" && allowedModes.includes(previousReadingMode) ? previousReadingMode : allowedModes.includes("edit") ? "edit" : mode; await result.setMode(next); pagesAcross = 1; zoom = 1; updateZoom(); updateToolbar(); });
  for (const [value, label] of [["web", "Web layout"], ["draft", "Draft"]] as const) button(`view:${value}`, label, async () => {
    await changeLayout(value);
    if (mode === "view" && allowedModes.includes(previousReadingMode) && previousReadingMode !== "view") await result.setMode(previousReadingMode);
  });
  button("formattingMarks", "Show formatting marks", async () => { showMarks = !showMarks; updateToolbar(); });
  button("view:gridlines", "Drawing gridlines", async () => { showDrawingGrid = !showDrawingGrid; updateToolbar(); });
  function setZoomPercent(value: number): void {
    if (!Number.isFinite(value) || value < 10 || value > 500) throw new RangeError("Choose a zoom between 10% and 500%.");
    pagesAcross = 1; zoom = value / 100; updateZoom(); updateToolbar();
  }
  field("zoom", "Zoom percent", "number", "100", async percent => setZoomPercent(Number(percent)));
  for (const [name, value] of Object.entries({ min: "10", max: "500", step: "10" })) controls.get("zoom")!.setAttribute(name, value);
  for (const [name, label, step, symbol] of [["zoomOut", "Zoom out", -10, "−"], ["zoomIn", "Zoom in", 10, "+"]] as const) {
    button(name, label, async () => setZoomPercent(Math.max(10, Math.min(500, Number(controls.get("zoom")!.value) + step))));
    const control = controls.get(name)!; control.setAttribute("aria-label", label); control.textContent = symbol; control.classList.add("zoom-step");
  }
  button("zoomReset", "Reset zoom and page view", async () => {
    if (layoutMode !== "print") await changeLayout("print");
    const page = activeView()?.visiblePages[0] ?? 0; pagesAcross = 1; pageMovement = "vertical"; zoom = "fit-width";
    host.removeAttribute("data-horizontal"); activeView()?.setPageMovement("vertical"); updateZoom(); updateToolbar(); activeView()?.scrollTo(page, { inline: "start" });
  });
  for (const [name, label, value] of [["zoomWidth", "Page width", "fit-width"], ["zoomPage", "One page", "fit-page"]] as const) button(name, label, async () => { pagesAcross = 1; zoom = value; updateZoom(); updateToolbar(); });
  button("merge:highlight", "Highlight merge fields", async () => { showMergeFields = !showMergeFields; updateToolbar(); });
  const mailings = createMailings({ root, editor: () => result, document: options.document, signal: lifetime.signal, form, report });
  for (const command of mailings) button(command.id, command.label, command.execute);
  if (options.dictation) button("dictate", "Dictate", async () => showDictation(root, result, options.dictation!, lifetime.signal, focus));
  if (options.protection) button("protect", "Protect", async () => showProtection(root, result, options.protection!, lifetime.signal, focus));
  for (const [kind, label] of [["check", "Spelling and grammar"], ["rewrite", "Writing assistance"], ["synonyms", "Thesaurus"]] as const) if (options.writing?.[kind]) button(`writing:${kind}`, label, async () => showWriting(root, result, kind, options.writing!, lifetime.signal, focus));
  button("accessibility", "Check accessibility", async () => showAccessibility(root, requireDocument, mode === "edit", command => result.execute(command), range => result.select(range), focus));
  button("language", "Language", () => {
    const keys = ["languageLatin", "languageEastAsia", "languageComplexScript"] as const, labels = ["Western text", "East Asian text", "Complex script text"];
    return form("Language", [
      { name: "scope", label: "Apply to", value: "selection", choices: [{ value: "selection", label: "Selected text or next typing" }, { value: "document", label: "Whole document" }] },
      ...keys.map((name, index) => ({ name, label: labels[index]!, value: "" })),
      { name: "proof", label: "Spelling and grammar", value: "keep", choices: [{ value: "keep", label: "Keep existing setting" }, { value: "check", label: "Check spelling and grammar" }, { value: "skip", label: "Do not check spelling or grammar" }] },
    ], async values => {
      const patch: { -readonly [K in keyof TextFormatting]: TextFormatting[K] } = {};
      for (const key of keys) if (values[key]?.trim()) { const tag = values[key]!.trim(); try { Intl.getCanonicalLocales(tag); } catch { throw new TypeError("Enter a language tag such as en-US or uk-UA."); } patch[key] = tag; }
      if (values.proof !== "keep") patch.noProof = values.proof === "skip";
      if (!Object.keys(patch).length) return;
      if (values.scope === "document") await result.execute({ kind: "batch", commands: requireDocument().content.paragraphs().all().filter(paragraph => paragraph.text.length > 0).map(paragraph => ({ kind: "format" as const, selection: paragraph.selection, formatting: patch })) });
      else await format(patch);
    }, undefined, form => {
      const choices = document.createElement("datalist"); choices.id = "editor-language-options";
      const names = new Intl.DisplayNames([navigator.language], { type: "language" });
      for (const value of ["en-US", "en-GB", "uk-UA", "et-EE", "de-DE", "fr-FR", "es-ES", "it-IT", "pt-BR", "pl-PL", "fi-FI", "ja-JP", "ko-KR", "zh-CN", "zh-TW", "ar-SA", "he-IL", "hi-IN", "th-TH"]) { const option = document.createElement("option"); option.value = value; option.label = names.of(value) ?? value; choices.append(option); }
      for (const key of keys) { const input = form.elements.namedItem(key) as HTMLInputElement; input.setAttribute("list", choices.id); input.placeholder = "Keep existing (for example, en-US)"; input.autocomplete = "off"; }
      const hint = document.createElement("small"); hint.textContent = "Choose a language tag or enter one. Blank fields keep existing languages. Proofing preferences are saved for Word or the host application's checker."; form.append(choices, hint);
    });
  });
  button("sort", "Sort paragraphs", () => form("Sort text", [
    { name: "type", label: "Type", value: "text", choices: [{ value: "text", label: "Text" }, { value: "number", label: "Number" }] },
    { name: "order", label: "Order", value: "ascending", choices: [{ value: "ascending", label: "Ascending (A to Z)" }, { value: "descending", label: "Descending (Z to A)" }] },
    { name: "caseSensitive", label: "Case sensitive", type: "checkbox", value: "false" },
  ], values => result.execute({ kind: "sort", type: values.type as "text" | "number", order: values.order as "ascending" | "descending", caseSensitive: values.caseSensitive === "true", locale: navigator.language })));
  button("paragraphShading", "Paragraph shading", () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId), shading = paragraph?.kind === "paragraph" ? paragraph.properties.effective.shading : undefined;
    return form("Paragraph shading", [
      { name: "fill", label: "Fill", value: "color", choices: [{ value: "color", label: "Color" }, { value: "auto", label: "No color" }, { value: "inherit", label: "Use style shading" }] },
      { name: "color", label: "Color", type: "color", value: shading && shading !== "auto" ? shading : "#d9eaf7" }
    ], values => paintParagraphs({ shading: values.fill === "inherit" ? null : values.fill === "auto" ? "auto" : values.color! }));
  });
  button("paragraphBorders", "Paragraph borders", () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId), borders = paragraph?.kind === "paragraph" ? paragraph.properties.effective.borders : undefined;
    const existing = borders && Object.values(borders).find(border => border && !["nil", "none"].includes(border.style));
    return form("Paragraph borders", [
      { name: "preset", label: "Setting", value: "box", choices: [{ value: "box", label: "Box" }, { value: "all", label: "Box and between paragraphs" }, { value: "bottom", label: "Bottom border" }, { value: "top", label: "Top border" }, { value: "left", label: "Left border" }, { value: "right", label: "Right border" }, { value: "between", label: "Between paragraphs" }, { value: "none", label: "No borders" }, { value: "inherit", label: "Use style borders" }] },
      { name: "style", label: "Style", value: existing && ["single", "double", "dotted", "dashed"].includes(existing.style) ? existing.style : "single", choices: [{ value: "single", label: "Solid" }, { value: "double", label: "Double" }, { value: "dotted", label: "Dotted" }, { value: "dashed", label: "Dashed" }] },
      { name: "width", label: "Width (points)", type: "number", min: "0.125", step: "0.125", value: String(existing?.width ?? .75) },
      { name: "color", label: "Color", type: "color", value: existing?.color && existing.color !== "auto" ? existing.color : "#000000" },
      { name: "space", label: "Distance from text (points)", type: "number", min: "0", step: "1", value: String(existing?.space ?? 4) }
    ], values => {
      const sides = ["top", "left", "bottom", "right", "between", "bar"] as const;
      const borders = values.preset === "inherit" ? null : Object.fromEntries(sides.filter(side => ["all", "box", "none"].includes(values.preset!) || side === values.preset).map(side => [side, { style: values.preset === "none" || side === "bar" || values.preset === "box" && side === "between" ? "nil" : values.style!, width: Number(values.width), color: values.color!, space: values.preset === "none" || side === "bar" || values.preset === "box" && side === "between" ? 0 : Number(values.space) }]));
      return paintParagraphs({ borders });
    });
  });
  button("paragraph", "Paragraph settings", () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId);
    if (paragraph?.kind !== "paragraph") return Promise.resolve();
    const properties = paragraph.properties.effective, line = properties.lineSpacing;
    return form("Indents and spacing", [
      { name: "indentStart", label: "Leading indent (points)", type: "number", value: String(properties.indentStart ?? 0) },
      { name: "indentEnd", label: "Trailing indent (points)", type: "number", value: String(properties.indentEnd ?? 0) },
      { name: "special", label: "Special indent", value: properties.hanging ? "hanging" : properties.firstLine ? "firstLine" : "none", choices: [{ value: "none", label: "None" }, { value: "firstLine", label: "First line" }, { value: "hanging", label: "Hanging" }] },
      { name: "amount", label: "By (points)", type: "number", min: "0", value: String(properties.hanging ?? properties.firstLine ?? 0) },
      { name: "spacingBefore", label: "Before (points)", type: "number", min: "0", value: String(properties.spacingBefore ?? 0) },
      { name: "spacingAfter", label: "After (points)", type: "number", min: "0", value: String(properties.spacingAfter ?? 0) },
      { name: "rule", label: "Line spacing", value: line && "points" in line ? line.rule : "multiple", choices: [{ value: "multiple", label: "Multiple" }, { value: "atLeast", label: "At least (points)" }, { value: "exact", label: "Exactly (points)" }] },
      { name: "line", label: "At", type: "number", min: "0.05", value: String(line ? "multiple" in line ? line.multiple : line.points : 1) }
    ], values => result.execute({ kind: "properties", paragraph: { indentStart: Number(values.indentStart), indentEnd: Number(values.indentEnd), firstLine: values.special === "firstLine" ? Number(values.amount) : null, hanging: values.special === "hanging" ? Number(values.amount) : null, spacingBefore: Number(values.spacingBefore), spacingAfter: Number(values.spacingAfter), spacingBeforeAuto: false, spacingAfterAuto: false, spacingBeforeLines: null, spacingAfterLines: null, lineSpacing: values.rule === "multiple" ? { multiple: Number(values.line) } : { points: Number(values.line), rule: values.rule as "exact" | "atLeast" } } }), undefined, form => {
      const tabs = document.createElement("button"); tabs.type = "button"; tabs.textContent = "Tabs…"; tabs.dataset.dialogAction = ""; tabs.addEventListener("click", () => { form.closest("dialog")!.remove(); controls.get("tabs")!.click(); }); form.append(tabs);
    });
  });
  button("tabs", "Tab stops", () => {
    const document = requireDocument(), selection = requireSelection(), snapshot = document.snapshot();
    const all = paragraphs(), first = all.findIndex(p => p.id === selection.start.paragraphId), last = all.findIndex(p => p.id === selection.end.paragraphId);
    const selected = selectedCells ? selectedTable().cells.flatMap(cell => document.content.within(cell).paragraphs().all()) : all.slice(Math.min(first, last), Math.max(first, last) + 1);
    let read: () => NonNullable<import("@onodocs/sdk").ParagraphProperties["tabStops"]>;
    const interval = document.content.first()!.defaultTabStop;
    return form("Tab stops", [{ name: "interval", label: "Default spacing (points, whole document)", type: "number", min: "0.05", step: "0.05", value: String(interval) }], async values => {
      if (requireDocument() !== document || document.snapshot() !== snapshot) throw new Error("The document changed. Reopen Tab stops to edit the current selection.");
      const stops = read(), positions = new Set(stops.map(stop => Math.round(stop.position * 20)));
      await result.execute({ kind: "batch", commands: [...Number(values.interval) === interval ? [] : [{ kind: "documentProperties" as const, defaultTabStop: Number(values.interval) }], ...selected.map(paragraph => ({ kind: "properties" as const, selection: paragraph.selection, paragraph: { tabStops: [...(paragraph.properties.effective.tabStops ?? []).filter(stop => !positions.has(Math.round(stop.position * 20))).map(stop => ({ position: stop.position, alignment: "clear" as const })), ...stops] } }))] });
    }, undefined, form => { read = createTabStopEditor(form, selected[0]?.properties.effective.tabStops ?? []); });
  });
  button("pagination", "Line and page breaks", () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId);
    if (paragraph?.kind !== "paragraph") return Promise.resolve();
    const fields = [["widowControl", "Widow/orphan control"], ["keepWithNext", "Keep with next"], ["keepLines", "Keep lines together"], ["pageBreakBefore", "Page break before"], ["contextualSpacing", "No spacing between paragraphs of the same style"]] as const;
    return form("Line and page breaks", fields.map(([name, label]) => ({ name, label, value: paragraph.properties.authored[name] === undefined ? "inherit" : String(paragraph.properties.authored[name]), choices: [{ value: "inherit", label: "Use style setting" }, { value: "true", label: "On" }, { value: "false", label: "Off" }] })), values => result.execute({ kind: "properties", paragraph: Object.fromEntries(fields.map(([name]) => [name, values[name] === "inherit" ? null : values[name] === "true"])) }));
  });
  for (const name of ["drawTable", "table:drawTable"]) button(name, "Draw Table", async () => {
    const paragraph = requireDocument().content.get(requireSelection().start.paragraphId), table = paragraph && requireDocument().content.within(paragraph).closest("table").first();
    if (table) {
      paintingBorders = paintingBorders === "draw" ? false : "draw"; painter = undefined; outlineSelection(); updateToolbar(); setMobileTools(false);
      report(paintingBorders ? "Drag a divider across a cell. Arrow keys position a divider; Enter draws it. Escape finishes." : "Draw Table off.");
      if (paintingBorders) root.querySelector<HTMLButtonElement>(".table-drawing-cell")?.focus({ preventScroll: true });
      return;
    }
    const page = currentPageProperties(), maximumWidth = (page.width ?? 612) - (page.margins?.left ?? 72) - (page.margins?.right ?? 72);
    const after = requireSelection().end.paragraphId;
    return form("Draw Table", [{ name: "width", label: "Table width (points)", type: "number", min: "1", max: String(maximumWidth), step: "0.05", value: String(Math.min(432, maximumWidth)) }, { name: "height", label: "Table height (points)", type: "number", min: "1", step: "0.05", value: "144" }], async values => {
      const change = await result.execute({ kind: "insertTable", after, rows: 1, columns: 1, width: Number(values.width), rowHeight: { points: Number(values.height), rule: "atLeast" } });
      const table = change && "tables" in change ? change.tables[0] : undefined;
      if (table) { result.selectCells({ tableId: table.id, rowIndex: 0, columnIndex: 0, rowCount: 1, columnCount: 1 }); paintingBorders = "draw"; outlineSelection(); updateToolbar(); report("Table created. Draw dividers in its cells; Escape finishes."); }
    }, undefined, form => { form.classList.add("wide-form"); tableSizeSketch(form); });
  });
  button("table", "Insert table", () => form("Insert table", [{ name: "rows", label: "Rows", value: "2", type: "number", step: "1" }, { name: "columns", label: "Columns", value: "2", type: "number", step: "1" }], v => result.execute({ kind: "insertTable", after: requireSelection().end.paragraphId, rows: Number(v.rows), columns: Number(v.columns) })));
  for (const action of tableActions) button(`table:${action}`, ({ insertRow: "Insert row below", insertColumn: "Insert column right", deleteRow: "Delete row", deleteColumn: "Delete column", delete: "Delete table" })[action], () => {
    const { table, row, cell, range } = selectedTable();
    if (action === "delete") return result.execute({ kind: "table", tableId: table.id, action });
    const rowOperation = action.endsWith("Row"), index = rowOperation ? range?.rowIndex ?? table.rows.indexOf(row) : range?.columnIndex ?? cell.columnIndex;
    const count = rowOperation ? range?.rowCount ?? 1 : range?.columnCount ?? cell.columnSpan;
    return result.execute(action.startsWith("insert") ? { kind: "table", tableId: table.id, action: action as "insertRow" | "insertColumn", index: index + count } : { kind: "table", tableId: table.id, action: action as "deleteRow" | "deleteColumn", index, count });
  });
  for (const action of ["insertRow", "insertColumn"] as const) button("table:" + action + "Before", action === "insertRow" ? "Insert row above" : "Insert column left", () => {
    const { table, row, cell, range } = selectedTable();
    return result.execute({ kind: "table", tableId: table.id, action, index: action === "insertRow" ? range?.rowIndex ?? table.rows.indexOf(row) : range?.columnIndex ?? cell.columnIndex });
  });
  button("table:insertDialog", "Insert rows or columns", () => {
    const { table, row, cell, range } = selectedTable();
    return form("Insert rows or columns", [
      { name: "placement", label: "Insert", value: "below", choices: [{ value: "above", label: "Rows above selection" }, { value: "below", label: "Rows below selection" }, { value: "left", label: "Columns left of selection" }, { value: "right", label: "Columns right of selection" }] },
      { name: "count", label: "Number to insert", type: "number", min: "1", step: "1", value: "1" }
    ], values => {
      const count = Number(values.count), vertical = values.placement === "above" || values.placement === "below";
      if (!Number.isSafeInteger(count) || count < 1) throw new RangeError("Enter a positive whole number.");
      const start = vertical ? range?.rowIndex ?? table.rows.indexOf(row) : range?.columnIndex ?? cell.columnIndex;
      const selectedCount = vertical ? range?.rowCount ?? 1 : range?.columnCount ?? cell.columnSpan;
      return result.execute({ kind: "table", tableId: table.id, action: vertical ? "insertRow" : "insertColumn", index: start + (values.placement === "below" || values.placement === "right" ? selectedCount : 0), count });
    });
  });
  button("table:deleteMenu", "Delete", async () => {
    const menu = document.createElement("div"); menu.className = "ribbon-menu"; menu.popover = "auto"; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "Delete table elements");
    for (const name of ["table:deleteRow", "table:deleteColumn", "table:delete"]) {
      const item = document.createElement("button"); item.type = "button"; item.setAttribute("role", "menuitem"); const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("fill", "none"); icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "1.75"); icon.setAttribute("aria-hidden", "true"); icon.innerHTML = editorIcons[name]!;
      const label = document.createElement("span"); label.textContent = controls.get(name)!.getAttribute("aria-label") ?? controls.get(name)!.textContent; item.append(icon, label);
      item.addEventListener("click", () => { menu.hidePopover(); controls.get(name)!.click(); }); menu.append(item);
    }
    const trigger = controls.get("table:deleteMenu")!, rect = trigger.getBoundingClientRect();
    trigger.setAttribute("aria-expanded", "true");
    menu.addEventListener("toggle", e => { if ((e as ToggleEvent).newState === "closed") { trigger.setAttribute("aria-expanded", "false"); menu.remove(); } });
    menu.addEventListener("keydown", e => {
      const items = [...menu.querySelectorAll("button")], index = items.indexOf(root.activeElement as HTMLButtonElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(index + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]!.focus(); }
      if (e.key === "Escape") { e.preventDefault(); menu.hidePopover(); trigger.focus(); }
    });
    root.append(menu); menu.style.left = rect.left + "px"; menu.style.top = rect.bottom + "px"; menu.showPopover(); menu.querySelector("button")!.focus();
  });
  controls.get("table:deleteMenu")!.setAttribute("aria-haspopup", "menu");
  function selectedTable() {
    const document = requireDocument(), paragraph = document.content.get(requireSelection().start.paragraphId);
    if (!paragraph) throw new RangeError("Place the cursor in a table cell.");
    const table = selectedCells ? document.content.tables().at(selectedCells.tableIndex)! : document.content.within(paragraph).closest("table").one();
    const row = selectedCells ? table.rows[selectedCells.rowIndex]! : document.content.within(paragraph).closest("row").one();
    const cell = selectedCells ? row.cells.find(cell => cell.columnIndex === selectedCells!.columnIndex)! : document.content.within(paragraph).closest("cell").one();
    const range = selectedCells ?? cell.mergedRange;
    const rows = range ? table.rows.slice(range.rowIndex, range.rowIndex + range.rowCount) : [row];
    const cells = range ? rows.flatMap(row => row.cells.filter(cell => cell.columnIndex < range.columnIndex + range.columnCount && cell.columnIndex + cell.columnSpan > range.columnIndex)) : [cell];
    return { document, table, row, cell, rows, cells, range };
  }
  button("table:gridlines", "View gridlines", async () => { showGridlines = !showGridlines; updateToolbar(); });
  select("table:select", "Select table cells", [{ value: "", label: "Select" }, { value: "cell", label: "Select cell" }, { value: "row", label: "Select row" }, { value: "column", label: "Select column" }, { value: "table", label: "Select table" }, { value: "range", label: "Select cell range…" }], async value => {
    const { table, row, cell } = selectedTable(), rowIndex = table.rows.indexOf(row), columnCount = Math.max(...table.rows.map(row => Math.max(...row.cells.map(cell => cell.columnIndex + cell.columnSpan))));
    controls.get("table:select")!.value = "";
    if (value === "range") return form("Select cell range", [{ name: "row", label: "Starting row", type: "number", min: "1", step: "1", value: String(rowIndex + 1) }, { name: "column", label: "Starting column", type: "number", min: "1", step: "1", value: String(cell.columnIndex + 1) }, { name: "rows", label: "Rows", type: "number", min: "1", step: "1", value: "1" }, { name: "columns", label: "Columns", type: "number", min: "1", step: "1", value: String(cell.columnSpan) }], async values => { result.selectCells({ tableId: table.id, rowIndex: Number(values.row) - 1, columnIndex: Number(values.column) - 1, rowCount: Number(values.rows), columnCount: Number(values.columns) }); });
    if (value === "cell" && cell.mergedRange) { result.selectCells({ tableId: table.id, ...cell.mergedRange }); return; }
    if (value) result.selectCells({ tableId: table.id, rowIndex: value === "table" || value === "column" ? 0 : rowIndex, columnIndex: value === "table" || value === "row" ? 0 : cell.columnIndex, rowCount: value === "table" || value === "column" ? table.rows.length : 1, columnCount: value === "table" || value === "row" ? columnCount : cell.columnSpan });
  });
  for (const [action, label] of [["mergeCells", "Merge cells"], ["unmergeCells", "Unmerge cells"]] as const) button("table:" + action, label, () => {
    const range = result.cellSelection;
    if (!range) throw new RangeError("Select a cell range first using Select or Shift-click.");
    return result.execute({ kind: "table", action, ...range });
  });
  button("table:splitCells", "Split cells", () => {
    const { table, row, cell, range } = selectedTable();
    const selection = { tableId: table.id, rowIndex: range?.rowIndex ?? table.rows.indexOf(row), columnIndex: range?.columnIndex ?? cell.columnIndex, rowCount: range?.rowCount ?? 1, columnCount: range?.columnCount ?? cell.columnSpan };
    return form("Split cells", [{ name: "columns", label: "Number of columns", value: "2", type: "number", min: "1", step: "1" }, { name: "rows", label: "Number of rows", value: "1", type: "number", min: "1", step: "1" }], values => result.execute({ kind: "table", action: "splitCells", ...selection, columns: Number(values.columns), rows: Number(values.rows) }), undefined, form => {
      const note = document.createElement("p"); note.textContent = "Selected cells are combined before splitting. Their contents stay in the first cell."; form.append(note);
    });
  });
  button("table:formula", "Formula", () => {
    const { table, row, cell, range } = selectedTable();
    if (range && (range.rowCount > 1 || range.columnCount > cell.columnSpan)) throw new Error("Place the cursor in one cell to insert a formula.");
    const direction = table.rows.indexOf(row) > 0 ? "ABOVE" : cell.columnIndex > 0 ? "LEFT" : "";
    return form("Table formula", [{ name: "expression", label: "Formula", value: cell.formula?.expression ?? (direction ? `=SUM(${direction})` : "=0") }, { name: "numberFormat", label: "Number format", value: cell.formula?.numberFormat ?? "", choices: [{ value: "", label: "General" }, ...["0", "0.00", "#,##0", "#,##0.00", "0%", "0.00%"].map(value => ({ value, label: value }))] }], values => result.execute({ kind: "table", tableId: table.id, action: "formula", cellId: cell.id, expression: values.expression!, ...(values.numberFormat ? { numberFormat: values.numberFormat } : {}) }), undefined, form => {
      const label = document.createElement("label"), choices = document.createElement("select"), hint = document.createElement("p"); label.textContent = "Insert function"; choices.ariaLabel = "Insert function";
      for (const name of ["", "SUM", "AVERAGE", "COUNT", "MIN", "MAX", "PRODUCT", "ABS", "ROUND", "IF"]) choices.add(new Option(name || "Choose a function", name));
      choices.addEventListener("change", () => { if (!choices.value) return; const input = form.querySelector<HTMLInputElement>('[name="expression"]')!; const value = choices.value === "ROUND" ? "ROUND(0,2)" : choices.value === "IF" ? "IF(1,0,0)" : `${choices.value}(${choices.value === "ABS" ? "0" : direction || "0"})`; input.setRangeText(value, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, "select"); input.focus(); choices.value = ""; });
      label.append(choices); hint.className = "design-help"; hint.textContent = "Replaces this cell's contents. Use A1-style cell references, ranges such as A1:B3, or ABOVE, BELOW, LEFT and RIGHT. Values recalculate when the table changes."; form.append(label, hint);
    });
  });
  button("table:sort", "Sort table", () => {
    const { table } = selectedTable(), columns = table.rows.reduce((width, row) => row.cells.reduce((width, cell) => Math.max(width, cell.columnIndex + cell.columnSpan), width), 0);
    const choices = Array.from({ length: columns }, (_, index) => ({ value: String(index), label: `Column ${index + 1}` }));
    const headers = table.rows.findIndex(row => !row.properties.authored.header);
    return form("Sort table", [
      ...[0, 1, 2].flatMap(index => [
        { name: `column${index}`, label: index ? "Then by" : "Sort by", value: index ? "none" : "0", choices: index ? [{ value: "none", label: "None" }, ...choices] : choices },
        { name: `type${index}`, label: "Type", value: "text", choices: [{ value: "text", label: "Text" }, { value: "number", label: "Number" }] },
        { name: `order${index}`, label: "Order", value: "ascending", choices: [{ value: "ascending", label: "Ascending" }, { value: "descending", label: "Descending" }] }
      ]),
      { name: "headers", label: "Keep header rows", type: "number", min: "0", max: String(table.rows.length - 1), step: "1", value: String(headers < 0 ? 0 : headers) },
      { name: "case", label: "Case sensitive", type: "checkbox", value: "false" }
    ], values => result.execute({ kind: "table", tableId: table.id, action: "sort", headerRows: Number(values.headers), caseSensitive: values.case === "true", keys: [0, 1, 2].filter(index => values[`column${index}`] !== "none").map(index => ({ columnIndex: Number(values[`column${index}`]), type: values[`type${index}`] as "text" | "number", order: values[`order${index}`] as "ascending" | "descending" })) }), undefined, form => { form.className = "table-sort-form"; for (const index of [1, 2]) { const column = form.elements.namedItem(`column${index}`) as HTMLSelectElement; const update = () => { for (const name of ["type", "order"]) (form.elements.namedItem(`${name}${index}`) as HTMLSelectElement).disabled = column.value === "none"; }; column.addEventListener("change", update); update(); } });
  });
  button("table:convertText", "Convert to text", () => {
    const { table } = selectedTable();
    return form("Convert table to text", [{ name: "separator", label: "Separate cells with", value: "tabs", choices: [{ value: "tabs", label: "Tabs" }, { value: "commas", label: "Commas" }, { value: "paragraphs", label: "Paragraphs" }] }], values => result.execute({ kind: "table", tableId: table.id, action: "convertToText", separator: values.separator as "tabs" | "commas" | "paragraphs" }), undefined, form => { const hint = document.createElement("p"); hint.className = "design-help"; hint.textContent = "Removes the table and keeps cell content, direct text formatting and links. Each row starts a new paragraph."; form.append(hint); });
  });
  button("table:split", "Split table", () => {
    const { table, row, range } = selectedTable();
    return result.execute({ kind: "table", tableId: table.id, action: "split", index: range?.rowIndex ?? table.rows.indexOf(row) });
  });
  function tableColumnWidths(table: import("@onodocs/sdk").DocumentTable): number[] {
    const document = requireDocument(), properties = table.properties.authored, authored = properties.columnWidths;
    if (properties.layout === "fixed" && authored?.length && properties.width && properties.width !== "auto" && "points" in properties.width && Math.abs(authored.reduce((sum, width) => sum + width, 0) - properties.width.points) < 0.025) return [...authored];
    const count = table.rows.reduce((maximum, row) => row.cells.reduce((maximum, cell) => Math.max(maximum, cell.columnIndex + cell.columnSpan), maximum), authored?.length ?? 0);
    const fragments = document.geometry.fragments(table), bounds = fragments[0]?.bounds;
    const pages = new Map<number, typeof fragments[number][]>();
    for (const fragment of fragments) { const page = pages.get(fragment.pageIndex); if (page) page.push(fragment); else pages.set(fragment.pageIndex, [fragment]); }
    const boundaries = new Map<number, number>([[0, 0], [count, bounds?.width ?? (authored?.reduce((sum, width) => sum + width, 0) ?? count * 72) * 20]]);
    for (const row of table.rows) for (const cell of row.cells) {
      const fragment = document.geometry.fragments(cell)[0];
      const tableFragment = fragment && pages.get(fragment.pageIndex)?.find(value => fragment.bounds.x >= value.bounds.x - 1 && fragment.bounds.x < value.bounds.x + value.bounds.width && fragment.bounds.y >= value.bounds.y - 1 && fragment.bounds.y < value.bounds.y + value.bounds.height);
      if (!fragment || !tableFragment) continue;
      const start = table.properties.authored.rightToLeft ? tableFragment.bounds.x + tableFragment.bounds.width - fragment.bounds.x - fragment.bounds.width : fragment.bounds.x - tableFragment.bounds.x;
      boundaries.set(cell.columnIndex, start);
      boundaries.set(cell.columnIndex + cell.columnSpan, start + fragment.bounds.width);
    }
    const indexes = [...boundaries.keys()].sort((a, b) => a - b), widths: number[] = [];
    for (let interval = 1; interval < indexes.length; interval++) {
      const start = indexes[interval - 1]!, end = indexes[interval]!, available = boundaries.get(end)! - boundaries.get(start)!;
      let total = 0; for (let index = start; index < end; index++) total += authored?.[index] ?? 1;
      for (let index = start; index < end; index++) widths.push(Math.max(0.05, available / 20 * (authored?.[index] ?? 1) / total));
    }
    return widths;
  }
  button("table:columnWidth", "Column width", () => {
    const { table, cell } = selectedTable(), widths = tableColumnWidths(table);
    return form("Column width", [
      { name: "column", label: "Column", type: "number", min: "1", step: "1", value: String(cell.columnIndex + 1) },
      { name: "width", label: "Width (points)", type: "number", min: "0.05", value: String(widths[cell.columnIndex]) }
    ], values => {
      const index = Number(values.column) - 1, width = Number(values.width);
      if (!Number.isInteger(index) || index < 0 || index >= widths.length) throw new RangeError("Choose a column between 1 and " + widths.length + ".");
      if (!Number.isFinite(width) || width < 0.05) throw new RangeError("Enter a positive column width in points.");
      const next = [...widths]; next[index] = width;
      return result.execute({ kind: "properties", targetId: table.id, table: { columnWidths: next, layout: "fixed", width: { points: next.reduce((sum, width) => sum + width, 0) } } });
    });
  });
  button("table:cellSize", "Cell size settings", () => {
    const { table, cell, row, rows, range } = selectedTable(), widths = tableColumnWidths(table), height = row.properties.authored.height;
    const start = range?.columnIndex ?? cell.columnIndex, count = range?.columnCount ?? cell.columnSpan;
    return form("Cell size", [
      { name: "width", label: "Each selected column width (points)", type: "number", min: "0.05", value: String(Math.round(widths[start]! * 100) / 100) },
      { name: "rule", label: "Row height rule", value: height?.rule ?? "auto", choices: [{ value: "auto", label: "Automatic" }, { value: "atLeast", label: "At least" }, { value: "exact", label: "Exactly" }] },
      { name: "height", label: "Row height (points)", type: "number", min: "0", value: height ? String(height.points) : "" }
    ], values => {
      const width = Number(values.width), points = Number(values.height);
      if (!Number.isFinite(width) || width < 0.05) throw new RangeError("Enter a positive column width in points.");
      if (values.rule !== "auto" && (values.height === "" || !Number.isFinite(points) || points < 0)) throw new RangeError("Enter a nonnegative row height in points.");
      const next = widths.map((value, index) => index >= start && index < start + count ? width : value);
      return result.execute({ kind: "batch", commands: [
        { kind: "properties", targetId: table.id, table: { columnWidths: next, layout: "fixed", width: { points: next.reduce((sum, value) => sum + value, 0) } } },
        ...rows.map(row => ({ kind: "properties" as const, targetId: row.id, row: { height: values.rule === "auto" ? null : { points, rule: values.rule as "atLeast" | "exact" } } }))
      ] });
    });
  });
  button("table:distributeColumns", "Distribute columns", () => {
    const { table, range } = selectedTable(), widths = tableColumnWidths(table), start = range?.columnIndex ?? 0, count = range?.columnCount ?? widths.length;
    const total = widths.reduce((sum, width) => sum + width, 0), selectedWidth = widths.slice(start, start + count).reduce((sum, width) => sum + width, 0);
    return result.execute({ kind: "properties", targetId: table.id, table: { columnWidths: widths.map((width, index) => index >= start && index < start + count ? selectedWidth / count : width), layout: "fixed", width: { points: total } } });
  });
  button("table:distributeRows", "Distribute rows", () => {
    const { document, table, range, rows: selectionRows } = selectedTable(), rows = range ? selectionRows : table.rows;
    const points = rows.reduce((sum, row) => { const heights = document.geometry.fragments(row).map(fragment => fragment.bounds.height / 20); return sum + (row.properties.authored.header ? Math.max(0, ...heights) : heights.reduce((total, height) => total + height, 0)); }, 0) / rows.length;
    return result.execute({ kind: "batch", commands: rows.map(row => ({ kind: "properties", targetId: row.id, row: { height: { points, rule: "exact" } } })) });
  });
  select("table:autoFit", "AutoFit", [{ value: "", label: "AutoFit" }, { value: "contents", label: "AutoFit contents" }, { value: "window", label: "AutoFit window" }, { value: "fixed", label: "Fixed column width" }], async value => {
    if (!value) return;
    const { document, table } = selectedTable(), before = document.snapshot();
    try {
      const widths = value === "contents" ? (await document.measureTable(table)).columnWidths : tableColumnWidths(table);
      await result.execute({ kind: "properties", targetId: table.id, table: value === "window" ? { layout: "autofit", width: { percent: 100 } } : { layout: value === "contents" ? "autofit" : "fixed", columnWidths: widths, width: { points: widths.reduce((sum, width) => sum + width, 0) } } }, undefined, { ifUnchangedSince: before, mode: "edit" });
    } finally { controls.get("table:autoFit")!.value = ""; }
  });
  button("table:repeatHeader", "Repeat header rows", () => {
    const { table, row } = selectedTable(), index = table.rows.indexOf(row), header = !row.properties.authored.header;
    const rows = header ? table.rows.slice(0, index + 1) : table.rows.slice(index);
    return result.execute({ kind: "batch", commands: rows.map(row => ({ kind: "properties", targetId: row.id, row: { header } })) });
  });
  button("table:rowHeight", "Row height", () => {
    const { row, rows } = selectedTable(), height = row.properties.authored.height;
    return form("Row height", [
      { name: "rule", label: "Height rule", value: height?.rule ?? "auto", choices: [{ value: "auto", label: "Automatic" }, { value: "atLeast", label: "At least" }, { value: "exact", label: "Exactly" }] },
      { name: "height", label: "Height (points)", type: "number", min: "0", value: height ? String(height.points) : "" }
    ], values => {
      if (values.rule !== "auto" && (values.height === "" || !Number.isFinite(Number(values.height)) || Number(values.height) < 0)) throw new RangeError("Enter a nonnegative row height in points.");
      return result.execute({ kind: "batch", commands: rows.map(row => ({ kind: "properties", targetId: row.id, row: { height: values.rule === "auto" ? null : { points: Number(values.height), rule: values.rule as "atLeast" | "exact" } } })) });
    });
  });
  button("table:rowSplit", "Allow row to split across pages", () => {
    const { row, rows } = selectedTable();
    return result.execute({ kind: "batch", commands: rows.map(value => ({ kind: "properties", targetId: value.id, row: { cantSplit: !row.properties.authored.cantSplit } })) });
  });
  for (const vertical of ["top", "center", "bottom"] as const) for (const horizontal of ["left", "center", "right"] as const) button(`table:align:${vertical}:${horizontal}`, `Align ${vertical === "center" ? "middle" : vertical} ${horizontal}`, () => {
    const { document, cells } = selectedTable();
    return result.execute({ kind: "batch", commands: cells.flatMap(cell => [{ kind: "properties" as const, targetId: cell.id, cell: { verticalAlignment: vertical } }, ...document.content.within(cell).paragraphs().map(paragraph => ({ kind: "properties" as const, selection: paragraph.selection, paragraph: { alignment: horizontal } }))]) });
  });
  button("table:textDirection", "Text direction", () => {
    const { cell, cells } = selectedTable();
    return form("Text direction", [{ name: "direction", label: "Cell text orientation", value: cell.properties.authored.textDirection ?? "lrTb", choices: [{ value: "lrTb", label: "Horizontal" }, { value: "tbRl", label: "Rotate 90° clockwise" }, { value: "btLr", label: "Rotate 90° counterclockwise" }] }], values => result.execute({ kind: "batch", commands: cells.map(cell => ({ kind: "properties", targetId: cell.id, cell: { textDirection: values.direction as "lrTb" | "tbRl" | "btLr" } })) }));
  });
  button("table:cellMargins", "Cell margins", () => {
    const { table, cell, cells } = selectedTable(), margins = cell.properties.authored.margins;
    return form("Cell margins", [
      { name: "scope", label: "Apply to", value: "cell", choices: [{ value: "cell", label: cells.length > 1 ? "Selected cells" : "Current cell" }, { value: "table", label: "Table default" }] },
      ...(["top", "start", "bottom", "end"] as const).map(name => ({ name, label: ({ top: "Top", start: "Leading", bottom: "Bottom", end: "Trailing" })[name] + " (points; blank inherits)", type: "number", min: "0", value: margins?.[name] == null ? "" : String(margins[name]) }))
    ], values => {
      const margins = Object.fromEntries((["top", "start", "bottom", "end"] as const).map(name => [name, values[name] === "" ? null : Number(values[name])]));
      return result.execute(values.scope === "table" ? { kind: "properties", targetId: table.id, table: { cellMargins: margins } } : { kind: "batch", commands: cells.map(cell => ({ kind: "properties", targetId: cell.id, cell: { margins } })) });
    });
  });
  button("table:properties", "Table properties", () => {
    const { table } = selectedTable(), properties = table.properties.authored, width = properties.width;
    return form("Table properties", [
      { name: "alignment", label: "Alignment", value: properties.alignment ?? "start", choices: [{ value: "start", label: "Leading edge" }, { value: "center", label: "Center" }, { value: "end", label: "Trailing edge" }] },
      { name: "direction", label: "Table direction", value: properties.rightToLeft ? "rtl" : "ltr", choices: [{ value: "ltr", label: "Left to right" }, { value: "rtl", label: "Right to left" }] },
      { name: "indent", label: "Indent from leading edge (points)", type: "number", value: String(properties.indentation ?? 0) },
      { name: "unit", label: "Preferred width", value: width && width !== "auto" ? "points" in width ? "points" : "percent" : "auto", choices: [{ value: "auto", label: "Automatic" }, { value: "points", label: "Points" }, { value: "percent", label: "Percent of available width" }] },
      { name: "width", label: "Width", type: "number", min: "0.05", value: width && width !== "auto" ? String("points" in width ? width.points : width.percent) : "100" }
    ], values => result.execute({ kind: "properties", targetId: table.id, table: { rightToLeft: values.direction === "rtl", alignment: values.alignment as "start" | "center" | "end", indentation: Number(values.indent), width: values.unit === "auto" ? "auto" : values.unit === "points" ? { points: Number(values.width) } : { percent: Number(values.width) } } }));
  });
  function applyTableStyle(id: string): Promise<unknown> {
    const { table } = selectedTable();
    const look = table.properties.authored.look ?? { firstRow: id !== "OnoPlain", lastRow: false, firstColumn: false, lastColumn: false, bandedRows: id !== "OnoPlain", bandedColumns: false };
    return result.execute({ kind: "properties", targetId: table.id, table: { styleId: id || null, look, borders: null, shading: null } });
  }
  for (const style of standardTableStyles) button("table:style:" + style.id, "Apply " + style.name + " table style", () => applyTableStyle(style.id));
  select("table:style", "Table style", [], applyTableStyle);
  for (const [key, label] of tableStyleOptions) button("table:look:" + key, label, () => {
    const { table } = selectedTable();
    return result.execute({ kind: "properties", targetId: table.id, table: { look: { [key]: !(table.properties.authored.look?.[key] ?? key.startsWith("banded")) } } });
  });
  let borderStyle = "single", borderWidth = 0.5, borderColor = "#000000";
  select("table:borderStyle", "Border style", [{ value: "single", label: "Solid" }, { value: "double", label: "Double" }, { value: "dotted", label: "Dotted" }, { value: "dashed", label: "Dashed" }], async value => { borderStyle = value; });
  select("table:borderWidth", "Border weight", [0.25, 0.5, 0.75, 1, 1.5, 2.25, 3, 4.5, 6].map(value => ({ value: String(value), label: value + " pt" })), async value => { borderWidth = Number(value); });
  controls.get("table:borderWidth")!.value = String(borderWidth);
  field("table:borderColor", "Pen color", "color", borderColor, async value => { borderColor = value; });
  for (const [name, label, tool] of [["table:borderPainter", "Border Painter", "paint"], ["table:eraser", "Eraser", "erase"]] as const) button(name, label, async () => {
    selectedTable(); paintingBorders = paintingBorders === tool ? false : tool; painter = undefined;
    outlineSelection(); updateToolbar(); setMobileTools(false);
    report(paintingBorders === "erase" ? "Choose an internal edge to merge cells, or an outside edge to remove its border. Tab moves between edges; Escape finishes." : paintingBorders ? "Choose a table edge to paint. Tab moves between edges; Escape finishes." : "Table edge tool off.");
    if (paintingBorders) root.querySelector<HTMLButtonElement>(".border-painter-edge")?.focus({ preventScroll: true });
  });
  button("table:borders", "Borders", () => {
    const { table, cells } = selectedTable();
    return form("Borders", [
      { name: "scope", label: "Apply to", value: "table", choices: [{ value: "table", label: "Table" }, { value: "cell", label: cells.length > 1 ? "Selected cells" : "Current cell" }] },
      { name: "preset", label: "Setting", value: "all", choices: [{ value: "all", label: "All borders" }, { value: "outside", label: "Outside borders" }, { value: "inside", label: "Inside borders" }, { value: "top", label: "Top border" }, { value: "bottom", label: "Bottom border" }, { value: "start", label: "Leading border" }, { value: "end", label: "Trailing border" }, { value: "none", label: "No borders" }, { value: "inherit", label: "Use style borders" }] }
    ], values => {
      const sides = ["top", "start", "bottom", "end", "insideH", "insideV"] as const;
      const borders = values.preset === "inherit" ? null : Object.fromEntries(sides.filter(side => values.preset === "all" || values.preset === "none" || values.preset === "outside" && !side.startsWith("inside") || values.preset === "inside" && side.startsWith("inside") || values.preset === side).map(side => [side, { style: values.preset === "none" ? "nil" : borderStyle, width: borderWidth, color: borderColor }]));
      return result.execute(values.scope === "table" ? { kind: "properties", targetId: table.id, table: { borders } } : { kind: "batch", commands: cells.map(cell => ({ kind: "properties", targetId: cell.id, cell: { borders } })) });
    });
  });
  button("table:shading", "Shading", () => {
    const { table, cell, cells } = selectedTable(), shading = cell.properties.authored.shading;
    return form("Shading", [
      { name: "scope", label: "Apply to", value: "cell", choices: [{ value: "cell", label: cells.length > 1 ? "Selected cells" : "Current cell" }, { value: "table", label: "Table" }] },
      { name: "fill", label: "Fill", value: "color", choices: [{ value: "color", label: "Color" }, { value: "auto", label: "No color" }, { value: "inherit", label: "Use style shading" }] },
      { name: "color", label: "Color", type: "color", value: shading && shading !== "auto" ? shading : "#d9eaf7" }
    ], values => { const shading = values.fill === "inherit" ? null : values.fill === "auto" ? "auto" : values.color!; return result.execute(values.scope === "table" ? { kind: "properties", targetId: table.id, table: { shading } } : { kind: "batch", commands: cells.map(cell => ({ kind: "properties", targetId: cell.id, cell: { shading } })) }); });
  });
  for (const prefix of ["arrange", "shape", "picture"]) button(`${prefix}:group`, "Group", async () => {
    const doc = requireDocument(), ids = selectionPane?.selectedIds ?? [];
    const objects = ids.map(id => { const element = doc.content.get(id)!, fragment = doc.geometry.fragments(element)[0]; if (!fragment) throw new Error("Choose objects with visible positions."); return { id, x: fragment.rectangle.x / 20, y: fragment.rectangle.y / 20, page: fragment.pageIndex }; });
    if (objects.some(object => object.page !== objects[0]?.page)) throw new Error("Group objects on the same page.");
    await result.execute({ kind: "group", objects: objects.map(({ id, x, y }) => ({ id, x, y })) });
    selectRibbon("Shape Format");
  });
  for (const prefix of ["arrange", "shape"]) button(`${prefix}:ungroup`, "Ungroup", async () => {
    const object = selectedVisual(); if (object?.element.kind !== "drawing" || !object.element.group) return;
    const fragment = requireDocument().geometry.fragments(object.element)[0]; if (!fragment) return;
    await result.execute({ kind: "ungroup", drawingId: object.id, x: fragment.rectangle.x / 20, y: fragment.rectangle.y / 20 });
  });
  button("arrange:size", "Group size", () => {
    const object = selectedVisual(); if (object?.element.kind !== "drawing" || !object.element.group) return Promise.resolve();
    return form("Group size", [{ name: "width", label: "Width (pt)", type: "number", min: "0.05", value: String(object.width) }, { name: "height", label: "Height (pt)", type: "number", min: "0.05", value: String(object.height) }, { name: "description", label: "Alternative text", value: object.element.description }], values => result.execute({ kind: "groupProperties", drawingId: object.id, width: Number(values.width), height: Number(values.height), description: values.description ?? "" }));
  });
  function selectedVisual() {
    const element = requireDocument().content.get(selectedImage ?? selectedDrawing ?? "");
    if (element?.kind === "image") return { ...element, element, target: { kind: "imageProperties" as const, imageId: element.id } };
    if (element?.kind === "drawing" && element.group) return { ...element.group, id: element.id, element, placement: element.group.layout.wrap === "inline" ? "inline" : "floating", target: { kind: "groupProperties" as const, drawingId: element.id } };
    if (element?.kind === "drawing" && element.shape) return { ...element.shape, id: element.id, element, placement: element.shape.layout.wrap === "inline" ? "inline" : "floating", target: { kind: "shapeProperties" as const, drawingId: element.id } };
    return undefined;
  }
  for (const prefix of ["picture", "arrange", "shape"]) {
    for (const [name, label, order] of [["forward", "Bring Forward", "forward"], ["backward", "Send Backward", "backward"], ["front", "Bring to Front", "front"], ["back", "Send to Back", "back"]] as const) button(`${prefix}:${name}`, label, async () => {
      const image = selectedVisual(); if (image) await result.execute({ ...image.target, layout: { order } });
    });
    button(`${prefix}:position`, "Position", async () => {
      const image = selectedVisual(); if (!image) return;
      const fragment = requireDocument().geometry.fragments(image.element)[0], horizontal = image.layout.horizontal ?? { relativeTo: "page", offset: (fragment?.rectangle.x ?? 0) / 20 }, vertical = image.layout.vertical ?? { relativeTo: "page", offset: (fragment?.rectangle.y ?? 0) / 20 };
      return form(image.element.kind === "image" ? "Picture position" : "Shape position", [
        { name: "horizontal", label: "Horizontal position", value: horizontal.alignment ?? "offset", choices: ["offset", "left", "center", "right", "inside", "outside"].map(value => ({ value, label: value === "offset" ? "Absolute position" : value[0]!.toUpperCase() + value.slice(1) })) },
        { name: "horizontalRelative", label: "Horizontal relative to", value: horizontal.relativeTo, choices: ["page", "margin", "column", "character", "leftMargin", "rightMargin", "insideMargin", "outsideMargin"].map(value => ({ value, label: value[0]!.toUpperCase() + value.slice(1).replace(/([A-Z])/g, " $1").toLowerCase() })) },
        { name: "x", label: "Horizontal offset (pt)", type: "number", value: String(horizontal.offset ?? 0) },
        { name: "vertical", label: "Vertical position", value: vertical.alignment ?? "offset", choices: ["offset", "top", "center", "bottom", "inside", "outside"].map(value => ({ value, label: value === "offset" ? "Absolute position" : value[0]!.toUpperCase() + value.slice(1) })) },
        { name: "verticalRelative", label: "Vertical relative to", value: vertical.relativeTo, choices: ["page", "margin", "paragraph", "line", "topMargin", "bottomMargin"].map(value => ({ value, label: value[0]!.toUpperCase() + value.slice(1).replace(/([A-Z])/g, " $1").toLowerCase() })) },
        { name: "y", label: "Vertical offset (pt)", type: "number", value: String(vertical.offset ?? 0) }
      ], values => result.execute({ ...image.target, layout: { ...(image.placement === "inline" ? { wrap: "square" as const } : {}), horizontal: { relativeTo: values.horizontalRelative, ...(values.horizontal === "offset" ? { offset: Number(values.x) } : { alignment: values.horizontal }) }, vertical: { relativeTo: values.verticalRelative, ...(values.vertical === "offset" ? { offset: Number(values.y) } : { alignment: values.vertical }) } } } as EditorCommand), undefined, form => {
        const presets = document.createElement("div"); presets.className = "picture-position-grid"; presets.setAttribute("role", "group"); presets.setAttribute("aria-label", "Page position presets");
        for (const vertical of ["top", "center", "bottom"]) for (const horizontal of ["left", "center", "right"]) {
          const preset = document.createElement("button"); preset.type = "button"; preset.title = preset.ariaLabel = `${vertical} ${horizontal}`;
          const x = horizontal === "left" ? 3 : horizontal === "center" ? 9 : 15, y = vertical === "top" ? 3 : vertical === "center" ? 9 : 15;
          preset.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="1" fill="white" stroke="#8795a5"/><path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="#ccd3dc"/><rect x="${x}" y="${y}" width="6" height="6" fill="#2675b8"/></svg>`;
          preset.addEventListener("click", () => { for (const [key, value] of Object.entries({ horizontal, vertical, horizontalRelative: "margin", verticalRelative: "margin" })) (form.elements.namedItem(key) as HTMLSelectElement).value = value; refresh(); }); presets.append(preset);
        }
        form.className = "wide-form picture-position-form"; presets.style.gridColumn = "1/-1"; form.querySelector("h2")!.after(presets);
        for (const [title, names] of [["Horizontal", ["horizontal", "horizontalRelative", "x"]], ["Vertical", ["vertical", "verticalRelative", "y"]]] as const) {
          const group = document.createElement("fieldset"), legend = document.createElement("legend"); legend.textContent = title; group.append(legend);
          for (const name of names) group.append((form.elements.namedItem(name) as HTMLElement).closest("label")!);
          form.append(group);
        }
        function refresh() { (form.elements.namedItem("x") as HTMLInputElement).disabled = (form.elements.namedItem("horizontal") as HTMLSelectElement).value !== "offset"; (form.elements.namedItem("y") as HTMLInputElement).disabled = (form.elements.namedItem("vertical") as HTMLSelectElement).value !== "offset"; }
        form.addEventListener("change", refresh); refresh();
      });
    });
    button(`${prefix}:wrap`, "Wrap Text", async () => {
      const image = selectedVisual(); if (!image) return;
      return form("Wrap Text", [
        { name: "wrap", label: "Wrapping style", value: image.layout.wrap ?? "inline", choices: [{ value: "inline", label: "In line with text" }, { value: "square", label: "Square" }, { value: "tight", label: "Tight" }, { value: "through", label: "Through" }, { value: "topAndBottom", label: "Top and bottom" }, { value: "behindText", label: "Behind text" }, { value: "inFrontOfText", label: "In front of text" }] },
        { name: "side", label: "Wrap text on", value: image.layout.wrapSide ?? "bothSides", choices: [{ value: "bothSides", label: "Both sides" }, { value: "left", label: "Left only" }, { value: "right", label: "Right only" }, { value: "largest", label: "Largest side only" }] },
        ...(["top", "bottom", "left", "right"] as const).map(edge => ({ name: edge, label: `${edge[0]!.toUpperCase() + edge.slice(1)} distance (pt)`, type: "number", min: "0", value: String(image.layout.distances?.[edge] ?? 0) }))
      ], values => {
        const fragment = requireDocument().geometry.fragments(image.element)[0];
        return result.execute({ ...image.target, layout: { wrap: values.wrap, ...(image.placement === "inline" && values.wrap !== "inline" ? { horizontal: { relativeTo: "page", offset: (fragment?.rectangle.x ?? 0) / 20 }, vertical: { relativeTo: "page", offset: (fragment?.rectangle.y ?? 0) / 20 } } : {}), ...(["square", "tight", "through"].includes(values.wrap!) ? { wrapSide: values.side } : {}), distances: Object.fromEntries(["top", "bottom", "left", "right"].map(edge => [edge, Number(values[edge] ?? image.layout.distances?.[edge as "top" | "bottom" | "left" | "right"] ?? 0)])) } } as EditorCommand);
      }, undefined, form => {
        form.className = "wide-form"; const hint = document.createElement("small"); hint.style.gridColumn = "1/-1"; hint.textContent = "Tight and Through preserve an imported wrap contour; new contours follow the object rectangle."; form.querySelector("h2")!.after(hint);
        const refresh = () => { const value = (form.elements.namedItem("wrap") as HTMLSelectElement).value; (form.elements.namedItem("side") as HTMLSelectElement).disabled = !["square", "tight", "through"].includes(value); for (const edge of ["top", "bottom", "left", "right"]) (form.elements.namedItem(edge) as HTMLInputElement).disabled = ["inline", "behindText", "inFrontOfText"].includes(value); }; form.addEventListener("change", refresh); refresh();
      });
    });
  }
  for (const prefix of ["picture", "arrange", "shape"]) {
    button(`${prefix}:align`, "Align", () => {
      const image = selectedVisual(); if (!image) return Promise.resolve();
      const ids = selectionPane?.selectedIds ?? [];
      if (ids.length > 1) {
        const document = requireDocument(), before = document.snapshot();
        return form(`Align ${ids.length} objects`, [
          { name: "relative", label: "Align relative to", value: "selection", choices: [{ value: "selection", label: "Selected objects" }, { value: "margin", label: "Page margins" }, { value: "page", label: "Page edges" }] },
          { name: "horizontal", label: "Horizontal", value: "unchanged", choices: [{ value: "unchanged", label: "Keep current position" }, { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }, { value: "distribute", label: "Distribute horizontally" }] },
          { name: "vertical", label: "Vertical", value: "unchanged", choices: [{ value: "unchanged", label: "Keep current position" }, { value: "top", label: "Top" }, { value: "center", label: "Middle" }, { value: "bottom", label: "Bottom" }, { value: "distribute", label: "Distribute vertically" }] }
        ], values => values.horizontal === "unchanged" && values.vertical === "unchanged" ? Promise.resolve() : result.execute(arrangeObjects(document, ids, values.relative!, values.horizontal!, values.vertical!), undefined, { ifUnchangedSince: before, mode: "edit" }));
      }
      return form(image.element.kind === "image" ? "Align picture" : "Align shape", [
        { name: "relative", label: "Align relative to", value: "margin", choices: [{ value: "margin", label: "Page margins" }, { value: "page", label: "Page edges" }] },
        { name: "horizontal", label: "Horizontal", value: "unchanged", choices: [{ value: "unchanged", label: "Keep current position" }, { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] },
        { name: "vertical", label: "Vertical", value: "unchanged", choices: [{ value: "unchanged", label: "Keep current position" }, { value: "top", label: "Top" }, { value: "center", label: "Middle" }, { value: "bottom", label: "Bottom" }] }
      ], async values => {
        if (values.horizontal === "unchanged" && values.vertical === "unchanged") return;
        const fragment = requireDocument().geometry.fragments(image.element)[0];
        return result.execute({ ...image.target, layout: {
          ...(image.placement === "inline" ? { wrap: "square", horizontal: { relativeTo: "page", offset: (fragment?.rectangle.x ?? 0) / 20 }, vertical: { relativeTo: "page", offset: (fragment?.rectangle.y ?? 0) / 20 } } : {}),
          ...(values.horizontal !== "unchanged" ? { horizontal: { relativeTo: values.relative, alignment: values.horizontal } } : {}),
          ...(values.vertical !== "unchanged" ? { vertical: { relativeTo: values.relative, alignment: values.vertical } } : {})
        } } as EditorCommand);
      });
    });
    button(`${prefix}:rotate`, "Rotate", () => {
      const image = selectedVisual(); if (!image) return Promise.resolve();
      return form(image.element.kind === "image" ? "Rotate picture" : "Rotate shape", [
        { name: "rotation", label: "Rotation (degrees)", type: "number", value: String(image.rotation) },
        { name: "flipHorizontal", label: "Flip horizontal", type: "checkbox", value: String(image.flipHorizontal) },
        { name: "flipVertical", label: "Flip vertical", type: "checkbox", value: String(image.flipVertical) }
      ], values => result.execute({ ...image.target, rotation: Number(values.rotation), flipHorizontal: values.flipHorizontal === "true", flipVertical: values.flipVertical === "true" }), undefined, form => {
        const presets = document.createElement("div"); presets.className = "rotation-presets";
        for (const [name, label, delta] of [["rotateLeft", "Rotate left 90°", -90], ["rotateRight", "Rotate right 90°", 90]] as const) {
          const button = document.createElement("button"); button.type = "button"; button.ariaLabel = label;
          button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${editorIcons[`picture:${name}`]}</svg><span>${label}</span>`;
          button.addEventListener("click", () => { const field = form.elements.namedItem("rotation") as HTMLInputElement; field.value = String((field.valueAsNumber || 0) + delta); }); presets.append(button);
        }
        form.querySelector("h2")!.after(presets);
      });
    });
  }
  button("picture:crop", "Crop", () => {
    const image = selectedImage && requireDocument().content.get(selectedImage); if (!image || image.kind !== "image") return Promise.resolve();
    return form("Crop picture", (["left", "top", "right", "bottom"] as const).map(side => ({ name: side, label: `${side[0]!.toUpperCase() + side.slice(1)} (%)`, type: "number", value: String(image.crop[side]) })), values => result.execute({ kind: "imageProperties", imageId: image.id, crop: { left: Number(values.left), top: Number(values.top), right: Number(values.right), bottom: Number(values.bottom) } }), undefined, form => { const hint = document.createElement("small"); hint.textContent = "Percent of the original image removed from each edge. Negative values add space. Picture size stays unchanged."; form.querySelector("h2")!.after(hint); });
  });
  button("picture:resetCrop", "Reset crop", async () => { if (selectedImage) await result.execute({ kind: "imageProperties", imageId: selectedImage, crop: null }); });
  button("picture:replace", "Change picture", async () => {
    if (!selectedImage) return;
    const imageId = selectedImage, picker = document.createElement("input"); picker.type = "file"; picker.accept = "image/png,image/jpeg";
    picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) event(async () => { const bitmap = await createImageBitmap(file); bitmap.close(); await result.execute({ kind: "imageProperties", imageId, replacement: { bytes: new Uint8Array(await file.arrayBuffer()), mediaType: file.type as "image/png" | "image/jpeg" } }); }); }); picker.click();
  });
  button("picture:delete", "Delete picture", async () => { if (selectedImage) await result.execute({ kind: "imageProperties", imageId: selectedImage, remove: true }); });
  button("imageTools", "Image properties", async () => {
    const image = selectedImage && requireDocument().content.get(selectedImage); if (!image || image.kind !== "image") return;
    await form("Image properties", [
      { name: "width", label: "Width (points)", type: "number", min: "0.05", value: String(image.width) },
      { name: "height", label: "Height (points)", type: "number", min: "0.05", value: String(image.height) },
      { name: "lock", label: "Lock aspect ratio", type: "checkbox", value: "true" },
      { name: "rotation", label: "Rotation (degrees)", type: "number", value: String(image.rotation) },
      { name: "description", label: "Alternative text", value: image.description ?? "" }
    ], values => result.execute({ kind: "imageProperties", imageId: image.id, width: Number(values.width), height: Number(values.height), rotation: Number(values.rotation), description: values.description ?? "" }), () => result.execute({ kind: "imageProperties", imageId: image.id, remove: true }), form => {
      const width = form.elements.namedItem("width") as HTMLInputElement, height = form.elements.namedItem("height") as HTMLInputElement, lock = form.elements.namedItem("lock") as HTMLInputElement;
      let ratio = image.width / image.height;
      lock.addEventListener("change", () => { if (lock.checked && width.valueAsNumber > 0 && height.valueAsNumber > 0) ratio = width.valueAsNumber / height.valueAsNumber; });
      width.addEventListener("input", () => { if (lock.checked && width.valueAsNumber > 0) height.value = String(Math.round(width.valueAsNumber / ratio * 100) / 100); });
      height.addEventListener("input", () => { if (lock.checked && height.valueAsNumber > 0) width.value = String(Math.round(height.valueAsNumber * ratio * 100) / 100); });
    });
  });
  button("bookmark", "Bookmark", async () => showBookmarks(root, requireDocument, requireSelection(), mode === "edit", edit => result.execute(edit), range => result.select(range), focus));
  button("link", "Link", () => enqueue(() => {
    const range = requireSelection(), document = requireDocument(), paragraph = document.content.get(range.start.paragraphId);
    let offset = 0, target = "";
    if (paragraph) for (const run of document.content.within(paragraph).runs()) {
      target = run.link ? (run.link.kind === "bookmark" ? "#" : "") + run.link.target : ""; offset += run.text.length;
      if (offset > range.start.offset || collapsed(range) && offset === range.start.offset) break;
    }
    const bookmarks = document.content.bookmarks().all();
    return form("Link selected text", [{ name: "target", label: "URL or #bookmark (empty removes link)", value: target }, ...(bookmarks.length ? [{ name: "bookmark", label: "Or choose a bookmark", value: "", choices: [{ value: "", label: "Choose a bookmark" }, ...bookmarks.map(bookmark => ({ value: bookmark.name, label: bookmark.name }))] }] : [])], values => result.execute({ kind: "link", target: values.target || null }), undefined, form => {
      const picker = form.elements.namedItem("bookmark") as HTMLSelectElement | null;
      picker?.addEventListener("change", () => { if (picker.value) (form.elements.namedItem("target") as HTMLInputElement).value = "#" + picker.value; });
    });
  }));
  const chartGroupingField = { name: "grouping", label: "Chart grouping", value: "standard", choices: [{ value: "standard", label: "Clustered" }, { value: "stacked", label: "Stacked" }, { value: "percentStacked", label: "100% stacked" }] };
  for (const insert of [true, false]) button(insert ? "chart" : "chart:data", insert ? "Chart" : "Edit Data", () => {
    const document = requireDocument(), object = !insert && selectedDrawing ? document.content.get(selectedDrawing) : undefined;
    if (!insert && (object?.kind !== "drawing" || !object.chart)) return Promise.resolve();
    const current = object?.kind === "drawing" ? object.chart : undefined, snapshot = document.snapshot(), anchor = requireSelection().start.paragraphId;
    const data = JSON.stringify(current?.data ?? { categories: ["Category 1", "Category 2", "Category 3"], series: [{ name: "Series 1", values: [4, 7, 5] }] });
    return form(insert ? "Insert chart" : "Edit chart data", [
      ...(insert ? [{ name: "chartType", label: "Chart type", value: "column", choices: [{ value: "column", label: "Column" }, { value: "bar", label: "Bar" }, { value: "line", label: "Line" }, { value: "pie", label: "Pie" }, { value: "doughnut", label: "Doughnut" }] }] : []),
      ...(insert ? [chartGroupingField] : []),
      { name: "data", label: "Data", type: "hidden", value: data },
      ...(insert ? [{ name: "title", label: "Chart title", value: "" }, { name: "legend", label: "Show legend", type: "checkbox", value: "true" }] : [])
    ], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen the chart dialog.");
      const parsed = JSON.parse(values.data!) as import("@onodocs/sdk").ChartData;
      const change = await result.execute(insert ? { kind: "chart", after: anchor, chartType: values.chartType as import("@onodocs/sdk").ChartType, ...(values.grouping === undefined ? {} : { grouping: values.grouping as NonNullable<import("@onodocs/sdk").ChartProperties["grouping"]> }), data: parsed, title: values.title ?? "", legend: values.legend === "true", width: 360, height: 216 } : { kind: "chartProperties", drawingId: object!.id, ...(values.data === data ? {} : { data: parsed }) });
      const chart = change && "drawings" in change ? change.drawings.find(value => value.chart) : undefined;
      if (insert && chart) { selectedDrawing = chart.id; const paragraph = requireDocument().content.get(chart.paragraphId); if (paragraph?.kind === "paragraph") selection = { start: paragraph.selection.start, end: paragraph.selection.start }; focus(); outlineSelection(); updateToolbar(); }
    }, undefined, configureChartForm);
  });
  button("chart:type", "Change Chart Type", () => {
    const document = requireDocument(), object = selectedDrawing && document.content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.chart?.dataEditable) return Promise.resolve();
    const chart = object.chart, snapshot = document.snapshot();
    return form("Change chart type", [{ name: "chartType", label: "Chart type", value: chart.type, choices: [{ value: "column", label: "Column" }, { value: "bar", label: "Bar" }, { value: "line", label: "Line" }, { value: "pie", label: "Pie" }, { value: "doughnut", label: "Doughnut" }] }, { ...chartGroupingField, value: chart.grouping ?? "standard" }], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen the chart dialog.");
      if (values.chartType !== chart.type || values.grouping !== undefined && values.grouping !== chart.grouping) await result.execute({ kind: "chartProperties", drawingId: object.id, chartType: values.chartType as import("@onodocs/sdk").ChartType, ...(values.grouping === undefined ? {} : { grouping: values.grouping as NonNullable<import("@onodocs/sdk").ChartProperties["grouping"]> }) });
    }, undefined, dialog => { configureChartForm(dialog); const help = dialog.ownerDocument.createElement("p"); help.className = "chart-help"; help.textContent = "Type changes keep data, workbooks and compatible colors and labels. Pie and doughnut charts require one series and have no axes. Switching back creates automatic axes."; dialog.append(help); });
  });
  button("chart:series", "Format Series", () => {
    const document = requireDocument(), object = selectedDrawing && document.content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.chart?.dataEditable) return Promise.resolve();
    const chart = object.chart, snapshot = document.snapshot(), circular = chart.type === "pie" || chart.type === "doughnut", first = chart.seriesFormatting[0];
    return form("Format chart series", [
      { name: "seriesFormatting", label: "Pending series formatting", type: "hidden", value: "[]" },
      { name: "target", label: circular ? "Slice" : "Series", value: "0", choices: chart.seriesFormatting.map((format, index) => ({ value: String(index), label: circular ? chart.data.categories[format.pointIndex!] || `Slice ${index + 1}` : chart.data.series[format.seriesIndex]!.name || `Series ${index + 1}` })) },
      { name: "colorMode", label: chart.type === "line" ? "Line color" : "Fill", value: "keep", choices: [{ value: "keep", label: "Keep existing formatting" }, { value: "solid", label: "Solid color" }, { value: "none", label: chart.type === "line" ? "No line" : "No fill" }, { value: "automatic", label: "Automatic color" }] },
      { name: "color", label: "Color", type: "color", value: first?.color?.startsWith("#") ? first.color.slice(0, 7) : "#4472c4" },
      ...(chart.type === "line" ? [] : [{ name: "outlineMode", label: "Outline", value: "keep", choices: [{ value: "keep", label: "Keep existing formatting" }, { value: "solid", label: "Solid color" }, { value: "none", label: "No outline" }, { value: "automatic", label: "Automatic outline" }] }, { name: "outlineColor", label: "Outline color", type: "color", value: first?.lineColor?.startsWith("#") ? first.lineColor.slice(0, 7) : "#4472c4" }]),
      { name: "lineWidth", label: "Line width (pt, blank for automatic)", type: "number", min: "0", max: "1584", step: "any", value: first?.lineWidth === undefined ? "" : String(first.lineWidth) },
      ...(chart.gapWidth === undefined ? [] : [{ name: "gapWidth", label: "Gap width (%)", type: "number", min: "0", max: "500", value: String(chart.gapWidth) }, { name: "overlap", label: "Series overlap (%)", type: "number", min: "-100", max: "100", value: String(chart.overlap) }]),
      ...(chart.firstSliceAngle === undefined ? [] : [{ name: "firstSliceAngle", label: "First slice angle (°)", type: "number", min: "0", max: "360", value: String(chart.firstSliceAngle) }]),
      ...(chart.holeSize === undefined ? [] : [{ name: "holeSize", label: "Doughnut hole size (%)", type: "number", min: "10", max: "90", value: String(chart.holeSize) }])
    ], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen series formatting.");
      const target = chart.seriesFormatting[Number(values.target)]!, { colorMode, color, outlineMode, outlineColor, lineWidth, target: targetValue, seriesFormatting: stored, ...settings } = values;
      const appearance = { seriesIndex: target.seriesIndex, ...(target.pointIndex === undefined ? {} : { pointIndex: target.pointIndex }), ...(colorMode === "keep" ? {} : { color: colorMode === "automatic" ? null : colorMode === "none" ? "none" : color }), ...(outlineMode === undefined || outlineMode === "keep" ? {} : { lineColor: outlineMode === "automatic" ? null : outlineMode === "none" ? "none" : outlineColor }), ...(lineWidth === undefined || lineWidth === (target.lineWidth === undefined ? "" : String(target.lineWidth)) ? {} : { lineWidth: lineWidth === "" ? null : Number(lineWidth) }) };
      const properties = Object.fromEntries(Object.entries(settings).filter(([key, value]) => String(chart[key as "gapWidth" | "overlap" | "firstSliceAngle" | "holeSize"]) !== value).map(([key, value]) => [key, Number(value)]));
      const formats = (JSON.parse(stored!) as NonNullable<import("@onodocs/sdk").ChartProperties["seriesFormatting"]>).filter(format => format.seriesIndex !== appearance.seriesIndex || format.pointIndex !== appearance.pointIndex);
      if (appearance.color !== undefined || appearance.lineColor !== undefined || appearance.lineWidth !== undefined) formats.push(appearance);
      if (Object.keys(properties).length || formats.length) await result.execute({ kind: "chartProperties", drawingId: object.id, ...properties, seriesFormatting: formats });
    }, undefined, dialog => {
      dialog.classList.add("wide-form");
      const target = dialog.elements.namedItem("target") as HTMLSelectElement, mode = dialog.elements.namedItem("colorMode") as HTMLSelectElement, color = dialog.elements.namedItem("color") as HTMLInputElement, width = dialog.elements.namedItem("lineWidth") as HTMLInputElement | null;
      const outlineMode = dialog.elements.namedItem("outlineMode") as HTMLSelectElement | null, outlineColor = dialog.elements.namedItem("outlineColor") as HTMLInputElement | null;
      const stored = dialog.elements.namedItem("seriesFormatting") as HTMLInputElement, pending = new Map<string, { mode: string; color: string; width: string; outlineMode: string; outlineColor: string }>(); stored.closest("label")!.hidden = true;
      color.style.cssText = "width:100%;height:36px;padding:4px;border:1px solid #dce1e6;border-radius:4px";
      target.closest("label")!.style.gridColumn = "1/-1";
      if (width) width.closest("label")!.style.gridColumn = "1/-1";
      if (outlineColor) outlineColor.style.cssText = color.style.cssText;
      const remember = () => {
        pending.set(target.value, { mode: mode.value, color: color.value, width: width?.value ?? "", outlineMode: outlineMode?.value ?? "keep", outlineColor: outlineColor?.value ?? "#4472c4" });
        stored.value = JSON.stringify([...pending].map(([index, draft]) => {
          const selected = chart.seriesFormatting[Number(index)]!;
          return { seriesIndex: selected.seriesIndex, ...(selected.pointIndex === undefined ? {} : { pointIndex: selected.pointIndex }), ...(draft.mode === "keep" ? {} : { color: draft.mode === "automatic" ? null : draft.mode === "none" ? "none" : draft.color }), ...(draft.outlineMode === "keep" ? {} : { lineColor: draft.outlineMode === "automatic" ? null : draft.outlineMode === "none" ? "none" : draft.outlineColor }), ...(!width || draft.width === (selected.lineWidth === undefined ? "" : String(selected.lineWidth)) ? {} : { lineWidth: draft.width === "" ? null : Number(draft.width) }) };
        }).filter(format => format.color !== undefined || format.lineColor !== undefined || format.lineWidth !== undefined));
      };
      target.addEventListener("change", () => { const selected = chart.seriesFormatting[Number(target.value)]!, draft = pending.get(target.value); color.value = draft?.color ?? (selected.color?.startsWith("#") ? selected.color.slice(0, 7) : "#4472c4"); mode.value = draft?.mode ?? "keep"; if (outlineMode) outlineMode.value = draft?.outlineMode ?? "keep"; if (outlineColor) outlineColor.value = draft?.outlineColor ?? (selected.lineColor?.startsWith("#") ? selected.lineColor.slice(0, 7) : "#4472c4"); if (width) width.value = draft?.width ?? (selected.lineWidth === undefined ? "" : String(selected.lineWidth)); });
      color.addEventListener("input", () => { mode.value = "solid"; remember(); }); mode.addEventListener("change", remember); width?.addEventListener("input", remember);
      outlineColor?.addEventListener("input", () => { outlineMode!.value = "solid"; remember(); }); outlineMode?.addEventListener("change", remember);
      if (chart.holeSize !== undefined) { const note = dialog.ownerDocument.createElement("p"); note.style.gridColumn = "1/-1"; note.textContent = "Hole size is saved for Word. The editor and PDF use LibreOffice’s 50% hole size."; dialog.append(note); }
    });
  });
  button("chart:labels", "Data Labels", () => {
    const document = requireDocument(), object = selectedDrawing && document.content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.chart?.dataEditable) return Promise.resolve();
    const chart = object.chart, labels = chart.dataLabels, snapshot = document.snapshot(), circular = chart.type === "pie" || chart.type === "doughnut";
    const positions = chart.type === "line" ? [{ value: "t", label: "Above" }, { value: "b", label: "Below" }, { value: "l", label: "Left" }, { value: "r", label: "Right" }] : [{ value: "inEnd", label: "Inside end" }, { value: "outEnd", label: "Outside end" }, ...(circular ? [{ value: "bestFit", label: "Best fit" }] : [{ value: "inBase", label: "Inside base" }])];
    const toggles: readonly (readonly [keyof typeof labels, string])[] = [["visible", "Show data labels"], ["showValue", "Value"], ["showCategory", "Category name"], ["showSeries", "Series name"], ...(circular ? [["showPercent", "Percentage"] as const] : [])];
    return form("Data labels", [{ name: "changed", label: "Changed settings", type: "hidden", value: "[]" }, ...toggles.map(([name, label]) => ({ name, label, type: "checkbox", value: String(labels[name] ?? false) })), { name: "position", label: "Label position", value: labels.position === undefined ? "mixed" : labels.position ?? "", choices: [...(labels.position === undefined ? [{ value: "mixed", label: "Keep mixed positions" }] : []), { value: "", label: "Automatic" }, { value: "ctr", label: "Center" }, ...positions] }, { name: "numberFormat", label: "Number format (blank for automatic)", value: labels.numberFormat ?? "" }], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen data labels.");
      const keys = (JSON.parse(values.changed!) as string[]).filter(key => key !== "position" || values.position !== "mixed");
      if (keys.length) await result.execute({ kind: "chartProperties", drawingId: object.id, dataLabels: Object.fromEntries(keys.map(key => [key, key === "position" || key === "numberFormat" ? values[key] || null : values[key] === "true"])) });
    }, undefined, dialog => {
      const changed = dialog.elements.namedItem("changed") as HTMLInputElement, keys = new Set<string>(); changed.closest("label")!.hidden = true;
      for (const [name] of toggles) { const input = dialog.elements.namedItem(name) as HTMLInputElement; input.indeterminate = labels[name] === undefined; }
      for (const input of dialog.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input:not([type=hidden]),select")) input.addEventListener("change", () => { keys.add(input.name); changed.value = JSON.stringify([...keys]); });
      const numberFormat = dialog.elements.namedItem("numberFormat") as HTMLInputElement, row = dialog.ownerDocument.createElement("div"), automatic = dialog.ownerDocument.createElement("button");
      numberFormat.placeholder = labels.numberFormat === undefined ? "Mixed formats" : "Automatic"; row.style.cssText = "display:flex;gap:6px;align-items:center"; numberFormat.style.cssText = "flex:1;min-width:0";
      automatic.type = "button"; automatic.setAttribute("aria-label", "Use automatic number format"); automatic.style.cssText = "display:inline-flex;align-items:center;gap:4px;white-space:nowrap"; automatic.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${editorIcons.undo}</svg>Automatic`;
      numberFormat.parentElement!.append(row); row.append(numberFormat, automatic); automatic.addEventListener("click", () => { numberFormat.value = ""; numberFormat.placeholder = "Automatic"; numberFormat.dispatchEvent(new Event("change", { bubbles: true })); });
      const help = dialog.ownerDocument.createElement("p"); help.style.gridColumn = "1/-1"; help.textContent = "Choose the content and position for all data labels. Mixed settings stay unchanged until edited. Number formats include 0.0, #,##0 and 0%."; dialog.append(help);
    });
  });
  button("chart:axes", "Format Axes", () => {
    const document = requireDocument(), object = selectedDrawing && document.content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.chart?.axes) return Promise.resolve();
    const axes = object.chart.axes, snapshot = document.snapshot();
    return form("Format chart axes", [
      { name: "categoryAxisTitle", label: "Category axis title", value: axes.categoryTitle },
      { name: "valueAxisTitle", label: "Value axis title", value: axes.valueTitle },
      { name: "categoryAxisVisible", label: "Show category axis", type: "checkbox", value: String(axes.categoryVisible) },
      { name: "valueAxisVisible", label: "Show value axis", type: "checkbox", value: String(axes.valueVisible) },
      ...(axes.boundsEditable ? [{ name: "valueMinimum", label: "Minimum (blank for automatic)", type: "number", step: "any", value: axes.minimum === undefined ? "" : String(axes.minimum) }, { name: "valueMaximum", label: "Maximum (blank for automatic)", type: "number", step: "any", value: axes.maximum === undefined ? "" : String(axes.maximum) }] : []),
      { name: "valueMajorUnit", label: "Major interval (blank for automatic)", type: "number", step: "any", min: "0", value: axes.majorUnit === undefined ? "" : String(axes.majorUnit) },
      { name: "valueNumberFormat", label: "Value number format", value: axes.numberFormat },
      { name: "majorGridlines", label: "Show major gridlines", type: "checkbox", value: String(axes.majorGridlines) }
    ], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen axis formatting.");
      const original: Record<string, string> = { categoryAxisTitle: axes.categoryTitle, valueAxisTitle: axes.valueTitle, categoryAxisVisible: String(axes.categoryVisible), valueAxisVisible: String(axes.valueVisible), majorGridlines: String(axes.majorGridlines), valueNumberFormat: axes.numberFormat, valueMinimum: axes.minimum === undefined ? "" : String(axes.minimum), valueMaximum: axes.maximum === undefined ? "" : String(axes.maximum), valueMajorUnit: axes.majorUnit === undefined ? "" : String(axes.majorUnit) };
      const properties = Object.fromEntries(Object.entries({ ...values, categoryAxisVisible: String(values.categoryAxisVisible === "true"), valueAxisVisible: String(values.valueAxisVisible === "true"), majorGridlines: String(values.majorGridlines === "true") }).filter(([key, value]) => value !== original[key]).map(([key, value]) => [key, key === "valueMinimum" || key === "valueMaximum" || key === "valueMajorUnit" ? value === "" ? null : Number(value) : ["categoryAxisVisible", "valueAxisVisible", "majorGridlines"].includes(key) ? value === "true" : value]));
      if (Object.keys(properties).length) await result.execute({ kind: "chartProperties", drawingId: object.id, ...properties });
    }, undefined, dialog => {
      dialog.classList.add("wide-form");
      const hint = dialog.ownerDocument.createElement("small"); hint.style.gridColumn = "1/-1"; hint.textContent = "Number formats: General, 0.0, #,##0 or 0%. Blank bounds and intervals restore automatic scaling. Percentage values use fractions: 0.5 is 50%."; dialog.append(hint);
    });
  });
  button("chart:properties", "Chart Properties", () => {
    const document = requireDocument(), object = selectedDrawing && document.content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.chart) return Promise.resolve();
    const chart = object.chart, snapshot = document.snapshot();
    return form("Chart properties", [...(chart.dataEditable ? [{ name: "title", label: "Chart title", value: chart.title }, { name: "legend", label: "Show legend", type: "checkbox", value: String(chart.legend) }, { name: "legendPosition", label: "Legend position", value: chart.legendPosition, choices: [{ value: "top", label: "Top" }, { value: "right", label: "Right" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }] }] : []), { name: "width", label: "Width (pt)", type: "number", min: "1", value: String(chart.width) }, { name: "height", label: "Height (pt)", type: "number", min: "1", value: String(chart.height) }, { name: "description", label: "Alternative text", value: object.description }], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen chart properties.");
      await result.execute({ kind: "chartProperties", drawingId: object.id, width: Number(values.width), height: Number(values.height), description: values.description ?? "", ...(!chart.dataEditable || values.title === chart.title ? {} : { title: values.title ?? "" }), ...(!chart.dataEditable || (values.legend === "true") === chart.legend ? {} : { legend: values.legend === "true" }), ...(!chart.dataEditable || values.legendPosition === chart.legendPosition && (values.legend !== "true" || chart.legend) ? {} : { legendPosition: values.legendPosition as NonNullable<import("@onodocs/sdk").ChartProperties["legendPosition"]>, legend: values.legend === "true" }) });
    });
  });
  button("chart:delete", "Delete Chart", async () => { const object = selectedDrawing && requireDocument().content.get(selectedDrawing); if (object && object.kind === "drawing" && object.chart) await result.execute({ kind: "chartProperties", drawingId: object.id, remove: true }); });
  button("dropCap", "Drop Cap", () => {
    const document = requireDocument(), range = requireSelection(), paragraphs = document.content.paragraphs().all(), index = paragraphs.findIndex(paragraph => paragraph.id === range.start.paragraphId), selected = paragraphs[index];
    if (!selected || range.start.paragraphId !== range.end.paragraphId || selected.story !== "body" || selected.parent?.kind !== "story") throw new Error("Choose one body paragraph outside tables for the drop cap.");
    const siblings = selected.parent.children, previous = siblings[siblings.indexOf(selected) - 1];
    const carrier = selected.dropCap ? selected : previous?.kind === "paragraph" && previous.dropCap && previous.sectionIndex === selected.sectionIndex ? previous : undefined;
    const current = carrier?.dropCap, font = document.content.within(carrier ?? selected).runs().first()?.properties.effective.fontFamily ?? "";
    const snapshot = document.snapshot();
    return form("Drop Cap", [
      { name: "mode", label: "Position", value: current?.mode ?? "drop", choices: [{ value: "none", label: "None" }, { value: "drop", label: "Dropped" }, { value: "margin", label: "In margin" }] },
      { name: "font", label: "Font", value: font },
      { name: "lines", label: "Lines to drop", type: "number", min: "2", max: "10", step: "1", value: String(current?.lines ?? 3) },
      { name: "distance", label: "Distance from text (pt)", type: "number", min: "0", max: "1584", step: "0.5", value: String(current?.distance ?? 0) },
      ...(carrier ? [] : [{ name: "characters", label: "Initial characters", type: "number", min: "1", step: "1", value: "1" }])
    ], async values => {
      if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Reopen Drop Cap with a fresh selection.");
      await result.execute({ kind: "dropCap", selection: range, dropCap: values.mode === "none" ? null : { mode: values.mode as "drop" | "margin", lines: Number(values.lines), distance: Number(values.distance), ...(values.font?.trim() && values.font.trim() !== font ? { fontFamily: values.font.trim() } : {}), ...(carrier ? {} : { characters: Number(values.characters) }) } });
    }, undefined, configureDropCapForm);
  });
  for (const insert of [true, false]) button(insert ? "wordArt" : "shape:wordArt", insert ? "WordArt" : "WordArt Styles", () => {
    const document = requireDocument(), object = !insert && selectedDrawing ? document.content.get(selectedDrawing) : undefined;
    if (!insert && (object?.kind !== "drawing" || !object.shape?.textBox)) return Promise.resolve();
    const story = object?.kind === "drawing" && object.shape?.textBox ? document.content.get(object.shape.textBox.storyId) : undefined, current = story ? document.content.within(story).runs().first()?.properties.effective : undefined;
    const drawingIndex = object ? document.content.descendants().all().filter(element => element.kind === "drawing").findIndex(element => element.id === object.id) : -1;
    const target = insert ? requireSelection().end.paragraphId : undefined;
    return form(insert ? "Insert WordArt" : "WordArt Styles", [
      { name: "preset", label: "Style", value: insert ? "blue-shadow" : "custom", choices: [{ value: "custom", label: "Custom" }, ...wordArtStyles] },
      ...(insert ? [{ name: "text", label: "Text", value: "Your text here" }] : []),
      { name: "font", label: "Font", value: current?.fontFamily ?? "Georgia" }, { name: "size", label: "Font size (pt)", type: "number", min: "1", step: "0.5", value: String(current?.fontSize ?? 36) },
      { name: "color", label: "Text color", type: "color", value: current?.color?.startsWith("#") ? current.color : "#365F91" },
      { name: "effect", label: "Text effect", value: current?.textEffect ?? "shadow", choices: textEffects }, { name: "bold", label: "Bold", type: "checkbox", value: String(current?.bold ?? true) },
      ...(insert ? [{ name: "width", label: "Width (pt)", type: "number", min: "1", value: "360" }, { name: "height", label: "Height (pt)", type: "number", min: "1", value: "96" }] : [])
    ], async values => {
      const formatting: TextFormatting = { fontFamily: values.font!.trim(), fontSize: Number(values.size), color: values.color!, textEffect: values.effect as NonNullable<TextFormatting["textEffect"]>, bold: values.bold === "true" };
      if (!formatting.fontFamily) throw new Error("Enter a font name.");
      if (insert) {
        if (!values.text?.trim()) throw new Error("Enter the WordArt text.");
        await result.execute({ kind: "shape", after: target!, preset: "rect", width: Number(values.width), height: Number(values.height), text: values.text, textFormatting: formatting, textAlignment: "center", fill: null, stroke: null, description: values.text, textBox: { margins: { left: 0, right: 0, top: 0, bottom: 0 }, verticalAlignment: "center", wrap: true } });
      } else {
        const paragraphs = document.content.within(story!).paragraphs().all();
        await result.execute({ kind: "batch", commands: paragraphs.map(paragraph => ({ kind: "format", selection: paragraph.selection, formatting })) });
        const drawing = requireDocument().content.descendants().all().filter(element => element.kind === "drawing")[drawingIndex];
        selectedDrawing = drawing?.id; const anchor = drawing && requireDocument().content.within(drawing).closest("paragraph").first(); if (anchor) selection = { start: anchor.selection.start, end: anchor.selection.start }; focus(); outlineSelection(); updateToolbar();
      }
      selectRibbon("Shape Format");
    }, undefined, wordArtGallery);
  });
  button("diagram", "Diagram", () => { const snapshot = requireDocument().snapshot(), target = requireSelection().end.paragraphId; return form("Insert diagram", [
    { name: "layout", label: "Layout", value: "process", choices: [{ value: "process", label: "Process" }, { value: "cycle", label: "Cycle" }, { value: "hierarchy", label: "Hierarchy" }] },
    { name: "items", label: "Diagram items (one per line)", value: "Plan\nBuild\nReview" },
    { name: "width", label: "Width (pt)", type: "number", min: "144", value: "360" },
    { name: "color", label: "Color", type: "color", value: "#4472C4" }
  ], async values => { if (requireDocument().snapshot() !== snapshot) throw new Error("The document changed. Close and reopen Insert diagram at the intended location."); await result.execute({ kind: "shapeGroup", after: target, ...diagramContent(values.layout!, values.items!, Number(values.width), values.color!) }); selectRibbon("Shape Format"); }, undefined, diagramGallery); });
  for (const [command, title, textBox] of [["shapes", "Insert shape", false], ["textBox", "Insert text box", true]] as const) button(command, textBox ? "Text Box" : "Shapes", () => form(title, [
    { name: "preset", label: "Shape", value: "rect", choices: shapeCatalog.map(shape => ({ value: shape.preset, label: shape.name })) },
    { name: "width", label: "Width (pt)", type: "number", min: "0.05", value: textBox ? "216" : "144" },
    { name: "height", label: "Height (pt)", type: "number", min: "0.05", value: textBox ? "108" : "72" },
    ...(textBox ? [{ name: "text", label: "Text", value: "Type your text here" }] : [])
  ], async values => { await result.execute({ kind: "shape", after: requireSelection().end.paragraphId, preset: values.preset, width: Number(values.width), height: Number(values.height), ...(textBox ? { text: values.text ?? "" } : {}) } as EditorCommand); selectRibbon("Shape Format"); }, undefined, form => {
    if (!textBox) shapeGallery(form);
    else { const input = form.elements.namedItem("text") as HTMLInputElement, text = document.createElement("textarea"); text.name = "text"; text.className = "shape-text"; text.value = input.value; input.replaceWith(text); }
  }));
  button("shape:preset", "Change Shape", () => {
    const object = selectedVisual(); if (!object || object.element.kind !== "drawing") return Promise.resolve();
    return form("Change shape", [{ name: "preset", label: "Shape", value: object.element.shape!.preset, choices: shapeCatalog.map(shape => ({ value: shape.preset, label: shape.name })) }], values => result.execute({ kind: "shapeProperties", drawingId: object.id, preset: values.preset } as EditorCommand), undefined, shapeGallery);
  });
  button("shape:properties", "Size & properties", () => {
    const object = selectedVisual(); if (object?.element.kind !== "drawing") return Promise.resolve();
    return form(object.element.group ? "Group properties" : "Shape properties", [{ name: "width", label: "Width (pt)", type: "number", min: "0.05", value: String(object.width) }, { name: "height", label: "Height (pt)", type: "number", min: "0.05", value: String(object.height) }, { name: "description", label: "Alternative text", value: object.element.description }], values => result.execute({ ...object.target, width: Number(values.width), height: Number(values.height), description: values.description ?? "" }));
  });
  for (const kind of ["picture", "shape"] as const) button(`${kind}:effects`, kind === "picture" ? "Picture Effects" : "Shape Effects", () => {
    const object = selectedVisual(); if (!object || object.element.kind === "drawing" && !object.element.shape) return Promise.resolve();
    let changed = false;
    const shadow = object.element.kind === "image" ? object.element.shadow : object.element.shape?.shadow;
    const effects = kind === "shape" ? requireDocument().content.first()?.theme?.effects ?? [null, null, null] : [];
    return form(kind === "picture" ? "Picture shadow" : "Shape shadow", [
      { name: "effect", label: "Preset", value: shadow ? "custom" : "none", choices: [...shadowPresets, { value: "custom", label: "Custom" }, ...effects.map((_, index) => ({ value: `theme${index + 1}`, label: `Theme style ${index + 1}` }))] },
      { name: "color", label: "Color", type: "color", value: shadow?.color ?? "#000000" },
      { name: "opacity", label: "Opacity (%)", type: "number", min: "0", max: "100", value: String((shadow?.opacity ?? .3) * 100) },
      { name: "blur", label: "Blur (pt)", type: "number", min: "0", value: String(shadow?.blur ?? 4) },
      { name: "distance", label: "Distance (pt)", type: "number", min: "0", value: String(shadow?.distance ?? 3) },
      { name: "angle", label: "Angle (degrees)", type: "number", value: String(shadow?.angle ?? 45) }
    ], values => {
      if (!changed) return Promise.resolve();
      const shadow = values.effect === "none" || values.effect?.startsWith("theme") ? null : { color: values.color!, opacity: Number(values.opacity) / 100, blur: Number(values.blur), distance: Number(values.distance), angle: Number(values.angle) };
      return object.element.kind === "image" ? result.execute({ kind: "imageProperties", imageId: object.id, shadow }) : result.execute({ kind: "shapeProperties", drawingId: object.id, shadow, effectStyle: values.effect?.startsWith("theme") ? Number(values.effect.slice(5)) as 1 | 2 | 3 : 0 });
    }, undefined, form => { drawingEffectsGallery(form, false, effects); form.addEventListener("input", () => { changed = true; }); form.querySelector(".drawing-effects-gallery")!.addEventListener("click", () => { changed = true; }); });
  });
  button("shape:fill", "Shape Fill", () => {
    const object = selectedVisual(); if (!object || object.element.kind !== "drawing") return Promise.resolve();
    const fill = object.element.shape!.fill;
    return form("Shape fill", [{ name: "color", label: "Fill color", type: "color", value: fill.kind === "solidSrgb" ? fill.color : "#4472C4" }, { name: "none", label: "No fill", type: "checkbox", value: String(fill.kind === "none") }], values => result.execute({ kind: "shapeProperties", drawingId: object.id, fill: values.none === "true" ? null : values.color! }));
  });
  button("shape:outline", "Shape Outline", () => {
    const object = selectedVisual(); if (!object || object.element.kind !== "drawing") return Promise.resolve();
    const stroke = object.element.shape!.stroke;
    return form("Shape outline", [{ name: "color", label: "Outline color", type: "color", value: stroke?.color ?? "#2F528F" }, { name: "width", label: "Width (pt)", type: "number", min: "0", value: String(stroke?.width ?? 1) }, { name: "none", label: "No outline", type: "checkbox", value: String(!stroke) }], values => result.execute({ kind: "shapeProperties", drawingId: object.id, stroke: values.none === "true" ? null : { color: values.color!, width: Number(values.width) } }));
  });
  button("shape:delete", "Delete shape", async () => { const object = selectedVisual(); if (object?.element.kind === "drawing") await result.execute({ ...object.target, remove: true }); });
  button("shape:text", "Edit Text", async () => {
    let object = selectedDrawing && requireDocument().content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.shape) return;
    if (!object.shape.textBox) {
      await result.execute({ kind: "shapeProperties", drawingId: object.id, text: "", textBox: { margins: { left: 7.2, right: 7.2, top: 3.6, bottom: 3.6 }, verticalAlignment: "center", wrap: true } });
      object = selectedDrawing && requireDocument().content.get(selectedDrawing);
    }
    if (!object || object.kind !== "drawing" || !object.shape?.textBox) return;
    const paragraph = requireDocument().content.within(requireDocument().content.get(object.shape.textBox.storyId)!).paragraphs().first(); if (paragraph) { result.select(paragraph.selection); selectRibbon("Home"); }
  });
  button("shape:textBox", "Text Box Settings", () => {
    const object = selectedDrawing && requireDocument().content.get(selectedDrawing); if (!object || object.kind !== "drawing" || !object.shape?.textBox) return Promise.resolve();
    const box = object.shape.textBox;
    return form("Text box settings", [...(["left", "right", "top", "bottom"] as const).map(edge => ({ name: edge, label: `${edge[0]!.toUpperCase() + edge.slice(1)} margin (pt)`, type: "number", min: "0", value: String(box.margins[edge]) })), { name: "alignment", label: "Vertical alignment", value: box.verticalAlignment, choices: [{ value: "top", label: "Top" }, { value: "center", label: "Middle" }, { value: "bottom", label: "Bottom" }] }, { name: "wrap", label: "Wrap text in shape", type: "checkbox", value: String(box.wrap) }], values => result.execute({ kind: "shapeProperties", drawingId: object.id, textBox: { margins: { left: Number(values.left), right: Number(values.right), top: Number(values.top), bottom: Number(values.bottom) }, verticalAlignment: values.alignment as "top" | "center" | "bottom", wrap: values.wrap === "true" } }));
  });
  button("icons", "Icons", () => form("Insert icon", [
    { name: "search", label: "Search icons", type: "search" },
    { name: "category", label: "Category", value: "all", choices: [{ value: "all", label: "All categories" }, ...[...new Set(insertIcons.map(icon => icon.category))].map(value => ({ value, label: value }))] },
    { name: "icon", label: "Icon", value: "heart", choices: insertIcons.map(icon => ({ value: icon.id, label: icon.name })) },
    { name: "color", label: "Color", type: "color", value: "#335b91" },
    { name: "size", label: "Size (pt)", type: "number", min: "1", value: "36" },
    { name: "description", label: "Alternative text", value: "Heart" }
  ], async values => { const size = Number(values.size); const bytes = await insertIconBytes(values.icon!, values.color!, size); await result.execute({ kind: "image", after: requireSelection().end.paragraphId, bytes, mediaType: "image/png", width: size, height: size, description: values.description! }); }, undefined, form => { form.className = "insert-icons-form"; insertIconGallery(form); }));
  button("screenshot", "Screenshot", async () => {
    const document = requireDocument(), snapshot = document.snapshot(), after = requireSelection().end.paragraphId, width = imageInsertionWidth();
    showScreenshot(root, async (blob, description) => { const image = await readImageFile(blob, width); await enqueue(async () => { if (doc !== document || document.snapshot() !== snapshot) throw new Error("The document changed. Close Screenshot and choose the insertion point again."); await apply({ kind: "image", after, ...image, description }); }); }, lifetime.signal);
  });
  button("image", "Insert image", async () => { const picker = document.createElement("input"); picker.type = "file"; picker.accept = "image/png,image/jpeg"; picker.addEventListener("change", () => { const file = picker.files?.[0]; if (!file) return; event(async () => { const { bytes, width, height, mediaType } = await readImageFile(file, imageInsertionWidth()); await form("Insert image after paragraph", [{ name: "width", label: "Width (points)", type: "number", value: String(width) }, { name: "height", label: "Height (points)", type: "number", value: String(height) }, { name: "description", label: "Image description" }], v => result.execute({ kind: "image", after: requireSelection().end.paragraphId, bytes, mediaType, width: Number(v.width), height: Number(v.height), description: v.description ?? "" })); }); }); picker.click(); });
  select("orientation", "Orientation", [{ value: "", label: "Orientation" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }], value => {
    if (!value) return Promise.resolve();
    const size = requireDocument().content.sections().all().find(section => section.index === selectedSectionIndex())?.properties.authored;
    const width = size?.width ?? 595.3, height = size?.height ?? 841.9, short = Math.min(width, height), long = Math.max(width, height);
    return result.execute({ kind: "page", width: value === "portrait" ? short : long, height: value === "portrait" ? long : short }).finally(() => { controls.get("orientation")!.value = ""; });
  });
  const paperSizes = [{ value: "a4", label: "A4 (210 × 297 mm)", width: 595.3, height: 841.9 }, { value: "letter", label: "Letter (8.5 × 11 in)", width: 612, height: 792 }, { value: "legal", label: "Legal (8.5 × 14 in)", width: 612, height: 1008 }, { value: "a5", label: "A5 (148 × 210 mm)", width: 419.55, height: 595.3 }, { value: "a3", label: "A3 (297 × 420 mm)", width: 841.9, height: 1190.55 }];
  select("paperSize", "Paper size", [{ value: "", label: "Paper size" }, ...paperSizes], value => {
    const size = paperSizes.find(size => size.value === value); if (!size) return Promise.resolve();
    const current = requireDocument().content.sections().all().find(section => section.index === selectedSectionIndex())?.properties.authored, landscape = (current?.width ?? 595.3) > (current?.height ?? 841.9);
    return result.execute({ kind: "page", width: landscape ? size.height : size.width, height: landscape ? size.width : size.height }).finally(() => { controls.get("paperSize")!.value = ""; });
  });
  select("pageMargins", "Page margins", [{ value: "", label: "Margins" }, { value: "normal", label: "Normal — 1 in" }, { value: "narrow", label: "Narrow — 0.5 in" }, { value: "moderate", label: "Moderate — 0.75 in sides" }, { value: "wide", label: "Wide — 2 in sides" }], value => {
    if (!value) return Promise.resolve();
    const vertical = value === "narrow" ? 36 : 72, horizontal = value === "narrow" ? 36 : value === "moderate" ? 54 : value === "wide" ? 144 : 72;
    return result.execute({ kind: "page", margins: { top: vertical, bottom: vertical, left: horizontal, right: horizontal } }).finally(() => { controls.get("pageMargins")!.value = ""; });
  });
  function currentPageProperties() { return requireDocument().content.sections().all().find(section => section.index === selectedSectionIndex())?.properties.authored ?? {}; }
  button("pageBreak", "Page Break", () => result.execute({ kind: "break", type: "page" }));
  button("coverPage", "Cover Page", () => form("Cover Page", [
    { name: "title", label: "Title", value: "Document title" }, { name: "subtitle", label: "Subtitle" }, { name: "author", label: "Author" }, { name: "date", label: "Date", value: new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date()) }
  ], values => {
    const document = requireDocument(), body = document.content.stories().where({ story: "body" }).one(), first = body.children.find(value => ["paragraph", "table", "contentControl"].includes(value.kind));
    if (!first) throw new Error("This document has no body content to insert before.");
    const theme = document.content.first()?.theme, page = document.pages[0], margins = document.content.sections().first()?.properties.authored.margins, styles = document.paragraphStyles().all(), style = (styles.find(value => value.isDefault) ?? styles.find(value => value.id === "Normal"))?.id;
    return result.execute({ kind: "insert", before: first.id, paragraphs: coverPageParagraphs(values, style, theme?.fonts?.heading ?? "Calibri", theme?.fonts?.body ?? "Calibri", theme?.colors?.accent1 ?? "#4472C4", document.content.first()?.backgroundColor ?? "#FFFFFF", Math.max(0, (page ? page.size.height / 20 : 792) - (margins?.top ?? 72) - (margins?.bottom ?? 72))) });
  }, undefined, form => {
    form.classList.add("cover-page-form"); form.querySelector<HTMLInputElement>('[name="title"]')!.required = true;
    const gallery = document.createElement("fieldset"), legend = document.createElement("legend"); legend.textContent = "Design"; gallery.className = "cover-page-gallery"; gallery.append(legend);
    for (const design of coverPageDesigns) {
      const label = document.createElement("label"), choice = document.createElement("input"), preview = document.createElement("span"), title = document.createElement("strong"), subtitle = document.createElement("small"), name = document.createElement("span");
      choice.type = "radio"; choice.name = "design"; choice.value = design.id; choice.checked = design.id === "simple"; choice.setAttribute("aria-label", design.name);
      preview.className = `cover-page-preview cover-page-${design.id}`; preview.setAttribute("aria-hidden", "true"); title.textContent = "Title"; subtitle.textContent = "Subtitle"; name.textContent = design.name; preview.append(title, subtitle); label.append(choice, preview, name); gallery.append(label);
    }
    form.querySelector("h2")!.after(gallery);
    const help = document.createElement("p"); help.className = "design-help"; help.textContent = "Insert an editable cover at the beginning of the document. Existing content starts on the next page."; form.append(help);
  }));
  button("blankPage", "Blank Page", () => result.execute({ kind: "break", type: "blankPage" }));
  select("breaks", "Breaks", [{ value: "", label: "Breaks" }, { value: "page", label: "Page — start the next page" }, { value: "column", label: "Column — start the next column" }, { value: "nextPage", label: "Section — next page" }, { value: "continuous", label: "Section — continuous" }, { value: "evenPage", label: "Section — even page" }, { value: "oddPage", label: "Section — odd page" }], value => result.execute(value === "page" || value === "column" ? { kind: "break", type: value } : { kind: "sectionBreak", type: value as "nextPage" | "continuous" | "evenPage" | "oddPage" }).finally(() => { controls.get("breaks")!.value = ""; }));
  button("hyphenation", "Hyphenation", () => {
    const current = requireDocument().content.first()!, range = requireSelection();
    return form("Hyphenation", [
      { name: "automatic", label: "Document hyphenation", value: current.autoHyphenation ? "automatic" : "none", choices: [{ value: "none", label: "None" }, { value: "automatic", label: "Automatic" }] },
      { name: "caps", label: "Words in ALL CAPS", value: current.doNotHyphenateCaps ? "exclude" : "include", choices: [{ value: "include", label: "Allow hyphenation" }, { value: "exclude", label: "Do not hyphenate" }] },
      { name: "zone", label: "Hyphenation zone (points)", type: "number", min: "0", step: "0.05", value: String(current.hyphenationZone) },
      { name: "limit", label: "Consecutive hyphenated lines (0 = unlimited)", type: "number", min: "0", step: "1", value: String(current.consecutiveHyphenLimit) },
      { name: "paragraphs", label: "Selected paragraphs", value: "keep", choices: [{ value: "keep", label: "Keep existing setting" }, { value: "inherit", label: "Use document setting" }, { value: "suppress", label: "Do not hyphenate" }, { value: "allow", label: "Always allow hyphenation" }] }
    ], values => result.execute({ kind: "batch", commands: [{ kind: "documentProperties", autoHyphenation: values.automatic === "automatic", doNotHyphenateCaps: values.caps === "exclude", hyphenationZone: Number(values.zone), consecutiveHyphenLimit: Number(values.limit) }, ...values.paragraphs === "keep" ? [] : [{ kind: "properties" as const, selection: range, paragraph: { suppressAutoHyphens: values.paragraphs === "inherit" ? null : values.paragraphs === "suppress" } }]] }), undefined, form => {
      form.classList.add("wide-form"); const help = document.createElement("p"); help.className = "design-help"; help.style.gridColumn = "1/-1"; help.textContent = "Automatic hyphenation supports English (US and UK) and Spanish. Set the text language on the Review tab. Paragraph overrides take precedence over the document setting."; form.querySelector("h2")!.after(help);
    });
  });
  button("bibliography:citation", "Insert Citation", async () => {
    requireSelection(); setMobileTools(false);
    showCitation(root, () => requireDocument().content.first()!.bibliography, citation => { const point = requireSelection().end; return result.execute({ ...citation, selection: { start: point, end: point } }); }, command => result.execute(command), lifetime.signal, focus);
  });
  button("bibliography:editCitation", "Edit Citation", async () => {
    const range = requireSelection(), runs = requireDocument().content.runs().all();
    const index = runs.findIndex(run => { const selected = run.citation?.selection; return selected && selected.start.paragraphId === range.start.paragraphId && selected.end.paragraphId === range.end.paragraphId && range.start.offset >= selected.start.offset && range.end.offset <= selected.end.offset; });
    const citation = runs[index]?.citation; if (!citation) throw new Error("Place the cursor in an editable citation.");
    const execute = (value: import("@onodocs/sdk").CitationInstruction | null) => { const current = requireDocument().content.runs().at(index)?.citation; if (!current) throw new Error("The citation is no longer available."); return result.execute({ kind: "citationProperties", citation: value, selection: current.selection }); };
    setMobileTools(false); showCitation(root, () => requireDocument().content.first()!.bibliography, value => execute(value), command => result.execute(command), lifetime.signal, focus, { citation: citation.instruction, remove: () => execute(null) });
  });
  button("bibliography:insert", "Bibliography", () => {
    const paragraph = paragraphs().find(paragraph => paragraph.id === requireSelection().start.paragraphId)!;
    let anchor: import("@onodocs/sdk").DocumentElement = paragraph; while (anchor.parent && anchor.parent.kind !== "story") anchor = anchor.parent;
    return form("Insert Bibliography", [{ name: "title", label: "Heading", value: "Bibliography", choices: [{ value: "Bibliography", label: "Bibliography" }, { value: "References", label: "References" }, { value: "Works Cited", label: "Works Cited" }, { value: "", label: "No heading" }] }], values => result.execute({ kind: "bibliography", after: anchor.id, title: values.title! }), undefined, form => { const help = document.createElement("p"); help.textContent = "Includes all document sources. Source and citation-style changes update supported bibliographies automatically."; form.querySelector("h2")!.after(help); });
  });
  for (const remove of [false, true]) button(remove ? "bibliography:remove" : "bibliography:update", remove ? "Remove Bibliography" : "Update Bibliography", async () => {
    const selected = paragraphs().find(paragraph => paragraph.id === requireSelection().start.paragraphId), fields = paragraphs().filter(paragraph => paragraph.bibliography?.selection.start.paragraphId === paragraph.id);
    const paragraph = selected?.bibliography ? selected : fields.length === 1 ? fields[0] : undefined;
    if (!paragraph) throw new Error("Place the cursor in the bibliography to update.");
    await result.execute({ kind: "bibliography", targetId: paragraph.id, remove });
  });
  select("bibliography:style", "Citation style", [{ value: "", label: "Imported style" }, { value: "apa", label: "APA (author–date)" }, { value: "mla", label: "MLA (author–page)" }], async value => { if (value) await result.execute({ kind: "bibliographyStyle", style: value as "apa" | "mla" }); });
  button("bibliography:sources", "Manage Sources", async () => { setMobileTools(false); showBibliographySources(root, () => requireDocument().content.first()!.bibliography, command => result.execute(command), lifetime.signal, focus); });
  button("lineNumbers", "Line numbers", () => {
    const current = currentPageProperties().lineNumbering, range = requireSelection();
    return form("Line numbers", [
      { name: "restart", label: "Numbering", value: current?.restart ?? "none", choices: [{ value: "none", label: "None" }, { value: "continuous", label: "Continuous" }, { value: "newPage", label: "Restart each page" }, { value: "newSection", label: "Restart each section" }] },
      { name: "scope", label: "Apply to", value: "section", choices: [{ value: "section", label: "This section" }, { value: "document", label: "Whole document" }] },
      { name: "start", label: "Start at", type: "number", step: "1", value: String(current?.start ?? 1) },
      { name: "countBy", label: "Count by", type: "number", min: "1", step: "1", value: String(current?.countBy ?? 1) },
      { name: "distance", label: "Distance from text (points; blank for automatic)", type: "number", min: "0", step: "0.05", value: current?.distance === undefined ? "" : String(current.distance) },
      { name: "suppression", label: "Selected paragraphs", value: "keep", choices: [{ value: "keep", label: "Keep existing setting" }, { value: "suppress", label: "Suppress line numbers" }, { value: "include", label: "Include line numbers" }] }
    ], values => {
      const lineNumbering = values.restart === "none" ? null : { countBy: Number(values.countBy), start: Number(values.start), ...(values.distance?.trim() ? { distance: Number(values.distance) } : {}), restart: values.restart as "continuous" | "newPage" | "newSection" };
      const sections = requireDocument().content.sections().all().filter(section => values.scope === "document" || section.index === selectedSectionIndex());
      const commands: Extract<DocumentEdit, { kind: "batch" }>["commands"][number][] = sections.map(section => { const p = bodySectionParagraph(section.index); return { kind: "page", lineNumbering, selection: { start: p.selection.start, end: p.selection.start } }; });
      if (values.suppression !== "keep") commands.push({ kind: "properties", selection: range, paragraph: { suppressLineNumbers: values.suppression === "suppress" } });
      return result.execute({ kind: "batch", commands });
    }, undefined, form => {
      form.classList.add("wide-form"); const restart = form.elements.namedItem("restart") as HTMLSelectElement;
      const update = () => { for (const name of ["start", "countBy", "distance"]) (form.elements.namedItem(name) as HTMLInputElement).disabled = restart.value === "none"; }; restart.addEventListener("change", update); update();
    });
  });
  button("columns", "Columns", () => {
    const page = currentPageProperties(), columns = page.columns;
    return form("Columns", [
      { name: "preset", label: "Layout", value: columns?.widths ? "custom" : "equal", choices: [{ value: "equal", label: "Equal width" }, { value: "left", label: "Left — narrow left column" }, { value: "right", label: "Right — narrow right column" }, { value: "custom", label: "Custom widths" }] },
      { name: "count", label: "Number of columns", type: "number", min: "1", step: "1", value: String(columns?.count ?? 1) },
      { name: "spacing", label: "Spacing (points)", type: "number", min: "0", value: String(columns?.spacing ?? 36) },
      { name: "widths", label: "Column widths (points, separated by commas)", value: columns?.widths?.join(", ") ?? "" },
      { name: "separator", label: "Line between columns", type: "checkbox", value: String(columns?.separator ?? false) },
    ], values => {
      const spacing = Number(values.spacing), available = (page.width ?? 612) - (page.margins?.left ?? 72) - (page.margins?.right ?? 72) - (page.gutter ?? 0);
      const widths = values.preset === "custom" ? values.widths!.split(",").map(value => Number(value.trim())) : values.preset === "left" ? [(available - spacing) / 3, (available - spacing) * 2 / 3] : values.preset === "right" ? [(available - spacing) * 2 / 3, (available - spacing) / 3] : undefined;
      const count = widths?.length ?? Number(values.count);
      if (!Number.isSafeInteger(count) || count < 1 || spacing < 0 || (widths ? widths.reduce((sum, value) => sum + value, 0) : 0) + spacing * (count - 1) >= available + (widths ? 0.1 : 0)) throw new RangeError("Columns and their spacing must fit within the page margins.");
      return result.execute({ kind: "page", columns: { count, spacing, separator: values.separator === "true", ...(widths ? { widths } : {}) } });
    }, undefined, form => {
      const preset = form.elements.namedItem("preset") as HTMLSelectElement, count = form.elements.namedItem("count") as HTMLInputElement, widths = form.elements.namedItem("widths") as HTMLInputElement;
      const update = () => { widths.closest("label")!.hidden = preset.value !== "custom"; count.closest("label")!.hidden = preset.value !== "equal"; };
      preset.addEventListener("change", update); update();
    });
  });
  button("page", "Page settings", () => {
    const page = currentPageProperties();
    return form("Page setup", [
      { name: "width", label: "Width (points)", value: String(page.width ?? 612), type: "number", min: "1" },
      { name: "height", label: "Height (points)", value: String(page.height ?? 792), type: "number", min: "1" },
      ...(["top", "right", "bottom", "left"] as const).map(name => ({ name, label: `${name[0]!.toUpperCase() + name.slice(1)} margin (points)`, value: String(page.margins?.[name] ?? 72), type: "number", min: "0" })),
      { name: "header", label: "Header from top (points)", value: String(page.headerDistance ?? 36), type: "number", min: "0" },
      { name: "footer", label: "Footer from bottom (points)", value: String(page.footerDistance ?? 36), type: "number", min: "0" },
      { name: "gutter", label: "Gutter (points)", value: String(page.gutter ?? 0), type: "number", min: "0" },
      { name: "vertical", label: "Vertical alignment (Word export)", value: page.verticalAlignment ?? "top", choices: [{ value: "top", label: "Top" }, { value: "center", label: "Center" }, { value: "both", label: "Justified" }, { value: "bottom", label: "Bottom" }] },
    ], values => result.execute({ kind: "page", width: Number(values.width), height: Number(values.height), margins: { top: Number(values.top), right: Number(values.right), bottom: Number(values.bottom), left: Number(values.left) }, headerDistance: Number(values.header), footerDistance: Number(values.footer), gutter: Number(values.gutter), verticalAlignment: values.vertical as "top" | "center" | "both" | "bottom" }), undefined, form => {
      form.classList.add("wide-form"); const hint = document.createElement("small"); hint.textContent = "Vertical alignment is saved for Word. The editor preview uses top alignment."; (form.elements.namedItem("vertical") as HTMLSelectElement).closest("label")!.append(hint);
    });
  });
  button("dateTime", "Date & Time", () => {
    const instant = new Date(), locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    const formats: readonly Intl.DateTimeFormatOptions[] = [{ dateStyle: "short" }, { dateStyle: "long" }, { dateStyle: "full" }, { timeStyle: "short" }, { timeStyle: "medium" }, { dateStyle: "long", timeStyle: "short" }];
    const locales = [...new Set([locale, "en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT", "pt-BR", "uk-UA", "pl-PL", "et-EE", "fi-FI", "ja-JP", "zh-CN", "ar-EG"])];
    const names = new Intl.DisplayNames([locale], { type: "language" });
    return form("Date & Time", [{ name: "locale", label: "Language", value: locale, choices: locales.map(value => ({ value, label: names.of(value) ?? value })) }, { name: "format", label: "Available formats", value: "1", choices: formats.map((options, index) => ({ value: String(index), label: new Intl.DateTimeFormat(locale, options).format(instant) })) }], values => result.execute({ kind: "replace", text: new Intl.DateTimeFormat(values.locale, formats[Number(values.format)]).format(instant), paragraphBreaks: false }), undefined, form => {
      const language = form.elements.namedItem("locale") as HTMLSelectElement, format = form.elements.namedItem("format") as HTMLSelectElement, hint = document.createElement("small"); hint.textContent = "Inserts the displayed date or time as text."; form.append(hint);
      language.addEventListener("change", () => { for (const [index, option] of [...format.options].entries()) option.textContent = new Intl.DateTimeFormat(language.value, formats[index]).format(instant); });
    });
  });
  button("equation", "Equation", async () => {
    const document = requireDocument(), snapshot = document.snapshot(), selected = requireSelection();
    const paragraph = document.content.get(selected.start.paragraphId)!;
    const equation = document.content.within(paragraph).runs().all().find(run => run.semantic.kind === "officeMath" && selected.start.offset >= run.selection.start.offset && selected.end.offset <= run.selection.end.offset);
    if (equation && !equation.equation) throw new Error("This imported equation contains structures that cannot yet be edited. Its original Word content is preserved.");
    const target = equation?.selection ?? selected;
    showEquation(root, equation?.equation ?? [{ kind: "text", text: "" }], !!equation, async value => {
      if (document !== requireDocument() || document.snapshot() !== snapshot) throw new Error("The document changed. Reopen Equation from the current selection.");
      await result.execute({ kind: "equation", selection: target, equation: value });
    }, lifetime.signal);
  });
  button("symbol", "Symbol", () => {
    const groups = {
      "Common": [["©", "Copyright"], ["®", "Registered"], ["™", "Trademark"], ["°", "Degree"], ["§", "Section"], ["¶", "Paragraph"], ["†", "Dagger"], ["‡", "Double dagger"], ["•", "Bullet"], ["…", "Ellipsis"], ["–", "En dash"], ["—", "Em dash"], ["‘", "Left single quotation"], ["’", "Right single quotation"], ["“", "Left double quotation"], ["”", "Right double quotation"], ["«", "Left guillemet"], ["»", "Right guillemet"], [" ", "Nonbreaking space"], ["‑", "Nonbreaking hyphen"]],
      "Currency": [["€", "Euro"], ["£", "Pound"], ["¥", "Yen"], ["¢", "Cent"], ["₴", "Hryvnia"], ["₹", "Rupee"], ["₩", "Won"], ["₿", "Bitcoin"]],
      "Mathematics": [["±", "Plus or minus"], ["×", "Multiplication"], ["÷", "Division"], ["≠", "Not equal"], ["≤", "Less than or equal"], ["≥", "Greater than or equal"], ["≈", "Approximately equal"], ["∞", "Infinity"], ["√", "Square root"], ["∑", "Summation"], ["∏", "Product"], ["∫", "Integral"], ["∂", "Partial derivative"], ["∆", "Increment"], ["½", "One half"], ["¼", "One quarter"]],
      "Greek": [["α", "Alpha"], ["β", "Beta"], ["γ", "Gamma"], ["δ", "Delta"], ["ε", "Epsilon"], ["θ", "Theta"], ["λ", "Lambda"], ["μ", "Mu"], ["π", "Pi"], ["ρ", "Rho"], ["σ", "Sigma"], ["φ", "Phi"], ["ω", "Omega"], ["Δ", "Capital delta"], ["Σ", "Capital sigma"], ["Ω", "Capital omega"]],
      "Arrows & marks": [["←", "Left arrow"], ["↑", "Up arrow"], ["→", "Right arrow"], ["↓", "Down arrow"], ["↔", "Left right arrow"], ["⇒", "Implies"], ["✓", "Check mark"], ["✗", "Cross mark"], ["☐", "Empty ballot box"], ["☑", "Checked ballot box"], ["★", "Star"], ["☆", "Outline star"]],
    } as const;
    return form("Symbol", [{ name: "category", label: "Subset", value: "Common", choices: Object.keys(groups).map(value => ({ value, label: value })) }, { name: "code", label: "Unicode (hex)", value: "00A9" }], values => {
      const value = values.code?.trim() ?? "", code = Number.parseInt(value, 16);
      if (!/^[0-9a-f]{1,6}$/i.test(value) || code < 32 || code > 0x10ffff || code >= 0xd800 && code <= 0xdfff || code >= 0x7f && code <= 0x9f) throw new RangeError("Enter a printable Unicode code point, such as 00A9 or 1F642.");
      return result.execute({ kind: "replace", text: String.fromCodePoint(code), paragraphBreaks: false });
    }, undefined, form => {
      const category = form.elements.namedItem("category") as HTMLSelectElement, code = form.elements.namedItem("code") as HTMLInputElement, grid = document.createElement("div"); grid.className = "symbol-gallery"; grid.setAttribute("role", "group"); grid.setAttribute("aria-label", "Symbols"); category.closest("label")!.after(grid);
      const draw = () => { grid.replaceChildren(...groups[category.value as keyof typeof groups].map(([text, name]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = text === "\u00a0" ? "␣" : text; button.setAttribute("aria-label", name); button.title = name; button.setAttribute("aria-pressed", String(Number.parseInt(code.value, 16) === text.codePointAt(0))); button.addEventListener("click", () => { code.value = text.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0"); for (const item of grid.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button)); }); return button; })); };
      category.addEventListener("change", draw); code.addEventListener("input", () => { for (const item of grid.querySelectorAll("button")) item.setAttribute("aria-pressed", "false"); }); draw();
    });
  });
  button("contents", "Table of Contents", () => form("Insert table of contents", [{ name: "title", label: "Title", value: "Contents" }, { name: "levels", label: "Heading levels", value: "3", choices: Array.from({ length: 9 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) })) }], values => result.execute({ kind: "tableOfContents", before: requireSelection().start.paragraphId, levels: Number(values.levels), title: values.title ?? "" })));
  select("contents:level", "Add Text to Contents", [{ value: "", label: "Add Text" }, { value: "none", label: "Do not show in contents" }, ...Array.from({ length: 9 }, (_, index) => ({ value: `Heading${index + 1}`, label: `Level ${index + 1}` }))], value => result.execute({ kind: "style", styleId: value === "none" ? null : value }).finally(() => { controls.get("contents:level")!.value = ""; }));
  button("contents:update", "Update Table of Contents", async () => {
    const content = requireDocument().content, controls = content.contentControls().all().filter(control => control.tableOfContents ? !control.tableOfContents.captionLabel : control.title === "Table of Contents"), current = content.get(requireSelection().start.paragraphId), containing = current && content.within(current).closest("contentControl").first(), control = controls.find(control => control.id === containing?.id) ?? controls[0];
    if (!control) { report("Select a table-of-contents control to update."); return; }
    const title = content.within(control).paragraphs().first()?.text ?? "Contents";
    return form("Update table of contents", [{ name: "title", label: "Title", value: title }, { name: "levels", label: "Heading levels", value: String(control.tableOfContents?.levels ?? 3), choices: Array.from({ length: 9 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) })) }], values => result.execute({ kind: "tableOfContents", targetId: control.id, levels: Number(values.levels), title: values.title ?? "" }));
  });
  for (const update of [false, true]) button(update ? "figures:update" : "figures", update ? "Update Table of Figures" : "Insert Table of Figures", async () => {
    const content = requireDocument().content, current = content.get(requireSelection().start.paragraphId), containing = current && content.within(current).closest("contentControl").first();
    const tables = content.contentControls().all().filter(control => control.tableOfContents?.captionLabel || control.title === "Table of Figures");
    const control = tables.find(control => control.id === containing?.id) ?? tables[0];
    if (update && !control) { report("Insert a table of figures first."); return; }
    const labels = [...new Set(["Figure", "Table", "Equation", ...content.paragraphs().all().flatMap(paragraph => paragraph.caption ? [paragraph.caption.label] : []), ...(control?.tableOfContents?.captionLabel ? [control.tableOfContents.captionLabel] : [])])];
    return form(update ? "Update table of figures" : "Insert table of figures", [
      ...(update ? [{ name: "target", label: "Table", value: control!.id, choices: tables.map(table => ({ value: table.id, label: content.within(table).paragraphs().first()?.text || table.tableOfContents?.captionLabel || "Table of Figures" })) }] : []),
      { name: "title", label: "Title", value: update ? content.within(control!).paragraphs().first()?.text ?? "Table of Figures" : "Table of Figures" },
      { name: "label", label: "Caption label", value: update ? control!.tableOfContents?.captionLabel ?? "Figure" : "Figure", choices: labels.map(label => ({ value: label, label })) }
    ], values => result.execute({ kind: "tableOfContents", captionLabel: values.label!, title: values.title ?? "", ...(update ? { targetId: values.target! } : { before: requireSelection().start.paragraphId }) }), undefined, form => {
      const target = form.elements.namedItem("target") as HTMLSelectElement | null;
      target?.addEventListener("change", () => { const table = tables.find(table => table.id === (target as HTMLSelectElement).value)!; (form.elements.namedItem("title") as HTMLInputElement).value = content.within(table).paragraphs().first()?.text ?? ""; (form.elements.namedItem("label") as HTMLSelectElement).value = table.tableOfContents?.captionLabel ?? "Figure"; });
    });
  });
  button("caption", "Insert Caption", () => form("Insert caption", [{ name: "label", label: "Label", value: "Figure", choices: [{ value: "Figure", label: "Figure" }, { value: "Table", label: "Table" }, { value: "Equation", label: "Equation" }] }, { name: "position", label: "Position", value: "after", choices: [{ value: "after", label: "Below selected item" }, { value: "before", label: "Above selected item" }] }, { name: "text", label: "Caption text", value: "" }], values => {
    const content = requireDocument().content, paragraph = content.get(requireSelection().start.paragraphId)!, table = content.within(paragraph).closest("table").first(), id = table?.id ?? paragraph.id;
    return result.execute({ kind: "caption", label: values.label!, text: values.text ?? "", ...(values.position === "before" ? { before: id } : { after: id }) });
  }));
  async function showCrossReferences(): Promise<void> {
    const content = requireDocument().content, bookmarks = content.bookmarks().all(), headings = content.paragraphs().all().filter(paragraph => paragraph.headingLevel && paragraph.text.trim()), captions = content.paragraphs().all().filter(paragraph => paragraph.caption);
    const choices = [{ value: "bookmarks", label: "Bookmarks" }, { value: "headings", label: "Headings" }, { value: "captions", label: "Captions" }];
    const targets = { bookmarks: bookmarks.map(bookmark => ({ value: bookmark.name, label: `${bookmark.name} — ${bookmark.paragraph.text.slice(0, 60)}` })), headings: headings.map(paragraph => ({ value: paragraph.id, label: paragraph.text })), captions: captions.map(paragraph => ({ value: paragraph.id, label: `${paragraph.caption!.label} ${paragraph.caption!.number}: ${paragraph.text}` })) };
    const kind = choices.find(choice => targets[choice.value as keyof typeof targets].length)?.value as keyof typeof targets | undefined;
    if (!kind) { report("Add a heading, caption or bookmark to reference first."); return; }
    return form("Cross-reference", [{ name: "kind", label: "Reference type", value: kind, choices }, { name: "target", label: "Reference target", value: targets[kind][0]!.value, choices: targets[kind] }, { name: "field", label: "Insert reference to", value: "reference", choices: [{ value: "reference", label: "Target text" }, { value: "pageReference", label: "Page number" }] }, { name: "link", label: "Insert as hyperlink", value: "yes", choices: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }], values => {
      const point = requireSelection().end;
      return result.execute({ kind: "field", field: values.field as "reference" | "pageReference", ...(values.kind === "bookmarks" ? { bookmark: values.target! } : { targetId: values.target! }), hyperlink: values.link !== "no", selection: { start: point, end: point } });
    }, undefined, form => {
      const kind = form.elements.namedItem("kind") as HTMLSelectElement, target = form.elements.namedItem("target") as HTMLSelectElement;
      kind.addEventListener("change", () => { target.replaceChildren(...targets[kind.value as keyof typeof targets].map(value => new Option(value.label, value.value))); (form.querySelector('button[type="submit"]') as HTMLButtonElement).disabled = !target.options.length; });
    });
  }
  button("crossReference", "Cross-reference", showCrossReferences);
  button("insert:crossReference", "Cross-reference", showCrossReferences);


  function currentNote() {
    const paragraph = selection && doc?.content.get(selection.start.paragraphId);
    return paragraph && doc!.content.within(paragraph).closest("story").first()?.note;
  }
  function orderedNotes() {
    const content = requireDocument().content, indices = new Map(content.paragraphs().all().map((paragraph, index) => [paragraph.id, index]));
    return content.stories().all().filter(story => story.note).sort((a, b) => indices.get(a.note!.reference.start.paragraphId)! - indices.get(b.note!.reference.start.paragraphId)! || a.note!.reference.start.offset - b.note!.reference.start.offset);
  }
  function showNote(story: import("@onodocs/sdk").DocumentStory): void {
    const paragraph = requireDocument().content.within(story).paragraphs().first();
    if (paragraph) { const point = { paragraphId: paragraph.id, offset: paragraph.text.length }; result.select({ start: point, end: point }); report(`${story.story === "footnote" ? "Footnote" : "Endnote"} ${story.note?.marker ?? ""}`); }
  }
  for (const [kind, label] of [["footnote", "Footnote"], ["endnote", "Endnote"]] as const) {
    button(`note:${kind}`, `Insert ${label}`, () => form(`Insert ${label.toLowerCase()}`, [{ name: "text", label: "Note text", value: "" }], async values => {
      const point = requireSelection().end;
      await result.execute({ kind: "note", noteKind: kind, text: values.text ?? "", selection: { start: point, end: point } });
      const inserted = requireSelection().start;
      const story = requireDocument().content.stories().all().find(story => story.story === kind && story.note?.reference.start.paragraphId === inserted.paragraphId && story.note.reference.start.offset === inserted.offset); if (story) showNote(story);
    }, undefined, form => { const field = form.elements.namedItem("text") as HTMLInputElement, area = document.createElement("textarea"); area.name = "text"; area.className = "shape-text"; field.replaceWith(area); }));
    button(`note:next${label}`, `Next ${label}`, async () => {
      const stories = orderedNotes().filter(story => story.story === kind), current = currentNote();
      const content = requireDocument().content, paragraph = selection && content.get(selection.start.paragraphId);
      let index = current && paragraph?.story === kind ? stories.findIndex(story => story.note!.id === current.id) + 1 : 0;
      if (!current && selection && paragraph?.story === "body") {
        const indices = new Map(content.paragraphs().all().map((paragraph, index) => [paragraph.id, index])), at = indices.get(selection.start.paragraphId)!;
        index = stories.findIndex(story => indices.get(story.note!.reference.start.paragraphId)! > at || indices.get(story.note!.reference.start.paragraphId) === at && story.note!.reference.start.offset > selection!.start.offset);
      }
      const story = stories[Math.max(0, index) % stories.length]; if (story) showNote(story);
    });
  }
  button("note:return", "Return to Reference", async () => { const note = currentNote(); if (note) result.select(note.reference); });
  button("note:show", "Show Notes", () => {
    const stories = orderedNotes();
    return form("Show notes", [{ name: "story", label: "Note", value: stories[0]?.id ?? "", choices: stories.map(story => ({ value: story.id, label: `${story.story === "footnote" ? "Footnote" : "Endnote"} ${story.note!.marker}: ${requireDocument().content.within(story).text.slice(0, 70)}` })) }], async values => { const story = stories.find(story => story.id === values.story); if (story) showNote(story); });
  });
  button("note:settings", "Footnote & Endnote Settings", () => {
    const settings = requireDocument().content.noteSettings().all(), note = currentNote(), selection = note?.reference ?? requireSelection();
    const kind = note && requireDocument().content.get(requireSelection().start.paragraphId)?.story === "endnote" ? "endnote" : "footnote", initial = settings.find(value => value.kind === kind)!;
    return form("Footnotes and endnotes", [{ name: "kind", label: "Notes", value: kind, choices: [{ value: "footnote", label: "Footnotes" }, { value: "endnote", label: "Endnotes" }] }, { name: "format", label: "Number format", value: initial.numberFormat, choices: [{ value: "decimal", label: "1, 2, 3" }, { value: "lowerRoman", label: "i, ii, iii" }, { value: "upperRoman", label: "I, II, III" }, { value: "lowerLetter", label: "a, b, c" }, { value: "upperLetter", label: "A, B, C" }, { value: "chicago", label: "*, †, ‡" }] }, { name: "start", label: "Start at", type: "number", min: "1", step: "1", value: String(initial.start) }], values => result.execute({ kind: "noteSettings", noteKind: values.kind as "footnote" | "endnote", numberFormat: values.format as typeof initial.numberFormat, start: Number(values.start), selection }), undefined, form => {
      const kind = form.elements.namedItem("kind") as HTMLSelectElement, format = form.elements.namedItem("format") as HTMLSelectElement, start = form.elements.namedItem("start") as HTMLInputElement;
      kind.addEventListener("change", () => { const value = settings.find(value => value.kind === kind.value)!; format.value = value.numberFormat; start.value = String(value.start); });
    });
  });
  button("readAloud", "Read Aloud", async () => {
    const doc = requireDocument(), all = paragraphs(), range = selection;
    const selected = selectedCells ? selectedTable().cells.flatMap(cell => doc.content.within(cell).paragraphs().all().map(paragraph => paragraph.text)) : range && !collapsed(range) ? all.slice(all.findIndex(p => p.id === range.start.paragraphId), all.findIndex(p => p.id === range.end.paragraphId) + 1).map(p => p.text.slice(p.id === range.start.paragraphId ? range.start.offset : 0, p.id === range.end.paragraphId ? range.end.offset : p.text.length)) : [];
    setMobileTools(false); readAloud?.close();
    readAloud = showReadAloud(root, doc.content.paragraphs().all().filter(p => p.story === "body").map(p => p.text), selected, lifetime.signal, focus);
  });
  button("wordCount", "Word count", () => {
    const doc = requireDocument(), all = paragraphs(), range = selection, selected = !!selectedCells || !!range && !collapsed(range);
    const selectedParagraphs = selectedCells ? selectedTable().cells.flatMap(cell => doc.content.within(cell).paragraphs().all().map(paragraph => paragraph.text)) : range && !collapsed(range) ? all.slice(all.findIndex(p => p.id === range.start.paragraphId), all.findIndex(p => p.id === range.end.paragraphId) + 1).map(p => p.text.slice(p.id === range.start.paragraphId ? range.start.offset : 0, p.id === range.end.paragraphId ? range.end.offset : p.text.length)) : [];
    const words = new Intl.Segmenter(undefined, { granularity: "word" });
    return form("Word count", [{ name: "scope", label: "Count", value: selected ? "selection" : "document", choices: [{ value: "document", label: "Document body" }, ...(selected ? [{ value: "selection", label: "Selection" }] : [])] }, { name: "notes", label: "Include text boxes, footnotes and endnotes", type: "checkbox", value: "true" }], undefined, undefined, form => {
      const scope = form.elements.namedItem("scope") as HTMLSelectElement, notes = form.elements.namedItem("notes") as HTMLInputElement, table = document.createElement("table"); table.className = "document-statistics"; table.setAttribute("aria-label", "Document statistics"); form.append(table);
      const update = () => {
        const paragraphs = scope.value === "selection" ? selectedParagraphs : all.filter(p => p.story === "body" || notes.checked && ["textbox", "footnote", "endnote"].includes(p.story ?? "")).map(p => p.text);
        const text = paragraphs.join("\n"); let wordCount = 0, characters = 0, withoutSpaces = 0;
        for (const part of words.segment(text)) if (part.isWordLike) wordCount++;
        for (const { segment } of segmenter.segment(text)) if (segment !== "\n" && segment !== "\r") { characters++; if (!/^\s+$/u.test(segment)) withoutSpaces++; }
        const values = [...(layoutMode === "print" ? [["Pages in document", doc.pages.length]] : []), ["Words", wordCount], ["Characters (with spaces)", characters], ["Characters (without spaces)", withoutSpaces], ["Paragraphs", paragraphs.length]];
        table.replaceChildren(...values.map(([name, value]) => { const row = document.createElement("tr"), label = document.createElement("th"), count = document.createElement("td"); label.scope = "row"; label.textContent = String(name); count.textContent = Number(value).toLocaleString(); row.append(label, count); return row; })); notes.disabled = scope.value === "selection";
      };
      scope.addEventListener("change", update); notes.addEventListener("change", update); update();
    });
  });
  const headerVariants = [{ value: "default", label: "Default / odd pages" }, { value: "first", label: "First page" }, { value: "even", label: "Even pages" }];
  function bodySectionParagraph(index: number) { const paragraph = requireDocument().content.paragraphs().all().find(value => value.sectionIndex === index && value.parent?.kind === "story"); if (!paragraph) throw new Error("This section has no editable body paragraph."); return paragraph; }
  async function editHeaderFooter(kind: "header" | "footer", variant: "default" | "first" | "even", index: number): Promise<void> {
    if (layoutMode !== "print") await changeLayout("print");
    headerFooterSectionIndex = index;
    const doc = requireDocument(), slot = doc.content.sections().all().find(section => section.index === index)?.headersFooters.find(value => value.kind === kind && value.variant === variant), story = slot?.storyId && doc.content.get(slot.storyId);
    const paragraph = story && doc.content.within(story).paragraphs().first();
    if (!paragraph) throw new Error("This header/footer has no editable paragraph.");
    if (!doc.geometry.fragments(paragraph).length) {
      await form(`Edit ${variant} ${kind}`, [{ name: "text", label: "First paragraph", value: paragraph.text }], async values => { await result.execute({ kind: "replace", selection: paragraph.selection, text: values.text ?? "", paragraphBreaks: false }); const body = bodySectionParagraph(index); result.select({ start: body.selection.start, end: body.selection.start }); }, undefined, form => { const hint = document.createElement("small"); hint.textContent = "No current page displays this variant. Edit its first paragraph here, or add a matching page for rich editing."; form.querySelector("h2")!.after(hint); }); return;
    }
    result.select({ start: paragraph.selection.start, end: paragraph.selection.start }); selectRibbon("Header & Footer");
  }
  function headerFooterDialog(kind: "header" | "footer"): Promise<void> {
    const index = selectedSectionIndex() ?? 0, section = requireDocument().content.sections().all().find(section => section.index === index)!, page = section.properties.authored;
    const current = selection && requireDocument().content.get(selection.start.paragraphId), story = current && requireDocument().content.within(current).closest("story").first();
    const currentVariant = section.headersFooters.find(value => value.kind === kind && value.storyId === story?.id)?.variant ?? "default";
    return form(kind === "header" ? "Header" : "Footer", [
      { name: "variant", label: "Pages", value: currentVariant, choices: headerVariants },
      { name: "action", label: "Action", value: "ensure", choices: [{ value: "ensure", label: "Edit content" }, { value: "remove", label: "Remove content" }, ...(index ? [{ value: "link", label: "Link to previous section" }, { value: "unlink", label: "Unlink from previous section" }] : [])] },
      { name: "distance", label: `${kind === "header" ? "Header from top" : "Footer from bottom"} (points)`, type: "number", min: "0", value: String((kind === "header" ? page.headerDistance : page.footerDistance) ?? 36) },
      { name: "first", label: "Different first page", type: "checkbox", value: String(page.differentFirstPage ?? false) },
      { name: "even", label: "Different odd and even pages (whole document)", type: "checkbox", value: String(page.differentOddEvenPages ?? false) },
    ], async values => {
      const variant = values.variant as "default" | "first" | "even", action = values.action as "ensure" | "remove" | "link" | "unlink", paragraph = bodySectionParagraph(index);
      const distance = Number(values.distance), first = values.first === "true" || variant === "first", even = values.even === "true" || variant === "even";
      const pagePatch = { ...(distance !== ((kind === "header" ? page.headerDistance : page.footerDistance) ?? 36) ? kind === "header" ? { headerDistance: distance } : { footerDistance: distance } : {}), ...(first !== page.differentFirstPage ? { differentFirstPage: first } : {}), ...(even !== page.differentOddEvenPages ? { differentOddEvenPages: even } : {}) };
      const commands: import("@onodocs/sdk").SingleDocumentEdit[] = [];
      if (Object.keys(pagePatch).length) commands.push({ kind: "page", selection: paragraph.selection, ...pagePatch });
      if (action !== "ensure" || !section.headersFooters.some(slot => slot.kind === kind && slot.variant === variant && slot.storyId)) commands.push({ kind, action, variant, selection: paragraph.selection } as import("@onodocs/sdk").SingleDocumentEdit);
      if (commands.length) await result.execute({ kind: "batch", commands });
      if (action !== "remove") await editHeaderFooter(kind, variant, index);
      else { const body = bodySectionParagraph(index); result.select({ start: body.selection.start, end: body.selection.start }); }
    }, undefined, form => {
      const status = document.createElement("small"), variant = form.elements.namedItem("variant") as HTMLSelectElement;
      const show = () => { const slot = section.headersFooters.find(value => value.kind === kind && value.variant === variant.value); status.textContent = `Section ${index + 1} · ${slot?.linkedToPrevious ? "Linked to previous section" : "Independent content"}`; };
      variant.addEventListener("change", show); show(); form.querySelector("h2")!.after(status);
    });
  }
  for (const kind of ["header", "footer"] as const) { button(kind, kind === "header" ? "Header" : "Footer", () => headerFooterDialog(kind)); button(`hf:${kind}`, kind === "header" ? "Header settings" : "Footer settings", () => headerFooterDialog(kind)); }
  button("closeHeaderFooter", "Close Header & Footer", async () => { const paragraph = bodySectionParagraph(selectedSectionIndex() ?? headerFooterSectionIndex ?? 0); result.select({ start: paragraph.selection.start, end: paragraph.selection.start }); selectRibbon("Home"); });
  for (const [name, kind] of [["goHeader", "header"], ["goFooter", "footer"]] as const) button(name, kind === "header" ? "Go to Header" : "Go to Footer", async () => { const index = selectedSectionIndex() ?? 0, paragraph = bodySectionParagraph(index); await result.execute({ kind, action: "ensure", variant: "default", selection: paragraph.selection } as EditorCommand); await editHeaderFooter(kind, "default", index); });
  function pageNumberDialog(): Promise<void> {
    const index = selectedSectionIndex() ?? 0, section = requireDocument().content.sections().all().find(section => section.index === index)!, page = section.properties.authored;
    return form("Page number", [
      { name: "action", label: "Action", value: "insert", choices: [{ value: "insert", label: "Insert page number" }, { value: "format", label: "Format section numbering" }, { value: "remove", label: "Remove page numbers" }] },
      { name: "kind", label: "Position", value: "footer", choices: [{ value: "header", label: "Top of page" }, { value: "footer", label: "Bottom of page" }] },
      { name: "variant", label: "Pages", value: "default", choices: headerVariants },
      { name: "alignment", label: "Alignment", value: "center", choices: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] },
      { name: "format", label: "Number format", value: page.pageNumberFormat ?? "decimal", choices: [{ value: "decimal", label: "1, 2, 3" }, { value: "lowerRoman", label: "i, ii, iii" }, { value: "upperRoman", label: "I, II, III" }, { value: "lowerLetter", label: "a, b, c" }, { value: "upperLetter", label: "A, B, C" }] },
      { name: "restart", label: "Start at", type: "checkbox", value: String(page.pageNumberStart != null) },
      { name: "start", label: "Starting number", type: "number", min: "0", step: "1", value: String(page.pageNumberStart ?? 1) },
      { name: "total", label: "Include total pages (1 / 5)", type: "checkbox", value: "false" },
    ], async values => {
      const paragraph = bodySectionParagraph(index), variant = values.variant as "default" | "first" | "even", kind = values.kind as "header" | "footer";
      if (values.action === "remove") { await result.execute({ kind, action: "removePageNumbers", variant, selection: paragraph.selection }); const body = bodySectionParagraph(index); result.select({ start: body.selection.start, end: body.selection.start }); return; }
      const commands: import("@onodocs/sdk").SingleDocumentEdit[] = [{ kind: "page", selection: paragraph.selection, pageNumberStart: values.restart === "true" ? Number(values.start) : null, pageNumberFormat: values.format as "decimal", ...(variant === "first" ? { differentFirstPage: true } : variant === "even" ? { differentOddEvenPages: true } : {}) }];
      if (values.action === "insert") commands.push({ kind, action: "pageNumber", variant, selection: paragraph.selection, alignment: values.alignment as "left" | "center" | "right", includeTotal: values.total === "true" } as import("@onodocs/sdk").SingleDocumentEdit);
      await result.execute({ kind: "batch", commands });
      if (values.action === "insert") await editHeaderFooter(kind, variant, index);
    }, undefined, form => { form.classList.add("wide-form"); const restart = form.elements.namedItem("restart") as HTMLInputElement, start = form.elements.namedItem("start") as HTMLInputElement; const action = form.elements.namedItem("action") as HTMLSelectElement;
      const sync = () => { start.disabled = !restart.checked; for (const name of ["kind", "variant", "alignment", "format", "restart", "start", "total"]) { const input = form.elements.namedItem(name) as HTMLInputElement; input.closest("label")!.hidden = action.value === "remove" ? !["kind", "variant"].includes(name) : action.value === "format" ? !["format", "restart", "start"].includes(name) : false; } };
      restart.addEventListener("change", sync); action.addEventListener("change", sync); sync(); });
  }
  button("pageNumber", "Page number", pageNumberDialog); button("hf:pageNumber", "Page number", pageNumberDialog);
  function selectedSectionIndex(): number | undefined {
    if (!doc || !selection) return;
    const paragraph = doc.content.get(selection.start.paragraphId);
    if (paragraph?.kind !== "paragraph") return;
    if (paragraph.sectionIndex !== undefined) return paragraph.sectionIndex;
    const story = doc.content.within(paragraph).closest("story").first();
    const sections = doc.content.sections().all().filter(section => section.headersFooters.some(slot => slot.storyId === story?.id));
    return sections.find(section => section.index === headerFooterSectionIndex)?.index ?? sections[0]?.index;
  }
  function closeSelectionPane(): void { selectionPane?.dispose(); selectionPane = undefined; updateToolbar(); focus(); }
  button("selectionPane", "Selection Pane", async () => {
    if (selectionPane) { closeSelectionPane(); return; }
    reviewPanel?.hide();
    navigationPane?.element.remove(); navigationPane = undefined;
    stylePane?.remove(); stylePane = undefined; styleList = undefined; styleFilter = undefined; host.removeAttribute("data-styles-pane");
    selectionPane = createSelectionPane(requireDocument, () => activeView(), () => selectedImage ?? selectedDrawing, () => Math.max(0, toolbar.getBoundingClientRect().bottom, preview.getBoundingClientRect().top), (id, pageIndex) => {
      const document = requireDocument(), object = document.content.get(id); if (!object || object.kind !== "image" && object.kind !== "drawing") return;
      const paragraph = document.content.within(object).closest("paragraph").first();
      if (!paragraph) return;
      const caret = { paragraphId: paragraph.id, offset: 0 }; selection = { start: caret, end: caret }; selectedCells = undefined; focus(false);
      selectedImage = object.kind === "image" ? id : undefined; selectedDrawing = object.kind === "drawing" ? id : undefined;
      outlineSelection(); updateToolbar(); const fragments = document.geometry.fragments(object), fragment = fragments.find(fragment => fragment.pageIndex === pageIndex) ?? fragments[0]; if (fragment) { activeView()?.scrollTo(fragment.pageIndex); activeView()?.scrollTo(fragment); }
      if (mode === "edit") { if (object.kind === "image") selectRibbon("Picture Format"); else if (object.shape || object.group) selectRibbon("Shape Format"); }
      report(object.kind === "image" ? mode === "edit" ? "Picture selected. Use Picture Format to edit it." : "Picture selected." : "Drawing selected.");
    }, () => controls.get("arrange:align")!.click(), () => mode === "edit", closeSelectionPane);
    root.append(selectionPane.element); updateToolbar(); selectionPane.focus();
  });
  function closeNavigation(): void { navigationPane?.element.remove(); navigationPane = undefined; host.removeAttribute("data-navigation-pane"); updateToolbar(); focus(); }
  async function openNavigation(search = false): Promise<void> {
    if (outlineView) closeOutline();
    reviewPanel?.hide();
    if (!navigationPane) {
      selectionPane?.dispose(); selectionPane = undefined;
      stylePane?.remove(); stylePane = undefined; styleList = undefined; styleFilter = undefined; host.removeAttribute("data-styles-pane");
      navigationPane = createNavigationPane(requireDocument, () => activeView(), range => result.select(range), closeNavigation);
      root.append(navigationPane.element); host.setAttribute("data-navigation-pane", ""); updateToolbar();
    }
    if (search) navigationPane.focusSearch();
  }
  button("find", "Find", () => openNavigation(true));
  button("navigationPane", "Navigation pane", async () => { if (navigationPane) closeNavigation(); else await openNavigation(); });
  button("replace", "Replace", () => form("Replace all", [{ name: "text", label: "Search text" }, { name: "replacement", label: "Replacement" }], v => result.replaceAll(v.text ?? "", v.replacement ?? "")));
  if (options.review) {
    button("review", "Show comments", async () => reviewPanel?.show("comments"));
    button("review:newComment", "New comment", async () => reviewPanel?.newComment());
    button("review:insertComment", "Comment", async () => reviewPanel?.newComment());
    button("review:deleteComment", "Delete comment", async () => reviewPanel?.deleteComment());
    select("review:display", "Display for review", [{ value: "markup", label: "All markup" }, { value: "accepted", label: "No markup" }, { value: "original", label: "Original" }], value => result.setReviewDisplay(value as "accepted" | "markup" | "original"));
    button("review:markers", "Show comment markers", () => result.setReviewDisplay(reviewDisplay, !reviewComments));
    button("review:filters", "Review filters", () => {
      const filters = reviewPanel!.filters, authors = [...new Set([...(reviewPanel?.state?.comments ?? []), ...(reviewPanel?.state?.revisions ?? [])].map(item => item.author))].sort();
      return form("Review filters", [
        { name: "author", label: "Reviewer", value: filters.author === undefined ? "" : `author:${filters.author}`, choices: [{ value: "", label: "All reviewers" }, ...authors.map(value => ({ value: `author:${value}`, label: value || "Unnamed reviewer" }))] },
        { name: "type", label: "Change type", value: filters.type, choices: [{ value: "all", label: "All changes" }, { value: "text", label: "Insertions and deletions" }, { value: "moves", label: "Moves" }, { value: "format", label: "Formatting" }] },
        { name: "resolved", label: "Include resolved comments", type: "checkbox", value: String(filters.resolved) }
      ], values => reviewPanel!.setFilters(values.author ? values.author.slice(7) : undefined, values.type!, values.resolved === "true"));
    });
    for (const accept of [true, false]) button(accept ? "review:accept" : "review:reject", accept ? "Accept changes" : "Reject changes", () => form(accept ? "Accept changes" : "Reject changes", [
      { name: "scope", label: "Apply to", value: "next", choices: [{ value: "next", label: "Current change and move to next" }, { value: "current", label: "Current change" }, { value: "shown", label: "All changes shown by filters" }, { value: "all", label: "All document changes" }] }
    ], values => reviewPanel!.decide(accept, values.scope as "current" | "next" | "shown" | "all")));

    for (const [kind, label] of [["comment", "Comment"], ["change", "Change"]] as const) for (const [direction, step] of [["previous", -1], ["next", 1]] as const) button(`review:${direction}${label}`, `${direction === "previous" ? "Previous" : "Next"} ${kind}`, async () => reviewPanel?.navigate(kind, step));
    button("review:tracking", "Track changes", async () => { const state = await requireDocument().readReview(); await result.review({ kind: "trackChanges", enabled: !state.tracking }); });
    button("review:changes", "Show changes", async () => reviewPanel?.show("changes"));
    button("review:acceptAll", "Accept all changes", () => result.review({ kind: "revision", accept: true }));
    button("review:rejectAll", "Reject all changes", () => result.review({ kind: "revision", accept: false }));
    button("review:compare", "Compare documents", async () => reviewPanel?.show("compare"));
    if (options.review.history) button("review:history", "Version history", async () => reviewPanel?.show("history"));
  }
  for (const command of options.commands ?? []) button(command.id, command.label, async () => { if (!(command.modes ?? ["edit"]).includes(mode)) throw new Error("This command is unavailable in the current mode."); await command.execute(result); });
  select("mode", "Document mode", allowedModes.map(value => ({ value, label: modeLabels[value] })), async value => { try { await result.setMode(value as EditorMode); } finally { controls.get("mode")!.value = mode; } });
  const shortcuts: Readonly<Record<string, string>> = { bold: "Ctrl+B", italic: "Ctrl+I", underline: "Ctrl+U", undo: "Ctrl+Z", redo: "Ctrl+Y" };
  const toolLabels: Readonly<Record<string, string>> = {
    zoomReset: "Reset", new: "New", open: "Open", save: "Save Word", pdf: "Export PDF", table: "Table", image: "Pictures", page: "Page setup", imageTools: "Size & properties", drawTable: "Draw table", pageBreak: "Page break", textBox: "Text box", pageNumber: "Page number", quickParts: "Quick Parts", dateTime: "Date & time", dropCap: "Drop cap",
    "design:theme": "Themes", "design:styles": "Style set", "design:colors": "Colors", "design:fonts": "Fonts", "design:spacing": "Paragraph spacing", "design:effects": "Effects", "design:default": "Set as default", "design:watermark": "Watermark", "design:color": "Page color", "design:borders": "Page borders",
    contents: "Contents", caption: "Caption", figures: "Table of figures", "note:footnote": "Footnote", "note:endnote": "Endnote", "note:show": "Show notes", "bibliography:citation": "Insert citation", "bibliography:sources": "Sources", "bibliography:insert": "Bibliography",
    "merge:start": "Start merge", "merge:recipients": "Recipients", "merge:edit": "Edit recipients", "merge:finish": "Finish merge", "merge:address": "Address block", "merge:field": "Insert field", "merge:greeting": "Greeting line", "merge:rules": "Rules", "merge:highlight": "Highlight fields", "merge:match": "Match fields", "merge:preview": "Preview results", "merge:find": "Find recipient", "merge:check": "Check errors",
    "table:insertRowBefore": "Insert above", "table:insertRow": "Insert below", "table:insertColumnBefore": "Insert left", "table:insertColumn": "Insert right", "table:insertDialog": "Insert cells…", "table:deleteMenu": "Delete", "table:rowSplit": "Allow splitting", "table:cellMargins": "Margins", "table:textDirection": "Direction", "table:sort": "Sort", "table:mergeCells": "Merge cells", "table:unmergeCells": "Unmerge", "table:splitCells": "Split cells", "table:split": "Split table", "table:distributeRows": "Distribute rows", "table:distributeColumns": "Distribute columns", "table:properties": "Properties", "table:rowHeight": "Height", "table:columnWidth": "Width", "table:cellSize": "Cell size…", "table:repeatHeader": "Repeat header", "table:borderPainter": "Border painter",
    "review:compare": "Compare", "review:accept": "Accept", "review:reject": "Reject", "review:changes": "Reviewing pane", "review:deleteComment": "Delete", "review:markers": "Comment markers", "review:newComment": "New comment", "review:history": "History", "writing:check": "Spelling", "writing:synonyms": "Thesaurus", accessibility: "Accessibility", review: "Comments",
    "view:read": "Read mode", "view:print": "Print layout", "view:web": "Web layout", "view:dark": "Dark mode", "view:horizontal": "Side to side", "view:gridlines": "Gridlines", navigationPane: "Navigation", "view:sideBySide": "Side by side", "view:syncScroll": "Sync scrolling", "view:multiple": "Multiple pages",
    "shape:fill": "Fill", "shape:outline": "Outline", "shape:effects": "Effects", "shape:preset": "Change shape", "shape:delete": "Delete", "shape:wordArt": "WordArt", "shape:text": "Edit text", "shape:textBox": "Text box settings", "shape:properties": "Size & properties", "picture:replace": "Change picture", "picture:delete": "Delete", "picture:effects": "Effects",
    "hf:header": "Header settings", "hf:footer": "Footer settings", "hf:pageNumber": "Page number", closeHeaderFooter: "Close header & footer",
    "chart:data": "Edit data", "chart:type": "Chart type", "chart:series": "Format series", "chart:labels": "Data labels", "chart:axes": "Format axes", "chart:properties": "Properties", "chart:delete": "Delete chart",
  };
  const menuDefinitions: Readonly<Record<string, Readonly<{ label: string; icon: string; commands: readonly string[] }>>> = {
    "ribbon:pages": { label: "Pages", icon: "blankPage", commands: ["coverPage", "blankPage", "pageBreak"] },
    "ribbon:insertText": { label: "More text", icon: "quickParts", commands: ["quickParts", "wordArt", "dropCap", "dateTime"] },
    "ribbon:layout": { label: "More layout", icon: "page", commands: ["page", "lineNumbers", "hyphenation", "pagination", "tabs"] },
    "ribbon:arrange": { label: "Arrange", icon: "picture:align", commands: ["arrange:align", "arrange:rotate", "arrange:forward", "arrange:front", "arrange:backward", "arrange:back", "arrange:group", "arrange:ungroup", "arrange:size"] },
    "ribbon:updateTables": { label: "Update", icon: "contents:update", commands: ["contents:update", "figures:update"] },
    "ribbon:notes": { label: "Note options", icon: "note:settings", commands: ["note:settings", "note:nextFootnote", "note:nextEndnote", "note:return"] },
    "ribbon:citations": { label: "Manage citations", icon: "bibliography:editCitation", commands: ["bibliography:editCitation", "bibliography:update", "bibliography:remove"] },
    "ribbon:markup": { label: "Markup", icon: "review:filters", commands: ["review:filters", "review:markers", "review:changes"] },
    "ribbon:window": { label: "Window", icon: "view:sideBySide", commands: ["view:split", "view:sideBySide", "view:syncScroll"] },
    "ribbon:tableTools": { label: "Table tools", icon: "tableTools", commands: ["table:drawTable", "table:eraser", "table:gridlines", "table:properties"] },
    "ribbon:tableInsert": { label: "Insert", icon: "table:insertRow", commands: ["table:insertRowBefore", "table:insertRow", "table:insertColumnBefore", "table:insertColumn", "table:insertDialog"] },
    "ribbon:tableDistribute": { label: "Distribute", icon: "table:distributeRows", commands: ["table:distributeRows", "table:distributeColumns"] },
    "ribbon:tableAlignment": { label: "Align", icon: "table:align:center:left", commands: ["top", "center", "bottom"].flatMap(vertical => ["left", "center", "right"].map(horizontal => `table:align:${vertical}:${horizontal}`)) },
    "ribbon:tableOptions": { label: "Options", icon: "table:properties", commands: ["table:rowSplit", "table:convertText", "table:cellSize"] },
    "ribbon:shapeOrder": { label: "Order", icon: "picture:forward", commands: ["shape:forward", "shape:front", "shape:backward", "shape:back"] },
    "ribbon:pictureOrder": { label: "Order", icon: "picture:forward", commands: ["picture:forward", "picture:front", "picture:backward", "picture:back"] },
  };
  for (const [name, menu] of Object.entries(menuDefinitions)) {
    const trigger = document.createElement("button"); trigger.type = "button"; trigger.textContent = menu.label; trigger.className = "ribbon-menu-trigger"; trigger.setAttribute("aria-haspopup", "dialog"); trigger.setAttribute("aria-expanded", "false"); controls.set(name, trigger);
  }
  const enabledTools = new Set(options.toolbar === false ? [] : options.toolbar ?? controls.keys());
  if (enabledTools.has("zoom")) for (const name of ["zoomOut", "zoomIn", "zoomReset"]) enabledTools.add(name);
  if (enabledTools.has("paste") || enabledTools.has("pasteText")) enabledTools.add("pasteOptions");
  if (enabledTools.has("style")) { enabledTools.add("styleGallery"); enabledTools.add("stylesPane"); }
  if (enabledTools.has("tableTools")) for (const name of controls.keys()) if (name.startsWith("table:")) enabledTools.add(name);
  if (enabledTools.has("review")) for (const name of controls.keys()) if (name.startsWith("review:")) enabledTools.add(name);
  for (const [name, menu] of Object.entries(menuDefinitions)) if (menu.commands.some(command => enabledTools.has(command) && controls.has(command))) enabledTools.add(name);
  function updateRibbonSelect(control: HTMLSelectElement): void {
    const icon = control.parentElement?.classList.contains("ribbon-icon-select") ? control.parentElement.querySelector("svg") : undefined;
    if (!icon) return;
    const name = control.dataset.command!;
    icon.innerHTML = editorIcons[`${name}:${control.value}`] ?? editorIcons[name]!;
    control.title = `${control.getAttribute("aria-label")}: ${control.selectedOptions[0]?.textContent ?? ""}`;
  }
  function appendTool(parent: HTMLElement, name: string, large = false): void {
    const control = controls.get(name); if (!control || !enabledTools.has(name)) return;
    const label = control.getAttribute("aria-label") ?? control.textContent ?? name;
    control.title = label + (shortcuts[name] ? ` (${shortcuts[name]})` : "");
    control.dataset.command = name;
    if (control instanceof HTMLButtonElement) {
      control.setAttribute("aria-label", label);
      const tableStyle = standardTableStyles.find(style => name === "table:style:" + style.id);
      const markup = ["fontDialog", "paragraph", "stylesPane"].includes(name) ? '<path d="M4 4h8M4 4v8M20 20h-8M20 20v-8M4 4l6 6M20 20l-6-6"/>' : tableStyle ? `<rect x="1" y="1" width="62" height="34" rx="1" fill="white" stroke="#aeb8c4"/><path fill="${tableStyle.filledHeader ? tableStyle.accent : "white"}" stroke="none" d="M2 2h60v8H2z"/><path fill="${tableStyle.band}" stroke="none" d="M2 18h60v8H2z"/><path stroke="${tableStyle.accent}" stroke-width="${tableStyle.grid ? 1 : .5}" d="M1 10h62M1 18h62M1 26h62M22 1v34M43 1v34"/>` : editorIcons[menuDefinitions[name]?.icon ?? mailings.find(command => command.id === name)?.icon ?? options.commands?.find(command => command.id === name)?.icon ?? options.commands?.find(command => command.id === name)?.ribbon?.icon ?? (name === "insert:crossReference" ? "crossReference" : name.startsWith("hf:") ? name.slice(3) : (name.startsWith("arrange:") || name.startsWith("shape:") && !editorIcons[name]) ? name.replace(/^(arrange|shape):/, "picture:") : name)] ?? (name.startsWith("table:") ? editorIcons.tableTools : name.startsWith("review:") ? editorIcons.review : undefined);
      if (markup) {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        for (const [key, value] of Object.entries({ viewBox: tableStyle ? "0 0 64 36" : "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" })) icon.setAttribute(key, value);
        icon.innerHTML = markup;
        control.replaceChildren(icon); if (tableStyle) control.classList.add("table-style-card");
        const labeled = ["paste", "pasteText"].includes(name) || large || name === "stylesPane" || name === "selectionPane" || name === "bookmark" || name === "find" || name === "replace" || name === "page" || name === "review" || name.startsWith("view:") || name.startsWith("review:") || name.startsWith("table:") || name.startsWith("hf:") || name.startsWith("note:") || name.startsWith("writing:") || (name.startsWith("picture:") || name.startsWith("arrange:") || name.startsWith("shape:")) || ["closeHeaderFooter", "goHeader", "goFooter", "symbol", "dateTime", "wordCount", "readAloud", "dictate", "protect", "language", "accessibility", "shapes", "textBox", "wordArt", "dropCap"].includes(name);
        if (labeled) { const text = document.createElement("span"); text.textContent = tableStyle?.name ?? toolLabels[name] ?? label; control.append(text); }
        if (["fontDialog", "paragraph", "stylesPane"].includes(name)) { control.querySelector("span")?.remove(); control.classList.add("icon-button"); }
        if (["merge:first", "merge:previous", "merge:number", "merge:next", "merge:last", "review:previousComment", "review:nextComment", "review:previousChange", "review:nextChange"].includes(name)) { control.querySelector("span")?.remove(); control.classList.add("icon-button"); }
        if (name.startsWith("table:align:")) { control.querySelector("span")?.remove(); control.classList.add("icon-button"); }
        if (!name.startsWith("table:align:") && (large || !labeled)) control.classList.add(large ? "large-button" : "icon-button");
      }
    }
    const menu = menuDefinitions[name];
    if (menu && control instanceof HTMLButtonElement) {
      const popup = document.createElement("div"); popup.className = "ribbon-menu ribbon-command-menu"; popup.popover = "auto"; popup.setAttribute("role", "dialog"); popup.setAttribute("aria-label", menu.label);
      if (name === "ribbon:tableAlignment") popup.classList.add("alignment-menu");
      for (const command of menu.commands) {
        appendTool(popup, command, true);
        const item = controls.get(command), text = item?.querySelector("span"); if (text) text.textContent = item!.getAttribute("aria-label");
      }
      root.append(popup); control.popoverTargetElement = popup;
      popup.addEventListener("beforetoggle", e => {
        if ((e as ToggleEvent).newState !== "open") return;
        const rect = control.getBoundingClientRect(); popup.style.left = Math.max(8, Math.min(rect.left, innerWidth - 260)) + "px"; popup.style.top = rect.bottom + 4 + "px";
      });
      popup.addEventListener("toggle", () => {
        const open = popup.matches(":popover-open"); control.setAttribute("aria-expanded", String(open)); if (!open && !root.activeElement) control.focus({ preventScroll: true });
        if (open) { const rect = popup.getBoundingClientRect(); popup.style.left = Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) + "px"; popup.style.top = Math.max(8, Math.min(rect.top, innerHeight - rect.height - 8)) + "px"; popup.querySelector<HTMLElement>("button:not(:disabled):not([hidden]),select:not(:disabled):not([hidden])")?.focus(); }
      });
      popup.addEventListener("click", e => { if (e.target instanceof Element && e.target.closest("button:not(:disabled)")) popup.hidePopover(); });
      popup.addEventListener("keydown", e => {
        const items = [...popup.querySelectorAll<HTMLElement>("button:not(:disabled):not([hidden]),select:not(:disabled):not([hidden])")], index = items.indexOf(root.activeElement as HTMLElement);
        if (e.key === "Escape") { e.preventDefault(); popup.hidePopover(); control.focus(); }
        else if (items.length && ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && !(e.target instanceof HTMLSelectElement)) {
          e.preventDefault(); const columns = name === "ribbon:tableAlignment" ? 3 : 1, step = e.key === "ArrowDown" ? columns : e.key === "ArrowUp" ? -columns : e.key === "ArrowLeft" ? -1 : 1;
          items[e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (index + step + items.length) % items.length]!.focus();
        }
      });
    }
    if (control instanceof HTMLSelectElement && ["alignment", "list", "lineSpacing"].includes(name)) {
      const field = document.createElement("span"), icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); field.className = "ribbon-icon-select";
      for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) icon.setAttribute(key, value);
      field.append(icon, control); parent.append(field); control.addEventListener("change", () => updateRibbonSelect(control)); updateRibbonSelect(control);
    } else if (!(control instanceof HTMLButtonElement) && name !== "mode") {
      const field = document.createElement("label"), caption = document.createElement("span");
      field.className = ["zoom", "indentStart", "indentEnd", "spacingBefore", "spacingAfter"].includes(name) ? "tool-field labeled-field" : "tool-field"; caption.textContent = name === "zoom" ? "%" : label; field.append(caption, control); parent.append(field);
    } else parent.append(control);
  }
  function selectRibbon(name: string, focusTab = false): void {
    if (focusTab) ribbonChoice++;
    activeRibbon = name;
    for (const [key, tab] of ribbonTabs) {
      const active = key === name && !tab.button.hidden;
      tab.button.setAttribute("aria-selected", String(active)); tab.button.tabIndex = active ? 0 : -1; tab.panel.hidden = !active;
      if (active && focusTab && !compact) { tab.button.focus({ preventScroll: true }); tab.button.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    }
    const available = [...ribbonTabs].filter(([, tab]) => !tab.button.hidden).map(([name]) => name);
    if (available.join("\n") !== [...mobileCategory.options].map(option => option.value).join("\n")) mobileCategory.replaceChildren(...available.map(name => new Option(name, name)));
    mobileCategory.value = name;
    mobileToolsToggle.hidden = !available.length;
    if (!available.length) setMobileTools(false);
    updateScrollClearance();
  }
  if (options.toolbar !== false) {
    const header = document.createElement("div"), quick = document.createElement("div"), tabs = document.createElement("div");
    header.className = "ribbon-header"; quick.className = "quick-access"; quick.setAttribute("role", "group"); quick.setAttribute("aria-label", "Quick access");
    for (const command of options.commands ?? []) if (command.quickAccess) appendTool(quick, command.id, true);
    appendTool(quick, "undo"); appendTool(quick, "redo");
    tabs.className = "ribbon-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Ribbon tabs");
    mobileToolsToggle.type = "button"; mobileToolsToggle.className = "mobile-tools-toggle"; mobileToolsToggle.setAttribute("aria-label", "Editor tools"); mobileToolsToggle.setAttribute("aria-controls", "ribbon-tools");
    mobileCategory.className = "mobile-tool-category"; mobileCategory.setAttribute("aria-label", "Tool category");
    ribbonTools.id = "ribbon-tools"; ribbonTools.className = "ribbon-tools"; ribbonTools.append(mobileCategory);
    mobileToolsToggle.addEventListener("click", () => {
      setMobileTools(!mobileToolsOpen);
      if (mobileToolsOpen) { input.blur(); mobileCategory.focus({ preventScroll: true }); }
      else { mobileToolsToggle.focus({ preventScroll: true }); focus(); }
    });
    mobileCategory.addEventListener("change", () => { ribbonChoice++; selectRibbon(mobileCategory.value); ribbonTools.scrollTop = 0; });
    setMobileTools(false);
    header.append(mobileToolsToggle, quick, tabs);
    if (options.allowedModes && allowedModes.length > 1 || options.protection) { enabledTools.add("mode"); appendTool(header, "mode"); }
    toolbar.append(header, ribbonTools);
    ruler = createRuler(toolbar, () => doc, () => activeView(), lifetime.signal, { selection: () => selection, enabled: () => mode === "edit" && !pending, tabs: () => controls.get("tabs")!.click(), apply: (command, document, snapshot) => event(async () => {
      if (doc !== document || document.snapshot() !== snapshot) throw new Error("The document changed. Try the ruler adjustment again.");
      await result.execute(command);
    }) });
    const definitions = [
      { name: "File", groups: [{ label: "Document", rows: [["new", "open", "save"], ["pdf", "print"]] }] },
      { name: "Home", groups: [{ label: "Clipboard", rows: [["paste", "cut", "copy"], ["pasteOptions", "formatPainter"]] }, { label: "Font", rows: [["font", "size", "growFont", "shrinkFont", "changeCase", "clearFormatting"], ["bold", "italic", "underline", "strike", "subscript", "superscript", "textEffects", "highlight", "color", "fontDialog"]] }, { label: "Paragraph", rows: [["list", "multilevelList", "decreaseIndent", "increaseIndent", "sort"], ["alignment", "lineSpacing", "paragraphShading", "paragraphBorders", "formattingMarks", "paragraph"]] }, { label: "Styles", rows: [["styleGallery", "stylesPane"]] }, { label: "Editing", rows: [["find", "replace"], ["selectText"]] }, { label: "Voice", rows: [["dictate"]] }, { label: "Editor", rows: [["writing:rewrite"]] }, { label: "Commands", rows: [(options.commands ?? []).filter(command => !command.ribbon && !command.quickAccess).map(command => command.id)] }] },
      { name: "Insert", groups: [{ label: "Pages & Tables", rows: [["ribbon:pages", "table"], ["drawTable"]] }, { label: "Illustrations", rows: [["image", "shapes", "chart"], ["screenshot", "icons", "diagram"]] }, { label: "Links & Headers", rows: [["link", "bookmark", "review:insertComment"], ["header", "footer", "pageNumber"]] }, { label: "Text & Symbols", rows: [["textBox", "ribbon:insertText", "equation"], ["insert:crossReference", "symbol"]] }] },
      { name: "Header & Footer", context: "closeHeaderFooter", groups: [{ label: "Header & Footer", rows: [["hf:header", "hf:footer", "hf:pageNumber"], ["goHeader", "goFooter", "closeHeaderFooter"]] }] },
      { name: "Design", groups: [{ label: "Theme", rows: [["design:theme", "design:colors", "design:fonts"], ["design:styles", "design:spacing", "design:effects"]] }, { label: "Page Background", rows: [["design:watermark", "design:color"], ["design:borders", "design:default"]] }] },
      { name: "Layout", groups: [{ label: "Page Setup", rows: [["pageMargins", "orientation", "paperSize"], ["breaks", "columns", "ribbon:layout"]] }, { label: "Paragraph", rows: [["indentStart", "spacingBefore"], ["indentEnd", "spacingAfter"]] }, { label: "Arrange", rows: [["arrange:position", "arrange:wrap"], ["selectionPane", "ribbon:arrange"]] }] },
      { name: "References", groups: [{ label: "Contents & Captions", rows: [["contents", "caption", "crossReference"], ["figures", "contents:level", "ribbon:updateTables"]] }, { label: "Footnotes", rows: [["note:footnote", "note:endnote"], ["note:show", "ribbon:notes"]] }, { label: "Citations & Bibliography", rows: [["bibliography:citation", "bibliography:sources", "bibliography:insert"], ["bibliography:style", "ribbon:citations"]] }] },
      { name: "Forms", groups: [{ label: "Design", rows: [["designer:form"], ["designer:template"]] }] },
      { name: "Mailings", groups: [{ label: "Mail Merge", rows: [["merge:start", "merge:recipients"], ["merge:edit", "merge:finish"]] }, { label: "Merge Fields", rows: [["merge:address", "merge:field", "merge:greeting"], ["merge:rules", "merge:highlight", "merge:match"]] }, { label: "Preview Results", rows: [["merge:preview", "merge:find", "merge:check"], ["merge:first", "merge:previous", "merge:number", "merge:next", "merge:last"]] }] },
      { name: "Review", groups: [{ label: "Proofing & Accessibility", rows: [["writing:check", "writing:synonyms", "wordCount"], ["language", "readAloud", "accessibility"]] }, { label: "Comments", rows: [["review:newComment", "review"], ["review:deleteComment", "review:previousComment", "review:nextComment"]] }, { label: "Tracking & Changes", rows: [["review:tracking", "review:display", "ribbon:markup"], ["review:accept", "review:reject", "review:previousChange", "review:nextChange"]] }, { label: "Compare & Protect", rows: [["review:compare", "review:history"], ["protect"]] }] },
      { name: "View", groups: [{ label: "Document Views", rows: [["view:read", "view:print", "view:web"], ["view:outline", "view:draft", "view:focus", "view:dark"]] }, { label: "Page & Visibility", rows: [["view:ruler", "view:gridlines", "navigationPane"], ["view:vertical", "view:horizontal", "ribbon:window"]] }, { label: "Zoom & Pages", rows: [["zoomOut", "zoom", "zoomIn", "zoomReset"], ["zoomPage", "zoomWidth", "view:multiple"]] }] },
      { name: "Table Design", context: "table:shading", groups: [{ label: "Table Style Options", rows: [["table:look:firstRow", "table:look:firstColumn", "table:look:bandedRows"], ["table:look:lastRow", "table:look:lastColumn", "table:look:bandedColumns"]] }, { label: "Table Styles", rows: [standardTableStyles.map(style => "table:style:" + style.id), ["table:style"]] }, { label: "Shading & Borders", rows: [["table:shading", "table:borderStyle", "table:borderWidth"], ["table:borders", "table:borderColor", "table:borderPainter"]] }] },
      { name: "Table Layout", context: "table:insertRow", groups: [{ label: "Table & Structure", rows: [["table:select", "ribbon:tableTools"], ["table:deleteMenu", "table:split"]] }, { label: "Rows & Columns", rows: [["ribbon:tableInsert", "table:rowHeight", "table:columnWidth"], ["table:autoFit", "ribbon:tableDistribute"]] }, { label: "Cells", rows: [["table:mergeCells", "table:splitCells", "table:unmergeCells"], ["ribbon:tableAlignment", "table:textDirection", "table:cellMargins"]] }, { label: "Data & Options", rows: [["table:sort", "table:formula"], ["table:repeatHeader", "ribbon:tableOptions"]] }] },
      { name: "Chart Design", context: "chart:properties", groups: [{ label: "Chart Data", rows: [["chart:data", "chart:type"], ["chart:series", "chart:properties"]] }, { label: "Chart Elements", rows: [["chart:labels", "chart:axes"], ["chart:delete"]] }] },
      { name: "Shape Format", context: "shape:properties", groups: [{ label: "Shape & Text", rows: [["shape:fill", "shape:outline", "shape:effects", "shape:preset", "shape:delete"], ["shape:wordArt", "shape:text", "shape:textBox", "shape:properties"]] }, { label: "Arrange", rows: [["shape:position", "shape:wrap", "shape:align"], ["shape:rotate", "ribbon:shapeOrder", "shape:group", "shape:ungroup"]] }] },
      { name: "Picture Format", context: "imageTools", groups: [{ label: "Picture", rows: [["picture:replace", "picture:effects", "picture:delete"], ["picture:crop", "picture:resetCrop", "imageTools"]] }, { label: "Arrange", rows: [["picture:position", "picture:wrap", "picture:align"], ["picture:rotate", "ribbon:pictureOrder", "picture:group"]] }] },
    ];
    for (const command of options.commands ?? []) {
      if (!command.ribbon || command.quickAccess) continue;
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
      panel.id = `ribbon-panel-${id}`; panel.className = "ribbon-panel"; panel.dataset.ribbon = definition.name; panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id);
      panel.addEventListener("focusin", event => {
        if (!(event.target instanceof HTMLElement)) return;
        const control = event.target.getBoundingClientRect(), viewport = panel.getBoundingClientRect();
        if (control.left < viewport.left + 4) panel.scrollLeft += control.left - viewport.left - 4;
        else if (control.right > viewport.right - 4) panel.scrollLeft += control.right - viewport.right + 4;
      });
      tab.addEventListener("click", () => selectRibbon(definition.name, true));
      ribbonTabs.set(definition.name, { button: tab, panel, names, ...(definition.context ? { context: definition.context } : {}) });
      tabs.append(tab); ribbonTools.append(panel);
      for (const definitionGroup of definition.groups) {
        const group = document.createElement("div"), content = document.createElement("div"), caption = document.createElement("span");
        group.className = "tool-group"; group.setAttribute("role", "group"); group.setAttribute("aria-label", definitionGroup.label); content.className = "tool-content"; caption.className = "group-caption"; caption.textContent = definitionGroup.label;
        for (const names of definitionGroup.rows) {
          const row = document.createElement("div"); row.className = "tool-line";
          for (const name of names) {
            const launcher = definition.name === "Home" && ["fontDialog", "paragraph", "stylesPane"].includes(name);
            appendTool(launcher ? group : row, name, !launcher && definition.name !== "Home");
            if (launcher) controls.get(name)?.classList.add("group-launcher");
          }
          if (row.children.length) content.append(row);
        }
        if (content.children.length || group.children.length) { group.append(content, caption); panel.append(group); }
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
  function checkOperation(options?: EditorOperationOptions): void {
    options?.signal?.throwIfAborted();
    if (options?.ifUnchangedSince && requireDocument().snapshot() !== options.ifUnchangedSince || options?.mode && mode !== options.mode) throw new Error("The document or mode changed. Read the target again.");
  }
  const result: WordEditor = {
    get cellSelection() { if (!selectedCells || !doc) return undefined; const { tableIndex, ...range } = selectedCells; const table = doc.content.tables().at(tableIndex); return table ? { tableId: table.id, ...range } : undefined; },
    selectCells(value) {
      const document = requireDocument(), table = document.content.get(value.tableId);
      if (table?.kind !== "table") throw new RangeError("Cell selection requires a current table.");
      const { rowIndex, columnIndex, rowCount, columnCount } = value;
      if (![rowIndex, columnIndex, rowCount, columnCount].every(Number.isSafeInteger) || rowIndex < 0 || columnIndex < 0 || rowCount < 1 || columnCount < 1 || rowIndex + rowCount > table.rows.length) throw new RangeError("Choose a valid cell rectangle.");
      const rows = table.rows.slice(rowIndex, rowIndex + rowCount), end = columnIndex + columnCount;
      for (const row of rows) { const cells = row.cells.filter(cell => cell.columnIndex < end && cell.columnIndex + cell.columnSpan > columnIndex); if (!cells.length || cells[0]!.columnIndex !== columnIndex || cells.at(-1)!.columnIndex + cells.at(-1)!.columnSpan !== end) throw new RangeError("Include complete cells in every selected row."); }
      const cell = rows[0]!.cells.find(cell => cell.columnIndex === columnIndex)!, paragraph = cell.children.find((block): block is DocumentParagraph => block.kind === "paragraph") ?? document.content.within(cell).paragraphs().first();
      if (!paragraph) throw new RangeError("The selection has no editable paragraph.");
      const caret = { paragraphId: paragraph.id, offset: 0 }; selection = { start: caret, end: caret }; focus(); selectedDrawing = undefined; selectedImage = undefined;
      selectedCells = { tableIndex: document.content.tables().all().indexOf(table), rowIndex, columnIndex, rowCount, columnCount }; outlineSelection(); updateToolbar(); report(`${rowCount} rows × ${columnCount} columns selected.`);
    },
    get view() { return activeView(); },
    synchronize(load) { return enqueue(async () => {
      if (composing) return;
      const before = paragraphs(), range = selection;
      const next = await load();
      if (!next) return;
      const previousMode = mode;
      const editingText = root.activeElement === input;
      if (next.allowedModes) {
        const previous = [...allowedModes]; allowedModes.splice(0, allowedModes.length, ...next.allowedModes);
        try { if (!allowedModes.length) throw new Error("At least one mode is required."); for (const value of allowedModes) validateMode(value); }
        catch (error) { allowedModes.splice(0, allowedModes.length, ...previous); throw error; }
        if (!allowedModes.includes(mode)) mode = allowedModes[0]!;
        const control = controls.get("mode");
        if (control instanceof HTMLSelectElement) control.replaceChildren(...allowedModes.map(value => new Option(modeLabels[value], value)));
      }
      if (next.bytes) {
        const start = before.findIndex(p => p.id === range?.start.paragraphId), end = before.findIndex(p => p.id === range?.end.paragraphId);
        await mount(next.bytes); clearHistory(undo); clearHistory(redo); formatting = {};
        const all = paragraphs(), first = all[start], last = all[end];
        if (range && first && last) selection = { start: { paragraphId: first.id, offset: Math.min(range.start.offset, first.text.length) }, end: { paragraphId: last.id, offset: Math.min(range.end.offset, last.text.length) } };
      }
      outlineSelection(); updateToolbar();
      if (mode === previousMode) await reviewPanel?.refresh(); else await reviewPanel?.setMode();
      if (selection) activeView()?.setSelection(selection);
      syncInput();
      if (editingText && mode === "edit" && !root.activeElement && document.activeElement === document.body) input.focus({ preventScroll: true });
    }); },
    get mode() { return mode; }, get allowedModes() { return allowedModes; },
    async setMode(next, operation) {
      validateMode(next);
      if (composing) throw new Error("Finish composing text before changing mode.");
      await formPanel?.flush();
      return enqueue(async () => { checkOperation(operation); if (composing) throw new Error("Finish composing text before changing mode."); if (next === mode) return; mode = next; if (mode === "form") formPanel?.refresh(); input.value = ""; input.blur(); selectedDrawing = undefined; selectedImage = undefined; outlineSelection(); updateToolbar(); await reviewPanel?.setMode(); report(({ view: "Viewing document.", edit: "Editing document.", review: "Reviewing document.", form: "Filling designated answer regions." })[mode]); options.onModeChange?.(mode); });
    },
    fill(answers, operation) { return enqueue(() => { checkOperation(operation); return fill(answers); }); },
    answers() { if (!formDefinition) throw new Error("This editor has no form definition."); requireDocument(); return documentForm!.answers(); },
    async completeForm(operation) { await formPanel?.flush(); return enqueue(async () => { checkOperation(operation); if (mode !== "form" || !formDefinition) throw new Error("Completion requires form mode."); requireDocument(); return documentForm!.complete({ signal: operation?.signal ? AbortSignal.any([lifetime.signal, operation.signal]) : lifetime.signal }); }); },
    get reviewDisplay() { return reviewDisplay; },
    get reviewFilter() { return reviewFilter; },
    setReviewDisplay(display, comments, filter) { return enqueue(async () => {
      comments ??= reviewComments; filter ??= reviewFilter;
      if (!["accepted", "markup", "original"].includes(display)) throw new TypeError("Choose accepted, markup or original revision display.");
      if (display === reviewDisplay && comments === reviewComments && filter.author === reviewFilter.author && filter.revisionType === reviewFilter.revisionType) return;
      const previous = await snapshot(), previousDisplay = reviewDisplay, previousComments = reviewComments, previousExplicit = explicitReviewDisplay, previousFilter = reviewFilter, left = window.scrollX, top = window.scrollY;
      reviewDisplay = display; reviewComments = comments; reviewFilter = { ...filter }; explicitReviewDisplay = true;
      try { await restoreSnapshot(previous, false); } catch (error) { reviewDisplay = previousDisplay; reviewComments = previousComments; explicitReviewDisplay = previousExplicit; reviewFilter = previousFilter; throw error; }
      window.scrollTo(left, top); updateToolbar(); report(display === "markup" ? reviewFilter.author !== undefined || reviewFilter.revisionType !== undefined ? "Showing filtered revision markup." : "Showing all revision markup." : display === "original" ? "Showing the original document." : "Showing the document without revision markup.");
    }); },
    get document() { return doc; }, get selection() { return selection; }, element: host,
    open(bytes, name = "document.docx", operation) {
      opening?.abort();
      const controller = new AbortController(); opening = controller;
      const signal = operation?.signal ? AbortSignal.any([controller.signal, operation.signal]) : controller.signal;
      report("Opening document…");
      return enqueue(async () => {
        try {
          checkOperation(operation); signal.throwIfAborted();
          await mount(bytes, signal);
          signal.throwIfAborted();
          filename = name; clearHistory(undo); clearHistory(redo); formatting = {}; focus(operation?.scroll); report("Ready.");
        } catch (error) { signal.throwIfAborted(); throw error; }
        finally { if (opening === controller) opening = undefined; }
      }, true, signal);
    },
    restore(bytes, operation) { return enqueue(async () => { checkOperation(operation); editable(); const previous = await snapshot(); await mount(bytes); if (operation?.signal?.aborted) { await restoreSnapshot(previous, operation?.scroll); operation.signal.throwIfAborted(); } remember(undo, previous); clearHistory(redo); formatting = {}; focus(operation?.scroll); await changed({}); report("Version restored."); }); },
    newDocument(operation) { return enqueue(async () => { checkOperation(operation); if (mode !== "edit") throw new Error("Creating a document requires editing mode."); const signal = operation?.signal ? AbortSignal.any([lifetime.signal, operation.signal]) : lifetime.signal; await mount(await newDocumentBytes(signal), signal); filename = "document.docx"; clearHistory(undo); clearHistory(redo); formatting = {}; focus(operation?.scroll); report("Ready."); }); },
    execute(command, update, operation) { return enqueue(async () => { checkOperation(operation); const target = command && "selection" in command ? command.selection ?? operation?.selection : operation?.selection; if (target) selection = target; return apply(command, async () => { await update?.(); operation?.signal?.throwIfAborted(); }, operation?.scroll); }); },
    review(command, operation) { return enqueue(async () => {
      checkOperation(operation); requireDocument();
      if (mode !== "edit" && (mode !== "review" || !["comment", "reply", "resolveCommentThread", "deleteCommentThread", "revision"].includes(command.kind))) throw new Error("This review action is unavailable in the current mode.");
      const previous = await snapshot(), before = paragraphs();
      const change = await requireDocument().review(command);
      if (operation?.signal?.aborted) { await restoreSnapshot(previous, operation?.scroll); operation.signal.throwIfAborted(); }
      const all = paragraphs(), paragraph = all[Math.min(previous.start, all.length - 1)];
      if (paragraph) { const caret = { paragraphId: paragraph.id, offset: Math.min(previous.selection.start.offset, paragraph.text.length) }; selection = { start: caret, end: caret }; }
      remember(undo, previous); clearHistory(redo); focus(operation?.scroll); updateToolbar(); await changed({ review: command, paragraphs: before }); await reviewPanel?.refresh();
      return change;
    }); },
    select(range, scroll) { requireDocument(); selectedCells = undefined; selectedDrawing = undefined; selectedImage = undefined; selection = range; focus(scroll); outlineSelection(); updateToolbar(); },
    find(text) { if (!text) return []; return requireDocument().content.findText(text).map(match => ({ start: { paragraphId: match.paragraph.id, offset: match.start }, end: { paragraphId: match.paragraph.id, offset: match.end } })); },
    replaceAll(text, replacement, operation) { return enqueue(async () => {
      checkOperation(operation); editable(); if (!text) throw new TypeError("Search text must not be empty.");
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
        } else selection = (await requireDocument().edit({ kind: "replace", selection: target, text: replacement, paragraphBreaks: false })).selection;
      } operation?.signal?.throwIfAborted(); }
      catch (error) { await mount(previous.bytes); const all = paragraphs(); selection = { start: { paragraphId: all[previous.start]!.id, offset: previous.selection.start.offset }, end: { paragraphId: all[previous.end]!.id, offset: previous.selection.end.offset } }; formatting = previous.formatting; focus(operation?.scroll); throw error; }
      remember(undo, previous); clearHistory(redo); focus(operation?.scroll); await changed({ replaceAll: { text, replacement } }); await reviewPanel?.refresh();
    }); },
    async undo(operation) { await formPanel?.flush(); return enqueue(() => { checkOperation(operation); return history("undo", operation?.signal, operation?.scroll); }); }, async redo(operation) { await formPanel?.flush(); return enqueue(() => { checkOperation(operation); return history("redo", operation?.signal, operation?.scroll); }); },
    async save() { await formPanel?.flush(); return enqueue(() => requireDocument().save({ onFieldStatus: fieldNotice })); }, async pdf() { await formPanel?.flush(); return enqueue(() => requireDocument().pdf({ onFieldStatus: fieldNotice })); },
    dispose() { if (disposed) return; disposed = true; outlineView?.dispose(); comparison?.dispose(); selectionPane?.dispose(); lifetime.abort(); toolbarSize.disconnect(); editorSize.disconnect(); continuousSize.disconnect(); clearTimeout(reflowTimer); canvas?.dispose(); doc?.dispose(); clearHistory(undo); clearHistory(redo); host.remove(); },
  };
  if (options.review) { reviewPanel = createReviewPanel(root, result, options.review, lifetime.signal, updateToolbar); void reviewPanel.setMode(); }
  updateToolbar(); report("Open a Word document.");
  return result;
}
