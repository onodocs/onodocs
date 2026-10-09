import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import { templateTag } from "@onodocs/sdk";

const directory = new URL("./", import.meta.url);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 96, height: 96 }, deviceScaleFactor: 2 });
  await page.setContent(`<style>body{margin:0}</style>${await readFile(new URL("logo.svg", directory), "utf8")}`);
  await page.screenshot({ path: fileURLToPath(new URL("logo.png", directory)), omitBackground: true });
} finally { await browser.close(); }

const xml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const run = text => `<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
const paragraph = (style, content) => `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${content}</w:p>`;
const control = (binding, content) => `<w:sdt><w:sdtPr><w:tag w:val="${xml(templateTag(binding))}"/></w:sdtPr><w:sdtContent>${content}</w:sdtContent></w:sdt>`;
const value = (path, placeholder, format) => control({ kind: "value", path: path.split("."), ...(format ? { format } : {}) }, run(placeholder));
const money = { kind: "number", options: { style: "currency", currency: "USD" } };
const widths = [5040, 1080, 1800, 2160];
const cell = (content, index, heading = false) => `<w:tc><w:tcPr><w:tcW w:w="${widths[index]}" w:type="dxa"/>${heading ? '<w:shd w:fill="EDF2EF"/>' : ""}</w:tcPr>${paragraph(heading ? "TableHeading" : "TableBody", content)}</w:tc>`;
const table = `<w:tbl><w:tblPr><w:tblW w:w="10080" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar><w:tblBorders><w:bottom w:val="single" w:sz="4" w:color="DCE4DF"/><w:insideH w:val="single" w:sz="4" w:color="E7EBE8"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map(width => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr>${["Service", "Days", "Rate", "Amount"].map((text, index) => cell(run(text), index, true)).join("")}</w:tr>${control({ kind: "repeat", path: ["items"] }, `<w:tr>${[value("description", "Service description"), value("quantity", "1", { kind: "number" }), value("rate", "$900.00", money), value("amount", "$900.00", money)].map((content, index) => cell(content, index)).join("")}</w:tr>`)}</w:tbl>`;
const logo = `<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="254000" cy="254000"/><wp:docPr id="1" name="Northline Studio mark" descr="Northline Studio"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="Northline Studio"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdlogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="254000" cy="254000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
const content = [
  paragraph("Brand", control({ kind: "image", path: ["logo"], width: 20, height: 20, description: "Northline Studio" }, logo) + run("   NORTHLINE / STUDIO")),
  paragraph("Title", run("Project proposal")),
  paragraph("Subtitle", value("project", "Your project")),
  paragraph("Meta", run("PREPARED FOR ") + value("client", "Client company") + run("  /  ") + value("contact", "Contact name")),
  paragraph("Meta", value("date", "October 8, 2026", { kind: "date", options: { year: "numeric", month: "long", day: "numeric" } })),
  paragraph("Heading1", run("01   A shared direction")),
  paragraph("Normal", value("summary", "An overview of the project and its intended outcome.")),
  paragraph("Heading1", run("02   Scope & investment")),
  table,
  paragraph("Total", run("Total investment    ") + value("total", "$900.00", money)),
  paragraph("Heading1", run("03   How we will work")),
  paragraph("Normal", value("timeline", "The agreed delivery plan.")),
  paragraph("Normal", run("We will share work in progress, discuss your feedback and agree the next steps together. Fees exclude applicable taxes. A 50% deposit reserves the project; the balance is due at handoff.")),
  control({ kind: "if", path: ["includeSupport"] }, paragraph("Normal", run("Launch support is included: two review calls in the first month after launch to answer your team's questions and agree any follow-up work."))),
  paragraph("Closing", run("Ready when you are.")),
  control({ kind: "section", name: "studio-contact" }, paragraph("Meta", value("name", "Contact name") + run("  /  ") + value("role", "Team role") + run("  /  ") + value("email", "Email address"))),
  control({ kind: "include", name: "studio-contact", path: ["studioLead"] }, paragraph("Meta", run("Your studio lead"))),
  control({ kind: "include", name: "studio-contact", path: ["deliveryLead"] }, paragraph("Meta", run("Your delivery lead"))),
].join("");
const parts = unzipSync(await readFile(new URL("sample.docx", directory)));
parts["word/document.xml"] = strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${content}<w:sectPr><w:footerReference w:type="default" r:id="rIdfooter"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="900" w:right="1080" w:bottom="900" w:left="1080" w:header="540" w:footer="540"/></w:sectPr></w:body></w:document>`);
parts["word/media/logo.png"] = new Uint8Array(await readFile(new URL("logo.png", directory)));
const types = strFromU8(parts["[Content_Types].xml"]);
if (!types.includes('Extension="png"')) parts["[Content_Types].xml"] = strToU8(types.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>'));
const relationships = strFromU8(parts["word/_rels/document.xml.rels"]);
if (!relationships.includes('Id="rIdlogo"')) parts["word/_rels/document.xml.rels"] = strToU8(relationships.replace("</Relationships>", '<Relationship Id="rIdlogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>'));
await writeFile(new URL("sample.docx", directory), zipSync(parts, { level: 6, mtime: new Date("2026-10-08T00:00:00Z") }));
