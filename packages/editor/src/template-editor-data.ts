/** Spec: spec/features/template-authoring.md */
interface DataField {
  readonly element: HTMLElement;
  read(): unknown;
}

export function isSampleImage(value: unknown): value is { bytes: Uint8Array; mediaType: string } {
  return value !== null && typeof value === "object" && "bytes" in value && value.bytes instanceof Uint8Array && "mediaType" in value && typeof value.mediaType === "string";
}

export function editTemplateData(container: ShadowRoot, value: unknown, signal: AbortSignal): Promise<{ value: unknown } | undefined> {
  if (signal.aborted) return Promise.resolve(undefined);
  const document = container.ownerDocument, dialog = document.createElement("dialog");
  dialog.className = "template-data-dialog";
  dialog.setAttribute("aria-label", "Sample data");
  dialog.innerHTML = `<style>
.template-data-dialog{box-sizing:border-box;width:640px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);padding:0;border:1px solid #d7dce2;border-radius:12px;color:#29313d;background:white;box-shadow:0 20px 80px #17212d33;font:14px "Segoe UI",Arial,sans-serif}.template-data-dialog::backdrop{background:#10203066}.template-data-dialog *{box-sizing:border-box}.template-data-dialog form{display:flex;flex-direction:column;max-height:calc(100dvh - 34px);margin:0;gap:0}.template-data-dialog header,.template-data-dialog footer{flex:none;padding:20px 24px}.template-data-dialog header{border-bottom:1px solid #e2e6eb}.template-data-dialog h2{font-size:20px;margin:0 0 6px;font-weight:600}.template-data-dialog p{margin:0;color:#647080;line-height:1.5}.template-data-dialog .data-body{overflow:auto;min-height:0;padding:24px}.template-data-dialog .data-fields,.template-data-dialog .data-group{display:grid;gap:16px;min-width:0}.template-data-dialog fieldset{margin:0;border:1px solid #dce1e6;border-radius:8px;padding:16px;min-width:0}.template-data-dialog legend{padding:0 6px;font-weight:600}.template-data-dialog label{display:grid;gap:6px;margin:0;min-width:0;font-weight:500}.template-data-dialog input,.template-data-dialog textarea{width:100%;min-width:0;max-width:100%;margin:0;border:1px solid #cbd2da;border-radius:5px;padding:8px 10px;font:inherit;color:inherit;background:white}.template-data-dialog input{height:38px}.template-data-dialog textarea{min-height:88px;resize:vertical}.template-data-dialog .data-boolean{display:flex;align-items:center;gap:8px}.template-data-dialog .data-boolean input{width:18px;height:18px;accent-color:var(--onodocs-accent,#a33327)}.template-data-dialog button{width:auto;min-height:36px;margin:0;padding:7px 12px;border:1px solid #cbd2da;border-radius:5px;background:white;color:inherit;font:inherit;cursor:pointer}.template-data-dialog button:hover{background:#f2f4f7}.template-data-dialog button:focus-visible,.template-data-dialog input:focus-visible,.template-data-dialog textarea:focus-visible{outline:2px solid var(--onodocs-accent,#a33327);outline-offset:2px}.template-data-dialog .data-mode{margin-top:14px}.template-data-dialog .data-add{justify-self:start}.template-data-dialog .data-remove{justify-self:end;color:#8f2e25}.template-data-dialog .data-json{min-height:280px;font:13px/1.5 Consolas,monospace}.template-data-dialog .data-help{font-size:12px;font-weight:400;color:#647080}.template-data-dialog .data-error{margin:0 24px;color:#a33327;white-space:pre-wrap;overflow-wrap:anywhere}.template-data-dialog footer{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e2e6eb}.template-data-dialog button[type=submit]{background:var(--onodocs-accent,#a33327);border-color:var(--onodocs-accent,#a33327);color:white}.template-data-dialog [hidden]{display:none!important}@media(max-width:520px){.template-data-dialog header,.template-data-dialog footer,.template-data-dialog .data-body{padding:16px}.template-data-dialog fieldset{padding:12px}}
</style><form><header><h2>Sample data</h2><p>Try different values to see how your document will look.</p><button type="button" class="data-mode" aria-expanded="false">Edit JSON</button></header><div class="data-body"><div class="data-fields"></div><div hidden class="data-source"><label>JSON data<textarea class="data-json" spellcheck="false"></textarea></label><p class="data-help">Use an object for one document or an array of records for a batch. Keep attached-image references to reuse their pictures.</p></div></div><p class="data-error" role="alert" hidden></p><footer><button type="button" class="data-cancel">Cancel</button><button type="submit">Apply data</button></footer></form>`;
  const form = dialog.querySelector("form")!, fields = dialog.querySelector<HTMLElement>(".data-fields")!, source = dialog.querySelector<HTMLElement>(".data-source")!, json = dialog.querySelector("textarea")!, toggle = dialog.querySelector<HTMLButtonElement>(".data-mode")!, error = dialog.querySelector<HTMLElement>(".data-error")!;
  let field = dataField(document, value, Array.isArray(value) ? "Documents" : undefined), advanced = false;
  const images = new Map<string, { bytes: Uint8Array; mediaType: string }>();
  fields.append(field.element);
  return new Promise(resolve => {
    let result: { value: unknown } | undefined;
    const close = () => dialog.close();
    dialog.addEventListener("close", () => { signal.removeEventListener("abort", close); dialog.remove(); resolve(result); }, { once: true });
    signal.addEventListener("abort", close, { once: true });
    dialog.querySelector(".data-cancel")!.addEventListener("click", close);
    function read(): { value: unknown } | undefined {
      error.hidden = true;
      if (!advanced) return form.reportValidity() ? { value: field.read() } : undefined;
      try { const value: unknown = JSON.parse(json.value, (_, value) => typeof value === "string" && images.has(value) ? images.get(value) : value); json.removeAttribute("aria-invalid"); return { value }; }
      catch (failure) { error.textContent = failure instanceof Error ? failure.message : "Enter valid JSON to apply these values."; error.hidden = false; json.setAttribute("aria-invalid", "true"); json.focus(); return undefined; }
    }
    toggle.addEventListener("click", () => {
      const current = read();
      if (!current) return;
      if (advanced) { field = dataField(document, current.value, Array.isArray(current.value) ? "Documents" : undefined); fields.replaceChildren(field.element); }
      else {
        images.clear();
        json.value = JSON.stringify(current.value, (_, value) => {
          if (!isSampleImage(value)) return value;
          const reference = `attached-image:${crypto.randomUUID()}`; images.set(reference, value); return reference;
        }, 2);
      }
      advanced = !advanced; fields.hidden = advanced; source.hidden = !advanced;
      fields.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input,textarea").forEach(input => { input.disabled = advanced; });
      toggle.textContent = advanced ? "Edit fields" : "Edit JSON"; toggle.setAttribute("aria-expanded", String(advanced));
      if (advanced) json.focus();
      else fields.querySelector<HTMLElement>("input,textarea,button")?.focus();
    });
    form.addEventListener("submit", event => { event.preventDefault(); const current = read(); if (current) { result = current; dialog.close(); } });
    container.append(dialog); dialog.showModal(); fields.querySelector<HTMLElement>("input,textarea,button")?.focus();
  });
}

