from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
from xml.sax.saxutils import escape

root = Path(__file__).parent
word = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
relationships = 'http://schemas.openxmlformats.org/package/2006/relationships'
office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def paragraph(text, style='Normal', bullet=False, page_break=False):
    properties = f'<w:pStyle w:val="{style}"/>'
    if bullet:
        properties += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
    if page_break:
        properties += '<w:pageBreakBefore/>'
    return f'<w:p><w:pPr>{properties}</w:pPr><w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'


def table(rows, widths):
    grid = ''.join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    result = f'<w:tbl><w:tblPr><w:tblW w:w="{sum(widths)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:bottom w:val="single" w:sz="4" w:color="D6DEE8"/><w:insideH w:val="single" w:sz="4" w:color="D6DEE8"/></w:tblBorders><w:tblCellMar><w:top w:w="130" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="130" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>{grid}</w:tblGrid>'
    for index, row in enumerate(rows):
        result += '<w:tr>'
        for text, width in zip(row, widths):
            fill = 'EDF2F7' if index == 0 else 'FFFFFF'
            result += f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/><w:shd w:fill="{fill}"/></w:tcPr>{paragraph(text, "TableHeader" if index == 0 else "TableText")}</w:tc>'
        result += '</w:tr>'
    return result + '</w:tbl>'


image = '<w:p><w:pPr><w:spacing w:after="180"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="3291840" cy="2194560"/><wp:docPr id="1" name="Fieldwork packaging concept" descr="Forest-green coffee cup and cream coffee bag on a terracotta table"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="Fieldwork packaging"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3291840" cy="2194560"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
styles = f'''<w:styles xmlns:w="{word}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:color w:val="293847"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="270" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="140"/></w:pPr><w:rPr><w:sz w:val="52"/><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="300"/></w:pPr><w:rPr><w:color w:val="5F7083"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/><w:spacing w:before="260" w:after="140"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="24675A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table header"/><w:basedOn w:val="TableText"/><w:rPr><w:b/></w:rPr></w:style></w:styles>'''
numbering = f'<w:numbering xmlns:w="{word}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="240"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'


def write_document(name, body, title, with_image=False):
    section = '<w:sectPr><w:footerReference w:type="default" r:id="footer"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="540" w:footer="540"/></w:sectPr>'
    document = f'<w:document xmlns:w="{word}" xmlns:r="{office}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>{body}{section}</w:body></w:document>'
    types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' + ''.join(f'<Override PartName="/word/{part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.{kind}+xml"/>' for part, kind in [('document', 'document.main'), ('styles', 'styles'), ('numbering', 'numbering'), ('footer1', 'footer')]) + '</Types>'
    parts = {'[Content_Types].xml': types, '_rels/.rels': f'<Relationships xmlns="{relationships}"><Relationship Id="doc" Type="{office}/officeDocument" Target="word/document.xml"/></Relationships>', 'word/document.xml': document, 'word/styles.xml': styles, 'word/numbering.xml': numbering, 'word/footer1.xml': f'<w:ftr xmlns:w="{word}"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="65768A"/></w:rPr><w:t>{escape(title)}  ·  </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>'}
    rels = ''.join(f'<Relationship Id="{identifier}" Type="{office}/{kind}" Target="{target}"/>' for identifier, kind, target in [('styles', 'styles', 'styles.xml'), ('numbering', 'numbering', 'numbering.xml'), ('footer', 'footer', 'footer1.xml')])
    if with_image:
        parts['word/media/fieldwork.png'] = (root.parent/'view-document/fieldwork-product.png').read_bytes()
        rels += f'<Relationship Id="image" Type="{office}/image" Target="media/fieldwork.png"/>'
    parts['word/_rels/document.xml.rels'] = f'<Relationships xmlns="{relationships}">{rels}</Relationships>'
    with ZipFile(root/name, 'w', ZIP_DEFLATED) as output:
        for part, data in parts.items():
            entry = ZipInfo(part, (2020, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            output.writestr(entry, data)


report = paragraph('Fieldwork Coffee', 'Title') + paragraph('Brand launch report · North Studio · 9 October 2026', 'Subtitle')
report += paragraph('Ready for the next chapter', 'Heading1') + paragraph('The new identity is ready for production. Customers recognized the forest-green packaging in our first shop trial, and staff found the revised menu easier to explain during the morning rush. The team is preparing the remaining shopfront and launch materials for 18 November.')
report += image + paragraph('Packaging concept approved for the first production run.', 'Subtitle')
report += paragraph('This month’s progress', 'Heading1')
report += ''.join(paragraph(text, bullet=True) for text in ['Approved the cup, coffee bag and takeaway labels.', 'Tested menu readability with the café team.', 'Confirmed print specifications and supplier lead times.'])
report += paragraph('Delivery plan', 'Heading1', page_break=True) + paragraph('Each owner will confirm final artwork before the supplier deadline. The launch date includes one week for print checks and installation.')
report += table([('Deliverable', 'Owner', 'Due', 'Status'), ('Identity & packaging', 'Maya Chen', '4 November', 'Approved'), ('Shopfront & menu', 'Eli Morgan', '11 November', 'In progress'), ('Launch-ready files', 'Noor Patel', '18 November', 'Scheduled')], [3600, 2200, 2200, 2080])
report += paragraph('Budget', 'Heading1') + table([('Workstream', 'Agreed fee'), ('Identity and packaging', '$4,800'), ('Shopfront and menu', '$2,600'), ('Production handoff', '$1,200'), ('Total project fee', '$8,600')], [7080, 3000])
report += paragraph('Decisions for the client', 'Heading1')
report += ''.join(paragraph(text, bullet=True) for text in ['Confirm the final seasonal drink names by 16 October.', 'Approve the shopfront installation window for 12 November.', 'Nominate a staff contact for the production handoff.'])
report += paragraph('Next review', 'Heading1') + paragraph('We will review print proofs with the Fieldwork team on 23 October. Maya will circulate the proof pack two working days before the meeting. Any changes to quantities will be confirmed with the supplier before production starts.')
write_document('sample.docx', report, 'Fieldwork Coffee | Launch report', True)

notes = paragraph('Launch planning meeting', 'Title') + paragraph('Fieldwork Coffee · 9 October 2026 · 10:00–10:45', 'Subtitle')
notes += paragraph('Attendees', 'Heading1') + paragraph('Maya Chen, Eli Morgan, Noor Patel and Jordan Lee')
notes += paragraph('Decisions', 'Heading1') + paragraph('The team approved the forest-green packaging and agreed to keep the current shopfront wording. Seasonal menu names will be confirmed before the print proofs are prepared.')
notes += paragraph('Action items', 'Heading1') + table([('Action', 'Owner', 'Due'), ('Send final drink names', 'Jordan', '16 October'), ('Prepare print proof pack', 'Maya', '21 October'), ('Confirm installation access', 'Eli', '23 October')], [5800, 1880, 2400])
notes += paragraph('For the next meeting', 'Heading1') + paragraph('Review print proofs and approve production quantities.', bullet=True) + paragraph('Confirm the staff handoff and launch-day schedule.', bullet=True)
write_document('plan.docx', notes, 'Fieldwork Coffee | Meeting notes')
