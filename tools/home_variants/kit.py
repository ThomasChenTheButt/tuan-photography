"""Experiment home-variations: what every home-page variation is built from.

Each variation is one module, tools/home_variants/vNN.py, with
    META = {"name": {"en": ..., "zh": ...}, "idea": {"en": ..., "zh": ...}}
    def build(k): return body, en, zh
where k is this module. Its look lives in design 1/css/home-variants/vNN.css (loaded after
style.css) and, only if it needs one, its behaviour in design 1/js/home-variants/vNN.js.
The page is written to design 1/home-variants/vNN.html by run.py, through the site's own
write(), so the top bar, footer, language switch and photo viewer are the real ones.

Every fact on a variation comes from data/site.json or the photograph's own file. Nothing
is invented: no stories, no times of day, no quotes.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import build as b   # noqa: E402  the site's own builder: helpers, data, write()

ROOT, OUT, DATA, SLIDES, COUNTRIES = b.ROOT, b.OUT, b.DATA, b.SLIDES, b.COUNTRIES
ROOT_URL = "../"   # variations live one folder down, in design 1/home-variants/
e = b.e

MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August",
             "September", "October", "November", "December"]


def taken(sid):
    """The month a photograph was taken, from its own file, as 'YYYY-MM', or None.
    (Only the month is used: the camera clock's time zone is unknown, so the hour is not shown.)"""
    try:
        from PIL import Image
        with Image.open(OUT / "images" / "web" / SLIDES[sid]["file"]) as im:
            v = im.getexif().get_ifd(0x8769).get(36867)
        m = re.match(r"(\d{4}):(\d\d)", v or "")
        return f"{m[1]}-{m[2]}" if m else None
    except Exception:
        return None


def month_words(ym):
    if not ym:
        return None
    y, m = ym.split("-")
    return {"en": f"{MONTHS_EN[int(m) - 1]} {y}", "zh": f"{y} 年 {int(m)} 月"}


def trip(sid):
    """The journey (from data/site.json "journeys") this photograph was taken on, matched by
    its country and month, or None. Returns {"id", "label": {en, zh}}."""
    ym, c = taken(sid), SLIDES[sid]["country"]
    if not ym:
        return None
    for j in DATA["journeys"]:
        if c in j.get("countries", []) and any(leg.get("month") == ym for leg in j.get("legs", [])):
            return {"id": j["id"], "label": j["label"]}
    return None


def guide(sid):
    """The written guide for this photograph's country: {"href", "title": {en, zh}}, or None."""
    c = SLIDES[sid]["country"]
    g = next((g for g in DATA["guides"] if g["country"] == c), None)
    return {"href": g["href"], "title": g["title"]} if g else None


def facts(sid):
    """Everything the site knows about one photograph, ready to set:
    place, where (both {en, zh}), alt, camera (list of strings, empty when the file lost its
    data: never invent it), body and lens (strings or None), month ({en, zh} or None),
    trip ({id, label} or None), guide ({href, title} or None), country_href, note and best
    ({en, zh} or None; only three photographs have them)."""
    s = SLIDES[sid]
    cam = [s["focal"], s["aperture"], s["shutter"], "ISO " + s["iso"]] if "focal" in s else []
    return {
        "id": sid, "place": s["place"], "where": s["where"], "alt": s["alt"],
        "camera": cam, "body": s.get("camera"), "lens": s.get("lens"),
        "month": month_words(taken(sid)), "trip": trip(sid), "guide": guide(sid),
        "country_href": f"countries/{s['country']}.html",
        "note": s.get("note"), "best": s.get("best"), "w": s["w"], "h": s["h"], "file": s["file"],
    }


def words(en, zh, key, pair):
    """Register a pair of strings under key in both page dictionaries; returns the English."""
    en[key], zh[key] = pair["en"], pair["zh"]
    return pair["en"]


def opens(sid, en, zh):
    """Attributes for a link that opens a photograph in the site's viewer ("how it was made")."""
    b.strings(SLIDES[sid], en, zh)
    return b.opens(sid, ROOT_URL, en, zh)


def img(sid, sizes, first=False, soon=False, named=True):
    return b.img(SLIDES[sid], ROOT_URL, sizes, first=first, soon=soon, named=named)


def piece(sid, en, zh, sizes, **kw):
    return b.piece(sid, ROOT_URL, en, zh, sizes, **kw)


def cover(sid, en, zh):
    """The opening photograph, full window, only its small place line on it (the brief)."""
    return b.cover(sid, ROOT_URL, en, zh)


def window(sid, en, zh):
    return b.window(sid, ROOT_URL, en, zh)


NAV = b.NAV   # (id, i18n key, English label, href); the keys already have both languages in main.js
IG = b.IG


def write(n, body, en, zh, js=False):
    """Write design 1/home-variants/vNN.html with its own stylesheet (and script)."""
    name = f"v{n:02d}"
    path = f"home-variants/{name}.html"
    title = f"{b.SITE} - Home, variation {n}"
    b.write(path, title, f"{b.SITE} - 首頁 第 {n} 版", "Home page variation, experiment home-variations.",
            None, body, en, zh, over=True, scripts=((f"home-variants/{name}.js",) if js else ()))
    f = OUT / path
    t = f.read_text(encoding="utf-8")
    link = f'  <link rel="stylesheet" href="../css/home-variants/{name}.css?v={b.STAMP}">\n</head>'
    f.write_text(t.replace("</head>", link, 1), encoding="utf-8")
