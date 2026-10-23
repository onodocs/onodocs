# Customize the Editor

This repository is the source of truth for the Editor package. The complete Editor source lives in [packages/editor](../packages/editor). It includes the ribbon, comments and revision pane, template and form controls, application sessions, and collaboration client.

The OnoDocs-authored Editor code and its build files use the [MIT License](../packages/editor/LICENSE). You may modify and redistribute that code, including in commercial products. Preserve its copyright notice and [third-party notices](../packages/editor/THIRD-PARTY-NOTICES).

The Editor uses the separately licensed `@onodocs/sdk` and `@onodocs/canvas` packages. The Editor's MIT license does not grant production or redistribution rights for those dependencies. See the [dependency licensing terms](https://onodocs.com/terms/).

## Build and install

Use Node.js 22.18 or newer. From this repository's root, run:

```sh
npm --prefix packages/editor run build
```

The build installs dependencies, compiles TypeScript and declarations, and packs the Editor under `~/.tmp/onodocs/editor-source/`. It prints the resulting package path and an `npm install` command for your application. Dependencies and generated files stay outside this checkout. No repository-wide setup is required. The build uses published SDK and Canvas packages; a private engine checkout is not required.

Install the printed archive in your application. To try it with this repository's samples without changing their dependency lockfile, run `npm install --no-save --package-lock=false /path/to/onodocs-editor.tgz`, then `npm start`. Run `npm ci` to return the samples to published dependencies. The public entry points remain:

```ts
import { createEditor, createTemplateEditor } from "@onodocs/editor";
import { openApplicationEditor } from "@onodocs/editor/application";
import { createFormDesigner, openForm } from "@onodocs/editor/forms";
import { openCollaborativeEditor } from "@onodocs/editor/collaboration";
```

Use the [document editor](../examples/editor), [template editor](../examples/template-editor), or [application workflows](document-workflows.md) to exercise your changes. Run `npm start` at the repository root after setup to open the sample catalogue. For a customized published package, choose your own package name and version before building. After renaming the package, replace `@onodocs/editor` in your application's imports with the new name, keeping any `/application`, `/forms`, or `/collaboration` suffix.

To build against local SDK and Canvas package archives, pass their absolute paths:

```sh
npm --prefix packages/editor run build -- --sdk /path/to/sdk.tgz --canvas /path/to/canvas.tgz
```

Those overrides apply to the local build. The packed Editor still declares the dependency versions from its source `package.json`.

For live editing with the optional AI Agent, run `npm ci` and `npm run example:agent:watch` from the repository root. Open `http://127.0.0.1:5198/`; changes in `packages/editor/src` rebuild and reload automatically. Set `OPENAI_API_KEY` in the server environment to use the agent.

## Choose what to change

For branding and host actions, start with `EditorOptions`: select the toolbar tools, fonts, and styles, provide custom ribbon commands, and set the `--onodocs-*` CSS properties on the editor element. See the [EditorOptions declaration](../packages/editor/src/editor.ts) and the [integration guide](https://onodocs.com/developers/document-workflows/).

| Source | Purpose |
| --- | --- |
| [editor.ts](../packages/editor/src/editor.ts) | Ribbon groups, controls, dialogs, and editing interactions |
| [editor-review.ts](../packages/editor/src/editor-review.ts) | Comments, change decisions, comparison, and version history |
| [template-editor.ts](../packages/editor/src/template-editor.ts) and [template-editor-data.ts](../packages/editor/src/template-editor-data.ts) | Template authoring and sample-data controls |
| [forms.ts](../packages/editor/src/forms.ts) and [form-panel.ts](../packages/editor/src/form-panel.ts) | Form design, filling, and validation messages |
| [application.ts](../packages/editor/src/application.ts) | Host persistence, autosave, and recovery |
| [collaboration.ts](../packages/editor/src/collaboration.ts) | Collaboration client and editor synchronization |
| [editor-icons.ts](../packages/editor/src/editor-icons.ts) and [editor-clipboard.ts](../packages/editor/src/editor-clipboard.ts) | Icons and formatted clipboard handling |

Keep document operations on the exported SDK and Canvas APIs. Rebuild after editing the source, then check selection, keyboard interaction, undo/redo, modes, and saved Word/PDF output in the workflows you changed.
