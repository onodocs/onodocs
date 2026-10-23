export const shapeCatalog = [
  { preset: "rect", name: "Rectangle", path: '<rect x="3" y="5" width="18" height="14"/>' },
  { preset: "roundRect", name: "Rounded rectangle", path: '<rect x="3" y="5" width="18" height="14" rx="4"/>' },
  { preset: "ellipse", name: "Oval", path: '<ellipse cx="12" cy="12" rx="9" ry="7"/>' },
  { preset: "triangle", name: "Triangle", path: '<path d="M12 3 22 21H2z"/>' },
  { preset: "diamond", name: "Diamond", path: '<path d="m12 2 10 10-10 10L2 12z"/>' },
  { preset: "parallelogram", name: "Parallelogram", path: '<path d="M7 5h15l-5 14H2z"/>' },
  { preset: "hexagon", name: "Hexagon", path: '<path d="m7 3 10 0 5 9-5 9H7l-5-9z"/>' },
  { preset: "rightArrow", name: "Right arrow", path: '<path d="M2 8h11V3l9 9-9 9v-5H2z"/>' },
  { preset: "leftArrow", name: "Left arrow", path: '<path d="M22 8H11V3l-9 9 9 9v-5h11z"/>' },
  { preset: "upArrow", name: "Up arrow", path: '<path d="M8 22V11H3l9-9 9 9h-5v11z"/>' },
  { preset: "star5", name: "Star", path: '<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 22l1-7-5-5 7-1z"/>' },
  { preset: "heart", name: "Heart", path: '<path d="M12 21C-7 8 5-4 12 6 19-4 31 8 12 21z"/>' }
] as const;

export function shapeGallery(form: HTMLFormElement): void {
  const field = form.elements.namedItem("preset") as HTMLSelectElement, gallery = document.createElement("div");
  field.closest("label")!.hidden = true; gallery.className = "shape-gallery"; gallery.setAttribute("role", "group"); gallery.ariaLabel = "Shape gallery";
  for (const shape of shapeCatalog) {
    const button = document.createElement("button"); button.type = "button"; button.ariaLabel = shape.name; button.title = shape.name;
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="#dce7f7" stroke="#335b91" stroke-width="1.2" aria-hidden="true">${shape.path}</svg><span>${shape.name}</span>`;
    button.dataset.preset = shape.preset; button.setAttribute("aria-pressed", String(field.value === shape.preset));
    button.addEventListener("click", () => { field.value = shape.preset; for (const item of gallery.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button)); }); gallery.append(button);
  }
  gallery.addEventListener("keydown", event => { const buttons = [...gallery.querySelectorAll("button")], at = buttons.indexOf((form.getRootNode() as ShadowRoot).activeElement as HTMLButtonElement); if (at < 0 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[event.key]!; const next = buttons[(at + delta + buttons.length) % buttons.length]!; next.focus(); next.click(); });
  form.querySelector("h2")!.after(gallery);
}
