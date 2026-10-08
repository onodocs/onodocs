# Changelog

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
