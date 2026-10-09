import { openDocument } from "@onodocs/sdk";
import sample from "../view-document/sample.docx";

import { toAscii } from "./ascii";
import { tree } from "./ast";
import { demoLicense } from "./license";

document.querySelector<HTMLElement>(".demo-header")!.hidden = window.top !== window;
document.querySelector<HTMLElement>(".source-link")!.hidden = window.top === window;

const controller = new AbortController();
const status = document.querySelector<HTMLElement>("#status")!;
const spinner = document.querySelector<HTMLElement>("#loading-indicator")!;
const apply = document.querySelector<HTMLButtonElement>("#apply-response")!;
let deliveries: readonly (readonly string[])[] = [];

async function load() {
  let doc: Awaited<ReturnType<typeof openDocument>> | undefined;
  try {
    const signal = controller.signal;
    doc = await openDocument(sample, { signal, licenseKey: await demoLicense(signal) });
    if (controller.signal.aborted) return;
    deliveries = doc.query.tables().where({ headers: ["Deliverable", "Owner", "Due"] }).one().textRows;
    const tasks = deliveries.slice(1).map(([task, owner, due]) => ({ task: task!, owner: owner!, due: due! }));
    document.querySelector("#ast-output")!.textContent = tree(doc.query.one());
    document.querySelector("#ascii-output")!.textContent = toAscii(doc.query.one());
    document.querySelector("#ai-context")!.textContent = JSON.stringify(deliveries, null, 2);
    const cards = document.querySelector("#delivery-cards")!;
    for (const task of tasks) {
      const card = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = task.task;
      const detail = document.createElement("span");
      detail.textContent = `${task.owner} · ${task.due}`;
      card.append(title, detail);
      cards.append(card);
    }
    apply.disabled = false; window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_ready" }));
    spinner.hidden = true;
    status.hidden = true;
    document.querySelector<HTMLElement>("main")!.hidden = false;
  } catch (error) {
    if (!controller.signal.aborted) {
      spinner.hidden = true;
      status.hidden = false;
      status.textContent = `Unable to open document. ${error instanceof Error ? error.message : "Try resetting the sample."}`;
    }
  } finally { doc?.dispose(); }
}

apply.addEventListener("click", () => {
  if (controller.signal.aborted || !deliveries.length) return;
  const items = deliveries.slice(1).map(([task, owner, due]) => `- ${task}: ${owner}, due ${due}.`).join("\n");
  const email = `Subject: Upcoming project deliveries\n\nHi team,\n\nHere is our upcoming delivery schedule:\n\n${items}\n\nPlease confirm that these dates work for you and flag any blockers.\n\nThanks!`;
  document.querySelector("#email-output")!.textContent = email;
  document.querySelector<HTMLElement>("#email-draft")!.hidden = false;
  apply.hidden = true; window.dispatchEvent(new CustomEvent("onodocs-demo-outcome", { detail: "demo_generate" }));
});

function dispose() {
  controller.abort();
  spinner.hidden = true;
  deliveries = [];
  apply.disabled = true;
  document.querySelector("main")!.replaceChildren();
}

Object.assign(window, { onodocsSample: { dispose } });
window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); });
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById(button.dataset.copy!)!.textContent!);
    button.textContent = "Copied";
  } catch { button.textContent = "Select code to copy"; }
});
void load();
