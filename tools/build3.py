#!/usr/bin/env python3
"""Build the data for design 3, "One day of light".

    python3 tools/build3.py

Reads data/site.json (photographs, countries, trips) and content/barcelona.* and writes
design 3/data.js (window.SITE) and design 3/guides/barcelona.body.js.

The idea of design 3: every photograph is placed at the hour it was taken, local time. The camera
clock was never moved to the local zone (it stayed on Taiwan time in 2024 and 2025, and on US
Eastern time in 2026), but the file records the zone it was set to, so the real moment is known.
From that moment and the place, the sun's height above the horizon is worked out, and from the
height, the light: night, blue hour, golden hour or daylight. Nothing is guessed: a photograph
whose file lost its camera data is left off the clock.
"""
import datetime as dt
import html
import json
import math
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import build as b  # noqa: E402  (the old build's text cleaners: no long dashes, full-width 中文 marks)

OUT = ROOT / "design 3"
D = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
WEB = ROOT / "design 1" / "images" / "web"

ZONES = {
    "spain": "Europe/Madrid", "andorra": "Europe/Andorra", "france": "Europe/Paris",
    "uk": "Europe/London", "germany": "Europe/Berlin", "switzerland": "Europe/Zurich",
    "netherlands": "Europe/Amsterdam", "taiwan": "Asia/Taipei", "japan": "Asia/Tokyo",
    "south-korea": "Asia/Seoul", "hong-kong": "Asia/Hong_Kong", "china": "Asia/Shanghai",
    "singapore": "Asia/Singapore", "vietnam": "Asia/Ho_Chi_Minh", "dubai": "Asia/Dubai",
    "thailand": "Asia/Bangkok", "myanmar": "Asia/Yangon", "malaysia": "Asia/Kuching",
    "australia": "Australia/Brisbane", "new-zealand": "Pacific/Auckland",
}


def zone(s):
    if s["country"] == "usa":
        return "America/Los_Angeles" if s["ll"][1] < -100 else "America/New_York"
    return ZONES[s["country"]]


def exif_moment(path):
    """The moment the shutter fired, as an aware UTC datetime, from the file's own EXIF."""
    try:
        ifd = Image.open(path).getexif().get_ifd(0x8769)
    except Exception:
        return None
    t, off = ifd.get(36867), ifd.get(36881)
    if not t or not off:
        return None
    sign = 1 if off[0] == "+" else -1
    hh, mm = int(off[1:3]), int(off[4:6])
    tz = dt.timezone(sign * dt.timedelta(hours=hh, minutes=mm))
    return dt.datetime.strptime(t, "%Y:%m:%d %H:%M:%S").replace(tzinfo=tz).astimezone(dt.timezone.utc)


def sun_altitude(when, lat, lng):
    """The sun's height above the horizon in degrees (NOAA's approximation, refraction ignored)."""
    jd = when.timestamp() / 86400 + 2440587.5
    n = jd - 2451545.0
    L = (280.460 + 0.9856474 * n) % 360
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    lam = math.radians(L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * n)
    dec = math.asin(math.sin(eps) * math.sin(lam))
    ra = math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))
    gmst = (18.697374558 + 24.06570982441908 * n) % 24
    ha = math.radians((gmst * 15 + lng) - math.degrees(ra))
    la = math.radians(lat)
    return math.degrees(math.asin(math.sin(la) * math.sin(dec) + math.cos(la) * math.cos(dec) * math.cos(ha)))


def light(alt, hour):
    """The kind of light, from the sun's height. Morning and evening are told apart by the hour."""
    if alt < -8:
        return "night"
    if alt < -1:
        return "blue-am" if hour < 12 else "blue-pm"
    if alt < 8:
        return "golden-am" if hour < 12 else "golden-pm"
    return "day"


def clean(pair):
    return {"en": b.clean_en(pair["en"]), "zh": b.clean_zh(pair["zh"])} if pair else None


def photos():
    out = []
    for s in D["slides"]:
        p = {k: s[k] for k in ("id", "file", "w", "h", "country", "ll") if k in s}
        for k in ("place", "where", "alt", "note", "best"):
            if k in s:
                p[k] = clean(s[k])
        for k in ("camera", "lens", "focal", "aperture", "shutter", "iso", "map", "city"):
            if k in s:
                p[k] = s[k]
        if s.get("guide"):
            p["guide"] = "barcelona"
        when = exif_moment(WEB / s["file"])
        if when:
            local = when.astimezone(ZoneInfo(zone(s)))
            alt = sun_altitude(when, *s["ll"])
            p["date"] = local.strftime("%Y-%m-%d")
            p["time"] = local.strftime("%H:%M")
            p["min"] = local.hour * 60 + local.minute
            p["sun"] = round(alt, 1)
            p["light"] = light(alt, local.hour)
        out.append(p)
    return out


