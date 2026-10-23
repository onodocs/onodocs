import type { DrawingShadow } from "@onodocs/sdk";

export const shadowPresets: readonly { value: string; label: string; shadow: DrawingShadow | null }[] = [
  { value: "none", label: "No shadow", shadow: null },
  { value: "subtle", label: "Subtle", shadow: { color: "#000000", opacity: .2, blur: 3, distance: 2, angle: 45 } },
  { value: "soft", label: "Soft", shadow: { color: "#000000", opacity: .3, blur: 6, distance: 4, angle: 45 } },
  { value: "offset", label: "Offset", shadow: { color: "#000000", opacity: .4, blur: 0, distance: 4, angle: 45 } },
  { value: "left", label: "Offset left", shadow: { color: "#000000", opacity: .3, blur: 3, distance: 4, angle: 135 } },
  { value: "center", label: "Centered", shadow: { color: "#000000", opacity: .35, blur: 8, distance: 0, angle: 0 } }
];
export const themeEffectSets = [
  { value: "none", label: "No effects", effects: [null, null, null] },
  { value: "subtle", label: "Subtle", effects: [shadowPresets[1]!.shadow, shadowPresets[1]!.shadow, shadowPresets[2]!.shadow] },
  { value: "soft", label: "Soft shadows", effects: [shadowPresets[1]!.shadow, shadowPresets[2]!.shadow, shadowPresets[5]!.shadow] },
  { value: "offset", label: "Offset shadows", effects: [shadowPresets[3]!.shadow, shadowPresets[4]!.shadow, shadowPresets[3]!.shadow] }
] as const;

function shadowAppearance(shadow: DrawingShadow | null | undefined): string {
  if (!shadow) return "none";
  const radians = shadow.angle * Math.PI / 180;
  return `${Math.cos(radians) * shadow.distance}px ${Math.sin(radians) * shadow.distance}px ${shadow.blur}px ${shadow.color}${Math.round(shadow.opacity * 255).toString(16).padStart(2, "0")}`;
}

export function drawingEffectsGallery(form: HTMLFormElement, theme: boolean, effects: readonly (DrawingShadow | null)[] = []): void {
  const select = form.elements.namedItem("effect") as HTMLSelectElement, gallery = document.createElement("div"), style = document.createElement("style");
  form.classList.add("drawing-effects-form"); select.closest("label")!.hidden = true; gallery.className = "drawing-effects-gallery"; gallery.setAttribute("role", "radiogroup"); gallery.ariaLabel = theme ? "Theme effects" : "Shadow presets";
  style.textContent = "dialog:has(.drawing-effects-form){width:580px;scroll-padding-bottom:85px}.drawing-effects-form input{scroll-margin-bottom:85px}.drawing-effects-form{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px}.drawing-effects-form>h2,.drawing-effects-form>.drawing-effects-gallery,.drawing-effects-form>.effect-preview,.drawing-effects-form>.dialog-actions,.drawing-effects-form>[role=alert]{grid-column:1/-1}.drawing-effects-form>label{margin:0;min-width:0}.drawing-effects-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.drawing-effects-gallery button{height:64px;min-width:0;padding:6px;flex-direction:column;gap:6px;border:1px solid #d7dce2;font-size:12px;white-space:normal}.drawing-effects-gallery button[aria-checked=true]{outline:2px solid var(--onodocs-accent,#b43829);background:#faeee9}.drawing-effects-gallery i,.effect-preview i{display:block;width:35px;height:25px;background:#4472c4;border:1px solid #2f528f}.drawing-effects-gallery .effect-samples{display:flex;gap:12px}.drawing-effects-gallery .effect-samples i{width:22px;height:22px}.effect-preview{display:flex;justify-content:center;align-items:center;height:65px;background:#f4f6f8;border:1px solid #e1e5ea}.effect-preview i{width:70px;height:40px}.drawing-effects-form [hidden]{display:none!important}.drawing-effects-form .dialog-actions{position:sticky;bottom:-24px;background:white;padding:12px 0 8px}@media(max-width:480px){.drawing-effects-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}";
  const choices = theme ? [{ value: "custom", label: "Current effects", effects }, ...themeEffectSets] : [...shadowPresets.map(preset => ({ ...preset, effects: [preset.shadow] })), { value: "custom", label: "Current / custom", effects: [] }, ...effects.map((shadow, index) => ({ value: `theme${index + 1}`, label: `Theme style ${index + 1}`, effects: [shadow] }))];
  const preview = document.createElement("div"), sample = document.createElement("i"); preview.className = "effect-preview"; preview.setAttribute("aria-hidden", "true"); preview.append(sample);
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const values = (): DrawingShadow => ({ color: field("color").value, opacity: Number(field("opacity").value) / 100, blur: Number(field("blur").value), distance: Number(field("distance").value), angle: Number(field("angle").value) });
  function update(): void {
    for (const button of gallery.querySelectorAll<HTMLButtonElement>("button")) { const selected = button.value === select.value; button.setAttribute("aria-checked", String(selected)); button.tabIndex = selected ? 0 : -1; }
    if (theme) return;
    const inherited = select.value.startsWith("theme"), enabled = select.value !== "none" && !inherited;
    for (const name of ["color", "opacity", "blur", "distance", "angle"]) field(name).disabled = !enabled;
    sample.style.boxShadow = shadowAppearance(select.value === "none" ? null : inherited ? effects[Number(select.value.slice(5)) - 1] : values());
    gallery.querySelector<HTMLElement>('button[value="custom"] i')!.style.boxShadow = shadowAppearance(values());
  }
  for (const choice of choices) {
    const button = document.createElement("button"), samples = document.createElement("span"), label = document.createElement("span"); button.type = "button"; button.value = choice.value; button.setAttribute("role", "radio"); button.ariaLabel = choice.label; label.textContent = choice.label; samples.className = "effect-samples"; samples.setAttribute("aria-hidden", "true");
    for (const shadow of choice.effects.length ? choice.effects : [null]) { const icon = document.createElement("i"); icon.style.boxShadow = shadowAppearance(shadow); samples.append(icon); }
    button.append(samples, label); gallery.append(button);
    button.addEventListener("click", () => { select.value = choice.value; const preset = !theme && shadowPresets.find(preset => preset.value === choice.value)?.shadow; if (preset) { field("color").value = preset.color; field("opacity").value = String(preset.opacity * 100); for (const name of ["blur", "distance", "angle"] as const) field(name).value = String(preset[name]); } update(); });
    button.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return; event.preventDefault(); const buttons = [...gallery.querySelectorAll("button")], index = buttons.indexOf(button), columns = getComputedStyle(gallery).gridTemplateColumns.split(" ").length, offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : columns, target = buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + offset + buttons.length) % buttons.length]!; target.click(); target.focus(); });
  }
  select.closest("label")!.after(gallery); if (!theme) { gallery.after(preview); for (const input of form.querySelectorAll("input")) input.addEventListener("input", () => { select.value = "custom"; update(); }); } form.prepend(style); update();
}
