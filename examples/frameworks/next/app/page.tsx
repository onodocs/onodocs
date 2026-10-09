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
    <div className="toolbar">
      <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) open(file); }} /></label>
      <button type="button" onClick={() => open('/sample.docx')}>Open sample</button>
      <button type="button" onClick={() => setVisible(!visible)}>{visible ? "Hide viewer" : "Show viewer"}</button>
    <a className="demo-source" href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks/next" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub" title="View source on GitHub"><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 16 16"><path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"/></svg></a></div>
    {visible && <Viewer key={document.revision} source={document.source} />}
  </main>;
}
