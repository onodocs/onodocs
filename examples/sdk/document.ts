import { openDocument, type BrowserDocument } from "@onodocs/sdk/browser";
import { createDocument, type CanvasDocument, type DocumentView } from "@onodocs/canvas";
import sample from "../view-document/sample.docx";
import template from "./template.docx";
import { demoLicense } from "./license";

document.querySelector<HTMLElement>(".demo-header")!.hidden = window.top !== window;
document.querySelector<HTMLElement>(".source-link")!.hidden = window.top === window;

const container = document.querySelector<HTMLElement>("#document-view")!;
const viewport = document.querySelector<HTMLElement>("#document-viewport")!;
const status = document.querySelector<HTMLElement>("#status")!;
const spinner = document.querySelector<HTMLElement>("#loading-indicator")!;
const cancel = document.querySelector<HTMLButtonElement>("#cancel-loading")!;
const feedback = document.querySelector<HTMLOutputElement>("#feedback")!;
const download = document.querySelector<HTMLButtonElement>("#download-page")!;
const documentButtons = [...document.querySelectorAll<HTMLButtonElement>("#download-page, #fill-template, [data-save-pdf]")];
const mode = new URLSearchParams(location.search).get("mode") ?? "viewer";
document.querySelector(".demo-title")!.textContent = mode === "form" ? "HTML attachments" : mode === "template" ? "Tagged text replacement" : "Canvas viewer and export";
let current: BrowserDocument | undefined;
let canvasDocument: CanvasDocument | undefined;
let view: DocumentView | undefined;
let exportController: AbortController | undefined;
let documentName = "document";
let controller = new AbortController();
const bookings = {
  offsite: { event: "Team offsite", customer: "Willow Design", date: "12 November 2026, 09:00–17:00", venue: "Meadow House · Garden room", guests: "24 guests", details: "Workshop seating, projector and Wi-Fi included. Coffee on arrival and a seasonal lunch are arranged for all guests." },
  launch: { event: "Product launch", customer: "Arc Studio", date: "3 December 2026, 18:00–22:00", venue: "Meadow House · Main hall", guests: "80 guests", details: "Reception layout with a presentation area, sound system and welcome drinks. A technician will be available during setup." },
};

function dispose() {
  controller.abort();
  exportController = undefined;
  canvasDocument?.dispose();
  current?.dispose();
  current = undefined;
  canvasDocument = undefined;
  view = undefined;
  cancel.hidden = true;
  spinner.hidden = true;
  viewport.style.visibility = "";
  documentButtons.forEach(button => button.disabled = true);
}

async function load(input?: File) {
  dispose();
  controller = new AbortController();
  const { signal } = controller;
  status.hidden = true;
  cancel.hidden = true;
  spinner.hidden = false;
  viewport.style.visibility = "hidden";
  feedback.hidden = true;
  documentName = input ? input.name.replace(/\.[^.]+$/, "") : mode === "template" ? "booking-confirmation" : "document";
  viewport.scrollTop = 0;
  try {
    const source = input ?? (mode === "template" ? template : sample);
    const opened = await openDocument(source, { signal, licenseKey: await demoLicense(signal), onProgress(progress) {
      if (signal.aborted) return;
      canvasDocument ??= createDocument(progress.document, { container, viewOptions: { zoom: "fit-width", gap: 0 } });
      view = canvasDocument.view;
      const loading = progress.stage !== "ready";
      spinner.hidden = !loading;
      viewport.style.visibility = loading ? "hidden" : "visible";
    } });
    if (signal.aborted) { opened.dispose(); return; }
    current = opened;
    await view!.whenRendered();
    if (signal.aborted) return;
    status.hidden = true;
    cancel.hidden = true;
    if (mode === "form") attachFields();
    documentButtons.forEach(button => button.disabled = false); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
  } catch (error) {
    if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); dispose(); status.hidden = false; status.textContent = `Unable to open document. ${error instanceof Error ? error.message : "Try another Word file."}`; }
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
    view!.attach(input, { anchor: doc.geometry.fragments(field)[0]!, placement: "inside-center-left", size: { width: 1640, height: 420 } });
    return { deliverable: field.title, input };
  });
  view!.attach(approval, { anchor: doc.geometry.fragments(doc.query.findText("Client approval:").one())[0]!, placement: "outside-right", gap: 80, size: { width: 420, height: 420 } });
  view!.attach(approvalDate, { anchor: doc.geometry.fragments(doc.query.findText("Date:").one())[0]!, placement: "outside-right", gap: 80, size: { width: 1800, height: 420 } });
  view!.attach(submitButton, { anchor: doc.pages[0]!, placement: "inside-bottom-right", inset: 480, size: { width: 2400, height: 600 } });
  approval.addEventListener("change", () => {
    const today = new Date();
    approvalDate.value = approval.checked ? [today.getFullYear(), today.getMonth() + 1, today.getDate()].map(value => String(value).padStart(2, "0")).join("-") : "";
  });
  submitButton.addEventListener("click", () => {
    const dates = fields.map(({ deliverable, input }) => ({ deliverable, date: input.value }));
    const data = { dates, clientApproval: approval.checked, approvalDate: approvalDate.value };
    document.querySelector("#form-feedback")!.textContent = "Collected " + dates.length + " delivery dates. Add your own submit handler to send these values to your backend.";
    document.querySelector("#dates-json")!.textContent = JSON.stringify(data, null, 2);
    document.querySelector<HTMLDialogElement>("#dates-dialog")!.showModal(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_complete" }));
  });
}

