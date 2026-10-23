import type { DocumentEdit, DocumentParagraphStyle, ParagraphPropertyPatch } from "@onodocs/sdk";

export const documentStyleSets = [
  { id: "modern", name: "Modern", size: 11, headingSize: 24, bold: false, before: 12, after: 8, multiple: 1.15 },
  { id: "classic", name: "Classic", size: 12, headingSize: 20, bold: true, before: 12, after: 6, multiple: 1 },
  { id: "compact", name: "Compact", size: 10, headingSize: 18, bold: true, before: 6, after: 0, multiple: 1 },
  { id: "report", name: "Report", size: 12, headingSize: 28, bold: true, before: 18, after: 12, multiple: 1.5 }
] as const;
export const documentSpacingSets = [
  { id: "none", name: "No paragraph space", headingSize: 18, bold: true, before: 0, after: 0, multiple: 1 },
  { id: "compact", name: "Compact", headingSize: 18, bold: true, before: 0, after: 4, multiple: 1 },
  { id: "relaxed", name: "Relaxed", headingSize: 18, bold: true, before: 0, after: 8, multiple: 1.15 },
  { id: "double", name: "Double", headingSize: 18, bold: true, before: 0, after: 8, multiple: 2 }
] as const;

export function documentStyleCommands(styles: readonly DocumentParagraphStyle[], id: string, spacing: boolean): Extract<DocumentEdit, { kind: "paragraphStyle" }>[] {
  const preset = (spacing ? documentSpacingSets : documentStyleSets).find(set => set.id === id)!;
  const normal = styles.find(style => style.isDefault) ?? styles.find(style => style.id === "Normal");
  if (!normal) throw new Error("This document has no default paragraph style. Create one in Styles before applying a document preset.");
  return styles.filter(style => style.id === normal.id || style.headingLevel).map(style => {
    const level = style.headingLevel ?? 0;
    const paragraph: ParagraphPropertyPatch = { spacingBefore: level && !spacing ? preset.before : 0, spacingAfter: preset.after, spacingBeforeAuto: false, spacingAfterAuto: false, spacingBeforeLines: null, spacingAfterLines: null, contextualSpacing: false, lineSpacing: { multiple: preset.multiple } };
    return { kind: "paragraphStyle", action: "update", styleId: style.id, paragraph, ...(!spacing && "size" in preset ? { formatting: { fontSize: level ? Math.max(preset.size, preset.headingSize - (level - 1) * 2) : preset.size, ...(level ? { bold: preset.bold, italic: false } : {}) } } : {}) };
  });
}

export const themeColorLabels = { dark1: "Text 1", light1: "Background 1", dark2: "Text 2", light2: "Background 2", accent1: "Accent 1", accent2: "Accent 2", accent3: "Accent 3", accent4: "Accent 4", accent5: "Accent 5", accent6: "Accent 6", hyperlink: "Hyperlink", followedHyperlink: "Followed hyperlink" } as const;
type Theme = Extract<DocumentEdit, { kind: "theme" }>;
export const documentThemes = [
  { id: "office", name: "Office", fonts: { heading: "Calibri", body: "Calibri" }, colors: { dark1: "#000000", light1: "#ffffff", dark2: "#44546a", light2: "#e7e6e6", accent1: "#4472c4", accent2: "#ed7d31", accent3: "#a5a5a5", accent4: "#ffc000", accent5: "#5b9bd5", accent6: "#70ad47", hyperlink: "#0563c1", followedHyperlink: "#954f72" } },
  { id: "editorial", name: "Editorial", fonts: { heading: "Georgia", body: "Arial" }, colors: { dark1: "#202020", light1: "#ffffff", dark2: "#3b4050", light2: "#f2eee6", accent1: "#8b3a32", accent2: "#c18a47", accent3: "#657d62", accent4: "#617d98", accent5: "#94718e", accent6: "#7d8c91", hyperlink: "#275f99", followedHyperlink: "#7e5385" } },
  { id: "nature", name: "Nature", fonts: { heading: "Arial", body: "Calibri" }, colors: { dark1: "#172b24", light1: "#ffffff", dark2: "#314f44", light2: "#edf3e9", accent1: "#326c50", accent2: "#6c9940", accent3: "#b09b48", accent4: "#518b8c", accent5: "#927354", accent6: "#9e695c", hyperlink: "#24708d", followedHyperlink: "#81537d" } }
] as const;
export const documentFontSets = [
  { name: "Calibri", heading: "Calibri", body: "Calibri" },
  { name: "Georgia / Arial", heading: "Georgia", body: "Arial" },
  { name: "Arial", heading: "Arial", body: "Arial" },
  { name: "Times New Roman", heading: "Times New Roman", body: "Times New Roman" }
] as const;
export function documentThemeCommands(styles: readonly DocumentParagraphStyle[], theme: Theme, bindFonts: boolean, bindColors: boolean): Extract<DocumentEdit, { kind: "theme" | "paragraphStyle" }>[] {
  const normal = styles.find(style => style.isDefault) ?? styles.find(style => style.id === "Normal");
  const commands: Extract<DocumentEdit, { kind: "theme" | "paragraphStyle" }>[] = [theme];
  if (bindFonts || bindColors) for (const style of styles) if (style.id === normal?.id || style.headingLevel) commands.push({ kind: "paragraphStyle", action: "update", styleId: style.id, formatting: { ...(bindFonts ? { fontTheme: style.headingLevel ? "major" : "minor" } : {}), ...(bindColors ? { colorTheme: style.headingLevel ? "accent1" : "dark1" } : {}) } });
  return commands;
}


