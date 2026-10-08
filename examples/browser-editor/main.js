import { openDocument } from "@onodocs/sdk/browser";
import { createDocument } from "@onodocs/canvas";

const editor = document.querySelector("#editor"), status = document.querySelector("#status"), preview = document.querySelector("#preview");
const undo = [], redo = [], segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
let doc, canvas, selection, pendingFormatting = {}, queue = Promise.resolve(), pending = 0, composing = false, filename = "sample.docx";

function report(message, error = false) { status.textContent = message; status.dataset.error = String(error); }
function paragraphs() { return doc.query.paragraphs().all(); }
function collapsed(range) { return range.start.paragraphId === range.end.paragraphId && range.start.offset === range.end.offset; }

function domSelection() { return canvas?.view.selection; }

function restoreSelection() {
  if (!selection) return;
  canvas.view.setSelection(selection);
  editor.focus({ preventScroll: true });
}

function renderEditor() {
  document.querySelector("#pages").textContent = `${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"}`;
  restoreSelection(); updateToolbar();
}

function selectionChanged(next) {
  if (pending || composing) return;
  if (JSON.stringify(next) !== JSON.stringify(selection)) pendingFormatting = {};
  selection = next;
  if (!next) report("This content has no editable text position.");
  updateToolbar();
}

function selectedText() {
  if (!selection) return "";
  const all = paragraphs(), first = all.findIndex(p => p.id === selection.start.paragraphId), last = all.findIndex(p => p.id === selection.end.paragraphId);
  return all.slice(first, last + 1).map((p, i) => p.text.slice(i === 0 ? selection.start.offset : 0, i === last - first ? selection.end.offset : undefined)).join("\n");
}

function currentFormatting() {
  const paragraph = doc.query.get(selection?.start.paragraphId);
  if (!paragraph) return {};
  let offset = 0, chosen;
  for (const run of doc.query.within(paragraph).runs()) { chosen = run.formatting; offset += run.text.length; if (offset >= selection.start.offset) break; }
  return { ...chosen, ...pendingFormatting };
}

