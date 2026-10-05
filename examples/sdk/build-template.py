from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from xml.sax.saxutils import escape

root = Path(__file__).parent

def paragraph(text, size=24, color='302820', bold=False, tag=None, after=160):
    run = f'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="{size}"/><w:color w:val="{color}"/>{"<w:b/>" if bold else ""}</w:rPr><w:t>{escape(text)}</w:t></w:r>'
    if tag:
        run = f'<w:sdt><w:sdtPr><w:tag w:val="{tag}"/><w:alias w:val="{tag}"/></w:sdtPr><w:sdtContent>{run}</w:sdtContent></w:sdt>'
    return f'<w:p><w:pPr><w:spacing w:after="{after}"/></w:pPr>{run}</w:p>'

body = paragraph('MEADOW HOUSE  /  EVENTS', 19, 'A94732', True, after=220)
body += paragraph('Booking confirmation', 46, after=140)
body += paragraph('[Event name]', 28, tag='event', after=300)
body += paragraph('BOOKED FOR', 19, 'A94732', True, after=80)
body += paragraph('[Customer name]', tag='customer', after=240)
body += paragraph('DATE & TIME', 19, 'A94732', True, after=80)
body += paragraph('[Date and time]', tag='date', after=240)
body += paragraph('VENUE', 19, 'A94732', True, after=80)
body += paragraph('[Venue]', tag='venue', after=240)
body += paragraph('GUESTS', 19, 'A94732', True, after=80)
body += paragraph('[Guest count]', tag='guests', after=240)
body += paragraph('BOOKING DETAILS', 19, 'A94732', True, after=100)
body += paragraph('[Booking details]', tag='details', after=180)
body += '<w:sectPr><w:pgSz w:w="8640" w:h="9000"/><w:pgMar w:top="480" w:right="480" w:bottom="480" w:left="480" w:header="0" w:footer="0"/></w:sectPr>'
xml = f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>'
with ZipFile(root.parent/'view-document/sample.docx') as source, ZipFile(root/'template.docx', 'w', ZIP_DEFLATED) as output:
    for name in ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']:
        entry = ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        output.writestr(entry, xml if name == 'word/document.xml' else source.read(name))
