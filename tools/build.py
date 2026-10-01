#!/usr/bin/env python3
"""Build the site's pages.

    python3 tools/build.py

Reads data/site.json (photographs, countries, guides) and content/ (hand-written
page bodies), and writes plain HTML files into design 1/. Nothing here runs on the live
site: the output is ordinary static pages. design 1/ is the whole website and nothing else.

To add a photograph: put the web-sized file in design 1/images/web/, add an entry to
"slides" in data/site.json, and run this script again.
"""
import hashlib
import html
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "design 1"   # the website itself: everything a visitor receives
DATA = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
SLIDES = {s["id"]: s for s in DATA["slides"]}
COUNTRIES = {c["id"]: c for c in DATA["countries"]}
CONTINENTS = {c["id"]: c for c in DATA["continents"]}
IG = DATA["instagram"]
SIZES = (640, 1280)
SRGB = "/System/Library/ColorSync/Profiles/sRGB Profile.icc"
SITE = "tuan photography 陳亮元"
STAMP = time.strftime("%Y%m%d%H%M")   # added to the stylesheet and script addresses so browsers never show a stale copy

PAPER = "#f7f2e9"   # the page ground, for the browser's own bars

NAV = [("gallery", "navGallery", "Gallery", "gallery.html"),
       ("destinations", "navDestinations", "Destinations", "destinations.html"),
       ("blog", "navBlog", "Blog", "blog.html"),
       ("skills", "navSkills", "Skills", "skills.html"),
       ("about", "navAbout", "About", "about.html")]


def e(text):
    return html.escape(text, quote=True)


# ------------------------------------------------------------------ punctuation

CJK = r"[　-〿㐀-鿿＀-￯]"
PAIRS = {",": "，", ":": "：", ";": "；", "!": "！", "?": "？"}


def zh_punct(text):
    """Chinese text is set with full-width punctuation. Numbers, times and Latin words keep theirs."""
    text = re.sub(rf"(?<={CJK})[,:;!?]|[,:;!?](?={CJK})", lambda m: PAIRS[m.group(0)], text)

    def bracket(m):
        before, inner, after = m.group(1), m.group(2), m.group(3)
        if re.search(CJK, before + inner + after):
            return f"{before}（{inner}）{after}"
        return m.group(0)
    return re.sub(r"(.?)\(([^()<>]*)\)(.?)", bracket, text)


def no_dash_en(text):
    """No long dashes. A dash that introduces something becomes a colon; one that adds on becomes a comma."""
    if text.strip() in ("—", "–"):
        return "-"
    text = re.sub(r">\s*[—–]\s*<", ">-<", text)      # a table cell that only holds a dash
    text = text.replace(" – ", " - ").replace("–", "-")

    def fix(m):
        left = m.string[:m.start()]
        start = max(left.rfind(". "), left.rfind(">"), left.rfind("! "), left.rfind("? "))
        sentence = left[start + 1:]
        rest = m.string[m.end():]
        if re.match(r"(and|or|but|because|so)\b", rest):
            return ", "
        if ":" in sentence:
            return ". " + "\x00"          # marker: capitalise what follows
        return ": "
    text = re.sub(r"\s*—\s*", fix, text)
    return re.sub("\x00(.)", lambda m: m.group(1).upper(), text)


def no_dash_zh(text):
    if text.strip() in ("—", "–"):
        return "-"
    text = text.replace("–", "-")

    def fix(m):
        left = m.string[:m.start()]
        start = max(left.rfind("。"), left.rfind(">"), left.rfind("！"), left.rfind("？"))
        sentence = left[start + 1:]
        rest = m.string[m.end():]
        if rest[:1] in "而或但也因所":
            return "，"
        if len(sentence) <= 14 and not re.search("[，：,:]", sentence):
            return "："
        return "，"
    return re.sub(r"\s*—+\s*", fix, text)


def few_dots(text, zh=False):
    """One middle dot a line at most. Lists of places read as lists."""
    if zh:
        return text.replace("・", "、") if "・" in text else (text.replace(" · ", "、") if text.count("·") > 1 else text)
    return text.replace(" · ", ", ") if text.count("·") > 1 else text


def clean_en(text):
    return few_dots(no_dash_en(text))


def clean_zh(text):
    return zh_punct(few_dots(no_dash_zh(text), zh=True))


# ------------------------------------------------------------------ photographs

def make_sizes():
    """Smaller copies of each photograph for phones and grids, converted to sRGB.

    A copy is remade only when its photograph has changed. That is judged by the photograph's
    contents, noted in data/sizes.json, because file dates change whenever the project
    is copied or restored and would remake every copy for nothing.
    """
    web = OUT / "images" / "web"
    note = ROOT / "data" / "sizes.json"
    made = json.loads(note.read_text(encoding="utf-8")) if note.exists() else {}
    for s in DATA["slides"]:
        src = web / s["file"]
        mark = hashlib.sha1(src.read_bytes()).hexdigest()
        for width in SIZES:
            out = web / str(width) / s["file"]
            if out.exists() and made.get(s["file"]) == mark:
                continue
            out.parent.mkdir(exist_ok=True)
            subprocess.run(["sips", "--resampleWidth", str(width), "-m", SRGB,
                            "--setProperty", "formatOptions", "68", str(src), "--out", str(out)],
                           check=True, capture_output=True)
        made[s["file"]] = mark
    note.write_text(json.dumps(made, indent=1, sort_keys=True) + "\n", encoding="utf-8")


def ratio(s):
    return f"{s['w'] / s['h']:.4f}"


def srcset(s, root):
    base = f"{root}images/web/"
    return ", ".join([f"{base}{w}/{s['file']} {w}w" for w in SIZES] + [f"{base}{s['file']} {s['w']}w"])


