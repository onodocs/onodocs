import type { DocumentQuery } from "@onodocs/sdk";
import type { EditorMode, WordEditor } from "./editor.js";

export interface EditorProtectionState {
  readonly policy: string;
  readonly policies: readonly Readonly<{ id: string; label: string; description?: string }>[];
  readonly allowedModes: readonly EditorMode[];
  readonly canChange: boolean;
}
export interface EditorProtectionRequest {
  readonly document: DocumentQuery<"document">;
  readonly signal: AbortSignal;
}
export interface EditorProtectionOptions {
  readonly name: string;
  readonly read: (request: EditorProtectionRequest) => Promise<EditorProtectionState>;
  readonly apply?: (request: EditorProtectionRequest & Readonly<{ policy: string }>) => Promise<EditorProtectionState>;
}

export function showProtection(root: ShadowRoot, editor: WordEditor, provider: EditorProtectionOptions, signal: AbortSignal, focus: () => void): void {
  const snapshot = editor.document!.snapshot(), lifetime = new AbortController();
  const dialog = document.createElement("dialog"), heading = document.createElement("h2"), source = document.createElement("p"), label = document.createElement("label"), policies = document.createElement("select"), description = document.createElement("p"), status = document.createElement("p"), error = document.createElement("p"), actions = document.createElement("div"), refresh = document.createElement("button"), cancel = document.createElement("button"), apply = document.createElement("button"), style = document.createElement("style");
  dialog.className = "protection-dialog"; dialog.ariaLabel = "Protect document"; heading.textContent = "Protect document"; source.textContent = `Access managed by ${provider.name}. These settings apply in this application.`; label.textContent = "Access policy"; label.append(policies); description.className = "protection-description";
  style.textContent = `.protection-dialog{width:480px;max-width:calc(100vw - 24px)}.protection-description{line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;min-height:40px}.protection-dialog .dialog-actions{display:flex;flex-direction:row;gap:8px;justify-content:flex-end}.protection-dialog .protection-apply{background:var(--onodocs-accent,#b43829);color:white;border-color:transparent}.protection-dialog [role=alert]:empty{display:none}`;
  actions.className = "dialog-actions"; apply.className = "protection-apply"; refresh.textContent = "Refresh"; cancel.textContent = "Close"; apply.textContent = "Apply";
  for (const button of [refresh, cancel, apply]) button.type = "button";
  status.setAttribute("role", "status"); error.setAttribute("role", "alert"); actions.append(refresh, cancel, apply); dialog.append(style, heading, source, label, description, status, error, actions); root.append(dialog);
  let state: EditorProtectionState | undefined, busy = false, saving = false, closed = false;
  function update(): void { description.textContent = state?.policies.find(policy => policy.id === policies.value)?.description ?? ""; policies.disabled = busy || !state?.canChange || !provider.apply; refresh.disabled = busy; cancel.disabled = saving; apply.hidden = !provider.apply || !state?.canChange; apply.disabled = busy || !state || policies.value === state.policy || policies.selectedIndex < 0; }
  function dismiss(): void { if (closed) return; closed = true; lifetime.abort(); signal.removeEventListener("abort", dismiss); dialog.close(); dialog.remove(); if (!signal.aborted) focus(); }
  async function load(save: boolean): Promise<void> {
    if (busy) return; busy = true; saving = save; error.textContent = ""; status.textContent = save ? "Updating access…" : "Loading access policy…"; update();
    try {
      if (editor.document?.snapshot() !== snapshot) throw new Error("The document changed. Reopen Protect for the current document.");
      const request: EditorProtectionRequest = { document: snapshot, signal: lifetime.signal };
      const next = await (save ? provider.apply!({ ...request, policy: policies.value }) : provider.read(request));
      lifetime.signal.throwIfAborted(); let synchronized = false;
      await editor.synchronize(async () => { lifetime.signal.throwIfAborted(); if (editor.document?.snapshot() !== snapshot) throw new Error("The document changed. Reopen Protect for the current document."); synchronized = true; return { allowedModes: next.allowedModes }; });
      if (!synchronized) throw new Error("Finish composing text, then refresh the access policy.");
      if (closed) return; state = next; policies.replaceChildren(...next.policies.map(policy => new Option(policy.label, policy.id))); policies.value = next.policy;
      status.textContent = save ? "Access policy updated." : next.canChange && provider.apply ? "Choose a policy and apply it." : "You can view the current access policy.";
    } catch (cause) { if (!closed && !lifetime.signal.aborted) { error.textContent = cause instanceof Error ? cause.message : String(cause); status.textContent = "Access policy could not be updated. Your choice is retained."; } }
    finally { if (!closed) { busy = false; saving = false; update(); } }
  }
  policies.addEventListener("change", update); refresh.addEventListener("click", () => { void load(false); }); apply.addEventListener("click", () => { void load(true); }); cancel.addEventListener("click", dismiss);
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (!saving) dismiss(); }); signal.addEventListener("abort", dismiss, { once: true }); update(); dialog.showModal(); void load(false);
}
