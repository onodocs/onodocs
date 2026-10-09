import { createEditor, type EditorOptions, type WordEditor } from "./editor.js";
import { openApplicationEditor, type ApplicationOptions, type ApplicationEditor } from "./application.js";
import { createForm, type DocumentForm, type FormAnswers, type FormDefinition, type FormField } from "@onodocs/sdk/forms";

import { createFormPanel } from "./form-panel.js";

export * from "@onodocs/sdk/forms";
export interface FormOptions extends Omit<ApplicationOptions, "readOnly" | "toolbar" | "commands" | "mode" | "allowedModes" | "form" | "onFormComplete"> {
  readonly definition: FormDefinition;
  readonly onComplete?: (result: Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>) => void | Promise<void>;
}
export interface FormView {
  readonly form: DocumentForm;
  readonly application: ApplicationEditor;
  save(): Promise<void>;
  complete(): Promise<Readonly<{ bytes: Uint8Array<ArrayBuffer>; answers: FormAnswers }>>;
  dispose(): void;
}

export async function openForm(options: FormOptions): Promise<FormView> {
  const shell = document.createElement("section"), root = shell.attachShadow({ mode: "open" });
  const preview = document.createElement("div");
  root.append(styles(), preview); options.container.append(shell);
  let panel: ReturnType<typeof createFormPanel> | undefined;
  const lifetime = new AbortController();
  let application: ApplicationEditor;
  try { application = await openApplicationEditor({ ...options, container: preview, readOnly: true, toolbar: false, onEvent(event) { const status = panel?.status; if (status) { if (event.type === "change") status.textContent = "Unsaved changes."; if (event.type === "saving") status.textContent = "Saving draft..."; if (event.type === "saved") status.textContent = "Draft saved."; if (event.type === "error") status.textContent = String(event.error); } options.onEvent?.(event); } }); }
  catch (error) { shell.remove(); throw error; }
  let form: DocumentForm;
  try {
    const documentForm = createForm({ get query() { return application.editor.document!.query; }, async update(updates, change) { await application.editor.document!.update(updates, change); application.markChanged(); }, save: options => application.editor.document!.save(options) }, options.definition);
    form = { ...documentForm, fill: (answers, options) => documentForm.fill(answers, { signal: options?.signal ? AbortSignal.any([options.signal, lifetime.signal]) : lifetime.signal }), async complete() { const value = await documentForm.complete({ signal: lifetime.signal }); await application.save(); return value; } };
    panel = createFormPanel(form, field => {
      const doc = application.editor.document!, control = doc.query.contentControls().where({ tag: field.tag }).first();
      const paragraph = control && (doc.query.within(control).paragraphs().first() ?? doc.query.within(control).closest("paragraph").first());
      if (paragraph) application.editor.select({ start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } });
    }, options.onComplete);
    root.append(panel.element);
  } catch (error) { application.dispose(); shell.remove(); throw error; }
  const result: FormView = {
    form, application,
    async save() { await panel!.flush(); await application.save(); },
    complete: () => panel!.complete(),
    dispose() { lifetime.abort(); options.signal?.removeEventListener("abort", result.dispose); application.dispose(); shell.remove(); }
  };
  options.signal?.addEventListener("abort", result.dispose, { once: true });
  if (options.signal?.aborted) result.dispose();
  return result;
}