def trips(ph):
    """His trips with their legs, newest first, each with the photographs taken on it."""
    res = []
    for j in D["journeys"]:
        months = sorted({l["month"] for l in j["legs"] if l.get("month")})
        res.append({"id": j["id"], "label": clean(j["label"]), "countries": j["countries"],
                    "months": months, "legs": j["legs"], "photos": []})
    for p in ph:
        mine = [t for t in res if p["country"] in t["countries"]]
        if not mine:
            continue
        if "date" not in p:
            # a photograph whose file lost its date: the latest trip to that country, marked as such
            mine[0]["photos"].append(p["id"])
            p["tripGuess"] = True
            continue
        ym = p["date"][:7]
        hit = next((t for t in mine if t["months"] and t["months"][0] <= ym <= t["months"][-1]), None)
        if not hit:
            hit = next((t for t in mine if not t["months"] and t["id"][:4] == p["date"][:4]), None)
        if not hit:  # taken on the way home from another trip (Shanghai, July 2026): the nearest trip there
            def gap(t):
                m = t["months"][0] if t["months"] else t["id"][:4] + "-06"
                return abs(int(m[:4]) * 12 + int(m[5:7]) - int(ym[:4]) * 12 - int(ym[5:7]))
            hit = min(mine, key=gap)
        hit["photos"].append(p["id"])
        p["trip"] = hit["id"]
    for t in res:
        for pid in t["photos"]:
            next(p for p in ph if p["id"] == pid).setdefault("trip", t["id"])
    return res


def km(a, b):
    """Great-circle distance in km between two [lat, lng] points."""
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def visits(countries, journeys):
    """For every country, each visit: when, and how he came in (the first leg of the trip that
    arrives there: its airport code, city and mode). A leg's end belongs to the nearest country of
    that trip, if it lies within 1500 km of it; a stop elsewhere (Shanghai on the way home) is not."""
    by = {c["id"]: c for c in countries}
    out = {c["id"]: [] for c in countries}
    for j in journeys:
        for cid in j["countries"]:
            entry = j["legs"][0] if len(j["countries"]) == 1 and j["legs"] else None   # one country: the flight out is the way in
            for l in ([] if entry else j["legs"]):
                to = [l["to"]["lat"], l["to"]["lng"]]
                near = min(j["countries"], key=lambda c: km(to, by[c]["ll"]))
                if near == cid and km(to, by[cid]["ll"]) < 1500:
                    entry = l
                    break
            month = (entry or {}).get("month") or next((l["month"] for l in j["legs"] if l.get("month")), None)
            v = {"trip": j["id"], "when": month or j["id"][:4]}
            if entry:
                v["via"] = {k: entry["to"][k] for k in ("code", "city", "zh") if entry["to"].get(k)}
                v["via"]["mode"] = entry["mode"]
            out[cid].append(v)
    for cid in out:
        out[cid].sort(key=lambda v: v["when"])
    return out


def figure(pid, ph, cls):
    p = next(x for x in ph if x["id"] == pid)
    data = "  ".join(x for x in (p.get("focal"), p.get("aperture"), p.get("shutter"), "ISO " + p["iso"] if p.get("iso") else None) if x)
    return (f'<figure class="{cls}"><button type="button" class="ph" data-open="{pid}" '
            f'style="--ar:{p["w"] / p["h"]:.4f}" aria-label="{html.escape(p["place"]["en"])}" data-i18n-aria="ph_{pid}">'
            f'<img src="../images/web/1280/{p["file"]}" srcset="../images/web/640/{p["file"]} 640w, ../images/web/1280/{p["file"]} 1280w, ../images/web/{p["file"]} {p["w"]}w" '
            f'sizes="(max-width: 48rem) 94vw, 60vw" width="{p["w"]}" height="{p["h"]}" alt="{html.escape(p["alt"]["en"])}" data-i18n-alt="pa_{pid}" loading="lazy" decoding="async"></button>'
            f'<figcaption><span data-i18n="pp_{pid}">{html.escape(p["place"]["en"])}</span>'
            f'<span class="mono">{html.escape(p.get("time", ""))}{"  " + html.escape(data) if data else ""}</span></figcaption></figure>')


