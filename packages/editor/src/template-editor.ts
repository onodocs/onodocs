import { createEditor, type EditorOptions, type WordEditor } from "./editor.js";
import { openTemplate } from "@onodocs/sdk/browser";
import { templateTag, type TemplateBinding } from "@onodocs/sdk";
import { editorIcons } from "./editor-icons.js";
import { editTemplateData, fieldName, isSampleImage } from "./template-editor-data.js";

export interface TemplateEditorOptions extends EditorOptions {
  readonly sampleData?: unknown;
  readonly locale?: string;
}
export interface TemplateEditor {
  readonly editor: WordEditor;
  readonly element: HTMLElement;
  readonly previewing: boolean;
  open(input: ArrayBuffer | Uint8Array | Blob, name?: string): Promise<void>;
  preview(data?: unknown): Promise<void>;
  design(): Promise<void>;
  saveTemplate(): Promise<Uint8Array<ArrayBuffer>>;
  dispose(): void;
}

const fieldKinds = {
  value: { name: "Text field", description: "Insert a name, date, amount or other value.", icon: "replace" },
  repeat: { name: "Repeating content", description: "Repeat a table row or paragraph for each item.", icon: "table" },
  if: { name: "Conditional content", description: "Show a section only when a condition is met.", icon: "page" },
  image: { name: "Image field", description: "Use a logo or photo from your data.", icon: "image" },
  section: { name: "Reusable section", description: "Save selected content to use elsewhere.", icon: "save" },
  include: { name: "Insert reusable section", description: "Place a saved section with its own data.", icon: "link" },
} as const;