export interface FormDesigner {
  readonly editor: WordEditor;
  readonly definition: FormDefinition;
  open(input: ArrayBuffer | Uint8Array | Blob, definition?: FormDefinition): Promise<void>;
  addField(field: FormField, insert?: boolean): Promise<void>;
  removeField(id: string): void;
  save(): Promise<Readonly<{ bytes: Uint8Array<ArrayBuffer>; definition: FormDefinition }>>;
  dispose(): void;
}
export interface FormDesignerOptions {
  readonly container: HTMLElement;
  readonly document?: EditorOptions["document"];
  readonly ribbon?: boolean;
  readonly onPreview?: (designer: FormDesigner) => void | Promise<void>;
  readonly onExportProject?: (designer: FormDesigner) => void | Promise<void>;
  readonly onChange?: (designer: FormDesigner) => void;
  readonly onError?: (error: unknown) => void;
}
export function createFormDesigner(options: FormDesignerOptions): FormDesigner {
  const shell = document.createElement("section"), root = shell.attachShadow({ mode: "open" });
  const preview = document.createElement("div"), panel = document.createElement("aside"), heading = document.createElement("h2"), title = document.createElement("input"), list = document.createElement("div"), settings = document.createElement("form"), status = document.createElement("p");
  heading.textContent = "Form designer"; title.value = "New form"; title.setAttribute("aria-label", "Form title"); status.setAttribute("role", "status");
  panel.setAttribute("aria-label", "Form fields");
  panel.append(heading, title, list, settings, status); root.append(styles(), preview, panel); options.container.append(shell);
  let fields: FormField[] = [];
  const commands: NonNullable<EditorOptions["commands"]> = options.ribbon === false ? [] : [
    { id: "form:add", label: "Add field", ribbon: { tab: "Forms", group: "Fields", icon: "new" }, execute() { settings.reset(); (controls.get("insert") as HTMLInputElement).checked = true; showSettings(); controls.get("id")!.focus(); } },
    { id: "form:settings", label: "Field settings", ribbon: { tab: "Forms", group: "Fields", icon: "review:tracking" }, execute() {
      const position = editor.selection?.start, definitions = new Map(fields.map(field => [field.tag, field]));
      const control = editor.document!.query.contentControls().all().find(control => {
        if (!position || !control.tag || !definitions.has(control.tag)) return false;
        const scope = editor.document!.query.within(control), ranges = scope.findText(/[\s\S]+/).all();
        return ranges.length ? ranges.some(range => range.paragraph.id === position.paragraphId && range.start <= position.offset && position.offset <= range.end) : scope.paragraphs().all().some(paragraph => paragraph.id === position.paragraphId);
      });
      const field = control?.tag ? definitions.get(control.tag) : undefined;
      if (field) editField(field, false);
      else { status.textContent = "Select a field in the document or choose one from the field list."; list.querySelector("button")?.focus(); }
    } },
    { id: "form:fields", label: "Show fields", ribbon: { tab: "Forms", group: "Fields", icon: "list" }, execute() { (list.querySelector("button") ?? title).focus(); } },
    ...options.onPreview ? [{ id: "form:preview", label: "Preview form", ribbon: { tab: "Forms", group: "Preview", icon: "find" }, execute: async () => options.onPreview!(result) }] : [],
    ...options.onExportProject ? [{ id: "form:export", label: "Export form project", ribbon: { tab: "Forms", group: "Export", icon: "save" }, execute: async () => options.onExportProject!(result) }] : [],
  ];
  const editor = createEditor({ container: preview, ...(options.document ? { document: options.document } : {}), commands, toolbar: ["undo", "redo", "bold", "italic", "underline", "font", "size", "alignment", "table", "tableTools", ...commands.map(command => command.id)], onError(error) { status.textContent = String(error); options.onError?.(error); } });
  const controls = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
  for (const [name, caption, type] of [["id", "Field ID", "text"], ["label", "Field label", "text"], ["tag", "Word tag (optional)", "text"], ["type", "Field type", "select"], ["choices", "Choices (one per line)", "textarea"], ["required", "Required", "checkbox"], ["readOnly", "Read-only field", "checkbox"], ["min", "Minimum number", "number"], ["max", "Maximum number", "number"], ["maxLength", "Maximum characters", "number"], ["help", "Help text", "text"], ["insert", "Insert after selected paragraph", "checkbox"]]) {
    const label = document.createElement("label"); label.textContent = caption!;
    const input = type === "select" ? document.createElement("select") : type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    if (input instanceof HTMLSelectElement) for (const kind of ["text", "multiline", "email", "number", "date", "choice", "checkbox"]) input.add(new Option(kind));
    if (input instanceof HTMLInputElement) { input.type = type!; if (type === "number") input.step = "any"; if (name === "insert") input.checked = true; }
    input.setAttribute("aria-label", caption!); controls.set(name!, input); label.append(input); settings.append(label);
  }
  const apply = document.createElement("button"); apply.textContent = "Add or update field"; apply.type = "submit"; settings.append(apply);
  const value = (name: string) => controls.get(name)!.value;
  function showSettings(): void {
    const type = value("type");
    for (const name of ["choices", "min", "max", "maxLength"]) controls.get(name)!.parentElement!.hidden = name === "choices" ? type !== "choice" : name === "maxLength" ? !["text", "email", "multiline"].includes(type) : type !== "number";
  }
  controls.get("type")!.addEventListener("change", showSettings); showSettings();
  function editField(field: FormField, select = true): void {
    for (const [name, input] of controls) { if (name === "insert") continue; const entry = field[name as keyof FormField]; if (input instanceof HTMLInputElement && input.type === "checkbox") input.checked = entry === true; else input.value = name === "choices" ? field.choices?.join("\n") ?? "" : entry === undefined ? "" : String(entry); }
    const control = editor.document!.query.contentControls().where({ tag: field.tag }).first();
    const scope = control && editor.document!.query.within(control), range = scope?.findText(/[\s\S]+/).first(), paragraph = range?.paragraph ?? scope?.paragraphs().first();
    if (select && paragraph) editor.select({ start: { paragraphId: paragraph.id, offset: range?.start ?? 0 }, end: { paragraphId: paragraph.id, offset: range?.end ?? paragraph.text.length } });
    showSettings(); controls.get("label")!.focus();
  }
  function render(): void {
    list.replaceChildren();
    for (const field of fields) {
      const row = document.createElement("p"), edit = document.createElement("button"), remove = document.createElement("button"); edit.textContent = field.label; remove.textContent = "Remove"; remove.setAttribute("aria-label", `Remove ${field.label}`); row.className = "field-row";
      edit.addEventListener("click", () => editField(field));
      remove.addEventListener("click", () => result.removeField(field.id)); row.append(edit, remove); list.append(row);
    }
  }
  const result: FormDesigner = {
    editor,
    get definition() { return { title: title.value, fields }; },
    async open(input, definition = { title: "New form", fields: [] }) { await editor.open(input); createForm(editor.document!, definition); fields = definition.fields.map(field => ({ ...field })); title.value = definition.title; render(); },
    async addField(field, insert = true) {
      const previous = fields.find(item => item.id === field.id), next = previous ? fields.map(item => item.id === field.id ? field : item) : [...fields, field];
      createForm(editor.document!, { title: title.value, fields: next });
      if (previous && previous.tag !== field.tag) throw new Error("An existing field's tag cannot be changed.");
      if (previous) {
        await editor.execute({ kind: "contentControl", tag: field.tag, title: field.label, multiline: field.type === "multiline", properties: true });
      }
      if (!previous && !editor.document!.query.contentControls().where({ tag: field.tag }).count()) await editor.execute({ kind: "contentControl", tag: field.tag, title: field.label, multiline: field.type === "multiline", insert });
      fields = next; render(); options.onChange?.(result); status.textContent = "Field saved. Preview the form to fill its answer regions.";
    },
    removeField(id) { fields = fields.filter(field => field.id !== id); render(); options.onChange?.(result); },
    async save() { createForm(editor.document!, result.definition); const tags = new Set(editor.document!.query.contentControls().map(control => control.tag)); if (fields.some(field => !tags.has(field.tag))) throw new Error("A field region was removed. Restore it or remove its form rule before saving."); return { bytes: await editor.save(), definition: result.definition }; },
    dispose() { editor.dispose(); shell.remove(); }
  };
  settings.addEventListener("submit", event => {
    event.preventDefault(); const id = value("id").trim(), type = value("type") as FormField["type"];
    const field: FormField = { id, tag: fields.find(field => field.id === id)?.tag ?? (value("tag").trim() || `onodocs.${id}`), label: value("label"), type, required: (controls.get("required") as HTMLInputElement).checked, readOnly: (controls.get("readOnly") as HTMLInputElement).checked, help: value("help"), ...(type === "choice" ? { choices: value("choices").split("\n").map(value => value.trim()).filter(Boolean) } : {}), ...Object.fromEntries(["min", "max", "maxLength"].filter(name => value(name) !== "").map(name => [name, Number(value(name))])) };
    apply.disabled = true; void result.addField(field, (controls.get("insert") as HTMLInputElement).checked).catch(error => { status.textContent = String(error); options.onError?.(error); }).finally(() => { apply.disabled = false; });
  });
  return result;
}

