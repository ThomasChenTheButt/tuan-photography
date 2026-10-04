#!/usr/bin/env python3
"""Artifact 版（設計二）— package design 2 so Claude can publish it as a Claude Artifact.

    python3 tools/build_artifact2.py     writes .claude/artifact-build-2/

Claude then publishes .claude/artifact-build-2/index.html with the Artifact tool and every
other file in the folder alongside it (the list is in files.json). Nothing in design 2/ changes.

Design 2 is one page, design 2/wc-sketch/index.html, that reaches up a folder for its data,
map shapes, fonts and photographs. An Artifact's page sits at the top of its folder, so:
- index.html is that page without its document wrapper (the publisher supplies one), with
  every address pointed at the published layout below.
- wc-sketch/app.js is copied with its addresses moved the same way. Photographs come in two
  sizes, 640 and 1280: the full-size copy is dropped from the srcset, since nothing on the page
  shows a photograph wider than about 1300 pixels and the Artifact allows 64 MB in all.
- data.js has its "../images/" made "images/".
- fonts.css keeps only the font pieces whose characters some text in design 2 can show
  (the same reasoning as tools/build_artifact.py, for design 1).

Published layout:  index.html, data.js, fonts.css, fonts/, images/web/{640,1280}/,
vendor/, wc-sketch/{style.css, app.js, paint.js, map/flights.js, opening/*.js, fonts/, map/}
"""
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_artifact import in_ranges   # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
D2 = ROOT / "design 2"
PAGE = D2 / "wc-sketch"
OUT = ROOT / ".claude" / "artifact-build-2"

TITLE = "tuan photography 陳亮元"
# the page's own scripts, in the order index.html loads them (the shared brushes, the map's globes,
# then the opening candidates, then the page); app.js is rewritten, the rest copied as they are
JS = ("paint.js", "map/flights.js", "opening/photoball.js", "opening/corridor.js", "opening/globe.js", "app.js")
FILE_LIMIT, SIZE_LIMIT_MB = 255, 64


def put(rel: str, data=None, src: Path = None):
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if data is not None:
        dst.write_text(data, encoding="utf-8")
    else:
        shutil.copyfile(src, dst)
    return rel


def page() -> str:
    html = (PAGE / "index.html").read_text(encoding="utf-8")
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
    sheets = [t for t in re.findall(r"<link[^>]+>", head) if 'rel="stylesheet"' in t]
    keep = [f"<title>{TITLE}</title>",
            "<script>document.documentElement.lang = 'en';</script>",
            '<meta name="color-scheme" content="light">'] + sheets
    out = "\n".join(keep) + "\n" + body.strip() + "\n"
    out = out.replace('href="../fonts.css"', 'href="fonts.css"').replace('href="style.css"', 'href="wc-sketch/style.css"')
    out = out.replace('src="../vendor/', 'src="vendor/').replace('src="../data.js"', 'src="data.js"')
    for js in JS:
        out = out.replace(f'src="{js}"', f'src="wc-sketch/{js}"')
    return out


def app_js() -> str:
    js = (PAGE / "app.js").read_text(encoding="utf-8")
    swaps = [
        ("`../images/web/", "`images/web/"),
        ("'../vendor/", "'vendor/"),
        ("'map/", "'wc-sketch/map/"),
        ("${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w", "${imgSrc(s, 1280)} 1280w"),
    ]
    for old, new in swaps:
        if old not in js:
            sys.exit(f"app.js changed: cannot find {old!r}; update tools/build_artifact2.py")
        js = js.replace(old, new)
    return js


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    files = []
    (OUT).mkdir(parents=True)
    (OUT / "index.html").write_text(page(), encoding="utf-8")

    data = (D2 / "data.js").read_text(encoding="utf-8").replace("../images/", "images/")
    # the guide's own srcsets end with the full-size copy, which is not published
    data = re.sub(r",\s*images/web/[a-z0-9-]+\.jpg \d+w", "", data)
    files.append(put("data.js", data))
    files.append(put("wc-sketch/app.js", app_js()))
    for name in ("style.css",) + tuple(js for js in JS if js != "app.js"):
        files.append(put(f"wc-sketch/{name}", src=PAGE / name))
    for f in sorted((PAGE / "fonts").rglob("*.woff2")) + sorted((PAGE / "map").glob("*.json")):
        files.append(put(str(f.relative_to(D2)), src=f))
    for f in sorted((D2 / "vendor").rglob("*")):
        if f.is_file() and f.suffix in (".js", ".json", ".jpg"):
            files.append(put(str(f.relative_to(D2)), src=f))

    # fonts.css: only the pieces some design 2 text can use
    chars = set()
    for f in [D2 / "data.js", PAGE / "app.js", PAGE / "index.html"]:
        chars.update(f.read_text(encoding="utf-8"))
    css = (D2 / "fonts.css").read_text(encoding="utf-8")
    header, *blocks = re.split(r"(?=@font-face)", css)
    kept = []
    for block in blocks:
        src = re.search(r"url\(([^)]+)\)", block).group(1).strip("'\"")
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        if rng is None or in_ranges(rng.group(1), chars):
            kept.append(block)
            files.append(put(src, src=(D2 / src).resolve()))
    files.append(put("fonts.css", header + f"/* Artifact copy: {len(kept)} of {len(blocks)} pieces kept */\n" + "".join(kept)))

    # photographs: the two sizes the page asks for
    for size in ("640", "1280"):
        for f in sorted((D2 / "images" / "web" / size).resolve().glob("*.jpg")):
            files.append(put(f"images/web/{size}/{f.name}", src=f))

    (OUT / "files.json").write_text(json.dumps(files, ensure_ascii=False, indent=1))
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(files)} files + index.html, {total / 1e6:.1f} MB -> {OUT}")
    if len(files) + 1 > FILE_LIMIT:
        sys.exit(f"too many files for one Artifact (limit {FILE_LIMIT})")
    if total / 1e6 > SIZE_LIMIT_MB:
        sys.exit(f"too big for one Artifact version (limit {SIZE_LIMIT_MB} MB)")


if __name__ == "__main__":
    main()
