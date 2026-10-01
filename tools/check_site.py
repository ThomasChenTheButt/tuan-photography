#!/usr/bin/env python3
"""網站健康檢查 — checks that nothing on the site points at something missing.

    python3 tools/check_site.py                 check design 1/
    python3 tools/check_site.py --save f.json   also note each page's contents in f.json
    python3 tools/check_site.py --compare f.json   also say which pages differ from that note

It opens every page and follows every link, photograph, stylesheet, script, font and icon
that lives on this site, and reports any that lead nowhere. It reads only; nothing is changed.
Addresses on other websites (Instagram, maps) are counted but not visited.

Use --save before a risky change and --compare after it. The build stamp (?v=…) is ignored,
so two builds of the same site compare as identical.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "design 1"
ELSEWHERE = re.compile(r"^(https?:|mailto:|tel:|data:|javascript:|//|#)")
STAMP = re.compile(r"\?v=\d+")


def targets(text):
    """Every address a page or stylesheet asks for."""
    for m in re.finditer(r'\b(?:href|src|poster)="([^"]*)"', text):
        yield m.group(1)
    for m in re.finditer(r'\bsrcset="([^"]*)"', text):
        for part in m.group(1).split(","):
            if part.strip():
                yield part.strip().split()[0]
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", text):
        yield m.group(1)


def check(folder):
    missing, outside, pages, followed = [], 0, {}, 0
    files = sorted(list(folder.rglob("*.html")) + list(folder.rglob("*.css"))
                   + list(folder.rglob("*.webmanifest")))
    for f in files:
        text = f.read_text(encoding="utf-8")
        rel = f.relative_to(folder).as_posix()
        if f.suffix == ".html":
            pages[rel] = hashlib.sha1(STAMP.sub("", text).encode("utf-8")).hexdigest()
        if f.suffix == ".webmanifest":
            wanted = [i["src"] for i in json.loads(text).get("icons", [])]
        else:
            wanted = list(targets(text))
        for t in wanted:
            if ELSEWHERE.match(t):
                outside += 1
                continue
            path = t.split("#")[0].split("?")[0]
            if not path:
                continue
            base = folder if path.startswith("/") else f.parent
            goal = (base / path.lstrip("/")).resolve()
            followed += 1
            if not goal.exists():
                missing.append((rel, t, "leads nowhere"))
            elif folder.resolve() not in goal.parents and goal != folder.resolve():
                missing.append((rel, t, "leaves the site folder"))
    return pages, missing, followed, outside


def main():
    args = sys.argv[1:]
    save = args[args.index("--save") + 1] if "--save" in args else None
    compare = args[args.index("--compare") + 1] if "--compare" in args else None
    named = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or not args[i - 1].startswith("--"))]
    folder = Path(named[0]).resolve() if named else SITE
    pages, missing, followed, outside = check(folder)
    print(f"{len(pages)} pages, {followed} addresses followed, {outside} on other websites")
    for page, target, why in missing:
        print(f"  ! {page}: {target} ({why})")
    print("nothing missing" if not missing else f"{len(missing)} problems")
    if save:
        Path(save).write_text(json.dumps(pages, indent=1, sort_keys=True), encoding="utf-8")
        print(f"noted {len(pages)} pages in {save}")
    changed = []
    if compare:
        before = json.loads(Path(compare).read_text(encoding="utf-8"))
        gone = sorted(set(before) - set(pages))
        new = sorted(set(pages) - set(before))
        changed = sorted(p for p in pages if p in before and pages[p] != before[p])
        print(f"compared with {compare}: {len(gone)} pages gone, {len(new)} new, {len(changed)} changed")
        for label, group in (("gone", gone), ("new", new), ("changed", changed)):
            for p in group:
                print(f"  {label}: {p}")
        changed = gone + new + changed
    sys.exit(1 if missing or changed else 0)


if __name__ == "__main__":
    main()
