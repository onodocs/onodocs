import type { InspectedDocument } from "@onodocs/sdk";

export function extractContent(doc: InspectedDocument) {
  const body = doc.query.stories().where({ story: "body" });
  const tables = body.tables();
  return {
    text: body.map(story => story.text).join("\n"),
    paragraphs: body.paragraphs().map(paragraph => ({ text: paragraph.text, style: paragraph.style })),
    tables: tables.map(table => table.textRows),
    deliveryTables: tables.where({ headers: ["Deliverable", "Owner", "Due"] }).map(table =>
      table.textRows.slice(1).map(([deliverable = "", owner = "", due = ""]) => ({ deliverable, owner, due }))
    )
  };
}
