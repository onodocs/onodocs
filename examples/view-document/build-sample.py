from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
from xml.sax.saxutils import escape

root = Path(__file__).parent
word = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def paragraph(text, size=25, color='302820', before=0, after=120, bold=False):
    return f'<w:p><w:pPr><w:spacing w:before="{before}" w:after="{after}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="{size}"/><w:color w:val="{color}"/>{"<w:b/>" if bold else ""}</w:rPr><w:t>{escape(text)}</w:t></w:r></w:p>'

def cell(content, width, fill='FFFFFF', title=None):
    if title:
        content = f'<w:sdt><w:sdtPr><w:tag w:val="delivery-date"/><w:alias w:val="{escape(title)}"/></w:sdtPr><w:sdtContent>{content}</w:sdtContent></w:sdt>'
    return f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/><w:shd w:fill="{fill}"/><w:vAlign w:val="top"/></w:tcPr>{content}</w:tc>'

image = '''<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1828800" cy="1219200"/><wp:docPr id="1" name="Fieldwork packaging concept" descr="Forest-green coffee cup and cream coffee bag on a terracotta table"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="Fieldwork packaging"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="1219200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'''
summary = paragraph('A familiar place. A fresh identity.', 28, bold=True, after=120) + paragraph('Create a welcoming identity for a neighborhood coffee company, from the morning cup to the shopfront.', after=120)
overview = '<w:tbl><w:tblPr><w:tblW w:w="7680" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="240" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4560"/><w:gridCol w:w="3120"/></w:tblGrid><w:tr>' + cell(summary, 4560) + cell(image, 3120) + '</w:tr></w:tbl>'
rows = [('Deliverable', 'Owner', 'Due'), ('Identity & packaging', 'Maya', 'Nov 04'), ('Shopfront & menu', 'Eli', 'Nov 11'), ('Launch-ready files', 'Noor', 'Nov 18')]
widths = [4320, 1440, 1920]
table = '<w:tbl><w:tblPr><w:tblW w:w="7680" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:bottom w:val="single" w:sz="4" w:color="DED5CB"/><w:insideH w:val="single" w:sz="4" w:color="DED5CB"/></w:tblBorders><w:tblCellMar><w:top w:w="220" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="220" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + ''.join(f'<w:gridCol w:w="{width}"/>' for width in widths) + '</w:tblGrid>' + ''.join('<w:tr>' + ''.join(cell(paragraph(text, 23, after=0, bold=i==0), width, 'F0E8DD' if i==0 else 'FFFFFF', row[0] if i > 0 and width == 1920 else None) for text, width in zip(row, widths)) + '</w:tr>' for i, row in enumerate(rows)) + '</w:tbl>'
body = paragraph('NORTH STUDIO  /  CLIENT BRIEF', 19, 'A94732', after=240, bold=True) + paragraph('Brand launch brief', 52, after=100) + paragraph('Fieldwork Coffee   ·   Launch 18 November 2026', 23, '706257', after=480) + overview + paragraph('DELIVERABLES & DATES', 19, 'A94732', before=480, after=240, bold=True) + table + paragraph('Client approval:', 21, '706257', before=480, after=240) + paragraph('Date: __________', 21, '706257', after=900) + '<w:sectPr><w:pgSz w:w="8640" w:h="11520"/><w:pgMar w:top="480" w:right="480" w:bottom="480" w:left="480" w:header="0" w:footer="0"/></w:sectPr>'
document = f'<w:document xmlns:w="{word}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>{body}</w:body></w:document>'
types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
rels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="doc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
images = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="image" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/fieldwork.png"/></Relationships>'
with ZipFile(root/'sample.docx', 'w', ZIP_DEFLATED) as output:
    for name, data in [('[Content_Types].xml', types), ('_rels/.rels', rels), ('word/document.xml', document), ('word/_rels/document.xml.rels', images), ('word/media/fieldwork.png', (root/'fieldwork-product.png').read_bytes())]:
        entry = ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        output.writestr(entry, data)
