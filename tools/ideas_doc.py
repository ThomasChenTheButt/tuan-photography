#!/usr/bin/env python3
"""靈感整理產生器 — rebuilds ideas/靈感整理.docx from IDEAS.md.

IDEAS.md is the running list and the only place entries are typed. This turns it into a Word
file grouped by 類型, with saved images placed next to the idea they belong to. The Word file
lives in ideas/, which is gitignored: it carries other people's images and the repo is public.

Run from anywhere:  python3 tools/ideas_doc.py
Safe to rerun — the Word file is overwritten. Never edit the Word file by hand; edit IDEAS.md.
Needs Pillow (pip install pillow). Writes the .docx directly, no Word library required.
"""
import io
import re
import zipfile
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'IDEAS.md'
IDEAS = ROOT / 'ideas'
OUT = IDEAS / '靈感整理.docx'

INK = '241D15'          # --ink
KODAK_RED = 'C22C1E'    # --kodak-red
MUTED = '7A6F62'        # --ink lightened; Word only
RULE = 'D9CFBF'         # --paper darkened; Word only

# A4 with 1" margins, in DXA (1440 = 1 inch).
PAGE_W, PAGE_H, MARGIN = 11906, 16838, 1440
CONTENT_W = PAGE_W - 2 * MARGIN
LABEL_W = 1900
EMU_PER_DXA = 635
IMAGE_W = CONTENT_W * EMU_PER_DXA

UNSORTED = '未分類'
# Fields shown on their own rather than as a row in the entry's table.
HIDDEN = {'類型', '圖片'}

NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"')
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def parse(text):
    """IDEAS.md → list of entries: {title, section, fields: {label: value}}."""
    entries, section, entry = [], '', None
    for line in text.splitlines():
        if line.startswith('## '):
            section, entry = line[3:].strip(), None
        elif line.startswith('### '):
            entry = {'title': line[4:].strip(), 'section': section, 'fields': {}}
            entries.append(entry)
        elif entry is not None:
            field = re.match(r'-\s+(.+?)\s*[:：]\s*(.+)', line)
            if field:
                entry['fields'][field.group(1)] = field.group(2).strip()
    return entries


def by_type(entries):
    groups = {}
    for entry in entries:
        groups.setdefault(entry['fields'].get('類型', UNSORTED), []).append(entry)
    return groups


