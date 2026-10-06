# OnoDocs samples

OnoDocs renders Word documents in the browser and exposes document structure,
queries, text updates, selection, and geometry for application workflows.
Rendering requires no backend. Document analysis also runs in Node.js.

The [public repository](https://github.com/onodocs/onodocs) contains JavaScript
and TypeScript samples and the published guides. You need Node.js 22.18 or newer
and npm. No GitHub sign-in or public npm SDK release is required.

```sh
git clone https://github.com/onodocs/onodocs.git
cd onodocs
npm run setup
npm start
```

Open http://127.0.0.1:5174/samples.html. Setup downloads the SDK archive from this
repository's release and installs its dependencies. You can instead download
the archive named in `sdk-release.json` into `vendor/` yourself and run `npm install`.

| Sample | Entry point | Demonstrates |
| --- | --- | --- |
| TypeScript DOCX viewer | `examples/docx-viewer/main.ts` | Local files, progressive loading, selection, cancellation and cleanup |
| JavaScript DOCX viewer | `examples/docx-viewer/main.js` | The same complete viewer in JavaScript |
| React and TypeScript viewer | `examples/react-docx-viewer/DocxViewer.tsx` | Typed props, progress, cancellation, replacement and unmount cleanup |
| Viewer | `examples/sdk/document.ts` | Mount a document, open local files, select text, export PNG/PDF |
| Custom form | `examples/sdk/document.ts` | Anchor HTML fields to tagged content and collect values |
| Template | `examples/sdk/document.ts` | Fill a booking confirmation and print it |
| Document workflows | `examples/sdk/workflows.ts` | Inspect tables, ASCII output and the document tree |
| Node.js inspection | `examples/analyze.ts` | Read text and tables without rendering |

```sh
npm run analyze
npm run analyze -- path/to/document.docx
npm run typecheck
npm run build
```

Build output goes to `~/.tmp/onodocs-samples/dist`. The browser examples embed
the authored sample documents and do not upload selected documents. The email
draft step is simulated locally; it makes no AI request and sends no email.

Samples intentionally use evaluation mode, which adds a watermark. For a
watermark-free trial or commercial use, pass your issued `licenseKey` to
`openDocument`. Customer licenses verify offline; never embed a signing key.

Sample code and authored documents are MIT-licensed. The SDK is separately
licensed: unrestricted-duration non-production evaluation, an optional 30-day
watermark-free trial, or a perpetual commercial application license.

[Documentation](https://onodocs.com/developers/) ·
[API reference](https://onodocs.com/developers/api/) ·
[Pricing](https://onodocs.com/pricing/) ·
[Support](https://onodocs.com/support/)

The complete [viewer guide](https://onodocs.com/developers/javascript-docx-viewer/)
and [all guide sources](../guides/) are included in this repository. Browser
samples link directly to their GitHub source. The published samples use an
evaluation-only licence adapter; they do not contact the website licensing API.

Open http://127.0.0.1:5174/react-docx-viewer/ for the React sample. Its development
build keeps Strict Mode enabled. Try Hide viewer during loading, Show viewer,
cancellation and replacement. The [React guide](https://onodocs.com/developers/react-docx-viewer/)
includes the full component, styles and Next.js client-component guidance. Import
the component and styles in an existing React application and pass a browser
`File` or stable bytes. Only the sample application uses the bundled DOCX loader.
