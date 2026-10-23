import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentSelection, DocumentTextRange } from "@onodocs/sdk";
import type { DocumentView } from "@onodocs/canvas";

export function createNavigationPane(current: () => BrowserDocument, view: () => DocumentView | undefined, select: (selection: DocumentSelection) => void, close: () => void) {
  const element = document.createElement("aside"), header = document.createElement("header"), title = document.createElement("strong"), dismiss = document.createElement("button");
  element.className = "navigation-pane"; element.setAttribute("part", "navigation"); element.setAttribute("aria-label", "Navigation"); title.textContent = "Navigation";
  dismiss.type = "button"; dismiss.textContent = "×"; dismiss.setAttribute("aria-label", "Close Navigation"); dismiss.addEventListener("click", close); header.append(title, dismiss);
  const search = document.createElement("input"), tabs = document.createElement("div"), content = document.createElement("div"), count = document.createElement("p"), arrows = document.createElement("div");
  search.type = "search"; search.placeholder = "Search document"; search.setAttribute("aria-label", "Search document"); tabs.className = "navigation-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Navigation views");
  content.className = "navigation-list"; content.setAttribute("role", "tabpanel"); count.setAttribute("role", "status"); arrows.className = "navigation-arrows";
  let active = "Headings", snapshot: ReturnType<BrowserDocument["snapshot"]> | undefined, selected = -1;
  let matches: readonly DocumentTextRange[] = [];
  const buttons = new Map<string, HTMLButtonElement>();
  for (const name of ["Headings", "Pages", "Results"]) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = name; button.setAttribute("role", "tab");
    button.addEventListener("click", () => { active = name; render(); }); buttons.set(name, button); tabs.append(button);
  }
  tabs.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); const values = [...buttons.keys()], index = values.indexOf(active);
    active = values[event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + values.length) % values.length]!; render(); buttons.get(active)!.focus();
  });
  const previous = document.createElement("button"), next = document.createElement("button");
  for (const [button, label, symbol, direction] of [[previous, "Previous result", "↑", -1], [next, "Next result", "↓", 1]] as const) { button.type = "button"; button.textContent = symbol; button.setAttribute("aria-label", label); button.addEventListener("click", () => choose((selected + direction + matches.length) % matches.length)); }
  const caseLabel = document.createElement("label"), matchCase = document.createElement("input"); matchCase.type = "checkbox"; caseLabel.className = "navigation-case"; caseLabel.append(matchCase, "Match case"); matchCase.addEventListener("change", () => { active = "Results"; render(); });
  arrows.append(count, previous, next); element.append(header, search, caseLabel, tabs, arrows, content);
  function choose(index: number): void {
    const match = matches[index]; if (!match) return; selected = index; select(match.selection);
    count.textContent = `${index + 1} of ${matches.length} results`;
    for (const [at, button] of [...content.querySelectorAll("button")].entries()) button.setAttribute("aria-current", String(at === index));
  }
  function render(): void {
    const doc = current(); content.replaceChildren(); arrows.hidden = active !== "Results";
    for (const [name, button] of buttons) { button.setAttribute("aria-selected", String(name === active)); button.tabIndex = name === active ? 0 : -1; }
    content.setAttribute("aria-label", active);
    function item(label: string, action: () => void, level = 0): HTMLButtonElement { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.style.paddingLeft = `${8 + level * 12}px`; button.addEventListener("click", action); content.append(button); return button; }
    if (active === "Headings") for (const paragraph of doc.content.stories().where({ story: "body" }).paragraphs()) { if (paragraph.headingLevel) item(paragraph.text || "Empty heading", () => select(paragraph.selection), paragraph.headingLevel - 1); }
    if (active === "Pages") for (const page of doc.pages) {
      const excerpt = doc.geometry.page(page.index).readingOrder.map(item => item.text).join(" ").slice(0,90);
      item(`Page ${page.index + 1} — ${excerpt}`, () => view()?.scrollTo(page.index));
    }
    if (active === "Results") {
      matches = search.value ? doc.content.findText(matchCase.checked ? search.value : new RegExp(search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu")).all() : []; selected = -1;
      count.textContent = search.value ? `${matches.length} results` : "Enter text to search"; previous.disabled = next.disabled = !matches.length;
      for (const [index, match] of matches.entries()) {
        const button = item("", () => choose(index)), excerpt = document.createElement("span"), highlight = document.createElement("mark"); highlight.textContent = match.text;
        excerpt.append(match.paragraph.text.slice(Math.max(0, match.start - 30), match.start), highlight, match.paragraph.text.slice(match.end, match.end + 60)); button.append(excerpt);
      }
    }
    if (!content.children.length) { const empty = document.createElement("p"); empty.textContent = active === "Headings" ? "Apply a heading style to create document navigation." : active === "Results" && search.value ? "No matches." : ""; content.append(empty); }
  }
  search.addEventListener("input", () => { active = "Results"; render(); });
  search.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); choose((selected + (event.shiftKey ? -1 : 1) + matches.length) % matches.length); search.focus(); } });
  element.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
  return { element, focusSearch() { active = "Results"; render(); search.focus(); search.select(); }, refresh() { const next = current().snapshot(); if (snapshot === next) return; snapshot = next; render(); } };
}