class Doc:
    """Collects body XML plus the images and links it refers to."""

    def __init__(self):
        self.body, self.rels, self.media = [], [], []

    def rel(self, kind, target, external=False):
        rid = f'rId{len(self.rels) + 2}'          # rId1 is styles.xml
        mode = ' TargetMode="External"' if external else ''
        self.rels.append(f'<Relationship Id="{rid}" Type="{REL}/{kind}" '
                         f'Target={quoteattr(target)}{mode}/>')
        return rid

    def run(self, text, style=None):
        props = f'<w:rPr><w:rStyle w:val="{style}"/></w:rPr>' if style else ''
        return f'<w:r>{props}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

    def text(self, value):
        """Runs for a value, turning any URL in it into a real link."""
        out = []
        for part in re.split(r'(https?://\S+)', value):
            if part.startswith('http'):
                rid = self.rel('hyperlink', part, external=True)
                out.append(f'<w:hyperlink r:id="{rid}">{self.run(part, "Link")}</w:hyperlink>')
            elif part:
                out.append(self.run(part))
        return ''.join(out)

    def para(self, runs, style=None):
        props = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
        return f'<w:p>{props}{runs}</w:p>'

    def add(self, text, style=None):
        self.body.append(self.para(self.run(text), style))

    def table(self, rows, widths, header=False):
        grid = ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths)
        out = [f'<w:tbl><w:tblPr><w:tblW w:w="{sum(widths)}" w:type="dxa"/>'
               '<w:tblBorders>'
               f'<w:top w:val="single" w:sz="4" w:color="{RULE}"/>'
               f'<w:bottom w:val="single" w:sz="4" w:color="{RULE}"/>'
               f'<w:insideH w:val="single" w:sz="4" w:color="{RULE}"/>'
               '</w:tblBorders><w:tblLayout w:type="fixed"/>'
               '<w:tblCellMar><w:top w:w="90" w:type="dxa"/>'
               '<w:left w:w="0" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/>'
               '<w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr>'
               f'<w:tblGrid>{grid}</w:tblGrid>']
        for i, row in enumerate(rows):
            out.append('<w:tr><w:trPr><w:cantSplit/></w:trPr>')
            for j, (cell, width) in enumerate(zip(row, widths)):
                label = j == 0 or (header and i == 0)
                content = (self.para(self.run(cell), 'Label') if label
                           else self.para(self.text(cell), 'Cell'))
                out.append(f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/></w:tcPr>'
                           f'{content}</w:tc>')
            out.append('</w:tr>')
        out.append('</w:tbl>')
        self.body.append(''.join(out))

    def image(self, path, alt):
        # Word can't show WebP, and phone screenshots are huge — store a plain JPEG.
        picture = Image.open(path).convert('RGB')
        picture.thumbnail((1800, 1800))
        data = io.BytesIO()
        picture.save(data, 'JPEG', quality=82)
        name = f'image{len(self.media) + 1}.jpg'
        self.media.append((name, data.getvalue()))
        rid = self.rel('image', f'media/{name}')
        n = len(self.media)
        cx, cy = IMAGE_W, round(IMAGE_W * picture.height / picture.width)
        a = 'http://schemas.openxmlformats.org/drawingml/2006/main'
        pic = 'http://schemas.openxmlformats.org/drawingml/2006/picture'
        self.body.append(
            '<w:p><w:pPr><w:pStyle w:val="Picture"/></w:pPr><w:r><w:drawing>'
            '<wp:inline distT="0" distB="0" distL="0" distR="0">'
            f'<wp:extent cx="{cx}" cy="{cy}"/>'
            f'<wp:docPr id="{n}" name="Picture {n}" descr={quoteattr(alt)}/>'
            f'<a:graphic xmlns:a="{a}"><a:graphicData uri="{pic}">'
            f'<pic:pic xmlns:pic="{pic}"><pic:nvPicPr>'
            f'<pic:cNvPr id="{n}" name={quoteattr(name)}/><pic:cNvPicPr/></pic:nvPicPr>'
            f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch>'
            '</pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/>'
            f'<a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'
            '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')

    def document(self):
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<w:document {NS}><w:body>{"".join(self.body)}'
                f'<w:sectPr><w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/>'
                f'<w:pgMar w:top="{MARGIN}" w:right="{MARGIN}" w:bottom="{MARGIN}" '
                f'w:left="{MARGIN}" w:header="708" w:footer="708" w:gutter="0"/>'
                '</w:sectPr></w:body></w:document>')


def style(style_id, name, kind='paragraph', based='Normal', para='', run=''):
    based = f'<w:basedOn w:val="{based}"/>' if based else ''
    follow = '<w:next w:val="Normal"/>' if kind == 'paragraph' else ''
    return (f'<w:style w:type="{kind}" w:styleId="{style_id}"><w:name w:val="{name}"/>'
            f'{based}{follow}<w:qFormat/><w:pPr>{para}</w:pPr><w:rPr>{run}</w:rPr></w:style>')


