#!/usr/bin/env python3
"""Build the Claude Artifact copy of the site into _artifact/.

An Artifact is one page (index.html) plus supporting files served beside it.
The page itself is wrapped by the publisher in its own <html>/<head>/<body>,
so index.html is rewritten without those tags; every other file is copied
as it is, keeping the folder layout so relative links still resolve.

Run from anywhere:  python3 tools/build_artifact.py
Add --selftest to include the test page (tools/artifact_selftest.html).
Prints the list of supporting files to publish alongside _artifact/index.html.
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_artifact"

TITLE = "tuan photography 陳亮元"

SITE_GLOBS = [
    "*.html", "continents/*.html", "countries/*.html", "posts/*.html",
    "css/*.css", "js/*.js",
    "images/*.svg", "images/web/*.jpg",
    "icons/*", "favicon.ico", "site.webmanifest",
]


def page_form(html: str) -> str:
    """Strip the document wrapper; keep title, fonts and stylesheet up top."""
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
    keep = [f"<title>{TITLE}</title>"]
    lang = re.search(r'<html[^>]*\blang="([^"]+)"', html)
    if lang:  # the publisher's <html> has no lang attribute; carry ours over
        keep.append(f"<script>document.documentElement.lang = '{lang.group(1)}';</script>")
    for tag in re.findall(r"<link[^>]+>", head):
        if "fonts.g" in tag or 'rel="stylesheet"' in tag:
            keep.append(tag)
    return "\n".join(keep) + "\n" + body.strip() + "\n"


def add_selftest(files: list) -> None:
    """Test-only: add selftest.html, reached by opening the artifact link with #selftest."""
    pages = ["index.html"] + [f for f in files if f.endswith(".html")]
    page = (ROOT / "tools" / "artifact_selftest.html").read_text(encoding="utf-8")
    (OUT / "selftest.html").write_text(
        page.replace("/*PAGES*/[]", json.dumps(pages)), encoding="utf-8")
    index = OUT / "index.html"
    hook = """<script>
if (location.hash === '#selftest') location.replace('selftest.html');
if (location.hash === '#scrolltest') window.addEventListener('load', () => {
  window.scrollTo({ top: 1400, behavior: 'instant' });
  const b = document.createElement('p');
  b.style.cssText = 'position:fixed;left:0;bottom:0;z-index:999;margin:0;padding:6px 10px;background:#241d15;color:#f6efe3;font:12px monospace';
  b.textContent = 'scrollY ' + Math.round(scrollY) + ' of ' + (document.scrollingElement.scrollHeight - innerHeight)
    + ' · html overflow ' + getComputedStyle(document.documentElement).overflowY
    + ' · body overflow ' + getComputedStyle(document.body).overflowY + ' · mode ' + document.compatMode;
  document.body.appendChild(b);
});
if (location.hash === '#inputtest') window.addEventListener('load', () => {
  const b = document.createElement('p');
  b.style.cssText = 'position:fixed;left:0;bottom:0;z-index:999;margin:0;padding:6px 10px;background:#241d15;color:#f6efe3;font:12px monospace;pointer-events:none';
  const log = [];
  const show = () => { b.textContent = 'tab ' + document.visibilityState + ' · lang ' + document.documentElement.lang
    + ' · scrollY ' + Math.round(scrollY) + ' · events: ' + (log.join(' | ') || 'none yet'); };
  for (const type of ['click', 'wheel', 'keydown']) window.addEventListener(type, e => {
    const t = e.target;
    log.push(type + (e.isTrusted ? '' : '(synthetic)') + '→' + (t.tagName || 'window') + (t.id ? '#' + t.id : '') + '@' + Math.round(e.clientX || 0) + ',' + Math.round(e.clientY || 0));
    if (log.length > 6) log.shift();
    setTimeout(show, 50);
  }, true);
  window.addEventListener('scroll', show, { passive: true });
  document.body.appendChild(b);
  show();
});
</script>
"""
    index.write_text(index.read_text(encoding="utf-8") + hook, encoding="utf-8")
    files.append("selftest.html")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    files = []
    for pattern in SITE_GLOBS:
        for src in sorted(ROOT.glob(pattern)):
            if not src.is_file() or src.name.startswith("."):
                continue
            rel = src.relative_to(ROOT)
            dst = OUT / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if str(rel) == "index.html":
                dst.write_text(page_form(src.read_text(encoding="utf-8")), encoding="utf-8")
            else:
                shutil.copyfile(src, dst)
                files.append(str(rel))
    if "--selftest" in sys.argv:
        add_selftest(files)
    (OUT / "files.json").write_text(json.dumps(files, ensure_ascii=False, indent=1))
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(files)} supporting files + index.html, {total / 1e6:.1f} MB -> {OUT}")


if __name__ == "__main__":
    main()
