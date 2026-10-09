/** Spec: spec/features/document-modes.md */
/** Spec: spec/features/document-review.md */
import type { WordEditor } from "./editor.js";
import type { DocumentReview, ReviewIdentity } from "@onodocs/sdk";
import { compareDocuments, type DocumentDifference, type RevisionHistoryStore } from "@onodocs/sdk";

export interface EditorReviewOptions {
  readonly identity: () => ReviewIdentity;
  readonly history?: RevisionHistoryStore;
}

type ReviewPanelTab = "comments" | "changes" | "compare" | "history";

export function createReviewPanel(root: ShadowRoot, editor: WordEditor, options: EditorReviewOptions, signal: AbortSignal, onStateChange?: () => void) {
  const panel = document.createElement("aside"), header = document.createElement("header"), heading = document.createElement("h2"), tabs = document.createElement("div"), content = document.createElement("div"), status = document.createElement("p");
  panel.className = "review-panel"; panel.setAttribute("aria-label", "Document review"); panel.setAttribute("part", "review"); panel.hidden = true;
  heading.textContent = "Review"; tabs.className = "review-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Review details");
  content.className = "review-content"; content.setAttribute("role", "tabpanel"); content.id = "review-content";
  status.className = "review-status"; status.setAttribute("role", "status"); header.append(heading); panel.append(header, tabs, content, status); root.append(panel);
  const style = document.createElement("style"); style.textContent = `
:host([data-review-open=true]){display:grid;grid-template-columns:minmax(0,1fr) 350px}:host([data-review-open=true])>nav,:host([data-review-open=true])>footer{grid-column:1/-1;min-width:0}:host([data-review-open=true])>main{grid-column:1;grid-row:2;width:calc(100% - 40px)}
.review-panel{min-width:0;grid-column:2;grid-row:2;align-self:start;position:sticky;top:164px;max-height:calc(100vh - 180px);min-height:300px;display:flex;flex-direction:column;margin:20px 16px 20px 0;background:white;border:1px solid #d7dce2;border-radius:8px;box-shadow:0 2px 8px #17212d08;overflow:hidden}.review-panel header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}.review-panel h2{font-size:18px;margin:0}.review-panel h3{font-size:14px;margin:0 0 10px}.review-panel p{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0;line-height:1.5}.review-panel small{color:#66717f;line-height:1.5}.review-panel article>small{display:block;margin-top:8px}.review-panel button{border:1px solid #dce1e6;height:auto;min-height:32px;padding:5px 9px}.review-panel button.primary{background:var(--onodocs-accent,#a33327);color:white;border-color:transparent}.review-panel button.primary:hover{background:#87291f}.review-panel button.quiet{border-color:transparent;color:#566373}.review-panel button:disabled{opacity:.45}.review-tabs{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid #e4e7eb}.review-tabs button{flex:1;border:0;border-radius:0;border-bottom:2px solid transparent;font-size:12px;padding:10px 5px}.review-tabs button[aria-selected=true]{border-bottom-color:var(--onodocs-accent,#a33327);color:var(--onodocs-accent,#a33327);font-weight:600}.review-content{padding:16px;overflow:auto;min-height:0}.review-panel .review-summary{color:#66717f;font-size:12px;margin:0 0 12px}.review-panel .review-empty{padding:20px 0;color:#66717f}.review-panel .review-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.review-panel article{padding:14px 12px;border:1px solid #e1e5ea;border-radius:6px;margin-top:12px;background:#fff}.review-panel article[data-active=true]{border-color:var(--onodocs-accent,#a33327);box-shadow:0 0 0 1px var(--onodocs-accent,#a33327)}.review-panel article[data-resolved=true]{background:#f6f7f9}.review-panel .review-author{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.review-panel .review-author strong{font-weight:600;overflow-wrap:anywhere}.review-panel .review-badge{background:#edf3f0;color:#376656;font-size:11px;padding:3px 6px;border-radius:4px;white-space:nowrap}.review-panel .reply{margin-top:12px;padding-left:10px;border-left:2px solid #e4e7eb}.review-panel label{display:grid;gap:6px;margin-top:12px}.review-panel input,.review-panel textarea{position:static;opacity:1;width:100%;height:auto;min-height:36px;padding:8px;border:1px solid #cbd3dc;background:white;border-radius:5px;resize:vertical;font:inherit;line-height:1.5;pointer-events:auto}.review-panel textarea{min-height:76px}.review-panel input[type=file]{font-size:12px}.review-panel .review-toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:#66717f;margin:12px 0}.review-panel input[type=checkbox]{width:16px;min-height:16px;margin:0}.review-panel .review-status:empty{display:none}.review-panel .review-status{padding:10px 16px;border-top:1px solid #e4e7eb;margin:0;font-size:12px}.review-panel .comparison-before{border-left:3px solid #bd655a;padding-left:9px}.review-panel .comparison-after{border-left:3px solid #418877;padding-left:9px}
@media(max-width:900px){:host([data-review-open=true]){grid-template-columns:minmax(0,1fr)}:host([data-review-open=true])>main{grid-column:1;grid-row:3;width:calc(100% - 24px)}.review-panel{grid-column:1;grid-row:2;position:static;max-height:460px;min-height:0;margin:12px}.review-panel button{min-height:44px}.review-content{padding:12px 16px}.review-panel header{padding-top:12px}}
`; root.append(style);
  let state: DocumentReview | undefined, activeTab: ReviewPanelTab = "comments", activeComment: string | undefined, activeRevision: string | undefined, showResolved = false;
  let comparison: { query: unknown; name: string; differences: readonly DocumentDifference[] } | undefined;
  const drafts = new Map<string, string>(), tabButtons = new Map<ReviewPanelTab, HTMLButtonElement>();
  const run = (action: () => Promise<unknown>) => { status.textContent = ""; void action().catch(error => { if (!signal.aborted) status.textContent = error instanceof Error ? error.message : String(error); }); };
  function button(parent: HTMLElement, label: string, action: () => Promise<unknown>, disabled = false, className = "", navigates = false): HTMLButtonElement {
    const node = document.createElement("button"); node.type = "button"; node.textContent = label; node.disabled = disabled; node.className = className;
    node.addEventListener("click", () => run(async () => {
      const left = window.scrollX, top = window.scrollY;
      await action();
      if (!panel.hidden && !navigates) { if (!node.isConnected) tabButtons.get(activeTab)?.focus({ preventScroll: true }); window.scrollTo(left, top); }
    }), { signal }); parent.append(node); return node;
  }
  function text(parent: HTMLElement, value: string, tag = "p"): HTMLElement { const node = document.createElement(tag); node.textContent = value; parent.append(node); return node; }
  function actions(parent: HTMLElement): HTMLElement { const node = document.createElement("div"); node.className = "review-actions"; parent.append(node); return node; }
  function input(parent: HTMLElement, label: string, key = label, multiline = false): HTMLInputElement | HTMLTextAreaElement {
    const field = document.createElement("label"), node = multiline ? document.createElement("textarea") : document.createElement("input");
    text(field, label, "span"); node.setAttribute("aria-label", label); node.dataset.draft = key; node.value = drafts.get(key) ?? "";
    node.readOnly = editor.mode !== "edit" && editor.mode !== "review"; node.addEventListener("input", () => drafts.set(key, node.value), { signal }); field.append(node); parent.append(field); return node;
  }
  function visibility(visible: boolean): void { panel.hidden = !visible; if (visible) editor.element.setAttribute("data-review-open", "true"); else editor.element.removeAttribute("data-review-open"); }
  button(header, "Close", async () => { visibility(false); root.querySelector<HTMLButtonElement>('button[role=tab][aria-label=Review]')?.focus(); }, false, "quiet").setAttribute("aria-label", "Close review pane");
  for (const [key, label] of [["comments", "Comments"], ["changes", "Changes"], ["compare", "Compare"], ...(options.history ? [["history", "History"]] : [])] as [ReviewPanelTab, string][]) {
    const tab = button(tabs, label, async () => show(key)); tab.setAttribute("role", "tab"); tab.id = `review-tab-${key}`; tab.setAttribute("aria-controls", content.id); tabButtons.set(key, tab);
    tab.addEventListener("keydown", event => { const keys = [...tabButtons.keys()]; let index = keys.indexOf(key); if (event.key === "ArrowRight") index++; else if (event.key === "ArrowLeft") index--; else if (event.key === "Home") index = 0; else if (event.key === "End") index = keys.length - 1; else return; event.preventDefault(); const next = keys[(index + keys.length) % keys.length]!; run(async () => { await show(next); tabButtons.get(next)!.focus(); }); }, { signal });
  }
  async function refresh(): Promise<void> { try { await render(); } catch (error) { if (!signal.aborted) status.textContent = error instanceof Error ? error.message : String(error); } }
  async function show(tab: ReviewPanelTab = activeTab): Promise<void> { activeTab = tab === "history" && !options.history ? "comments" : tab; visibility(true); await refresh(); }
  function revisionItems() {
    const items: { revision: DocumentReview["revisions"][number]; ids: string[] }[] = [];
    for (const revision of state?.revisions ?? []) {
      const previous = items.at(-1), before = previous?.revision, end = before?.selection?.end, start = revision.selection?.start;
      if (previous && before?.kind === "ins" && revision.kind === "ins" && before.author === revision.author && end && start && end.paragraphId === start.paragraphId && end.offset === start.offset) {
        previous.ids.push(revision.id); previous.revision = { ...before, text: before.text + revision.text, selection: { start: before.selection!.start, end: revision.selection!.end } };
      } else items.push({ revision, ids: [revision.id] });
    }
    return items;
  }
  async function navigate(kind: "comment" | "change", direction: 1 | -1): Promise<void> {
    await show(kind === "comment" ? "comments" : "changes");
    const items = kind === "comment" ? state?.comments.filter(c => c.parentId === undefined) : revisionItems().map(item => item.revision);
    if (!items?.length) return;
    const current = kind === "comment" ? activeComment : activeRevision, index = items.findIndex(item => item.id === current);
    const item = items[index < 0 ? direction > 0 ? 0 : items.length - 1 : (index + direction + items.length) % items.length]!;
    if (kind === "comment") { activeComment = item.id; if ("resolved" in item && item.resolved) showResolved = true; } else activeRevision = item.id;
    if (item.selection) editor.select(item.selection); await refresh(); content.querySelector('[data-active=true]')?.scrollIntoView({ block: "nearest" });
  }
  async function render(): Promise<void> {
    if (!editor.document) { state = undefined; onStateChange?.(); return; }
    const mode = editor.mode, currentDocument = editor.document, query = currentDocument.query, readOnly = mode !== "edit" && mode !== "review";
    const nextState = await currentDocument.readReview({ signal });
    if (editor.mode !== mode || editor.document?.query !== query || signal.aborted) return;
    state = nextState; onStateChange?.();
    if (panel.hidden) return;
    if (comparison && comparison.query !== query) comparison = undefined;
    const focused = root.activeElement instanceof HTMLInputElement || root.activeElement instanceof HTMLTextAreaElement ? root.activeElement : undefined;
    const focusedKey = focused?.dataset.draft, start = focused?.selectionStart, end = focused?.selectionEnd, scroll = content.scrollTop;
    for (const [key, tab] of tabButtons) { tab.setAttribute("aria-selected", String(key === activeTab)); tab.tabIndex = key === activeTab ? 0 : -1; }
    content.setAttribute("aria-labelledby", `review-tab-${activeTab}`); content.replaceChildren();
    if (activeTab === "comments") {
      const threads = state.comments.filter(c => c.parentId === undefined), openCount = threads.filter(c => !c.resolved).length;
      text(content, `${openCount} open ${openCount === 1 ? "thread" : "threads"}`, "p").className = "review-summary";
      if (!readOnly) {
        const message = input(content, "New comment", "New comment", true);
        button(actions(content), "Post comment", async () => { if (!message.value.trim()) throw new Error("Enter a comment."); if (!editor.selection) throw new Error("Select text to comment on."); const value = message.value; drafts.delete("New comment"); try { await editor.review({ kind: "comment", selection: editor.selection, text: value, identity: options.identity() }); } catch (error) { drafts.set("New comment", value); throw error; } }, false, "primary");
      }
      const filter = document.createElement("label"), checkbox = document.createElement("input"); filter.className = "review-toggle"; checkbox.type = "checkbox"; checkbox.checked = showResolved; checkbox.addEventListener("change", () => { showResolved = checkbox.checked; run(refresh); }, { signal }); filter.append(checkbox, "Show resolved comments"); content.append(filter);
      const visible = threads.filter(c => showResolved || !c.resolved);
      if (!visible.length) text(content, threads.length ? "All comments are resolved." : "Select text in the document to start a conversation.").className = "review-empty";
      const replies = new Map<string, typeof state.comments[number][]>();
      for (const comment of state.comments) if (comment.parentId !== undefined) { const list = replies.get(comment.parentId) ?? []; list.push(comment); replies.set(comment.parentId, list); }
      for (const comment of visible) {
        const article = document.createElement("article"), author = document.createElement("div"); article.dataset.resolved = String(comment.resolved); article.dataset.active = String(activeComment === comment.id); author.className = "review-author"; text(author, comment.author, "strong"); text(author, comment.resolved ? "Resolved" : "Open", "span").className = "review-badge"; article.append(author); content.append(article);
        text(article, comment.text);
        if (comment.selection) button(article, "Go to comment", async () => { activeComment = comment.id; editor.select(comment.selection!); await refresh(); }, false, "quiet", true);
        for (const reply of replies.get(comment.id) ?? []) { const entry = document.createElement("div"); entry.className = "reply"; text(entry, reply.author, "small"); text(entry, reply.text); article.append(entry); }
        if (!readOnly) {
          if (!comment.resolved) {
            const reply = input(article, `Reply to ${comment.author}`, `reply:${comment.id}`);
            button(actions(article), "Reply", async () => { if (!reply.value.trim()) throw new Error("Enter a reply."); const value = reply.value; drafts.delete(`reply:${comment.id}`); try { await editor.review({ kind: "reply", id: comment.id, text: value, identity: options.identity() }); } catch (error) { drafts.set(`reply:${comment.id}`, value); throw error; } });
          }
          const threadActions = actions(article); button(threadActions, comment.resolved ? "Reopen" : "Resolve", () => editor.review({ kind: "resolveComment", id: comment.id, resolved: !comment.resolved })); button(threadActions, "Delete thread", () => editor.review({ kind: "deleteComment", id: comment.id }), false, "quiet");
        }
      }
    } else if (activeTab === "changes") {
      const items = revisionItems();
      text(content, `${items.length} pending ${items.length === 1 ? "change" : "changes"}`, "p").className = "review-summary";
      text(content, mode === "edit" ? state.tracking ? "Your text and formatting edits are being recorded." : "Turn on Track changes in the Review ribbon before editing to record your changes." : "Switch to Editing to record new changes.", "p").className = "review-summary";
      if (state.revisions.length) { const all = actions(content); button(all, "Accept all", () => editor.review({ kind: "revision", accept: true }), readOnly); button(all, "Reject all", () => editor.review({ kind: "revision", accept: false }), readOnly); }
      else text(content, "No changes to review.").className = "review-empty";
      for (const { revision, ids } of items) {
        const article = document.createElement("article"); article.dataset.active = String(activeRevision === revision.id); content.append(article); text(article, revision.author, "strong"); text(article, ({ ins: "Inserted text", del: "Deleted text", rPrChange: "Formatting change", pPrChange: "Paragraph formatting" } as Record<string, string>)[revision.kind] ?? "Document change", "p").className = "review-summary"; text(article, revision.text);
        if (revision.selection) button(article, "Go to change", async () => { activeRevision = revision.id; editor.select(revision.selection!); await refresh(); }, false, "quiet", true);
        const decisions = actions(article); button(decisions, "Accept", () => editor.review({ kind: "revision", ids, accept: true }), readOnly, "primary"); button(decisions, "Reject", () => editor.review({ kind: "revision", ids, accept: false }), readOnly);
      }
    } else if (activeTab === "compare") {
      text(content, "Compare documents", "h3"); text(content, "Choose an earlier Word document to see what changed in the current document.", "p").className = "review-summary";
      const label = document.createElement("label"), file = document.createElement("input"); text(label, "Earlier document", "span"); file.type = "file"; file.accept = ".docx"; file.setAttribute("aria-label", "Compare Word document"); label.append(file); content.append(label);
      file.addEventListener("change", () => run(async () => { const selected = file.files?.[0]; if (selected) await compare(new Uint8Array(await selected.arrayBuffer()), selected.name); }), { signal });
      if (comparison) {
        text(content, comparison.name, "p"); text(content, `Comparison (${comparison.differences.length})`, "h3");
        if (!comparison.differences.length) text(content, "No text or formatting differences.").className = "review-empty";
        for (const difference of comparison.differences) { const article = document.createElement("article"); content.append(article); text(article, ({ insert: "Added", delete: "Removed", replace: "Text changed", format: "Formatting changed" })[difference.kind], "strong"); if (difference.before) { text(article, "Earlier", "small"); text(article, difference.before).className = "comparison-before"; } if (difference.after) { text(article, "Current", "small"); text(article, difference.after).className = "comparison-after"; } if (difference.afterSelection) button(actions(article), "Go to difference", async () => editor.select(difference.afterSelection!), false, "quiet", true); }
      }
    } else if (options.history) {
      text(content, "Version history", "h3"); text(content, "Save a named version before making changes. Compare or restore it later.", "p").className = "review-summary";
      if (!readOnly) { const label = input(content, "Version label"); button(actions(content), "Save version", async () => { if (!label.value.trim()) throw new Error("Enter a version label."); const value = label.value, bytes = await editor.save(); await options.history!.save({ id: crypto.randomUUID(), label: value, ...options.identity() }, bytes, signal); drafts.delete("Version label"); await refresh(); }, false, "primary"); }
      const versions = await options.history.list(signal);
      if (editor.mode !== mode || editor.document?.query !== query || panel.hidden || activeTab !== "history") return;
      if (!versions.length) text(content, "No saved versions yet.").className = "review-empty";
      for (const version of versions) { const article = document.createElement("article"); content.append(article); text(article, version.label, "strong"); text(article, version.author, "p"); text(article, new Date(version.date).toLocaleString(), "small"); const controls = actions(article); button(controls, "Compare version", async () => compare(await options.history!.load(version.id, signal), version.label)); button(controls, "Restore version", async () => { await editor.restore(await options.history!.load(version.id, signal)); }, mode !== "edit"); }
    }
    content.scrollTop = scroll;
    if (focusedKey) for (const node of content.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-draft]")) if (node.dataset.draft === focusedKey) { node.focus(); if (start !== null && start !== undefined) node.setSelectionRange(start, end ?? start); break; }
  }
  async function compare(bytes: Uint8Array<ArrayBuffer>, name: string): Promise<void> { const current = editor.document!, query = current.query, differences = await compareDocuments(bytes, current, { signal }); if (editor.document !== current || current.query !== query) return; comparison = { query, name, differences }; await show("compare"); }
  return { get state() { return state; }, async setMode() { visibility(editor.mode === "review"); await refresh(); }, async toggle() { visibility(!!panel.hidden); await refresh(); }, show, navigate, async newComment() { await show("comments"); content.querySelector<HTMLTextAreaElement>('textarea[aria-label="New comment"]')?.focus(); }, refresh };
}
