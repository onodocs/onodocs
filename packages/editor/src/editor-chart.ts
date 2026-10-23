import { editorIcons } from "./editor-icons.js";
import type { ChartData } from "@onodocs/sdk";

export function configureChartForm(form: HTMLFormElement): void {
  const document = form.ownerDocument, style = document.createElement("style"), stored = form.elements.namedItem("data") as HTMLInputElement | null;
  form.className = "wide-form chart-form"; if (stored) stored.closest("label")!.hidden = true;
  style.textContent = `dialog:has(>.chart-form){width:min(840px,calc(100vw - 32px));max-width:calc(100vw - 32px)}.chart-form{width:100%;min-width:0;max-width:100%}.chart-form [hidden]{display:none!important}.chart-types{grid-column:1/-1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.chart-types button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;height:auto;padding:8px 4px;border:1px solid #dce1e6;border-radius:5px;background:white;color:#334155}.chart-types button[aria-checked=true]{background:#eff6ff;border-color:#2563eb;box-shadow:inset 0 0 0 1px #2563eb}.chart-types svg{width:48px;height:40px}.chart-data{grid-column:1/-1;min-width:0}.chart-data-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.chart-data-scroll{max-height:310px;overflow:auto;border:1px solid #dce1e6;border-radius:4px}.chart-data table{border-collapse:collapse;width:100%;font-size:12px}.chart-data th{background:#f1f5f9;position:sticky;top:0;z-index:1}.chart-data td,.chart-data th{border:1px solid #dce1e6;padding:3px;min-width:90px}.chart-data td:last-child,.chart-data th:last-child{min-width:28px;width:28px}.chart-data input{min-width:0;width:100%;border:0;border-radius:0;background:transparent;padding:6px}.chart-data th>div{display:flex;align-items:center}.chart-data button{white-space:nowrap}.chart-data .chart-remove{padding:3px;width:26px;height:26px;flex-shrink:0;border:0;background:transparent;font-size:18px}.chart-form .dialog-actions{grid-column:1/-1}.chart-help{grid-column:1/-1;margin:6px 0;color:#64748b;font-size:12px}@media(max-width:520px){.chart-form{width:auto}.chart-types{gap:4px}.chart-types svg{width:32px}.chart-types button{font-size:11px}.chart-data-scroll{max-height:240px}}`;
  form.prepend(style);
  const types = form.elements.namedItem("chartType") as HTMLSelectElement | null, grouping = form.elements.namedItem("grouping") as HTMLSelectElement | null;
  if (types) {
    const icons: Record<string, string> = { column: '<path d="M4 36V20h9v16m6 0V5h9v31m6 0V13h9v23"/>', bar: '<path d="M4 5h25v8H4m0 6h39v8H4m0 6h17v8H4"/>', line: '<path d="M3 32l12-15 13 7L44 5" fill="none" stroke-width="3"/>', pie: '<path d="M24 20V2a18 18 0 1 0 18 18H24Z"/><path d="M28 1v15h15A18 18 0 0 0 28 1Z" opacity=".45"/>', doughnut: '<circle cx="24" cy="20" r="14" fill="none" stroke-width="9"/><path d="M24 6a14 14 0 0 1 14 14" fill="none" stroke="#93c5fd" stroke-width="9"/>' };
    const choiceGallery = (select: HTMLSelectElement, label: string, icon: (value: string) => string) => {
      select.closest("label")!.hidden = true;
      const gallery = document.createElement("div"); gallery.className = "chart-types"; gallery.setAttribute("role", "radiogroup"); gallery.setAttribute("aria-label", label);
      for (const option of select.options) {
        const button = document.createElement("button"); button.type = "button"; button.setAttribute("role", "radio"); button.dataset.value = option.value; gallery.append(button);
        button.addEventListener("click", () => { select.value = option.value; select.dispatchEvent(new Event("change", { bubbles: true })); });
      }
      const refresh = () => { for (const [index, button] of [...gallery.querySelectorAll("button")].entries()) { const option = select.options[index]!, active = option.value === select.value; button.setAttribute("aria-checked", String(active)); button.setAttribute("aria-label", option.label); button.tabIndex = active ? 0 : -1; button.innerHTML = `<svg viewBox="0 0 48 44" fill="#4472c4" stroke="#4472c4" aria-hidden="true">${icon(option.value)}</svg>`; const caption = document.createElement("span"); caption.textContent = option.label; button.append(caption); } };
      gallery.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const buttons = [...gallery.querySelectorAll("button")], index = buttons.indexOf(event.target as HTMLButtonElement), next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + buttons.length) % buttons.length; buttons[next]!.click(); buttons[next]!.focus(); });
      select.addEventListener("change", refresh); refresh(); return { gallery, refresh };
    };
    const typeGallery = choiceGallery(types, "Chart type", value => icons[value]!); form.querySelector("h2")!.after(typeGallery.gallery);
    if (grouping) {
      const groupingGallery = choiceGallery(grouping, "Chart grouping", value => {
        if (types.value === "line") return `<path d="M4 34l13-9 13 5 14-14" fill="none" stroke-width="2"/><path d="${value === "percentStacked" ? "M4 6h40" : value === "stacked" ? "M4 22l13-12 13 5L44 3" : "M4 12l13 7 13-12 14 10"}" fill="none" stroke="#ed7d31" stroke-width="2"/>`;
        const bars = [6, 20, 34].map((x, index) => {
          const lower = [24, 16, 28][index]!, upper = value === "percentStacked" ? 4 : [12, 4, 18][index]!;
          return value === "standard" ? `<rect x="${x - 2}" y="${lower}" width="5" height="${38 - lower}"/><rect x="${x + 4}" y="${upper}" width="5" height="${38 - upper}" fill="#ed7d31" stroke="#ed7d31"/>` : `<rect x="${x}" y="${lower}" width="8" height="${38 - lower}"/><rect x="${x}" y="${upper}" width="8" height="${lower - upper}" fill="#ed7d31" stroke="#ed7d31"/>`;
        }).join("");
        return types.value === "bar" ? `<g transform="translate(44 0) rotate(90)">${bars}</g>` : bars;
      });
      groupingGallery.gallery.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))"; typeGallery.gallery.after(groupingGallery.gallery);
      const refreshGrouping = () => { const circular = types.value === "pie" || types.value === "doughnut"; grouping.disabled = circular; groupingGallery.gallery.hidden = circular; grouping.options[0]!.label = types.value === "line" ? "Standard" : "Clustered"; groupingGallery.refresh(); };
      types.addEventListener("change", refreshGrouping); refreshGrouping();
    }
  }
  if (!stored) return;
  const initial = JSON.parse(stored.value) as ChartData;
  let categories = [...initial.categories], series = initial.series.map(value => ({ name: value.name, values: [...value.values] }));
  const section = document.createElement("section"), toolbar = document.createElement("div"), scroll = document.createElement("div"), table = document.createElement("table"), help = document.createElement("p"); section.className = "chart-data"; toolbar.className = "chart-data-toolbar"; scroll.className = "chart-data-scroll"; help.className = "chart-help"; help.textContent = "Enter numbers, or leave a value blank. Pie and doughnut charts use one series. Data is saved in an embedded workbook."; table.setAttribute("aria-label", "Chart data"); scroll.append(table); section.append(toolbar, scroll, help); form.append(section);
  const save = () => { stored.value = JSON.stringify({ categories, series }); };
  const button = (label: string, action: () => void, remove = false) => { const value = document.createElement("button"); value.type = "button"; value.textContent = remove ? "×" : label; value.setAttribute("aria-label", label); value.title = label; if (remove) value.className = "chart-remove"; value.addEventListener("click", action); return value; };
  function render(): void {
    table.replaceChildren(); const head = document.createElement("thead"), row = document.createElement("tr"), heading = document.createElement("th"); heading.scope = "col"; heading.textContent = "Category"; row.append(heading);
    for (const [index, item] of series.entries()) {
      const cell = document.createElement("th"), wrap = document.createElement("div"), input = document.createElement("input"); cell.scope = "col"; input.value = item.name; input.setAttribute("aria-label", `Series ${index + 1} name`); input.addEventListener("input", () => { item.name = input.value; save(); });
      const remove = button(`Remove series ${index + 1}`, () => { if (series.length > 1) { series.splice(index, 1); render(); } }, true); remove.disabled = series.length === 1; wrap.append(input, remove); cell.append(wrap); row.append(cell);
    }
    row.append(document.createElement("th")); head.append(row); table.append(head); const body = document.createElement("tbody");
    for (const [index, name] of categories.entries()) {
      const row = document.createElement("tr"), cell = document.createElement("td"), input = document.createElement("input"); input.value = name; input.setAttribute("aria-label", `Category ${index + 1}`); input.addEventListener("input", () => { categories[index] = input.value; save(); }); cell.append(input); row.append(cell);
      for (const [column, item] of series.entries()) { const cell = document.createElement("td"), input = document.createElement("input"); input.type = "number"; input.step = "any"; input.value = item.values[index] === null ? "" : String(item.values[index]); input.setAttribute("aria-label", `Category ${index + 1}, series ${column + 1} value`); input.addEventListener("input", () => { item.values[index] = input.value === "" ? null : Number(input.value); save(); }); cell.append(input); row.append(cell); }
      const action = document.createElement("td"), remove = button(`Remove category ${index + 1}`, () => { if (categories.length > 1) { categories.splice(index, 1); for (const item of series) item.values.splice(index, 1); render(); } }, true); remove.disabled = categories.length === 1; action.append(remove); row.append(action); body.append(row);
    }
    table.append(body); save();
  }
  toolbar.append(button("Add category", () => { categories.push(`Category ${categories.length + 1}`); for (const item of series) item.values.push(null); render(); table.querySelector<HTMLInputElement>(`[aria-label="Category ${categories.length}"]`)?.focus(); }), button("Add series", () => { series.push({ name: `Series ${series.length + 1}`, values: categories.map(() => null) }); render(); table.querySelector<HTMLInputElement>(`[aria-label="Series ${series.length} name"]`)?.focus(); }));
  const transpose = button("Switch Row/Column", () => {
    const previous = series;
    series = categories.map((name, index) => ({ name, values: previous.map(item => item.values[index] ?? null) }));
    categories = previous.map(item => item.name);
    render();
  });
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("width", "16"); icon.setAttribute("height", "16"); icon.setAttribute("aria-hidden", "true"); icon.setAttribute("fill", "none"); icon.setAttribute("stroke", "currentColor"); icon.innerHTML = editorIcons["chart:transpose"]!; transpose.prepend(icon); transpose.style.display = "inline-flex"; transpose.style.alignItems = "center"; transpose.style.gap = "6px"; toolbar.append(transpose);
  render();
}