function updateToolbar() {
  if (!doc || !selection) return;
  const format = currentFormatting();
  editor.style.fontSize = `${format.fontSize ?? 12}pt`; editor.style.fontFamily = format.fontFamily ?? "Arial";
  for (const button of document.querySelectorAll("[data-format]")) button.setAttribute("aria-pressed", String(!!format[button.dataset.format]));
  document.querySelector("#size").value = format.fontSize ?? 12;
  const font = document.querySelector("#font");
  if (format.fontFamily && ![...font.options].some(o => o.value === format.fontFamily)) font.add(new Option(format.fontFamily));
  font.value = format.fontFamily ?? "Arial";
  if (/^#[0-9a-f]{6}$/i.test(format.color ?? "")) document.querySelector("#color").value = format.color;
  document.querySelector("#alignment").value = doc.query.get(selection.start.paragraphId)?.alignment ?? "left";
  document.querySelector("#undo").disabled = !undo.length;
  document.querySelector("#redo").disabled = !redo.length;
}

function enqueue(action) {
  const captured = pending ? undefined : domSelection();
  pending++; editor.setAttribute("aria-busy", "true");
  queue = queue.then(async () => {
    if (captured) selection = captured;
    await action();
  }).catch(error => { report(error.message, true); if (doc) renderEditor(); }).finally(() => {
    pending--; editor.setAttribute("aria-busy", String(pending > 0)); updateToolbar();
  });
  return queue;
}

function portableSelection() {
  const all = paragraphs();
  return { start: { index: all.findIndex(p => p.id === selection.start.paragraphId), offset: selection.start.offset }, end: { index: all.findIndex(p => p.id === selection.end.paragraphId), offset: selection.end.offset } };
}

async function snapshot() { return { bytes: await doc.save(), selection: portableSelection(), formatting: { ...pendingFormatting } }; }

async function apply(edit) {
  if (!selection) throw new Error("Click ordinary document text to edit it.");
  const previous = await snapshot();
  selection = await doc.edit({ ...edit, selection });
  undo.push(previous); redo.length = 0; editor.value = "";
  renderEditor(); report("Changes saved in this browser. Download to keep a Word file.");
}

async function restore(entry) {
  const next = await openDocument(entry.bytes);
  canvas?.dispose(); doc?.dispose(); doc = next;
  canvas = createDocument(doc, { container: preview, viewOptions: { zoom: "fit-width", input: editor, onSelectionChange: selectionChanged } });
  const all = paragraphs();
  selection = { start: { paragraphId: all[entry.selection.start.index].id, offset: entry.selection.start.offset }, end: { paragraphId: all[entry.selection.end.index].id, offset: entry.selection.end.offset } };
  pendingFormatting = entry.formatting; renderEditor();
}

async function history(direction) {
  const from = direction === "undo" ? undo : redo, to = direction === "undo" ? redo : undo;
  if (!from.length) return;
  const previous = await snapshot();
  await restore(from.at(-1)); from.pop(); to.push(previous);
  updateToolbar(); report(direction === "undo" ? "Change undone." : "Change restored.");
}

function format(value) {
  return enqueue(async () => {
    if (!selection) throw new Error("Select ordinary document text to format it.");
    if (collapsed(selection)) { pendingFormatting = { ...pendingFormatting, ...value }; updateToolbar(); restoreSelection(); }
    else { await apply({ kind: "format", formatting: value }); pendingFormatting = {}; }
  });
}

async function replace(text, paragraphBreaks = true) { await apply({ kind: "replace", text, paragraphBreaks, ...(Object.keys(pendingFormatting).length ? { formatting: pendingFormatting } : {}) }); }

async function remove(backward, word = false) {
  if (!collapsed(selection)) return replace("");
  const all = paragraphs(), index = all.findIndex(p => p.id === selection.start.paragraphId), paragraph = all[index], offset = selection.start.offset;
  if (backward && offset === 0) {
    if (!index) return;
    selection = { start: { paragraphId: all[index - 1].id, offset: all[index - 1].text.length }, end: selection.end };
  } else if (!backward && offset === paragraph.text.length) {
    if (index === all.length - 1) return;
    selection = { start: selection.start, end: { paragraphId: all[index + 1].id, offset: 0 } };
  } else {
    const units = word ? new Intl.Segmenter(undefined, { granularity: "word" }) : segmenter;
    const boundaries = [...units.segment(paragraph.text)].map(s => s.index).concat(paragraph.text.length);
    const next = backward ? boundaries.filter(n => n < offset).at(-1) ?? 0 : boundaries.find(n => n > offset) ?? paragraph.text.length;
    selection = { start: { paragraphId: paragraph.id, offset: backward ? next : offset }, end: { paragraphId: paragraph.id, offset: backward ? offset : next } };
  }
  await replace("");
}

editor.addEventListener("beforeinput", event => {
  if (event.isComposing || composing) return;
  event.preventDefault();
  if (event.inputType === "insertText" || event.inputType === "insertReplacementText") enqueue(() => replace(event.data ?? ""));
  else if (event.inputType === "insertParagraph") enqueue(() => replace("\n"));
  else if (event.inputType === "insertLineBreak") enqueue(() => replace("\n", false));
  else if (event.inputType.startsWith("delete")) enqueue(() => remove(event.inputType.includes("Backward"), event.inputType.includes("Word")));
  else if (event.inputType === "historyUndo") enqueue(() => history("undo"));
  else if (event.inputType === "historyRedo") enqueue(() => history("redo"));
});
editor.addEventListener("paste", event => { event.preventDefault(); const text = event.clipboardData.getData("text/plain"); enqueue(() => replace(text)); });
editor.addEventListener("cut", event => {
  const range = domSelection(); if (!range || collapsed(range)) return;
  event.preventDefault(); event.clipboardData.setData("text/plain", selectedText()); enqueue(() => replace(""));
});
editor.addEventListener("dragover", event => event.preventDefault());
editor.addEventListener("drop", event => { event.preventDefault(); report("Use Open Word file or paste plain text into the editor."); });
let compositionSelection;
editor.addEventListener("compositionstart", () => { composing = true; compositionSelection = selection; editor.classList.add("composing"); });
editor.addEventListener("compositionend", event => {
  composing = false;
  const text = event.data; editor.value = ""; editor.classList.remove("composing");
  enqueue(async () => { selection = compositionSelection; await replace(text); });
});
editor.addEventListener("keydown", event => {
  if (event.isComposing) return;
  const command = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
  if (command && ["b", "i", "u"].includes(key)) { event.preventDefault(); const property = { b: "bold", i: "italic", u: "underline" }[key]; format({ [property]: !currentFormatting()[property] }); }
  else if (command && (key === "z" || key === "y")) { event.preventDefault(); enqueue(() => history(key === "y" || event.shiftKey ? "redo" : "undo")); }
  else if (event.key === "Enter") { event.preventDefault(); enqueue(() => replace("\n", !event.shiftKey)); }
  else if (event.key === "Tab") { event.preventDefault(); enqueue(() => replace("\t", false)); }
});
document.querySelector("nav").addEventListener("mousedown", event => { if (event.target.closest("button")) event.preventDefault(); });
for (const button of document.querySelectorAll("[data-format]")) button.addEventListener("click", () => format({ [button.dataset.format]: !currentFormatting()[button.dataset.format] }));
document.querySelector("#size").addEventListener("change", event => format({ fontSize: Number(event.target.value) }));
document.querySelector("#font").addEventListener("change", event => format({ fontFamily: event.target.value }));
document.querySelector("#color").addEventListener("change", event => format({ color: event.target.value }));
document.querySelector("#alignment").addEventListener("change", event => { const alignment = event.target.value; enqueue(() => apply({ kind: "align", alignment })); });
document.querySelector("#undo").addEventListener("click", () => enqueue(() => history("undo")));
document.querySelector("#redo").addEventListener("click", () => enqueue(() => history("redo")));
document.querySelector("#download").addEventListener("click", () => enqueue(async () => {
  const bytes = await doc.save(), url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const a = document.createElement("a"); a.href = url; a.download = filename.replace(/\.docx$/i, "") + "-edited.docx"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); report("Word file downloaded.");
}));
document.querySelector("#file").addEventListener("change", event => { const file = event.target.files[0]; if (file) enqueue(() => load(file, file.name)); event.target.value = ""; });

async function load(bytes, name) {
  report("Opening document…");
  const next = await openDocument(bytes);
  canvas?.dispose(); doc?.dispose(); doc = next;
  canvas = createDocument(doc, { container: preview, viewOptions: { zoom: "fit-width", input: editor, onSelectionChange: selectionChanged } });
  filename = name; document.querySelector("#filename").textContent = name; undo.length = 0; redo.length = 0; pendingFormatting = {};
  const first = paragraphs()[0]; selection = first ? { start: { paragraphId: first.id, offset: 0 }, end: { paragraphId: first.id, offset: 0 } } : undefined;
  renderEditor(); report("Ready. Select text to change its formatting.");
}
window.addEventListener("pagehide", () => { canvas?.dispose(); doc?.dispose(); });
await enqueue(async () => load(await (await fetch("/sample.docx")).arrayBuffer(), "sample.docx"));
