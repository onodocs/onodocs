import { createDocument } from "@onodocs/sdk/browser";

export const reportParagraphs = [
  "Northwind quarterly report",
  "Q3 2026 · Internal draft · Illustrative data",
  "Performance",
  "Revenue increased from €1.0 million in Q2 to €1.2 million in Q3. These figures are unaudited.",
  "Revenue grew by 25% compared with the previous quarter.",
  "Customer retention was 94%, compared with 92% in Q2.",
  "Delivery and outlook",
  "The team completed 18 of 20 planned customer migrations. Two migrations remain in progress.",
  "All customer migrations are complete.",
  "Next quarter, the team will finish the remaining migrations and review customer feedback."
];

export async function createReport(options) {
  const document = await createDocument(options);
  try {
    const caret = { paragraphId: document.query.paragraphs().one().id, offset: 0 };
    await document.edit({ kind: "replace", selection: { start: caret, end: caret }, text: reportParagraphs.join("\n") });
    for (const index of [0, 2, 6]) {
      const paragraph = document.query.paragraphs().at(index);
      const selection = { start: { paragraphId: paragraph.id, offset: 0 }, end: { paragraphId: paragraph.id, offset: paragraph.text.length } };
      await document.edit({ kind: "style", selection, style: "Heading1" });
    }
    return document;
  } catch (error) { document.dispose(); throw error; }
}

export const sampleReviewer = {
  name: "Sample reviewer · Runs locally, without an AI service",
  async analyze({ content, signal }) {
    signal.throwIfAborted();
    const paragraphs = [];
    function visit(nodes) { for (const node of nodes) { if (node.kind === "paragraph") paragraphs.push(node); visit(node.children); } }
    visit(content);
    const changes = [
      [reportParagraphs[4], "Revenue grew by 20% compared with the previous quarter.", "The reported increase from €1.0 million to €1.2 million is 20%.", reportParagraphs[3]],
      [reportParagraphs[8], "18 of 20 customer migrations are complete; two remain in progress.", "The delivery section lists two migrations still in progress.", reportParagraphs[7]]
    ];
    return { summary: "Review the growth calculation and migration status against their supporting passages.", findings: changes.flatMap(([quote, replacement, reason, evidence]) => {
      const paragraph = paragraphs.find(p => p.text === quote), supporting = paragraphs.find(p => p.text === evidence);
      return paragraph && supporting ? [{ source: paragraph.source, start: 0, end: quote.length, quote, replacement, reason, evidence: [{ source: supporting.source, start: 0, end: evidence.length, quote: evidence }] }] : [];
    }) };
  }
};

export function httpReviewer(url, name) {
  return { name, async analyze({ content, markdown, signal }) {
    const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, markdown }), signal });
    if (!response.ok) throw new Error(`Review service failed (${response.status}).`);
    return response.json();
  } };
}