function dataField(document: Document, value: unknown, name?: string): DataField {
  if (isSampleImage(value)) {
    const element = document.createElement("div"), title = document.createElement("strong"), description = document.createElement("p");
    title.textContent = name ?? "Image"; description.textContent = "Image attached. Choose an image field in the sidebar to replace it.";
    element.append(title, description);
    return { element, read: () => value };
  }
  if (Array.isArray(value)) {
    const arrayName = name ?? "Items";
    const element = document.createElement("fieldset"), legend = document.createElement("legend"), content = document.createElement("div"), add = document.createElement("button");
    legend.textContent = arrayName; content.className = "data-group"; add.type = "button"; add.className = "data-add"; add.textContent = "Add item"; add.setAttribute("aria-label", `Add item to ${arrayName}`);
    const items: { field: DataField; element: HTMLFieldSetElement; legend: HTMLLegendElement; remove: HTMLButtonElement }[] = [];
    const example = value.length ? value[0] : "";
    function append(value: unknown): void {
      const item = document.createElement("fieldset"), title = document.createElement("legend"), body = document.createElement("div"), remove = document.createElement("button"), field = dataField(document, value);
      body.className = "data-group"; remove.type = "button"; remove.className = "data-remove"; remove.textContent = "Remove item";
      const entry = { field, element: item, legend: title, remove }; items.push(entry);
      body.append(field.element, remove); item.append(title, body); content.append(item);
      remove.addEventListener("click", () => { const index = items.indexOf(entry); items.splice(index, 1); item.remove(); renumber(); (items[index]?.field.element.querySelector<HTMLElement>("input,textarea,button") ?? items[index - 1]?.remove ?? add).focus(); });
    }
    function renumber(): void { items.forEach((item, index) => { item.legend.textContent = `Item ${index + 1}`; item.remove.setAttribute("aria-label", `Remove ${arrayName} item ${index + 1}`); }); }
    for (const item of value) append(item);
    renumber();
    add.addEventListener("click", () => { append(emptyValue(example)); renumber(); items.at(-1)!.field.element.querySelector<HTMLElement>("input,textarea,button")?.focus(); });
    const group = document.createElement("div"); group.className = "data-group"; group.append(content, add); element.append(legend, group);
    return { element, read: () => items.map(item => item.field.read()) };
  }
  if (value !== null && typeof value === "object") {
    const element = document.createElement(name ? "fieldset" : "div"), content = document.createElement("div");
    content.className = "data-group";
    if (name) { const legend = document.createElement("legend"); legend.textContent = name; element.append(legend); }
    const children = Object.entries(value).map(([key, value]) => { const field = dataField(document, value, fieldName(key)); content.append(field.element); return { key, field }; });
    if (!children.length) { const empty = document.createElement("p"); empty.textContent = "No fields yet. Use Edit JSON to add sample fields."; content.append(empty); }
    element.append(content);
    return { element, read: () => Object.fromEntries(children.map(({ key, field }) => [key, field.read()])) };
  }
  const element = document.createElement("label"), title = document.createElement("span"), input = typeof value === "string" && value.includes("\n") ? document.createElement("textarea") : document.createElement("input");
  title.textContent = name ?? "Value";
  if (typeof value === "boolean" && input instanceof HTMLInputElement) {
    element.className = "data-boolean"; input.type = "checkbox"; input.checked = value; element.append(input, title);
    return { element, read: () => input.checked };
  }
  if (typeof value === "number" && input instanceof HTMLInputElement) { input.type = "number"; input.step = "any"; input.required = true; }
  input.value = value === null ? "" : String(value);
  const initialValue = input.value;
  if (value === null) input.placeholder = "No value";
  element.append(title, input);
  return { element, read: () => input.value === initialValue ? value : typeof value === "number" && input instanceof HTMLInputElement ? input.valueAsNumber : value === null && input.value === "" ? null : input.value };
}

function emptyValue(value: unknown): unknown {
  if (isSampleImage(value)) return null;
  if (Array.isArray(value)) return value.length ? [emptyValue(value[0])] : [];
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, emptyValue(child)]));
  return typeof value === "number" ? 0 : typeof value === "boolean" ? false : value === null ? null : "";
}

export function fieldName(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
