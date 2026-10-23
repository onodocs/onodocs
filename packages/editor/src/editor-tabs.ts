import type { ParagraphProperties } from "@onodocs/sdk";

type TabStop = NonNullable<ParagraphProperties["tabStops"]>[number];

export function createTabStopEditor(form: HTMLFormElement, stops: readonly TabStop[]): () => readonly TabStop[] {
  const list = document.createElement("div"), actions = document.createElement("div"), add = document.createElement("button"), clear = document.createElement("button"), hint = document.createElement("p");
  form.classList.add("tabs-form"); list.className = "tab-stop-list"; actions.className = "tab-stop-actions";
  hint.className = "design-help"; hint.textContent = "Positions are measured in points from the paragraph’s leading text boundary. Default tab spacing continues after custom stops.";
  const rows: { element: HTMLElement; position: HTMLInputElement; alignment: HTMLSelectElement; leader: HTMLSelectElement }[] = [];
  function append(stop: TabStop): void {
    const element = document.createElement("div"), position = document.createElement("input"), alignment = document.createElement("select"), leader = document.createElement("select"), remove = document.createElement("button");
    element.className = "tab-stop-row"; position.type = "number"; position.step = "0.05"; position.required = true; position.value = String(stop.position);
    for (const [value, label] of [["left", "Left"], ["center", "Center"], ["right", "Right"], ["decimal", "Decimal"], ["start", "Leading"], ["end", "Trailing"], ["num", "Number"]]) alignment.add(new Option(label, value));
    for (const [value, label] of [["none", "None"], ["dot", "······"], ["hyphen", "------"], ["underscore", "______"], ["heavy", "━━━━"], ["middleDot", "••••••"]]) leader.add(new Option(label, value));
    alignment.value = stop.alignment; leader.value = stop.leader ?? "none";
    for (const [title, input] of [["Position (pt)", position], ["Alignment", alignment], ["Leader", leader]] as const) { const label = document.createElement("label"); label.textContent = title; label.append(input); element.append(label); }
    remove.type = "button"; remove.className = "icon-button"; remove.ariaLabel = "Remove tab stop"; remove.title = "Remove tab stop"; remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 7h16M9 7V3h6v4M6 7l1 14h10l1-14M10 10v8M14 10v8"/></svg>';
    const row = { element, position, alignment, leader }; rows.push(row); element.append(remove); list.append(element);
    remove.addEventListener("click", () => { rows.splice(rows.indexOf(row), 1); element.remove(); add.focus(); });
  }
  for (const stop of stops) if (stop.alignment !== "clear") append(stop);
  add.type = clear.type = "button"; add.textContent = "Add tab stop"; clear.textContent = "Clear all";
  add.addEventListener("click", () => { append({ position: rows.reduce((max, row) => Math.max(max, Number(row.position.value)), 0) + 36, alignment: "left" }); rows.at(-1)!.position.focus(); rows.at(-1)!.position.select(); });
  clear.addEventListener("click", () => { rows.length = 0; list.replaceChildren(); add.focus(); });
  actions.append(add, clear); form.append(hint, list, actions);
  return () => rows.map(row => ({ position: Number(row.position.value), alignment: row.alignment.value as TabStop["alignment"], leader: row.leader.value as NonNullable<TabStop["leader"]> }));
}
