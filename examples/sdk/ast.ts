import type { DocumentElement } from "@onodocs/sdk";

export function tree(element: DocumentElement, depth = 0): string {
  const label = element.kind === "paragraph" ? ` ${JSON.stringify(element.text.trim())}`
    : element.kind === "story" ? ` (${element.story})` : "";
  const children = element.kind === "paragraph" ? []
    : element.children.filter(child => child.kind !== "run");
  return [
    `${"  ".repeat(depth)}${element.kind}${label}`,
    ...children.map(child => tree(child, depth + 1))
  ].join("\n");
}
