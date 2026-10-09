import { extractDocument } from "@onodocs/sdk/browser";
import { createEditor } from "@onodocs/editor";
import { createReport, sampleReviewer } from "./report.js";

export async function mountReport(container, { reviewer = sampleReviewer, input, document: documentOptions = {} } = {}) {
  const lifetime = new AbortController();
  const signal = AbortSignal.any([lifetime.signal, documentOptions.signal].filter(Boolean));
  const scripted = reviewer === sampleReviewer;
  container.innerHTML = `<section class="report-heading"><div><p class="eyebrow">NORTHWIND / QUARTERLY REPORT</p><h1>Review claims against their evidence</h1><p class="scope"></p></div><button data-action="reset">Reset sample</button></section><section class="workspace"><section class="document-panel" aria-label="Report editor"><div class="preview"></div></section><aside aria-label="Report review"><div class="review-heading"><h2>Evidence and suggestions</h2><button class="primary" data-action="review">Review report</button></div><p class="provider"></p><p role="status" aria-live="polite"></p><div class="findings"></div><details><summary>Extracted content</summary><div class="actions"><button data-action="json">Download JSON</button><button data-action="markdown">Download Markdown</button></div><pre></pre></details></aside></section>`;
  const findings = container.querySelector(".findings"), status = container.querySelector('[role="status"]');
  container.querySelector(".provider").textContent = reviewer.name;
  container.querySelector(".scope").textContent = scripted ? "A scripted reviewer checks two known inconsistencies in this sample. Inspect the evidence, apply a correction, or edit the report yourself." : "Inspect each cited passage before applying a suggestion. Edit and download the document with the ribbon.";
  container.querySelector('[data-action="reset"]').hidden = !scripted || !!input;
  let extraction, busy = false, disposed = false;
  const highlights = [];
  const editor = createEditor({
    container: container.querySelector(".preview"), document: { ...documentOptions, signal }, toolbar: ["save", "pdf", "undo", "redo", "bold", "italic", "underline", "find", "replace"],
    onChange() {
      window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_edit" }));
      clearHighlights();
      findings.replaceChildren();
      refreshExtraction();
      message("The document changed. Review again to check the current passages.");
    },
    onError: error => message(error.message ?? String(error), true),
  });
  function clearHighlights() { for (const highlight of highlights) highlight.dispose(); highlights.length = 0; }
  function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); if (error) window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); }
  function refreshExtraction() {
    extraction = extractDocument(editor.document);
    container.querySelector("pre").textContent = extraction.markdown;
  }
  async function run(action) {
    if (busy || disposed) return;
    busy = true; container.setAttribute("aria-busy", "true");
    for (const control of container.querySelectorAll(".report-heading button,aside button,aside textarea")) control.disabled = true;
    editor.element.inert = true;
    try { await action(); } catch (error) { if (!disposed) message(error.message, true); }
    finally {
      busy = false; container.setAttribute("aria-busy", "false"); editor.element.inert = false;
      for (const control of container.querySelectorAll(".report-heading button,aside button,aside textarea")) control.disabled = false;
    }
  }
  function download(bytes, filename, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" }));
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function button(label, action, parent) {
    const element = document.createElement("button"); element.textContent = label;
    element.addEventListener("click", () => void run(action), { signal }); parent.append(element); return element;
  }
  function resolveCitation(value, snapshot) {
    if (!value || typeof value.source !== "string" || typeof value.quote !== "string" || !value.quote || !Number.isInteger(value.start) || !Number.isInteger(value.end)) throw new Error("The review service returned an invalid citation.");
    const source = snapshot.reference(value.source, value.start, value.end);
    if (snapshot.resolve(source).text !== value.quote) throw new Error("A review citation does not match the current document. Review again.");
    return source;
  }
  async function showSource(source, snapshot) {
    const anchor = snapshot.resolve(source), fragments = editor.document.geometry.fragments(anchor);
    clearHighlights(); editor.select(snapshot.selection(source));
    for (const fragment of fragments) {
      const highlight = document.createElement("span"); highlight.className = "source-highlight";
      highlights.push(editor.view.attach(highlight, { anchor: fragment, interactive: false }));
    }
    if (fragments[0]) editor.view.scrollTo(fragments[0], { block: "center", behavior: "instant" });
    await editor.view.whenRendered(); message("Supporting passage highlighted in the report.");
  }
  async function review() {
    clearHighlights(); findings.replaceChildren(); refreshExtraction();
    const snapshot = extraction;
    message("Reviewing the current document…");
    const response = await reviewer.analyze({ content: snapshot.content, markdown: snapshot.markdown, signal });
    signal.throwIfAborted();
    if (snapshot.stale) throw new Error("The document changed during review. Review again.");
    if (!response || typeof response.summary !== "string" || !Array.isArray(response.findings)) throw new Error("The review service returned an invalid response.");
    const validated = response.findings.map(value => {
      if (typeof value.reason !== "string" || (value.replacement !== undefined && typeof value.replacement !== "string") || (value.evidence !== undefined && !Array.isArray(value.evidence))) throw new Error("The review service returned an invalid suggestion.");
      return { value, source: resolveCitation(value, snapshot), evidence: (value.evidence ?? []).map(citation => ({ citation, source: resolveCitation(citation, snapshot) })) };
    });
    for (const [index, { value, source, evidence }] of validated.entries()) {
      const card = document.createElement("article"); card.setAttribute("aria-label", `Suggestion ${index + 1}`);
      const title = document.createElement("h3"); title.textContent = `Suggestion ${index + 1}`;
      const quote = document.createElement("blockquote"); quote.textContent = value.quote;
      const reason = document.createElement("p"); reason.textContent = value.reason;
      const actions = document.createElement("div"); actions.className = "actions";
      card.append(title, quote, reason); button("Show passage", () => showSource(source, snapshot), actions);
      for (const { citation, source } of evidence) {
        const evidenceText = document.createElement("p"); evidenceText.className = "evidence"; evidenceText.textContent = citation.quote; card.append(evidenceText);
        button("Show evidence", () => showSource(source, snapshot), actions);
      }
      if (value.replacement !== undefined) {
        const label = document.createElement("label"); label.textContent = "Proposed wording";
        const replacement = document.createElement("textarea"); replacement.rows = 3; replacement.value = value.replacement;
        label.append(replacement); card.append(label);
        button("Apply change", async () => {
          editor.select(snapshot.selection(source));
          await editor.execute({ kind: "replace", text: replacement.value });
          await review();
          message(validated.length > 1 ? "Change applied. The remaining suggestions now use the updated document. Undo is available in the ribbon." : "Change applied. Review refreshed. Undo is available in the ribbon.");
        }, actions);
      }
      button("Dismiss", async () => { card.remove(); message("Suggestion dismissed for this review. The document is unchanged."); }, actions);
      card.append(actions); findings.append(card);
    }
    message(validated.length ? response.summary : scripted ? "Neither known inconsistency remains. This scripted check does not assess other claims or wording." : "No suggestions returned for the current document.");
  }
  const actions = {
    review,
    reset: async () => {
      if (!window.confirm("Restore the sample report? Download your Word file first to keep your changes.")) return;
      await openSample(); await review();
    },
    json: async () => { refreshExtraction(); download(JSON.stringify(extraction.content, null, 2), "report.json", "application/json"); },
    markdown: async () => { refreshExtraction(); download(extraction.markdown, "report.md", "text/markdown"); },
  };
  for (const control of container.querySelectorAll("[data-action]")) control.addEventListener("click", () => void run(actions[control.dataset.action]), { signal });
  async function openSample() {
    const sample = await createReport({ ...documentOptions, signal });
    try { await editor.open(await sample.save(), "quarterly-report.docx"); }
    finally { sample.dispose(); }
    clearHighlights(); findings.replaceChildren(); refreshExtraction();
  }
  function dispose() {
    if (disposed) return;
    disposed = true; lifetime.abort(); clearHighlights(); editor.dispose(); container.replaceChildren();
  }
  signal.addEventListener("abort", dispose, { once: true });
  try {
    await run(async () => { if (input) await editor.open(input, "report.docx"); else await openSample(); await review(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" })); });
  } catch (error) { dispose(); throw error; }
  return { editor, dispose };
}
