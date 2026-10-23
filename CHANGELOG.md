# Changelog

## 2026-10-23: Editor source and 0.5.12

- The current MIT-licensed Editor source and independent build are maintained in `packages/editor`, including the compact ribbon, document views, tables, drawings, equations, charts and review workflows.
- Build your own Editor package with `npm --prefix packages/editor run build`; no private SDK source is needed. See [customization instructions](docs/editor-source.md).
- Samples use SDK, Canvas and Editor 0.5.12 from npm. The optional agent uses the matching public release archive.


## 2026-10-08: Inline browser editor and SDK/Canvas 0.3.0

- Standalone browser editor sample with inline typing, text formatting, paragraph splitting and joining, clipboard, undo/redo and DOCX download.
- SDK and Canvas 0.3.0 provide the editing, saving and caret APIs used by the sample, available from npm and as GitHub release archives.
- Saving preserves untouched package content. Editing complex Word structures remains limited.

## 2026-10-07: SDK and Canvas 0.2.1

- Complete backend viewer sample with real Node.js endpoints, an included DOCX and a Canvas frontend.
- Canvas `openDocument(url)` handles document and page requests.
- Server `manifest` and `page` methods accept `format: "json"` for HTTP response bodies.
- The website and GitHub guide include the same working sample files.

## 2026-10-05 — Initial developer preview

- Runnable viewer, custom form, tagged template, and document workflow samples.
- Node.js document inspection example.
- Issue forms for rendering bugs and feature requests.

The initial samples used the supplied SDK preview archive. Current samples install SDK and Canvas from npm.
