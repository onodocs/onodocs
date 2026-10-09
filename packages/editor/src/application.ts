import { createEditor, type EditorOptions, type WordEditor } from "./editor.js";

export interface RecoveryStore {
  read(): Promise<Uint8Array<ArrayBuffer> | undefined>;
  write(bytes: Uint8Array<ArrayBuffer>): Promise<void>;
  remove(): Promise<void>;
}
export interface ApplicationState { readonly dirty: boolean; readonly saving: boolean; readonly revision: number; }
export type ApplicationEvent = Readonly<{ type: "ready" | "change" | "saving" | "saved" | "disposed"; state: ApplicationState }> | Readonly<{ type: "error"; error: unknown; state: ApplicationState }>;
export interface ApplicationOptions extends Omit<EditorOptions, "onChange" | "onError"> {
  readonly input: ArrayBuffer | Uint8Array | Blob;
  readonly name?: string;
  readonly signal?: AbortSignal;
  readonly persist: (bytes: Uint8Array<ArrayBuffer>, signal: AbortSignal) => Promise<void>;
  readonly recovery?: RecoveryStore;
  readonly restoreRecovery?: boolean;
  readonly autosaveDelay?: number | false;
  readonly onEvent?: (event: ApplicationEvent) => void;
}
export interface ApplicationEditor {
  readonly editor: WordEditor;
  readonly state: ApplicationState;
  markChanged(): void;
  save(): Promise<void>;
  dispose(): void;
}

export async function openApplicationEditor(options: ApplicationOptions): Promise<ApplicationEditor> {
  const lifetime = new AbortController();
  const signal = AbortSignal.any([lifetime.signal, options.signal, options.document?.signal].filter((value): value is AbortSignal => value !== undefined));
  signal.throwIfAborted();
  const delay = options.autosaveDelay ?? 1000;
  if (delay !== false && (!Number.isFinite(delay) || delay < 0)) throw new RangeError("autosaveDelay must be a nonnegative number or false.");
  let revision = 0, savedRevision = 0, saving = false, disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined, queue = Promise.resolve();
  const state = (): ApplicationState => ({ dirty: revision !== savedRevision, saving, revision });
  function notify(event: ApplicationEvent): void { try { options.onEvent?.(event); } catch (error) { console.error(error); } }
  function emit(type: "ready" | "change" | "saving" | "saved" | "disposed"): void { notify({ type, state: state() }); }
  function failed(error: unknown): void { if (!disposed) notify({ type: "error", error, state: state() }); }
  const editor = createEditor({ ...options, document: { ...options.document, signal }, toolbar: options.toolbar ?? ["save", "pdf", "undo", "redo", "bold", "italic", "underline", "font", "size", "color", "alignment", "style", "list", "table", "tableTools", "link", "image", "imageTools", "page", "header", "footer", "find", "replace", ...(options.review ? ["review"] : [])], onError: failed, onChange: changed });
  function changed(): void {
    signal.throwIfAborted();
    revision++; emit("change");
    if (timer !== undefined) clearTimeout(timer);
    if (delay !== false) timer = setTimeout(() => { timer = undefined; void result.save().catch(() => {}); }, delay);
  }
  const result: ApplicationEditor = {
    editor,
    markChanged: changed,
    get state() { return state(); },
    save() {
      if (timer !== undefined) { clearTimeout(timer); timer = undefined; }
      const operation = queue.then(async () => {
        signal.throwIfAborted();
        const current = revision;
        saving = true; emit("saving");
        try {
          const bytes = await editor.save();
          signal.throwIfAborted();
          await options.recovery?.write(bytes);
          signal.throwIfAborted();
          await options.persist(bytes, signal);
          signal.throwIfAborted();
          if (revision === current) await options.recovery?.remove();
          signal.throwIfAborted();
          savedRevision = current;
          saving = false; emit("saved");
        } finally { saving = false; }
      });
      queue = operation.catch(failed);
      return operation;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      saving = false;
      if (timer !== undefined) clearTimeout(timer);
      lifetime.abort(); editor.dispose(); signal.removeEventListener("abort", result.dispose); emit("disposed");
    }
  };
  signal.addEventListener("abort", result.dispose, { once: true });
  try {
    const recovered = options.restoreRecovery ? await options.recovery?.read() : undefined;
    signal.throwIfAborted();
    await editor.open(recovered ?? options.input, options.name);
    signal.throwIfAborted();
    if (recovered) revision++;
    emit("ready");
    return result;
  } catch (error) { failed(error); result.dispose(); throw error; }
}
