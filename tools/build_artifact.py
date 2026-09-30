#!/usr/bin/env python3
"""Artifact 版 — package site/ so Claude can publish it as a Claude Artifact.

    python3 tools/build_artifact.py              writes .claude/artifact-build/
    python3 tools/build_artifact.py --selftest   also adds selftest.html (test only)

Claude then publishes .claude/artifact-build/index.html with the Artifact tool and every
other file in the folder alongside it (the list is in files.json). Nothing in site/ changes.

What differs from site/:
- index.html loses its <html>/<head>/<body> wrapper, because the publisher supplies one.
  Its language and data-root attributes are carried over in a one-line script.
- css/fonts.css keeps only the font files some page can actually use. The two Noto
  families come in about 215 unicode-range pieces, an Artifact allows 255 files in all,
  and a browser only ever fetches the pieces whose characters appear on the page, so
  nothing a visitor sees is lost.
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / ".claude" / "artifact-build"

TITLE = "tuan photography 陳亮元"
FILE_LIMIT = 255


def page_form(html: str) -> str:
    """The page itself: no document wrapper, short title, stylesheets kept."""
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
    tag = re.search(r"<html[^>]*>", html).group(0)
    lang = re.search(r'\blang="([^"]*)"', tag)
    root = re.search(r'\bdata-root="([^"]*)"', tag)
    keep = [
        f"<title>{TITLE}</title>",
        "<script>document.documentElement.lang = '%s'; document.documentElement.dataset.root = '%s';</script>"
        % (lang.group(1) if lang else "en", root.group(1) if root else ""),
    ]
    keep += [t for t in re.findall(r"<link[^>]+>", head) if 'rel="stylesheet"' in t]
    return "\n".join(keep) + "\n" + body.strip() + "\n"


def used_characters() -> set:
    """Every character any page can show, including the 中文 strings scripts swap in."""
    chars = set()
    for path in list(SITE.rglob("*.html")) + list((SITE / "js").glob("*.js")):
        chars.update(path.read_text(encoding="utf-8"))
    return chars


def in_ranges(spec: str, chars: set) -> bool:
    for item in spec.split(","):
        item = item.strip().upper().removeprefix("U+")
        if "-" in item:
            lo, hi = item.split("-")
        else:
            lo, hi = item.replace("?", "0"), item.replace("?", "F")
        lo, hi = int(lo, 16), int(hi, 16)
        if any(lo <= ord(c) <= hi for c in chars):
            return True
    return False


def prune_fonts(chars: set) -> tuple[str, set]:
    """fonts.css with only the @font-face blocks a page can reach, plus their files."""
    css = (SITE / "css" / "fonts.css").read_text(encoding="utf-8")
    header, *blocks = re.split(r"(?=@font-face)", css)
    kept, files = [], set()
    for block in blocks:
        src = re.search(r"url\(([^)]+)\)", block).group(1).strip("'\"")
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        if rng is None or in_ranges(rng.group(1), chars):
            kept.append(block)
            files.add((SITE / "css" / src).resolve().relative_to(SITE))
    note = f"/* Artifact copy: {len(kept)} of {len(blocks)} pieces kept, see tools/build_artifact.py */\n"
    return header + note + "".join(kept), files


def add_selftest(files: list) -> None:
    """Test-only: selftest.html, reached by opening the artifact link with #selftest."""
    pages = ["index.html"] + [f for f in files if f.endswith(".html")]
    page = (ROOT / "tools" / "artifact_selftest.html").read_text(encoding="utf-8")
    (OUT / "selftest.html").write_text(page.replace("/*PAGES*/[]", json.dumps(pages)), encoding="utf-8")
    index = OUT / "index.html"
    hook = "<script>if (location.hash === '#selftest') location.replace('selftest.html');</script>\n"
    index.write_text(index.read_text(encoding="utf-8") + hook, encoding="utf-8")
    files.append("selftest.html")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    fonts_css, font_files = prune_fonts(used_characters())
    files = []
    for src in sorted(SITE.rglob("*")):
        if not src.is_file() or src.name.startswith("."):
            continue
        rel = src.relative_to(SITE)
        if rel.parts[0] == "fonts" and not (src.suffix == ".txt" or rel in font_files):
            continue  # a font piece no page can use (licence files stay)
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if str(rel) == "index.html":
            dst.write_text(page_form(src.read_text(encoding="utf-8")), encoding="utf-8")
            continue
        if str(rel) == "css/fonts.css":
            dst.write_text(fonts_css, encoding="utf-8")
        else:
            shutil.copyfile(src, dst)
        files.append(str(rel))
    if "--selftest" in sys.argv:
        add_selftest(files)
    (OUT / "files.json").write_text(json.dumps(files, ensure_ascii=False, indent=1))
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(files)} files + index.html, {total / 1e6:.1f} MB -> {OUT}")
    if len(files) + 1 > FILE_LIMIT:
        sys.exit(f"too many files for one Artifact (limit {FILE_LIMIT})")


if __name__ == "__main__":
    main()
