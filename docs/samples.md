# OnoDocs samples

OnoDocs renders Word documents in the browser and exposes document structure,
queries, text updates, selection, and geometry for application workflows.
Browser rendering requires no backend. Node.js supports document analysis and, with Chrome installed, page rendering and PDF export.

The [public repository](https://github.com/onodocs/onodocs) contains JavaScript
and TypeScript samples and the published guides. You need Node.js 22.18 or newer
and npm. No GitHub sign-in or license key is required for evaluation.

```sh
git clone https://github.com/onodocs/onodocs.git
cd onodocs
npm run setup
npm start
```

Open http://127.0.0.1:5174/samples.html. Setup installs matching SDK and Canvas packages from npm and the other sample dependencies.

| Sample | Entry point | Demonstrates |
| --- | --- | --- |
| TypeScript DOCX viewer | `examples/docx-viewer/main.ts` | Local files, progressive loading, selection, cancellation and cleanup |
| JavaScript DOCX viewer | `examples/docx-viewer/main.js` | The same complete viewer in JavaScript |
| React and TypeScript viewer | `examples/react-docx-viewer/DocxViewer.tsx` | Typed props, progress, cancellation, replacement and unmount cleanup |
| Viewer | `examples/sdk/document.ts` | Mount a document, open local files, select text, export PNG/PDF |
| Custom form | `examples/sdk/document.ts` | Anchor HTML fields to tagged content and collect values |
| Template | `examples/sdk/document.ts` | Fill a booking confirmation and export PDF |
| Text and table extraction | `examples/docx-extraction/main.ts`, `main.js` | Local files, raw tables, header-based records, copy and download |
| Node.js extraction | `examples/docx-extraction/node.ts`, `node.js` | The same extraction function, JSON on stdout |
| Document workflows | `examples/sdk/workflows.ts` | Inspect tables, ASCII output and the document tree |
| Node.js inspection | `examples/analyze.ts` | Read text and tables without rendering |

```sh
npm run extract
npm run extract -- path/to/document.docx
node examples/docx-extraction/node.js path/to/document.docx > extracted.json
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
`openDocument`. Customer licenses verify offline. Browser verification requires HTTPS or localhost.

Sample code and authored documents are MIT-licensed. The SDK is separately
licensed: unrestricted-duration non-production evaluation, an optional 30-day
watermark-free trial, or a perpetual commercial application license.

[Documentation](https://onodocs.com/developers/) ·
[API reference](https://onodocs.com/developers/api/) ·
[Pricing](https://onodocs.com/pricing/) ·
[Support](https://onodocs.com/support/)

The complete [viewer guide](https://onodocs.com/developers/javascript-docx-viewer/)
and [all guide sources](../guides/) are included in this repository. Browser
samples link directly to their GitHub source. The published samples run in evaluation mode without contacting a licensing service.

Open http://127.0.0.1:5174/react-docx-viewer/ for the React sample. Its development
build keeps Strict Mode enabled. Try Hide viewer during loading, Show viewer,
cancellation and replacement. The [React guide](https://onodocs.com/developers/react-docx-viewer/)
includes the full component, styles and Next.js client-component guidance. Import
the component and styles in an existing React application and pass a browser
`File` or stable bytes. Only the sample application uses the bundled DOCX loader.

Open http://127.0.0.1:5174/docx-extraction/ or /javascript-extraction/ for the
TypeScript and JavaScript extraction samples. Copy or download body text, all
body tables, or delivery records selected by exact first-row headers. The
[extraction guide](https://onodocs.com/developers/extract-docx-text-tables/) explains
story scope, missing or repeated tables, merged cells and the shared Node.js CLI.

## Inline Word editor

The [browser editor](../examples/browser-editor/) edits text directly on rendered Word pages. It includes a fictional document, file opening, font family and size, bold, italic, underline, strikethrough, text color, paragraph alignment, selection, clipboard operations, undo/redo and Word download.

From the repository root:

```sh
cd examples/browser-editor
npm install
npm start
```

Open http://127.0.0.1:5190. Click a page to type. Enter splits a paragraph, Shift+Enter inserts a line break, and Backspace at a paragraph's start joins it to the previous paragraph. Select text before applying formatting, or change formatting at the caret for subsequent typing. Download Word saves the edited DOCX; open that file again to continue editing. Stop the local server with Ctrl+C.

This standalone project installs matching SDK and Canvas packages from npm. It does not need the private engine repository or the root sample dependencies. The local server only serves application files; document processing stays in the browser.

The SDK owns edits, layout and DOCX saving. Canvas paints the pages and selection. The [application](../examples/browser-editor/main.js) uses a textarea at the caret to receive keyboard and IME input, and saved document snapshots for undo/redo. It uses exported package APIs throughout.

This is a basic editor sample. Supported ordinary text and paragraph edits preserve untouched package content. Complex structures can be displayed but have editing restrictions; unsupported operations report an error before changing the document. Rich clipboard formatting, table editing, comments and tracked-change authoring are not provided. Each edit rebuilds the document layout, and undo snapshots use memory proportional to document size and edit history. Refreshing loses unsaved changes.

Evaluation pages display a watermark. Saved DOCX files do not carry that visual watermark; the SDK's evaluation and commercial licensing terms still apply.

## Backend viewer

The [backend viewer](../examples/backend-viewer/) includes the server, frontend and an authored DOCX. It requires Google Chrome on the rendering host. From the repository root:

```sh
cd examples/backend-viewer
npm install
npm start
```

Open http://127.0.0.1:5175. Use `npm start -- /path/to/document.docx` to read your own server-side file. The server binds to localhost and serves the page list at `/document` and page content at `/document/pages/:index`. The browser uses only Canvas. Ctrl+C closes the renderer. See the [complete backend/frontend guide](https://onodocs.com/developers/#combined).

## Optional AI email draft

The browser workflow demo simulates a draft locally. To send a real request, use [draft-email.mjs](../examples/sdk/draft-email.mjs) in a Node.js project with `@onodocs/sdk` and `openai` installed. Put `OPENAI_API_KEY=your-api-key` and `OPENAI_MODEL=your-model-id` on separate lines in a private `.env` file, replacing the placeholders with your API key and a model available to your account. Keep that file out of source control.

```sh
npm install openai
node --env-file=.env examples/sdk/draft-email.mjs examples/view-document/sample.docx
```

The command sends the selected delivery table to OpenAI and prints a draft. API usage is billed separately. It does not send email. The file must contain one table with the first-row headers Deliverable, Owner and Due, as the included brief does. See the [OpenAI text generation guide](https://developers.openai.com/api/docs/guides/text) for API setup.

## Framework applications

Complete projects are available for Vue, Nuxt, Svelte, SvelteKit, Angular, Next.js, ASP.NET Core Razor Pages and Blazor. Use Node.js 24 LTS (24.15 or later). Razor Pages and Blazor also require the .NET 10 SDK. Clone this whole repository and run `npm run setup` at its root before selecting a project.

| Framework | Project directory | Local URL |
| --- | --- | --- |
| Vue | [examples/frameworks/vue](../examples/frameworks/vue/) | http://127.0.0.1:5191 |
| Nuxt | [examples/frameworks/nuxt](../examples/frameworks/nuxt/) | http://127.0.0.1:5192 |
| Svelte | [examples/frameworks/svelte](../examples/frameworks/svelte/) | http://127.0.0.1:5193 |
| SvelteKit | [examples/frameworks/sveltekit](../examples/frameworks/sveltekit/) | http://127.0.0.1:5194 |
| Angular | [examples/frameworks/angular](../examples/frameworks/angular/) | http://127.0.0.1:5195 |
| Next.js | [examples/frameworks/next](../examples/frameworks/next/) | http://127.0.0.1:5196 |
| Razor Pages | [examples/frameworks/razor](../examples/frameworks/razor/) | http://127.0.0.1:5197 |
| Blazor | [examples/frameworks/blazor](../examples/frameworks/blazor/) | http://127.0.0.1:5198 |

For example, run the Vue project from the repository root:

```sh
cd examples/frameworks/vue
npm ci
npm start
```

Use the corresponding directory from the table for another framework. Every project supports these commands. `npm start` prepares its assets and starts the application. Stop it with Ctrl+C. Run `npm run build` in the project directory to build the application.

Each application includes a Word document, local file selection, loading status, error recovery, cancellation, text selection and copying, and Hide viewer / Show viewer controls. Files chosen in the browser are not uploaded. Nuxt, SvelteKit and Next.js render the initial page on the server and open the document after mounting in the browser. Blazor uses an interactive server circuit for its component controls while JavaScript processes the local document.

The applications share [mount.ts](../examples/sdk/mount.ts), [styles](../examples/frameworks/style.css) and the included document. Nuxt reuses the Vue components. Keep the repository directory structure when running these examples. See the [framework guide](https://onodocs.com/developers/#frameworks) for short integration examples.
