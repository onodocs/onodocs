# Document agent

`@onodocs/agent` is an optional commercial package, under the same application scope as the SDK. Model usage is supplied and paid for by the host application.

The browser entry provides `createAgent`, `agentRibbonCommand`, `createEditorApiBridge`, and `createHttpTransport`. The independent `@onodocs/agent/server` export provides `runAgentTurn`, `agentEventResponse`, `createApiBridge`, and persistent accounting contracts. `@onodocs/agent/openai` provides `createOpenAIProvider`; it uses fetch and requires no provider SDK.

Create the ribbon command before creating your editor, then mount the sidebar in your application's adjacent panel container. Its transport receives a stable request ID, message, optional authorized attachment IDs, and cancellation signal. Use the application editor's existing autosave and change handlers.

```js
import { createAgent, agentRibbonCommand, createHttpTransport, createEditorApiBridge } from "@onodocs/agent";
import { createEditor } from "@onodocs/editor";
let agent;
const editor = createEditor({ container: document.querySelector("#document"), commands: [agentRibbonCommand(() => agent.toggle())] });
await editor.open(bytes);
agent = createAgent({ container: document.querySelector("#assistant"), editor, transport: createHttpTransport("/api/agent", { credentials: "same-origin" }, () => createEditorApiBridge(editor, authorizeDocumentCall)) });
```

The host authenticates requests, authorizes documents and methods, serializes turns, deduplicates request IDs, persists conversation state, and supplies atomic storage. `runAgentTurn` requires reservation and settlement hooks; it has no unlimited accounting default. Every model continuation reserves capacity before a call. Failed or ambiguous calls retain their reservation. Provider retries are disabled; any host retry needs a new reservation.

`createOpenAIProvider({apiKey, model: "gpt-6-luna"})` accepts a server-only key or credential callback, optional endpoint and fetch implementation. `AgentProvider.respond` receives model instructions, conversation items, output allowance and abort signal. It returns text, ordered tool calls, provider continuation items, and usage. Additional providers implement that interface.

The model has one function, `call_api`, with a target, public member name and JSON-encoded positional arguments. Public methods, property types and argument schemas are generated from SDK, editor, query, extraction, geometry and view declarations during every build. `node tools/generate-agent-reference.mjs --check` verifies freshness. A returned `$handle` belongs to the current bridge and document snapshot. Read properties through `$get`. Use the literal returned handle ID as a call target and `{$handle: id}` only inside arguments. Read targets again after edits. Generated argument types describe the API to the model; they are not a second runtime validator. After resolving handles, the dispatcher passes arguments directly to the public method. Tool failures preserve the original exception name, message, stack, cause and enumerable details in the JSON error result. Source/semantic/layout internals, raw DOM, callback functions and host lifecycle operations require host capabilities; arbitrary JavaScript and prototype traversal are unavailable. Missing runtime capabilities return errors, not fabricated results.

Use `createEditorApiBridge` for browser edits. It routes document edits and reviews through editor history, rendering, change notifications and autosave, and checks the queued document snapshot. Existing tracked-change restrictions remain in force. Read-only applications omit mutation authorization. Hosts must limit mutation authority to user-requested changes and must not treat document contents as instructions.

Attachments use a host-provided upload callback with accepted file types and a size limit. The callback returns a session-authorized ID, display name and media type. The server resolves IDs into provider inputs; files never replace the editable document implicitly. Initial integration supports UTF-8 text and DOCX context extracted with the public SDK. Arbitrary files, external URLs and cross-session IDs are unsupported. Hosts own retention and cleanup. The Node example expires attachments after 24 hours on the next request and supports removing an attachment before sending.

Stop cancels further work. Closing the sidebar preserves conversation display and selection; disposal aborts uploads and the active turn. Navigation uses public view APIs and does not create document history entries.

The demo allocation is capped at USD 5 globally, USD 0.15 per session, and USD 0.50 per trusted IP per UTC day, additionally capped at 2,000/30/150 provider requests. Amounts are stored in millionths of a US dollar. Reservations conservatively treat input UTF-8 bytes plus protocol overhead as tokens and allow cache-write pricing. Session and global limits never reset when a browser refreshes. Hosts call `expireUsageAddresses` during request handling or scheduled maintenance to remove IP records after seven days; daily limits reset at midnight UTC. These are configurable application policies, not SDK document limits.

## Local example

Run `npm run example:agent` with an existing `OPENAI_API_KEY` in the server environment. Open the printed loopback URL. The example supports TXT and DOCX attachments, a persistent SQLite usage ledger and browser-owned documents. Its sample backend trusts tool results from that document owner; do not use that trust model for a public sample-only service.

## Available host capabilities

The generated inventory covers public document, editor, query/results, extraction, geometry and view members, including inherited and specialized query types. A browser editor supplies document edits, reviews, text updates, replace-all, undo/redo, selection and rendering through its ordinary lifecycle. Source, semantic and layout internals, raw DOM access, function callbacks, disposal and opening unrelated resources remain host capabilities. Data-only SDK hosts cannot render or provide a DOM editor. The public demo executes data operations on its authoritative server document and proxies permitted presentation operations to the browser. These are host availability limits, not a separate set of AI document actions.
