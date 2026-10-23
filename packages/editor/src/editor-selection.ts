import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentView } from "@onodocs/canvas";
import { editorIcons } from "./editor-icons.js";

export function createSelectionPane(current: () => BrowserDocument, view: () => DocumentView | undefined, selected: () => string | undefined, viewportTop: () => number, choose: (id: string, pageIndex: number) => void, arrange: () => void, editable: () => boolean, close: () => void) {
  const element = document.createElement("aside"), header = document.createElement("header"), title = document.createElement("strong"), dismiss = document.createElement("button"), search = document.createElement("input"), scope = document.createElement("select"), list = document.createElement("div"), count = document.createElement("p");
  element.className = "navigation-pane selection-pane"; element.setAttribute("aria-label", "Selection"); title.textContent = "Selection";
  dismiss.type = "button"; dismiss.textContent = "×"; dismiss.ariaLabel = "Close Selection"; dismiss.addEventListener("click", close); header.append(title, dismiss);
  search.type = "search"; search.placeholder = "Find an object"; search.ariaLabel = "Find an object";
  scope.ariaLabel = "Object scope"; scope.add(new Option("All pages", "all")); scope.add(new Option("Current page", "page"));
  list.className = "navigation-list selection-list"; list.setAttribute("aria-label", "Document objects"); count.setAttribute("role", "status"); element.append(header, search, scope, count, list);
  const arrangeButton = document.createElement("button"); arrangeButton.type = "button"; arrangeButton.ariaLabel = "Align selected objects";
  arrangeButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${editorIcons["picture:align"]}</svg><span>Align selected objects</span>`;
  arrangeButton.addEventListener("click", arrange); element.append(arrangeButton);
  const lifetime = new AbortController();
  let chosen: string | undefined, owner: BrowserDocument | undefined;
  const included = new Set<string>();
  let snapshot: ReturnType<BrowserDocument["snapshot"]> | undefined, page = -1;
  function currentPage(): number {
    const canvas = view(), pages = current().pages;
    if (!canvas || !pages.length) return 0;
    const top = viewportTop() + 1, left = canvas.element.parentElement!.getBoundingClientRect().left + 1;
    let first = 0, last = pages.length - 1;
    while (first < last) {
      const middle = (first + last) >>> 1;
      if (canvas.pageMovement === "horizontal" ? canvas.toClient(middle, { x: pages[middle]!.size.width, y: 0 }).x <= left : canvas.toClient(middle, { x: 0, y: pages[middle]!.size.height }).y <= top) first = middle + 1;
      else last = middle;
    }
    return first;
  }
  function render(): void {
    const doc = current(), needle = search.value.toLocaleLowerCase(); list.replaceChildren();
    if (owner !== doc) { included.clear(); owner = doc; }
    for (const id of included) if (!doc.content.get(id)) included.delete(id);
    const objects = doc.content.descendants().all().filter(value => value.kind === "image" || value.kind === "drawing");
    let shown = 0;
    for (const [index, object] of objects.entries()) {
      const name = object.description || `${object.kind === "image" ? "Picture" : "Drawing"} ${index + 1}`, fragments = doc.geometry.fragments(object), pages = [...new Set(fragments.map(fragment => fragment.pageIndex + 1))];
      if (needle && !name.toLocaleLowerCase().includes(needle) || scope.value === "page" && !pages.includes(page + 1)) continue;
      const button = document.createElement("button"), text = document.createElement("span"), label = document.createElement("span"), detail = document.createElement("small"), icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      button.type = "button"; button.dataset.objectId = object.id; button.setAttribute("aria-current", String(selected() === object.id)); button.ariaLabel = name;
      icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("fill", "none"); icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "1.5"); icon.setAttribute("aria-hidden", "true"); icon.innerHTML = editorIcons[object.kind === "image" ? "image" : "selectionPane"]!;
      label.textContent = name; detail.textContent = `${object.story ?? "Document"} · ${pages.length ? "Page " + pages.join(", ") : "No visible page"}`; text.append(label, detail); button.append(icon, text);
      const row = document.createElement("div"), check = document.createElement("input"); row.className = "selection-object";
      check.type = "checkbox"; check.ariaLabel = `Include ${name} in arrangement`; check.checked = included.has(object.id); check.dataset.objectId = object.id;
      check.disabled = object.kind === "drawing" && !object.shape && !object.group;
      check.addEventListener("change", () => { if (check.checked) included.add(object.id); else included.delete(object.id); choose(object.id, currentPage()); refresh(); });
      button.addEventListener("click", event => { if (event.ctrlKey || event.metaKey || event.shiftKey) { if (included.has(object.id)) included.delete(object.id); else included.add(object.id); } else included.clear(); choose(object.id, currentPage()); refresh(); });
      row.append(check, button); list.append(row); shown++;
    }
    count.textContent = `${shown} ${shown === 1 ? "object" : "objects"}`;
    if (!shown) { const empty = document.createElement("p"); empty.textContent = objects.length ? "No matching objects." : "No pictures or drawings in this document."; list.append(empty); }
  }
  list.addEventListener("keydown", event => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = [...list.querySelectorAll("button")], index = buttons.indexOf((element.getRootNode() as ShadowRoot).activeElement as HTMLButtonElement);
    if (!buttons.length || index < 0) return;
    event.preventDefault(); const next = buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowUp" ? buttons.length - 1 : 1)) % buttons.length]!;
    choose(next.dataset.objectId!, currentPage()); next.focus();
  });
  search.addEventListener("input", render); scope.addEventListener("change", () => { page = currentPage(); render(); });
  element.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
  function refresh(): void {
    const next = current().snapshot(), visible = currentPage();
    if (snapshot !== next || scope.value === "page" && page !== visible) { snapshot = next; page = visible; render(); }
    else if (chosen !== selected()) for (const button of list.querySelectorAll<HTMLButtonElement>("button[data-object-id]")) button.setAttribute("aria-current", String(button.dataset.objectId === selected()));
    for (const check of list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) check.checked = included.has(check.dataset.objectId!);
    arrangeButton.hidden = included.size < 2; arrangeButton.disabled = !editable();
    if (included.size) count.textContent = `${included.size} objects selected for arrangement`;
    chosen = selected();
  }
  window.addEventListener("scroll", refresh, { capture: true, passive: true, signal: lifetime.signal });
  view()?.element.getRootNode().addEventListener("scroll", refresh, { capture: true, passive: true, signal: lifetime.signal });
  return { element, get selectedIds(): readonly string[] { return [...included]; }, focus() { search.focus(); }, refresh, dispose() { lifetime.abort(); element.remove(); } };
}
