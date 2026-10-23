import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentTable } from "@onodocs/sdk";
import type { DocumentAttachment, DocumentView } from "@onodocs/canvas";

export function tableDrawing(document: BrowserDocument, view: DocumentView, table: DocumentTable, commit: (command: DocumentEdit, label: string) => void, report: (message: string) => void): DocumentAttachment[] {
  const attachments: DocumentAttachment[] = [], rtl = table.properties.authored.rightToLeft;
  const heights = table.rows.map(row => { const fragments = document.geometry.fragments(row); return row.properties.authored.header ? (fragments[0]?.rectangle.height ?? 0) / 20 : fragments.reduce((sum, fragment) => sum + fragment.rectangle.height / 20, 0); });
  for (const [rowIndex, row] of table.rows.entries()) for (const cell of row.cells) {
    const range = cell.mergedRange ?? { rowIndex, columnIndex: cell.columnIndex, rowCount: 1, columnCount: cell.columnSpan };
    if (range.rowIndex !== rowIndex || range.columnIndex !== cell.columnIndex) continue;
    const fragments = document.geometry.fragments(cell), totalHeight = fragments.reduce((sum, fragment) => sum + fragment.rectangle.height, 0);
    let fragmentOffset = 0;
    for (const fragment of fragments) {
      const offset = fragmentOffset; fragmentOffset += fragment.rectangle.height;
      const label = `Draw divider, row ${rowIndex + 1}, column ${cell.columnIndex + 1}`, node = globalThis.document.createElement("button"), line = globalThis.document.createElement("span");
      node.type = "button"; node.className = "table-drawing-cell"; node.ariaLabel = label; node.title = "Drag a divider across this cell. Arrow keys position a divider; Enter draws it. Escape finishes."; node.append(line);
      let axis: "x" | "y" = "x", position = .5, drag: { id: number; x: number; y: number; moved: boolean } | undefined;
      const show = () => { line.hidden = false; line.style.cssText = axis === "x" ? `left:${position * 100}%;top:0;width:0;height:100%;border-left:2px dashed #2675b8` : `left:0;top:${position * 100}%;width:100%;height:0;border-top:2px dashed #2675b8`; };
      const reset = () => { const previous = drag; drag = undefined; if (previous && node.hasPointerCapture(previous.id)) node.releasePointerCapture(previous.id); line.hidden = true; };
      const apply = () => {
        if (position <= 0 || position >= 1) return;
        const rowHeights = heights.slice(range.rowIndex, range.rowIndex + range.rowCount);
        commit({ kind: "table", action: "splitCells", tableId: table.id, ...range, columns: axis === "x" ? 2 : 1, rows: axis === "y" ? 2 : 1, ...(axis === "x" ? { columnPositions: [rtl ? 1 - position : position] } : { rowPositions: [row.properties.authored.header ? position : (offset + fragment.rectangle.height * position) / totalHeight], rowHeights }) }, label);
      };
      node.addEventListener("focus", show);
      node.addEventListener("blur", () => { if (!drag) line.hidden = true; });
      node.addEventListener("pointerdown", event => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); node.focus({ preventScroll: true }); drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; node.setPointerCapture(event.pointerId); });
      node.addEventListener("pointermove", event => {
        if (!drag) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y, bounds = node.getBoundingClientRect();
        drag.moved ||= Math.hypot(dx, dy) >= 4; axis = Math.abs(dx) > Math.abs(dy) ? "y" : "x";
        position = axis === "x" ? ((event.clientX + drag.x) / 2 - bounds.left) / bounds.width : ((event.clientY + drag.y) / 2 - bounds.top) / bounds.height;
        position = Math.max(0, Math.min(1, position)); show();
      });
      node.addEventListener("pointerup", event => { event.preventDefault(); event.stopPropagation(); const moved = drag?.moved; reset(); if (moved) apply(); });
      node.addEventListener("pointercancel", reset); node.addEventListener("lostpointercapture", () => { if (drag) reset(); });
      node.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); });
      node.addEventListener("keydown", event => {
        if (event.key === "Escape" && drag) { event.preventDefault(); event.stopPropagation(); reset(); return; }
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); apply(); return; }
        const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : 0;
        if (!direction) return;
        event.preventDefault(); event.stopPropagation(); axis = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "x" : "y"; position = Math.max(.01, Math.min(.99, position + direction * (event.shiftKey ? .1 : .01))); show(); report(`${axis === "x" ? "Vertical" : "Horizontal"} divider at ${Math.round(position * 100)}%. Enter draws it.`);
      });
      attachments.push(view.attach(node, { anchor: fragment, size: { width: fragment.rectangle.width, height: fragment.rectangle.height }, interactive: true }));
    }
  }
  return attachments;
}

export function tableSizeSketch(form: HTMLFormElement): void {
  const width = form.elements.namedItem("width") as HTMLInputElement, height = form.elements.namedItem("height") as HTMLInputElement;
  const pad = globalThis.document.createElement("div"), rectangle = globalThis.document.createElement("div"), help = globalThis.document.createElement("p");
  pad.className = "table-size-sketch"; pad.ariaLabel = "Draw table size"; pad.setAttribute("role", "img"); pad.append(rectangle);
  help.className = "design-help"; help.style.gridColumn = "1/-1"; help.textContent = "Drag a rectangle to set the table size, or enter dimensions. The table is inserted after the cursor; then draw dividers directly in its cells.";
  const maximumWidth = Number(width.max) || 432, maximumHeight = Math.max(216, Number(height.value));
  const update = () => { rectangle.style.width = `${Math.min(100, Number(width.value) / maximumWidth * 100)}%`; rectangle.style.height = `${Math.min(100, Number(height.value) / maximumHeight * 100)}%`; };
  let start: { id: number; x: number; y: number } | undefined;
  pad.addEventListener("pointerdown", event => { if (event.button !== 0) return; event.preventDefault(); start = { id: event.pointerId, x: event.clientX, y: event.clientY }; pad.setPointerCapture(event.pointerId); });
  pad.addEventListener("pointermove", event => { if (!start) return; const bounds = pad.getBoundingClientRect(); width.value = String(Math.round(Math.max(1, Math.min(maximumWidth, Math.abs(event.clientX - start.x) / bounds.width * maximumWidth)) * 20) / 20); height.value = String(Math.round(Math.max(1, Math.min(maximumHeight, Math.abs(event.clientY - start.y) / bounds.height * maximumHeight)) * 20) / 20); update(); });
  const end = () => { if (start && pad.hasPointerCapture(start.id)) pad.releasePointerCapture(start.id); start = undefined; };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end); width.addEventListener("input", update); height.addEventListener("input", update);
  form.querySelector("h2")!.after(help, pad); update();
}
