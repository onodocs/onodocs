export function configureDropCapForm(form: HTMLFormElement): void {
  const document = form.ownerDocument, style = document.createElement("style"), gallery = document.createElement("div"), select = form.elements.namedItem("mode") as HTMLSelectElement;
  form.className = "wide-form drop-cap-form";
  style.textContent = `.drop-cap-gallery{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.drop-cap-gallery button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;height:auto;border:1px solid #dce1e6;border-radius:5px;background:white;color:#334155}.drop-cap-gallery button[aria-checked=true]{border-color:#2563eb;background:#eff6ff;box-shadow:inset 0 0 0 1px #2563eb}.drop-cap-gallery svg{width:72px;height:52px}.drop-cap-form [hidden]{display:none!important}.drop-cap-form .dialog-actions{grid-column:1/-1}`;
  gallery.className = "drop-cap-gallery"; gallery.setAttribute("role", "radiogroup"); gallery.setAttribute("aria-label", "Position"); select.closest("label")!.hidden = true;
  function refresh(): void {
    for (const button of gallery.querySelectorAll<HTMLButtonElement>("button")) { const active = button.dataset.value === select.value; button.setAttribute("aria-checked", String(active)); button.tabIndex = active ? 0 : -1; }
    for (const field of form.querySelectorAll<HTMLInputElement>("input")) field.disabled = select.value === "none";
  }
  for (const option of select.options) {
    const button = document.createElement("button"), label = document.createElement("span"); button.type = "button"; button.dataset.value = option.value; button.setAttribute("role", "radio"); button.setAttribute("aria-label", option.text); label.textContent = option.text;
    const cap = option.value !== "none", margin = option.value === "margin", x = margin ? 32 : 8;
    button.innerHTML = `<svg viewBox="0 0 84 60" aria-hidden="true"><text x="${margin ? 2 : 8}" y="${cap ? 37 : 17}" font-family="Georgia,serif" font-size="${cap ? 36 : 13}" fill="currentColor">A</text><path d="M${cap ? 34 : 20} 12H76M${cap ? 34 : 8} 22H76M${cap ? 34 : 8} 32H76M${x} 42H76M${x} 52H76" stroke="currentColor" stroke-width="2"/></svg>`;
    button.append(label); button.addEventListener("click", () => { select.value = option.value; refresh(); }); gallery.append(button);
  }
  gallery.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); const buttons = [...gallery.querySelectorAll<HTMLButtonElement>("button")], index = buttons.indexOf(event.target as HTMLButtonElement), next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]!.click(); buttons[next]!.focus();
  });
  form.querySelector("h2")!.after(gallery); form.prepend(style); refresh();
}