export const coverPageDesigns = [{ id: "simple", name: "Simple" }, { id: "centered", name: "Centered" }, { id: "accent", name: "Accent" }] as const;

export function coverPageParagraphs(values: Readonly<Record<string, string>>, styleId: string | undefined, headingFont: string, bodyFont: string, accent: string, background: string, availableHeight: number): readonly import("@onodocs/sdk").ParagraphContent[] {
  const title = values.title?.trim();
  if (!title) throw new Error("Enter a cover-page title.");
  const centered = values.design === "centered", banded = values.design === "accent";
  const luminance = (color: string) => [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => { const component = Number.parseInt(color.slice(index * 2 + 1, index * 2 + 3), 16) / 255; return sum + weight * (component <= .04045 ? component / 12.92 : ((component + .055) / 1.055) ** 2.4); }, 0);
  const accentLight = luminance(accent), backgroundLight = luminance(background), bodyColor = backgroundLight > .179 ? "#000000" : "#FFFFFF";
  const titleColor = banded ? accentLight > .179 ? "#000000" : "#FFFFFF" : (Math.max(accentLight, backgroundLight) + .05) / (Math.min(accentLight, backgroundLight) + .05) >= 3 ? accent : bodyColor;
  const properties: ParagraphPropertyPatch = { ...(styleId ? { styleId } : {}), spacingBefore: 0, spacingAfter: 12, spacingBeforeAuto: false, spacingAfterAuto: false, spacingBeforeLines: null, spacingAfterLines: null, contextualSpacing: false, lineSpacing: { multiple: 1.15 }, indentStart: 0, indentEnd: 0, firstLine: 0, hanging: 0, pageBreakBefore: false, keepWithNext: true, keepLines: true };
  const content: import("@onodocs/sdk").ParagraphContent[] = [{ alignment: centered ? "center" : "left", list: null, properties: { ...properties, spacingBefore: Math.max(0, Math.min(108, availableHeight * (centered ? .24 : .12))), spacingAfter: 18, ...(banded ? { shading: accent } : {}) }, runs: [{ text: title, formatting: { fontFamily: headingFont, fontSize: 32, bold: true, italic: false, color: titleColor } }] }];
  for (const [key, size] of [["subtitle", 18], ["author", 12], ["date", 11]] as const) {
    const text = values[key]?.trim();
    if (text) content.push({ alignment: centered ? "center" : "left", list: null, properties: { ...properties, ...(key === "author" ? { spacingBefore: 24 } : {}) }, runs: [{ text, formatting: { fontFamily: bodyFont, fontSize: size, bold: false, italic: false, color: bodyColor } }] });
  }
  content.push({ list: null, properties: { ...properties, spacingAfter: 0, keepWithNext: false }, runs: [{ text: "\n", breaks: [{ offset: 0, type: "page" }], formatting: { fontSize: 1 } }] });
  return content;
}

export interface DefaultDocumentDesign {
  readonly theme?: import("@onodocs/sdk").DocumentTheme;
  readonly styles: readonly DocumentParagraphStyle[];
}

export function defaultDesignCommands(styles: readonly DocumentParagraphStyle[], design: DefaultDocumentDesign): Extract<DocumentEdit, { kind: "theme" | "paragraphStyle" }>[] {
  const normal = styles.find(style => style.isDefault) ?? styles.find(style => style.id === "Normal");
  if (!normal) throw new Error("The blank document has no default paragraph style.");
  const commands: Extract<DocumentEdit, { kind: "theme" | "paragraphStyle" }>[] = design.theme ? [{ kind: "theme", ...design.theme }] : [];
  for (const source of design.styles) {
    const target = source.isDefault ? normal : styles.find(style => style.id === source.id);
    const { styleId: _, ...paragraph } = source.paragraph ?? {};
    commands.push({ kind: "paragraphStyle", action: target ? "update" : "create", styleId: target?.id ?? source.id, name: target?.name ?? source.name, ...(source.headingLevel ? { headingLevel: source.headingLevel, basedOn: normal.id, next: normal.id } : {}), paragraph, formatting: source.formatting ?? {} });
  }
  return commands;
}
