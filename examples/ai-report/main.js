import { openDocument, extractDocument } from "@onodocs/sdk/browser";
import { createDocument } from "@onodocs/canvas";
import { createReport, sampleReviewer } from "./report.js";

export async function mountReport(container, { reviewer = sampleReviewer, input, document: documentOptions = {} } = {}) {
  const lifetime = new AbortController();
  const signal = AbortSignal.any([lifetime.signal, documentOptions.signal].filter(Boolean));
  container.innerHTML = `<section class="workspace"><section class="document-panel" aria-label="Original report"><div class="actions"><label class="file">Open Word<input type="file" accept=".docx"></label><button data-action="word">Download Word</button><button data-action="pdf">Download PDF</button></div><div class="preview"></div></section><aside aria-label="Report review"><p class="eyebrow">SOURCE-LINKED REVIEW</p><h1>Check the report.<br>Keep the evidence.</h1><p class="intro">Inspect each passage and decide which proposed changes belong in your document.</p><p class="provider"></p><button class="primary" data-action="review">Review report</button><p role="status" aria-live="polite"></p><div class="findings"></div><details><summary>Extracted content</summary><div class="actions"><button data-action="json">Download JSON</button><button data-action="markdown">Download Markdown</button></div><pre></pre></details></aside></section>`;
  const preview = container.querySelector(".preview"), findings = container.querySelector(".findings"), status = container.querySelector('[role="status"]');
  container.querySelector(".provider").textContent = reviewer.name;
  let document, canvas, extraction, busy = false, disposed = false, name = "quarterly-report.docx";
  const highlights = [];
  function clearHighlights() { for (const highlight of highlights) highlight.dispose(); highlights.length = 0; }
  function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
  function refreshExtraction() {
    extraction = extractDocument(document);
    container.querySelector("pre").textContent = extraction.markdown;
  }
  async function run(action) {
    if (busy || disposed) return;
    busy = true;
    container.setAttribute("aria-busy", "true");
    for (const control of container.querySelectorAll("button,input")) control.disabled = true;
    try { await action(); } catch (error) { if (!disposed) message(error.message, true); }
    finally {
      busy = false;
      container.setAttribute("aria-busy", "false");
      for (const control of container.querySelectorAll("button,input")) control.disabled = control.dataset.inactive === "true";
    }
  }
  function download(bytes, filename, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const link = globalThis.document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function button(label, action, parent) {
    const element = globalThis.document.createElement("button"); element.textContent = label;
    element.addEventListener("click", () => void run(action), { signal }); parent.append(element); return element;
  }
  function resolveCitation(value, snapshot) {
    if (!value || typeof value.source !== "string" || typeof value.quote !== "string" || !value.quote || !Number.isInteger(value.start) || !Number.isInteger(value.end)) throw new Error("The review service returned an invalid citation.");
    const source = snapshot.reference(value.source, value.start, value.end);
    if (snapshot.resolve(source).text !== value.quote) throw new Error("A review citation does not match the current document. Review again.");
    return source;
  }
  async function showSource(source, snapshot) {
    const anchor = snapshot.resolve(source);
    const fragments = document.geometry.fragments(anchor);
    clearHighlights();
    for (const fragment of fragments) {
      const highlight = globalThis.document.createElement("span"); highlight.className = "source-highlight";
      highlights.push(canvas.view.attach(highlight, { anchor: fragment }));
    }
    if (fragments[0]) canvas.view.scrollTo(fragments[0], { block: "center", behavior: "instant" });
    await canvas.view.whenRendered();
    message("Supporting passage highlighted in the report.");
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
      const card = globalThis.document.createElement("article"); card.setAttribute("aria-label", `Suggestion ${index + 1}`);
      const title = globalThis.document.createElement("h2"); title.textContent = `Suggestion ${index + 1}`;
      const quote = globalThis.document.createElement("blockquote"); quote.textContent = value.quote;
      const reason = globalThis.document.createElement("p"); reason.textContent = value.reason;
      const actions = globalThis.document.createElement("div"); actions.className = "actions";
      card.append(title, quote, reason); button("Show passage", () => showSource(source, snapshot), actions);
      for (const { citation, source } of evidence) {
        const evidenceText = globalThis.document.createElement("p"); evidenceText.className = "evidence"; evidenceText.textContent = citation.quote; card.append(evidenceText);
        button("Show evidence", () => showSource(source, snapshot), actions);
      }
      if (value.replacement !== undefined) {
        const label = globalThis.document.createElement("label"); label.textContent = "Proposed wording";
        const replacement = globalThis.document.createElement("textarea"); replacement.rows = 3; replacement.value = value.replacement;
        label.append(replacement); card.append(label);
        button("Apply change", async () => {
          await snapshot.edit(source, { kind: "replace", text: replacement.value });
          clearHighlights();
          for (const control of findings.querySelectorAll("button,textarea")) { control.disabled = true; control.dataset.inactive = "true"; }
          refreshExtraction(); await canvas.view.whenRendered();
          message("Change applied. Review again to create citations for the updated report.");
        }, actions);
      }
      button("Dismiss", async () => { card.remove(); message("Suggestion dismissed. The document is unchanged."); }, actions);
      card.append(actions); findings.append(card);
    }
    message(validated.length ? response.summary : "No suggestions returned for the current document.");
  }
  async function mount(next) {
    if (signal.aborted) { next.dispose(); signal.throwIfAborted(); }
    clearHighlights(); canvas?.dispose(); document?.dispose();
    document = next; canvas = createDocument(document, { container: preview, viewOptions: { zoom: "fit-width", title: "Quarterly report" } });
    findings.replaceChildren(); refreshExtraction(); await canvas.view.whenRendered();
    message("Ready. Review suggestions before applying any change.");
  }
  const file = container.querySelector('input[type="file"]');
  file.addEventListener("change", () => void run(async () => {
    const selected = file.files[0]; if (!selected) return;
    const next = await openDocument(selected, { ...documentOptions, signal });
    await mount(next); name = selected.name; file.value = "";
  }), { signal });
  const actions = {
    review,
    word: async () => download(await document.save(), name, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    pdf: async () => download(await document.pdf(), name.replace(/\.docx$/i, "") + ".pdf", "application/pdf"),
    json: async () => download(JSON.stringify(extraction.content, null, 2), "report.json", "application/json"),
    markdown: async () => download(extraction.markdown, "report.md", "text/markdown")
  };
  for (const control of container.querySelectorAll("[data-action]")) control.addEventListener("click", () => void run(actions[control.dataset.action]), { signal });
  function dispose() {
    if (disposed) return;
    disposed = true; lifetime.abort(); clearHighlights(); canvas?.dispose(); document?.dispose(); container.replaceChildren();
  }
  signal.addEventListener("abort", dispose, { once: true });
  try { await mount(input ? await openDocument(input, { ...documentOptions, signal }) : await createReport({ ...documentOptions, signal })); }
  catch (error) { dispose(); throw error; }
  return { dispose };
}
