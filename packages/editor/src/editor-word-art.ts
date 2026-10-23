import type { TextFormatting } from "@onodocs/sdk";
import { textEffects } from "./editor-text-effects.js";

export const wordArtStyles: readonly { value: string; label: string; color: string; effect: NonNullable<TextFormatting["textEffect"]>; bold: boolean }[] = [
  { value: "blue-shadow", label: "Blue shadow", color: "#365F91", effect: "shadow", bold: true },
  { value: "orange", label: "Orange fill", color: "#C55A11", effect: "none", bold: true },
  { value: "outline", label: "Black outline", color: "#242424", effect: "outline", bold: true },
  { value: "green-shadow", label: "Green shadow", color: "#548235", effect: "shadow", bold: true },
  { value: "outline-shadow", label: "Outline and shadow", color: "#365F91", effect: "outlineShadow", bold: true },
  { value: "emboss", label: "Embossed gold", color: "#BF9000", effect: "emboss", bold: true },
  { value: "imprint", label: "Engraved gray", color: "#595959", effect: "imprint", bold: true },
  { value: "plain", label: "Plain black", color: "#242424", effect: "none", bold: false }
];

export function wordArtGallery(form: HTMLFormElement): void {
  form.classList.add("word-art-form");
  const style = document.createElement("style"), gallery = document.createElement("div"), preview = document.createElement("div"), select = form.elements.namedItem("preset") as HTMLSelectElement;
  style.textContent = `dialog:has(.word-art-form){width:680px}.word-art-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;grid-column:1/-1}.word-art-gallery button{height:86px;flex-direction:column;white-space:normal;border:1px solid #d7dce2;gap:6px;padding:6px;font-size:11px}.word-art-gallery strong{font:700 32px Georgia}.word-art-gallery button[aria-checked=true]{outline:2px solid var(--onodocs-accent,#b43829);background:#faeee9}.word-art-preview{grid-column:1/-1;min-height:64px;max-height:160px;overflow:auto;padding:12px;text-align:center;background:#f4f6f8;border:1px solid #dce1e6;white-space:pre-wrap;overflow-wrap:anywhere}.word-art-form .word-art-text{grid-column:1/-1}.word-art-form textarea.shape-text{height:68px;min-height:68px;resize:vertical;font:inherit}.word-art-form .dialog-actions{position:sticky;bottom:-24px;background:white;padding:10px 0}.word-art-form [hidden]{display:none!important}:host([data-compact]) .word-art-gallery{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}:host([data-compact]) .word-art-gallery strong{font-size:28px}:host([data-compact]) .word-art-gallery button{font-size:10px;height:82px}:host([data-compact]) .word-art-form .dialog-actions{bottom:-16px}`;
  select.closest("label")!.hidden = true; gallery.className = "word-art-gallery"; gallery.setAttribute("role", "radiogroup"); gallery.setAttribute("aria-label", "WordArt styles"); preview.className = "word-art-preview"; preview.setAttribute("aria-label", "WordArt preview");
  function appearance(element: HTMLElement, effect: string, color: string): void { element.style.cssText = `color:${color};${(textEffects.find(item => item.value === effect)?.appearance ?? "").replaceAll("#365f91", color).replaceAll("color:#777", `color:${color}`)}`; }
  function field(name: string): HTMLInputElement | HTMLSelectElement { return form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement; }
  function refresh(): void {
    for (const button of gallery.querySelectorAll<HTMLButtonElement>("button")) { const active = button.dataset.preset === select.value; button.setAttribute("aria-checked", String(active)); button.tabIndex = active || select.value === "custom" && button === gallery.firstElementChild ? 0 : -1; }
    appearance(preview, field("effect").value, field("color").value); preview.style.fontFamily = field("font").value; preview.style.fontSize = `${Math.max(1, Math.min(72, Number(field("size").value) || 36))}pt`; preview.style.fontWeight = (field("bold") as HTMLInputElement).checked ? "700" : "400"; preview.textContent = form.elements.namedItem("text") ? (form.elements.namedItem("text") as HTMLTextAreaElement).value || "Your text here" : "Your text here";
  }
  for (const preset of wordArtStyles) {
    const button = document.createElement("button"), sample = document.createElement("strong"), label = document.createElement("span"); button.type = "button"; button.dataset.preset = preset.value; button.setAttribute("role", "radio"); button.setAttribute("aria-label", preset.label); sample.textContent = "Abc"; sample.setAttribute("aria-hidden", "true"); appearance(sample, preset.effect, preset.color); sample.style.fontWeight = preset.bold ? "700" : "400"; label.textContent = preset.label; button.append(sample, label);
    button.addEventListener("click", () => { select.value = preset.value; field("color").value = preset.color; field("effect").value = preset.effect; (field("bold") as HTMLInputElement).checked = preset.bold; refresh(); }); gallery.append(button);
  }
  gallery.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return; event.preventDefault(); const buttons = [...gallery.querySelectorAll<HTMLButtonElement>("button")], index = buttons.indexOf((form.getRootNode() as ShadowRoot).activeElement as HTMLButtonElement), delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -4 : 4; const target = buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length]!; target.click(); target.focus(); });
  const input = form.elements.namedItem("text") as HTMLInputElement | null;
  if (input) { const textarea = document.createElement("textarea"); textarea.name = "text"; textarea.className = "shape-text"; textarea.value = input.value; input.closest("label")!.classList.add("word-art-text"); input.replaceWith(textarea); }
  form.addEventListener("input", event => { if ((event.target as HTMLInputElement).name !== "text") select.value = "custom"; refresh(); });
  form.addEventListener("change", event => { if (["effect", "color", "bold"].includes((event.target as HTMLInputElement).name)) select.value = "custom"; refresh(); });
  form.querySelector("h2")!.after(gallery); form.append(preview); form.prepend(style); refresh();
}
