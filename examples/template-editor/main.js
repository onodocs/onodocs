import { createTemplateEditor } from "@onodocs/editor";

export const designer = createTemplateEditor({
  container: document.querySelector("#app"),
  sampleData: {
    customer: "Willow & Co", items: [{ name: "Design", price: 1250 }, { name: "Review", price: 50 }], includeNote: true, date: "2026-10-08", approver: { name: "Ada" }, reviewer: { name: "Sam" },
    logo: { bytes: Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQqIgCAAGuAPMzAsGdAAAAAElFTkSuQmCC"), value => value.charCodeAt(0)), mediaType: "image/png" },
  },
});
designer.element.append(document.querySelector("#source-link").content.cloneNode(true));
await designer.open(await (await fetch("/sample.docx")).arrayBuffer(), "invoice-template.docx");
