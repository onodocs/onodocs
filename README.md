# OnoDocs

**A JavaScript and TypeScript SDK for rendering Word documents inside your application.**

OnoDocs renders DOCX pages in the browser, lets users select and copy text, and
provides typed APIs for reading document content and adding application controls.
Local document processing requires no backend. Document analysis also runs in
Node.js; server image and PDF rendering uses headless Chromium.

This is the public home for **guides, runnable samples, SDK release downloads,
and issue reports**. The rendering engine's source repository is private.

[Try the live demos](https://onodocs.com/) ·
[Documentation](https://onodocs.com/developers/) ·
[SDK releases](https://github.com/onodocs/onodocs/releases) ·
[Pricing](https://onodocs.com/pricing/)

## Run the samples

Install Node.js 22.18 or newer, then:

```sh
git clone https://github.com/onodocs/onodocs.git
cd onodocs
npm run setup
npm start
```

Open **http://127.0.0.1:5174/samples.html**. Setup downloads the pinned SDK archive
from this repository's public GitHub release and installs dependencies. No GitHub
sign-in or licence key is required. You can also [download the source ZIP](https://github.com/onodocs/onodocs/archive/refs/heads/main.zip).

| Sample | Source | What it demonstrates |
| --- | --- | --- |
| DOCX viewer in TypeScript | [main.ts](examples/docx-viewer/main.ts) | Local files, progressive loading, selection, cancellation and cleanup |
| DOCX viewer in JavaScript | [main.js](examples/docx-viewer/main.js) | The same complete example in plain JavaScript |
| Viewer, custom forms and templates | [document.ts](examples/sdk/document.ts) | Document viewing, PNG/PDF export, anchored inputs and tagged template fields |
| Document workflows | [workflows.ts](examples/sdk/workflows.ts) | Tables, document tree, ASCII output and a locally simulated email draft |
| Node.js analysis | [analyze.ts](examples/analyze.ts) | Read document content without a browser |

Selected documents stay in your browser. The samples do not upload document
contents, call an AI service or send emails. See [sample setup and commands](docs/samples.md).

## Guides

- [Build a DOCX viewer in JavaScript and TypeScript](https://onodocs.com/developers/javascript-docx-viewer/) — [guide source](guides/javascript-docx-viewer/index.html)
- [JavaScript, TypeScript and Node.js integration](https://onodocs.com/developers/) — [guide source](guides/index.html)
- [SDK API reference](https://onodocs.com/developers/api/) — [reference source](guides/api/index.html)

The `guides/` directory contains the complete published HTML, including the code
examples. Its links point to the canonical website; you can also open the guides
from the local sample hub. All SDK entry points and sample sources include types
for TypeScript integrations.

## Use the SDK in your application

Download the archive named in [sdk-release.json](sdk-release.json) from
[GitHub releases](https://github.com/onodocs/onodocs/releases) and install it:

```sh
npm install ./onodocs-sdk-0.2.0-beta.3.tgz
```

```ts
import { openDocument } from "@onodocs/sdk/browser";

const doc = await openDocument(file, {
  container: document.querySelector<HTMLElement>("#pages")!,
  viewOptions: { zoom: "fit-width" }
});
await doc.view!.whenRendered();
```

Here `file` is a browser `File` from your application's file picker. The
[complete viewer sample](examples/docx-viewer/main.ts) includes error handling,
cancellation and disposal. For JavaScript, remove the generic type and non-null
assertions, or use [main.js](examples/docx-viewer/main.js).

During preview the SDK is distributed as release archives, not through public
npm. Supported Word package types include DOCX, DOCM, DOTX and DOTM; VBA does not
execute. Older DOC/RTF files and general Word editing or DOCX round-trip saving
are not supported. Fonts affect rendering. PDF exports are image-based.

## Licensing and support

The **samples, guides and authored sample documents are MIT-licensed**; see
[LICENSE](LICENSE). The separately distributed SDK has its own licence:
unrestricted-duration non-production evaluation with a watermark, optional
30-day watermark-free trials, and commercial application licences. Signed
commercial keys are verified offline.

[Licensing terms](https://onodocs.com/terms/) ·
[Commercial pricing](https://onodocs.com/pricing/) ·
[Report an issue](https://github.com/onodocs/onodocs/issues) ·
[Support](https://onodocs.com/support/)

Please use minimal fictional documents in public reports. Send private
integration, licensing and billing questions to **support@onodocs.com**.
