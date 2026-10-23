import { shapeCatalog } from "./editor-shapes.js";

export const insertIcons = [
  ...shapeCatalog.filter(shape => ["heart", "star5", "rightArrow", "leftArrow"].includes(shape.preset)).map(shape => ({ id: shape.preset, name: shape.name, category: "Symbols", path: shape.path })),
  { id: "check", name: "Check mark", category: "Symbols", path: '<path d="m4 12 5 5L20 5"/>' },
  { id: "warning", name: "Warning", category: "Symbols", path: '<path d="M12 2 23 21H1zM12 8v6M12 17v1"/>' },
  { id: "info", name: "Information", category: "Symbols", path: '<circle cx="12" cy="12" r="10"/><path d="M12 11v7M12 6v1"/>' },
  { id: "clock", name: "Clock", category: "Symbols", path: '<circle cx="12" cy="12" r="10"/><path d="M12 5v7l5 3"/>' },
  { id: "mail", name: "Envelope", category: "Communication", path: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>' },
  { id: "phone", name: "Phone", category: "Communication", path: '<path d="m6 2 4 5-3 3c2 4 3 5 7 7l3-3 5 4-2 4C10 22 2 14 2 4z"/>' },
  { id: "chat", name: "Chat", category: "Communication", path: '<path d="M3 3h18v14H9l-6 5zM7 7h10M7 12h7"/>' },
  { id: "globe", name: "Globe", category: "Communication", path: '<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>' },
  { id: "person", name: "Person", category: "People", path: '<circle cx="12" cy="6" r="4"/><path d="M3 22v-4a9 7 0 0 1 18 0v4"/>' },
  { id: "people", name: "Team", category: "People", path: '<circle cx="9" cy="6" r="4"/><path d="M1 22v-4a8 7 0 0 1 16 0v4M17 2a4 4 0 0 1 0 8M19 12a6 6 0 0 1 4 6v4"/>' },
  { id: "home", name: "Home", category: "Places", path: '<path d="m1 11 11-9 11 9M4 9v13h16V9M9 22v-8h6v8"/>' },
  { id: "pin", name: "Location", category: "Places", path: '<path d="M12 22S3 13 3 10a9 9 0 0 1 18 0c0 3-9 12-9 12z"/><circle cx="12" cy="9" r="3"/>' },
  { id: "briefcase", name: "Briefcase", category: "Business", path: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="M8 7V2h8v5M2 13h20M10 13v3h4v-3"/>' },
  { id: "calendar", name: "Calendar", category: "Business", path: '<rect x="2" y="4" width="20" height="18" rx="2"/><path d="M7 1v6M17 1v6M2 10h20M6 14h3M12 14h3M6 18h3M12 18h3"/>' },
  { id: "document", name: "Document", category: "Business", path: '<path d="M4 2h11l5 5v15H4zM15 2v5h5M8 11h8M8 15h8M8 19h5"/>' },
  { id: "chart", name: "Bar chart", category: "Business", path: '<path d="M2 2v20h20M6 18v-6h3v6M12 18V7h3v11M18 18V3h3v15"/>' },
  { id: "lightbulb", name: "Idea", category: "Business", path: '<path d="M8 18v-3a8 8 0 1 1 8 0v3zM8 21h8M10 24h4"/>' },
  { id: "lock", name: "Lock", category: "Technology", path: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V6a5 5 0 0 1 10 0v4M12 15v3"/>' },
  { id: "computer", name: "Computer", category: "Technology", path: '<rect x="2" y="2" width="20" height="15" rx="1"/><path d="M12 17v5M7 22h10"/>' },
  { id: "cloud", name: "Cloud", category: "Technology", path: '<path d="M6 20a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12z"/>' }
] as const;

export function insertIconGallery(form: HTMLFormElement): void {
  const selected = form.elements.namedItem("icon") as HTMLSelectElement, search = form.elements.namedItem("search") as HTMLInputElement, category = form.elements.namedItem("category") as HTMLSelectElement, color = form.elements.namedItem("color") as HTMLInputElement, description = form.elements.namedItem("description") as HTMLInputElement;
  selected.closest("label")!.hidden = true;
  const gallery = document.createElement("div"), status = document.createElement("p"); gallery.className = "insert-icon-gallery"; gallery.setAttribute("role", "group"); gallery.ariaLabel = "Icon gallery"; status.className = "design-help"; status.setAttribute("role", "status");
  function render(): void {
    gallery.replaceChildren();
    const matches = insertIcons.filter(icon => (category.value === "all" || icon.category === category.value) && icon.name.toLowerCase().includes(search.value.trim().toLowerCase()));
    for (const icon of matches) {
      const button = document.createElement("button"); button.type = "button"; button.ariaLabel = icon.name; button.setAttribute("aria-pressed", String(selected.value === icon.id));
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon.path}</svg><span>${icon.name}</span>`;
      button.addEventListener("click", () => { const previous = insertIcons.find(icon => icon.id === selected.value); if (!description.value || description.value === previous?.name) description.value = icon.name; selected.value = icon.id; status.textContent = `${matches.length} ${matches.length === 1 ? "icon" : "icons"}. Selected: ${icon.name}.`; for (const item of gallery.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button)); });
      gallery.append(button);
    }
    const icon = insertIcons.find(icon => icon.id === selected.value)!;
    status.textContent = `${matches.length ? `${matches.length} ${matches.length === 1 ? "icon" : "icons"}` : "No matching icons"}. Selected: ${icon.name}.`;
  }
  gallery.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; const buttons = [...gallery.querySelectorAll("button")], at = buttons.indexOf((form.getRootNode() as ShadowRoot).activeElement as HTMLButtonElement); if (at < 0) return; event.preventDefault(); const columns = Math.max(1, Math.round(gallery.clientWidth / buttons[0]!.getBoundingClientRect().width)); const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key]!; const next = buttons[(at + delta + buttons.length) % buttons.length]!; next.focus(); next.click(); });
  search.addEventListener("input", render); category.addEventListener("change", render); color.addEventListener("input", () => { gallery.style.color = color.value; }); gallery.style.color = color.value;
  category.closest("label")!.after(gallery, status); render();
}

export async function insertIconBytes(id: string, color: string, size: number): Promise<Uint8Array> {
  const icon = insertIcons.find(icon => icon.id === id);
  if (!icon || !/^#[0-9a-f]{6}$/i.test(color) || !Number.isFinite(size) || size <= 0) throw new TypeError("Choose an icon, color and positive size.");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(size * 4)}" height="${Math.ceil(size * 4)}" viewBox="-1 -1 26 26" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon.path}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), image = new Image();
  try {
    image.src = url; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d"); if (!context) throw new Error("The browser could not prepare the icon."); context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("The browser could not prepare the icon.")), "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}
