import type { TextFormatting } from "@onodocs/sdk";

export const textEffects: readonly { value: NonNullable<TextFormatting["textEffect"]>; label: string; appearance: string }[] = [
  { value: "none", label: "No effect", appearance: "" },
  { value: "outline", label: "Outline", appearance: "color:white;-webkit-text-stroke:1px #365f91" },
  { value: "shadow", label: "Shadow", appearance: "text-shadow:2px 2px 1px #777" },
  { value: "outlineShadow", label: "Outline and shadow", appearance: "color:white;-webkit-text-stroke:1px #365f91;text-shadow:3px 3px #888" },
  { value: "emboss", label: "Emboss", appearance: "color:#777;text-shadow:1px 1px white,-1px -1px #333" },
  { value: "imprint", label: "Engrave", appearance: "color:#777;text-shadow:-1px -1px white,1px 1px #333" }
];

export function textEffectsGallery(form: HTMLFormElement): void {
  const select = form.querySelector<HTMLSelectElement>("[name=effect]")!, gallery = document.createElement("div"), style = document.createElement("style");
  form.classList.add("text-effects-form"); select.parentElement!.hidden = true; gallery.className = "text-effects-gallery"; gallery.setAttribute("role", "radiogroup"); gallery.setAttribute("aria-label", "Text effect");
  style.textContent = "dialog:has(.text-effects-form){width:520px}.text-effects-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.text-effects-gallery button{height:100px;min-width:0;border:1px solid #d7dce2;flex-direction:column;white-space:normal;font-size:12px}.text-effects-gallery strong{font:700 34px Georgia;color:#365f91}.text-effects-gallery button[aria-checked=true]{outline:2px solid var(--onodocs-accent,#b43829);background:#faeee9}";
  for (const effect of textEffects) {
    const button = document.createElement("button"), sample = document.createElement("strong"), label = document.createElement("span"); button.type = "button"; button.setAttribute("role", "radio"); button.setAttribute("aria-label", effect.label); button.setAttribute("aria-checked", String(select.value === effect.value)); sample.textContent = "Aa"; sample.setAttribute("aria-hidden", "true"); sample.style.cssText = effect.appearance; label.textContent = effect.label;
    button.addEventListener("click", () => { select.value = effect.value; for (const item of gallery.children) item.setAttribute("aria-checked", String(item === button)); });
    button.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return; event.preventDefault(); const buttons = [...gallery.querySelectorAll("button")], index = buttons.indexOf(button), offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -3 : 3, target = buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + offset + buttons.length) % buttons.length]!; target.click(); target.focus(); });
    button.append(sample, label); gallery.append(button);
  }
  select.parentElement!.after(gallery); form.prepend(style);
}
