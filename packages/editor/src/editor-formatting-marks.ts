import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentView, DocumentAttachment } from "@onodocs/canvas";

export function formattingMarks(doc: BrowserDocument, view: DocumentView): DocumentAttachment[] {
  const attachments: DocumentAttachment[] = [], identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const namespace = "http://www.w3.org/2000/svg";
  for (const page of doc.pages) {
    const lines = doc.geometry.page(page.index).text, last = new Map(lines.map(line => [line.mapping.paragraphId, line]));
    for (const line of lines) {
      const mapping = line.mapping, paragraph = doc.content.get(mapping.paragraphId);
      if (paragraph?.kind !== "paragraph" || !mapping.carets.length) continue;
      const carets = new Map(mapping.carets.map(caret => [caret.scalarOffset, caret]));
      let left = Infinity, right = -Infinity;
      for (const caret of mapping.carets) { left = Math.min(left, caret.x); right = Math.max(right, caret.x); }
      const rectangle = { x: left - mapping.height, y: mapping.top, width: right - left + mapping.height * 2, height: mapping.height };
      const wrapper = document.createElement("div"), svg = document.createElementNS(namespace, "svg");
      wrapper.className = "formatting-marks"; wrapper.setAttribute("aria-hidden", "true");
      Object.assign(wrapper.style, { width: "100%", height: "100%", pointerEvents: "none" });
      svg.setAttribute("viewBox", `${rectangle.x} ${rectangle.y} ${rectangle.width} ${rectangle.height}`);
      Object.assign(svg.style, { width: "100%", height: "100%", display: "block" });
      function mark(text: string, x: number, centered = false): void {
        const node = document.createElementNS(namespace, "text"); node.textContent = text;
        for (const [name, value] of Object.entries({ x, y: mapping.top + mapping.height * 0.76, fill: "#467eae", "font-family": "Arial,sans-serif", "font-size": mapping.height * 0.65, "text-anchor": centered ? "middle" : "start" })) node.setAttribute(name, String(value));
        svg.append(node);
      }
      for (const [index, scalar] of mapping.scalars.entries()) {
        const symbol = scalar === " " ? "·" : scalar === "\t" ? "→" : scalar === "\n" ? "↵" : scalar === "\u00a0" ? "°" : undefined;
        if (!symbol) continue;
        const start = carets.get(mapping.scalarStart + index), end = carets.get(mapping.scalarStart + index + 1);
        if (start) mark(symbol, end && end.x !== start.x ? (start.x + end.x) / 2 : start.x, scalar !== "\n");
      }
      const end = mapping.carets.at(-1)!;
      if (last.get(paragraph.id) === line && end.paragraphOffset === paragraph.text.length) mark("¶", end.x);
      if (!svg.childElementCount) continue;
      wrapper.append(svg);
      attachments.push(view.attach(wrapper, { anchor: { pageIndex: page.index, rectangle, bounds: rectangle, transform: line.transform ?? identity, clips: [...(line.clip ? [{ rectangle: line.clip, transform: line.transform ?? identity }] : []), ...(line.physicalClips ?? []).map(clip => ({ ...clip, transform: clip.transform ?? identity }))] }, interactive: false }));
    }
  }
  return attachments;
}
