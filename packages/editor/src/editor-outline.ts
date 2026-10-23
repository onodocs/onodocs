import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentElement, DocumentParagraph, DocumentSelection } from "@onodocs/sdk";
import { editorIcons } from "./editor-icons.js";

export function createOutline(root: ShadowRoot, current: () => BrowserDocument, selection: () => DocumentSelection | undefined, select: (selection: DocumentSelection) => void, execute: (command: DocumentEdit) => Promise<unknown>, editable: () => boolean, close: () => void) {
  const element = document.createElement("section"), style = document.createElement("style"), toolbar = document.createElement("div"), tree = document.createElement("div"), status = document.createElement("p");
  element.className = "outline-workspace"; element.setAttribute("aria-label", "Document outline"); toolbar.className = "outline-tools"; toolbar.setAttribute("aria-label", "Outlining tools"); tree.setAttribute("role", "tree"); tree.setAttribute("aria-label", "Document structure"); status.setAttribute("role", "status");
  style.textContent = `:host([data-outline])>main,:host([data-outline])>.navigation-pane,:host([data-outline])>.styles-pane,:host([data-outline])>.comparison-pane,:host([data-outline])>.split-pane{display:none!important}:host([data-outline]){display:block!important}.outline-workspace{background:white;margin:16px;min-height:55vh;border:1px solid #d7dce2;border-radius:4px}.outline-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border-bottom:1px solid #d7dce2;background:#f8fafc;position:sticky;top:var(--editor-toolbar-height,0px);z-index:2}.outline-tools>div{display:flex;gap:4px;align-items:center}.outline-tools label{display:flex;align-items:center;gap:6px;font-size:12px}.outline-tools select{height:32px;max-width:130px;border:1px solid #cbd3dc}.outline-tools input{height:16px;width:16px}.outline-tools button{border:1px solid #cbd3dc}.outline-tools svg{width:18px;height:18px}.outline-workspace>[role=tree]{padding:14px 20px}.outline-row{scroll-margin-top:calc(var(--editor-toolbar-height,0px) + 90px);scroll-margin-bottom:16px;display:flex;align-items:center;min-height:38px;padding:5px 8px;border:1px solid transparent;border-radius:3px;gap:8px;line-height:1.5;cursor:pointer;overflow-wrap:anywhere}.outline-row[aria-selected=true]{background:#e8f1fb;border-color:#bfd2e6}.outline-row:focus-visible{outline:2px solid #326c9e}.outline-row button{width:26px;min-width:26px;padding:2px}.outline-row svg{width:16px;height:16px}.outline-row>span{flex:1;min-width:0;white-space:pre-wrap}.outline-row>small{color:#66717f;white-space:nowrap}.outline-row[data-heading]{font-weight:600}.outline-workspace>p{padding:0 20px;color:#617080;font-size:12px}:host([data-compact]) .outline-workspace{margin:8px}:host([data-compact]) .outline-tools{position:static;gap:8px}:host([data-compact]) .outline-tools button{min-height:40px}:host([data-compact]) .outline-workspace>[role=tree]{padding:8px}:host([data-compact]) .outline-row{min-height:44px}`;
  let snapshot: ReturnType<BrowserDocument["snapshot"]> | undefined, blocks: readonly DocumentElement[] = [], selected = 0, busy = false;
  let ends: number[] = [], visible: number[] = [];
  const collapsed = new Set<string>();
  const actions = document.createElement("div"), filters = document.createElement("div"), levels = document.createElement("select"), show = document.createElement("select"), body = document.createElement("input"), subheadings = document.createElement("input");
  function icon(button: HTMLElement, name: string): void { button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${editorIcons[name] ?? editorIcons["view:outline"]}</svg>`; }
  function button(label: string, name: string, action: () => void): HTMLButtonElement { const button = document.createElement("button"); button.type = "button"; button.title = label; button.setAttribute("aria-label", label); icon(button, name); button.addEventListener("click", action); return button; }
  const promote = button("Promote", "outline:promote", () => void changeLevel(Math.max(1, level(selected) - 1))), demote = button("Demote", "outline:demote", () => void changeLevel(Math.min(9, level(selected) + 1))), up = button("Move up", "outline:up", () => void move(-1)), down = button("Move down", "outline:down", () => void move(1));
  levels.setAttribute("aria-label", "Outline level"); for (let n = 1; n <= 9; n++) levels.add(new Option(`Level ${n}`, String(n))); levels.add(new Option("Body text", "10")); levels.addEventListener("change", () => void changeLevel(Number(levels.value)));
  show.setAttribute("aria-label", "Show levels"); show.add(new Option("All levels", "9")); for (let n = 1; n <= 8; n++) show.add(new Option(`Through level ${n}`, String(n))); show.addEventListener("change", render);
  body.type = subheadings.type = "checkbox"; subheadings.checked = true; body.addEventListener("change", render);
  function label(text: string, input: HTMLElement): HTMLLabelElement { const label = document.createElement("label"); label.append(input, text); return label; }
  const expand = button("Expand all", "outline:expand", () => { collapsed.clear(); render(); }), collapse = button("Collapse all", "outline:collapse", () => { for (let i = 0; i < blocks.length; i++) if (level(i) < 10) collapsed.add(blocks[i]!.id); render(); });
  const edit = button("Edit in document", "outline:edit", () => { const p = paragraph(selected); close(); if (p) select(p.selection); }); edit.append("Edit in document");
  const dismiss = button("Close Outline", "outline:close", close); dismiss.append("Close Outline");
  actions.append(promote, demote, levels, up, down); filters.append(show, expand, collapse); toolbar.append(actions, filters, label("Show body text", body), label("Include subheadings", subheadings), edit, dismiss); element.append(toolbar, tree, status); root.append(style); root.insertBefore(element, root.querySelector("footer"));
  function level(index: number): number { const block = blocks[index]; return block?.kind === "paragraph" ? block.headingLevel ?? 10 : 10; }
  function paragraph(index: number): DocumentParagraph | undefined { const block = blocks[index]; return block && current().content.within(block).paragraphs().first(); }
  function focusRow(): void { const row = tree.querySelector<HTMLElement>(`[data-index="${selected}"]`); row?.focus({ preventScroll: true }); row?.scrollIntoView({ block: "nearest" }); }
  function choose(index: number, focus = true): void { selected = index; const p = paragraph(index); if (p) select({ start: p.selection.start, end: p.selection.start }); render(); if (focus) focusRow(); }
  async function run(command: DocumentEdit, retainedIndex?: number): Promise<void> { if (busy || !editable()) return; busy = true; status.textContent = ""; updateControls(); try { await execute(command); refresh(); if (retainedIndex !== undefined) { selected = retainedIndex; const p = paragraph(selected); if (p) select({ start: p.selection.start, end: p.selection.start }); } status.textContent = "Outline updated."; } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); } finally { busy = false; render(); focusRow(); } }
  async function changeLevel(next: number): Promise<void> {
    const block = blocks[selected]; if (block?.kind !== "paragraph") return;
    const delta = next - level(selected), headings = next < 10 && subheadings.checked && level(selected) < 10 ? blocks.slice(selected, ends[selected]).filter((block): block is DocumentParagraph => block.kind === "paragraph" && !!block.headingLevel) : [block];
    if (headings.some(heading => (heading.headingLevel ?? 10) + delta < 1 || (heading.headingLevel ?? 10) + delta > 10 || headings.length > 1 && (heading.headingLevel ?? 10) + delta > 9)) { status.textContent = "Choose a level that keeps all subheadings between levels 1 and 9."; render(); return; }
    const styles = current().paragraphStyles().all(), commands = headings.map(heading => { const target = (heading.headingLevel ?? 10) + delta; const style = target === 10 ? styles.find(style => style.isDefault) : styles.find(style => style.id === `Heading${target}`) ?? styles.find(style => style.headingLevel === target); return { kind: "properties" as const, selection: heading.selection, paragraph: { styleId: style?.id ?? null, outlineLevel: target - 1 } }; });
    await run({ kind: "batch", commands }, selected);
  }
  function destination(direction: number): number | undefined {
    if (!blocks[selected]) return; const currentLevel = level(selected);
    if (currentLevel === 10) return selected + direction >= 0 && selected + direction < blocks.length ? selected + direction : undefined;
    if (direction > 0) { const next = ends[selected]!; return next < blocks.length && level(next) === currentLevel ? ends[next]! - 1 : undefined; }
    for (let i = selected - 1; i >= 0; i--) if (level(i) <= currentLevel) return level(i) === currentLevel ? i : undefined;
  }
  async function move(direction: number): Promise<void> { const target = destination(direction); if (target === undefined) return; const end = level(selected) < 10 ? ends[selected]! : selected + 1; await run({ kind: "move", blockIds: blocks.slice(selected, end).map(block => block.id), ...(direction < 0 ? { before: blocks[target]!.id } : { after: blocks[target]!.id }) }); }
  function updateControls(): void { const canEdit = editable() && !busy, isParagraph = blocks[selected]?.kind === "paragraph"; levels.disabled = !canEdit || !isParagraph; levels.value = String(level(selected)); promote.disabled = !canEdit || !isParagraph || level(selected) === 1; demote.disabled = !canEdit || !isParagraph || level(selected) >= 9; up.disabled = !canEdit || destination(-1) === undefined; down.disabled = !canEdit || destination(1) === undefined; subheadings.disabled = !canEdit; edit.disabled = !blocks.length; }
  function render(): void {
    tree.replaceChildren(); visible = []; const stack: { end: number; level: number }[] = []; let hiddenUntil = -1;
    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index]!, heading = level(index) < 10, currentLevel = level(index);
      while (stack.length && stack.at(-1)!.end <= index) stack.pop();
      const indentation = heading ? currentLevel - 1 : stack.at(-1)?.level ?? 0;
      if (heading) stack.push({ end: ends[index]!, level: currentLevel });
      if (index < hiddenUntil || heading && currentLevel > Number(show.value) || !heading && !body.checked) continue;
      const row = document.createElement("div"), text = document.createElement("span"), detail = document.createElement("small"); row.className = "outline-row"; row.dataset.index = String(index); row.setAttribute("role", "treeitem"); row.setAttribute("aria-level", String(indentation + 1)); row.setAttribute("aria-selected", String(index === selected)); row.tabIndex = index === selected ? 0 : -1; row.style.paddingLeft = `${8 + Math.min(indentation, 8) * 16}px`; if (heading) row.dataset.heading = "";
      const expandable = heading && ends[index]! > index + 1;
      if (expandable) { row.setAttribute("aria-expanded", String(!collapsed.has(block.id))); const toggle = button(`${collapsed.has(block.id) ? "Expand" : "Collapse"} ${block.text || "Empty heading"}`, collapsed.has(block.id) ? "outline:expand" : "outline:collapse", () => { choose(index, false); if (!collapsed.delete(block.id)) collapsed.add(block.id); render(); focusRow(); }); toggle.tabIndex = -1; row.append(toggle); }
      else { const marker = document.createElement("span"); marker.style.cssText = "flex:0 0 26px;text-align:center"; marker.textContent = heading ? "•" : "·"; marker.setAttribute("aria-hidden", "true"); row.append(marker); }
      text.textContent = (block.kind === "paragraph" ? block.text : block.text.slice(0, 240)).trim() || (block.kind === "table" ? "Empty table" : block.kind === "contentControl" ? "Content control" : "Empty paragraph"); detail.textContent = heading ? `Level ${currentLevel}` : block.kind === "paragraph" ? "Body" : block.kind === "table" ? "Table" : "Content control"; row.append(text, detail); row.addEventListener("click", event => { if (!(event.target as Element).closest("button")) choose(index); }); row.addEventListener("dblclick", event => { if (!(event.target as Element).closest("button")) { choose(index, false); edit.click(); } }); tree.append(row); visible.push(index);
      if (expandable && collapsed.has(block.id)) hiddenUntil = ends[index]!;
    }
    if (!visible.includes(selected) && visible.length) { selected = visible[0]!; const row = tree.firstElementChild as HTMLElement; row.tabIndex = 0; row.setAttribute("aria-selected", "true"); const p = paragraph(selected); if (p) select({ start: p.selection.start, end: p.selection.start }); }
    if (!visible.length) { const empty = document.createElement("p"); empty.textContent = "No headings at these levels. Show body text to assign outline levels."; tree.append(empty); }
    updateControls();
  }
  tree.addEventListener("keydown", event => {
    if (event.altKey && event.shiftKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); if (event.key === "ArrowUp") up.click(); else if (event.key === "ArrowDown") down.click(); else if (event.key === "ArrowLeft") promote.click(); else demote.click(); return; }
    const position = visible.indexOf(selected); let target: number | undefined;
    if (event.key === "ArrowUp") target = visible[Math.max(0, position - 1)]; else if (event.key === "ArrowDown") target = visible[Math.min(visible.length - 1, position + 1)]; else if (event.key === "Home") target = visible[0]; else if (event.key === "End") target = visible.at(-1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); const block = blocks[selected]; if (block && level(selected) < 10) { if (event.key === "ArrowLeft") collapsed.add(block.id); else collapsed.delete(block.id); render(); tree.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.focus(); } return; }
    else if (event.key === "Enter") { event.preventDefault(); edit.click(); return; }
    if (target !== undefined) { event.preventDefault(); choose(target); }
  });
  function refresh(): void {
    const next = current().snapshot();
    if (snapshot !== next) {
      snapshot = next; const story = current().content.stories().where({ story: "body" }).first(); blocks = story?.children ?? []; ends = Array(blocks.length).fill(blocks.length); const stack: number[] = [];
      for (let i = 0; i < blocks.length; i++) if (level(i) < 10) { while (stack.length && level(stack.at(-1)!) >= level(i)) ends[stack.pop()!] = i; stack.push(i); }
      const point = selection(); let block = point && current().content.get(point.start.paragraphId); while (block?.parent && block.parent.kind !== "story") block = block.parent; selected = Math.max(0, blocks.findIndex(item => item.id === block?.id)); collapsed.clear(); render();
    } else updateControls();
  }
  refresh(); status.textContent = "Move headings with their content. Alt+Shift+arrows move or change heading levels. Enter edits in the document.";
  return { element, refresh, focus() { tree.querySelector<HTMLElement>('[tabindex="0"]')?.focus(); }, dispose() { element.remove(); style.remove(); } };
}
