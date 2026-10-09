# Run the document workflows

From the [public developer repository](https://github.com/onodocs/onodocs), run `npm run setup` followed by `npm start`. Open the printed sample catalogue to try the editor, templates, forms, agreement review and extraction. The SDK owns document operations, Canvas owns presentation, and Editor supplies the ribbon, form and application UI. The examples import only their public APIs.

To run one workflow separately after setup:

```sh
node examples/serve-workflow.mjs editor
node examples/serve-workflow.mjs proposal
node examples/serve-workflow.mjs document-forms
node examples/serve-workflow.mjs agreement-review
node examples/serve-workflow.mjs ai-report
node examples/serve-workflow.mjs template-editor
node examples/serve-workflow.mjs document-modes
```

Open the printed local address. Set `PORT` to run several examples at once. The server serves sample assets from your computer; document work runs in the browser. No license is required for watermarked evaluation. Pass your license key in the public document options for licensed use. The public export's `examples/sdk/license.ts` returns an empty evaluation key and makes no licensing request.

One application license covers SDK, Canvas and the named product's self-hosted backend, background jobs and collaboration, including all deployments, tenants and customer-hosted copies. Backend-only automation counts as an application. Finished editors and custom branding are included. Redistributing SDK or Canvas as reusable components or a general document-processing API requires a separately quoted written agreement. Editor code is MIT-licensed and may be modified and redistributed under MIT. Its commercial dependencies retain their own licensing terms. Generated DOCX, PDF and extracted data are royalty-free to distribute; preserve evaluation notices. See the [license terms](https://onodocs.com/terms/) for scope and redistribution rights.

The [public examples repository](https://github.com/onodocs/onodocs/tree/main/examples) contains the complete application source. Each demo links to its own example directory.

The [workflow guide](https://onodocs.com/developers/document-workflows/) contains integration excerpts. Each example directory contains its HTML, CSS and application code. Proposal and agreement samples include their DOCX; the application form also includes its JSON field definition. The report creates its fictional document through the SDK. Form recovery uses `examples/application/recovery.js` and stores one draft per template and definition in this browser.

The [document editor](../examples/editor/) opens a project report with headings, a delivery table, an image and multiple pages. The sample picker also offers a short brief and meeting notes. Use the File ribbon to open a local document or download Word/PDF.

The [template designer](../examples/template-editor/) and [proposal generator](../examples/proposal/) share one proposal template. Design template edits its wording and bindings. Enter data collects proposal details and service rows. Edit generated document opens one result for further edits with the normal Editor controls. Template changes and generated-document changes remain separate. Regeneration asks before replacing edits to the current result. The shared DOCX lives in `examples/proposal/sample.docx`.

[Document modes](../examples/document-modes/) uses the equipment request from `examples/document-forms`. Switch between viewing, editing, reviewing and filling the form without reopening the document. The shared local server serves the matching document and field definition.

The equipment request opens in recipient mode, with answer fields, local drafts, completion and Word/PDF/JSON downloads. Word and JSON contain answers from the same completion snapshot. Invalid input remains available for correction. No request is submitted to an organization. Open the designer with `?mode=design` to edit fields and rules through the Forms ribbon. Preview uses a separate answer session. Export form project downloads the current Word template, definition and runnable application with source and license notices. Extract the ZIP and follow `START.txt`. The exported application starts in watermarked evaluation mode. Definitions control this interface; they do not prevent edits in external software.

Agreement review starts with comments, tracked suggestions and an original version. Use the Review ribbon to reply, accept or reject changes, compare documents and inspect history. The reviewer selector represents two fictional parties and is not authentication. Use Download reviewed Word and Open returned Word to exchange the agreement. Versions last for the current tab. Supported exchange has been checked with Word 16; arbitrary Word review structures are not covered.

Report review uses predetermined local suggestions for its fictional report, with an evidence panel beside the editor. It makes no AI call and does not analyze arbitrary uploads. Apply suggestions individually, continue through refreshed findings, or undo through the editor. Replace `sampleReviewer` with your application's reviewer or `httpReviewer` callback for a real service, with credentials kept on your backend.

PDF export includes searchable text, links, bookmarks and supported tagged structure, with vector graphics where supported and rasterized visible text. It is not a PDF/UA certification. Rendering and pagination depend on available fonts. Always test your documents and browser targets before production use.

For React editing, copy `examples/application/Editor.jsx` and its sibling `mount.js` into a client component. The exported source also includes `mount.ts` for TypeScript builds. Give the host a usable height and memoize `options` and `onReady` to avoid replacing an active session during rerenders. `options` accepts the public application editor persistence, recovery and event callbacks. The existing framework viewer projects provide complete bundler and application shells.

## Shared editing

The [collaboration example](../examples/document-collaboration/) includes a local Node.js service and browser application. Use Node.js 24 LTS or newer and install Chrome for server rendering. Start it from the repository root:

```sh
node examples/document-collaboration/serve.mjs
```

Open the printed address with `?user=alex` and `?user=sam` in separate browser profiles. Use `?user=jo` for review access. The sample keeps edits in `~/.tmp/onodocs/collaboration-demo.sqlite`; browser recovery stays in each profile. Stop the server with Ctrl+C. Set `PORT` if its default port is already in use. The URL-selected identities demonstrate roles and are not production authentication.

For licensed shared sessions, pass `licenseKey` to `createCollaborationService` from `@onodocs/sdk/collaboration` on the server and through the editor's document options in the browser. The public repository and Editor package include the complete collaboration example. The application supplies authentication, roles, transport and atomic storage.