async function perform(action: (doc: BrowserDocument, signal: AbortSignal) => Promise<void>, cancellable = false) {
  const doc = current;
  const documentSignal = controller.signal;
  if (!doc || doc.disposed) return;
  const operation = cancellable ? new AbortController() : undefined;
  const signal = operation ? AbortSignal.any([documentSignal, operation.signal]) : documentSignal;
  if (operation) { exportController = operation; status.hidden = false; cancel.hidden = false; }
  documentButtons.forEach(button => button.disabled = true);
  feedback.hidden = true;
  try {
    await action(doc, signal);
    if (signal.aborted) return;
    await view?.whenRendered();
  } catch (error) {
    if (!signal.aborted) { window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_error" })); feedback.textContent = error instanceof Error ? error.message : "Unable to update document."; feedback.hidden = false; }
  } finally {
    if (!documentSignal.aborted) {
      documentButtons.forEach(button => button.disabled = false);
      if (operation) { status.hidden = true; cancel.hidden = true; }
    }
    if (exportController === operation) exportController = undefined;
  }
}

for (const name of ["viewer", "template"]) document.querySelector<HTMLElement>(`#${name}-controls`)!.hidden = mode !== name;
document.querySelector("#fill-template")!.addEventListener("click", () => void perform(async (doc, signal) => {
  const data = bookings[document.querySelector<HTMLSelectElement>("#template-data")!.value as keyof typeof bookings];
  await doc.update(Object.entries(data).map(([tag, text]) => ({ target: doc.query.contentControls().where({ tag }).one(), text })), { signal }); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_generate" }));
}));
for (const button of document.querySelectorAll("[data-save-pdf]")) button.addEventListener("click", () => void perform(async (doc, signal) => {
  const filename = `${documentName}.pdf`;
  status.textContent = "Preparing PDF…";
  const bytes = await doc.pdf({ dpi: 144, signal });
  signal.throwIfAborted();
  saveBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), filename);
}, true));
const picker = document.querySelector<HTMLInputElement>("#local-file")!;
document.querySelector("#open-document")!.addEventListener("click", () => picker.click());
picker.addEventListener("change", () => { const file = picker.files?.[0]; picker.value = ""; if (file) void load(file); });
cancel.addEventListener("click", () => {
  if (exportController) { exportController.abort(); return; }
  dispose(); status.textContent = "Opening cancelled.";
});
download.addEventListener("click", () => void perform(async (doc, signal) => {
  const canvas = document.createElement("canvas");
  await canvasDocument!.pages[0]!.render(canvas, { dpi: 144, signal });
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
  if (!blob || signal.aborted) return;
  saveBlob(blob, "page-1.png");
}));

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click(); window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_export" }));
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
Object.assign(window, { onodocsSample: { openDocument: load, dispose } });
window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); });
void load();
