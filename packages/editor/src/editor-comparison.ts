import { createDocument, type DocumentView } from "@onodocs/canvas";
import type { BrowserDocument } from "@onodocs/sdk/browser";

export function createComparison(root: ShadowRoot, host: HTMLElement, primary: HTMLElement, reference: BrowserDocument, name: string, current: () => Readonly<{ document: BrowserDocument; view: DocumentView }> | undefined, close: () => void, changed: () => void) {
  const element = document.createElement("section"), header = document.createElement("header"), title = document.createElement("strong"), body = document.createElement("div"), style = document.createElement("style");
  element.className = "comparison-pane"; element.setAttribute("aria-label", "Reference document"); title.textContent = name; title.title = name; body.className = "comparison-pages"; body.tabIndex = 0;
  style.textContent = `:host([data-comparison]){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 12px}:host([data-comparison])>nav,:host([data-comparison])>footer{grid-column:1/-1}:host([data-comparison])>main{grid-column:1;grid-row:2;width:auto!important;max-width:none!important;min-width:0;margin:12px 0 12px 12px;max-height:calc(100dvh - var(--editor-toolbar-height,0px) - 128px);height:calc(100dvh - var(--editor-toolbar-height,0px) - 128px);overflow:auto;overscroll-behavior:contain;border:1px solid #cbd3dc}:host([data-comparison])>main *{scroll-margin-top:0}.comparison-pane{grid-column:2;grid-row:2;display:flex;flex-direction:column;min-width:0;min-height:0;margin:12px 12px 12px 0;border:1px solid #cbd3dc;height:calc(100dvh - var(--editor-toolbar-height,0px) - 128px);background:#eceef1}.comparison-pane>header{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:7px;background:white;border-bottom:1px solid #cbd3dc}.comparison-pane strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1 1 100%}.comparison-pane label{display:flex;align-items:center;gap:4px;font-size:12px}.comparison-pane input{width:56px;border:1px solid #d7dce2}.comparison-pane select{max-width:112px;border:1px solid #d7dce2}.comparison-pane button{border:1px solid #d7dce2}.comparison-pages{min-height:0;overflow:auto;overscroll-behavior:contain;flex:1;padding:0}.comparison-pages *{scroll-margin-top:0}:host([data-comparison])>.styles-pane,:host([data-comparison])>.navigation-pane,:host([data-comparison])>.selection-pane{position:fixed;right:0;top:var(--editor-toolbar-height,0px);bottom:0;z-index:8;width:280px}:host([data-comparison][data-compact]){grid-template-columns:1fr}:host([data-comparison][data-compact])>main{grid-row:2;grid-column:1;height:38dvh;max-height:38dvh;margin:8px}:host([data-comparison][data-compact])>.comparison-pane{grid-row:3;grid-column:1;height:38dvh;margin:0 8px 8px}`;
  const pageLabel = document.createElement("label"), page = document.createElement("input"); page.type = "number"; page.min = "1"; page.max = String(reference.pages.length); page.value = "1"; page.setAttribute("aria-label", "Reference page"); pageLabel.append("Page", page, ` of ${reference.pages.length}`);
  const zoom = document.createElement("select"); zoom.setAttribute("aria-label", "Reference zoom"); for (const [value, label] of [["fit-width", "Page width"], ["0.5", "50%"], ["0.75", "75%"], ["1", "100%"]]) zoom.add(new Option(label, value));
  const dismiss = document.createElement("button"); dismiss.type = "button"; dismiss.textContent = "Close"; dismiss.setAttribute("aria-label", "Close side by side"); dismiss.addEventListener("click", close);
  header.append(title, pageLabel, zoom, dismiss); element.append(header, body); root.append(style, element); host.setAttribute("data-comparison", "");
  const canvas = createDocument(reference, { container: body, viewOptions: { zoom: "fit-width", title: "Reference document pages" } });
  const lifetime = new AbortController(); let synchronized = true, frame = 0, last: HTMLElement = primary, disposed = false;
  const expected = new WeakMap<HTMLElement, number>();
  function sync(source: HTMLElement): void {
    const main = current(), second = canvas.view;
    if (disposed || !main || main.view.disposed || !second) return;
    const from = source === primary ? { document: main.document, view: main.view, element: primary } : { document: reference, view: second, element: body };
    const to = source === primary ? { document: reference, view: second, element: body } : { document: main.document, view: main.view, element: primary };
    if (!from.document.pages.length || !to.document.pages.length) return;
    const top = from.element.getBoundingClientRect().top + from.element.clientTop;
    let start = 0, end = from.document.pages.length - 1;
    while (start < end) { const middle = (start + end) >>> 1, sourcePage = from.document.pages[middle]!; if (from.view.toClient(middle, { x: 0, y: sourcePage.size.height }).y <= top) start = middle + 1; else end = middle; }
    const sourcePage = from.document.pages[start]!, origin = from.view.toClient(start, { x: 0, y: 0 }), bottom = from.view.toClient(start, { x: 0, y: sourcePage.size.height });
    const fraction = Math.max(0, Math.min(1, (top - origin.y) / Math.max(1, bottom.y - origin.y))), targetPage = to.document.pages[Math.min(start, to.document.pages.length - 1)]!;
    if (source === body) page.value = String(start + 1);
    if (!synchronized) return;
    const target = to.view.toClient(targetPage.index, { x: 0, y: targetPage.size.height * fraction });
    const next = Math.max(0, Math.min(to.element.scrollHeight - to.element.clientHeight, to.element.scrollTop + target.y - to.element.getBoundingClientRect().top - to.element.clientTop));
    if (Math.abs(to.element.scrollTop - next) > 1) { expected.set(to.element, next); to.element.scrollTop = next; }
    page.value = String(source === primary ? targetPage.index + 1 : start + 1);
  }
  function scrolled(event: Event): void {
    const source = event.currentTarget as HTMLElement, value = expected.get(source); expected.delete(source);
    if (value !== undefined && Math.abs(source.scrollTop - value) < 2) return;
    last = source; cancelAnimationFrame(frame); frame = requestAnimationFrame(() => sync(source));
  }
  for (const scrollable of [primary, body]) scrollable.addEventListener("scroll", scrolled, { passive: true, signal: lifetime.signal });
  page.addEventListener("change", () => { const index = Math.max(0, Math.min(reference.pages.length - 1, Math.trunc(Number(page.value)) - 1)); canvas.view?.scrollTo(index, { block: "start" }); page.value = String(index + 1); });
  zoom.addEventListener("change", () => { canvas.view?.setZoom(zoom.value === "fit-width" ? "fit-width" : Number(zoom.value)); });
  const resize = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => sync(last)); }); resize.observe(primary); resize.observe(body);
  return { element, get synchronized() { return synchronized; }, setSynchronized(value: boolean) { synchronized = value; if (value) sync(primary); changed(); }, dispose() { if (disposed) return; disposed = true; lifetime.abort(); resize.disconnect(); cancelAnimationFrame(frame); canvas.dispose(); reference.dispose(); element.remove(); style.remove(); host.removeAttribute("data-comparison"); } };
}
