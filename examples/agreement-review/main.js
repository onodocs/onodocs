import { demoLicense } from "../sdk/license";
import { createEditor } from "@onodocs/editor";
import { openDocument } from "@onodocs/sdk";

const status = document.querySelector("#status"), versions = new Map();
const reviewers = { alex: { author: "Alex Morgan", initials: "AM" }, sam: { author: "Sam Rivera", initials: "SR" } };
const identity = () => ({ ...reviewers[document.querySelector("#reviewer").value], date: new Date().toISOString() });
const lifetime = new AbortController();
const licenseKey = await demoLicense(lifetime.signal);
let busy = false, dirty = false, original, reviewed;
export const editor = createEditor({
  container: document.querySelector("#document"), document: { licenseKey, signal: lifetime.signal }, mode: "review", allowedModes: ["review", "edit"], toolbar: ["undo", "redo", "review", "bold", "italic", "underline"],
  review: { identity, history: {
    async list() { return [...versions.values()].map(value => value.version); },
    async load(id) { const value = versions.get(id); if (!value) throw new Error("This session version is unavailable."); return value.bytes.slice(); },
    async save(version, bytes) { versions.set(version.id, { version, bytes: bytes.slice() }); },
  } },
  onChange() { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_edit" })); dirty = true; report("Review updated. Download the Word file to keep your changes."); },
  onError: error => report(error.message ?? String(error), true),
});
function report(message, error = false) { status.textContent = message; status.dataset.error = String(error); if (error) window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); }
async function run(action) {
  if (busy) return;
  busy = true; document.querySelector("main").setAttribute("aria-busy", "true"); document.querySelector("#exchange").inert = true;
  try { await action(); } catch (error) { report(error.message ?? String(error), true); }
  finally { busy = false; document.querySelector("main").setAttribute("aria-busy", "false"); document.querySelector("#exchange").inert = false; }
}
async function prepareReview() {
  const response = await fetch("./sample.docx", { signal: lifetime.signal });
  if (!response.ok) throw new Error("The agreement could not be loaded. Choose Start over to retry.");
  original = new Uint8Array(await response.arrayBuffer());
  const document = await openDocument(original, { licenseKey, revisionView: "accepted" });
  try {
    const author = { ...reviewers.alex, date: "2026-10-09T09:00:00Z" };
    for (const [quote, text] of [["launch support", "Please confirm that launch support includes the first week after go-live."], ["one-hour handoff session", "Could we record the handoff for colleagues who cannot attend?"]]) {
      const match = document.query.findText(quote).one();
      await document.review({ kind: "comment", selection: { start: { paragraphId: match.paragraph.id, offset: match.start }, end: { paragraphId: match.paragraph.id, offset: match.end } }, text, identity: author });
    }
    const thread = (await document.readReview()).comments[0];
    await document.review({ kind: "reply", id: thread.id, text: "Yes, we can include five business days of launch support.", identity: { ...reviewers.sam, date: "2026-10-09T09:30:00Z" } });
    for (const [quote, text] of [["14 days", "30 days"], ["12 November 2026", "19 November 2026"]]) {
      const match = document.query.findText(quote).one();
      await document.review({ kind: "trackedReplace", selection: { start: { paragraphId: match.paragraph.id, offset: match.start }, end: { paragraphId: match.paragraph.id, offset: match.end } }, text, identity: author });
    }
    await document.review({ kind: "trackChanges", enabled: true });
    reviewed = await document.save();
  } finally { document.dispose(); }
}
async function start() {
  if (!reviewed) await prepareReview();
  versions.clear();
  for (const [id, label, author, date, bytes] of [["original", "Original agreement", "Sam Rivera", "2026-10-08T09:00:00Z", original], ["client-review", "Harbor & Pine review", "Alex Morgan", "2026-10-09T09:30:00Z", reviewed]]) versions.set(id, { version: { id, label, author, date }, bytes: bytes.slice() });
  await editor.open(reviewed, "reviewed-agreement.docx"); await editor.setMode("review"); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
  const selection = (await editor.document.readReview()).comments[0]?.selection;
  if (selection) editor.select(selection);
  dirty = false; report("Two discussions and two proposed edits are ready.");
}
document.querySelector("#download").onclick = () => run(async () => {
  const bytes = await editor.save(), url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const link = document.createElement("a"); link.href = url; link.download = "reviewed-agreement.docx"; link.click(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" })); setTimeout(() => URL.revokeObjectURL(url), 1000);
  dirty = false; report("Word file downloaded with comments and tracked changes. Session versions stay in this tab.");
});
document.querySelector("#returned").onchange = event => {
  const file = event.target.files?.[0]; event.target.value = "";
  if (file && (!dirty || window.confirm("Replace your current review? Download it first if you want to keep your changes."))) void run(async () => {
    await editor.open(new Uint8Array(await file.arrayBuffer()), file.name); await editor.setMode("review"); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" })); dirty = false;
    report("Returned Word file opened. Use Review to inspect discussions and changes or compare with the original agreement.");
  });
};
document.querySelector("#reset").onclick = () => document.querySelector("#reset-dialog").showModal();
document.querySelector("#cancel-reset").onclick = () => document.querySelector("#reset-dialog").close();
document.querySelector("#confirm-reset").onclick = () => { document.querySelector("#reset-dialog").close(); void run(start); };
document.querySelector("#reviewer").onchange = () => report(`New comments and suggestions will be recorded as ${identity().author}.`);
window.addEventListener("pagehide", event => { if (!event.persisted) { lifetime.abort(); editor.dispose(); } });
const initialPosition = { left: window.scrollX, top: window.scrollY };
await run(start);
window.scrollTo(initialPosition);
