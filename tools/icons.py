#!/usr/bin/env python3
"""PT 圖示產生器 — builds the PT site icon and wires it into every page.

The mark is "山稜": paper sky, an ink ridgeline traced loosely from the Aoraki hero photo,
a kodak-red sun, and PT set in Instrument Serif. Colours are the site's own tokens from
css/style.css (icon files can't read CSS variables).

Two drawings, because a tab icon is 16px and a Dock icon is not:
  full — the whole scene, for phone home screens and the Dock
  tab  — letters enlarged, far range dropped, for browser tabs

Run from anywhere:  python3 tools/icons.py
Safe to rerun — images are overwritten, pages that already have the tags are skipped.
Needs Pillow, Google Chrome, and an internet connection (Chrome draws the letters with the
same web font the site uses).
"""
import base64
import io
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / 'icons'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

PAPER = '#f6efe3'       # --paper
INK = '#241d15'         # --ink
INK_SOFT = '#6d6357'    # --ink-soft
KODAK_RED = '#c22c1e'   # --kodak-red
FRAME_GOLD = '#d9a441'  # --frame-gold

# On a 512 grid. Main peak, its shoulder, then the long right-hand range.
RIDGE_NEAR = ('M0 512V402L52 372L96 388L150 318L186 288L214 236L232 222L252 262L282 300'
              'L318 284L348 318L392 300L424 268L452 292L512 330V512Z')
RIDGE_FAR = 'M0 512V340L70 300L120 322L176 286L240 330L300 296L372 240L408 262L470 236L512 262V512Z'
RADIUS = 100


def art(tab):
    sun = (388, 150, 62) if tab else (372, 214, 46)
    far = '' if tab else f'<path d="{RIDGE_FAR}" fill="{INK_SOFT}" opacity=".38"/>'
    near_shift = ' transform="translate(0 40)"' if tab else ''
    letters = (40, 300, 330) if tab else (56, 212, 190)
    return f'''
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{PAPER}" stop-opacity="0"/>
      <stop offset=".62" stop-color="{FRAME_GOLD}" stop-opacity=".34"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="{PAPER}"/>
    <rect width="512" height="512" fill="url(#sky)"/>
    <circle cx="{sun[0]}" cy="{sun[1]}" r="{sun[2]}" fill="{KODAK_RED}"/>
    {far}
    <path d="{RIDGE_NEAR}" fill="{INK}"{near_shift}/>
    <text x="{letters[0]}" y="{letters[1]}" font-size="{letters[2]}" fill="{INK}">PT</text>'''


def page(tab, rounded):
    clip = f'<clipPath id="clip"><rect width="512" height="512" rx="{RADIUS}"/></clipPath>'
    group = '<g clip-path="url(#clip)">' if rounded else '<g>'
    return f'''<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=block" rel="stylesheet">
<style>html,body{{margin:0;background:transparent}}svg{{display:block}}
text{{font-family:'Instrument Serif'}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>{clip}</defs>{group}{art(tab)}</g></svg>
<script>
// No font, no picture: better an obvious failure than letters in the wrong typeface.
document.fonts.load('200px "Instrument Serif"', 'PT').then(function (found) {{
  if (!found.length) document.body.innerHTML = '';
}});
</script></body></html>'''


def render(tab, rounded):
    """Draw one variant at 1024px with headless Chrome and hand it back as an image."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / 'icon.html').write_text(page(tab, rounded), encoding='utf-8')
        shot = tmp / 'icon.png'
        chrome = subprocess.Popen(
            [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
             f'--user-data-dir={tmp / "profile"}', '--force-device-scale-factor=2',
             '--window-size=512,512', '--default-background-color=00000000',
             '--virtual-time-budget=8000', f'--screenshot={shot}',
             (tmp / 'icon.html').as_uri()],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Chrome writes the screenshot and then often never exits, so don't wait for it.
        deadline = time.time() + 60
        while time.time() < deadline and not (shot.exists() and shot.stat().st_size):
            time.sleep(0.5)
        time.sleep(1)
        chrome.kill()
        chrome.wait()
        if not shot.exists():
            sys.exit('Chrome produced no image — is Google Chrome installed?')
        im = Image.open(io.BytesIO(shot.read_bytes())).convert('RGBA')
    if im.getextrema()[3][1] == 0:
        sys.exit('Instrument Serif did not load — check the internet connection and rerun.')
    return im


def build_icons():
    ICONS.mkdir(exist_ok=True)
    tab = render(tab=True, rounded=True)
    full = render(tab=False, rounded=False)

    def sized(im, px):
        return im.resize((px, px), Image.LANCZOS)

    sized(tab, 96).save(ICONS / 'favicon-96x96.png')
    sized(tab, 256).save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    # Phones round the corners themselves, so these are full-bleed squares.
    sized(full, 180).convert('RGB').save(ICONS / 'apple-touch-icon.png')
    for px in (192, 512):
        sized(full, px).convert('RGB').save(ICONS / f'web-app-manifest-{px}x{px}.png')

    # The letters need the web font, which an icon file can't load — so the SVG carries a picture.
    png = io.BytesIO()
    sized(tab, 256).save(png, format='PNG', optimize=True)
    (ICONS / 'favicon.svg').write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">'
        '<image width="256" height="256" href="data:image/png;base64,'
        + base64.b64encode(png.getvalue()).decode() + '"/></svg>\n', encoding='utf-8')

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
    for page_file in sorted(ROOT.rglob('*.html')):
        html = page_file.read_text(encoding='utf-8')
        if 'rel="icon"' in html:
            skipped += 1
            continue
        m = STYLESHEET.search(html)
        if not m:
            missed.append(page_file.relative_to(ROOT))
            continue
        html = html[:m.end()] + TAGS.format(p=m.group(1)) + html[m.end():]
        page_file.write_text(html, encoding='utf-8')
        added += 1
    print(f'pages: {added} updated, {skipped} already had icons')
    for page_file in missed:
        print(f'  ! no stylesheet link found, skipped: {page_file}')


if __name__ == '__main__':
    build_icons()
    wire_pages()
