import { openDocument, type BrowserDocument, type DocumentView } from "@onodocs/sdk/browser";
import sample from "../view-document/sample.docx";
import template from "./template.docx";

const container = document.querySelector<HTMLElement>("#document-view")!;
const viewport = document.querySelector<HTMLElement>("#document-viewport")!;
const status = document.querySelector<HTMLElement>("#status")!;
const feedback = document.querySelector<HTMLOutputElement>("#feedback")!;
const zoom = document.querySelector<HTMLSelectElement>("#zoom")!;
const download = document.querySelector<HTMLButtonElement>("#download-page")!;
const documentButtons = [...document.querySelectorAll<HTMLButtonElement>("#download-page, #fill-template, #print-document")];
const mode = new URLSearchParams(location.search).get("mode") ?? "viewer";
let current: BrowserDocument | undefined;
let view: DocumentView | undefined;
let controller = new AbortController();
const resizeObserver = new ResizeObserver(applyZoom);
const bookings = {
  offsite: { event: "Team offsite", customer: "Willow Design", date: "12 November 2026, 09:00–17:00", venue: "Meadow House · Garden room", guests: "24 guests", details: "Workshop seating, projector and Wi-Fi included. Coffee on arrival and a seasonal lunch are arranged for all guests." },
  launch: { event: "Product launch", customer: "Arc Studio", date: "3 December 2026, 18:00–22:00", venue: "Meadow House · Main hall", guests: "80 guests", details: "Reception layout with a presentation area, sound system and welcome drinks. A technician will be available during setup." },
};

function dispose() {
  resizeObserver.disconnect();
  controller.abort();
  current?.dispose();
  container.style.minWidth = "";
  documentButtons.forEach(button => button.disabled = true);
}

async function load(input?: File) {
  dispose();
  controller = new AbortController();
  const { signal } = controller;
  status.hidden = false;
  status.textContent = "Opening document…";
  feedback.hidden = true;
  try {
    const source = input ?? (mode === "template" ? template : sample);
    const opened = await openDocument(source, { signal });
    if (signal.aborted) { opened.dispose(); return; }
    current = opened;
    view = current.mount(container, { zoom: "fit-width", gap: 0 });
    zoom.value = "fit-width";
    applyZoom();
    resizeObserver.observe(viewport);
    status.hidden = true;
    if (mode === "form") attachFields();
    documentButtons.forEach(button => button.disabled = false);
  } catch (error) {
    if (!signal.aborted) { dispose(); status.hidden = false; status.textContent = `Unable to open document. ${error instanceof Error ? error.message : "Try another Word file."}`; }
  }
}

function attachFields() {
  const doc = current!;
  const controls = document.querySelector<HTMLTemplateElement>("#form-controls")!.content.cloneNode(true) as DocumentFragment;
  const approval = controls.querySelector<HTMLInputElement>("#client-approval")!;
  const approvalDate = controls.querySelector<HTMLInputElement>("#approval-date")!;
  const submitButton = controls.querySelector<HTMLButtonElement>("#save-form")!;
  const deliveryInput = document.querySelector<HTMLTemplateElement>("#delivery-input")!;
  const fields = doc.query.contentControls().where({ tag: "delivery-date" }).map(field => {
    const input = deliveryInput.content.firstElementChild!.cloneNode(true) as HTMLInputElement;
    input.value = field.text;
    view!.attach(input, { anchor: field, placement: "inside-center-left", size: { width: 1640, height: 420 } });
    return { deliverable: field.title, input };
  });
  view!.attach(approval, { anchor: doc.query.findText("Client approval:").one(), placement: "outside-right", gap: 80, size: { width: 420, height: 420 } });
  view!.attach(approvalDate, { anchor: doc.query.findText("Date:").one(), placement: "outside-right", gap: 80, size: { width: 1800, height: 420 } });
  view!.attach(submitButton, { anchor: doc.pages[0]!, placement: "inside-bottom-right", inset: 480, size: { width: 2400, height: 600 } });
  approval.addEventListener("change", () => {
    const today = new Date();
    approvalDate.value = approval.checked ? [today.getFullYear(), today.getMonth() + 1, today.getDate()].map(value => String(value).padStart(2, "0")).join("-") : "";
  });
  submitButton.addEventListener("click", () => {
    const dates = fields.map(({ deliverable, input }) => ({ deliverable, date: input.value }));
    const data = { dates, clientApproval: approval.checked, approvalDate: approvalDate.value };
    document.querySelector("#form-feedback")!.textContent = "Collected " + dates.length + " delivery dates. This handler could send these values to your backend.";
    document.querySelector("#dates-json")!.textContent = JSON.stringify(data, null, 2);
    document.querySelector<HTMLDialogElement>("#dates-dialog")!.showModal();
  });
}

