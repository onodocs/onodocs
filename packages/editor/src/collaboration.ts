/** Spec: spec/features/document-collaboration.md */
import { createEditor, type EditorChange, type EditorMode, type EditorOptions, type WordEditor } from "./editor.js";
import { CollaborationAccessError, decodeCollaborationBytes, encodeCollaborationBytes, type CollaborationMutation, type CollaborationOperation, type CollaborationRange, type CollaborationReply, type CollaborationRequest, type CollaborationSnapshot } from "@onodocs/sdk/collaboration";

export interface CollaborationDraft {
  readonly shared: CollaborationSnapshot & { readonly bytes: string };
  readonly user: string;
  readonly mutation: CollaborationMutation;
  readonly bytes: string;
  readonly attempted: boolean;
  readonly later: boolean;
}
export interface CollaborationRecovery {
  read(): Promise<CollaborationDraft | undefined>;
  write(draft: CollaborationDraft): Promise<void>;
  remove(): Promise<void>;
}
export interface CollaborativeEditorOptions {
  readonly container: HTMLElement;
  readonly editor?: Omit<EditorOptions, "container" | "onChange" | "mode" | "allowedModes" | "readOnly" | "form" | "review">;
  readonly exchange: (request: CollaborationRequest, signal: AbortSignal) => Promise<CollaborationReply>;
  readonly recovery: CollaborationRecovery;
  readonly onError?: (error: unknown) => void;
}
export interface CollaborativeEditor {
  readonly editor: WordEditor;
  readonly state: "connected" | "pending" | "offline" | "conflict" | "forbidden";
  readonly shared: CollaborationSnapshot;
  sync(): Promise<void>;
  exportDraft(): Uint8Array<ArrayBuffer> | undefined;
  useShared(): Promise<void>;
  publishDraft(): Promise<void>;
  dispose(): void;
}

