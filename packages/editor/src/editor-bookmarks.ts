import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit, DocumentSelection } from "@onodocs/sdk";

export function showBookmarks(root: ShadowRoot, current: () => BrowserDocument, selection: DocumentSelection, editable: boolean, execute: (edit: DocumentEdit) => Promise<unknown>, select: (selection: DocumentSelection) => void, focus: () => void): void {
  const dialog = document.createElement("dialog"), form = document.createElement("form"), title = document.createElement("h2"), listLabel = document.createElement("label"), list = document.createElement("select"), nameLabel = document.createElement("label"), name = document.createElement("input"), hint = document.createElement("small"), actions = document.createElement("div"), error = document.createElement("p");
  dialog.ariaLabel = "Bookmarks"; dialog.className = "bookmark-dialog"; title.textContent = "Bookmarks";
  listLabel.textContent = "Existing bookmarks"; list.size = 6; list.ariaLabel = "Existing bookmarks"; listLabel.append(list);
  nameLabel.textContent = "Bookmark name"; name.ariaLabel = "Bookmark name"; name.maxLength = 40; name.autocomplete = "off"; nameLabel.append(name);
  hint.textContent = "Start with a letter; use letters, numbers and underscores. Add marks the selected text or cursor position.";
  actions.className = "dialog-actions"; error.setAttribute("role", "alert"); error.hidden = true;
  const add = document.createElement("button"), remove = document.createElement("button"), go = document.createElement("button"), close = document.createElement("button");
  for (const [button, label] of [[add, "Add"], [remove, "Delete"], [go, "Go to"], [close, "Close"]] as const) { button.type = "button"; button.textContent = label; }
  add.type = "submit"; add.className = "primary"; actions.append(go, remove, close, add); form.append(title, listLabel, nameLabel, hint, error, actions); dialog.append(form); root.append(dialog);
  let busy = false;
  function refresh(): void {
    const previous = list.value; list.replaceChildren();
    for (const bookmark of [...current().content.bookmarks().all()].sort((a, b) => a.name.localeCompare(b.name))) list.add(new Option(bookmark.name, bookmark.name));
    if ([...list.options].some(option => option.value === previous)) list.value = previous;
    if (!list.value && list.options.length) list.selectedIndex = 0;
    update();
  }
  function update(): void { add.disabled = busy || !editable || !name.value.trim(); remove.disabled = busy || !editable || !list.value; go.disabled = busy || !list.value; close.disabled = busy; }
  function dismiss(): void { dialog.close(); dialog.remove(); focus(); }
  async function change(edit: DocumentEdit): Promise<void> {
    busy = true; error.hidden = true; update();
    try { await execute(edit); dismiss(); }
    catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); error.hidden = false; }
    finally { busy = false; update(); }
  }
  form.addEventListener("submit", event => { event.preventDefault(); if (!add.disabled) void change({ kind: "bookmark", action: "add", name: name.value.trim(), selection }); });
  remove.addEventListener("click", () => { if (list.value) void change({ kind: "bookmark", action: "remove", name: list.value }); });
  go.addEventListener("click", () => { const bookmark = current().content.bookmarks().where({ name: list.value }).first(); if (bookmark) { const anchor = bookmark.selection.start; dismiss(); select({ start: anchor, end: anchor }); } });
  list.addEventListener("change", update); name.addEventListener("input", update); close.addEventListener("click", dismiss);
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) dismiss(); }); refresh(); dialog.showModal(); (editable ? name : list).focus();
}
