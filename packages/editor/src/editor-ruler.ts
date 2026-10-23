import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentSelection, ParagraphPropertyPatch } from "@onodocs/sdk";
import type { DocumentView } from "@onodocs/canvas";

export function createRuler(parent: HTMLElement, current: () => BrowserDocument | undefined, view: () => DocumentView | undefined, signal: AbortSignal, editing: Readonly<{ selection: () => DocumentSelection | undefined; enabled: () => boolean; tabs: () => void; apply: (command: DocumentEdit, document: BrowserDocument, snapshot: ReturnType<BrowserDocument["snapshot"]>) => Promise<void> }>) {
  const element = document.createElement("div"), scale = document.createElement("div"), units = document.createElement("select"), title = document.createElement("span");
  element.className = "page-ruler"; element.hidden = true; element.setAttribute("role", "group"); element.ariaLabel = "Page ruler";
  units.ariaLabel = "Ruler units"; for (const [value, label] of [["cm", "cm"], ["in", "in"], ["pt", "pt"]]) units.add(new Option(label, value));
  scale.className = "ruler-scale"; scale.setAttribute("aria-hidden", "true"); title.className = "ruler-description"; title.textContent = "Measurements from the left page edge"; const markers = document.createElement("div"); markers.className = "ruler-markers"; element.append(scale, markers, title, units); parent.append(element);
  let frame = 0, previous = "", dragging = false, restoreFocus: string | undefined;
  function update(): void {
    if (element.hidden || dragging) return;
    const document = current(), canvas = view(); if (!document?.pages.length || !canvas) return;
    let first = 0, last = document.pages.length - 1;
    const top = element.getBoundingClientRect().bottom, left = canvas.element.parentElement!.getBoundingClientRect().left;
    while (first < last) { const middle = (first + last) >>> 1, page = document.pages[middle]!; if (canvas.pageMovement === "horizontal" ? canvas.toClient(middle, { x: page.size.width, y: 0 }).x <= left : canvas.toClient(middle, { x: 0, y: page.size.height }).y <= top) first = middle + 1; else last = middle; }
    const selection = editing.selection(), paragraph = selection && document.content.get(selection.start.paragraphId);
    const frames = paragraph?.kind === "paragraph" ? document.geometry.paragraphFrames(paragraph) : [];
    const offset = paragraph?.kind === "paragraph" ? Math.min(selection!.start.offset, Math.max(0, paragraph.text.length - 1)) : 0;
    const text = paragraph?.kind === "paragraph" && paragraph.text.length ? document.geometry.fragments(document.content.range({ start: { paragraphId: paragraph.id, offset }, end: { paragraphId: paragraph.id, offset: offset + 1 } })).find(fragment => fragment.pageIndex === first) : undefined;
    const selectedFrame = frames.find(value => text && value.pageIndex === text.pageIndex && text.bounds.y >= value.bounds.y - 1 && text.bounds.y < value.bounds.y + value.bounds.height) ?? frames.find(fragment => fragment.pageIndex === first);
    const page = document.pages[first]!, start = canvas.toClient(first, { x: 0, y: 0 }), end = canvas.toClient(first, { x: page.size.width, y: 0 }), width = end.x - start.x;
    scale.style.left = `${start.x - element.getBoundingClientRect().left}px`; scale.style.width = `${width}px`;
    markers.style.left = scale.style.left; markers.style.width = scale.style.width;
    const focused = markers.contains(element.getRootNode() instanceof ShadowRoot ? (element.getRootNode() as ShadowRoot).activeElement : window.document.activeElement) ? markers.querySelector(":focus")?.getAttribute("data-marker") : undefined;
    markers.replaceChildren(); markers.onclick = null;
    if (paragraph?.kind === "paragraph" && selection && selectedFrame && editing.enabled() && Math.abs(selectedFrame.transform.b) < 0.001 && Math.abs(selectedFrame.transform.c) < 0.001 && selectedFrame.transform.a > 0) {
      const snapshot = document.snapshot(), properties = paragraph.properties.effective, bounds = selectedFrame.bounds, rtl = selectedFrame.indentation.direction === "rtl", direction = rtl ? -1 : 1;
      const origin = (rtl ? bounds.x + bounds.width : bounds.x) / 20, area = selectedFrame.rectangle.width / 20, pageWidth = page.size.width / 20;
      const indentScale = 1 / 20, leading = selectedFrame.indentation.start * indentScale, firstLine = selectedFrame.indentation.firstLine * indentScale, trailing = selectedFrame.indentation.end * indentScale;
      const physical = (position: number) => origin + direction * position * selectedFrame!.transform.a;
      const patch = (paragraph: ParagraphPropertyPatch) => editing.apply({ kind: "properties", selection, paragraph }, document, snapshot);
      const special = (delta: number) => delta >= 0 ? { firstLine: delta, hanging: null } : { firstLine: null, hanging: -delta };
      function marker(name: string, label: string, value: number, position: number, minimum: number, maximum: number, commit: (value: number, remove: boolean) => Promise<void>, convert: (x: number) => number, removable = false): void {
        const button = window.document.createElement("button"); button.type = "button"; button.className = "ruler-marker"; button.dataset.marker = name; button.setAttribute("role", "slider"); button.ariaLabel = label; button.setAttribute("aria-valuemin", String(minimum)); button.setAttribute("aria-valuemax", String(maximum)); button.setAttribute("aria-valuenow", String(value)); button.setAttribute("aria-valuetext", `${value.toFixed(1)} points`); button.title = `${label}: ${value.toFixed(1)} pt. Drag or use arrow keys${removable ? "; Delete removes" : ""}.`; button.style.left = `${position / pageWidth * 100}%`;
        const next = (value: number) => Math.round(Math.max(minimum, Math.min(maximum, value)) * 20) / 20;
        button.addEventListener("keydown", event => {
          let valueNext: number | undefined;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") valueNext = next(value + (convert(position + 1) - convert(position)) * (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 10 : 1));
          if (event.key === "Home") valueNext = minimum;
          if (event.key === "End") valueNext = maximum;
          const remove = removable && (event.key === "Delete" || event.key === "Backspace");
          if (valueNext !== undefined || remove) { event.preventDefault(); event.stopPropagation(); void commit(valueNext ?? value, remove).finally(() => { restoreFocus = name; schedule(); }); }
        });
        button.addEventListener("dblclick", event => { event.stopPropagation(); if (removable) editing.tabs(); });
        button.addEventListener("pointerdown", event => {
          if (event.button !== 0) return;
          event.preventDefault(); event.stopPropagation(); button.focus({ preventScroll: true }); dragging = true; button.setPointerCapture(event.pointerId);
          const bounds = markers.getBoundingClientRect(), controller = new AbortController(); let valueNext = value, removed = false;
          const move = (event: PointerEvent) => { const position = (event.clientX - bounds.left) / bounds.width * pageWidth; valueNext = next(convert(position)); removed = removable && (event.clientY < bounds.top - 28 || event.clientY > bounds.bottom + 28); button.style.left = `${position / pageWidth * 100}%`; button.style.opacity = removed ? "0.3" : "1"; button.setAttribute("aria-valuenow", String(valueNext)); button.title = `${label}: ${valueNext.toFixed(1)} pt`; };
          button.addEventListener("pointermove", move, { signal: controller.signal });
          const finish = (cancel: boolean) => { controller.abort(); dragging = false; if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); if (!cancel && (valueNext !== value || removed)) void commit(valueNext, removed).finally(() => { restoreFocus = name; schedule(); }); else schedule(); };
          button.addEventListener("pointerup", () => finish(false), { signal: controller.signal }); button.addEventListener("pointercancel", () => finish(true), { signal: controller.signal });
          window.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); finish(true); } }, { signal: controller.signal });
          signal.addEventListener("abort", () => finish(true), { once: true, signal: controller.signal });
        });
        if (name.startsWith("tab-")) {
          const alignment = label.split(" ")[0], shapes: Record<string, string> = { left: "M3 2v9h8", start: "M3 2v9h8", right: "M11 2v9H3", end: "M11 2v9H3", center: "M7 2v9M2 11h10", decimal: "M7 2v9M2 11h10M11 3h.1", num: "M7 2v9M2 11h10M11 3h.1" };
          button.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${shapes[alignment!] ?? shapes.left}"/></svg>`;
        }
        markers.append(button);
      }
      const logical = (position: number) => (position - origin) * direction / selectedFrame!.transform.a;
      marker("first", "First line indent", firstLine - leading, physical(firstLine), -area, area, value => patch({ indentStart: leading, ...special(value) }), position => logical(position) - leading);
      marker("hanging", "Hanging indent", leading, physical(leading), -area, area - trailing - 1, value => patch({ indentStart: value, ...special(firstLine - value) }), logical);
      marker("leading", "Leading indent", leading, physical(leading), -area, area - trailing - 1, value => patch({ indentStart: value, ...special(firstLine - leading) }), logical);
      marker("trailing", "Trailing indent", trailing, physical(area - trailing), -area, area - leading - 1, value => patch({ indentEnd: value }), position => area - logical(position));
      const stops = properties.tabStops ?? [];
      for (const [index, stop] of stops.entries()) if (stop.alignment !== "clear") marker(`tab-${index}`, `${stop.alignment} tab stop`, stop.position, physical(stop.position), -area, area, (position, remove) => { const tabs = new Map(stops.map(value => [Math.round(value.position * 20), value])); tabs.set(Math.round(stop.position * 20), { position: stop.position, alignment: "clear" }); if (!remove) tabs.set(Math.round(position * 20), { ...stop, position }); return patch({ tabStops: [...tabs.values()] }); }, logical, true);
      markers.onclick = event => { if (event.target !== markers) return; const position = Math.round(logical((event.clientX - markers.getBoundingClientRect().left) / width * pageWidth) * 2) / 2; if (position < 0 || position > area) return; void patch({ tabStops: [...stops.filter(stop => Math.round(stop.position * 20) !== Math.round(position * 20)), { position, alignment: "left" }] }).finally(schedule); };
      const margins = document.geometry.pageMargins(first), sectionParagraph = document.content.paragraphs().all().find(paragraph => paragraph.sectionIndex === margins.sectionIndex);
      if (sectionParagraph) {
        const marginSelection = { start: sectionParagraph.selection.start, end: sectionParagraph.selection.start };
        const left = margins.left.position / 20, right = margins.right.position / 20, leftValue = margins.left.value / 20, rightValue = margins.right.value / 20;
        marker("margin-left", "Left page margin", leftValue, left, 0, Math.max(0, right - left - 36 + leftValue), value => editing.apply({ kind: "page", selection: marginSelection, margins: { [margins.left.property]: value } }, document, snapshot), value => value - left + leftValue);
        marker("margin-right", "Right page margin", rightValue, right, 0, Math.max(0, right - left - 36 + rightValue), value => editing.apply({ kind: "page", selection: marginSelection, margins: { [margins.right.property]: value } }, document, snapshot), value => right - value + rightValue);
      }
    }
    const focus = restoreFocus ?? focused; if (focus && markers.childElementCount) { markers.querySelector<HTMLElement>(`[data-marker="${focus}"]`)?.focus({ preventScroll: true }); restoreFocus = undefined; }
    const key = `${first}:${page.size.width}:${Math.round(width)}:${units.value}`; if (key === previous) return; previous = key;
    element.ariaLabel = `Page ruler, page ${first + 1}, ${units.selectedOptions[0]!.text}`;
    const perUnit = units.value === "cm" ? 1440 / 2.54 : units.value === "in" ? 1440 : 20, step = units.value === "pt" ? 18 : units.value === "in" ? 0.25 : 0.5;
    const labelStep = units.value === "pt" ? 72 : units.value === "in" ? 1 : width / (page.size.width / perUnit) < 26 ? 2 : 1;
    scale.replaceChildren();
    for (let index = 0; index * step <= page.size.width / perUnit; index++) {
      const value = index * step, tick = window.document.createElement("span"), major = Math.abs(value / labelStep - Math.round(value / labelStep)) < 0.001;
      tick.className = major ? "ruler-tick major" : "ruler-tick"; tick.style.left = `${value * perUnit / page.size.width * 100}%`;
      if (major) { const label = window.document.createElement("span"); label.textContent = String(value); tick.append(label); } scale.append(tick);
    }
  }
  function schedule(): void { if (!frame && !element.hidden) frame = requestAnimationFrame(() => { frame = 0; update(); }); }
  units.addEventListener("change", update, { signal }); window.addEventListener("scroll", schedule, { capture: true, passive: true, signal }); window.addEventListener("resize", schedule, { signal });
  const observer = new ResizeObserver(schedule); observer.observe(parent);
  signal.addEventListener("abort", () => { observer.disconnect(); cancelAnimationFrame(frame); element.remove(); }, { once: true });
  return { element, update: schedule, setVisible(visible: boolean) { element.hidden = !visible; previous = ""; schedule(); } };
}