export async function openCollaborativeEditor(options: CollaborativeEditorOptions): Promise<CollaborativeEditor> {
  const session = crypto.randomUUID(), lifetime = new AbortController();
  let draft = await options.recovery.read(), state: CollaborativeEditor["state"] = draft ? "pending" : "connected", disposed = false, accessRevoked = false;
  let shared: CollaborationSnapshot & { readonly bytes: string };
  try {
    const initial = (await options.exchange({ session }, AbortSignal.any([lifetime.signal, AbortSignal.timeout(5000)]))).document;
    if (!initial.bytes) throw new Error("The shared document has no content.");
    shared = { ...initial, bytes: initial.bytes };
  } catch (error) { if (!draft) throw error; shared = draft.shared; accessRevoked = error instanceof CollaborationAccessError; state = accessRevoked ? "forbidden" : "offline"; options.onError?.(error); }
  if (draft && draft.user !== shared.identity.id) throw new Error("This recovery store belongs to another user. Export or resolve that user's draft before opening it.");
  const host = document.createElement("section"), status = document.createElement("p"), members = document.createElement("p"), actions = document.createElement("div"), editorHost = document.createElement("div");
  host.className = "onodocs-collaboration"; status.setAttribute("role", "status"); members.setAttribute("aria-label", "People in this document");
  host.append(status, members, actions, editorHost); options.container.append(host);
  const modes = (): EditorMode[] => accessRevoked ? ["view"] : shared.identity.role === "edit" ? ["edit", "review", "view"] : shared.identity.role === "review" ? ["review", "view"] : ["view"];
  let changes = Promise.resolve();
  const undoDrafts: (CollaborationDraft | undefined)[] = [], redoDrafts: (CollaborationDraft | undefined)[] = [];
  const editor = createEditor({ ...options.editor, container: editorHost, ...(options.onError ? { onError: options.onError } : {}), toolbar: options.editor?.toolbar ?? ["save", "pdf", "find", "mode", "bold", "italic", "underline", "font", "size", "alignment", "review"], mode: modes()[0]!, allowedModes: modes(), review: { identity: () => ({ author: shared.identity.name, date: new Date().toISOString() }) }, onChange(_current, change) {
    const next = changes.then(async () => {
      const bytes = encodeCollaborationBytes(change.bytes!), operation = toOperation(change);
      const previous = draft;
      if (change.history) {
        const from = change.history === "undo" ? undoDrafts : redoDrafts, to = change.history === "undo" ? redoDrafts : undoDrafts;
        const restored = from.pop(); to.push(previous);
        draft = previous?.attempted ? { ...previous, bytes, later: true } : restored && { ...restored, bytes };
      } else {
        undoDrafts.push(previous); redoDrafts.length = 0;
        if (draft?.attempted) draft = { ...draft, bytes, later: true };
        else {
          const operations = operation && !draft?.mutation.snapshot ? [...(draft?.mutation.operations ?? []), operation] : undefined;
          draft = { shared, user: shared.identity.id, bytes, attempted: false, later: false, mutation: { user: shared.identity.id, id: crypto.randomUUID(), base: draft?.mutation.base ?? shared.token, checkpoint: draft?.mutation.checkpoint ?? shared.checkpoint, ...(operations ? { operations } : { snapshot: bytes }) } };
        }
      }
      state = draft ? "pending" : "connected"; render();
      try { if (draft) await options.recovery.write(draft); else await options.recovery.remove(); }
      catch (error) { state = "offline"; render(); throw error; }
    });
    changes = next.catch(() => {});
    return next;
  } });
  try { await editor.open(decodeCollaborationBytes(draft?.bytes ?? shared.bytes)); } catch (error) { editor.dispose(); host.remove(); throw error; }
  let displayedToken = shared.token;
  function render(): void {
    status.textContent = ({ connected: "All changes saved", pending: "Saving changes", offline: draft ? "Offline. Your draft is retained; reconnect to retry." : "Offline. Reconnect to refresh shared presence.", conflict: "Changes conflict with the shared document. Your draft is retained. Download it before using the shared copy, or explicitly publish it over the current shared copy.", forbidden: draft ? "Permission changed. Your draft is retained for download." : "Access to this shared document is unavailable." })[state];
    members.textContent = accessRevoked ? "" : shared.presence.map(member => `${member.name} (${member.role}${member.selection === undefined ? "" : `, paragraph ${member.selection.start.paragraph + 1}`})`).join(" · ");
    actions.hidden = !draft;
    publish.disabled = accessRevoked || !draft || shared.identity.role !== "edit" || !["conflict", "forbidden"].includes(state);
    editorHost.inert = state === "conflict" || state === "forbidden";
    const paragraphs = editor.document!.query.paragraphs().all();
    const overlays = state === "connected" && !draft && displayedToken === shared.token ? shared.presence.flatMap(member => {
      if (member.session === session && member.user === shared.identity.id || member.selection?.token !== displayedToken) return [];
      const range = member.selection, start = paragraphs[range.start.paragraph], end = paragraphs[range.end.paragraph];
      if (!start || !end) return [];
      let hash = 0; for (const character of member.user) hash = (hash * 31 + character.charCodeAt(0)) | 0;
      return [{ selection: { start: { paragraphId: start.id, offset: range.start.offset }, end: { paragraphId: end.id, offset: range.end.offset } }, label: member.name, color: ["#8b3ab8", "#176d60", "#b34327", "#2556b8", "#a21b65", "#795514"][Math.abs(hash) % 6]! }];
    }) : [];
    editor.view?.setSelectionOverlays(overlays);
  }
  function button(label: string, action: () => void | Promise<void>): HTMLButtonElement {
    const element = document.createElement("button"); element.type = "button"; element.textContent = label;
    element.addEventListener("click", () => { void Promise.resolve().then(action).catch(error => options.onError?.(error)); }); actions.append(element); return element;
  }
  button("Download local draft", () => {
    const bytes = result.exportDraft(); if (!bytes) return;
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })), link = document.createElement("a");
    link.href = url; link.download = "collaboration-draft.docx"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  button("Use shared copy and discard local draft", () => result.useShared());
  const publish = button("Publish local draft over shared copy", () => result.publishDraft());
  const result: CollaborativeEditor = {
    editor,
    get state() { return state; }, get shared() { return shared; },
    async sync() {
      if (disposed) return;
      let displayToken: string | undefined;
      await editor.synchronize(async () => {
        await changes;
        try {
          const paragraphs = editor.document!.query.paragraphs().all(), range = editor.selection;
          const start = paragraphs.findIndex(value => value.id === range?.start.paragraphId), end = paragraphs.findIndex(value => value.id === range?.end.paragraphId);
          const selection = !draft && displayedToken === shared.token && range && start >= 0 && end >= 0 ? { token: displayedToken, start: { paragraph: start, offset: range.start.offset }, end: { paragraph: end, offset: range.end.offset } } : undefined;
          const sending = draft && !["conflict", "forbidden"].includes(state);
          if (sending) { draft = { ...draft!, attempted: true }; await options.recovery.write(draft); }
          const reply = await options.exchange({ session, token: shared.token, ...(selection ? { selection } : {}), ...(sending ? { mutation: draft!.mutation } : {}) }, AbortSignal.any([lifetime.signal, AbortSignal.timeout(5000)]));
          accessRevoked = false;
          const changed = reply.document.token !== displayedToken; shared = { ...reply.document, bytes: reply.document.bytes ?? shared.bytes };
          if (sending && reply.status === "saved") {
            if (draft!.later) { state = "conflict"; render(); return { allowedModes: modes() }; }
            await options.recovery.remove(); draft = undefined; state = "connected"; render();
            undoDrafts.length = redoDrafts.length = 0; displayToken = shared.token; return { bytes: decodeCollaborationBytes(shared.bytes), allowedModes: modes() };
          }
          if (sending && (reply.status === "conflict" || reply.status === "forbidden")) state = reply.status;
          else if (!draft) state = "connected";
          if (shared.identity.role === "view" && draft) state = "forbidden";
          if (changed && !draft) { undoDrafts.length = redoDrafts.length = 0; displayToken = shared.token; }
          render(); return { ...(changed && !draft ? { bytes: decodeCollaborationBytes(shared.bytes) } : {}), allowedModes: modes() };
        } catch (error) { if (!disposed) { accessRevoked ||= error instanceof CollaborationAccessError; state = accessRevoked ? "forbidden" : "offline"; render(); options.onError?.(error); } return accessRevoked ? { allowedModes: ["view"] } : undefined; }
      }).then(() => { if (displayToken) displayedToken = displayToken; render(); }, error => { if (!disposed) { state = "offline"; render(); options.onError?.(error); } });
    },
    exportDraft() { return draft ? decodeCollaborationBytes(draft.bytes) : undefined; },
    async useShared() {
      await editor.synchronize(async () => {
        await changes;
        const current = (await options.exchange({ session }, lifetime.signal)).document;
        if (!current.bytes) throw new Error("The shared document has no content.");
        shared = { ...current, bytes: current.bytes }; accessRevoked = false;
        await options.recovery.remove(); draft = undefined; undoDrafts.length = redoDrafts.length = 0; state = "connected"; render(); return { bytes: decodeCollaborationBytes(shared.bytes), allowedModes: modes() };
      });
      displayedToken = shared.token; render();
    },
    async publishDraft() {
      await editor.synchronize(async () => {
        await changes;
        if (accessRevoked || !draft || shared.identity.role !== "edit") throw new Error("Publishing a replacement requires edit permission.");
        draft = { ...draft, attempted: false, later: false, mutation: { user: shared.identity.id, id: crypto.randomUUID(), base: shared.token, checkpoint: shared.checkpoint, snapshot: draft.bytes } };
        await options.recovery.write(draft); state = "pending"; render(); return undefined;
      });
      await result.sync();
    },
    dispose() { if (disposed) return; disposed = true; clearTimeout(timer); lifetime.abort(); editor.dispose(); host.remove(); void options.exchange({ session, leave: true }, AbortSignal.timeout(2000)).catch(() => {}); },
  };
  let timer: ReturnType<typeof setTimeout>;
  async function poll(): Promise<void> { try { await result.sync(); } catch (error) { if (!disposed) options.onError?.(error); } if (!disposed) timer = setTimeout(() => { void poll(); }, 750); }
  render(); timer = setTimeout(() => { void poll(); }, 0);
  return result;
}