def img(s, root, sizes, first=False, soon=False, named=True):
    """first: the page's lead photograph. soon: in the first window, fetched without waiting.
    named=False: the photograph stands beside its own name (a tile, a feature), so it is not described twice."""
    base = f"{root}images/web/"
    load = 'fetchpriority="high"' if first else ('decoding="async"' if soon else 'loading="lazy" decoding="async"')
    alt = f'alt="{e(s["alt"]["en"])}" data-i18n-alt="sa_{s["id"]}"' if named else 'alt=""'
    return (f'<img src="{base}1280/{s["file"]}" srcset="{srcset(s, root)}" sizes="{sizes}" '
            f'width="{s["w"]}" height="{s["h"]}" {alt} {load}>')


def strings(s, en, zh):
    sid = s["id"]
    for lang, d in (("en", en), ("zh", zh)):
        d[f"sp_{sid}"] = s["place"][lang]
        d[f"sa_{sid}"] = s["alt"][lang]
    en[f"sl_{sid}"] = f'{s["place"]["en"]}: how this was made'
    zh[f"sl_{sid}"] = f'{s["place"]["zh"]}：這張怎麼拍'


def opens(sid, root, en, zh):
    """Attributes for a link that opens a photograph."""
    return (f'href="{root}gallery.html#s-{sid}" data-slide="{sid}" '
            f'aria-label="{e(en[f"sl_{sid}"])}" data-i18n-aria="sl_{sid}"')


def camera(s):
    parts = [s["focal"], s["aperture"], s["shutter"], "ISO " + s["iso"]]
    return '<span class="data">' + "".join(f"<span>{e(p)}</span>" for p in parts) + "</span>"


def piece(sid, root, en, zh, sizes, first=False, anchor=False, flex=False, data=False):
    """A photograph with its place name under it. Opening it shows how it was made."""
    s = SLIDES[sid]
    strings(s, en, zh)
    en[f"sw_{sid}"], zh[f"sw_{sid}"] = s["where"]["en"], s["where"]["zh"]
    attrs = (f' id="s-{sid}"' if anchor else "") + (f' style="--ar: {ratio(s)}"' if flex else "")
    second = camera(s) if data else f'<span data-i18n="sw_{sid}">{e(s["where"]["en"])}</span>'
    return (f'<figure class="piece"{attrs}><a {opens(sid, root, en, zh)}>{img(s, root, sizes, first)}</a>'
            f'<figcaption><b data-i18n="sp_{sid}">{e(s["place"]["en"])}</b>{second}</figcaption></figure>')


def rows_of(ids, per_row=3.2):
    """Split photographs into rows of nearly equal total width, so every row fills the page
    and no photograph is cropped. per_row is how many 'widths of a square' a row should hold."""
    ars = [SLIDES[i]["w"] / SLIDES[i]["h"] for i in ids]
    n = len(ids)
    k = max(1, min(n, round(sum(ars) / per_row)))
    goal = sum(ars) / k
    best = {(0, 0): (0.0, [])}
    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            for p in range(j - 1, i):
                if (p, j - 1) not in best or (n > 1 and i - p < 2):   # no photograph alone in a row
                    continue
                cost = best[(p, j - 1)][0] + (sum(ars[p:i]) - goal) ** 2
                if (i, j) not in best or cost < best[(i, j)][0]:
                    best[(i, j)] = (cost, best[(p, j - 1)][1] + [ids[p:i]])
    return best[(n, k)][1]


def wall(ids, root, en, zh, per_row=3.2, anchors=False):
    out = []
    for row in rows_of(ids, per_row):
        items = ["    " + piece(sid, root, en, zh, "(max-width: 40rem) 92vw, 45vw", anchor=anchors, flex=True)
                 for sid in row]
        out.append('  <div class="wall__row">\n' + "\n".join(items) + "\n  </div>")
    return '<div class="wall">\n' + "\n".join(out) + "\n</div>"


def grid(ids, root, en, zh):
    """The portfolio: a tight grid of even openings with no captions. Opening one shows it whole."""
    cells = []
    for n, sid in enumerate(ids):
        s = SLIDES[sid]
        strings(s, en, zh)
        cells.append(f'    <figure><a {opens(sid, root, en, zh)}>'
                     f'{img(s, root, "(max-width: 52rem) 46vw, 22vw", first=n == 0, soon=n < 8)}</a></figure>')
    return '<div class="grid">\n' + "\n".join(cells) + "\n  </div>"


def country_tile(c, root, en, zh):
    """A country shown as its first photograph with its name under it."""
    cid = c["id"]
    ph = next(s for s in DATA["slides"] if s["country"] == cid)
    strings(ph, en, zh)
    en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
    return (f'<li><a class="tile" href="{root}countries/{cid}.html"><span class="tile__photo">'
            f'{img(ph, root, "(max-width: 40rem) 92vw, 30vw", named=False)}</span>'
            f'<span class="tile__name" data-i18n="cn_{cid}">{e(c["en"])}</span></a></li>')


def shot(sid, root, en, zh):
    """A photograph inside a guide, with its camera data under it."""
    return piece(sid, root, en, zh, "(max-width: 50rem) 92vw, 50rem", anchor=True, flex=True, data=True)


