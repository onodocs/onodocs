import type { DocumentEdit } from "@onodocs/sdk";

type Diagram = Omit<Extract<DocumentEdit, { kind: "shapeGroup" }>, "before" | "after" | "kind">;
export function diagramContent(layout: string, text: string, width: number, color: string): Diagram {
  const labels = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (!["process", "cycle", "hierarchy"].includes(layout)) throw new RangeError("Choose a diagram layout.");
  if (labels.length < (layout === "cycle" ? 3 : 2)) throw new RangeError(layout === "cycle" ? "A cycle needs at least three items." : "Add at least two diagram items.");
  if (!Number.isFinite(width) || width < 144) throw new RangeError("Choose a diagram width of at least 144 points.");
  const shapes: Diagram["shapes"][number][] = [], nodes: { x: number; y: number; width: number; height: number; text: string }[] = [];
  const shape = (preset: Diagram["shapes"][number]["preset"], x: number, y: number, width: number, height: number, rotation = 0) => shapes.push({ preset, x, y, width, height, rotation, fill: color, stroke: null, effectStyle: 0 });
  let height: number;
  if (layout === "process") {
    const nodeWidth = width, x = 0; height = labels.length * 76 - 20;
    labels.forEach((text, index) => { const y = index * 76; nodes.push({ x, y, width: nodeWidth, height: 56, text }); if (index) shape("downArrow", width / 2 - 7, y - 18, 14, 16); });
  } else if (layout === "hierarchy") {
    height = 176; const gap = Math.min(12, width / (labels.length * 4)), boxWidth = (width - gap * (labels.length - 2)) / (labels.length - 1), childWidth = boxWidth + gap, rootWidth = Math.min(180, width * 0.7);
    nodes.push({ x: (width - rootWidth) / 2, y: 0, width: rootWidth, height: 56, text: labels[0]! });
    shape("rect", width / 2 - 0.75, 56, 1.5, 32);
    if (labels.length > 2) shape("rect", boxWidth / 2, 87, width - boxWidth, 1.5);
    labels.slice(1).forEach((text, index) => { const center = childWidth * index + boxWidth / 2; shape("rect", center - 0.75, 88, 1.5, 32); nodes.push({ x: center - boxWidth / 2, y: 120, width: boxWidth, height: 56, text }); });
  } else {
    height = width; const nodeWidth = Math.min(108, width * 0.3), nodeHeight = Math.min(56, width * 0.16);
    const points = labels.map((text, index) => { const angle = -Math.PI / 2 + index * 2 * Math.PI / labels.length; return { text, x: Math.cos(angle), y: Math.sin(angle) }; });
    const bounds = points.reduce((box, point) => ({ left: Math.min(box.left, point.x), right: Math.max(box.right, point.x), top: Math.min(box.top, point.y), bottom: Math.max(box.bottom, point.y) }), { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
    for (const point of points) nodes.push({ x: (point.x - bounds.left) / (bounds.right - bounds.left) * (width - nodeWidth), y: (point.y - bounds.top) / (bounds.bottom - bounds.top) * (height - nodeHeight), width: nodeWidth, height: nodeHeight, text: point.text });
    nodes.forEach((node, index) => { const next = nodes[(index + 1) % nodes.length]!, x1 = node.x + node.width / 2, y1 = node.y + node.height / 2, x2 = next.x + next.width / 2, y2 = next.y + next.height / 2, length = Math.hypot(x2 - x1, y2 - y1) * 0.3; shape("rightArrow", (x1 + x2 - length) / 2, (y1 + y2) / 2 - 6, length, 12, Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI); });
  }
  for (const node of nodes) shapes.push({ ...node, preset: "roundRect", fill: color, stroke: null, effectStyle: 0, textAlignment: "center", textFormatting: { color: "#FFFFFF", fontSize: 12 }, textBox: { margins: { left: 6, right: 6, top: 4, bottom: 4 }, verticalAlignment: "center", wrap: true } });
  return { width, height, description: `${layout}: ${labels.join("; ")}`, layout: { wrap: "inline" }, shapes };
}

export function diagramGallery(form: HTMLFormElement): void {
  const layout = form.elements.namedItem("layout") as HTMLSelectElement, gallery = document.createElement("div"); gallery.className = "shape-gallery"; gallery.setAttribute("role", "group"); gallery.setAttribute("aria-label", "Diagram layouts"); layout.closest("label")!.hidden = true;
  for (const [value, label, path] of [["process", "Process", '<rect x="5" y="2" width="14" height="6" rx="1"/><path d="M12 8v8m-3-3 3 3 3-3"/><rect x="5" y="16" width="14" height="6" rx="1"/>'], ["cycle", "Cycle", '<rect x="8" y="2" width="8" height="5" rx="1"/><rect x="1" y="16" width="8" height="5" rx="1"/><rect x="15" y="16" width="8" height="5" rx="1"/><path d="m17 8 4 6m-1-5 1 5-4-1M15 20H9m2-2-2 2 2 2M3 14l4-6m-4 2 4-2v4"/>'], ["hierarchy", "Hierarchy", '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="1" y="16" width="8" height="6" rx="1"/><rect x="15" y="16" width="8" height="6" rx="1"/><path d="M12 8v4H5v4m7-4h7v4"/>']]) {
    const button = document.createElement("button"); button.type = "button"; button.setAttribute("aria-label", `${label} diagram`); button.setAttribute("aria-pressed", String(layout.value === value)); button.innerHTML = `<svg viewBox="0 0 24 24" fill="#dce7f7" stroke="#335b91" stroke-width="1.2" aria-hidden="true">${path}</svg><span>${label}</span>`;
    button.addEventListener("click", () => { layout.value = value!; for (const item of gallery.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button)); }); gallery.append(button);
  }
  gallery.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; const buttons = [...gallery.querySelectorAll("button")], index = buttons.indexOf((form.getRootNode() as ShadowRoot).activeElement as HTMLButtonElement); if (index < 0) return; event.preventDefault(); const next = buttons[(index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length]!; next.focus(); next.click(); });
  const input = form.elements.namedItem("items") as HTMLInputElement, text = document.createElement("textarea"); text.name = input.name; text.value = "Plan\nBuild\nReview"; text.rows = 5; text.className = "shape-text"; input.replaceWith(text);
  const note = document.createElement("p"); note.textContent = "One item per line. The first item is the parent in a hierarchy. Saves as grouped Word shapes; use Ungroup to edit individual items."; form.querySelector("h2")!.after(gallery, note);
}
