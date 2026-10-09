const samples = {
  viewer: { title: "Word document viewer", path: "/samples/sdk/index.html?mode=viewer", guide: "browser", codeTitle: "Viewer controls", context: "This excerpt opens the selected File in a container element. The rendering guide includes setup and cleanup. The full sample adds PNG and searchable PDF export.", code: `import { openDocument } from "@onodocs/sdk/browser";
import { createDocument } from "@onodocs/canvas";

const doc = await openDocument(file);
const canvasDocument = createDocument(doc);
const view = canvasDocument.mount(container, { zoom: "fit-width" });
await view.whenRendered();` },
  form: { title: "HTML control attachments", path: "/samples/sdk/index.html?mode=form", guide: "anchors", codeTitle: "Collect form values", context: "This excerpt uses the sample’s HTML controls and an open document view. Source on GitHub includes the complete HTML and loading code.", code: `const controls = document.querySelector("#form-controls").content.cloneNode(true);
const approval = controls.querySelector("#client-approval");
const approvalDate = controls.querySelector("#approval-date");
const submitButton = controls.querySelector("#save-form");
const deliveryInput = document.querySelector("#delivery-input");

const fields = doc.query.contentControls()
  .where({ tag: "delivery-date" }).map(field => {
    const input = deliveryInput.content.firstElementChild.cloneNode(true);
    input.value = field.text;
    view.attach(input, {
      anchor: doc.geometry.fragments(field)[0], placement: "inside-center-left",
      size: { width: 1640, height: 420 }
    });
    return { deliverable: field.title, input };
  });

view.attach(approval, {
  anchor: doc.geometry.fragments(doc.query.findText("Client approval:").one())[0],
  placement: "outside-right", gap: 80,
  size: { width: 420, height: 420 }
});
view.attach(approvalDate, {
  anchor: doc.geometry.fragments(doc.query.findText("Date:").one())[0],
  placement: "outside-right", gap: 80,
  size: { width: 1800, height: 420 }
});
view.attach(submitButton, {
  anchor: doc.pages[0],
  placement: "inside-bottom-right", inset: 480,
  size: { width: 2400, height: 600 }
});

approval.addEventListener("change", () => {
  const today = new Date();
  approvalDate.value = approval.checked
    ? [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      .map(value => String(value).padStart(2, "0")).join("-")
    : "";
});
submitButton.addEventListener("click", () => {
  const dates = fields.map(({ deliverable, input }) => ({ deliverable, date: input.value }));
  document.querySelector("#form-feedback").textContent =
    "Collected " + dates.length + " delivery dates. Add your own submit handler to send these values to your backend.";
  document.querySelector("#dates-json").textContent = JSON.stringify({
    dates, clientApproval: approval.checked,
    approvalDate: approvalDate.value
  }, null, 2);
  document.querySelector("#dates-dialog").showModal();
});` },
  template: { title: "Tagged text updates", path: "/samples/sdk/index.html?mode=template", guide: "updates", codeTitle: "Fill a booking confirmation", context: "This excerpt fills the sample booking template after opening it. The updates guide links to that template; the complete source includes loading and export.", code: `const data = {
  event: "Team offsite",
  customer: "Willow Design",
  date: "12 November 2026, 09:00–17:00",
  venue: "Meadow House · Garden room",
  guests: "24 guests",
  details: "Workshop seating, projector and Wi-Fi included. " +
    "Coffee on arrival and a seasonal lunch are arranged for all guests."
};

await doc.update(Object.entries(data).map(([tag, text]) => ({
  target: doc.query.contentControls().where({ tag }).one(),
  text
})));` },
  workflows: { title: "Queries and text output", path: "/samples/workflows/workflows.html", guide: "node", codeTitle: "", context: "", code: "" },
};
if (!document.getElementById("sample-tabs")) {
  const sample = new URLSearchParams(location.hash.slice(1)).get("sample");
  if (sample && Object.hasOwn(samples, sample)) location.replace(`/developers/examples/#sample=${sample}`);
} else {
const tabs = [...document.querySelectorAll("[data-sample]")];
const panel = document.getElementById("sample-panel");
const preview = document.getElementById("sample-preview");
const status = document.getElementById("sample-status");
let frame = document.getElementById("sample-frame");
let selected;

function release() {
  frame.contentWindow?.onodocsSample?.dispose();
  frame.remove();
}

function selectSample(name, updateUrl = true) {
  if (!Object.hasOwn(samples, name)) name = "viewer";
  selected = name;
  panel.classList.toggle("workflow-panel", name === "workflows");
  release();
  const sample = samples[name];
  frame = document.createElement("iframe");
  frame.id = "sample-frame";
  frame.title = sample.title;
  frame.src = sample.path;
  status.textContent = "Opening sample…";
  panel.setAttribute("aria-labelledby", `tab-${name}`);
  document.getElementById("sample-code").textContent = sample.code;
  document.getElementById("code-title").textContent = sample.codeTitle;
  document.getElementById("code-context").textContent = sample.context;
  document.querySelector("[data-copy='sample-code']").textContent = "Copy code";
  const guide = document.getElementById("code-guide");
  guide.href = `/developers/#${sample.guide}`;
  guide.textContent = name === "viewer" ? "Rendering guide" : name === "workflows" ? "Document analysis guide" : name === "form" ? "Document controls guide" : "Document updates guide";
  for (const tab of tabs) {
    const active = tab.dataset.sample === name;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  const current = frame;
  frame.addEventListener("load", () => {
    if (frame !== current) return;
    status.textContent = "";
  });
  preview.append(frame);
  if (updateUrl) history.replaceState(null, "", `${location.pathname}#sample=${name}`);
}

for (const tab of tabs) {
  tab.addEventListener("click", () => { selectSample(tab.dataset.sample); });
  tab.addEventListener("keydown", event => {
    const index = tabs.indexOf(tab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
}
document.getElementById("reset-sample").addEventListener("click", () => { selectSample(selected); });
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#sample=")) return;
  selectSample(location.hash.slice(8), false);
});
window.addEventListener("pagehide", event => { if (!event.persisted) { release(); } });
selectSample(location.hash.slice(1).split("sample=")[1], !location.hash || location.hash.startsWith("#sample="));

}
