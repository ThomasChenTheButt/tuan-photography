#!/usr/bin/env python3
"""照片清單 — a private page that shows which photograph is which.

    python3 tools/photo_list.py        (or double-click photo-list.command)

Writes originals/photo-list.html. For every photograph on the site it shows the original
file it came from and the pages that use it; then it lists the originals that are not on
the site yet, and how many photographs each folder holds.

The page is for the owner only. It lives inside originals/, which never goes to GitHub,
because it shows photographs that have not been published.

An original and its web copy are matched by the moment the camera took them, which both
files carry. Nothing is renamed or changed; this script only reads.
"""
import html
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "originals"
THUMBS = ORIGINALS / ".thumbs"
SITE = ROOT / "site"
WEB = SITE / "images" / "web"
OUT = ORIGINALS / "photo-list.html"
KINDS = {".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff"}


def e(text):
    return html.escape(str(text), quote=True)


def taken(path):
    """The moment the camera recorded, as the file states it. None if the file has none."""
    out = subprocess.run(["sips", "-g", "creation", str(path)], capture_output=True, text=True).stdout
    m = re.search(r"creation: (\d{4}:\d\d:\d\d \d\d:\d\d:\d\d)", out)
    return m.group(1) if m else None


def thumb(path):
    """A small copy of an original, made once and reused. None if the file can't be read."""
    out = THUMBS / f"{path.parent.name}__{path.stem}.jpg"
    if not out.exists() or out.stat().st_mtime < path.stat().st_mtime:
        THUMBS.mkdir(exist_ok=True)
        done = subprocess.run(["sips", "-Z", "640", "-s", "format", "jpeg", "-s", "formatOptions", "70",
                               str(path), "--out", str(out)], capture_output=True)
        if done.returncode != 0 or not out.exists():
            return None
    return out.relative_to(ORIGINALS).as_posix()


def pages():
    """Every page of the site with its name in both languages and its text."""
    found = []
    for page in sorted(SITE.rglob("*.html")):
        rel = page.relative_to(SITE)
        text = page.read_text(encoding="utf-8")
        names = {}
        for lang in ("en", "zh"):
            m = re.search(r'"%s":\s*\{.*?"docTitle":\s*"([^"]*)"' % lang, text, re.S)
            names[lang] = m.group(1).split(" - ")[0] if m else rel.stem
        if rel.as_posix() == "index.html":
            names = {"en": "Home", "zh": "首頁"}
        found.append((rel.as_posix(), names, text))
    order = ("index.html", "gallery.html", "posts/", "countries/", "continents/")
    return sorted(found, key=lambda f: next((i for i, o in enumerate(order) if f[0].startswith(o)), len(order)))


