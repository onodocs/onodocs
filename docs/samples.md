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

Open http://127.0.0.1:5174/samples.html. Setup installs matching SDK, Canvas and Editor packages from npm and the other sample dependencies.

| Sample | Entry point | Demonstrates |
| --- | --- | --- |
| Document editor | `examples/editor/main.js` | Realistic documents, ribbon editing, local files and Word/PDF downloads |
| Templates and generation | `examples/proposal/main.js` | Design a template, enter data, then edit the generated document |
| Document forms | `examples/document-forms/main.js` | Form design, recipient completion, drafts and project export |
| Agreement review | `examples/agreement-review/main.js` | Comments, suggestions, comparison and version history |
| Scripted report review | `examples/ai-report/main.js` | Evidence and individual suggestions beside the editor |
| TypeScript DOCX viewer | `examples/docx-viewer/main.ts` | Local files, progressive loading, selection, cancellation and cleanup |
| JavaScript DOCX viewer | `examples/docx-viewer/main.js` | The same complete viewer in JavaScript |
| React and TypeScript viewer | `examples/react-docx-viewer/DocxViewer.tsx` | Typed props, progress, cancellation, replacement and unmount cleanup |
| Viewer | `examples/sdk/document.ts` | Mount a document, open local files, select text, export PNG/PDF |
| HTML attachments | `examples/sdk/document.ts` | Anchor HTML fields to tagged content and collect values |
| Tagged text replacement | `examples/sdk/document.ts` | Fill a booking confirmation and export PDF |
| Text and table extraction | `examples/docx-extraction/main.ts`, `main.js` | Local files, raw tables, header-based records, copy and download |
| Node.js extraction | `examples/docx-extraction/node.ts`, `node.js` | The same extraction function, JSON on stdout |
| Document queries | `examples/sdk/workflows.ts` | Inspect tables, ASCII output and the document tree |
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

Sample code, authored documents and OnoDocs-authored Editor source are MIT-licensed. You may modify and redistribute Editor under MIT while preserving its copyright and third-party notices. SDK and Canvas retain a separate commercial application license: unrestricted-duration non-production evaluation, an optional 30-day watermark-free trial, or a perpetual commercial license for covered releases. One named product includes its frontend, backend, background jobs, collaboration and customer-hosted copies. Finished editors and custom branding are included; redistribution of SDK or Canvas as reusable components or a general document-processing API requires a separately quoted written agreement. Generated DOCX, PDF and extracted data are royalty-free to distribute; preserve evaluation notices. See the [license terms](https://onodocs.com/terms/) for application scope and recipients' use of OnoDocs.

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
shows component usage and Next.js client-component guidance, with links to the full source and styles. Import the component and styles in an existing React application and pass a browser `File` or stable bytes. Only the sample application uses the bundled DOCX loader.

Open http://127.0.0.1:5174/docx-extraction/ or /javascript-extraction/ for the
TypeScript and JavaScript extraction samples. Copy or download body text, all
body tables, or delivery records selected by exact first-row headers. The
[extraction guide](https://onodocs.com/developers/extract-docx-text-tables/) explains
story scope, missing or repeated tables, merged cells and the shared Node.js CLI.

## Inline Word editor

The [document editor](../examples/editor/) uses the ready-made `@onodocs/editor` component. It opens a fictional project report and offers a brief and meeting notes. Use the ribbon for formatting, tables, images, undo/redo and Word/PDF downloads.

From the repository root:

```sh
npm start
```

Open http://127.0.0.1:5174/samples/editor/. Click a page to type. The File ribbon provides Open Word, Download Word and Download PDF. Stop the local server with Ctrl+C. To run this example alone, use `node examples/serve-workflow.mjs editor` and open the printed address.

The SDK owns document operations and saving, Canvas provides presentation, and Editor supplies the toolbar, input handling and history. The sample imports the public editor component and releases it when leaving. Selected documents stay in the browser; refreshing loses unsaved changes.

Rich paste preserves common text formatting, links and lists. Tables and images paste as readable text with a notice. Floating-image manipulation and merged-table restructuring remain limited. Tracked text replacements stay within a paragraph; structural changes require tracking disabled. Imported paragraph-mark and table-row revision decisions require Word. See the [integration guide](https://onodocs.com/developers/document-workflows/#editor) for supported workflows and application callbacks.

Evaluation rendering includes a watermark. Saved DOCX files do not carry that visual watermark; the evaluation and commercial licensing terms still apply.

The [complete workflow samples](document-workflows.md) cover proposal generation, controlled forms, agreement review and source-linked report review.

## Backend viewer

The [backend viewer](../examples/backend-viewer/) includes the server, frontend and an authored DOCX. It requires Google Chrome on the rendering host and installs the SDK’s optional `playwright-core` server dependency explicitly. From the repository root:

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

## Command-line template filling

After setup, run `node examples/fill-template.mjs template.docx completed.docx customer "Willow Design"` from the repository root. The input must contain an editable content control tagged `customer`. Set `ONODOCS_LICENSE_KEY` for licensed use.

## HTTP document service

The [HTTP service](../examples/http-service/server.mjs) uses the SDK server and HTTP entries. Install Google Chrome, set `ONODOCS_SERVICE_TOKEN`, then run `node examples/http-service/server.mjs` from the repository root. The default address is `http://127.0.0.1:5191`. `HOST`, `PORT`, `CHROMIUM_PATH` and `ONODOCS_LICENSE_KEY` configure the service.

The [JavaScript](../examples/http-service/client.mjs), [Python](../examples/http-service/client.py) and [C#](../examples/http-service/client.cs) clients open a Word document and export PDF. Run `node examples/http-service/client.mjs input.docx output.pdf`, `python examples/http-service/client.py input.docx output.pdf`, or `dotnet run --file examples/http-service/client.cs -- input.docx output.pdf` with the same service token. Keep this credential on the backend; production browser clients need application-owned authentication.
