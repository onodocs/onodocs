import type { DocumentElement } from "@onodocs/sdk";

function asciiText(text: string): string {
  const punctuation: Record<string, string> = { "·": " / ", "—": "--", "–": "-", "“": '"', "”": '"', "‘": "'", "’": "'", "…": "..." };
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7f]/g, character => punctuation[character] ?? "?");
}

function wrap(text: string, width: number): string[] {
  return text.split("\n").flatMap(line => {
    const lines = [""];
    for (const word of line.split(/\s+/).filter(Boolean)) {
      if (lines.at(-1) && lines.at(-1)!.length + word.length + 1 > width) lines.push("");
      lines[lines.length - 1] += `${lines.at(-1) ? " " : ""}${word}`;
    }
    return lines;
  });
}

export function toAscii(element: DocumentElement): string {
  if (element.kind === "paragraph") return wrap(asciiText(element.text), 58).join("\n");
  if (element.kind === "table") {
    const rows = element.rows.map(row => row.cells.map(cell => wrap(cell.children.map(toAscii).join("\n"), 28)));
    const widths: number[] = [];
    for (const row of rows) row.forEach((lines, index) => {
      for (const line of lines) widths[index] = Math.max(widths[index] ?? 0, line.length);
    });
    const border = `+${widths.map(width => "-".repeat(width + 2)).join("+")}+`;
    return [border, ...rows.flatMap(row => {
      const height = Math.max(...row.map(lines => lines.length));
      return [...Array.from({ length: height }, (_, line) => `|${widths.map((width, column) => ` ${(row[column]?.[line] ?? "").padEnd(width)} `).join("|")}|`), border];
    })].join("\n");
  }
  return element.children.map(toAscii).join("\n\n");
}