function applyZoom() {
  if (!view || !current || current.disposed) return;
  const numericZoom = Number(zoom.value);
  container.style.minWidth = Number.isFinite(numericZoom) ? `${current.pages.reduce((width, page) => Math.max(width, page.size.width * 96 / 1440 * numericZoom), 0)}px` : "";
  if (zoom.value === "fit-page") {
    const page = current.pages[0]!;
    const scale = Math.min(container.clientWidth / page.size.width, viewport.clientHeight / page.size.height) * 1440 / 96;
    if (scale > 0) view.setZoom(scale);
  } else view.setZoom(zoom.value === "fit-width" ? "fit-width" : numericZoom);
}

async function perform(action: (doc: BrowserDocument, signal: AbortSignal) => Promise<void>) {
  const doc = current;
  const signal = controller.signal;
  if (!doc || doc.disposed) return;
  documentButtons.forEach(button => button.disabled = true);
  feedback.hidden = true;
  try {
    await action(doc, signal);
    if (signal.aborted) return;
    applyZoom();
  } catch (error) {
    if (!signal.aborted) { feedback.textContent = error instanceof Error ? error.message : "Unable to update document."; feedback.hidden = false; }
  } finally { if (!signal.aborted) documentButtons.forEach(button => button.disabled = false); }
}

for (const name of ["viewer", "template"]) document.querySelector<HTMLElement>(`#${name}-controls`)!.hidden = mode !== name;
document.querySelector<HTMLElement>(".controls")!.hidden = mode === "form";
document.querySelector("#fill-template")!.addEventListener("click", () => void perform(async (doc, signal) => {
  const data = bookings[document.querySelector<HTMLSelectElement>("#template-data")!.value as keyof typeof bookings];
  await doc.update(Object.entries(data).map(([tag, text]) => ({ target: doc.query.contentControls().where({ tag }).one(), text })), { signal });
}));
document.querySelector("#print-document")!.addEventListener("click", () => {
  if (!current || current.disposed || !view) return;
  const style = document.createElement("style");
  style.textContent = current.pages.map(page => `@page document${page.index} { size:${page.size.width / 20}pt ${page.size.height / 20}pt; margin:0 } #document-view section:nth-child(${page.index + 1}) { page:document${page.index}; }`).join("\n");
  document.head.append(style);
  view.setZoom(1);
  try { window.print(); } finally { style.remove(); applyZoom(); }
});
const picker = document.querySelector<HTMLInputElement>("#local-file")!;
document.querySelector("#open-document")!.addEventListener("click", () => picker.click());
picker.addEventListener("change", () => { const file = picker.files?.[0]; picker.value = ""; if (file) void load(file); });
zoom.addEventListener("change", applyZoom);
download.addEventListener("click", () => {
  if (!current || current.disposed) return;
  const canvas = document.createElement("canvas");
  current.pages[0]!.render(canvas, { dpi: 144 });
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "page-1.png"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
});
Object.assign(window, { onodocsSample: { openDocument: load, dispose } });
window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); });
void load();
