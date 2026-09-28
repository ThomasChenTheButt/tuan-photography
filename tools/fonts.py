#!/usr/bin/env python3
"""Keep the site's typefaces with the site instead of loading them from Google.

    python3 tools/fonts.py

Downloads every font file the pages need into fonts/ and writes css/fonts.css, which
names them. Run it again only when a typeface or a weight changes: edit FAMILIES below,
delete fonts/, and rerun. Files already downloaded are left alone.

The Chinese faces come as about a hundred small slices each. A browser fetches only the
slices holding characters that are on the page, so the size of the folder is not the
size of a page load.

All four families are under the SIL Open Font License, which asks that the licence
travels with the files: each folder in fonts/ carries its own OFL.txt.
"""
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"
SHEET = ROOT / "css" / "fonts.css"

FAMILIES = ("family=Playfair+Display&family=Geist:wght@400..600"
            "&family=Noto+Serif+TC:wght@500..600&family=Noto+Sans+TC:wght@400..600")
SOURCE = f"https://fonts.googleapis.com/css2?{FAMILIES}&display=swap"
# Google sends the small modern format (woff2, sliced) only to a browser it recognises.
AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
         "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

LICENCES = "https://raw.githubusercontent.com/google/fonts/main/ofl/{}/OFL.txt"

# Latin slices are labelled by a comment ("latin"); Chinese slices by a number in the address.
FACE = re.compile(r"(?:/\* (?P<label>[^*]+?) \*/\s*)?@font-face \{(?P<body>.*?)\}", re.S)
FAMILY = re.compile(r"font-family: '([^']+)'")
URL = re.compile(r"url\((https://fonts\.gstatic\.com/[^)]+?(?:\.(\d+))?\.woff2)\)")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def main():
    css = fetch(SOURCE).decode("utf-8")
    out, got, kept, seen = [], 0, 0, set()
    for m in FACE.finditer(css):
        body = m.group("body")
        family = FAMILY.search(body).group(1)
        url, number = URL.search(body).groups()
        slug = family.lower().replace(" ", "-")
        part = m.group("label") or f"{int(number):03d}"
        target = FONTS / slug / f"{slug}-{part}.woff2"
        if target in seen:
            raise SystemExit(f"two slices would share one name: {target.name}")
        seen.add(target)
        if target.exists():
            kept += 1
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(fetch(url))
            got += 1
        local = f"../fonts/{slug}/{target.name}"
        out.append("@font-face {" + body.replace(url, local) + "}")
    for folder in sorted(d for d in FONTS.iterdir() if d.is_dir()):
        licence = folder / "OFL.txt"
        if not licence.exists():
            licence.write_bytes(fetch(LICENCES.format(folder.name.replace("-", ""))))
    SHEET.write_text(
        "/* Written by tools/fonts.py. Do not edit by hand. */\n" + "\n".join(out) + "\n",
        encoding="utf-8")
    size = sum(f.stat().st_size for f in FONTS.rglob("*.woff2")) / 1e6
    print(f"fonts: {got} downloaded, {kept} already here, {size:.1f} MB in fonts/")


if __name__ == "__main__":
    main()
