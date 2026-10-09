import type { DocumentEdit, DocumentQuery, DocumentSelection, TextFormatting } from "@onodocs/sdk";

type Paragraph = Extract<DocumentEdit, { kind: "paste" }>["paragraphs"][number];
type Run = Paragraph["runs"][number];

export function readClipboard(html: string): { paragraphs: readonly Paragraph[]; convertedObjects: boolean } {
  const template = document.createElement("template");
  template.innerHTML = html;
  const output: Paragraph[] = [];
  let runs: Run[] = [], alignment: Paragraph["alignment"], list: Paragraph["list"] = null, group = 0, preserve = false;
  const flush = (empty = false) => { if (runs.length || empty) output.push({ runs, list: list ?? null, ...(alignment ? { alignment } : {}) }); runs = []; };
  const append = (text: string, formatting: TextFormatting, link?: string | null) => {
    if (!preserve) { text = text.replace(/[\t\n\r ]+/g, " "); if (!runs.length || runs.at(-1)!.text.endsWith(" ")) text = text.replace(/^ /, ""); }
    if (text) runs.push({ text, formatting, link: link ?? null });
  };
  const walk = (node: Node, inherited: TextFormatting, link?: string | null) => {
    if (node.nodeType === Node.TEXT_NODE) { append(node.textContent ?? "", inherited, link); return; }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.localName;
    if (["script", "style", "iframe", "object", "embed", "template", "head", "meta", "link", "noscript"].includes(tag) || node.hidden || node.style.display === "none") return;
    if (tag === "ul" || tag === "ol") {
      flush(); const previous = list;
      list = { kind: tag === "ol" ? "decimal" : "bullet", level: Math.min(8, previous ? previous.level + 1 : 0), group: previous?.group ?? group++ };
      for (const child of node.childNodes) walk(child, inherited, link);
      flush(); list = previous; return;
    }
    const block = ["p", "div", "section", "article", "blockquote", "pre", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"].includes(tag);
    const previousAlignment = alignment, previousPreserve = preserve;
    if (block) { flush(); alignment = undefined; }
    const align = node.style.textAlign || node.getAttribute("align");
    if (["left", "center", "right", "justify"].includes(align ?? "")) alignment = align === "justify" ? "both" : align as Paragraph["alignment"];
    preserve ||= tag === "pre" || node.style.whiteSpace.startsWith("pre");
    const formatting: TextFormatting = { ...inherited, ...htmlFormatting(node) };
    if (tag === "a") { const target = node.getAttribute("href") ?? ""; link = /^(https?:\/\/|mailto:|#).+/i.test(target) ? target : null; }
    if (tag === "br") runs.push({ text: "\n", formatting, link: link ?? null });
    else if (tag === "img") append(node.getAttribute("alt") ?? "", formatting, link);
    else {
      if ((tag === "td" || tag === "th") && runs.length) runs.push({ text: "\t", formatting });
      for (const child of node.childNodes) walk(child, formatting, link);
    }
    if (block) { flush(!node.textContent?.trim() && !node.querySelector("p,div,li,tr")); alignment = previousAlignment; }
    preserve = previousPreserve;
  };
  const base: TextFormatting = { bold: false, italic: false, underline: false, strike: false, fontSize: 11, fontFamily: "Calibri", color: "#000000" };
  for (const node of template.content.childNodes) walk(node, base);
  flush();
  return { paragraphs: output, convertedObjects: !!template.content.querySelector("table,img") };
}

function htmlFormatting(element: HTMLElement): TextFormatting {
  const style = element.style, tag = element.localName;
  const value: { -readonly [K in keyof TextFormatting]: TextFormatting[K] } = {};
  if (["b", "strong", "th"].includes(tag)) value.bold = true;
  if (["i", "em"].includes(tag)) value.italic = true;
  if (tag === "u") value.underline = true;
  if (["s", "strike", "del"].includes(tag)) value.strike = true;
  if (style.fontWeight) value.bold = style.fontWeight === "bold" || Number(style.fontWeight) >= 600;
  if (style.fontStyle) value.italic = ["italic", "oblique"].includes(style.fontStyle);
  const decoration = style.textDecorationLine || style.textDecoration;
  if (decoration) { value.underline = decoration.includes("underline"); value.strike = decoration.includes("line-through"); }
  const size = style.fontSize.match(/^([\d.]+)(pt|px)$/);
  if (size && Number(size[1]) > 0) value.fontSize = Math.max(.5, Math.round(Number(size[1]) * (size[2] === "px" ? .75 : 1) * 2) / 2);
  const family = style.fontFamily || element.getAttribute("face");
  if (family) value.fontFamily = family.split(",")[0]!.trim().replace(/^["']|["']$/g, "");
  const color = style.color || element.getAttribute("color");
  if (color) {
    const context = document.createElement("canvas").getContext("2d")!;
    context.fillStyle = "#000000"; context.fillStyle = color;
    if (/^#[\da-f]{6}$/i.test(context.fillStyle)) value.color = context.fillStyle;
  }
  return value;
}

export function writeClipboard(query: DocumentQuery<"document">, selection: DocumentSelection): { text: string; html: string } {
  const all = query.paragraphs().all(), first = all.findIndex(p => p.id === selection.start.paragraphId), last = all.findIndex(p => p.id === selection.end.paragraphId);
  const container = document.createElement("div"), text: string[] = [];
  const lists: { element: HTMLElement; group: string; kind: string }[] = [];
  for (const [index, paragraph] of all.slice(first, last + 1).entries()) {
    const from = index === 0 ? selection.start.offset : 0, to = index === last - first ? selection.end.offset : paragraph.text.length;
    text.push(paragraph.text.slice(from, to));
    const list = paragraph.list && ["bullet", "decimal"].includes(paragraph.list.kind) ? paragraph.list : undefined;
    const p = document.createElement(list ? "li" : "p"); p.style.textAlign = paragraph.alignment === "both" ? "justify" : paragraph.alignment; p.style.whiteSpace = "pre-wrap"; p.style.margin = "0";
    let offset = 0;
    for (const run of query.within(paragraph).runs()) {
      const limit = offset + run.text.length;
      if (from < limit && to > offset) {
        const span = document.createElement("span"), format = run.formatting;
        span.textContent = run.text.slice(Math.max(0, from - offset), Math.min(run.text.length, to - offset));
        span.style.fontWeight = format.bold ? "bold" : "normal"; span.style.fontStyle = format.italic ? "italic" : "normal";
        span.style.textDecoration = [format.underline ? "underline" : "", format.strike ? "line-through" : ""].filter(Boolean).join(" ") || "none";
        span.style.fontSize = `${format.fontSize ?? 11}pt`; span.style.fontFamily = format.fontFamily ?? "Calibri"; span.style.color = format.color ?? "#000000";
        const target = run.link ? (run.link.kind === "bookmark" ? "#" : "") + run.link.target : undefined;
        if (target && /^(https?:\/\/|mailto:|#).+/i.test(target)) { const a = document.createElement("a"); a.href = target; a.append(span); p.append(a); }
        else p.append(span);
      }
      offset = limit;
    }
    if (list) {
      const { group, kind } = list, depth = Math.min(list.level, lists.length);
      lists.splice(depth + 1);
      if (lists[depth]?.group !== group || lists[depth]?.kind !== kind) {
        lists.splice(depth);
        const element = document.createElement(kind === "bullet" ? "ul" : "ol");
        (lists.at(-1)?.element.lastElementChild ?? container).append(element); lists.push({ element, group, kind });
      }
      lists.at(-1)!.element.append(p);
    } else { lists.length = 0; container.append(p); }
  }
  return { text: text.join("\n"), html: container.innerHTML };
}
