# Document Agent

`@onodocs/agent` is an optional commercial package under the SDK's named-application scope. Your application supplies and pays for its model backend. Ordinary Editor use needs no model service. The [integration guide](https://onodocs.com/developers/document-agent/) and [public API reference](https://onodocs.com/developers/api/#agent) cover the browser and server entry points.

## Install and run

SDK, Canvas and Editor are published to npm. Agent currently ships as the matching GitHub archive:

```sh
npm install @onodocs/editor
npm install https://github.com/onodocs/onodocs/releases/download/sdk-v0.5.12/onodocs-agent-0.5.12.tgz
```

Use matching package releases; see [release notes](https://onodocs.com/releases/). To run this repository's complete example, run `npm install`, provide `OPENAI_API_KEY` in the server environment, then run `npm run example:agent`. Open the printed loopback URL. Never put the key in a browser module. The example includes a backend, SQLite usage records and TXT/DOCX attachments; replace demonstration identities and trust assumptions for production.

## Connect an editor

```js
import { createEditor } from "@onodocs/editor";
import { createAgent, agentRibbonCommand, createHttpTransport, createEditorApiBridge } from "@onodocs/agent";

let agent;
const editor = createEditor({
  container: document.querySelector("#document"),
  commands: [agentRibbonCommand(() => agent?.toggle())]
});
await editor.open(bytes);
agent = createAgent({
  container: document.querySelector("#assistant"), editor,
  transport: createHttpTransport("/api/agent", { credentials: "same-origin" },
    () => createEditorApiBridge(editor, authorizeDocumentCall))
});
```

Supply empty, sized hosts, document bytes and the application's authorization callback. Implement `/api/agent` on your own backend. Dispose Agent and Editor on unmount. The AI Agent command appears before Undo. Use the editor bridge so changes enter history, rendering and application change/autosave handlers.

## Host the service

`@onodocs/agent/server` exposes `runAgentTurn`, `agentEventResponse`, `createApiBridge` and accounting contracts. `@onodocs/agent/openai` supplies `createOpenAIProvider({ apiKey, model })`; its fetch-based provider needs no provider SDK. Additional providers implement `AgentProvider`.

Authenticate users, authorize each document and method, serialize turns, deduplicate request IDs, and supply atomic persistence. The turn host requires reservation, settlement and conversation-commit callbacks. Reserve before each model continuation. Retain reservations when charges are uncertain; an application retry needs its own reservation. Use the complete [example backend](../examples/document-agent/serve.mjs) to see the contracts in context.

## Tools and execution

The model uses the package's current public TypeScript declarations. `api_call` invokes a method with JSON-encoded positional arguments; `api_get` reads properties. Handles belong to their bridge and document snapshot. Reacquire queries and ranges after changes. `document.content` covers all stories; `document.body` covers the body; `document.snapshot()` captures a query. Mutations return observed results, including relevant content and selection.

Browser integrations can use `api_script` to inspect and edit through document, editor and view APIs. It runs in an isolated module worker with a 32 MiB heap and 30-second deadline, without network, storage, credentials or host JavaScript. Return a plain object whose top-level values are strings; explicitly serialize projected arrays/objects. Deploy `script-worker.js` and its chunks or use a worker-aware bundler, with CSP permitting workers and WebAssembly. Server-only hosts must supply an isolated executor to offer scripting.

Stop cancels further work. Completed edits can remain after Stop or a later error; they remain undoable. Inspect observed results and correct unintended changes. An atomic SDK batch is atomic, but an entire multi-call script is not. Document text and attachments are untrusted data and never permission for unrelated actions.

## Context and privacy

The transport sends prompts and required document context to your backend and provider. The default context is text. `pageContext: "image"` additionally supplies a page image; optional `pageImages: true` on the turn host and a compatible editor bridge enable requested page inspection. Hosts own authorization, retention, logs and usage limits.

Attachments use host uploads returning session-authorized IDs. Supported TXT/DOCX context does not silently replace the editable document. Reject unrelated URLs and cross-session references; implement retention and deletion in your application.

The [hosted website demo](https://onodocs.com/samples/document-agent/) uses approved fictional samples and authoritative server documents, with uploads/attachments disabled. It supports individual API calls and limited browser presentation, rather than browser-worker scripts. Its finite session, daily IP and global allowances are demo policies, not SDK document limits. See the [website disclosure](https://onodocs.com/privacy/#document-agent). Your own integration follows your provider and data policies.