def styles():
    # Georgia + 宋體-繁: both ship with macOS, and keep the site's serif, printed-page feel.
    fonts = ('<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Songti TC" '
             'w:cs="Georgia"/>')
    mono = '<w:rFonts w:ascii="Menlo" w:hAnsi="Menlo" w:eastAsia="Songti TC"/>'
    rule = (f'<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="6" '
            f'w:color="{KODAK_RED}"/></w:pBdr>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:styles {NS}><w:docDefaults><w:rPrDefault><w:rPr>{fonts}'
        f'<w:color w:val="{INK}"/><w:sz w:val="22"/><w:szCs w:val="22"/>'
        '<w:lang w:val="en-US" w:eastAsia="zh-TW"/></w:rPr></w:rPrDefault>'
        '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="320" w:lineRule="auto"/>'
        '</w:pPr></w:pPrDefault></w:docDefaults>'
        + style('Normal', 'Normal', based=None)
        + style('Title', 'Title', para='<w:spacing w:after="60"/>',
                run='<w:sz w:val="64"/><w:szCs w:val="64"/>')
        + style('Meta', 'Meta', para='<w:spacing w:after="480"/>',
                run=f'{mono}<w:color w:val="{MUTED}"/><w:sz w:val="17"/>')
        + style('Heading1', 'heading 1',
                para=f'<w:keepNext/>{rule}<w:spacing w:before="600" w:after="200"/>'
                     '<w:outlineLvl w:val="0"/>',
                run='<w:sz w:val="40"/><w:szCs w:val="40"/>')
        + style('Heading2', 'heading 2',
                para='<w:keepNext/><w:spacing w:before="360" w:after="40"/>'
                     '<w:outlineLvl w:val="1"/>',
                run='<w:sz w:val="28"/><w:szCs w:val="28"/>')
        + style('Label', 'Label', para='<w:spacing w:after="0"/>',
                run=f'{mono}<w:color w:val="{MUTED}"/><w:sz w:val="17"/>')
        + style('Cell', 'Cell', para='<w:spacing w:after="0"/>')
        + style('Picture', 'Picture',
                para='<w:keepNext/><w:spacing w:before="160" w:after="200" w:line="240" '
                     'w:lineRule="auto"/>')
        + style('Link', 'Link', kind='character', based=None,
                run=f'<w:color w:val="{KODAK_RED}"/><w:u w:val="single"/>')
        + '</w:styles>')


def build(entries):
    doc = Doc()
    groups = by_type(entries)
    doc.add('靈感整理', 'Title')
    doc.add(f'最後更新 {date.today().isoformat()}  ·  {len(entries)} 項  ·  '
            f'{len(groups)} 個類型  ·  來源 IDEAS.md', 'Meta')
    doc.table([['類型', '數量', '項目']]
              + [[kind, str(len(found)), '、'.join(e['title'] for e in found)]
                 for kind, found in groups.items()],
              [LABEL_W, 1000, CONTENT_W - LABEL_W - 1000], header=True)

    for kind, found in groups.items():
        doc.add(kind, 'Heading1')
        for entry in found:
            fields = entry['fields']
            doc.add(entry['title'], 'Heading2')
            doc.add(entry['section'], 'Label')
            picture = IDEAS / fields.get('圖片', '')
            if picture.is_file():
                doc.image(picture, entry['title'])
            rows = [[label, value] for label, value in fields.items() if label not in HIDDEN]
            if rows:
                doc.table(rows, [LABEL_W, CONTENT_W - LABEL_W])
    return doc


def main():
    entries = parse(SOURCE.read_text(encoding='utf-8'))
    doc = build(entries)
    IDEAS.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType='
                   '"application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Default Extension="jpg" ContentType="image/jpeg"/>'
                   '<Override PartName="/word/document.xml" ContentType="application/'
                   'vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
                   '<Override PartName="/word/styles.xml" ContentType="application/'
                   'vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
                   '</Types>')
        z.writestr('_rels/.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns='
                   '"http://schemas.openxmlformats.org/package/2006/relationships">'
                   f'<Relationship Id="rId1" Type="{REL}/officeDocument" '
                   'Target="word/document.xml"/></Relationships>')
        z.writestr('word/_rels/document.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns='
                   '"http://schemas.openxmlformats.org/package/2006/relationships">'
                   f'<Relationship Id="rId1" Type="{REL}/styles" Target="styles.xml"/>'
                   f'{"".join(doc.rels)}</Relationships>')
        z.writestr('word/document.xml', doc.document())
        z.writestr('word/styles.xml', styles())
        for name, data in doc.media:
            z.writestr(f'word/media/{name}', data)
    print(f'{OUT.relative_to(ROOT)} — {len(entries)} 項, {len(by_type(entries))} 個類型')


if __name__ == '__main__':
    main()