function toOperation(change: EditorChange): CollaborationOperation | undefined {
  const command = change.edit ?? change.review;
  if (!command) return;
  let range: CollaborationRange | undefined;
  if ("selection" in command) {
    if (command.selection.start.paragraphId !== command.selection.end.paragraphId) return;
    const paragraph = change.paragraphs?.findIndex(value => value.id === command.selection.start.paragraphId) ?? -1;
    if (paragraph < 0) return;
    range = { paragraph, before: change.paragraphs![paragraph]!.text, start: command.selection.start.offset, end: command.selection.end.offset };
  }
  if (change.edit?.kind === "replace" && range && !change.edit.formatting && !/[\r\n]/.test(change.edit.text)) return { kind: "replace", ...range, text: change.edit.text };
  if (change.review && ["comment", "reply", "resolveComment", "deleteComment", "revision", "trackChanges"].includes(change.review.kind)) return { kind: "review", command: change.review, ...(range ? { range } : {}) };
  return undefined;
}

export function createCollaborationRecovery(key: string): CollaborationRecovery {
  const database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("onodocs-collaboration");
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  async function access(write: boolean, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    const db = await database;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("drafts", write ? "readwrite" : "readonly"), request = action(transaction.objectStore("drafts"));
      transaction.oncomplete = () => resolve(request.result); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
    });
  }
  return { async read() { return await access(false, store => store.get(key)) as CollaborationDraft | undefined; }, async write(draft) { await access(true, store => store.put(draft, key)); }, async remove() { await access(true, store => store.delete(key)); } };
}

export function createCollaborationTransport(url: string, fetcher: typeof fetch = fetch): CollaborativeEditorOptions["exchange"] {
  return async (request, signal) => {
    const response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify(request), signal });
    if (response.status === 403) throw new CollaborationAccessError();
    if (!response.ok) throw new Error(`Collaboration request failed (${response.status}).`);
    return await response.json() as CollaborationReply;
  };
}