def cover(sid, root, en, zh):
    """The opening photograph of the home page: the whole window, nothing written across it."""
    s = SLIDES[sid]
    strings(s, en, zh)
    en[f"sw_{sid}"], zh[f"sw_{sid}"] = s["where"]["en"], s["where"]["zh"]
    # the photograph is cropped to the window's height, so on a tall narrow screen it is wider than the window
    sizes = "max(100vw, " + str(round(100 * s["w"] / s["h"])) + "vh)"
    return (f'<figure class="cover arrive"><a {opens(sid, root, en, zh)}>{img(s, root, sizes, first=True)}</a>'
            f'<figcaption><b data-i18n="sp_{sid}">{e(s["place"]["en"])}</b>'
            f'<span data-i18n="sw_{sid}">{e(s["where"]["en"])}</span></figcaption></figure>')


def window(sid, root, en, zh):
    """A second window onto a photograph, part way down the home page: it fills the window's
    width and stays where it is while the page is drawn over it, like the opening one."""
    s = SLIDES[sid]
    strings(s, en, zh)
    en[f"sw_{sid}"], zh[f"sw_{sid}"] = s["where"]["en"], s["where"]["zh"]
    return (f'<figure class="window"><a {opens(sid, root, en, zh)}>{img(s, root, "100vw", soon=True)}</a>'
            f'<figcaption><b data-i18n="sp_{sid}">{e(s["place"]["en"])}</b>'
            f'<span data-i18n="sw_{sid}">{e(s["where"]["en"])}</span></figcaption></figure>')


# ------------------------------------------------------------------ page frame

def head(title, desc, root):
    return f"""<!DOCTYPE html>
<html lang="en" data-root="{root}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{e(clean_en(desc))}">
  <meta name="theme-color" content="{PAPER}">
  <link rel="icon" type="image/png" href="{root}icons/favicon-96x96.png" sizes="96x96">
  <link rel="icon" type="image/svg+xml" href="{root}icons/favicon.svg">
  <link rel="shortcut icon" href="{root}favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="{root}icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-title" content="PT">
  <link rel="manifest" href="{root}site.webmanifest">
  <link rel="stylesheet" href="{root}css/fonts.css?v={STAMP}">
  <link rel="stylesheet" href="{root}css/style.css?v={STAMP}">
</head>
<body>
"""


def header(root, current, over=False):
    items = "\n".join(
        f'        <li><a href="{root}{href}" data-i18n="{key}"'
        + (' aria-current="page"' if current == nid else "") + f">{label}</a></li>"
        for nid, key, label, href in NAV)
    cls = "wrap top top--over" if over else "wrap top"
    return f"""<a class="skip btn" href="#main" data-i18n="skip">Skip to the content</a>
<header class="{cls}">
  <a class="name" href="{root}index.html">tuan photography <span>陳亮元</span></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-i18n="navMenu">Menu</button>
  <nav class="menu" id="menu" aria-label="Site">
    <ul>
{items}
    </ul>
    <div class="lang" role="group" aria-label="Language">
      <button id="lang-en" type="button" aria-pressed="true" lang="en">EN</button><i></i><button id="lang-zh" type="button" aria-pressed="false" lang="zh-Hant">中文</button>
    </div>
  </nav>
</header>
"""


