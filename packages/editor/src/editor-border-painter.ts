import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentTable, TableBorder } from "@onodocs/sdk";
import type { DocumentAttachment, DocumentView } from "@onodocs/canvas";

export function tableBorderPainter(document: BrowserDocument, view: DocumentView, table: DocumentTable, pen: () => TableBorder, paint: (command: DocumentEdit, label: string) => void, mode: "paint" | "erase" = "paint"): DocumentAttachment[] {
  const ranges = new Map(table.rows.flatMap((row, rowIndex) => row.cells.map(cell => [cell.id, cell.mergedRange ?? { rowIndex, columnIndex: cell.columnIndex, rowCount: 1, columnCount: cell.columnSpan }] as const)));
  const edges: { id: string; side: "top" | "bottom" | "start" | "end"; page: number; axis: "x" | "y"; position: number; from: number; to: number; fragment: ReturnType<BrowserDocument["geometry"]["fragments"]>[number]; label: string }[] = [];
  const rtl = table.properties.authored.rightToLeft;
  for (const [rowIndex, row] of table.rows.entries()) for (const cell of row.cells) {
    const fragments = document.geometry.fragments(cell);
    for (const [index, fragment] of fragments.entries()) {
      const r = fragment.rectangle, label = `row ${rowIndex + 1}, column ${cell.columnIndex + 1}`;
      if (index === 0 || row.properties.authored.header) edges.push({ id: cell.id, side: "top", page: fragment.pageIndex, axis: "y", position: r.y, from: r.x, to: r.x + r.width, fragment, label: `Paint top border, ${label}` });
      if (index === fragments.length - 1 || row.properties.authored.header) edges.push({ id: cell.id, side: "bottom", page: fragment.pageIndex, axis: "y", position: r.y + r.height, from: r.x, to: r.x + r.width, fragment, label: `Paint bottom border, ${label}` });
      edges.push({ id: cell.id, side: rtl ? "end" : "start", page: fragment.pageIndex, axis: "x", position: r.x, from: r.y, to: r.y + r.height, fragment, label: `Paint left border, ${label}` });
      edges.push({ id: cell.id, side: rtl ? "start" : "end", page: fragment.pageIndex, axis: "x", position: r.x + r.width, from: r.y, to: r.y + r.height, fragment, label: `Paint right border, ${label}` });
    }
  }
  const lines = new Map<string, typeof edges>();
  for (const edge of edges) { const key = `${edge.page}:${edge.axis}:${edge.position}`, line = lines.get(key) ?? []; line.push(edge); lines.set(key, line); }
  const segments: { edge: typeof edges[number]; neighbors: typeof edges }[] = [];
  for (const line of lines.values()) {
    line.sort((a, b) => a.from - b.from || b.to - a.to);
    let current: typeof segments[number] | undefined;
    for (const edge of line) {
      if (!current || edge.from >= current.edge.to) { current = { edge: { ...edge }, neighbors: [] }; segments.push(current); }
      current.neighbors.push(edge); current.edge.to = Math.max(current.edge.to, edge.to);
    }
  }
  const attachments: DocumentAttachment[] = [];
  for (const { edge, neighbors } of segments) {
    const label = mode === "erase" ? edge.label.replace("Paint", "Erase") : edge.label;
    const adjacent = [...new Map(neighbors.map(neighbor => { const range = ranges.get(neighbor.id)!; return [`${range.rowIndex}:${range.columnIndex}`, range] as const; })).values()];
    const rowIndex = Math.min(...adjacent.map(range => range.rowIndex)), columnIndex = Math.min(...adjacent.map(range => range.columnIndex));
    const rowCount = Math.max(...adjacent.map(range => range.rowIndex + range.rowCount)) - rowIndex, columnCount = Math.max(...adjacent.map(range => range.columnIndex + range.columnCount)) - columnIndex;
    const rectangular = adjacent.reduce((area, range) => area + range.rowCount * range.columnCount, 0) === rowCount * columnCount;
    const button = globalThis.document.createElement("button"); button.type = "button"; button.className = "border-painter-edge"; button.ariaLabel = label; button.title = label; button.dataset.axis = edge.axis;
    if (mode === "erase" && !rectangular) { button.disabled = true; button.title = "Select a complete rectangular cell range to merge these cells."; }
    button.addEventListener("pointerdown", event => { event.preventDefault(); event.stopPropagation(); button.focus({ preventScroll: true }); });
    button.addEventListener("click", event => {
      event.stopPropagation();
      if (mode === "erase" && adjacent.length > 1) { paint({ kind: "table", tableId: table.id, action: "mergeCells", rowIndex, columnIndex, rowCount, columnCount }, label); return; }
      const border = mode === "erase" ? { style: "nil" } : pen(), commands = new Map<string, Partial<Record<typeof edge.side, TableBorder>>>();
      for (const neighbor of neighbors) {
        const sides = commands.get(neighbor.id) ?? {}; sides[neighbor.side] = border; commands.set(neighbor.id, sides);
      }
      paint({ kind: "batch", commands: [...commands].map(([targetId, borders]) => ({ kind: "properties", targetId, cell: { borders } })) }, label);
    });
    const r = edge.fragment.rectangle, horizontal = edge.axis === "y", thickness = 140;
    attachments.push(view.attach(button, { anchor: edge.fragment, offset: { x: horizontal ? edge.from - r.x : edge.position - r.x - thickness / 2, y: horizontal ? edge.position - r.y - thickness / 2 : edge.from - r.y }, size: { width: horizontal ? edge.to - edge.from : thickness, height: horizontal ? thickness : edge.to - edge.from }, interactive: true }));
  }
  return attachments;
}
