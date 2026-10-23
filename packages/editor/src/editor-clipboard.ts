import { textHighlightColors } from "@onodocs/sdk";
import type { DocumentEdit, DocumentImage, DocumentQuery, DocumentSelection, DocumentTable, DocumentParagraph, TextFormatting, TableContent, TableBorder, CellProperties, PropertyPatch } from "@onodocs/sdk";

type Paragraph = Extract<DocumentEdit, { kind: "paste" }>["paragraphs"][number];
type Run = Paragraph["runs"][number];

export function readClipboard(html: string, listState = { groups: new Map<string, number>(), next: 0 }): { paragraphs: readonly Paragraph[]; convertedObjects: boolean } {
  const template = document.createElement("template");
  template.innerHTML = html;
  const output: Paragraph[] = [];
  let colorContext: CanvasRenderingContext2D | undefined;
  let convertedObjects = false;
  let properties: Paragraph["properties"], dropCap: Paragraph["dropCap"];
  let runs: Run[] = [], alignment: Paragraph["alignment"], list: Paragraph["list"] = null, preserve = false;
  const flush = (empty = false) => { if (runs.length || empty) output.push({ runs, ...(dropCap !== undefined ? { dropCap } : {}), ...(properties ? { properties } : {}), list: list ?? null, ...(alignment ? { alignment } : {}) }); runs = []; };
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
      const key = node.dataset.onodocsList, group = previous?.group ?? (key === undefined ? undefined : listState.groups.get(key)) ?? listState.next++;
      if (key !== undefined) listState.groups.set(key, group);
      list = { kind: tag === "ol" ? "decimal" : "bullet", level: Math.min(8, previous ? previous.level + 1 : 0), group };
      for (const child of node.childNodes) walk(child, inherited, link);
      flush(); list = previous; return;
    }
    const block = ["p", "div", "section", "article", "blockquote", "pre", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"].includes(tag);
    const previousAlignment = alignment, previousPreserve = preserve, previousProperties = properties, previousDropCap = dropCap;
    if (block) { flush(); alignment = undefined; dropCap = node.dataset.onodocsDropCap === undefined ? undefined : JSON.parse(node.dataset.onodocsDropCap); properties = node.dataset.onodocsParagraph ? JSON.parse(node.dataset.onodocsParagraph) : undefined; }
    const align = node.style.textAlign || node.getAttribute("align");
    if (["left", "center", "right", "justify"].includes(align ?? "")) alignment = align === "justify" ? "both" : align as Paragraph["alignment"];
    preserve ||= tag === "pre" || node.style.whiteSpace.startsWith("pre");
    const formatting: TextFormatting = { ...inherited, ...htmlFormatting(node) };
    if (tag === "a") { const target = node.dataset.onodocsBookmark === undefined ? node.getAttribute("href") ?? "" : "#" + node.dataset.onodocsBookmark; link = /^(https?:\/\/|mailto:|#).+/i.test(target) ? target : null; }
    if (node.dataset.onodocsChart !== undefined) { runs.push({ text: "", chart: { bytes: Uint8Array.from(atob(node.dataset.onodocsChart), value => value.charCodeAt(0)) }, link: link ?? null }); }
    else if (node.dataset.onodocsEquation !== undefined) { runs.push({ text: node.textContent ?? "", equation: JSON.parse(node.dataset.onodocsEquation) }); }
    else if (tag === "br") {
      const type = node.dataset.onodocsBreak ?? (node.style.breakBefore === "page" || node.style.pageBreakBefore === "always" ? "page" : node.style.breakBefore === "column" ? "column" : undefined);
      runs.push({ text: "\n", ...(type === "page" || type === "column" ? { breaks: [{ offset: 0, type }] } : {}), formatting, link: link ?? null });
    }
    else if (tag === "img") {
      const data = node.getAttribute("src")?.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/i);
      if (!data) { append(node.getAttribute("alt") ?? "", formatting, link); convertedObjects = true; return; }
      const metadata = node.dataset.onodocsImage ? JSON.parse(node.dataset.onodocsImage) : {};
      const dimension = (value: string, attribute: string | null) => value.endsWith("pt") ? parseFloat(value) : parseFloat(value || attribute || "0") * 0.75;
      const image = { hyperlinks: metadata.hyperlinks, shadow: metadata.shadow, rotation: metadata.rotation, flipHorizontal: metadata.flipHorizontal, flipVertical: metadata.flipVertical, crop: metadata.crop, layout: metadata.layout, bytes: Uint8Array.from(atob(data[2]!), value => value.charCodeAt(0)), mediaType: data[1]!.toLowerCase() as "image/png" | "image/jpeg", width: metadata.width ?? dimension(node.style.width, node.getAttribute("width")), height: metadata.height ?? dimension(node.style.height, node.getAttribute("height")), description: node.getAttribute("alt") ?? "" };
      if (!(image.width > 0 && image.height > 0)) throw new Error("The pasted image needs a width and height.");
      runs.push({ text: "", image, formatting, link: link ?? null });
    }
    else {
      if ((tag === "td" || tag === "th") && runs.length) runs.push({ text: "\t", formatting });
      for (const child of node.childNodes) walk(child, formatting, link);
    }
    if (block) { flush(!node.textContent?.trim() && !node.querySelector("p,div,li,tr")); alignment = previousAlignment; properties = previousProperties; dropCap = previousDropCap; }
    preserve = previousPreserve;
  };
  const base: TextFormatting = { textEffect: "none", verticalAlignment: "baseline", highlight: "none", bold: false, italic: false, underline: false, strike: false, fontSize: 11, fontFamily: "Calibri", color: "#000000" };
  for (const node of template.content.childNodes) walk(node, base);
  flush();
  return { paragraphs: output, convertedObjects: convertedObjects || !!template.content.querySelector("table") };

  function htmlFormatting(element: HTMLElement): TextFormatting {
    const style = element.style, tag = element.localName;
    const value: { -readonly [K in keyof TextFormatting]: TextFormatting[K] } = {};
    const effect = element.dataset.onodocsTextEffect;
    if (effect && ["none", "outline", "shadow", "outlineShadow", "emboss", "imprint"].includes(effect)) value.textEffect = effect as NonNullable<TextFormatting["textEffect"]>;
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
    const vertical = style.verticalAlign || (element.localName === "sup" ? "super" : element.localName === "sub" ? "sub" : "");
    if (["baseline", "super", "sub"].includes(vertical)) value.verticalAlignment = vertical === "super" ? "superscript" : vertical === "sub" ? "subscript" : "baseline";
    if (style.backgroundColor) {
      const context = colorContext ??= document.createElement("canvas").getContext("2d")!;
      context.fillStyle = "transparent"; context.fillStyle = style.backgroundColor;
      const color = context.fillStyle.toUpperCase(), entry = Object.entries(textHighlightColors).find(([, value]) => value === color);
      if (entry) value.highlight = entry[0] as keyof typeof textHighlightColors;
    }
    const color = style.color || element.getAttribute("color");
    if (color) {
      const context = colorContext ??= document.createElement("canvas").getContext("2d")!;
      context.fillStyle = "#000000"; context.fillStyle = color;
      if (/^#[\da-f]{6}$/i.test(context.fillStyle)) value.color = context.fillStyle;
    }
    return value;
  }
}

export async function readImageFile(file: Blob, maximumWidth = 432): Promise<NonNullable<Run["image"]>> {
  if (file.type !== "image/png" && file.type !== "image/jpeg") throw new TypeError("Choose a PNG or JPEG image.");
  const bitmap = await createImageBitmap(file), width = Math.min(bitmap.width * .75, maximumWidth), height = width * bitmap.height / bitmap.width;
  bitmap.close();
  return { bytes: new Uint8Array(await file.arrayBuffer()), mediaType: file.type, width, height };
}

function clipboardLink(element: HTMLElement, link: import("@onodocs/sdk").DocumentRun["link"]): HTMLElement {
  const target = link ? (link.kind === "bookmark" ? "#" : "") + link.target : undefined;
  if (!target || !/^(https?:\/\/|mailto:|#).+/i.test(target)) return element;
  const anchor = document.createElement("a"); anchor.href = target; if (link?.kind === "bookmark") anchor.dataset.onodocsBookmark = link.target; anchor.append(element); return anchor;
}

export function createClipboardImage(picture: DocumentImage, src: string): HTMLElement {
  const img = document.createElement("img"); img.src = src; img.alt = picture.description ?? ""; img.style.width = `${picture.width}pt`; img.style.height = `${picture.height}pt`;
  const hyperlinks = picture.hyperlinks === undefined ? undefined : Object.fromEntries(Object.entries(picture.hyperlinks).map(([trigger, link]) => [trigger, { target: (link.kind === "bookmark" ? "#" : "") + link.target, tooltip: link.kind === "external" ? link.tooltip : undefined }]));
  img.dataset.onodocsImage = JSON.stringify({ hyperlinks, shadow: picture.shadow, width: picture.width, height: picture.height, rotation: picture.rotation, flipHorizontal: picture.flipHorizontal, flipVertical: picture.flipVertical, crop: picture.crop, layout: picture.layout });
  return clipboardLink(img, picture.parent?.kind === "run" ? picture.parent.link : undefined);
}

export function createClipboardChart(chart: import("@onodocs/sdk").DocumentDrawing, data: string): HTMLElement {
  const span = document.createElement("span"); span.dataset.onodocsChart = data; span.textContent = chart.description || chart.chart?.title || "Chart";
  return clipboardLink(span, chart.parent?.kind === "run" ? chart.parent.link : undefined);
}

export function writeClipboard(query: DocumentQuery<"document">, selection: DocumentSelection, paragraphs?: readonly DocumentParagraph[], images: ReadonlyMap<string, string> = new Map(), charts: ReadonlyMap<string, string> = new Map()): { text: string; html: string } {
  const start = selection.start.paragraphId === selection.end.paragraphId ? query.get(selection.start.paragraphId) : undefined;
  const all = paragraphs ?? (start?.kind === "paragraph" ? [start] : query.paragraphs().all()), first = all.findIndex(p => p.id === selection.start.paragraphId), last = all.findIndex(p => p.id === selection.end.paragraphId);
  const container = document.createElement("div"), text: string[] = [];
  const lists: { element: HTMLElement; group: string; kind: string }[] = [];
  const nextSibling = new Map<string, import("@onodocs/sdk").DocumentElement>();
  for (const parent of new Set(all.filter(paragraph => paragraph.dropCap).map(paragraph => paragraph.parent))) if (parent) for (let index = 1; index < parent.children.length; index++) nextSibling.set(parent.children[index - 1]!.id, parent.children[index]!);
  let initial: HTMLElement | undefined, initialText = "", initialDropCap: DocumentParagraph["dropCap"];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (let index = first; index <= last; index++) {
    const paragraph = all[index]!;
    const from = index === first ? selection.start.offset : 0, to = index === last ? selection.end.offset : paragraph.text.length;
    const selectedText = paragraph.text.slice(from, to);
    if (initial) text[text.length - 1] += selectedText; else text.push(selectedText);
    const list = paragraph.list && ["bullet", "decimal"].includes(paragraph.list.kind) ? paragraph.list : undefined;
    const p = document.createElement(list ? "li" : "p"); p.style.textAlign = paragraph.alignment === "both" ? "justify" : paragraph.alignment; p.style.whiteSpace = "pre-wrap"; p.style.margin = "0";
    const { styleId, ...properties } = paragraph.properties.effective;
    p.dataset.onodocsParagraph = JSON.stringify(properties);
    let offset = 0;
    for (const run of query.within(paragraph).runs()) {
      const limit = offset + run.text.length;
      const appendText = (begin: number, end: number) => {
        if (begin >= end && !run.equation) return;
        const span = document.createElement("span"), format = run.properties.effective;
        if (begin === 0 && end === run.text.length && run.semantic.kind === "officeMath") {
          if (!run.equation) throw new Error("This equation contains unsupported structures. Select its text to copy a plain-text portion, or retain it in the original Word document.");
          span.dataset.onodocsEquation = JSON.stringify(run.equation);
        }
        let cursor = begin;
        for (const value of run.breaks) {
          if (value.offset < begin || value.offset >= end) continue;
          span.append(run.text.slice(cursor, value.offset));
          const br = document.createElement("br"); br.dataset.onodocsBreak = value.type; br.style.breakBefore = value.type; span.append(br); cursor = value.offset + 1;
        }
        span.append(run.text.slice(cursor, end));
        span.dataset.onodocsTextEffect = format.textEffect ?? "none";
        span.style.fontWeight = format.bold ? "bold" : "normal"; span.style.fontStyle = format.italic ? "italic" : "normal";
        span.style.textDecoration = [format.underline ? "underline" : "", format.strike ? "line-through" : ""].filter(Boolean).join(" ") || "none";
        span.style.fontSize = `${format.fontSize ?? 11}pt`; span.style.fontFamily = format.fontFamily ?? "Calibri"; span.style.color = format.color ?? "#000000";
        span.style.verticalAlign = format.verticalAlignment === "superscript" ? "super" : format.verticalAlignment === "subscript" ? "sub" : "baseline";
        if (format.highlight && format.highlight !== "none") span.style.backgroundColor = textHighlightColors[format.highlight];
        p.append(clipboardLink(span, run.link));
      };
      let cursor = Math.max(0, from - offset);
      const end = Math.min(run.text.length, to - offset);
      for (const object of query.within(run).descendants()) {
        if (object.kind !== "image" && object.kind !== "drawing") continue;
        const position = object.position;
        if (!position) throw new Error("This object has no editable text position.");
        if (position.offset < from || position.offset > to || position.offset === to && to !== paragraph.text.length) continue;
        const at = position.offset - offset;
        appendText(cursor, Math.min(end, at)); cursor = at;
        if (object.kind === "image") {
          const src = images.get(object.id);
          if (!src) throw new Error("This image cannot be copied with the selected content.");
          p.append(createClipboardImage(object, src));
        } else {
          const data = charts.get(object.id);
          if (!data) throw new Error("Copying this drawing is not supported yet.");
          p.append(createClipboardChart(object, data));
        }
      }
      if (cursor < end || run.equation && !run.text.length && offset >= from && (offset < to || offset === to && to === paragraph.text.length)) appendText(cursor, end);
      offset = limit;
      if (offset > to) break;
    }
    if (initial) p.prepend(...initial.childNodes);
    const next = all[index + 1];
    if (paragraph.dropCap && index < last && next && nextSibling.get(paragraph.id) === next && paragraph.sectionIndex === next.sectionIndex) {
      if (!initial) initialDropCap = from === 0 && to === paragraph.text.length ? paragraph.dropCap : undefined;
      initialText += selectedText; initial = p; continue;
    }
    p.dataset.onodocsDropCap = JSON.stringify(initialDropCap && selectedText.length ? { ...initialDropCap, characters: [...segmenter.segment(initialText)].length } : null);
    initial = undefined; initialText = ""; initialDropCap = undefined;
    if (list) {
      const { group, kind } = list, depth = Math.min(list.level, lists.length);
      lists.splice(depth + 1);
      if (lists[depth]?.group !== group || lists[depth]?.kind !== kind) {
        lists.splice(depth);
        const element = document.createElement(kind === "bullet" ? "ul" : "ol"); element.dataset.onodocsList = group;
        (lists.at(-1)?.element.lastElementChild ?? container).append(element); lists.push({ element, group, kind });
      }
      lists.at(-1)!.element.append(p);
    } else { lists.length = 0; container.append(p); }
  }
  return { text: text.join("\n"), html: container.innerHTML };
}

export type ClipboardCells = TableContent;

export function readClipboardCells(html: string, text: string): ClipboardCells | undefined {
  const template = document.createElement("template"); template.innerHTML = html;
  const listState = { groups: new Map<string, number>(), next: 0 };
  for (const [index, list] of [...template.content.querySelectorAll<HTMLElement>("ol,ul")].entries()) list.dataset.onodocsList ??= `clipboard:${index}`;
  const tables = [...template.content.querySelectorAll("table")].filter(table => !table.parentElement?.closest("table"));
  if (tables.length) {
    if (tables.length !== 1 || template.content.querySelector("svg,object,iframe")) throw new Error("Paste a single table without embedded objects.");
    const remainder = template.content.cloneNode(true) as DocumentFragment; remainder.querySelector("table")!.remove();
    if (remainder.textContent?.trim()) throw new Error("Copy only the table before pasting into cells.");
    return readTable(tables[0]!);
  }
  function readTable(table: HTMLTableElement): ClipboardCells {
    const cells: ClipboardCells["cells"][number][] = [], occupied: number[] = [];
    let columns = 0;
    for (const [rowIndex, row] of [...table.rows].entries()) {
      let column = 0;
      for (const cell of row.cells) {
        while ((occupied[column] ?? 0) > rowIndex) column++;
        const rowSpan = cell.rowSpan || table.rows.length - rowIndex, columnSpan = cell.colSpan;
        if (rowIndex + rowSpan > table.rows.length) throw new Error("The clipboard table has an incomplete merged cell.");
        for (let index = column; index < column + columnSpan; index++) {
          if ((occupied[index] ?? 0) > rowIndex) throw new Error("The clipboard table has overlapping merged cells.");
          occupied[index] = rowIndex + rowSpan;
        }
        const blocks: ClipboardCells["cells"][number]["blocks"][number][] = [], range = document.createRange(); range.setStart(cell, 0);
        const nested = [...cell.querySelectorAll("table")].filter(value => value.parentElement?.closest("table") === table);
        for (const next of [...nested, undefined]) {
          if (next) range.setEndBefore(next); else range.setEnd(cell, cell.childNodes.length);
          const wrapper = document.createElement("div"); wrapper.setAttribute("style", cell.getAttribute("style") ?? "");
          if (cell.localName === "th" && !wrapper.style.fontWeight) wrapper.style.fontWeight = "bold";
          wrapper.append(range.cloneContents());
          if (wrapper.childNodes.length) blocks.push(...readClipboard(wrapper.outerHTML, listState).paragraphs);
          if (next) { blocks.push(readTable(next)); range.setStartAfter(next); }
        }
        cells.push({ row: rowIndex, column, rowSpan, columnSpan, properties: clipboardCellProperties(cell), blocks: blocks.length ? blocks : [{ runs: [] }] });
        column += columnSpan; columns = Math.max(columns, column);
      }
    }
    if (!cells.length) throw new Error("The clipboard table is empty.");
    if (cells.reduce((area, cell) => area + cell.rowSpan * cell.columnSpan, 0) !== table.rows.length * columns) throw new Error("The clipboard table must form a complete rectangle.");
    const properties: ClipboardCells["properties"] = table.dataset.onodocsTable ? JSON.parse(table.dataset.onodocsTable) : undefined;
    return { rows: table.rows.length, columns, ...(properties ? { properties } : {}), cells };
  }
  if (html.trim() || !text.includes("\t")) return;
  const rows: string[][] = []; let row: string[] = [], value = "", quoted = false, closed = false;
  const source = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  for (let index = 0; index < source.length; index++) {
    const character = source[index]!;
    if (quoted) { if (character === '"') { if (source[index + 1] === '"') { value += '"'; index++; } else { quoted = false; closed = true; } } else value += character; }
    else if (character === "\t" || character === "\n") { row.push(value); value = ""; closed = false; if (character === "\n") { rows.push(row); row = []; } }
    else if (character === '"' && !value && !closed) quoted = true;
    else { if (closed) throw new Error("A quoted clipboard cell must end at a tab or line break."); value += character; }
  }
  if (quoted) throw new Error("The clipboard contains an unfinished quoted cell.");
  if (row.length || value || closed || !rows.length) { row.push(value); rows.push(row); }
  const columns = rows.reduce((count, row) => Math.max(count, row.length), 0);
  if (rows.some(row => row.length !== columns)) throw new Error("Paste tab-separated rows with the same number of columns.");
  return { rows: rows.length, columns, cells: rows.flatMap((row, rowIndex) => row.map((text, column) => ({ row: rowIndex, column, rowSpan: 1, columnSpan: 1, blocks: [{ runs: [{ text }] }] }))) };
}

export function writeClipboardCells(query: DocumentQuery<"document">, table: DocumentTable, range: Readonly<{ rowIndex: number; columnIndex: number; rowCount: number; columnCount: number }>, images: ReadonlyMap<string, string> = new Map(), charts: ReadonlyMap<string, string> = new Map()): { text: string; html: string } {
  const output = document.createElement("table"), text = Array.from({ length: range.rowCount }, () => Array<string>(range.columnCount).fill(""));
  const { styleId, look, columnWidths, ...tableProperties } = table.properties.effective;
  output.dataset.onodocsTable = JSON.stringify({ ...tableProperties, ...(columnWidths ? { columnWidths: columnWidths.slice(range.columnIndex, range.columnIndex + range.columnCount) } : {}) });
  output.style.borderCollapse = "collapse";
  const cellsByPosition = new Map(table.rows.flatMap((row, rowIndex) => row.cells.map(cell => [`${rowIndex}:${cell.columnIndex}`, cell] as const)));
  for (let rowIndex = range.rowIndex; rowIndex < range.rowIndex + range.rowCount; rowIndex++) {
    const row = output.insertRow();
    for (const cell of table.rows[rowIndex]!.cells) {
      if (cell.columnIndex < range.columnIndex || cell.columnIndex >= range.columnIndex + range.columnCount) continue;
      const merged = cell.mergedRange;
      if (merged && merged.rowIndex !== rowIndex) {
        if (cell.text.trim()) throw new Error("This merged cell contains hidden continuation text. Unmerge it before copying.");
        continue;
      }
      const parts: string[] = [], values: string[] = []; let paragraphs: DocumentParagraph[] = [];
      for (const block of [...cell.children, undefined]) {
        if (block?.kind === "paragraph") {
          if (query.within(block).descendants().all().some(item => item.kind !== "run" && item.kind !== "image" && !(item.kind === "drawing" && item.chart))) throw new Error("Cell copying supports text, links and nested tables. Select cells without controls, annotations or embedded objects.");
          paragraphs.push(block); continue;
        }
        if (paragraphs.length) {
          const written = writeClipboard(query, { start: paragraphs[0]!.selection.start, end: paragraphs.at(-1)!.selection.end }, paragraphs, images, charts);
          parts.push(written.html); values.push(written.text); paragraphs = [];
        }
        if (block?.kind === "table") {
          const written = writeClipboardCells(query, block, { rowIndex: 0, columnIndex: 0, rowCount: block.rows.length, columnCount: block.rows.reduce((count, row) => row.cells.reduce((count, cell) => Math.max(count, cell.columnIndex + cell.columnSpan), count), 0) }, images, charts);
          parts.push(written.html); values.push(written.text);
        } else if (block) throw new Error("Cell copying supports text, links and nested tables. Select cells without controls or embedded objects.");
      }
      const target = row.insertCell(); target.colSpan = cell.columnSpan; target.rowSpan = merged?.rowCount ?? 1;
      const { width, borders: directBorders, ...appearance } = cell.properties.effective;
      const endRow = rowIndex + target.rowSpan, sourceRow = table.rows[rowIndex]!, bottom = cellsByPosition.get(`${endRow - 1}:${cell.columnIndex}`)?.properties.effective.borders;
      const fallback = tableProperties.borders;
      const absent: TableBorder = { style: "nil" };
      const properties = { textDirection: "lrTb", verticalAlignment: "top", noWrap: false, shading: "auto", ...appearance, borders: {
        top: directBorders?.top ?? fallback?.[rowIndex === 0 ? "top" : "insideH"] ?? absent,
        bottom: bottom?.bottom ?? fallback?.[endRow === table.rows.length ? "bottom" : "insideH"] ?? absent,
        start: directBorders?.start ?? fallback?.[cell.columnIndex === sourceRow.cells[0]!.columnIndex ? "start" : "insideV"] ?? absent,
        end: directBorders?.end ?? fallback?.[cell.columnIndex + cell.columnSpan === sourceRow.cells.at(-1)!.columnIndex + sourceRow.cells.at(-1)!.columnSpan ? "end" : "insideV"] ?? absent,
      } };
      target.dataset.onodocsCell = JSON.stringify(properties); target.innerHTML = parts.join("");
      if (properties.shading !== "auto") target.style.backgroundColor = properties.shading;
      if (properties.verticalAlignment) target.style.verticalAlign = properties.verticalAlignment === "center" ? "middle" : properties.verticalAlignment;
      if (properties.noWrap) target.style.whiteSpace = "nowrap";
      for (const [logical, physical] of [["top", "top"], ["start", "left"], ["bottom", "bottom"], ["end", "right"]] as const) {
        const margin = properties.margins?.[logical]; if (margin !== undefined) target.style.setProperty(`padding-${physical}`, `${margin}pt`);
        const border = properties.borders?.[logical]; if (border) target.style.setProperty(`border-${physical}`, ["nil", "none"].includes(border.style) ? "none" : `${border.width ?? 0.5}pt ${border.style === "single" ? "solid" : ["double", "dashed", "dotted"].includes(border.style) ? border.style : "solid"} ${border.color ?? "#000000"}`);
      }
      text[rowIndex - range.rowIndex]![cell.columnIndex - range.columnIndex] = values.join("\n");
    }
  }
  return { html: output.outerHTML, text: text.map(row => row.map(value => /["\t\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join("\t")).join("\n") };
}

function clipboardCellProperties(cell: HTMLTableCellElement): PropertyPatch<CellProperties> {
  if (cell.dataset.onodocsCell) {
    const value: unknown = JSON.parse(cell.dataset.onodocsCell);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The clipboard cell properties are invalid.");
    return value as PropertyPatch<CellProperties>;
  }
  const result: { -readonly [K in keyof CellProperties]?: CellProperties[K] } = {}, style = cell.style;
  const points = (value: string) => { const number = Number.parseFloat(value); return Number.isFinite(number) ? value.endsWith("pt") ? number : value.endsWith("px") ? number * 0.75 : undefined : undefined; };
  const color = (value: string) => { const context = document.createElement("canvas").getContext("2d")!; context.fillStyle = "transparent"; context.fillStyle = value; return /^#[0-9a-f]{6}$/i.test(context.fillStyle) ? context.fillStyle : undefined; };
  const fill = color(style.backgroundColor || cell.getAttribute("bgcolor") || ""); if (fill) result.shading = fill;
  const vertical = style.verticalAlign || cell.getAttribute("valign"); if (vertical === "top" || vertical === "middle" || vertical === "bottom") result.verticalAlignment = vertical === "middle" ? "center" : vertical;
  if (style.whiteSpace === "nowrap" || cell.hasAttribute("nowrap")) result.noWrap = true;
  const margins: Record<string, number> = {}, borders: Record<string, NonNullable<CellProperties["borders"]>["top"]> = {};
  for (const [logical, physical] of [["top", "top"], ["start", "left"], ["bottom", "bottom"], ["end", "right"]]) {
    const padding = points(style.getPropertyValue(`padding-${physical}`)); if (padding !== undefined) margins[logical!] = padding;
    const borderStyle = style.getPropertyValue(`border-${physical}-style`), width = points(style.getPropertyValue(`border-${physical}-width`)), borderColor = color(style.getPropertyValue(`border-${physical}-color`));
    if (borderStyle === "none" || borderStyle === "hidden") borders[logical!] = { style: "nil" };
    else if (["solid", "double", "dashed", "dotted"].includes(borderStyle) && width !== undefined) borders[logical!] = { style: borderStyle === "solid" ? "single" : borderStyle as "double" | "dashed" | "dotted", width, ...(borderColor ? { color: borderColor } : {}) };
  }
  if (Object.keys(margins).length) result.margins = margins;
  if (Object.keys(borders).length) result.borders = borders;
  return result;
}
