import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentElement, DocumentSelection } from "@onodocs/sdk";

interface AccessibilityIssue { readonly element: DocumentElement; readonly title: string; readonly detail: string; readonly kind: "description" | "header" | "heading"; readonly level?: number; }

function accessibilityIssues(document: BrowserDocument): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [], headings = new Map<string, number>();
  for (const element of document.content.descendants()) {
    if (element.kind === "image" && !element.description?.trim() || element.kind === "drawing" && !element.description.trim() && !element.textPath && !element.shape?.textBox) issues.push({ element, kind: "description", title: "Missing alternative text", detail: "Describe the information this picture or drawing conveys. Its purpose matters more than its appearance." });
    if (element.kind === "table" && element.rows.length > 1 && !element.rows[0]?.properties.authored.header) issues.push({ element, kind: "header", title: "Review table header row", detail: "If the first row contains column labels, mark it as the header row. Layout tables may not need a header." });
    if (element.kind === "paragraph" && element.headingLevel) {
      let story: DocumentElement | undefined = element.parent; while (story && story.kind !== "story") story = story.parent;
      const key = story?.id ?? "", previous = headings.get(key) ?? 0;
      if (element.headingLevel > previous + 1) issues.push({ element, kind: "heading", level: previous + 1, title: "Skipped heading level", detail: `Heading ${element.headingLevel} follows ${previous ? `Heading ${previous}` : "the start of this story"}. Use consecutive levels to make the structure easier to navigate.` });
      headings.set(key, element.headingLevel);
    }
  }
  return issues;
}

export function showAccessibility(root: ShadowRoot, current: () => BrowserDocument, editable: boolean, execute: (edit: DocumentEdit) => Promise<unknown>, select: (selection: DocumentSelection) => void, focus: () => void): void {
  const dialog = document.createElement("dialog"), title = document.createElement("h2"), summary = document.createElement("p"), layout = document.createElement("div"), list = document.createElement("select"), detail = document.createElement("section"), label = document.createElement("label"), description = document.createElement("textarea"), text = document.createElement("p"), actions = document.createElement("div"), error = document.createElement("p"), style = document.createElement("style");
  dialog.ariaLabel = "Check accessibility"; dialog.className = "accessibility-dialog"; title.textContent = "Check accessibility"; summary.setAttribute("role", "status");
  style.textContent = `.accessibility-dialog{width:700px;max-width:calc(100vw - 24px)}.accessibility-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px}.accessibility-grid.empty{display:block}.accessibility-grid.empty p{margin:20px 0}.accessibility-grid select{width:100%;max-width:none;height:230px;white-space:normal}.accessibility-grid option{padding:8px}.accessibility-grid section{min-width:0}.accessibility-grid p{line-height:1.5;margin-top:0}.accessibility-grid textarea{position:static;opacity:1;width:100%;height:110px;border:1px solid #b8c1cb;border-radius:4px;padding:8px;font:inherit;resize:vertical}.accessibility-dialog .dialog-actions{flex-wrap:wrap}.accessibility-dialog [role=alert]{margin-top:12px}@media(max-width:550px){.accessibility-grid{grid-template-columns:1fr}.accessibility-grid select{height:145px}}`;
  list.ariaLabel = "Accessibility findings"; list.size = 7; layout.className = "accessibility-grid"; label.textContent = "Alternative text"; description.ariaLabel = "Alternative text"; label.append(description); detail.append(text, label); layout.append(list, detail); actions.className = "dialog-actions"; error.setAttribute("role", "alert");
  const rescan = document.createElement("button"), go = document.createElement("button"), close = document.createElement("button"), apply = document.createElement("button");
  for (const [button, caption] of [[rescan, "Check again"], [go, "Go to"], [close, "Close"], [apply, "Apply fix"]] as const) { button.type = "button"; button.textContent = caption; }
  actions.append(rescan, go, close, apply); dialog.append(style, title, summary, layout, error, actions); root.append(dialog);
  let issues: AccessibilityIssue[] = [], busy = false;
  function selected(): AccessibilityIssue | undefined { return issues[list.selectedIndex]; }
  function update(): void {
    const issue = selected(); text.textContent = issue?.detail ?? "No findings from these checks. Review reading order, contrast and document meaning as well.";
    label.hidden = issue?.kind !== "description"; description.disabled = !editable;
    apply.textContent = issue?.kind === "header" ? "Use first row as header" : issue?.kind === "heading" ? `Apply Heading ${issue.level}` : "Save alternative text";
    apply.hidden = !issue || issue.kind === "description" && issue.element.kind === "drawing" && !issue.element.shape;
    apply.disabled = busy || !editable; go.disabled = busy || !issue; close.disabled = busy; rescan.disabled = busy; list.disabled = busy;
  }
  function refresh(): void {
    description.value = ""; issues = accessibilityIssues(current()); list.replaceChildren(...issues.map((issue, index) => new Option(`${index + 1}. ${issue.title}`, String(index))));
    list.hidden = !issues.length; layout.classList.toggle("empty", !issues.length); list.selectedIndex = issues.length ? 0 : -1; summary.textContent = `${issues.length} ${issues.length === 1 ? "finding" : "findings"}. Checks alternative text, heading order and table header rows.`; update();
  }
  function dismiss(): void { dialog.close(); dialog.remove(); focus(); }
  list.addEventListener("change", () => { description.value = ""; update(); }); close.addEventListener("click", dismiss); rescan.addEventListener("click", refresh);
  go.addEventListener("click", () => {
    const issue = selected(); if (!issue) return;
    const document = current(), paragraph = issue.element.kind === "paragraph" ? issue.element : document.content.within(issue.element).closest("paragraph").first() ?? document.content.within(issue.element).paragraphs().first();
    dismiss(); if (paragraph) select(paragraph.selection);
  });
  apply.addEventListener("click", () => { void (async () => {
    const issue = selected(); if (!issue || busy || !editable) return;
    const alternative = description.value.trim(); error.textContent = "";
    if (issue.kind === "description" && !alternative) { error.textContent = "Enter alternative text before saving."; description.focus(); return; }
    busy = true; update();
    try {
      const element = issue.element;
      if (issue.kind === "description" && element.kind === "image") await execute({ kind: "imageProperties", imageId: element.id, description: alternative });
      else if (issue.kind === "description" && element.kind === "drawing") await execute({ kind: "shapeProperties", drawingId: element.id, description: alternative });
      else if (issue.kind === "header" && element.kind === "table") await execute({ kind: "properties", targetId: element.rows[0]!.id, row: { header: true } });
      else if (issue.kind === "heading" && element.kind === "paragraph") await execute({ kind: "properties", selection: element.selection, paragraph: { styleId: `Heading${issue.level}` } });
      refresh();
    } catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); }
    finally { busy = false; update(); }
  })(); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) dismiss(); }); refresh(); dialog.showModal(); (issues.length ? list : close).focus();
}