function styles(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = ":host{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start;font:14px system-ui;color:#26343a}aside,form{padding:24px;background:#fff;border:1px solid #dce1e6;border-radius:8px}aside form{padding:0;border:0}[hidden]{display:none!important}.field-row{display:flex;gap:5px}.field-row button:first-child{flex:1;text-align:left}h2{font-size:20px;margin:0 0 16px}label{display:grid;gap:7px;margin:18px 0}label>span{font-weight:600}small:empty{display:none}input:disabled{background:#f2f5f3;color:#64716b}label:has(input[type=checkbox]){grid-template-columns:24px 1fr;align-items:center}label:has(input[type=checkbox])>input{grid-column:1;grid-row:1}label:has(input[type=checkbox])>span{grid-column:2}label:has(input[type=checkbox])>small{grid-column:2}input,select,textarea,button{font:inherit;box-sizing:border-box;max-width:100%;padding:10px 12px;border:1px solid #a9b5bd;border-radius:4px}textarea{min-height:105px;resize:vertical}input[type=checkbox]{width:20px;height:20px;padding:0;accent-color:#176d60}button{cursor:pointer;background:#f4f6f7}button[type=submit]{background:#176d60;color:white;width:100%;margin-top:12px}small{color:#58656c}small[role=alert]{color:#a32828}input[aria-invalid=true],select[aria-invalid=true],textarea[aria-invalid=true]{border-color:#a32828}:focus-visible{outline:2px solid #176d60;outline-offset:2px}@media(max-width:1050px){:host{grid-template-columns:minmax(0,1fr)}:host>div{min-width:0}.form-panel{grid-row:1}}";
  return style;
}
