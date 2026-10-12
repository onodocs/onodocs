import { mountEditor } from "./mount.js";

export function mount(host, input, saveUrl, receiver) {
  let application;
  const stop = mountEditor(host, {
    input,
    onEvent(event) { void receiver.invokeMethodAsync("OnEditorEvent", { type: event.type, state: event.state, error: event.type === "error" ? String(event.error) : null }).catch(console.error); },
    async persist(bytes, signal) {
      const response = await fetch(saveUrl, { method: "PUT", credentials: "same-origin", signal, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, body: bytes });
      if (!response.ok) throw new Error(`Save failed (${response.status})`);
    }
  }, value => { application = value; });
  return {
    save() { if (!application) return Promise.reject(new Error("Editor is still opening.")); return application.save(); },
    dispose: stop
  };
}
