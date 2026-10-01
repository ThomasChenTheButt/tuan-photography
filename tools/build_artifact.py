#!/usr/bin/env python3
"""Artifact 版 — package design 1/ so Claude can publish it as a Claude Artifact.

    python3 tools/build_artifact.py              writes .claude/artifact-build/
    python3 tools/build_artifact.py --selftest   also adds selftest.html (test only)

Claude then publishes .claude/artifact-build/index.html with the Artifact tool and every
other file in the folder alongside it (the list is in files.json). Nothing in design 1/ changes.

What differs from design 1/:
- index.html loses its <html>/<head>/<body> wrapper, because the publisher supplies one.
  Its language and data-root attributes are carried over in a one-line script.
- css/fonts.css keeps only the font files some page can actually use. The two Noto
  families come in about 215 unicode-range pieces, an Artifact allows 255 files in all,
  and a browser only ever fetches the pieces whose characters appear on the page, so
  nothing a visitor sees is lost.
- Photographs: two copies each instead of three (the 640px one goes; phones take the
  1280px one), and the big copy is re-encoded to at most 1800px on the long edge. An
  Artifact version may hold 64 MB in all; the site's own copies are 89 MB. The re-encoded
  files are cached in .claude/artifact-build-images/ so a rebuild is quick.
- Icon and manifest tags are dropped from every page: the Artifact shows its own icon,
  and the files would only count against the limit. Font licence texts likewise.
"""
import subprocess
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "design 1"
OUT = ROOT / ".claude" / "artifact-build"

TITLE = "tuan photography 陳亮元"
FILE_LIMIT = 255
SIZE_LIMIT_MB = 64
BIG_EDGE, BIG_QUALITY = 1800, 60      # the copy the viewer shows large
MID_QUALITY = 55                      # the 1280px copy used in rows and on phones
IMG_CACHE = ROOT / ".claude" / "artifact-build-images"


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


def photo_copy(src: Path, edge, quality: int):
    """A re-encoded copy of one photograph (cached by source time); returns path and width."""
    key = f"{edge or 'same'}-{quality}"
    dst = IMG_CACHE / key / src.relative_to(SITE)
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        dst.parent.mkdir(parents=True, exist_ok=True)
        cmd = ["sips"] + (["-Z", str(edge)] if edge else []) + [
            "--setProperty", "formatOptions", str(quality), str(src), "--out", str(dst)]
        subprocess.run(cmd, check=True, capture_output=True)
    out = subprocess.run(["sips", "-g", "pixelWidth", str(dst)], capture_output=True, text=True).stdout
    return dst, int(out.rsplit(":", 1)[1])


def page_copy(html: str, widths: dict) -> str:
    """A page as published: no icon/manifest tags, srcset without the 640px copy,
    and the big copy's width descriptor matching the re-encoded file."""
    html = re.sub(r'\s*<link rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>', "", html)
    html = re.sub(r'\s*<meta name="apple-mobile-web-app-title"[^>]*>', "", html)
    html = re.sub(r"[^\s\"]*images/web/640/[^\s\"]+ 640w,\s*", "", html)
    return re.sub(r'((?:\.\./)*images/web/)([a-z0-9-]+\.jpg) (\d+)w',
                  lambda m: f"{m.group(1)}{m.group(2)} {widths.get(m.group(2), m.group(3))}w", html)


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


def prune_fonts(chars: set):
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
    files, widths = [], {}
    for src in sorted(SITE.rglob("*")):
        if not src.is_file() or src.name.startswith("."):
            continue
        rel = src.relative_to(SITE)
        skip = (
            (rel.parts[0] == "fonts" and rel not in font_files)        # unused piece or licence text
            or rel.parts[0] == "icons" or rel.name in ("favicon.ico", "site.webmanifest")
            or (rel.parts[:2] == ("images", "web") and len(rel.parts) == 4 and rel.parts[2] == "640")
        )
        if skip:
            continue
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix == ".html":
            continue  # pages are written after the photographs, once their widths are known
        if str(rel) == "css/fonts.css":
            dst.write_text(fonts_css, encoding="utf-8")
        elif rel.parts[:2] == ("images", "web") and src.suffix == ".jpg":
            big = len(rel.parts) == 3
            copy, width = photo_copy(src, BIG_EDGE if big else None, BIG_QUALITY if big else MID_QUALITY)
            shutil.copyfile(copy, dst)
            if big:
                widths[src.name] = width
        else:
            shutil.copyfile(src, dst)
        files.append(str(rel))
    for src in sorted(SITE.rglob("*.html")):
        rel = src.relative_to(SITE)
        html = page_copy(src.read_text(encoding="utf-8"), widths)
        if str(rel) == "index.html":
            (OUT / rel).write_text(page_form(html), encoding="utf-8")
        else:
            (OUT / rel).write_text(html, encoding="utf-8")
            files.append(str(rel))
    if "--selftest" in sys.argv:
        add_selftest(files)
    (OUT / "files.json").write_text(json.dumps(files, ensure_ascii=False, indent=1))
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(files)} files + index.html, {total / 1e6:.1f} MB -> {OUT}")
    if len(files) + 1 > FILE_LIMIT:
        sys.exit(f"too many files for one Artifact (limit {FILE_LIMIT})")
    if total / 1e6 > SIZE_LIMIT_MB:
        sys.exit(f"too big for one Artifact version (limit {SIZE_LIMIT_MB} MB)")


if __name__ == "__main__":
    main()