def footer(root, used, en, zh):
    links = "\n".join(f'        <li><a href="{root}{href}" data-i18n="{key}">{label}</a></li>'
                      for _, key, label, href in NAV)
    data = []
    for sid in used:
        s = json.loads(json.dumps(SLIDES[sid]))
        s["srcset"] = srcset(s, root)
        for field in ("place", "where", "alt", "best", "note"):
            if field in s:
                s[field]["en"] = clean_en(s[field]["en"])
                s[field]["zh"] = clean_zh(s[field]["zh"])
        data.append(s)
    blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    page = json.dumps({"en": en, "zh": zh}, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f"""
<footer class="foot">
  <div class="wrap">
    <a class="foot__handle" href="{IG['url']}" target="_blank" rel="noopener">@{IG['handle']}</a>
    <p><a class="btn" href="{IG['url']}" target="_blank" rel="noopener" data-i18n="followCta">Follow on Instagram</a></p>
    <div class="foot__small">
      <ul>
{links}
      </ul>
      <p data-i18n="footNote">© 2026 tuan photography 陳亮元. All photographs are my own.</p>
    </div>
  </div>
</footer>

<script type="application/json" id="slides-data">{blob}</script>
<script>
window.pageI18n = {page};
</script>
<script src="{root}js/main.js?v={STAMP}"></script>
</body>
</html>
"""


def write(path, title, zh_title, desc, current, body, en, zh, over=False):
    root = "../" * (len(Path(path).parts) - 1)
    en["docTitle"], zh["docTitle"] = title, zh_title
    for k in list(en):
        en[k] = clean_en(en[k])
    for k in list(zh):
        zh[k] = clean_zh(zh[k])
    body = no_dash_en(body)
    # the dictionaries are the one source of truth: the page's first (English) text comes from them
    body = re.sub(r'(<[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(?=</)',
                  lambda m: m.group(1) + (e(en[m.group(2)]) if m.group(2) in en else m.group(3)), body)
    body = re.sub(r'(<(\w+)[^>]*\bdata-i18n-html="([^"]+)"[^>]*>)(.*?)(?=</\2>)',
                  lambda m: m.group(1) + (en[m.group(3)] if m.group(3) in en else m.group(4)), body, flags=re.S)
    body = re.sub(r'alt="[^"]*" data-i18n-alt="([^"]+)"',
                  lambda m: f'alt="{e(en[m.group(1)])}" data-i18n-alt="{m.group(1)}"', body)
    body = re.sub(r'aria-label="[^"]*" data-i18n-aria="([^"]+)"',
                  lambda m: f'aria-label="{e(en[m.group(1)])}" data-i18n-aria="{m.group(1)}"', body)
    used = list(dict.fromkeys(re.findall(r'data-slide="([^"]+)"', body)))
    out = head(title, desc, root) + header(root, current, over) + '<main id="main" tabindex="-1">\n' + body + "\n</main>\n" \
        + footer(root, used, en, zh)
    (OUT / path).write_text(out, encoding="utf-8")
    print("  wrote", path)


def page_top(title_key, title, sub_key=None, sub="", path="", extra=""):
    p = f'\n    <p data-i18n="{sub_key}">{e(sub)}</p>' if sub_key else ""
    return f"""<div class="wrap">
  <header class="page-top">{path}
    <h1 data-i18n="{title_key}">{e(title)}</h1>{p}{extra}
  </header>
"""


def crumbs(items):
    lis = "".join(f'<li><a href="{href}" data-i18n="{key}">{e(label)}</a></li>' for href, key, label in items)
    return f'\n    <ol class="path">{lis}</ol>'


def has_work(c):
    return any(s["country"] == c["id"] for s in DATA["slides"]) or any(g["country"] == c["id"] for g in DATA["guides"])


def feature(g, root, en, zh, with_country=True):
    """A guide shown large: its photograph beside its name."""
    gid = g["id"]
    c = COUNTRIES[g["country"]]
    ph = SLIDES[g["lead"]]
    strings(ph, en, zh)
    en[f"g_{gid}"], zh[f"g_{gid}"] = g["title"]["en"], g["title"]["zh"]
    en[f"gf_{gid}"] = (c["en"] + ", " if with_country else "") + g["facts"]["en"].replace(" · ", ", ")
    zh[f"gf_{gid}"] = (c["zh"] + "、" if with_country else "") + g["facts"]["zh"].replace(" · ", "、")
    en["guideOpen"], zh["guideOpen"] = "Read the guide", "閱讀攻略"
    return f"""<a class="feature" href="{root}{g['href']}">
      <span class="feature__photo">{img(ph, root, "(max-width: 52rem) 92vw, 56vw", named=False)}</span>
      <span class="feature__say">
        <span class="feature__name" data-i18n="g_{gid}">{e(g['title']['en'])}</span>
        <span class="feature__facts num" data-i18n="gf_{gid}">{e(en[f'gf_{gid}'])}</span>
        <span class="feature__go" data-i18n="guideOpen">Read the guide</span>
      </span>
    </a>"""


def shelf(root, en, zh):
    """The guides as books on a ring that never ends, seen from the front like a coverflow: one
    book per country, in the owner's order. The script turns the ring and places each book.
    A written guide is a book that opens the guide; the others open the country's photographs."""
    en.update(bandGuide="A photographer's guide", bandPhotos="Photographs", bandNone="No photographs yet",
              bookOpen="Read the guide", bookNot="Guide not written yet", series="tuan photography")
    zh.update(bandGuide="攝影師的攻略", bandPhotos="作品", bandNone="還沒有照片",
              bookOpen="閱讀攻略", bookNot="攻略還沒寫", series="tuan photography")
    tones = ("clay", "olive", "slate")
    books = []
    for i, b in enumerate(DATA["shelf"]):
        tone = tones[i % len(tones)]
        if "guide" in b:
            g = next(x for x in DATA["guides"] if x["id"] == b["guide"])
            key, title, href = f"bk_{g['id']}", g["title"], f"{root}{g['href']}"
            sid, band, status = b.get("photo") or g["lead"], "bandGuide", "bookOpen"
        else:
            c = COUNTRIES[b["country"]]
            key, title, href = f"bk_{c['id']}", b.get("title") or {"en": c["en"], "zh": c["zh"]}, f"{root}countries/{c['id']}.html"
            sid = b.get("photo") or next((x["id"] for x in DATA["slides"] if x["country"] == c["id"]), None)
            band, status = ("bandPhotos" if sid else "bandNone"), "bookNot"
        en[key], zh[key] = title["en"], title["zh"]
        en[f"bo_{key}"] = f"{title['en']}: {en[status].lower() if status == 'bookOpen' else en[status]}"
        zh[f"bo_{key}"] = f"{title['zh']}：{zh[status]}"
        t = e(title["en"])
        if sid:
            strings(SLIDES[sid], en, zh)
            face = f'<span class="book__face">{img(SLIDES[sid], root, "11rem", soon=True, named=False)}'
        else:
            face = f'<span class="book__face book__face--blank"><b data-i18n="{key}">{t}</b>'
        books.append(f'<a class="book book--{tone}" href="{href}" aria-label="{e(en[f"bo_{key}"])}" data-i18n-aria="bo_{key}"><span class="book__box">'
                     f'<span class="book__spine"><b data-i18n="{key}">{t}</b><i data-i18n="series">tuan photography</i></span>'
                     f'{face}<span class="book__band"><b data-i18n="{key}">{t}</b><span data-i18n="{band}">{e(en[band])}</span></span></span>'
                     f'<span class="book__back"><i data-i18n="series">tuan photography</i></span><span class="book__edge"></span>'
                     f'<span class="book__top"></span><span class="book__shadow"></span><span class="book__veil"></span></span>'
                     f'<span class="book__name"><b data-i18n="{key}">{t}</b><span data-i18n="{status}">{e(en[status])}</span></span></a>')
    return '<div class="shelf"><div class="stack">' + "".join(books) + "</div></div>"


# ------------------------------------------------------------------ pages

def build_home():
    en, zh = {}, {}
    root = ""
    lead = DATA["lead"]
    n_places = len(COUNTRIES)
    one = DATA["guides"][0] if len(DATA["guides"]) == 1 else None
    en.update(heroLine="Travel like a photographer.",
              heroSay='Landscape photographs by Thomas Chen <span class="nb">陳亮元</span>. Open any one to see how it was made.',
              guidesCta="Read the guide" if one else "Read the guides",
              workTitle="Photographs", workCta="See the gallery", guidesTitle="Guides",
              moreText=f"Guides for {n_places - 1} more countries are not written yet.",
              moreCta="See every destination")
    zh.update(heroLine='<span class="nb">像攝影師</span><span class="nb">一樣旅行。</span>',
              heroSay="陳亮元的風景攝影。點開任何一張，看它是怎麼拍的。",
              guidesCta="閱讀攻略",
              workTitle="作品", workCta="看全部作品", guidesTitle="攻略",
              moreText=f"還有 {n_places - 1} 個國家的攻略還沒寫。",
              moreCta="看所有目的地")
    leads = {g["lead"] for g in DATA["guides"]}
    # the home page shows a dozen, one from each country in turn; the gallery shows them all
    windows = DATA.get("windows", [])
    seen, others = set(), []
    for x in DATA["slides"]:
        if x["id"] == lead or x["id"] in leads or x["id"] in windows or x["country"] in seen:
            continue
        seen.add(x["country"])
        others.append(x["id"])
    others = others[:12]
    # the windows are dealt out between the sections, so a photograph is behind the page all the way down
    panes = [window(sid, root, en, zh) for sid in windows] + ["", "", ""]
    body = f"""{cover(lead, root, en, zh)}

<div class="leaf">
<section class="wrap intro arrive">
  <h1 class="rise" style="--i: 0" data-i18n-html="heroLine">Travel like a photographer.</h1>
  <p class="rise" style="--i: 1" data-i18n-html="heroSay">{en['heroSay']}</p>
  <div class="intro__acts rise" style="--i: 2">
    <a class="btn" href="{IG['url']}" target="_blank" rel="noopener" data-i18n="followCta">Follow on Instagram</a>
    <a class="btn btn--line" href="{one['href'] if one else '#guides-h'}" data-i18n="guidesCta">{e(en['guidesCta'])}</a>
  </div>
</section>

{panes[0]}

<div class="band">
  <section class="wrap part" aria-labelledby="guides-h">
    <div class="part__head"><h2 id="guides-h" data-i18n="guidesTitle">Guides</h2></div>
    {shelf(root, en, zh)}
    <p class="after"><span data-i18n="moreText">{e(en['moreText'])}</span> <a href="{root}destinations.html" data-i18n="moreCta">See every destination</a></p>
  </section>
</div>

{panes[1]}

<section class="wrap part" aria-labelledby="work-h">
  <div class="part__head"><h2 id="work-h" data-i18n="workTitle">Photographs</h2></div>
  {wall(others, root, en, zh)}
  <p class="part__more"><a class="btn btn--line" href="gallery.html" data-i18n="workCta">See the gallery</a></p>
</section>

{panes[2]}
</div>"""
    write("index.html", f"{SITE} - Landscape photographs and how each one was made",
          f"{SITE} - 風景攝影，以及每一張是怎麼拍的",
          "Landscape photographs by 陳亮元 Thomas Chen, each with the account of how it was made: camera data, where to stand, and the guide to the place.",
          None, body, en, zh, over=True)


def build_gallery():
    """The portfolio first, a dozen in a tight grid; then every country with photographs, each
    its own wall of rows, in the site's order; then the names of the places not photographed yet."""
    en, zh = {}, {}
    root = ""
    en.update(pTitle="Gallery", pSub="Open any photograph to see how it was made.",
              folioTitle="Portfolio", restTitle="Not photographed for the site yet")
    zh.update(pTitle="作品集", pSub="點開任何一張，看它是怎麼拍的。",
              folioTitle="精選作品", restTitle="還沒有放上照片的地方")
    lead = DATA["lead"]
    ids = [lead] + [s["id"] for s in DATA["slides"] if s["id"] != lead]
    shown = [c for c in DATA["countries"] if any(s["country"] == c["id"] for s in DATA["slides"])]
    rest = [c for c in DATA["countries"] if c not in shown]
    parts = [page_top("pTitle", "Gallery", "pSub", en["pSub"]), f"""  <section class="part" aria-labelledby="folio-h">
    <div class="part__head"><h2 id="folio-h" data-i18n="folioTitle">Portfolio</h2></div>
    {grid(ids[:12], root, en, zh)}
  </section>"""]
    for c in shown:
        cid = c["id"]
        own = [s["id"] for s in DATA["slides"] if s["country"] == cid]
        en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
        en[f"cc_{cid}"] = "1 photograph" if len(own) == 1 else f"{len(own)} photographs"
        zh[f"cc_{cid}"] = f"{len(own)} 張照片"
        parts.append(f"""  <section class="part" aria-labelledby="c-{cid}">
    <div class="part__head"><h2 id="c-{cid}"><a href="countries/{cid}.html" data-i18n="cn_{cid}">{e(c['en'])}</a></h2><p class="num" data-i18n="cc_{cid}">{e(en[f'cc_{cid}'])}</p></div>
    {wall(own, root, en, zh, anchors=True)}
  </section>""")
    names = []
    for c in rest:
        cid = c["id"]
        en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
        names.append(f'<a href="countries/{cid}.html" data-i18n="cn_{cid}">{e(c["en"])}</a>')
    parts.append(f"""  <section class="part bleed" aria-labelledby="rest-h">
    <div class="part__head"><h2 id="rest-h" data-i18n="restTitle">Not photographed for the site yet</h2></div>
    <div class="names">{''.join(names)}</div>
  </section>
</div>""")
    write("gallery.html", f"Gallery - {SITE}", f"作品集 - {SITE}",
          "Landscape photographs by 陳亮元 Thomas Chen: the portfolio, then every country. Each one shows how it was made.",
          "gallery", "\n".join(parts), en, zh)


def build_destinations():
    """The continents travelled, each a square; the continents not travelled, as names."""
    en, zh = {}, {}
    root = ""
    n_c, guides = len(COUNTRIES), DATA["guides"]
    if len(guides) == 1:
        tail_en = f"One guide so far: {guides[0]['title']['en']}."
        tail_zh = f"攻略目前只有一篇：{guides[0]['title']['zh']}。"
    else:
        tail_en = f"{len(guides)} guides so far."
        tail_zh = f"攻略目前有 {len(guides)} 篇。"
    en.update(pTitle="Destinations", pSub=f"{n_c} countries, by continent. {tail_en}",
              noPhoto="No photographs yet", restTitle="Not travelled yet")
    zh.update(pTitle="目的地", pSub=f"{n_c} 個國家，依大洲排列。{tail_zh}",
              noPhoto="還沒有照片", restTitle="還沒去過")
    tiles, names = [], []
    for k in DATA["continents"]:
        kid = k["id"]
        own = [c for c in DATA["countries"] if c["continent"] == kid]
        en[f"k_{kid}"], zh[f"k_{kid}"] = k["en"], k["zh"]
        if not own:
            names.append(f'<span data-i18n="k_{kid}">{e(k["en"])}</span>')
            continue
        en[f"kn_{kid}"] = "1 country" if len(own) == 1 else f"{len(own)} countries"
        zh[f"kn_{kid}"] = f"{len(own)} 個國家"
        # the photograph named for the continent, or the first one from any of its countries
        sid = k.get("photo") or next((s["id"] for c in own for s in DATA["slides"] if s["country"] == c["id"]), None)
        photo = '<span class="tile__none" data-i18n="noPhoto">No photographs yet</span>'
        if sid:
            strings(SLIDES[sid], en, zh)
            photo = img(SLIDES[sid], root, "(max-width: 56rem) 46vw, 22vw", soon=True, named=False)
        tiles.append(f"""      <li><a class="tile" href="continents/{kid}.html">
        <span class="tile__photo">{photo}</span>
        <h2 class="tile__name" data-i18n="k_{kid}">{e(k['en'])}</h2>
        <span class="tile__count num" data-i18n="kn_{kid}">{e(en[f'kn_{kid}'])}</span>
      </a></li>""")
    body = page_top("pTitle", "Destinations", "pSub", en["pSub"]) + f"""  <section class="part">
    <ul class="tiles tiles--four">
{chr(10).join(tiles)}
    </ul>
  </section>
  <section class="part bleed" aria-labelledby="rest-h">
    <div class="part__head"><h2 id="rest-h" data-i18n="restTitle">Not travelled yet</h2></div>
    <div class="names">{''.join(names)}</div>
  </section>
</div>"""
    write("destinations.html", f"Destinations - {SITE}", f"目的地 - {SITE}",
          "The countries photographed by 陳亮元 Thomas Chen, by continent.",
          "destinations", body, en, zh)


def back(root, en, zh):
    en.setdefault("backBtn", "Back to destinations")
    zh.setdefault("backBtn", "回到目的地")
    return f'<a class="btn btn--line" href="{root}destinations.html" data-i18n="backBtn">Back to destinations</a>'


def build_continents():
    for k in DATA["continents"]:
        en, zh = {}, {}
        root = "../"
        kid = k["id"]
        own = [c for c in DATA["countries"] if c["continent"] == kid]
        sub = k.get("sub") or k["state"]
        en.update(pTitle=k["en"], pSub=sub["en"], pathDest="Destinations")
        zh.update(pTitle=k["zh"], pSub=sub["zh"], pathDest="目的地")
        top = page_top("pTitle", k["en"], "pSub", sub["en"],
                       crumbs([(f"{root}destinations.html", "pathDest", "Destinations")]))
        if own:
            tiles, names = [], []
            for c in own:
                cid = c["id"]
                en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
                photos = [s for s in DATA["slides"] if s["country"] == cid]
                href = f"{root}countries/{cid}.html"
                if photos:
                    tiles.append(country_tile(c, root, en, zh))
                else:
                    names.append(f'<a href="{href}" data-i18n="cn_{cid}">{e(c["en"])}</a>')
            body = top
            if tiles:
                body += f'  <section class="part">\n    <ul class="tiles">{"".join(tiles)}</ul>\n  </section>\n'
            if names:
                en["restTitle"], zh["restTitle"] = "Not photographed for the site yet", "還沒有放上照片的地方"
                body += f"""  <section class="part bleed" aria-labelledby="rest-h">
    <div class="part__head"><h2 id="rest-h" data-i18n="restTitle">Not photographed for the site yet</h2></div>
    <div class="names">{''.join(names)}</div>
  </section>
"""
            body += "</div>"
        else:
            en.update(emptyText="There are no photographs or guides from this continent yet.")
            zh.update(emptyText="這個大洲還沒有照片，也還沒有攻略。")
            body = top + f"""  <section class="part">
    <div class="empty">
      <p data-i18n="emptyText">{e(en['emptyText'])}</p>
      {back(root, en, zh)}
    </div>
  </section>
</div>"""
        write(f"continents/{kid}.html", f"{k['en']} - {SITE}", f"{k['zh']} - {SITE}",
              f"{k['en']}: countries photographed by 陳亮元 Thomas Chen.", "destinations", body, en, zh)


def build_countries():
    for c in DATA["countries"]:
        en, zh = {}, {}
        root = "../"
        cid = c["id"]
        k = CONTINENTS[c["continent"]]
        own = [s["id"] for s in DATA["slides"] if s["country"] == cid]
        guides = [g for g in DATA["guides"] if g["country"] == cid]
        en.update(pTitle=c["en"], pSub=c["note"]["en"], statLabel=c["date"]["en"],
                  pathDest="Destinations", pathCont=k["en"])
        zh.update(pTitle=c["zh"], pSub=c["note"]["zh"], statLabel=c["date"]["zh"],
                  pathDest="目的地", pathCont=k["zh"])
        path = crumbs([(f"{root}destinations.html", "pathDest", "Destinations"),
                       (f"{root}continents/{k['id']}.html", "pathCont", k["en"])])
        when = f'\n    <p class="when num" data-i18n="statLabel">{e(c["date"]["en"])}</p>'
        parts = [page_top("pTitle", c["en"], "pSub", c["note"]["en"], path, when)]
        if guides:
            en["guidesTitle"], zh["guidesTitle"] = "Guides", "攻略"
            rows = "\n".join(feature(g, root, en, zh, with_country=False) for g in guides)
            parts.append(f"""  <section class="part" aria-labelledby="guides-h">
    <div class="part__head"><h2 id="guides-h" data-i18n="guidesTitle">Guides</h2></div>
    <div class="features">
    {rows}
    </div>
  </section>""")
        if own:
            en["workTitle"], zh["workTitle"] = "Photographs", "作品"
            parts.append(f"""  <section class="part" aria-labelledby="work-h">
    <div class="part__head"><h2 id="work-h" data-i18n="workTitle">Photographs</h2></div>
    {wall(own, root, en, zh)}
  </section>""")
        if not guides:
            if own:
                en["wipText"], zh["wipText"] = "The guide for this country is not written yet.", "這個國家的攻略還沒寫。"
            else:
                en["wipText"] = "The guide for this country is not written yet, and there are no photographs from it on the site."
                zh["wipText"] = "這個國家的攻略還沒寫，網站上也還沒有這裡的照片。"
            parts.append(f"""  <section class="part">
    <div class="empty">
      <p data-i18n="wipText">{e(en['wipText'])}</p>
      {back(root, en, zh)}
    </div>
  </section>""")
        parts.append("</div>")
        write(f"countries/{cid}.html", f"{c['en']} - {SITE}", f"{c['zh']} - {SITE}",
              f"{c['en']}: photographs and guides by 陳亮元 Thomas Chen.", "destinations", "\n".join(parts), en, zh)


def build_blog():
    en, zh = {}, {}
    en.update(pTitle="Blog", pSub="Field notes, travel stories, and what actually happened between the photos.",
              emptyText="Nothing is published yet. The first story is planned for after the Vietnam trip.",
              backHome="See the photographs")
    zh.update(pTitle="網誌", pSub="田野筆記、旅行故事,以及照片與照片之間真正發生的事。",
              emptyText="還沒有文章。第一篇故事預計在越南旅程之後刊出。", backHome="看作品")
    body = page_top("pTitle", "Blog", "pSub", en["pSub"]) + f"""  <section class="part">
    <div class="empty">
      <p data-i18n="emptyText">{e(en['emptyText'])}</p>
      <a class="btn btn--line" href="gallery.html" data-i18n="backHome">See the photographs</a>
    </div>
  </section>
</div>"""
    write("blog.html", f"Blog - {SITE}", f"網誌 - {SITE}",
          "Field notes and travel stories by 陳亮元 Thomas Chen.", "blog", body, en, zh)


def build_skills():
    en, zh = {}, {}
    en.update(pTitle="Photography Skills", pSub="How I plan, shoot, and edit — written down so you can steal it.",
              s1title="How I plan a photography trip (my full SOP)",
              s2title="Finding photo spots before you've ever been there",
              s3title="What's in my camera bag (and what stays home)",
              wipNote="Articles in progress — titles are placeholders for now.",
              notYet="Not written yet", planned="Planned")
    zh.update(pTitle="攝影技巧", pSub="我如何規劃、拍攝、後製——全部寫下來,歡迎偷學。",
              s1title="我如何規劃一趟攝影旅行(完整 SOP)", s2title="出發前就找到攝影點的方法",
              s3title="我的相機包裡有什麼(以及什麼留在家)", wipNote="文章製作中——目前標題為暫定。",
              notYet="還沒寫", planned="預計撰寫")
    rows = "\n".join(f'      <li><span data-i18n="s{i}title">{e(en[f"s{i}title"])}</span>'
                     f'<span data-i18n="notYet">Not written yet</span></li>' for i in (1, 2, 3))
    body = page_top("pTitle", "Photography Skills", "pSub", en["pSub"]) + f"""  <section class="part" aria-labelledby="plan-h">
    <div class="part__head">
      <h2 id="plan-h" data-i18n="planned">Planned</h2>
      <p data-i18n="wipNote">{e(en['wipNote'])}</p>
    </div>
    <ul class="plain">
{rows}
    </ul>
  </section>
</div>"""
    write("skills.html", f"Photography Skills - {SITE}", f"攝影技巧 - {SITE}",
          "How 陳亮元 Thomas Chen plans, shoots and edits.", "skills", body, en, zh)


def build_about():
    en, zh = {}, {}
    cams = sorted({s["camera"] for s in DATA["slides"]})
    lenses = sorted({s["lens"] for s in DATA["slides"]})
    en.update(abTitle="I plan trips like shoots — because they are.",
              abLede="Before every trip I disappear into research: light direction, seasons, opening hours, transport, and the food locals actually eat. Then I go, shoot the plan, and write down what was true and what wasn't.",
              abBody1="This site is that homework, published. Every guide tells you where the photo was taken, when to stand there, and what to do with the rest of your day. Some spots get exact pins; the fragile ones stay vague on purpose — you'll understand when you get there.",
              fCountries="Countries", fCountriesV=f"{len(COUNTRIES)} so far",
              fHome="Home base", fHomeV="Taiwan",
              fCamera="Camera", fLens="Lenses", fIg="Instagram")
    zh.update(abTitle="我把旅行當拍攝案規劃——因為它本來就是。",
              abLede="每趟旅行前,我都會埋進研究裡:光線方向、季節、開放時間、交通,還有當地人真正在吃的東西。然後出發、照計畫拍攝,再記下哪些是真的、哪些不是。",
              abBody1="這個網站就是那些功課的出版版本。每份指南都告訴你照片在哪裡拍、什麼時候該站在那裡,以及一天剩下的時間該做什麼。有些機位給精確座標;脆弱的秘境則刻意模糊——到了你就懂。",
              fCountries="國家數", fCountriesV=f"目前 {len(COUNTRIES)} 個",
              fHome="大本營", fHomeV="台灣",
              fCamera="相機", fLens="鏡頭", fIg="Instagram")
    body = f"""<div class="wrap">
  <section class="about arrive">
    <h1 class="rise" style="--i: 0" data-i18n="abTitle">{e(en['abTitle'])}</h1>
    <div class="about__cols">
    <div class="about__say rise" style="--i: 1">
      <p class="lede" data-i18n="abLede">{e(en['abLede'])}</p>
      <p data-i18n="abBody1">{e(en['abBody1'])}</p>
      <a class="btn" href="{IG['url']}" target="_blank" rel="noopener" data-i18n="followCta">Follow on Instagram</a>
    </div>
    <dl class="facts rise" style="--i: 2">
      <div><dt data-i18n="fCountries">Countries</dt><dd class="num" data-i18n="fCountriesV">{e(en['fCountriesV'])}</dd></div>
      <div><dt data-i18n="fHome">Home base</dt><dd data-i18n="fHomeV">Taiwan</dd></div>
      <div><dt data-i18n="fCamera">Camera</dt><dd>{e(', '.join(cams))}</dd></div>
      <div><dt data-i18n="fLens">Lenses</dt><dd>{'<br>'.join(e(x) for x in lenses)}</dd></div>
      <div><dt data-i18n="fIg">Instagram</dt><dd><a href="{IG['url']}" target="_blank" rel="noopener">@{IG['handle']}</a></dd></div>
    </dl>
    </div>
  </section>
</div>"""
    write("about.html", f"About - {SITE}", f"關於我 - {SITE}",
          "About 陳亮元 Thomas Chen, landscape photographer.", "about", body, en, zh)


def build_guide(name, title_en, title_zh, desc):
    d = json.loads((ROOT / "content" / f"{name}.i18n.json").read_text(encoding="utf-8"))
    en, zh = d["en"], d["zh"]
    root = "../"
    body = (ROOT / "content" / f"{name}.body.html").read_text(encoding="utf-8")
    body = body.replace("{root}", root)

    body = re.sub(r"[ \t]*<tr><td data-i18n=\"(\w+)\">[^<]*</td><td data-i18n=\"(\w+)\">[^<]*</td></tr>\n",
                  lambda m: "" if en.get(m.group(2), "").strip() in ("", "-", "—", "–") else m.group(0), body)
    body = re.sub(r"\{plate:([a-z0-9-]+)\}",
                  lambda m: piece(m.group(1), root, en, zh, "(max-width: 80rem) 92vw, 74rem", first=True, anchor=True, data=True), body)
    body = re.sub(r"\{side:([a-z0-9-]+)\}",
                  lambda m: piece(m.group(1), root, en, zh, "(max-width: 46rem) 92vw, 30rem", anchor=True, data=True), body)
    body = body.replace('<div class="shots">', '<div class="wall__row shots">')
    body = re.sub(r"\{shot:([a-z0-9-]+)\}", lambda m: shot(m.group(1), root, en, zh), body)
    body = re.sub(r"\{map:([^}]+)\}",
                  lambda m: f'<a href="{m.group(1)}" target="_blank" rel="noopener" data-i18n="mapLink">Map</a>', body)
    body = body.replace("{ate}", '<span class="ate" data-i18n="ate">eaten</span>')
    for a, b in (('<table class="sheet">', '<table class="sheet" role="table">'), ("<thead>", '<thead role="rowgroup">'),
                 ("<tbody>", '<tbody role="rowgroup">'), ("<tr>", '<tr role="row">')):
        body = body.replace(a, b)
    body = re.sub(r"<th(?=[ >])(?![^>]*role=)", '<th role="columnheader"', body)
    body = re.sub(r"<td(?=[ >])(?![^>]*role=)", '<td role="cell"', body)
    write(f"posts/{name}.html", title_en, title_zh, desc, "destinations", body, en, zh)


if __name__ == "__main__":
    print("Making photo sizes…")
    make_sizes()
    print("Writing pages…")
    build_home()
    build_gallery()
    build_destinations()
    build_continents()
    build_countries()
    build_blog()
    build_skills()
    build_about()
    build_guide("barcelona", f"Barcelona - {SITE}", f"巴賽隆納 - {SITE}",
                "A photographer's real 4-day Barcelona guide: Gaudí photo spots with best light, Bunkers del Carmel sunset, Tibidabo, day-by-day route, and a tested tapas list.")
    print("Done.")
    # the owner's private photo list follows the site; a problem there never stops a build
    if (ROOT / "originals").is_dir():
        subprocess.run([sys.executable, str(ROOT / "tools" / "photo_list.py")], check=False)
