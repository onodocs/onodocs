import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "../application/Editor.jsx";
import { recoveryStore } from "../application/recovery.js";

const store = recoveryStore("react-editor:saved-copy");

function App() {
  const application = useRef();
  const [input, setInput] = useState();
  const [state, setState] = useState({ dirty: false, saving: false });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("Opening sample…");
  const [error, setError] = useState(false);
  const reportError = useCallback(error => {
    setError(true);
    setStatus(error instanceof Error ? error.message : "The operation failed. Please retry.");
  }, []);
  useEffect(() => {
    const lifetime = new AbortController();
    void fetch("./sample.docx", { signal: lifetime.signal }).then(async response => {
      if (!response.ok) throw new Error(`Unable to open sample (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      lifetime.signal.throwIfAborted();
      setInput({ bytes, name: "Sample document" });
    }).catch(error => { if (!lifetime.signal.aborted) reportError(error); });
    void store.read().then(bytes => { if (!lifetime.signal.aborted) setSaved(Boolean(bytes)); }).catch(error => { if (!lifetime.signal.aborted) reportError(error); });
    return () => lifetime.abort();
  }, [reportError]);
  useEffect(() => {
    function beforeUnload(event) {
      if (state.dirty) { event.preventDefault(); event.returnValue = ""; }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [state.dirty]);
  const options = useMemo(() => ({
    input: input?.bytes, autosaveDelay: false,
    async persist(bytes) { await store.write(bytes); setSaved(true); },
    onEvent(event) {
      setState(event.state);
      if (event.type === "error") reportError(event.error);
      else if (["ready", "change", "saving", "saved"].includes(event.type)) {
        setError(false);
        setStatus(event.type === "saving" ? "Saving in this browser…" : event.state.dirty ? "Unsaved changes" : event.type === "saved" ? "Saved in this browser" : input.name);
      }
    }
  }), [input, reportError]);
  const onReady = useCallback(value => { application.current = value; setReady(true); }, []);
  async function run(action) {
    setBusy(true);
    try { await action(); } catch (error) { reportError(error); } finally { setBusy(false); }
  }
  async function replace(load, name) {
    if (application.current?.state.dirty && !window.confirm("Discard the unsaved changes and open another document?")) return;
    await run(async () => {
      const bytes = await load();
      if (!bytes) throw new Error("No saved copy is available in this browser.");
      setReady(false);
      application.current = undefined;
      setInput({ bytes, name });
    });
  }
  return <>
    <header>
      <strong>React Word editor</strong>
      <label>Open DOCX <input type="file" accept=".docx" disabled={busy || state.saving} onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void replace(async () => new Uint8Array(await file.arrayBuffer()), file.name);
      }} /></label>
      <button disabled={!ready || busy || state.saving} onClick={() => void run(() => application.current.save())}>Save in this browser</button>
      <button disabled={!saved || busy || state.saving} onClick={() => void replace(() => store.read(), "Saved browser copy")}>Open saved copy</button>
      <button disabled={!saved || busy || state.saving} onClick={() => void run(async () => { await store.remove(); setSaved(false); setError(false); setStatus("Saved browser copy removed. The open document is unchanged."); })}>Clear saved copy</button>
      <a href="https://onodocs.com/developers/react-docx-editor/">Integration guide</a>
      <a href="https://github.com/onodocs/onodocs/tree/main/examples/react-docx-editor">Source</a>
    </header>
    <p className="status" role="status" data-error={error}>{status}</p>
    <p className="privacy-note">Documents stay on this device. Save stores one copy in this browser until you clear it. Ribbon downloads create files; they do not update the saved browser copy.</p>
    <div className="editor-host">{input && <Editor options={options} onReady={onReady} />}</div>
  </>;
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
