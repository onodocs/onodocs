import { createEditor, type EditorOptions, type WordEditor } from "./editor.js";
import { createFormDesigner, type FormDesigner } from "./forms.js";
import { createTemplateEditor, type TemplateEditor } from "./template-editor.js";

import { createFormDefinition } from "@onodocs/sdk/forms";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

export async function openDesigner(options: Readonly<{ kind: "form" | "template"; root: ShadowRoot; editor: WordEditor; document: EditorOptions["document"]; signal: AbortSignal }>): Promise<void> {
  const dialog = document.createElement("dialog"), style = document.createElement("style"), heading = document.createElement("h2"), description = document.createElement("p"), body = document.createElement("div"), design = document.createElement("div"), preview = document.createElement("div"), footer = document.createElement("div"), error = document.createElement("p");
  const source = options.editor.document!.snapshot();
  const isForm = options.kind === "form", title = isForm ? "Form designer" : "Template designer";
  dialog.className = "designer-dialog"; dialog.setAttribute("aria-label", title); heading.textContent = title;
  description.textContent = isForm ? "Design a form from this document. Download a form project to keep its Word template and field rules together." : "Design reusable fields and preview sample values. Use template applies the authored template to your document.";
  style.textContent = `.designer-dialog{width:calc(100vw - 32px);max-width:none;height:calc(100dvh - 32px);max-height:none;padding:0;border:1px solid #c7ced6;border-radius:8px;overflow:hidden}.designer-dialog[open]{display:flex;flex-direction:column}.designer-dialog>header{padding:12px 20px;border-bottom:1px solid #d7dce2;background:white}.designer-dialog h2{margin:0 0 4px;font-size:18px}.designer-dialog>header p{margin:0;font-size:12px;color:#647080}.designer-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;background:#eef0f3}.designer-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;padding:12px 20px;background:white;border-top:1px solid #d7dce2}.designer-actions button{min-height:36px;padding:6px 14px;border:1px solid #c7ced6;border-radius:4px;background:white}.designer-actions button.primary{background:#b43829;border-color:#b43829;color:white}.designer-dialog>p[role=alert]{margin:0;padding:8px 20px;color:#a32828;background:#fff4f2}.designer-dialog [hidden]{display:none!important}@media(max-width:720px){.designer-dialog{width:100vw;height:100dvh;border-radius:0;border:0}.designer-dialog>header,.designer-actions{padding:10px 12px}.designer-actions button{min-height:44px}.designer-actions{gap:6px}}`;
  const header = document.createElement("header"); header.append(heading, description); body.className = "designer-body"; footer.className = "designer-actions"; error.setAttribute("role", "alert"); error.hidden = true; preview.hidden = true; body.append(design, preview); dialog.append(style, header, body, error, footer); options.root.append(dialog);
  let form: FormDesigner | undefined, template: TemplateEditor | undefined, filling: WordEditor | undefined, busy = false, closed = false;
  const lifetime = new AbortController(), signal = AbortSignal.any([options.signal, lifetime.signal]);
  function close(): void { if (closed) return; closed = true; lifetime.abort(); filling?.dispose(); form?.dispose(); template?.dispose(); dialog.close(); dialog.remove(); }
  signal.addEventListener("abort", close, { once: true });
  function button(label: string, action: () => void | Promise<void>, primary = false): HTMLButtonElement {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label; if (primary) button.className = "primary";
    button.addEventListener("click", () => { void run(action); }); footer.append(button); return button;
  }
  async function run(action: () => void | Promise<void>): Promise<void> {
    if (busy || closed) return; busy = true; error.hidden = true;
    const buttons = [...footer.querySelectorAll("button")]; buttons.forEach(button => { button.disabled = true; });
    try { await action(); } catch (failure) { if (!closed) { error.textContent = failure instanceof Error ? failure.message : String(failure); error.hidden = false; } }
    finally { busy = false; buttons.forEach(button => { button.disabled = false; }); }
  }
  function download(bytes: Uint8Array<ArrayBuffer>, name: string, type: string): void {
    const url = URL.createObjectURL(new Blob([bytes], { type })), anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportForm(): Promise<void> {
    const saved = await form!.save(); signal.throwIfAborted();
    download(zipSync({ "template.docx": saved.bytes, "form.json": strToU8(JSON.stringify(saved.definition, null, 2)) }), "form-project.zip", "application/zip");
  }
  const back = button("Back to design", () => { filling?.dispose(); filling = undefined; preview.replaceChildren(); preview.hidden = true; design.hidden = false; back.hidden = true; }); back.hidden = true;
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) close(); }); dialog.showModal();
  try {
    const bytes = await options.editor.save(); signal.throwIfAborted();
    if (isForm) {
      form = createFormDesigner({ container: design, ...(options.document ? { document: options.document } : {}), onExportProject: () => run(exportForm), onPreview: () => run(async () => {
        const saved = await form!.save(); signal.throwIfAborted();
        filling?.dispose(); preview.replaceChildren();
        filling = createEditor({ container: preview, ...(options.document ? { document: options.document } : {}), form: saved.definition, mode: "form", allowedModes: ["form"], toolbar: ["save", "pdf"], onFormComplete(result) { download(result.bytes, "completed-form.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); } });
        try { await filling.open(saved.bytes); signal.throwIfAborted(); } catch (failure) { filling.dispose(); filling = undefined; throw failure; }
        design.hidden = true; preview.hidden = false; back.hidden = false; body.scrollTop = 0;
      }) });
      await form.open(bytes); signal.throwIfAborted();
      button("Open form project", () => {
        const picker = document.createElement("input"); picker.type = "file"; picker.accept = ".zip";
        picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) void run(async () => {
          const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
          if (!files["template.docx"] || !files["form.json"]) throw new Error("Choose a form project containing template.docx and form.json.");
          const definition = createFormDefinition(JSON.parse(strFromU8(files["form.json"]))); signal.throwIfAborted(); await form!.open(files["template.docx"], definition);
          filling?.dispose(); filling = undefined; preview.replaceChildren(); preview.hidden = true; design.hidden = false; back.hidden = true;
        }); }); picker.click();
      });
      button("Close", close); button("Download form project", exportForm, true);
    } else {
      template = createTemplateEditor({ container: design, ...(options.document ? { document: options.document } : {}) });
      await template.open(bytes); signal.throwIfAborted();
      button("Cancel", close); button("Use template", async () => { const bytes = await template!.saveTemplate(); signal.throwIfAborted(); await options.editor.restore(bytes, { ifUnchangedSince: source, mode: "edit", signal }); close(); }, true);
    }
  } catch (failure) { close(); throw failure; }
}
