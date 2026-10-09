import { demoLicense } from "../sdk/license";
import { createEditor } from "@onodocs/sdk/editor";
import { compareDocuments } from "@onodocs/sdk";

const status = document.querySelector("#status"), clause = document.querySelector("#clause"), wording = document.querySelector("#wording"), versions = new Map();
const reviewers = { alex: { author: "Alex Morgan", initials: "AM" }, sam: { author: "Sam Rivera", initials: "SR" } };
const identity = () => ({ ...reviewers[document.querySelector("#reviewer").value], date: new Date().toISOString() });
const lifetime = new AbortController();
const response = await fetch("./sample.docx", { signal: lifetime.signal });
if (!response.ok) throw new Error("The agreement could not be loaded. Reload the page to retry.");
const original = new Uint8Array(await response.arrayBuffer());
const licenseKey = await demoLicense(lifetime.signal);
let busy = false, dirty = false, selectedText = "";
export const editor = createEditor({
  container: document.querySelector("#document"), document: { licenseKey, signal: lifetime.signal }, mode: "review", allowedModes: ["edit", "review"], toolbar: ["undo", "redo"],
  review: { identity, history: {
    async list() { return [...versions.values()].map(value => value.version); },
    async load(id) { const value = versions.get(id); if (!value) throw new Error("This session version is unavailable."); return value.bytes.slice(); },
    async save(version, bytes) { versions.set(version.id, { version, bytes: bytes.slice() }); },
  } },
  onModeChange: updateMode,
  onChange() { dirty = true; document.querySelector("#comparison").hidden = true; updateClauses(); report("Draft updated. Download the Word file to keep your review."); },
  onError: error => report(error.message ?? String(error), true),
});
function report(message, error = false) { status.textContent = message; status.dataset.error = String(error); }
async function run(action) {
  if (busy) return;
  busy = true; document.querySelector("main").setAttribute("aria-busy", "true");
  try { await action(); } catch (error) { report(error.message ?? String(error), true); }
  finally { busy = false; document.querySelector("main").setAttribute("aria-busy", "false"); }
}
function updateMode() {
  const suggesting = editor.mode === "edit";
  document.querySelector("#suggestion").hidden = !suggesting;
  document.querySelector("#review").setAttribute("aria-pressed", String(!suggesting));
  document.querySelector("#suggest").setAttribute("aria-pressed", String(suggesting));
  document.querySelector("#help").textContent = suggesting ? "Choose a clause and edit the proposed wording below. All suggestions are tracked." : "Select a clause, then add a comment in the review panel. Accept or reject pending changes there.";
}
function updateClauses() {
  const previous = clause.selectedIndex;
  const paragraphs = editor.document.query.paragraphs().filter(p => /^\d\. /.test(p.text)).all();
  clause.replaceChildren(...paragraphs.map(p => new Option(p.text.split(". ", 2).join(". ").slice(0, 75), p.id)));
  clause.selectedIndex = Math.max(0, Math.min(previous, paragraphs.length - 1));
  const selected = editor.document.query.get(clause.value);
  selectedText = selected?.text ?? ""; wording.value = selectedText;
}
function selectClause() {
  const paragraph = editor.document.query.get(clause.value);
  if (!paragraph) throw new Error("Choose a clause in this agreement.");
  editor.select({ start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } });
  selectedText = paragraph.text; wording.value = paragraph.text;
}
async function open(bytes, name) { await editor.open(bytes, name); updateClauses(); if (clause.options.length) selectClause(); updateMode(); dirty = false; }
async function start() {
  await open(original, "northline-agreement.docx"); versions.clear();
  versions.set("original", { version: { id: "original", label: "Original agreement", author: "Sam Rivera", date: "2026-10-08T09:00:00Z" }, bytes: original.slice() });
  await editor.setMode("edit"); await editor.review({ kind: "trackChanges", enabled: true }); await editor.setMode("review");
  dirty = false;
  report("Original agreement ready. Choose a clause to begin your review.");
}
document.querySelector("#suggest").onclick = () => run(async () => { await editor.setMode("edit"); await editor.review({ kind: "trackChanges", enabled: true }); selectClause(); report("Edit the proposed wording, then submit it as a tracked suggestion."); });
document.querySelector("#review").onclick = () => run(async () => { await editor.setMode("review"); selectClause(); report("Review comments and pending changes in the panel."); });
clause.onchange = () => run(async () => selectClause());
document.querySelector("#suggestion").onsubmit = event => { event.preventDefault(); void run(async () => {
  const text = wording.value.trim(); if (!text) throw new Error("Enter the proposed clause wording.");
  const paragraph = editor.document.query.get(clause.value);
  if (!paragraph || paragraph.text !== selectedText) throw new Error("The clause changed. Select it again before suggesting wording.");
  if (text === selectedText) throw new Error("Change the wording before submitting a suggestion.");
  await editor.review({ kind: "trackChanges", enabled: true });
  editor.select({ start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } });
  await editor.execute({ kind: "replace", text }); await editor.setMode("review");
  report("Suggestion added. The review panel contains the original and proposed wording.");
}); };
document.querySelector("#compare").onclick = () => run(async () => {
  const differences = await compareDocuments(original, editor.document), root = document.querySelector("#differences"); root.replaceChildren();
  for (const difference of differences) {
    const article = document.createElement("article"); article.className = "difference";
    for (const [label, value, className] of [["Original", difference.before, "before"], ["Current draft", difference.after, "after"]]) {
      const group = document.createElement("div"), title = document.createElement("h3"), text = document.createElement("p");
      group.className = className; title.textContent = label; text.textContent = value || "No text"; group.append(title, text); article.append(group);
    }
    if (difference.afterSelection) { const button = document.createElement("button"); button.textContent = "Go to this change"; button.onclick = () => editor.select(difference.afterSelection); article.append(button); }
    root.append(article);
  }
  if (!differences.length) root.textContent = "No text or formatting differences from the original.";
  document.querySelector("#comparison").hidden = false; report(`${differences.length} text or formatting differences from the original.`);
});
document.querySelector("#close-comparison").onclick = () => { document.querySelector("#comparison").hidden = true; };
document.querySelector("#download").onclick = () => run(async () => {
  const bytes = await editor.save(), url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const link = document.createElement("a"); link.href = url; link.download = "reviewed-agreement.docx"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  dirty = false;
  report("Word file downloaded with comments and pending tracked changes. Session versions are not included.");
});
document.querySelector("#returned").onchange = event => { const file = event.target.files?.[0]; event.target.value = ""; if (file && (!dirty || window.confirm("Replace your current review? Download it first if you want to keep your changes."))) void run(async () => { const bytes = new Uint8Array(await file.arrayBuffer()); await open(bytes, file.name); await editor.setMode("review"); report("Returned Word file opened. Review its comments and changes, or compare it with the original agreement."); }); };
document.querySelector("#reset").onclick = () => document.querySelector("#reset-dialog").showModal();
document.querySelector("#cancel-reset").onclick = () => document.querySelector("#reset-dialog").close();
document.querySelector("#confirm-reset").onclick = () => { document.querySelector("#reset-dialog").close(); void run(start); };
document.querySelector("#reviewer").onchange = () => report(`New comments and suggestions will be recorded as ${identity().author}.`);
window.addEventListener("pagehide", () => { lifetime.abort(); editor.dispose(); }, { once: true });
const initialPosition = { left: window.scrollX, top: window.scrollY };
await run(start);
window.scrollTo(initialPosition);
