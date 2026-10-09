# Run the document workflows

Install matching released `@onodocs/sdk`, `@onodocs/canvas` and `@onodocs/editor` packages, plus `esbuild`. The SDK owns document operations, Canvas owns presentation, and Editor supplies the ready-made editing, form and application UI. The examples import only their public APIs. From the developer repository, run one of:

```sh
node examples/serve-workflow.mjs editor
node examples/serve-workflow.mjs proposal
node examples/serve-workflow.mjs document-forms
node examples/serve-workflow.mjs agreement-review
node examples/serve-workflow.mjs ai-report
```

Open the printed local address. Set `PORT` to run several examples at once. The server serves sample assets from your computer; document work runs in the browser. No license is required for watermarked evaluation. Pass your license key in the public document options for licensed use. The public export's `examples/sdk/license.ts` returns an empty evaluation key and makes no licensing request.

The [workflow guide](https://onodocs.com/developers/document-workflows/) contains integration excerpts. Each example directory contains its HTML, CSS and application code. Proposal and agreement samples include their DOCX; the application form also includes its JSON field definition. The report creates its fictional document through the SDK. Form recovery uses `examples/application/recovery.js` and stores one draft per template and definition in this browser.

Proposal generation repeats service rows, then permits wording edits before DOCX/PDF export. It asks before regeneration overwrites those edits. Refreshing starts a new proposal.

The equipment request validates permitted answers and exports completed Word and JSON from one snapshot. Invalid input remains available for correction. Drafts remain local and no request is submitted to an organization. Definitions control this interface; they do not prevent edits in external software.

Agreement review records comments, replies and tracked text replacements. Use the reviewer selector to try both fictional parties. Accept or reject suggestions, compare the original, download Word, then reopen a Word-edited copy. Reviewer selection is sample identity, not authentication. Versions last for the current tab. Supported exchange has been checked with Word 16; arbitrary Word review structures are not covered.

Report review uses predetermined local suggestions for its fictional report. It makes no AI call and does not analyze arbitrary uploads. Replace `sampleReviewer` with your application's reviewer or `httpReviewer` callback for a real service, with credentials kept on your backend. The user approves each edit; changing the document invalidates earlier source references and requires another review.

PDF export includes searchable text, links, bookmarks and supported tagged structure, with vector graphics where supported and rasterized visible text. It is not a PDF/UA certification. Rendering and pagination depend on available fonts. Always test your documents and browser targets before production use.

For React editing, copy `examples/application/Editor.jsx` and its sibling `mount.js` into a client component. The exported source also includes `mount.ts` for TypeScript builds. Give the host a usable height and memoize `options` and `onReady` to avoid replacing an active session during rerenders. `options` accepts the public application editor persistence, recovery and event callbacks. The existing framework viewer projects provide complete bundler and application shells.
