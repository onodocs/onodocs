import { createEditorApiBridge, createHttpTransport } from "@onodocs/agent";

export function createHostedEditorTransport(editor, applying) {
  const documents = new WeakMap();
  return { async *run(request, signal) {
    const document = editor.document;
    if (!document) throw new Error("Open a document first.");
    if (!documents.has(document)) documents.set(document, crypto.randomUUID());
    const session = await fetch("/api/agent/session", { method: "POST", credentials: "same-origin", signal, headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!session.ok) throw new Error("AI assistance is unavailable. Editing and downloads remain available.");
    const transport = createHttpTransport("/api/agent/editor", { credentials: "same-origin", headers: { "X-Onodocs-Document": documents.get(document) } }, () => {
      const bridge = createEditorApiBridge(editor, () => {
        if (editor.document !== document) throw new Error("The open document changed. Send a new message to continue.");
      });
      return { reference: bridge.reference, dispose() { bridge.dispose(); }, async call(call, cancellation) {
        applying(true);
        try { return await bridge.call(call, cancellation); }
        finally { applying(false); }
      } };
    });
    try { yield* transport.run(request, signal); }
    finally {
      await fetch("/api/agent/stop", { method: "POST", credentials: "same-origin", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: request.id }) }).catch(() => {});
    }
  } };
}