def guide(ph):
    d = json.loads((ROOT / "content" / "barcelona.i18n.json").read_text(encoding="utf-8"))
    en, zh = d["en"], d["zh"]
    body = (ROOT / "content" / "barcelona.body.html").read_text(encoding="utf-8")
    body = body[body.index('<div class="read">'):]
    body = body[: body.rindex("</div>")]  # the outer wrap
    body = re.sub(r'\s*style="--i:\s*\d+"', "", body)
    body = re.sub(r"[ \t]*<tr><td data-i18n=\"(\w+)\">[^<]*</td><td data-i18n=\"(\w+)\">[^<]*</td></tr>\n",
                  lambda m: "" if en.get(m.group(2), "").strip() in ("", "-", "—", "–") else m.group(0), body)
    body = re.sub(r"\{plate:([a-z0-9-]+)\}", lambda m: figure(m.group(1), ph, "g-fig g-fig--wide"), body)
    body = re.sub(r"\{side:([a-z0-9-]+)\}", lambda m: figure(m.group(1), ph, "g-fig g-fig--side"), body)
    body = re.sub(r"\{shot:([a-z0-9-]+)\}", lambda m: figure(m.group(1), ph, "g-fig"), body)
    body = re.sub(r"\{map:([^}]+)\}", lambda m: f'<a class="maplink" href="{m.group(1)}" target="_blank" rel="noopener" data-i18n="mapLink">Map</a>', body)
    body = body.replace("{ate}", '<span class="ate" data-i18n="ate">eaten</span>').replace("{root}", "../")
    body = b.no_dash_en(body)
    en = {k: b.clean_en(v) for k, v in en.items()}
    zh = {k: b.clean_zh(v) for k, v in zh.items()}
    for p in ph:
        en[f"ph_{p['id']}"], zh[f"ph_{p['id']}"] = p["place"]["en"], p["place"]["zh"]
        en[f"pp_{p['id']}"], zh[f"pp_{p['id']}"] = p["place"]["en"], p["place"]["zh"]
        en[f"pa_{p['id']}"], zh[f"pa_{p['id']}"] = p["alt"]["en"], p["alt"]["zh"]
    return {"html": body, "en": en, "zh": zh}


def about():
    n = len(D["countries"])
    cams = sorted({s["camera"] for s in D["slides"] if "camera" in s})
    lenses = sorted({s["lens"] for s in D["slides"] if "lens" in s})
    # his own words, approved by him on 2026-10-16
    return {
        "who": clean({"en": f"I photograph the places I travel to, natural landscapes and cities both, and the photograph is always about the place: its scale and its light. I live in Taiwan and have been to {n} countries, the first of them Malaysia, when I was eight.",
                      "zh": f"我拍旅途中的風景，自然與城市都拍，但照片拍的永遠是那個地方本身：它的尺度，它的光。我住在台灣，去過 {n} 個國家，第一個是八歲那年的馬來西亞。"}),
        "look": clean({"en": "I go out for the hour when the light suits a place, and I'll wait for it. I leave myself out of the frame, and I'm not interested in spots that are famous only for being photographed.",
                       "zh": "我出門是為了等一個地方光線最對的那個時刻，願意為它等。我不把自己放進畫面，也對「只因為被拍過才有名」的景點沒興趣。"}),
        "trust": clean({"en": "Every trip starts before I leave, in planning documents: where each spot is, when the sun sets there, how to get there, what to eat nearby. Then I go and stand in those places. The guides here are written afterwards, from what actually happened. I walked every spot in them myself, and every photograph on this site is mine. Some spots get an exact pin; fragile ones are left as a general area on purpose.",
                        "zh": "每趟旅行在出發前就開始了，寫在規劃文件裡：每個機位在哪、那裡幾點日落、怎麼去、附近吃什麼。然後我出發，親自站到那些地方。這裡的攻略都是回來之後，照實際發生的寫成。裡面每個機位我都親自走過，網站上每張照片都是我拍的。有些機位給精確座標，脆弱的地方則刻意只給大概範圍。"}),
        "cameras": cams, "lenses": lenses,
        "mail": "".join(f"&#{ord(ch)};" for ch in D["email"]),
    }


def main():
    ph = photos()
    tr = trips(ph)
    vis = visits(D["countries"], D["journeys"])
    countries = [{"id": c["id"], "continent": c["continent"], "en": c["en"], "zh": c["zh"],
                  "note": clean(c.get("note")) if c.get("note", {}).get("en") else None,
                  "ll": c["ll"], "visits": vis[c["id"]]} for c in D["countries"]]
    continents = [{"id": k["id"], "en": k["en"], "zh": k["zh"], "photo": k.get("photo"),
                   "sub": clean(k.get("sub") or k.get("state"))} for k in D["continents"]]
    g = D["guides"][0]
    site = {"photos": ph, "trips": tr, "countries": countries, "continents": continents,
            "guide": {"id": g["id"], "country": g["country"], "lead": g["lead"], "title": g["title"], "facts": clean(g["facts"])},
            "about": about(), "instagram": D["instagram"], "home": [25.03, 121.56]}
    js = "window.SITE = " + json.dumps(site, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (OUT / "data.js").write_text(js, encoding="utf-8")
    gd = guide(ph)
    (OUT / "guides" / "barcelona.body.js").write_text(
        "window.GUIDE = " + json.dumps(gd, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    timed = [p for p in ph if "min" in p]
    print(f"wrote data.js: {len(ph)} photographs, {len(timed)} on the clock, {len(tr)} trips")
    for k in ("night", "blue-am", "golden-am", "day", "golden-pm", "blue-pm"):
        print(f"  {k:10} {sum(1 for p in timed if p['light'] == k)}")


if __name__ == "__main__":
    main()