export function createTemplateEditor(options: TemplateEditorOptions): TemplateEditor {
  const host = document.createElement("section"), root = host.attachShadow({ mode: "open" });
  host.className = "onodocs-template-editor";
  root.innerHTML = `<style>
:host{display:block;font:14px "Segoe UI",Arial,sans-serif;color:#29313d;background:#eceef1;--accent:#a33327}*{box-sizing:border-box}[hidden]{display:none!important}
button,input,select{font:inherit;color:inherit}button{cursor:pointer;border:1px solid #d7dce2;border-radius:6px;padding:9px 12px;background:white;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px}button:hover:not(:disabled){background:#f3f5f7}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}button.primary{background:var(--accent);border-color:var(--accent);color:white}button.primary:hover:not(:disabled){background:#87291f}button.quiet{border-color:transparent;background:transparent}button.danger{color:#a33327}svg{width:18px;height:18px;flex:none}h1,h2,h3,p{margin:0}h1{font-size:18px;font-weight:600}h2{font-size:16px}h3{font-size:14px}p{line-height:1.5;color:#647080}small{font-size:12px;color:#647080}
.topbar{background:white;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #d7dce2}.identity{display:flex;align-items:center;gap:12px}.identity>svg{width:28px;height:28px;color:var(--accent)}.title-line{display:flex;align-items:center;gap:10px}.mode-label{font-size:11px;letter-spacing:.03em;background:#f1eee9;border-radius:4px;padding:3px 7px;color:#725847}.filename{display:block;margin-top:4px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.workspace{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:720px}.document{min-width:0}aside{padding:22px 18px;background:white;border-right:1px solid #d7dce2;min-width:0}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.count{background:#f0f2f5;padding:3px 7px;border-radius:12px;font-size:12px}.intro{margin:0 0 17px}.wide{width:100%}.field-list{display:grid;gap:7px;margin-top:16px}.field-item{justify-content:flex-start;text-align:left;width:100%;padding:11px 10px;gap:10px}.field-item svg{color:#8b554a}.field-item span{min-width:0;display:grid;gap:3px}.field-item strong{font-size:13px;font-weight:600;overflow-wrap:anywhere}.field-item small{font-size:11px}.empty{padding:22px 4px}.sidebar-footer{border-top:1px solid #e9ecf0;margin-top:22px;padding-top:16px;display:grid;gap:8px}.sidebar-footer p{font-size:12px}.file-actions{display:flex;gap:6px}.file-actions button{flex:1;font-size:12px}.back{padding:4px 0;min-height:28px;color:#647080;margin-bottom:14px}.choices{display:grid;gap:8px}.choice{display:grid;grid-template-columns:24px 1fr;justify-items:start;align-items:start;text-align:left;padding:14px 11px;gap:5px 9px}.choice svg{grid-row:1/3;margin-top:2px}.choice strong{font-weight:600}.choice small{line-height:1.4}.advanced{margin-top:16px}.advanced summary{cursor:pointer;color:#647080;padding:8px 0;font-size:12px}.advanced .choices{margin-top:5px}.inspector-heading{margin-bottom:7px}.selection-note{margin:15px 0;padding:10px 12px;border-left:3px solid #d9c2b9;background:#faf7f5;font-size:12px;overflow-wrap:anywhere}.selection-note strong{display:block;margin-bottom:4px;color:#4d4946}.inspector label{display:grid;gap:6px;margin:14px 0;font-size:12px;font-weight:600}.inspector input,.inspector select{width:100%;min-width:0;min-height:38px;border:1px solid #d7dce2;border-radius:5px;background:white;padding:8px;font-weight:400;font-size:13px}.inspector input[type=file]{font-size:11px}.sizes{display:grid;grid-template-columns:1fr 1fr;gap:10px}.help{font-size:12px;margin-top:6px}.inspector-actions{display:grid;gap:6px;margin-top:20px}.inspector-actions button{width:100%}.preview-note{border:1px solid #e4ded6;border-radius:8px;background:#faf8f5;padding:18px;margin-bottom:18px}.preview-note h2{margin-bottom:8px}.preview-note p{font-size:13px}.preview-note+button{margin-bottom:20px}.status{display:block;border-top:1px solid #d7dce2;background:white;padding:10px 22px;font-size:12px;line-height:1.5;color:#647080}.status:empty{display:none}.status[data-error=true]{color:#a33327;background:#fff4f2}.mode-label[data-preview=true]{background:#e8f2ee;color:#356654}
@media(max-width:1000px){.topbar{align-items:flex-start;flex-wrap:wrap}.workspace{grid-template-columns:270px minmax(0,1fr)}aside{padding:18px 14px}}@media(max-width:720px){.workspace{grid-template-columns:1fr}aside{border-right:0;border-bottom:1px solid #d7dce2;max-height:45dvh;overflow:auto}.field-list{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.topbar{padding:14px}.topbar .actions{width:auto;margin-left:auto}.topbar button{flex:1;min-height:44px}.filename{max-width:220px}.choices{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.inspector{max-width:520px}.sidebar-footer{margin-top:16px}button{min-height:44px}}
</style><header class="topbar"><div class="identity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${editorIcons.page}</svg><div><div class="title-line"><h1>Template designer</h1><span class="mode-label">Design</span></div><small class="filename">Untitled template</small></div></div><div class="actions"><button data-action="design" hidden>Back to template</button><slot name="header-actions"></slot></div></header>
<div class="workspace"><aside aria-label="Template fields"><section class="overview"><div class="section-heading"><h2>Template fields</h2><span class="count">0</span></div><p class="intro">Choose a field to edit it, or select document content and add one.</p><button class="wide primary" data-action="add">+ Add field</button><div class="field-list"></div><div class="sidebar-footer"><div class="file-actions"><button data-action="open">Open template</button><button data-action="new">New template</button></div><p class="data-summary"></p></div></section>
<section class="picker" hidden><button class="quiet back" data-action="list">← Template fields</button><h2>Add a field</h2><p class="intro">What should this part of the document do?</p><div class="choices common"></div><details class="advanced"><summary>Reusable sections</summary><div class="choices reusable"></div></details></section>
<form class="inspector" hidden><button type="button" class="quiet back" data-action="list">← Template fields</button><h2 class="inspector-heading"></h2><p class="help field-description"></p><div class="selection-note"><strong>Selected content</strong><span></span></div><label class="field-label"><span>Data field</span><select aria-label="Data field" required></select></label><label class="section-label">Section name<input aria-label="Section name" value="signature" required></label><label class="scope-label">Apply to<select aria-label="Template content scope"><option value="selection">Selected text</option><option value="paragraph">Selected paragraphs</option><option value="row">Table row</option><option value="table">Whole table</option></select></label><p class="help scope-summary" hidden></p><label class="format-label">Display as<select aria-label="Value format"><option value="text">Text</option><option value="number">Number</option><option value="currency">Currency</option><option value="date">Date</option></select></label><label class="currency-label">Currency<input aria-label="Currency" value="USD" required></label><div class="image-settings"><div class="sizes"><label>Width (pt)<input aria-label="Template image width" type="number" value="96" min="0.1" step="any" required></label><label>Height (pt)<input aria-label="Template image height" type="number" value="64" min="0.1" step="any" required></label></div><label>Sample image<input aria-label="Sample image" type="file" accept="image/png,image/jpeg"></label></div><div class="inspector-actions"><button class="primary" type="submit">Insert field</button><button type="button" class="quiet danger" data-action="remove" hidden>Remove field</button></div></form>
<section class="preview-panel" hidden><div class="preview-note"><h2>Document preview</h2><p>Sample values have filled the template. You can edit this document and download it as Word or PDF.</p></div><h3>Try different values</h3><p class="help">Change sample values, then refresh the preview. Your template stays separate.</p><button class="wide" data-action="data">Edit sample values</button><div class="sidebar-footer"><p class="data-summary"></p><button data-action="batch" hidden>Download all documents</button></div></section></aside><div class="document"></div></div><output class="status" role="status"></output>`;
  options.container.append(host);
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const field = get<HTMLSelectElement>('[aria-label="Data field"]'), section = get<HTMLInputElement>('[aria-label="Section name"]'), scope = get<HTMLSelectElement>('[aria-label="Template content scope"]'), format = get<HTMLSelectElement>('[aria-label="Value format"]'), currency = get<HTMLInputElement>('[aria-label="Currency"]'), width = get<HTMLInputElement>('[aria-label="Template image width"]'), height = get<HTMLInputElement>('[aria-label="Template image height"]'), image = get<HTMLInputElement>('[aria-label="Sample image"]');
  const inspector = get<HTMLFormElement>(".inspector"), status = get<HTMLOutputElement>("output"), list = get<HTMLDivElement>(".field-list");
  let sample: unknown = structuredClone(options.sampleData ?? { customer: "Willow Design", amount: 1250, date: "2026-10-08", includeNote: true, items: [{ name: "Design", price: 1250 }], logo: null });
  const imageTargets = new Map<string, { record: Record<string, unknown>; key: string }[]>();
  let templateBytes: Uint8Array<ArrayBuffer> | undefined, previewing = false, disposed = false, busy = false, selectedId = "", kind: TemplateBinding["kind"] = "value", panel = "list";
  const lifetime = new AbortController();
  const templateCommands = [
    { name: "add", label: "Add field", group: "Fields", icon: "new" },
    { name: "list", label: "Show fields", group: "Fields", icon: "list" },
    { name: "data", label: "Sample values", group: "Preview", icon: "table" },
    { name: "preview", label: "Preview document", group: "Preview", icon: "find" },
    { name: "save", label: "Download template", group: "Template", icon: "save" },
  ].map(command => ({ id: `template:${command.name}`, label: command.label, ribbon: { tab: "Template", group: command.group, icon: command.icon }, execute: async () => action(command.name) }));
  const editor = createEditor({ ...options, container: get(".document"), commands: [...options.commands ?? [], ...templateCommands], toolbar: options.toolbar === false ? false : [...(options.toolbar ?? ["save", "pdf", "undo", "redo", "bold", "italic", "underline", "strike", "color", "font", "size", "alignment", "style", "list", "table", "tableTools", "image", "imageTools", "link", "find", "replace", "page", "header", "footer"]).filter(name => !["open", "new"].includes(name)), ...templateCommands.map(command => command.id)], async onChange(editor, change) { refreshBindings(); await options.onChange?.(editor, change); } });
  const report = (message: string, error = false) => { status.textContent = message; status.dataset.error = String(error); };
  function showPanel(value: string): void {
    panel = value;
    get(".overview").hidden = previewing || value !== "list";
    get(".picker").hidden = previewing || value !== "picker";
    inspector.hidden = previewing || value !== "inspector";
    get(".preview-panel").hidden = !previewing;
  }
  function mode(): void {
    showPanel("list");
    const label = get(".mode-label"); label.textContent = previewing ? "Preview" : "Design"; label.dataset.preview = String(previewing);
    get('[data-action="design"]').hidden = !previewing;
    refreshDataSummary();
  }
  function refreshDataSummary(): void {
    const multiple = Array.isArray(sample), count = Array.isArray(sample) ? sample.length : 1;
    root.querySelectorAll(".data-summary").forEach(element => { element.textContent = multiple ? `${count} sample records. Preview shows the first record.` : "Sample values let you check the result before using real data."; });
    get('[data-action="batch"]').hidden = !multiple;
  }
  function icon(name: string): SVGElement {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) result.setAttribute(key, value);
    result.innerHTML = editorIcons[name] ?? editorIcons.replace!;
    return result;
  }
  function bindingName(value: TemplateBinding): string { return fieldName("name" in value ? value.name + (value.kind === "include" && value.path?.length ? ` · ${value.path.join(".")}` : "") : value.path.join(".") || "Current item"); }
  function refreshBindings(): void {
    list.replaceChildren();
    for (const control of editor.document?.query.contentControls() ?? []) {
      if (!control.tag?.startsWith("onodocs:")) continue;
      let value: TemplateBinding;
      try { value = JSON.parse(control.tag.slice(8)); if (!fieldKinds[value.kind]) continue; } catch { continue; }
      const button = document.createElement("button"), text = document.createElement("span"), title = document.createElement("strong"), type = document.createElement("small");
      button.type = "button"; button.className = "field-item"; button.dataset.controlId = control.id;
      title.textContent = bindingName(value); type.textContent = fieldKinds[value.kind].name;
      if (value.kind === "value" && value.path.length === 1 && control.parent) {
        const parent = editor.document!.query.within(control.parent).closest("contentControl").first();
        if (parent?.tag?.startsWith("onodocs:")) {
          try { const container: TemplateBinding = JSON.parse(parent.tag.slice(8)); title.textContent = `${bindingName(container)} · ${bindingName(value)}`; } catch { }
        }
      }
      text.append(title, type); button.append(icon(fieldKinds[value.kind].icon), text);
      button.addEventListener("click", () => editBinding(control.id)); list.append(button);
    }
    get(".count").textContent = String(list.childElementCount);
    if (!list.childElementCount) { const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = "No fields yet. Select the text or table row you want to fill, then choose Add field."; list.append(empty); }
  }
  function refreshFields(selected = field.value): void {
    field.replaceChildren(new Option("Choose a data field", ""));
    imageTargets.clear();
    const query = editor.document?.query;
    let owner = selectedId ? query?.get(selectedId)?.parent : editor.selection ? query?.get(editor.selection.start.paragraphId) : undefined;
    let reusableContext: string | undefined;
    while (owner) {
      if (owner.kind === "contentControl" && owner.tag?.startsWith("onodocs:")) {
        try {
          const container: TemplateBinding = JSON.parse(owner.tag.slice(8));
          if (container.kind === "repeat") break;
          if (container.kind === "section") { reusableContext = bindingName(container); break; }
        } catch { }
      }
      owner = owner.parent;
    }
    function collectImages(value: unknown, path: string[]): void {
      if (Array.isArray(value)) { for (const child of value) collectImages(child, []); }
      else if (value !== null && typeof value === "object" && !isSampleImage(value)) for (const [key, child] of Object.entries(value)) {
        const childPath = [...path, key], id = JSON.stringify(childPath);
        if (child === null || isSampleImage(child)) { const targets = imageTargets.get(id) ?? []; targets.push({ record: value as Record<string, unknown>, key }); imageTargets.set(id, targets); }
        else collectImages(child, childPath);
      }
    }
    collectImages(sample, []);
    const context = Array.isArray(sample) ? sample[0] : sample;
    function visit(value: unknown, path: string[], label: string): void {
      const collection = Array.isArray(value), object = value !== null && typeof value === "object", picture = isSampleImage(value);
      const allowed = kind === "repeat" ? collection : kind === "if" ? typeof value === "boolean" || collection : kind === "image" ? value === null || picture : kind === "include" ? true : !object;
      if (allowed && path.length) field.add(new Option(label, JSON.stringify(path)));
      if (collection) {
        if (value[0] && typeof value[0] === "object") for (const [key, child] of Object.entries(value[0])) visit(child, [key], `${reusableContext ?? `${label} item`} · ${key}`);
        else if (value.length && kind === "value") field.add(new Option(reusableContext ?? `${label} item`, "[]"));
      } else if (object && !picture) for (const [key, child] of Object.entries(value)) visit(child, [...path, key], label ? `${label}.${key}` : key);
    }
    if (kind === "include") field.add(new Option("Current record", "[]"));
    visit(context, [], "");
    if (selected && ![...field.options].some(option => option.value === selected)) field.add(new Option(`${reusableContext ? `${reusableContext} · ` : ""}${JSON.parse(selected).join(".") || "Current item"} (not in sample values)`, selected));
    field.value = selected;
  }
  function selectionSummary(): void {
    const range = editor.selection, paragraph = range && editor.document?.query.get(range.start.paragraphId);
    const control = selectedId && editor.document?.query.get(selectedId);
    get(".selection-note span").textContent = control ? control.text.slice(0, 200) || "Selected field" : paragraph?.kind === "paragraph" ? range!.start.paragraphId === range!.end.paragraphId ? paragraph.text.slice(range!.start.offset, range!.end.offset) || paragraph.text || "Empty paragraph" : "Multiple paragraphs selected" : "Select content in the document.";
  }
  function showFields(): void {
    get(".section-label").hidden = !["section", "include"].includes(kind); section.disabled = !!get(".section-label").hidden;
    get(".field-label").hidden = kind === "section"; field.disabled = kind === "section";
    get(".field-label span").textContent = kind === "repeat" ? "Repeat for each item in" : kind === "if" ? "Show when this value is true or has items" : kind === "image" ? "Image source" : "Data field";
    get(".format-label").hidden = kind !== "value";
    get(".currency-label").hidden = kind !== "value" || format.value !== "currency"; currency.disabled = !!get(".currency-label").hidden;
    get(".image-settings").hidden = kind !== "image"; width.disabled = height.disabled = kind !== "image";
    get(".scope-label").hidden = !!selectedId; get(".scope-summary").hidden = !selectedId;
    get(".scope-summary").textContent = `Applies to: ${scope.selectedOptions[0]?.textContent ?? "selected content"}.`;
    get(".inspector-heading").textContent = `${selectedId ? "Edit" : "Add"} ${fieldKinds[kind].name.toLowerCase()}`;
    get(".field-description").textContent = fieldKinds[kind].description;
    get('button[type="submit"]').textContent = selectedId ? "Save changes" : kind === "repeat" ? "Repeat selected content" : kind === "if" ? "Add condition" : "Insert field";
    get('[data-action="remove"]').hidden = !selectedId;
    for (const option of scope.options) option.disabled = option.value === "selection" && !["value", "image"].includes(kind);
    if (scope.selectedOptions[0]?.disabled) scope.value = "paragraph";
    selectionSummary();
  }
  function addField(value: TemplateBinding["kind"]): void {
    kind = value; selectedId = ""; format.value = "text"; field.value = "";
    const p = editor.selection && editor.document?.query.get(editor.selection.start.paragraphId);
    const inTable = p && editor.document?.query.within(p).closest("table").first();
    scope.value = kind === "repeat" && inTable ? "row" : ["value", "image"].includes(kind) ? "selection" : "paragraph";
    refreshFields(""); showFields(); showPanel("inspector"); field.focus(); report("");
  }
  function editBinding(id: string): void {
    const control = editor.document?.query.get(id); if (control?.kind !== "contentControl") return;
    const query = editor.document!.query, paragraphs = query.within(control).paragraphs().all();
    let content = control.children[0]; while (content?.kind === "contentControl") content = content.children[0];
    scope.value = content?.kind === "row" ? "row" : content?.kind === "table" ? "table" : paragraphs.length ? "paragraph" : "selection";
    if (paragraphs.length) editor.select({ start: { paragraphId: paragraphs[0]!.id, offset: 0 }, end: { paragraphId: paragraphs.at(-1)!.id, offset: paragraphs.at(-1)!.text.length } });
    else {
      const paragraph = query.within(control).closest("paragraph").first();
      if (paragraph) {
        const selected = new Set(query.within(control).runs().map(run => run.id));
        let offset = 0, start: number | undefined, end = 0;
        for (const run of query.within(paragraph).runs()) { if (selected.has(run.id)) { start ??= offset; end = offset + run.text.length; } offset += run.text.length; }
        if (start !== undefined) editor.select({ start: { paragraphId: paragraph.id, offset: start }, end: { paragraphId: paragraph.id, offset: end } });
        scope.value = "selection";
      } else {
        const story = query.within(control).closest("story").first();
        const first = story && query.within(story).paragraphs().all().find(p => p.source && control.source && p.source.ordinal > control.source.ordinal);
        if (first) editor.select({ start: { paragraphId: first.id, offset: 0 }, end: { paragraphId: first.id, offset: 0 } });
      }
    }
    let value: TemplateBinding;
    try { value = JSON.parse(control.tag!.slice(8)); } catch { report("This field could not be read.", true); return; }
    selectedId = id; kind = value.kind; refreshFields("path" in value && value.path ? JSON.stringify(value.path) : "");
    if ("name" in value) section.value = value.name;
    if (value.kind === "image") { width.value = String(value.width); height.value = String(value.height); }
    if (value.kind === "value") { format.value = value.format?.kind === "date" ? "date" : value.format?.kind === "number" ? value.format.options?.style === "currency" ? "currency" : "number" : "text"; if (value.format?.kind === "number" && value.format.options?.currency) currency.value = value.format.options.currency; }
    showFields(); showPanel("inspector"); (kind === "section" ? section : field).focus(); report("");
  }
  function binding(): TemplateBinding {
    const path = field.value ? JSON.parse(field.value) as string[] : [];
    switch (kind) {
      case "section": return { kind, name: section.value };
      case "include": return { kind, name: section.value, path };
      case "repeat": case "if": return { kind, path };
      case "image": return { kind, path, width: Number(width.value), height: Number(height.value) };
      default: return { kind: "value", path, ...(format.value === "text" ? {} : { format: format.value === "date" ? { kind: "date" as const } : { kind: "number" as const, ...(format.value === "currency" ? { options: { style: "currency" as const, currency: currency.value } } : {}) } }) };
    }
  }
  function download(bytes: Uint8Array<ArrayBuffer>, name: string): void {
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
    const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const api: TemplateEditor = {
    editor, element: host, get previewing() { return previewing; },
    async open(input, name) { await editor.open(input, name); templateBytes = undefined; previewing = false; selectedId = ""; get(".filename").textContent = name ?? "Untitled template"; mode(); refreshBindings(); report("Template ready. Choose a field to edit it, or add a new field."); },
    async preview(value) {
      const bytes = await api.saveTemplate(), template = await openTemplate(bytes, { ...options.document, signal: lifetime.signal });
      try { const values = value ?? sample, record = Array.isArray(values) ? values[0] : values; if (record === undefined) throw new Error("Add a sample record before previewing."); const generated = await template.generate(record, { ...(options.locale ? { locale: options.locale } : {}), signal: lifetime.signal }); await editor.open(generated, "generated.docx"); templateBytes = bytes; previewing = true; mode(); report("Preview ready. Changes here affect this generated document only."); }
      finally { template.dispose(); }
    },
    async design() { if (templateBytes && previewing) { await editor.open(templateBytes, "template.docx"); previewing = false; selectedId = ""; mode(); refreshBindings(); report("Template restored. Generated-document edits stay out of the template."); } },
    async saveTemplate() { return previewing && templateBytes ? templateBytes.slice() : editor.save(); },
    dispose() { if (disposed) return; disposed = true; lifetime.abort(); editor.dispose(); host.remove(); },
  };
  async function action(name: string): Promise<void> {
    if (disposed || busy) return;
    let returnFocus = root.activeElement;
    while (returnFocus?.shadowRoot?.activeElement) returnFocus = returnFocus.shadowRoot.activeElement;
    busy = true; host.setAttribute("aria-busy", "true"); editor.element.inert = true;
    try {
      if (name === "add" || name === "list") { if (previewing) await api.design(); selectedId = ""; showPanel(name === "add" ? "picker" : "list"); }
      else if (name === "open") {
        const file = document.createElement("input"); file.type = "file"; file.accept = ".docx";
        file.addEventListener("change", () => { if (file.files?.[0]) void api.open(file.files[0], file.files[0].name).catch(error => report(String(error), true)); }, { once: true }); file.click();
      } else if (name === "new") { await editor.newDocument(); templateBytes = undefined; previewing = false; selectedId = ""; get(".filename").textContent = "Untitled template"; mode(); refreshBindings(); report("Select document content, then add a field."); }
      else if (name === "bind" || name === "remove") {
        if (previewing) throw new Error("Return to the template before changing fields.");
        const control = selectedId && editor.document?.query.get(selectedId);
        const value: TemplateBinding = name === "remove" && control && control.kind === "contentControl" ? JSON.parse(control.tag!.slice(8)) : binding();
        await editor.execute({ kind: "template", ...(selectedId ? { controlId: selectedId } : {}), tag: templateTag(value), title: "name" in value ? `${value.kind}: ${value.name}` : `${value.kind}: ${value.path.join(".")}`, scope: scope.value as "selection" | "paragraph" | "row" | "table", action: name === "remove" ? "remove" : selectedId ? "update" : "wrap" });
        selectedId = ""; showPanel("list"); refreshBindings(); report(name === "remove" ? "Field removed. The document content is unchanged." : "Field saved in the template.");
      } else if (name === "data") {
        const result = await editTemplateData(root, sample, lifetime.signal);
        if (result) { sample = result.value; refreshFields(); refreshDataSummary(); report(previewing ? "Sample values saved. Refresh the preview to see the result." : "Sample values saved."); }
      } else if (name === "preview") await api.preview();
      else if (name === "design") await api.design();
      else if (name === "save") download(await api.saveTemplate(), "template.docx");
      else if (name === "batch") {
        const values = sample; if (!Array.isArray(values)) throw new TypeError("Add multiple records in Sample values to generate several documents.");
        const template = await openTemplate(await api.saveTemplate(), { ...options.document, signal: lifetime.signal });
        try { let count = 0; for await (const bytes of template.batch(values, { ...(options.locale ? { locale: options.locale } : {}), signal: lifetime.signal })) download(bytes, `document-${++count}.docx`); report(`Downloaded ${count} documents.`); }
        finally { template.dispose(); }
      }
    } catch (error) { report(error instanceof Error ? error.message : String(error), true); options.onError?.(error); }
    finally {
      busy = false; host.setAttribute("aria-busy", "false"); editor.element.inert = false;
      if (name === "add") get<HTMLElement>(".picker .choice").focus({ preventScroll: true });
      else if (["list", "bind", "remove"].includes(name)) get<HTMLElement>('.overview [data-action="add"]').focus({ preventScroll: true });
      else if (name === "data" && returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    }
  }
  for (const [key, value] of Object.entries(fieldKinds)) {
    const button = document.createElement("button"), title = document.createElement("strong"), description = document.createElement("small");
    button.type = "button"; button.className = "choice"; title.textContent = value.name; description.textContent = value.description; button.append(icon(value.icon), title, description);
    button.addEventListener("click", () => addField(key as TemplateBinding["kind"]), { signal: lifetime.signal }); get(["section", "include"].includes(key) ? ".reusable" : ".common").append(button);
  }
  root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach(button => button.addEventListener("click", () => { void action(button.dataset.action!); }, { signal: lifetime.signal }));
  inspector.addEventListener("submit", event => { event.preventDefault(); void action("bind"); }, { signal: lifetime.signal });
  image.addEventListener("change", () => {
    const file = image.files?.[0], targets = imageTargets.get(field.value);
    if (file && !["image/png", "image/jpeg"].includes(file.type)) { image.value = ""; report("Choose a PNG or JPEG image.", true); return; }
    if (file && targets?.length) void file.arrayBuffer().then(bytes => { for (const { record, key } of targets) record[key] = { bytes: new Uint8Array(bytes), mediaType: file.type }; image.value = ""; report("Sample image loaded."); }).catch(error => report(String(error), true));
  }, { signal: lifetime.signal });
  format.addEventListener("change", showFields, { signal: lifetime.signal });
  editor.element.addEventListener("pointerup", () => { if (panel === "inspector") requestAnimationFrame(selectionSummary); }, { signal: lifetime.signal });
  editor.element.addEventListener("keyup", () => { if (panel === "inspector") selectionSummary(); }, { signal: lifetime.signal });
  refreshBindings(); mode(); report("Open a template or start a new document.");
  return api;
}
