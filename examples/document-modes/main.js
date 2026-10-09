import { openApplicationEditor } from "@onodocs/editor/application";

const status = document.querySelector("#status");
const input = new Uint8Array(await (await fetch("/sample.docx")).arrayBuffer());
const definition = await (await fetch("/definition.json")).json();
let saved;
const application = await openApplicationEditor({
  container: document.querySelector("main"), input,
  mode: "view", allowedModes: ["view", "edit", "review", "form"], form: definition,
  review: { identity: () => ({ author: "Alex Reviewer", initials: "AR", date: new Date().toISOString() }) },
  persist: async bytes => { saved = bytes; },
  onModeChange: mode => { status.textContent = "Mode: " + ({ view: "Viewing", edit: "Editing", review: "Reviewing", form: "Filling form" })[mode] + ". Your changes are retained."; },
  onFormComplete: async result => { await application.save(); download(result.bytes, "completed.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); download(JSON.stringify(result.answers, null, 2), "answers.json", "application/json"); },
  onEvent(event) { if (event.type === "saved") status.textContent = "Draft saved in this session."; if (event.type === "error") status.textContent = String(event.error); }
});
status.textContent = "Viewing the request. This demo permits all four modes; your application chooses the available modes.";
function download(data, name, type) { const url = URL.createObjectURL(new Blob([data], { type })), link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
document.querySelector("#save").addEventListener("click", () => { void application.save().catch(error => { status.textContent = String(error); }); });
export { application, saved, openApplicationEditor };
