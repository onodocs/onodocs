# Document Agent

`@onodocs/agent` is an optional commercial package under the SDK's named-application scope. Your application supplies and pays for its model backend. Ordinary Editor use needs no model service. The [integration guide](https://onodocs.com/developers/document-agent/) and [public API reference](https://onodocs.com/developers/api/#agent) cover the browser and server entry points.

## Install and run

SDK, Canvas and Editor are published to npm. Agent currently ships as the matching GitHub archive:

```sh
npm install @onodocs/editor
npm install https://github.com/onodocs/onodocs/releases/download/sdk-v0.5.13/onodocs-agent-0.5.13.tgz
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

The Agent starts with a high-level API map. Its built-in `api_read({sections: [{name, offset?}]})` tool reads related sections together: specific roots, members and named types from the generated API reference when needed. Long sections return `nextOffset`. The default total context allowance is 1,000,000 bytes, separate from the host usage limits.

`@onodocs/agent/server` exposes `runAgentTurn`, `agentEventResponse`, `createApiBridge` and accounting contracts. `@onodocs/agent/openai` supplies `createOpenAIProvider({ apiKey, model })`; its fetch-based provider needs no provider SDK. Additional providers implement `AgentProvider`.

Authenticate users, authorize each document and method, serialize turns, deduplicate request IDs, and supply atomic persistence. The turn host requires reservation, settlement and conversation-commit callbacks. Reserve before each model continuation. Retain reservations when charges are uncertain; an application retry needs its own reservation. Use the complete [example backend](../examples/document-agent/serve.mjs) to see the contracts in context.

## Configuration and application tools

The server host chooses the provider, instructions, tools, permissions, conversation storage and limits. The browser panel controls presentation and context capture. The [Agent configuration guide](https://onodocs.com/developers/agent-configuration/) documents these separately.

Pass application tools to `runAgentTurn` through `AgentTurnHost.tools`. Each `AgentTool` has a name, description, JSON Schema `parameters`, and `execute(arguments, signal)` callback. The callback returns JSON or a promise of JSON and runs on the server host. Tool definitions are sent to the provider; callbacks are not. Names use 1–64 ASCII letters, digits, underscores or hyphens and must be unique. `api_call`, `api_get`, `api_script` and `get_page_image` are reserved, including when page images are disabled.

```js
const tools = [{
  name: "get_clause",
  description: "Read an approved clause by its identifier.",
  parameters: {
    type: "object",
    properties: { id: { type: "string", enum: ["payment"] } },
    required: ["id"],
    additionalProperties: false
  },
  execute(input, signal) {
    signal.throwIfAborted();
    if (!input || typeof input !== "object" || Array.isArray(input) || input.id !== "payment") {
      throw new TypeError("Unknown clause identifier.");
    }
    return { text: "Payment is due within 30 days of the invoice date." };
  }
}];

const events = runAgentTurn({ ...host, tools }, conversation, request, signal);
```

Here `host` is the existing authenticated host with provider, document bridge, reservation, settlement and commit callbacks. Tools are selected for each turn; construct them with the current user's authorized application context. JSON Schema describes arguments to the model. It does not replace validation or authorization inside the callback. The OpenAI adapter uses non-strict function schemas for application tools, preserving optional properties without rewriting the supplied schema.

Application tools share document-tool operation limits, cancellation, result truncation, provider reservations and continuation handling. Their definitions count toward context and input reservations. Exceptions become ordinary tool error results so the model can respond or correct arguments; cancellation stops the turn. Callbacks should pass the abort signal to I/O. External changes, such as database writes, are not rolled back by cancellation or document Undo; the application owns confirmation, idempotency and recovery.

Custom providers receive `ProviderRequest.tools` containing definitions only and return `{ id, tool: { name, arguments } }` in `ProviderResponse.calls`. Document calls retain `{ id, call }`. The loop resolves application calls against the host's registered tools, never against document handles. Existing `operation` events describe them with `target: "$tool"`, the tool name as `method`, and a single arguments value; ordinary `result` and `error` handling remains unchanged. Model continuation items and function outputs use the existing conversation format, which custom adapters must translate to their provider's format.

`AgentTurnHost.instructions` supplies application instructions before the generated API reference. `limits` configures message/context/result sizes, model rounds, operation count, timeout and output tokens; use `defaultAgentLimits` as a starting point. `resultPropertyCharacters` caps each top-level result property. `pageImages` enables on-demand visual tools when the bridge supplies capture. `attachments` resolves authorized attachment references. Reservation, settlement and commit callbacks remain required.

`createOpenAIProvider` accepts `model`, `apiKey` (a string or credential callback), `endpoint`, `fetch`, `reasoningEffort` and `serviceTier`. Additional providers implement `AgentProvider.respond`, including tool translation, continuation output and reliable usage reporting. Credentials and application tools stay on the server.

`createAgent` accepts a panel container, editor, transport, optional transcript URL, event callback, context mode (`metadata`, `text` or `image`), page-image DPI, and attachment upload/removal callbacks. Use `toggle`, `stop` and `dispose` for lifecycle control. Supported CSS properties include `--onodocs-agent-height`, `--onodocs-color`, `--onodocs-toolbar-background`, `--onodocs-selection` and `--onodocs-accent`. The built-in title, labels and composer placeholder are not configuration options; a custom chat interface can consume `AgentTransport` and `AgentEvent` directly.

## Tools and execution

The model uses the package's current public TypeScript declarations. `api_call` invokes a method with JSON-encoded positional arguments; `api_get` reads properties. Handles belong to their bridge and document snapshot. Reacquire queries and ranges after changes. `document.content` covers all stories; `document.body` covers the body; `document.snapshot()` captures a query. Mutations return observed results, including relevant content and selection.

Browser integrations can use `api_script` to inspect and edit through document, editor and view APIs. It runs in an isolated module worker with a 32 MiB heap and 30-second deadline, without network, storage, credentials or host JavaScript. Return a plain object whose top-level values are strings; explicitly serialize projected arrays/objects. Deploy `script-worker.js` and its chunks or use a worker-aware bundler, with CSP permitting workers and WebAssembly. Server-only hosts must supply an isolated executor to offer scripting.

Stop cancels further work. Completed edits can remain after Stop or a later error; they remain undoable. Inspect observed results and correct unintended changes. An atomic SDK batch is atomic, but an entire multi-call script is not. Document text and attachments are untrusted data and never permission for unrelated actions.

## Context and privacy

The transport sends prompts and required document context to your backend and provider. The default context is metadata; use `pageContext: "text"` for extracted context. `pageContext: "image"` additionally supplies a page image; optional `pageImages: true` on the turn host and a compatible editor bridge enable requested page inspection. Hosts own authorization, retention, logs and usage limits.

Attachments use host uploads returning session-authorized IDs. Supported TXT/DOCX context does not silently replace the editable document. Reject unrelated URLs and cross-session references; implement retention and deletion in your application.

The [hosted website demo](https://onodocs.com/samples/document-agent/) uses approved fictional samples and authoritative server documents, with uploads/attachments disabled. It supports individual API calls and limited browser presentation, rather than browser-worker scripts. Its finite session, daily IP and global allowances are demo policies, not SDK document limits. See the [website disclosure](https://onodocs.com/privacy/#document-agent). Your own integration follows your provider and data policies.