def main():
    data = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
    # Empty folders are where he drops photos later, and GitHub does not keep empty folders,
    # so they are put back here whenever one is missing.
    for name in [c["id"] for c in data["countries"]] + ["portfolio"]:
        (ORIGINALS / name).mkdir(parents=True, exist_ok=True)
    site_pages = pages()

    originals = [p for p in sorted(ORIGINALS.rglob("*"))
                 if p.is_file() and p.suffix.lower() in KINDS and THUMBS not in p.parents]
    by_moment = {}
    for p in originals:
        by_moment.setdefault(taken(p), []).append(p)
    by_moment.pop(None, None)

    used, rows = set(), []
    for s in data["slides"]:
        moment = taken(WEB / s["file"])
        sources = by_moment.get(moment, [])
        used.update(sources)
        where = []
        for rel, names, text in site_pages:
            if s["file"] in text:
                label = f'{names["zh"]} {names["en"]}'
                if rel == "index.html" and s["id"] == data.get("lead"):
                    label += "（開場照片 opening photo）"
                where.append(f'<li><a href="../site/{e(rel)}">{e(label)}</a></li>')
        rows.append(f"""        <tr>
          <td><img class="pl-thumb" src="../site/images/web/640/{e(s["file"])}" alt="" loading="lazy"></td>
          <td><b class="pl-name">{e(s["place"]["zh"])}</b><span class="quiet">{e(s["place"]["en"])}</span></td>
          <td class="num">{"<br>".join(e(p.relative_to(ORIGINALS).as_posix()) for p in sources)
                           or '<span class="quiet">找不到原檔 not found</span>'}</td>
          <td class="num">{e(s["file"])}</td>
          <td><ul class="pl-where">{"".join(where) or '<li class="quiet">還沒用在任何頁面 not used yet</li>'}</ul></td>
        </tr>""")

    waiting = [p for p in originals if p not in used]
    cards = []
    for p in waiting:
        small = thumb(p)
        picture = (f'<img class="pl-thumb" src="{e(small)}" alt="" loading="lazy">' if small
                   else '<span class="pl-thumb pl-thumb--none quiet">無法預覽 no preview</span>')
        cards.append(f'      <li>{picture}<span class="num">{e(p.relative_to(ORIGINALS).as_posix())}</span></li>')

    folders = []
    for d in sorted(x for x in ORIGINALS.iterdir() if x.is_dir() and x != THUMBS):
        mine = [p for p in originals if d in p.parents]
        on_site = sum(1 for p in mine if p in used)
        folders.append(f"""        <tr>
          <td>{e(d.name)}</td>
          <td class="num">{len(mine) or '<span class="quiet">0</span>'}</td>
          <td class="num">{on_site or '<span class="quiet">0</span>'}</td>
          <td class="num">{len(mine) - on_site or '<span class="quiet">0</span>'}</td>
        </tr>""")

    waiting_part = (f'    <ul class="pl-grid">\n' + "\n".join(cards) + "\n    </ul>" if cards else
                    '    <p class="empty">每一張原檔都已經在網站上了。<br>Every original is on the site.</p>')

    OUT.write_text(f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>照片清單 - tuan photography 陳亮元</title>
  <link rel="stylesheet" href="../site/css/fonts.css">
  <link rel="stylesheet" href="../site/css/style.css">
  <style>
    /* This page only. It borrows the site's colours, type and table; these few rules lay out the list. */
    .pl-thumb {{ width: 9rem; max-width: none; height: auto; background: var(--band); }}
    .pl-thumb--none {{ display: grid; place-items: center; aspect-ratio: 3 / 2; font-size: var(--t-xs); }}
    .pl-name {{ display: block; font-family: var(--serif); font-weight: 500; font-size: 1.15rem; line-height: 1.35; }}
    .pl-where li + li {{ margin-top: 0.2rem; }}
    .pl-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: var(--s-3) var(--col-gap); }}
    .pl-grid .pl-thumb {{ width: 100%; max-width: 100%; margin-bottom: 0.5rem; }}
    .pl-grid span {{ font-size: var(--t-xs); color: var(--text-2); overflow-wrap: anywhere; }}
    .pl .sheet td {{ vertical-align: middle; }}
    .pl .sheet td:first-child {{ min-width: 0; font-weight: 400; }}
    .pl .sheet td:nth-child(2) {{ min-width: 9rem; }}
    .pl .sheet td.num {{ overflow-wrap: anywhere; }}
    .pl .sheet a, .pl .sheet thead th {{ white-space: normal; }}
    .pl-narrow {{ max-width: 40rem; margin-inline: auto; }}
  </style>
</head>
<body>
<main class="wrap pl">
  <header class="page-top">
    <h1>照片清單</h1>
    <p>Photo list. 網站上 {len(rows)} 張，還沒上網站的原檔 {len(waiting)} 張。</p>
    <p class="when num">更新於 {time.strftime("%Y-%m-%d %H:%M")}，只存在你的電腦上。</p>
  </header>

  <section class="part">
    <div class="part__head">
      <h2>網站上的照片</h2>
      <p>On the site. 每一張是從哪個原檔來的，用在哪些頁面。</p>
    </div>
    <div class="sheet-wrap">
      <table class="sheet">
        <thead><tr><th>照片</th><th>名稱 Name</th><th>你的原檔 Your original</th><th>網站上的檔名 On the site</th><th>用在哪裡 Used for</th></tr></thead>
        <tbody>
{chr(10).join(rows)}
        </tbody>
      </table>
    </div>
  </section>

  <section class="part bleed">
    <div class="part__head">
      <h2>還沒上網站的原檔</h2>
      <p>Not on the site yet. 想用哪一張，跟 Claude 說檔名就好。</p>
    </div>
{waiting_part}
  </section>

  <section class="part">
    <div class="part__head">
      <h2>資料夾</h2>
      <p>Folders. 把照片放進 originals 裡對應的國家資料夾。</p>
    </div>
    <div class="sheet-wrap pl-narrow">
      <table class="sheet">
        <thead><tr><th>資料夾 Folder</th><th>原檔 Originals</th><th>已上網站 On the site</th><th>還沒用 Waiting</th></tr></thead>
        <tbody>
{chr(10).join(folders)}
        </tbody>
      </table>
    </div>
  </section>
</main>
</body>
</html>
""", encoding="utf-8")
    print(f"photo list: {len(rows)} on the site, {len(waiting)} originals waiting → originals/photo-list.html")


if __name__ == "__main__":
    main()
