import { openTemplate, openDocument, type BrowserOptions } from "@onodocs/sdk/browser";
import { templateTag, type TemplateBinding, type ParagraphContent } from "@onodocs/sdk";
import { createDocument, type DocumentView, type DocumentAttachment } from "@onodocs/canvas";
import type { WordEditor } from "./editor.js";
import { editTemplateData } from "./template-editor-data.js";

interface MergeField { readonly name: string; readonly label: string; readonly value?: string; readonly type?: string; readonly min?: string; readonly max?: string; readonly choices?: readonly Readonly<{ value: string; label: string }>[]; }
interface MailingsOptions {
  readonly root: ShadowRoot;
  readonly editor: () => WordEditor;
  readonly document: BrowserOptions | undefined;
  readonly signal: AbortSignal;
  readonly form: (title: string, fields: readonly MergeField[], submit: (values: Readonly<Record<string, string>>) => Promise<unknown>) => Promise<void>;
  readonly report: (message: string, error?: boolean) => void;
}

export function createMailings(options: MailingsOptions) {
  let recipients: Record<string, unknown>[] = [], index = 0;
  const matched = new Map<string, string>();
  const sample = [{ firstName: "Alex", lastName: "Morgan", company: "Example company", address: "12 Main Street", city: "London", postalCode: "SW1A 1AA", country: "United Kingdom", includeNote: true }];
  function current(): WordEditor { const editor = options.editor(); if (!editor.document) throw new Error("Open a document first."); return editor; }
  function records(): Record<string, unknown>[] { if (!recipients.length) throw new Error("Choose recipients before previewing or merging."); return recipients; }
  function choices(): { value: string; label: string }[] {
    const keys = new Set(recipients.flatMap(record => Object.keys(record)));
    return [...keys].sort().map(value => ({ value, label: value }));
  }
  function download(bytes: Uint8Array<ArrayBuffer>, name: string): void {
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function editRecipients(): Promise<void> {
    const result = await editTemplateData(options.root, recipients.length ? recipients : sample, options.signal, { title: "Mail merge recipients", collectionLabel: "Recipients", description: "Edit recipient values or paste a JSON array. Each record creates one document. Data stays in this browser session.", validate(value) {
      if (!Array.isArray(value) || !value.length || value.some(record => !record || typeof record !== "object" || Array.isArray(record))) throw new TypeError("Enter a nonempty array of recipient objects.");
    } });
    if (result) { recipients = result.value as Record<string, unknown>[]; index = Math.min(index, recipients.length - 1); options.report(`${recipients.length} recipients ready. Insert merge fields, then preview the results.`); }
  }
  async function insertField(rule = false): Promise<void> {
    const fields = choices(); if (!fields.length) throw new Error("Choose recipients before inserting a merge field.");
    const selection = current().selection; if (!selection) throw new Error("Place the cursor where the field should go.");
    await options.form(rule ? "Conditional content" : "Insert merge field", [{ name: "field", label: rule ? "Show selected content when this field has a value" : "Recipient field", choices: fields, value: fields[0]!.value }, ...rule ? [{ name: "scope", label: "Apply to", value: "selection", choices: [{ value: "selection", label: "Selected text" }, { value: "paragraph", label: "Selected paragraphs" }, { value: "row", label: "Table row" }] }] : [{ name: "format", label: "Display as", value: "text", choices: [{ value: "text", label: "Text" }, { value: "number", label: "Number" }, { value: "date", label: "Date" }] }]], async values => {
      if (rule && selection.start.paragraphId === selection.end.paragraphId && selection.start.offset === selection.end.offset && values.scope === "selection") throw new Error("Select the text to show conditionally before adding a rule.");
      const binding: TemplateBinding = rule ? { kind: "if", path: [values.field!] } : { kind: "value", path: [values.field!], ...values.format === "text" ? {} : { format: { kind: values.format as "number" | "date" } } };
      await current().execute({ kind: "contentControl", action: "wrap", selection, scope: rule ? values.scope as "selection" | "paragraph" | "row" : "selection", tag: templateTag(binding), title: `«${values.field}»` });
      options.report(rule ? "Conditional content added." : "Merge field added. Preview with recipient values to check the result.");
    });
  }
  async function insertBlock(greeting: boolean): Promise<void> {
    const fields = choices(); if (!fields.length) throw new Error("Choose recipients before inserting an address or greeting.");
    const selection = current().selection; if (!selection) throw new Error("Place the cursor where the block should go.");
    const roles = greeting ? [["firstName", "First name"], ["lastName", "Last name"]] : [["firstName", "First name"], ["lastName", "Last name"], ["company", "Company"], ["address", "Address"], ["city", "City"], ["postalCode", "Postal code"], ["country", "Country"]];
    const defaults = new Set(fields.map(field => field.value));
    await options.form(greeting ? "Greeting line" : "Address block", [...roles.map(([name, label]) => ({ name: name!, label: label!, choices: [{ value: "", label: "Do not include" }, ...fields], value: matched.get(name!) ?? (defaults.has(name!) ? name! : "") })), ...greeting ? [{ name: "greeting", label: "Greeting", value: "Dear" }, { name: "punctuation", label: "Punctuation", value: ",", choices: [{ value: ",", label: "Comma" }, { value: ":", label: "Colon" }, { value: "", label: "None" }] }] : [{ name: "nameOrder", label: "Name order", value: "first", choices: [{ value: "first", label: "First name Last name" }, { value: "last", label: "Last name, First name" }] }]], async values => {
      const field = (role: string): ParagraphContent["runs"][number][] => values[role] ? [{ text: `«${values[role]}»`, contentControl: { tag: templateTag({ kind: "value", path: [values[role]!] }), title: `${greeting ? "Greeting line" : "Address block"}: ${roles.find(([name]) => name === role)![1]}` } }] : [];
      function line(roles: readonly string[], separator = " "): ParagraphContent["runs"][number][] { return roles.flatMap(field).flatMap((run, index) => index ? [{ text: separator }, run] : [run]); }
      let lines: ParagraphContent["runs"][];
      if (greeting) { const names = line(["firstName", "lastName"]); if (!names.length) throw new Error("Choose at least one name field."); lines = [[...values.greeting?.trim() ? [{ text: values.greeting.trim() + " " }] : [], ...names, { text: values.punctuation ?? "" }]]; }
      else lines = [line(values.nameOrder === "last" ? ["lastName", "firstName"] : ["firstName", "lastName"], values.nameOrder === "last" ? ", " : " "), field("company"), field("address"), line(["city", "postalCode"]), field("country")].filter(runs => runs.length);
      if (!lines.length) throw new Error("Choose at least one recipient field.");
      await current().execute({ kind: "paste", selection, paragraphs: [...lines, ...greeting ? [] : [[]]].map(runs => ({ runs, properties: { spacingAfter: 0, spacingBefore: 0, spacingAfterAuto: false, spacingBeforeAuto: false } })) });
      for (const [role] of roles) matched.set(role!, values[role!]!);
      options.report(greeting ? "Greeting line inserted. Its name fields remain editable." : "Address block inserted. Preview to review your recipient address format.");
    });
  }
  async function matchFields(): Promise<void> {
    const available = choices(); if (!available.length) throw new Error("Choose recipients before matching fields.");
    const controls = current().document!.content.contentControls().all().flatMap(control => {
      if (!control.tag?.startsWith("onodocs:")) return [];
      try { const binding = JSON.parse(control.tag.slice(8)) as TemplateBinding; return "path" in binding && binding.path?.length === 1 ? [{ control, binding, path: binding.path[0]! }] : []; } catch { return []; }
    });
    const paths = [...new Set(controls.map(item => item.path))];
    if (!paths.length) paths.push("firstName", "lastName", "company", "address", "city", "postalCode", "country");
    await options.form("Match fields", paths.map((path, index) => ({ name: String(index), label: path, choices: [{ value: "", label: "Choose recipient field" }, ...available], value: matched.get(path) ?? (available.some(field => field.value === path) ? path : "") })), async values => {
      const changes = new Map(paths.map((path, index) => [path, values[String(index)]!]));
      for (const item of controls) if (!changes.get(item.path)) throw new Error(`Choose a recipient field for ${item.path}.`);
      const commands = controls.filter(item => changes.get(item.path) !== item.path).map(item => ({ kind: "contentControl" as const, action: "update" as const, controlId: item.control.id, tag: templateTag({ ...item.binding, path: [changes.get(item.path)!] } as TemplateBinding) }));
      if (commands.length) await current().execute({ kind: "batch", commands });
      for (const [path, value] of changes) matched.set(path, value);
      options.report(`${commands.length} document fields updated. Matches also apply to new address and greeting blocks.`);
    });
  }
  async function preview(target = index): Promise<void> {
    const data = records(); index = Math.max(0, Math.min(data.length - 1, target));
    const template = await openTemplate(await current().save(), { ...options.document, signal: options.signal });
    const dialog = document.createElement("dialog"), style = document.createElement("style"), heading = document.createElement("h2"), navigation = document.createElement("div"), count = document.createElement("span"), number = document.createElement("input"), viewport = document.createElement("div"), error = document.createElement("p"), actions = document.createElement("div");
    dialog.ariaLabel = "Mail merge preview"; dialog.className = "merge-preview"; heading.textContent = "Preview results"; error.setAttribute("role", "alert");
    style.textContent = `.merge-preview{width:1000px;max-width:calc(100vw - 24px);padding:18px}.merge-preview .merge-navigation{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:12px 0}.merge-preview .merge-navigation input{width:72px;border:1px solid #ccd3da}.merge-preview .merge-pages{height:55dvh;overflow:auto;background:#eceef1;border:12px solid #eceef1}.merge-preview .dialog-actions{flex-wrap:wrap}.merge-preview .merge-navigation button{min-width:36px}.merge-preview [role=alert]{margin-top:10px}`;
    navigation.className = "merge-navigation"; viewport.className = "merge-pages"; actions.className = "dialog-actions"; number.type = "number"; number.min = "1"; number.max = String(data.length); number.ariaLabel = "Recipient number";
    let rendered: ReturnType<typeof createDocument> | undefined, loaded: Awaited<ReturnType<typeof openDocument>> | undefined, bytes: Uint8Array<ArrayBuffer> | undefined, busy = false, closed = false;
    const buttons: HTMLButtonElement[] = [];
    function button(label: string, text: string, action: () => Promise<unknown> | void, parent = navigation): HTMLButtonElement {
      const button = document.createElement("button"); button.type = "button"; button.ariaLabel = label; button.title = label; button.textContent = text; buttons.push(button); parent.append(button);
      button.addEventListener("click", () => { void run(action); }); return button;
    }
    async function run(action: () => Promise<unknown> | void): Promise<void> {
      if (busy || closed) return; busy = true; error.textContent = ""; buttons.forEach(button => button.disabled = true); number.disabled = true;
      try { await action(); } catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); }
      finally { busy = false; buttons.forEach(button => button.disabled = false); number.disabled = false; first.disabled = previous.disabled = index === 0; next.disabled = last.disabled = index === data.length - 1; }
    }
    async function show(target: number): Promise<void> {
      if (!Number.isInteger(target) || target < 0 || target >= data.length) throw new RangeError(`Choose a recipient from 1 to ${data.length}.`);
      const nextBytes = await template.generate(data[target], { signal: options.signal }), nextDocument = await openDocument(nextBytes, { ...options.document, signal: options.signal });
      if (closed) { nextDocument.dispose(); return; }
      rendered?.dispose(); loaded?.dispose(); viewport.replaceChildren(); loaded = nextDocument; bytes = nextBytes; index = target;
      rendered = createDocument(loaded, { container: viewport, viewOptions: { zoom: "fit-width" } }); number.value = String(index + 1); count.textContent = `of ${data.length}`; viewport.scrollTop = 0;
    }
    const first = button("First recipient", "|‹", () => show(0)), previous = button("Previous recipient", "‹", () => show(index - 1)); navigation.append(number, count);
    const next = button("Next recipient", "›", () => show(index + 1)), last = button("Last recipient", "›|", () => show(data.length - 1));
    number.addEventListener("change", () => { void run(() => show(Number(number.value) - 1)); });
    button("Download this document", "Download Word", () => { if (bytes) download(bytes, `merged-${index + 1}.docx`); }, actions);
    button("Close preview", "Close", () => dialog.close(), actions);
    function close(): void { if (closed) return; closed = true; dialog.close(); rendered?.dispose(); loaded?.dispose(); template.dispose(); dialog.remove(); options.signal.removeEventListener("abort", close); }
    dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); }); dialog.addEventListener("close", close, { once: true }); options.signal.addEventListener("abort", close, { once: true });
    dialog.append(style, heading, navigation, viewport, error, actions); options.root.append(dialog); dialog.showModal(); await run(() => show(index));
  }
  async function find(): Promise<void> {
    records(); await options.form("Find recipient", [{ name: "search", label: "Name or value" }], async values => {
      const search = values.search?.trim().toLocaleLowerCase(); if (!search) throw new Error("Enter a name or value.");
      const target = recipients.findIndex(record => Object.values(record).some(value => String(value).toLocaleLowerCase().includes(search)));
      if (target < 0) throw new Error("No recipient matches that value."); index = target; options.report(`Recipient ${index + 1} selected. Choose Preview results to view the document.`);
    });
  }
  async function finish(check = false): Promise<void> {
    const data = records();
    await options.form(check ? "Check merge results" : "Finish & Merge", [{ name: "scope", label: "Recipients", value: "all", choices: [{ value: "all", label: `All ${data.length} recipients` }, { value: "current", label: `Current recipient (${index + 1})` }] }], async values => {
      const template = await openTemplate(await current().save(), { ...options.document, signal: options.signal });
      try { let count = 0; for (const [recordIndex, record] of data.entries()) { if (values.scope === "current" && recordIndex !== index) continue; const bytes = await template.generate(record, { signal: options.signal }); if (!check) download(bytes, `merged-${recordIndex + 1}.docx`); count++; } options.report(check ? `${count} documents generated successfully. Preview to review their content before downloading.` : `${count} merged documents downloaded.`); }
      finally { template.dispose(); }
    });
  }
  return [
    { id: "merge:start", label: "Start mail merge", icon: "merge:start", execute: editRecipients },
    { id: "merge:recipients", label: "Select recipients", icon: "merge:recipients", execute: editRecipients },
    { id: "merge:edit", label: "Edit recipient list", icon: "merge:edit", execute: editRecipients },
    { id: "merge:address", label: "Address block", icon: "merge:address", execute: () => insertBlock(false) },
    { id: "merge:greeting", label: "Greeting line", icon: "merge:greeting", execute: () => insertBlock(true) },
    { id: "merge:match", label: "Match fields", icon: "merge:match", execute: matchFields },
    { id: "merge:field", label: "Insert merge field", icon: "merge:field", execute: () => insertField() },
    { id: "merge:rules", label: "Rules", icon: "review:filters", execute: () => insertField(true) },
    { id: "merge:preview", label: "Preview results", icon: "find", execute: () => preview() },
    { id: "merge:first", label: "First recipient", icon: "merge:first", execute: () => preview(0) },
    { id: "merge:previous", label: "Previous recipient", icon: "review:previousComment", execute: () => preview(index - 1) },
    { id: "merge:number", label: "Recipient number", icon: "pageNumber", execute: () => options.form("Recipient number", [{ name: "number", label: "Recipient number", type: "number", min: "1", max: String(records().length), value: String(index + 1) }], async values => { const value = Number(values.number); if (!Number.isInteger(value) || value < 1 || value > recipients.length) throw new Error("Choose a recipient in the list."); index = value - 1; options.report(`Recipient ${value} selected. Choose Preview results to view the document.`); }) },
    { id: "merge:next", label: "Next recipient", icon: "review:nextComment", execute: () => preview(index + 1) },
    { id: "merge:last", label: "Last recipient", icon: "merge:last", execute: () => preview(records().length - 1) },
    { id: "merge:find", label: "Find recipient", icon: "find", execute: find },
    { id: "merge:check", label: "Check for errors", icon: "merge:check", execute: () => finish(true) },
    { id: "merge:finish", label: "Finish & Merge", icon: "merge:finish", execute: () => finish() },
  ];
}

export function highlightMergeFields(doc: NonNullable<WordEditor["document"]>, view: DocumentView): DocumentAttachment[] {
  return doc.content.contentControls().all().filter(control => control.tag?.startsWith("onodocs:")).flatMap(control => doc.geometry.fragments(control).map(fragment => {
    const marker = document.createElement("span"); marker.className = "merge-field-highlight"; marker.setAttribute("aria-hidden", "true");
    Object.assign(marker.style, { display: "block", background: "#ffd54d40", outline: "1px solid #c8952780" });
    return view.attach(marker, { anchor: fragment, interactive: false });
  }));
}
