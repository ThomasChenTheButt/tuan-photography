#!/usr/bin/env python3
"""PT 圖示產生器 — builds the PT site icon and wires it into every page.

Same family as FinTuan's FT mark: rounded square, thin first letter, bold T.
Colours are the site's own tokens from css/style.css (icon files can't read CSS variables).

Run from anywhere:  python3 tools/icons.py
Safe to rerun — images are overwritten, pages that already have the tags are skipped.
Needs Pillow (pip install pillow).
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / 'icons'

DARKROOM = '#191410'    # --darkroom
PAPER = '#f6efe3'       # --paper
FRAME_GOLD = '#d9a441'  # --frame-gold

# Geometry on a 512 grid.
TOP, BOTTOM = 165, 347
P_LEFT, P_BOWL_X = 112, 174          # stem's left edge; where the bowl's curve starts
T_LEFT, T_RIGHT = 249, 400
T_BAR, T_STEM = 35, 42
THIN = 17                            # P stroke at large sizes
THIN_SMALL = 30                      # P stroke for tab-sized icons, so it survives 16px
RADIUS = 100


def svg(thin):
    half = thin / 2
    bowl_r = 55 - half               # centreline radius; outer edge stays put
    t_stem_x = (T_LEFT + T_RIGHT - T_STEM) / 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="{RADIUS}" fill="{DARKROOM}"/>
  <path d="M{P_LEFT + half} {BOTTOM}V{TOP + half}H{P_BOWL_X}a{bowl_r} {bowl_r} 0 0 1 0 {bowl_r * 2}H{P_LEFT + half}" fill="none" stroke="{PAPER}" stroke-width="{thin}"/>
  <path d="M{T_LEFT} {TOP}H{T_RIGHT}v{T_BAR}H{t_stem_x + T_STEM}V{BOTTOM}h-{T_STEM}V{TOP + T_BAR}H{T_LEFT}z" fill="{FRAME_GOLD}"/>
</svg>
'''


def draw(size, thin=THIN, rounded=True):
    """Render at 4x and scale down, so edges stay smooth without an SVG renderer."""
    k = 4 * 512
    s = k / 512
    im = Image.new('RGBA', (k, k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def box(x0, y0, x1, y1):
        return [x0 * s, y0 * s, x1 * s - 1, y1 * s - 1]

    if rounded:
        d.rounded_rectangle(box(0, 0, 512, 512), radius=RADIUS * s, fill=DARKROOM)
    else:
        d.rectangle(box(0, 0, 512, 512), fill=DARKROOM)

    # P — stem, then a bowl made of two bars and a half ring
    bowl_bottom = TOP + 110
    cy = (TOP + bowl_bottom) / 2
    d.rectangle(box(P_LEFT, TOP, P_LEFT + thin, BOTTOM), fill=PAPER)
    d.rectangle(box(P_LEFT, TOP, P_BOWL_X, TOP + thin), fill=PAPER)
    d.rectangle(box(P_LEFT, bowl_bottom - thin, P_BOWL_X, bowl_bottom), fill=PAPER)
    d.pieslice(box(P_BOWL_X - 55, cy - 55, P_BOWL_X + 55, cy + 55), -90, 90, fill=PAPER)
    inner = 55 - thin
    d.pieslice(box(P_BOWL_X - inner, cy - inner, P_BOWL_X + inner, cy + inner), -90, 90, fill=DARKROOM)

    # T
    stem_x = (T_LEFT + T_RIGHT - T_STEM) / 2
    d.rectangle(box(T_LEFT, TOP, T_RIGHT, TOP + T_BAR), fill=FRAME_GOLD)
    d.rectangle(box(stem_x, TOP, stem_x + T_STEM, BOTTOM), fill=FRAME_GOLD)

    return im.resize((size, size), Image.LANCZOS)


def build_icons():
    ICONS.mkdir(exist_ok=True)
    (ICONS / 'favicon.svg').write_text(svg(THIN_SMALL), encoding='utf-8')
    draw(96, THIN_SMALL).save(ICONS / 'favicon-96x96.png')
    # Phones round the corners themselves, so these two are full-bleed squares.
    draw(180, rounded=False).convert('RGB').save(ICONS / 'apple-touch-icon.png')
    for px in (192, 512):
        draw(px, rounded=False).convert('RGB').save(ICONS / f'web-app-manifest-{px}x{px}.png')
    draw(256, THIN_SMALL).save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    manifest = {
        'name': 'tuan photography 陳亮元',
        'short_name': 'PT',
        'icons': [
            {'src': f'icons/web-app-manifest-{px}x{px}.png', 'sizes': f'{px}x{px}',
             'type': 'image/png', 'purpose': 'maskable'}
            for px in (192, 512)
        ],
        'start_url': 'index.html',
        'theme_color': PAPER,
        'background_color': PAPER,
        'display': 'standalone',
    }
    (ROOT / 'site.webmanifest').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


TAGS = '''  <link rel="icon" type="image/png" href="{p}icons/favicon-96x96.png" sizes="96x96">
  <link rel="icon" type="image/svg+xml" href="{p}icons/favicon.svg">
  <link rel="shortcut icon" href="{p}favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="{p}icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-title" content="PT">
  <link rel="manifest" href="{p}site.webmanifest">
'''
STYLESHEET = re.compile(r'^[ \t]*<link rel="stylesheet" href="((?:\.\./)*)css/style\.css">[ \t]*\n', re.M)


def wire_pages():
    added, skipped, missed = 0, 0, []
    for page in sorted(ROOT.rglob('*.html')):
        html = page.read_text(encoding='utf-8')
        if 'rel="icon"' in html:
            skipped += 1
            continue
        m = STYLESHEET.search(html)
        if not m:
            missed.append(page.relative_to(ROOT))
            continue
        html = html[:m.end()] + TAGS.format(p=m.group(1)) + html[m.end():]
        page.write_text(html, encoding='utf-8')
        added += 1
    print(f'pages: {added} updated, {skipped} already had icons')
    for page in missed:
        print(f'  ! no stylesheet link found, skipped: {page}')


if __name__ == '__main__':
    build_icons()
    wire_pages()
