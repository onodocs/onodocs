/** Spec: spec/features/document-modes.md */
import { FormValidationError, type DocumentForm, type FormAnswers, type FormField, type FormIssue, type FormValue } from "@onodocs/sdk/forms";

export function createFormPanel(form: DocumentForm, select: (field: FormField) => void, completed?: (result: Awaited<ReturnType<DocumentForm["complete"]>>) => void | Promise<void>) {
  const panel = document.createElement("form"), heading = document.createElement("h2"), status = document.createElement("p"), submit = document.createElement("button");
  panel.setAttribute("aria-label", "Document form"); panel.className = "form-panel";
  heading.textContent = form.definition.title; status.setAttribute("role", "status"); submit.type = "submit"; submit.textContent = "Complete form"; panel.append(heading);
  const inputs = new Map<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(), messages = new Map<string, HTMLElement>(), edits = new Map<string, FormValue>();
  let pending = Promise.resolve();
  const answers = form.answers();
  function errors(issues: readonly FormIssue[]): void {
    for (const [id, message] of messages) { const issue = issues.find(issue => issue.field === id); message.textContent = issue?.message ?? ""; inputs.get(id)!.setAttribute("aria-invalid", String(!!issue)); }
  }
  function values(): FormAnswers { return Object.fromEntries(edits); }
  async function flush(): Promise<void> {
    const changed = values();
    if (!Object.keys(changed).length) return;
    await form.fill(changed);
    for (const [id, value] of Object.entries(changed)) if (edits.get(id) === value) edits.delete(id);
  }
  for (const field of form.definition.fields) {
    const label = document.createElement("label"), title = document.createElement("span"), message = document.createElement("small");
    title.textContent = field.label + (field.required ? " *" : "");
    const input = field.type === "multiline" ? document.createElement("textarea") : field.type === "choice" ? document.createElement("select") : document.createElement("input");
    input.name = field.id; input.setAttribute("aria-label", field.label); input.disabled = !!field.readOnly;
    if (input instanceof HTMLSelectElement) { input.add(new Option("Choose an answer", "")); for (const choice of field.choices!) input.add(new Option(choice)); }
    if (input instanceof HTMLInputElement) { input.type = field.type === "checkbox" ? "checkbox" : ["number", "date", "email"].includes(field.type) ? field.type : "text"; if (field.type === "number") input.step = "any"; }
    if (input instanceof HTMLInputElement && field.type === "checkbox") input.checked = answers[field.id] === true;
    else input.value = answers[field.id] === null ? "" : String(answers[field.id]);
    const help = document.createElement("small"); help.textContent = field.help ?? "";
    message.id = `error-${inputs.size}`; input.setAttribute("aria-describedby", message.id); message.setAttribute("role", "alert");
    label.append(title, input, help, message); panel.append(label); inputs.set(field.id, input); messages.set(field.id, message);
    input.addEventListener("input", () => { status.textContent = ""; message.textContent = ""; input.setAttribute("aria-invalid", "false"); edits.set(field.id, field.type === "checkbox" ? (input as HTMLInputElement).checked : input.value === "" ? null : field.type === "number" ? Number(input.value) : input.value); });
    input.addEventListener("change", () => {
      pending = pending.then(flush).catch(error => { if (error instanceof FormValidationError) errors(error.issues); else status.textContent = String(error); });
    });
    input.addEventListener("focus", () => {
      select(field);
      input.focus({ preventScroll: true });
    });
  }
  panel.noValidate = true; panel.append(submit, status);
  const result = {
    element: panel,
    status,
    async flush() { try { await pending; await flush(); } catch (error) { if (error instanceof FormValidationError) errors(error.issues); throw error; } },
    refresh() { const answers = form.answers(); for (const field of form.definition.fields) { if (edits.has(field.id)) continue; const input = inputs.get(field.id)!; if (input instanceof HTMLInputElement && field.type === "checkbox") input.checked = answers[field.id] === true; else input.value = answers[field.id] === null ? "" : String(answers[field.id]); } },
    async complete() {
      status.textContent = "";
      submit.disabled = true; for (const input of inputs.values()) input.disabled = true;
      try { await result.flush(); const value = await form.complete(); errors([]); status.textContent = "Form completed."; await completed?.(value); return value; }
      catch (error) { if (error instanceof FormValidationError) errors(error.issues); else status.textContent = String(error); throw error; }
      finally { submit.disabled = false; for (const field of form.definition.fields) inputs.get(field.id)!.disabled = !!field.readOnly; }
    }
  };
  panel.addEventListener("submit", event => { event.preventDefault(); void result.complete().catch(() => {}); });
  return result;
}
