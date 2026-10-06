"use client";

import { useState } from "react";
import { DocxViewer } from "./DocxViewer";
import sample from "../view-document/sample.docx";

export function App() {
  const [source, setSource] = useState<File | Uint8Array>(sample);
  const [visible, setVisible] = useState(true);

  return <>
    <header>
      <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (file) { setSource(file); setVisible(true); }
      }} /></label>
      <button type="button" onClick={() => { setSource(sample.slice()); setVisible(true); }}>Open sample</button>
      <button type="button" onClick={() => setVisible(value => !value)}>{visible ? "Hide viewer" : "Show viewer"}</button>
      <a href="https://github.com/onodocs/onodocs/tree/main/examples/react-docx-viewer" target="_blank" rel="noopener">Source on GitHub</a>
    </header>
    {visible ? <DocxViewer source={source} /> : <p className="closed-message">Viewer closed. Show it again to reopen the document.</p>}
  </>;
}
