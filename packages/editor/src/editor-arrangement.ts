import type { BrowserDocument } from "@onodocs/sdk/browser";
import type { DocumentEdit } from "@onodocs/sdk";

export function arrangeObjects(document: BrowserDocument, ids: readonly string[], relative: string, horizontal: string, vertical: string): DocumentEdit {
  const objects = ids.map(id => {
    const element = document.content.get(id);
    if (!element || element.kind !== "image" && element.kind !== "drawing" || element.kind === "drawing" && !element.shape && !element.group) throw new Error("Select editable pictures or shapes in the Selection Pane.");
    const fragment = document.geometry.fragments(element)[0], paragraph = document.content.within(element).closest("paragraph").first();
    if (!fragment || !paragraph) throw new Error("Selected objects must have a visible position.");
    const layout = element.kind === "image" ? element.layout : (element.shape ?? element.group)!.layout;
    return { element, fragment, paragraph, layout, x: fragment.rectangle.x / 20, y: fragment.rectangle.y / 20 };
  });
  if (objects.length < 2) throw new Error("Select at least two objects in the Selection Pane.");
  const first = objects[0]!;
  if (objects.some(object => object.fragment.pageIndex !== first.fragment.pageIndex || object.element.story !== first.element.story || document.content.within(object.element).closest("story").first()?.id !== document.content.within(first.element).closest("story").first()?.id)) throw new Error("Arrange objects on the same page and in the same document story.");
  const storyId = document.content.within(first.element).closest("story").first()?.id;
  const page = document.pages[first.fragment.pageIndex]!, margins = document.content.sections().all().find(section => section.index === first.paragraph.sectionIndex || section.headersFooters.some(slot => slot.storyId === storyId))?.properties.authored.margins;
  for (const [axis, size, action] of [["x", "width", horizontal], ["y", "height", vertical]] as const) {
    if (action === "unchanged") continue;
    const start = relative === "selection" ? objects.reduce((minimum, object) => Math.min(minimum, object.fragment.bounds[axis] / 20), Infinity) : relative === "margin" ? margins?.[axis === "x" ? "left" : "top"] ?? 72 : 0;
    const end = relative === "selection" ? objects.reduce((maximum, object) => Math.max(maximum, (object.fragment.bounds[axis] + object.fragment.bounds[size]) / 20), -Infinity) : page.size[size] / 20 - (relative === "margin" ? margins?.[axis === "x" ? "right" : "bottom"] ?? 72 : 0);
    if (action === "distribute") {
      const ordered = [...objects].sort((a, b) => a.fragment.bounds[axis] - b.fragment.bounds[axis]);
      const gap = (end - start - ordered.reduce((sum, object) => sum + object.fragment.bounds[size] / 20, 0)) / (ordered.length - 1);
      let next = start;
      for (const object of ordered) { object[axis] += next - object.fragment.bounds[axis] / 20; next += object.fragment.bounds[size] / 20 + gap; }
    } else {
      for (const object of objects) {
        const length = object.fragment.bounds[size] / 20;
        const next = action === "center" ? (start + end - length) / 2 : action === "right" || action === "bottom" ? end - length : start;
        object[axis] += next - object.fragment.bounds[axis] / 20;
      }
    }
  }
  return { kind: "batch", commands: objects.map(object => ({ ...(object.element.kind === "image" ? { kind: "imageProperties" as const, imageId: object.element.id } : { kind: object.element.group ? "groupProperties" as const : "shapeProperties" as const, drawingId: object.element.id }), layout: { ...(object.layout.wrap === "inline" ? { wrap: "square" as const } : {}), horizontal: { relativeTo: "page", offset: object.x }, vertical: { relativeTo: "page", offset: object.y } } })) };
}
