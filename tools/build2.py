#!/usr/bin/env python3
"""Design 2 — the facts the redesign is drawn from.

Design 2 is a second website kept beside design 1 (see CLAUDE.md). Both are made from the
same facts: data/site.json, content/ and the photographs. This script reads them and writes
one file, design 2/data.js, which every design 2 page loads. Nothing in design 1 changes.

    python3 tools/build2.py

What it writes, as window.SITE:
  countries  every country travelled, with its place on the map (ll) and its photographs
  slides     every photograph: file, shape, names, camera data, place on the map
  books      the guides as books, one per country, in the owner's order (the same as design 1)
  guides     each written guide as a ready piece of HTML plus its words in both languages
  i18n       the shared words in both languages

Paths to photographs are written from a page one folder down (design 2/<version>/), so
they begin "../images/". design 2/images is a link to design 1's photographs.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build as b   # noqa: E402  (design 1's builder: its helpers, not its pages)

ROOT = b.ROOT
OUT = ROOT / "design 2"
D = b.DATA
TONES = ("clay", "olive", "slate")


def slide(s):
    keep = ("file", "w", "h", "country", "ll", "place", "where", "alt", "best", "note", "map",
            "camera", "lens", "focal", "aperture", "shutter", "iso", "guide")
    out = {k: s[k] for k in keep if k in s}
    for field in ("place", "where", "alt", "best", "note"):
        if field in out:
            out[field] = {"en": b.clean_en(out[field]["en"]), "zh": b.clean_zh(out[field]["zh"])}
    return out


def guide_html(name):
    """The guide's text as one piece of HTML, made the way design 1 makes its page, minus the
    trail of links back to pages design 2 does not have."""
    d = json.loads((ROOT / "content" / f"{name}.i18n.json").read_text(encoding="utf-8"))
    en, zh = dict(d["en"]), dict(d["zh"])
    root = "../"
    body = (ROOT / "content" / f"{name}.body.html").read_text(encoding="utf-8")
    body = re.sub(r'\s*<ol class="path.*?</ol>', "", body, flags=re.S)
    body = body.replace("{root}", root)
    body = re.sub(r"[ \t]*<tr><td data-i18n=\"(\w+)\">[^<]*</td><td data-i18n=\"(\w+)\">[^<]*</td></tr>\n",
                  lambda m: "" if en.get(m.group(2), "").strip() in ("", "-", "—", "–") else m.group(0), body)
    body = re.sub(r"\{plate:([a-z0-9-]+)\}",
                  lambda m: b.piece(m.group(1), root, en, zh, "(max-width: 80rem) 92vw, 74rem", anchor=True, data=True), body)
    body = re.sub(r"\{side:([a-z0-9-]+)\}",
                  lambda m: b.piece(m.group(1), root, en, zh, "(max-width: 46rem) 92vw, 30rem", anchor=True, data=True), body)
    body = body.replace('<div class="shots">', '<div class="wall__row shots">')
    body = re.sub(r"\{shot:([a-z0-9-]+)\}", lambda m: b.shot(m.group(1), root, en, zh), body)
    body = re.sub(r"\{map:([^}]+)\}",
                  lambda m: f'<a href="{m.group(1)}" target="_blank" rel="noopener" data-i18n="mapLink">Map</a>', body)
    body = body.replace("{ate}", '<span class="ate" data-i18n="ate">eaten</span>')
    en.setdefault("mapLink", "Map")
    zh.setdefault("mapLink", "地圖")
    en.setdefault("ate", "eaten")
    zh.setdefault("ate", "吃過")
    return body, {k: b.clean_en(v) for k, v in en.items()}, {k: b.clean_zh(v) for k, v in zh.items()}


def main():
    slides = {s["id"]: slide(s) for s in D["slides"]}
    countries = []
    for c in D["countries"]:
        countries.append({
            "id": c["id"], "continent": c["continent"], "ll": c["ll"],
            "name": {"en": c["en"], "zh": c["zh"]},
            "note": {"en": b.clean_en(c["note"]["en"]), "zh": b.clean_zh(c["note"]["zh"])},
            "date": c["date"],
            "photos": [s["id"] for s in D["slides"] if s["country"] == c["id"]],
        })
    guides, books = {}, []
    for g in D["guides"]:
        html, en, zh = guide_html(g["id"])
        guides[g["id"]] = {"country": g["country"], "ll": g.get("ll"), "lead": g["lead"],
                           "title": g["title"],
                           "facts": {"en": b.clean_en(g["facts"]["en"]), "zh": b.clean_zh(g["facts"]["zh"])},
                           "html": html, "i18n": {"en": en, "zh": zh}}
    for i, x in enumerate(D["shelf"]):
        if "guide" in x:
            g = next(y for y in D["guides"] if y["id"] == x["guide"])
            books.append({"id": g["id"], "country": g["country"], "guide": g["id"], "title": g["title"],
                          "photo": x.get("photo") or g["lead"], "cover": x.get("cover") or g["lead"],
                          "band": "bandGuide", "status": "bookOpen",
                          "tone": TONES[i % 3]})
        else:
            c = b.COUNTRIES[x["country"]]
            photo = x.get("photo") or next((s["id"] for s in D["slides"] if s["country"] == c["id"]), None)
            books.append({"id": c["id"], "country": c["id"], "guide": None,
                          "title": x.get("title") or {"en": c["en"], "zh": c["zh"]}, "photo": photo,
                          "cover": x.get("cover") or photo,
                          "band": "bandPhotos" if photo else "bandNone", "status": "bookNot",
                          "tone": TONES[i % 3]})
    i18n = {
        "en": {"site": b.SITE, "line": "Travel like a photographer", "series": "tuan photography",
               "bandGuide": "A photographer's guide", "bandPhotos": "Photographs", "bandNone": "No photographs yet",
               "bookOpen": "Read the guide", "bookNot": "Guide not written yet", "follow": "Follow on Instagram",
               "close": "Close", "back": "Back to the map", "photos": "Photographs", "home": "Home base",
               "made": "How it was made", "best": "Best light"},
        "zh": {"site": b.SITE, "line": "像攝影師一樣旅行", "series": "tuan photography",
               "bandGuide": "攝影師的攻略", "bandPhotos": "作品", "bandNone": "還沒有照片",
               "bookOpen": "閱讀攻略", "bookNot": "攻略還沒寫", "follow": "在 Instagram 追蹤",
               "close": "關閉", "back": "回到地圖", "photos": "作品", "home": "家",
               "made": "這張怎麼拍", "best": "最佳光線"},
    }
    # journeys: the countries that share a travel date in his data, one journey per date, in the
    # order he lists them. Nothing is added: the grouping comes only from those dates. The flights
    # are drawn from Taipei to each place, where he flies from (to be confirmed by him).
    journeys, by_date = [], {}
    if D.get("journeys"):
        # his real journeys and their legs, taken from his own trip documents (2026-10-02)
        for j in D["journeys"]:
            journeys.append({"id": j["id"], "date": {"en": b.clean_en(j["label"]["en"]), "zh": b.clean_zh(j["label"]["zh"])},
                             "countries": j["countries"], "legs": j["legs"]})
    for c in ([] if journeys else D["countries"]):
        if c["id"] == "taiwan":
            continue
        key = c["date"]["en"]
        if key not in by_date:
            by_date[key] = {"id": "j-" + re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-"),
                            "date": {"en": b.clean_en(c["date"]["en"]), "zh": b.clean_zh(c["date"]["zh"])},
                            "countries": []}
            journeys.append(by_date[key])
        by_date[key]["countries"].append(c["id"])
    site = {"instagram": D["instagram"], "home": "taiwan", "sizes": list(b.SIZES),
            "countries": countries, "slides": slides, "books": books, "guides": guides, "i18n": i18n,
            "journeys": journeys, "flightsFrom": [25.03, 121.56], "flightsConfirmed": bool(D.get("journeys"))}
    OUT.mkdir(exist_ok=True)
    js = "window.SITE = " + json.dumps(site, ensure_ascii=False).replace("</", "<\\/") + ";\n"
    (OUT / "data.js").write_text(js, encoding="utf-8")
    # design 1's typefaces, named from design 2's own folder (design 2/fonts links to them)
    sheet = (ROOT / "design 1" / "css" / "fonts.css").read_text(encoding="utf-8")
    (OUT / "fonts.css").write_text(sheet.replace("../fonts/", "fonts/"), encoding="utf-8")
    print(f"design 2/data.js: {len(countries)} countries, {len(slides)} photographs, "
          f"{len(books)} books, {len(guides)} guide(s)")


if __name__ == "__main__":
    main()
