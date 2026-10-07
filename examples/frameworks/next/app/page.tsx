"use client";
import { useEffect, useRef, useState } from "react";
import { mountDocument } from "../../../sdk/mount";

function Viewer({ source }: { source: string | File }) {
  const host = useRef<HTMLDivElement>(null);
  const stop = useRef(() => {});
  const [status, setStatus] = useState("Opening document…");
  useEffect(() => {
    const dispose = mountDocument(host.current!, source, error => setStatus(String(error)), setStatus);
    stop.current = dispose;
    return dispose;
  }, [source]);
  return <section>
    <button type="button" onClick={() => { stop.current(); setStatus("Loading cancelled. Open another document to continue."); }}>Cancel loading</button>
    <output role="status">{status}</output>
    <div className="viewport"><div ref={host} className="pages" /></div>
  </section>;
}

export default function Page() {
  const [document, setDocument] = useState<{ source: string | File; revision: number }>({ source: "/sample.docx", revision: 0 });
  const [visible, setVisible] = useState(true);
  function open(source: string | File) { setDocument(previous => ({ source, revision: previous.revision + 1 })); setVisible(true); }
  return <main>
    <h1>Word document viewer</h1>
    <p>Open a local Word file or the included sample. Selected files stay in your browser.</p>
    <a href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks/next">Source on GitHub</a>
    <div className="toolbar">
      <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) open(file); }} /></label>
      <button type="button" onClick={() => open('/sample.docx')}>Open sample</button>
      <button type="button" onClick={() => setVisible(!visible)}>{visible ? "Hide viewer" : "Show viewer"}</button>
    </div>
    {visible && <Viewer key={document.revision} source={document.source} />}
  </main>;
}
