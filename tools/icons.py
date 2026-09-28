#!/usr/bin/env python3
"""PT 圖示產生器 — builds the PT site icon.

Same family as FinTuan's FT and BodyTuan's BT — rounded square, two sans letters — with a
strip of landscape underneath: an ink ridgeline traced loosely from the Aoraki hero photo and
a kodak-red sun. The colours are the icon's own, kept from the site's first design; they are
not read from css/style.css.

Run from anywhere:  python3 tools/icons.py
Safe to rerun — images are overwritten.
The <head> tags that point at these files are written by tools/build.py.
Needs Pillow (pip install pillow).
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / 'icons'

PAPER = '#f6efe3'
INK = '#241d15'
KODAK_RED = '#c22c1e'
SKY = '#efd9ae'

# Everything below is on a 512 grid.
RADIUS = 100
TOP, BOTTOM = 103, 285               # letters sit high to leave room for the ridge
P_LEFT, P_BOWL_X, P_BOWL_R = 112, 174, 55
P_STROKE = 30
T_LEFT, T_RIGHT, T_BAR, T_STEM = 249, 400, 35, 42
SUN = (92, 436, 44)                  # x, y, radius — low on the left, half behind the ridge
# Main peak, its shoulder, then the long right-hand range.
RIDGE = [(0, 608), (0, 498), (52, 468), (96, 484), (150, 414), (186, 384), (214, 332),
         (232, 318), (252, 358), (282, 396), (318, 380), (348, 414), (392, 396), (424, 364),
         (452, 388), (512, 426), (512, 608)]


def svg():
    half = P_STROKE / 2
    r = P_BOWL_R - half              # centreline radius; outer edge stays put
    stem_x = (T_LEFT + T_RIGHT - T_STEM) / 2
    ridge = 'M' + 'L'.join(f'{x} {y}' for x, y in RIDGE) + 'Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <clipPath id="c"><rect width="512" height="512" rx="{RADIUS}"/></clipPath>
  <g clip-path="url(#c)">
    <rect width="512" height="512" fill="{SKY}"/>
    <circle cx="{SUN[0]}" cy="{SUN[1]}" r="{SUN[2]}" fill="{KODAK_RED}"/>
    <path d="{ridge}" fill="{INK}"/>
    <path d="M{P_LEFT + half} {BOTTOM}V{TOP + half}H{P_BOWL_X}a{r} {r} 0 0 1 0 {r * 2}H{P_LEFT + half}" fill="none" stroke="{INK}" stroke-width="{P_STROKE}"/>
    <path d="M{T_LEFT} {TOP}H{T_RIGHT}v{T_BAR}H{stem_x + T_STEM}V{BOTTOM}h-{T_STEM}V{TOP + T_BAR}H{T_LEFT}z" fill="{INK}"/>
  </g>
</svg>
'''


def draw(size, rounded=True):
    """Render at 4x and scale down, so edges stay smooth without an SVG renderer."""
    k = 4
    im = Image.new('RGBA', (512 * k, 512 * k), SKY)
    d = ImageDraw.Draw(im)

    def box(x0, y0, x1, y1):
        return [x0 * k, y0 * k, x1 * k - 1, y1 * k - 1]

    x, y, r = SUN
    d.ellipse(box(x - r, y - r, x + r, y + r), fill=KODAK_RED)
    d.polygon([(px * k, py * k) for px, py in RIDGE], fill=INK)

    # P — stem, then a bowl made of two bars and a half ring
    bowl_bottom = TOP + P_BOWL_R * 2
    cy = TOP + P_BOWL_R
    inner = P_BOWL_R - P_STROKE
    d.rectangle(box(P_LEFT, TOP, P_LEFT + P_STROKE, BOTTOM), fill=INK)
    d.rectangle(box(P_LEFT, TOP, P_BOWL_X, TOP + P_STROKE), fill=INK)
    d.rectangle(box(P_LEFT, bowl_bottom - P_STROKE, P_BOWL_X, bowl_bottom), fill=INK)
    d.pieslice(box(P_BOWL_X - P_BOWL_R, TOP, P_BOWL_X + P_BOWL_R, bowl_bottom), -90, 90, fill=INK)
    d.pieslice(box(P_BOWL_X - inner, cy - inner, P_BOWL_X + inner, cy + inner), -90, 90, fill=SKY)

    # T
    stem_x = (T_LEFT + T_RIGHT - T_STEM) / 2
    d.rectangle(box(T_LEFT, TOP, T_RIGHT, TOP + T_BAR), fill=INK)
    d.rectangle(box(stem_x, TOP, stem_x + T_STEM, BOTTOM), fill=INK)

    if rounded:
        mask = Image.new('L', im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle(box(0, 0, 512, 512), radius=RADIUS * k, fill=255)
        im.putalpha(mask)
    return im.resize((size, size), Image.LANCZOS)


def build_icons():
    ICONS.mkdir(exist_ok=True)
    (ICONS / 'favicon.svg').write_text(svg(), encoding='utf-8')
    draw(96).save(ICONS / 'favicon-96x96.png')
    draw(256).save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    # Phones round the corners themselves, so these are full-bleed squares.
    draw(180, rounded=False).convert('RGB').save(ICONS / 'apple-touch-icon.png')
    for px in (192, 512):
        draw(px, rounded=False).convert('RGB').save(ICONS / f'web-app-manifest-{px}x{px}.png')

    manifest = {
        'name': 'tuan photography 陳亮元',
        'short_name': 'PT',
        'icons': [
            {'src': f'icons/web-app-manifest-{px}x{px}.png', 'sizes': f'{px}x{px}',
             'type': 'image/png', 'purpose': 'any'}
            for px in (192, 512)
        ],
        'start_url': 'index.html',
        'theme_color': PAPER,
        'background_color': PAPER,
        'display': 'standalone',
    }
    (ROOT / 'site.webmanifest').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    build_icons()
