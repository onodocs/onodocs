# OnoDocs

**Word document rendering, editing and workflows for JavaScript and TypeScript applications.**

OnoDocs renders and edits Word documents in the browser, generates documents from templates and provides typed APIs for document content, forms and review. Local document processing requires no backend. Document analysis and generation also run in Node.js; server page and PDF output uses headless Chromium.

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

Open **http://127.0.0.1:5174/samples.html**. Setup installs matching SDK, Canvas and Editor packages from npm and the other dependencies. No GitHub sign-in or licence key is required. You can also [download the source ZIP](https://github.com/onodocs/onodocs/archive/refs/heads/main.zip).

| Sample | Source | What it demonstrates |
| --- | --- | --- |
| DOCX viewer in TypeScript | [main.ts](examples/docx-viewer/main.ts) | Local files, progressive loading, selection, cancellation and cleanup |
| DOCX viewer in JavaScript | [main.js](examples/docx-viewer/main.js) | The same complete example in plain JavaScript |
| React and TypeScript Word viewer | [DocxViewer.tsx](examples/react-docx-viewer/DocxViewer.tsx) | Typed component, progress, cancellation, replacement, unmounting and Strict Mode |
| Framework applications | [Projects and setup](docs/samples.md#framework-applications) | Vue, Nuxt, Svelte, SvelteKit, Angular, Next.js, Razor Pages and Blazor |
| Viewer, custom forms and templates | [document.ts](examples/sdk/document.ts) | Document viewing, PNG/PDF export, anchored inputs and tagged template fields |
| Text and table extraction | [extract.ts](examples/docx-extraction/extract.ts) | Browser and Node.js text, tables and JSON, with complete JavaScript equivalents |
| Document workflows | [workflows.ts](examples/sdk/workflows.ts) | Tables, document tree, ASCII output and a locally simulated email draft |
| Backend processing and frontend display | [server.mjs](examples/backend-viewer/server.mjs) | Real HTTP endpoints, prepared pages and a Canvas-only frontend |
| Inline Word editor | [main.js](examples/browser-editor/main.js) | Ready-made editor, formatting, review and Word/PDF downloads; [setup](docs/samples.md#inline-word-editor) |
| Proposal generation | [main.js](examples/proposal/main.js) | Generate a proposal, refine its wording and export Word/PDF |
| Document forms | [main.js](examples/document-forms/main.js) | Validate answers, restore local drafts and export matching Word/JSON |
| Agreement review | [main.js](examples/agreement-review/main.js) | Comments, tracked replacements and Word exchange |
| Report review | [main.js](examples/ai-report/main.js) | Show source evidence and approve predetermined local suggestions |
| Node.js analysis | [analyze.ts](examples/analyze.ts) | Read document content without a browser |

The browser file-picker samples keep selected documents in the browser. The backend viewer reads a file on your server and sends prepared pages to the frontend. The samples do not call an AI service or send emails. See [sample setup and commands](docs/samples.md) and [document workflow setup](docs/document-workflows.md).

Framework projects require Node.js 24 LTS (24.15 or later). Razor Pages and Blazor also need the .NET 10 SDK. Each project includes its application shell, document, startup commands and cleanup. See the [framework setup instructions](docs/samples.md#framework-applications).

## Run the backend viewer

Install Google Chrome, then run:

```sh
cd examples/backend-viewer
npm install
npm start
```

Open http://127.0.0.1:5175. The included document is ready to view. To open your own server-side file, use `npm start -- /path/to/document.docx`. Ctrl+C stops the server and its renderer. The [complete guide](https://onodocs.com/developers/#combined) explains both endpoints and links the complete source.

## Guides

- [Editing, generation, forms and review workflows](https://onodocs.com/developers/document-workflows/) ([guide source](guides/document-workflows/index.html))

- [Extract DOCX text and tables in JavaScript and TypeScript](https://onodocs.com/developers/extract-docx-text-tables/) — [guide source](guides/extract-docx-text-tables/index.html)

- [Build a DOCX viewer in JavaScript and TypeScript](https://onodocs.com/developers/javascript-docx-viewer/) — [guide source](guides/javascript-docx-viewer/index.html)
- [Build a React Word viewer with TypeScript and Next.js](https://onodocs.com/developers/react-docx-viewer/) — [guide source](guides/react-docx-viewer/index.html)
- [JavaScript, TypeScript and Node.js integration](https://onodocs.com/developers/) — [guide source](guides/index.html)
- [SDK API reference](https://onodocs.com/developers/api/) — [reference source](guides/api/index.html)

The `guides/` directory contains the complete published HTML, including the code
examples. Its links point to the canonical website; you can also open the guides
from the local sample hub. All SDK entry points and sample sources include types
for TypeScript integrations.

## Use the SDK in your application

Install matching SDK and Canvas packages from npm:

```sh
npm install @onodocs/sdk @onodocs/canvas
```

The SDK owns document processing. Canvas owns painting, views, selection and HTML attachments. Backend analysis needs only the SDK; a frontend displaying prepared pages needs only Canvas. Server page and PDF output also requires `playwright-core` and installed Chrome or Chromium. Install `@onodocs/editor` for the ready-made editor, form UI and application session helpers; it depends on matching SDK and Canvas packages.

```ts
import { openDocument } from "@onodocs/sdk/browser";
import { createDocument } from "@onodocs/canvas";

const doc = await openDocument(file);
const canvasDocument = createDocument(doc);
const view = canvasDocument.mount(document.querySelector<HTMLElement>("#pages")!, { zoom: "fit-width" });
await view.whenRendered();
```

Here `file` is a browser `File` from your application's file picker. The
[complete viewer sample](examples/docx-viewer/main.ts) includes error handling,
cancellation and disposal. For JavaScript, remove the generic type and non-null
assertions, or use [main.js](examples/docx-viewer/main.js).

The packages are also available as [release archives](https://github.com/onodocs/onodocs/releases). Supported Word package types include DOCX, DOCM, DOTX and DOTM; VBA does not
execute. Older DOC/RTF files are not supported. The [inline editor sample](docs/samples.md#inline-word-editor) demonstrates editing, review and DOCX/PDF saving. Editing complex Word structures remains limited. Fonts affect rendering. PDF exports contain searchable text, links and supported tagged structure; visible native text is rasterized. PDF/UA certification is not claimed.

## Licensing and support

The samples, guides and authored sample documents are MIT-licensed; see [LICENSE](LICENSE). SDK, Canvas and Editor are separately distributed under the same application license. Free evaluation has no time limit and is for non-production use, with evaluation notices. Optional trial keys remove watermarks for 30 days. Commercial keys verify offline and permit perpetual use of covered releases.

One named application covers the product's frontend, backend, background jobs and collaboration, including self-hosted services, all deployments, tenants and customer-hosted copies. Backend-only automation counts as an application. Shared backends count the independent products they serve. Finished editors and custom branding are included. Reselling a reusable SDK, editor component or general document-processing API to developers, or granting independent downstream development rights, requires a separately quoted written redistribution agreement.

Generated DOCX, PDF and extracted data are royalty-free to distribute. Recipients need no license unless their software runs OnoDocs outside the covered application scope. Preserve evaluation notices.

[Licensing terms](https://onodocs.com/terms/) ·
[Commercial pricing](https://onodocs.com/pricing/) ·
[Report an issue](https://github.com/onodocs/onodocs/issues) ·
[Support](https://onodocs.com/support/)

Please use minimal fictional documents in public reports. Send private
integration, licensing and billing questions to **support@onodocs.com**.
