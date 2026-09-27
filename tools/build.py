#!/usr/bin/env python3
"""Build the site's pages.

    python3 tools/build.py

Reads data/site.json (photographs, countries, guides) and content/ (hand-written
page bodies), and writes plain HTML files. Nothing here runs on the live site:
the output is ordinary static pages.

To add a photograph: put the web-sized file in images/web/, add an entry to
"slides" in data/site.json, and run this script again.
"""
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
SLIDES = {s["id"]: s for s in DATA["slides"]}
COUNTRIES = {c["id"]: c for c in DATA["countries"]}
CONTINENTS = {c["id"]: c for c in DATA["continents"]}
IG = DATA["instagram"]
SIZES = (640, 1280)
SRGB = "/System/Library/ColorSync/Profiles/sRGB Profile.icc"

FONTS = ("https://fonts.googleapis.com/css2?family=Iansui&family=Libre+Franklin:"
         "ital,wght@0,400..800;1,400&family=Noto+Sans+TC:wght@400;600;800&display=swap")

ICONS = """<svg width="0" height="0" class="sr" aria-hidden="true" focusable="false">
  <symbol id="i-right" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24"><path d="M20 12H5M11 6l-6 6 6 6"/></symbol>
  <symbol id="i-out" viewBox="0 0 24 24"><path d="M8 16 18 6M9 6h9v9"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-ig" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></symbol>
</svg>"""

RING = ('<svg class="slide__ring" viewBox="0 0 110 114" preserveAspectRatio="none" aria-hidden="true">'
        '<path pathLength="1" vector-effect="non-scaling-stroke" '
        'd="M58 5C31 3 8 22 5 52c-3 31 20 55 50 57 29 2 50-20 51-51C107 27 86 6 55 7c-9 0-17 2-24 6"/></svg>')

NAV = [("gallery", "navGallery", "Gallery", "gallery.html"),
       ("destinations", "navDestinations", "Destinations", "destinations.html"),
       ("blog", "navBlog", "Blog", "blog.html"),
       ("skills", "navSkills", "Skills", "skills.html"),
       ("about", "navAbout", "About", "about.html")]


def e(text):
    return html.escape(text, quote=True)


CJK = r"[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]"
PAIRS = {",": "，", ":": "：", ";": "；", "!": "！", "?": "？"}


def zh_punct(text):
    """Chinese text is set with full-width punctuation. Numbers, times and Latin words keep theirs."""
    def swap(m):
        return PAIRS[m.group(0)]
    # a mark that touches a Chinese character on either side
    text = re.sub(rf"(?<={CJK})[,:;!?]|[,:;!?](?={CJK})", swap, text)
    # brackets: convert a pair when Chinese sits inside it or right beside it
    def bracket(m):
        before, inner, after = m.group(1), m.group(2), m.group(3)
        if re.search(CJK, before + inner + after):
            return f"{before}（{inner}）{after}"
        return m.group(0)
    text = re.sub(r"(.?)\(([^()<>]*)\)(.?)", bracket, text)
    return text


def icon(name):
    return f'<svg class="icon" aria-hidden="true"><use href="#i-{name}"/></svg>'


def make_sizes():
    """Smaller copies of each photograph for phones and grids, converted to sRGB."""
    for width in SIZES:
        out_dir = ROOT / "images" / "web" / str(width)
        out_dir.mkdir(exist_ok=True)
        for s in DATA["slides"]:
            src = ROOT / "images" / "web" / s["file"]
            out = out_dir / s["file"]
            if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
                continue
            subprocess.run(["sips", "--resampleWidth", str(width), "-m", SRGB,
                            "--setProperty", "formatOptions", "68", str(src), "--out", str(out)],
                           check=True, capture_output=True)


def img(s, root, sizes, lead=False):
    base = f"{root}images/web/"
    srcset = ", ".join([f"{base}{w}/{s['file']} {w}w" for w in SIZES] + [f"{base}{s['file']} {s['w']}w"])
    load = 'fetchpriority="high"' if lead else 'loading="lazy" decoding="async"'
    return (f'<img src="{base}1280/{s["file"]}" srcset="{srcset}" sizes="{sizes}" '
            f'width="{s["w"]}" height="{s["h"]}" alt="{e(s["alt"]["en"])}" '
            f'data-i18n-alt="sa_{s["id"]}" {load}>')


def slide_strings(s, en, zh):
    sid = s["id"]
    for lang, d in (("en", en), ("zh", zh)):
        d[f"sp_{sid}"] = s["place"][lang]
        d[f"sw_{sid}"] = s["where"][lang]
        d[f"sa_{sid}"] = s["alt"][lang]
    en[f"sl_{sid}"] = f'{s["place"]["en"]}: how this was made'
    zh[f"sl_{sid}"] = f'{s["place"]["zh"]}：這張怎麼拍'


def slide(sid, root, en, zh, sizes="(max-width: 34rem) 92vw, (max-width: 48rem) 46vw, (max-width: 84rem) 31vw, 26rem", lead=False):
    """A mounted slide that can be picked up."""
    s = SLIDES[sid]
    slide_strings(s, en, zh)
    shape = ("slide--p" if s["h"] > s["w"] else "slide--l") + (" slide--lead" if lead else "")
    return f"""<a class="slide {shape}" href="{root}gallery.html#s-{sid}" data-slide="{sid}" aria-label="{e(en[f'sl_{sid}'])}" data-i18n-aria="sl_{sid}">
  <span class="slide__mount">
    <span class="slide__where"><span data-i18n="sw_{sid}">{e(s['where']['en'])}</span></span>
    <span class="slide__window">{img(s, root, sizes, lead)}{RING}</span>
    <span class="slide__foot"><span class="slide__place" data-i18n="sp_{sid}">{e(s['place']['en'])}</span><span class="slide__how"><span data-i18n="slideHow">How this was made</span>{icon('right')}</span></span>
  </span>
</a>"""


def plate(sid, root, en, zh):
    """The wide mount at the top of a guide."""
    s = SLIDES[sid]
    slide_strings(s, en, zh)
    shape = ("slide--p" if s["h"] > s["w"] else "slide--l") + " slide--lead"
    data = " · ".join([s["focal"], s["aperture"], s["shutter"], "ISO " + s["iso"]])
    return f"""<a class="slide {shape}" href="{root}gallery.html#s-{sid}" data-slide="{sid}" aria-label="{e(en[f'sl_{sid}'])}" data-i18n-aria="sl_{sid}">
      <span class="slide__mount">
        <span class="slide__where"><span data-i18n="sw_{sid}">{e(s['where']['en'])}</span></span>
        <span class="slide__window">{img(s, root, "(max-width: 84rem) 88vw, 72rem", True)}</span>
        <span class="slide__foot"><span class="slide__place" data-i18n="sp_{sid}">{e(s['place']['en'])}</span><span class="slide__how num">{e(data)}</span></span>
      </span>
    </a>"""


def shot(sid, root, en, zh):
    """A slide inside a guide, with its caption."""
    s = SLIDES[sid]
    data = " · ".join([s["focal"], s["aperture"], s["shutter"], "ISO " + s["iso"]])
    body = slide(sid, root, en, zh, "(max-width: 34rem) 92vw, (max-width: 62rem) 30vw, 15rem")
    return f'<figure class="shot" id="s-{sid}">\n{body}\n<figcaption>{e(data)}</figcaption>\n</figure>'


def empty_slide(key, en_label, href=None, where_key=None, where_en=""):
    tag, attr = ("a", f' href="{href}"') if href else ("div", "")
    where = f'<span data-i18n="{where_key}">{e(where_en)}</span>' if where_key else ""
    return f"""<{tag} class="slide slide--l slide--empty"{attr}>
  <span class="slide__mount">
    <span class="slide__where">{where}</span>
    <span class="slide__window"></span>
    <span class="slide__foot"><span class="slide__place" data-i18n="{key}">{e(en_label)}</span></span>
  </span>
</{tag}>"""


def country_slide(c, root, en, zh):
    """A country as a mount: its first photograph if there is one, otherwise empty."""
    cid = c["id"]
    en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
    en[f"cd_{cid}"], zh[f"cd_{cid}"] = c["date"]["en"], c["date"]["zh"]
    href = f"{root}countries/{cid}.html"
    own = [s for s in DATA["slides"] if s["country"] == cid]
    if not own:
        return empty_slide(f"cn_{cid}", c["en"], href, f"cd_{cid}", c["date"]["en"])
    s = own[0]
    slide_strings(s, en, zh)
    shape = "slide--p" if s["h"] > s["w"] else "slide--l"
    return f"""<a class="slide {shape}" href="{href}">
  <span class="slide__mount">
    <span class="slide__where num"><span data-i18n="cd_{cid}">{e(c['date']['en'])}</span></span>
    <span class="slide__window">{img(s, root, "(max-width: 34rem) 92vw, (max-width: 48rem) 46vw, 26rem")}</span>
    <span class="slide__foot"><span class="slide__place" data-i18n="cn_{cid}">{e(c['en'])}</span></span>
  </span>
</a>"""


def head(title, desc, root, zh_title=None):
    return f"""<!DOCTYPE html>
<html lang="en" data-root="{root}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <meta name="theme-color" content="#eef0ef">
  <script>try{{if(!sessionStorage.getItem('lamp')){{document.documentElement.classList.add('strike');sessionStorage.setItem('lamp','1')}}}}catch(e){{}}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="{root}css/style.css">
</head>
<body>
{ICONS}
"""


def header(root, current):
    items = "\n".join(
        f'        <li><a href="{root}{href}" data-i18n="{key}"'
        + (' aria-current="page"' if current == nid else "") + f">{label}</a></li>"
        for nid, key, label, href in NAV)
    return f"""<header class="wrap edge">
  <a class="name" href="{root}index.html">tuan photography <span>陳亮元</span></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">{icon('menu')}<span data-i18n="navMenu">Menu</span></button>
  <nav class="menu" id="menu" aria-label="Site">
    <ul>
{items}
    </ul>
    <a class="ig" href="{IG['url']}" target="_blank" rel="noopener">{icon('ig')}<span data-i18n="footInstagram">Instagram</span></a>
    <div class="lang" role="group" aria-label="Language">
      <button id="lang-en" type="button" aria-pressed="true" lang="en">EN</button><i></i><button id="lang-zh" type="button" aria-pressed="false" lang="zh-Hant">中文</button>
    </div>
  </nav>
</header>
"""


def footer(root, slides_used, en, zh):
    links = "\n".join(f'        <li><a href="{root}{href}" data-i18n="{key}">{label}</a></li>'
                      for _, key, label, href in NAV)
    data = []
    for sid in slides_used:
        s = json.loads(json.dumps(SLIDES[sid]))
        for field in ("place", "where", "alt", "best", "note"):
            if field in s:
                s[field]["zh"] = zh_punct(s[field]["zh"])
        data.append(s)
    blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    page = json.dumps({"en": en, "zh": zh}, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f"""
<footer class="close">
  <div class="wrap">
    <div class="follow">
      <h2 data-i18n="followTitle">@{IG['handle']}</h2>
      <a class="btn" href="{IG['url']}" target="_blank" rel="noopener">{icon('ig')}<span data-i18n="followCta">Follow on Instagram</span></a>
    </div>
    <div class="foot">
      <ul>
{links}
      </ul>
      <p data-i18n="footNote">© 2026 tuan photography 陳亮元 — All photographs are my own.</p>
    </div>
  </div>
</footer>

<script type="application/json" id="slides-data">{blob}</script>
<script>
window.pageI18n = {page};
</script>
<script src="{root}js/main.js"></script>
</body>
</html>
"""


def write(path, title, zh_title, desc, current, body, en, zh):
    root = "../" * (len(Path(path).parts) - 1)
    en["docTitle"], zh["docTitle"] = title, zh_title
    for k in list(zh):
        zh[k] = zh_punct(zh[k])
    used = list(dict.fromkeys(re.findall(r'data-slide="([^"]+)"', body)))
    out = head(title, desc, root) + header(root, current) + "<main>\n" + body + "\n</main>\n" \
        + footer(root, used, en, zh)
    (ROOT / path).write_text(out, encoding="utf-8")
    print("  wrote", path)


SITE = "tuan photography 陳亮元"


def page_top(title_key, title, sub_key=None, sub="", path=""):
    p = f'\n    <p data-i18n="{sub_key}">{e(sub)}</p>' if sub_key else ""
    return f"""<div class="wrap">
  <header class="page-top">{path}
    <h1 data-i18n="{title_key}">{e(title)}</h1>{p}
  </header>
"""


def crumbs(items):
    lis = "".join(f'<li><a href="{href}" data-i18n="{key}">{e(label)}</a></li>' for href, key, label in items)
    return f'\n    <ol class="path">{lis}</ol>'


# ------------------------------------------------------------------ pages

def build_home():
    en, zh = {}, {}
    root = ""
    lead = DATA["lead"]
    en.update(heroLine="Travel like a photographer.",
              heroSay="I’m Thomas Chen 陳亮元, a landscape photographer. Pick up any photograph to see how it was made. Where the guide is written, it tells you where to stand and when.",
              workTitle="Photographs", workSub="Pick one up to see how it was made.",
              guidesTitle="Guides", guidesSub="Where to stand, when to be there, and the route for the day.",
              guideOpen="Open the guide",
              moreText=f"{len(COUNTRIES) - 1} more countries are in the drawers. Their guides are not written yet.",
              moreCta="See every destination")
    zh.update(heroLine='<span class="nb">像攝影師</span><span class="nb">一樣旅行。</span>',
              heroSay="我是陳亮元，風景攝影師。拿起任何一張照片，就能看到它是怎麼拍的；寫好攻略的地方，會告訴你該站在哪裡、什麼時候去。",
              workTitle="作品", workSub="拿起一張，看它是怎麼拍的。",
              guidesTitle="攻略", guidesSub="站在哪裡、什麼時候去、一天怎麼走。",
              guideOpen="打開攻略",
              moreText=f"還有 {len(COUNTRIES) - 1} 個國家放在抽屜裡，攻略還沒寫。",
              moreCta="看所有目的地")
    others = [s for s in DATA["slides"] if s["id"] != lead] + [SLIDES[lead]]
    rest = "\n".join(slide(s["id"], root, en, zh) for s in others)
    rows = []
    for g in DATA["guides"]:
        c = COUNTRIES[g["country"]]
        gid = g["id"]
        en[f"g_{gid}"], zh[f"g_{gid}"] = g["title"]["en"], g["title"]["zh"]
        en[f"gf_{gid}"], zh[f"gf_{gid}"] = f'{c["en"]} · {g["facts"]["en"]}', f'{c["zh"]} · {g["facts"]["zh"]}'
        rows.append(f"""<a class="row" href="{root}{g['href']}">
        <span class="row__name" data-i18n="g_{gid}">{e(g['title']['en'])}</span>
        <span class="row__note num" data-i18n="gf_{gid}">{e(en[f'gf_{gid}'])}</span>
        <span class="row__end"><span data-i18n="guideOpen">Open the guide</span>{icon('right')}</span>
      </a>""")
    body = f"""<div class="wrap">
  <section class="first">
    {slide(lead, root, en, zh, "(max-width: 60rem) 92vw, 56vw", lead=True)}
    <div class="first__say">
      <h1 data-i18n-html="heroLine">Travel like a photographer.</h1>
      <p data-i18n="heroSay">{e(en['heroSay'])}</p>
      <a class="btn" href="{IG['url']}" target="_blank" rel="noopener">{icon('ig')}<span data-i18n="followCta">Follow on Instagram</span></a>
    </div>
  </section>

  <section class="part" aria-labelledby="work-h">
    <div class="part__head">
      <h2 id="work-h" data-i18n="workTitle">Photographs</h2>
      <p data-i18n="workSub">Pick one up to see how it was made.</p>
    </div>
    <div class="slides">
{rest}
    </div>
  </section>

  <section class="part" aria-labelledby="guides-h">
    <div class="part__head">
      <h2 id="guides-h" data-i18n="guidesTitle">Guides</h2>
      <p data-i18n="guidesSub">Where to stand, when to be there, and the route for the day.</p>
    </div>
    <div class="rows">
      {"".join(rows)}
    </div>
    <p class="more"><span data-i18n="moreText">{e(en['moreText'])}</span><a href="{root}destinations.html"><span data-i18n="moreCta">See every destination</span>{icon('right')}</a></p>
  </section>
</div>"""
    write("index.html", f"{SITE} — Landscape photographs and how each one was made",
          f"{SITE}——風景攝影，以及每一張是怎麼拍的",
          "Landscape photographs by 陳亮元 Thomas Chen, each with the account of how it was made: camera data, where to stand, and the guide to the place.",
          None, body, en, zh)


def build_gallery():
    en, zh = {}, {}
    root = ""
    en.update(pTitle="Gallery", pSub="Every slide on the table. Pick one up to see how it was made.",
              emptyTitle="Not on the table yet", emptySub="Places whose slides are still in the drawers.")
    zh.update(pTitle="作品集", pSub="桌上的每一張片子。拿起來，就能看到它是怎麼拍的。",
              emptyTitle="還沒放上桌", emptySub="這些地方的片子還在抽屜裡。")
    parts = [page_top("pTitle", "Gallery", "pSub", en["pSub"])]
    with_slides = [c for c in DATA["countries"] if any(s["country"] == c["id"] for s in DATA["slides"])]
    without = [c for c in DATA["countries"] if c not in with_slides]
    for c in with_slides:
        own = [s for s in DATA["slides"] if s["country"] == c["id"]]
        cid = c["id"]
        en[f"cn_{cid}"], zh[f"cn_{cid}"] = c["en"], c["zh"]
        en[f"cc_{cid}"] = f'{len(own)} slide' + ("s" if len(own) != 1 else "") + f' · {c["date"]["en"]}'
        zh[f"cc_{cid}"] = f'{len(own)} 張 · {c["date"]["zh"]}'
        grid = "\n".join(f'<div id="s-{s["id"]}">{slide(s["id"], root, en, zh)}</div>' for s in own)
        parts.append(f"""  <section class="part" aria-labelledby="c-{cid}">
    <div class="part__head">
      <h2 id="c-{cid}"><a href="countries/{cid}.html" data-i18n="cn_{cid}">{e(c['en'])}</a></h2>
      <p class="num" data-i18n="cc_{cid}">{e(en[f'cc_{cid}'])}</p>
    </div>
    <div class="slides">
{grid}
    </div>
  </section>""")
    empties = "\n".join(country_slide(c, root, en, zh) for c in without)
    parts.append(f"""  <section class="part" aria-labelledby="empty-h">
    <div class="part__head">
      <h2 id="empty-h" data-i18n="emptyTitle">Not on the table yet</h2>
      <p data-i18n="emptySub">{e(en['emptySub'])}</p>
    </div>
    <div class="slides slides--small">
{empties}
    </div>
  </section>
</div>""")
    write("gallery.html", f"Gallery — {SITE}", f"作品集 — {SITE}",
          "Landscape photographs by 陳亮元 Thomas Chen, grouped by country. Each one shows how it was made.",
          "gallery", "\n".join(parts), en, zh)


def build_destinations():
    en, zh = {}, {}
    root = ""
    en.update(pTitle="Destinations",
              pSub="Every place I've photographed, researched, eaten through, and written up — pick a continent to explore.",
              open="Open")
    zh.update(pTitle="目的地", pSub="每一個我拍攝過、研究過、吃遍也寫成指南的地方——選一個大洲開始探索。", open="打開")
    rows = []
    for k in DATA["continents"]:
        kid = k["id"]
        own = [c for c in DATA["countries"] if c["continent"] == kid]
        en[f"k_{kid}"], zh[f"k_{kid}"] = k["en"], k["zh"]
        en[f"ks_{kid}"], zh[f"ks_{kid}"] = k["sub"]["en"], k["sub"]["zh"]
        if own:
            n = len(own)
            en[f"kn_{kid}"] = f"{n} countr" + ("ies" if n != 1 else "y")
            zh[f"kn_{kid}"] = f"{n} 個國家"
        else:
            en[f"kn_{kid}"], zh[f"kn_{kid}"] = k["state"]["en"], k["state"]["zh"]
        rows.append(f"""      <a class="row" href="continents/{kid}.html">
        <span class="row__name" data-i18n="k_{kid}">{e(k['en'])}</span>
        <span class="row__note" data-i18n="ks_{kid}">{e(k['sub']['en'])}</span>
        <span class="row__end num"><span data-i18n="kn_{kid}">{e(en[f'kn_{kid}'])}</span>{icon('right')}</span>
      </a>""")
    body = page_top("pTitle", "Destinations", "pSub", en["pSub"]) + f"""  <section class="part">
    <div class="rows">
{chr(10).join(rows)}
    </div>
  </section>
</div>"""
    write("destinations.html", f"Destinations — {SITE}", f"目的地 — {SITE}",
          "Every place photographed and researched by 陳亮元 Thomas Chen, by continent and country.",
          "destinations", body, en, zh)


def blank(root, en, zh, label_key, label_en, text_key, text_en):
    en.setdefault("backBtn", "Back to destinations")
    zh.setdefault("backBtn", "回到目的地")
    return f"""  <section class="part">
    <div class="blank">
      {empty_slide(label_key, label_en)}
      <div>
        <p data-i18n="{text_key}">{e(text_en)}</p>
        <a class="btn btn--line" href="{root}destinations.html">{icon('left')}<span data-i18n="backBtn">Back to destinations</span></a>
      </div>
    </div>
  </section>"""


def build_continents():
    for k in DATA["continents"]:
        en, zh = {}, {}
        root = "../"
        kid = k["id"]
        own = [c for c in DATA["countries"] if c["continent"] == kid]
        en.update(pTitle=k["en"], pSub=k["sub"]["en"], pathDest="Destinations")
        zh.update(pTitle=k["zh"], pSub=k["sub"]["zh"], pathDest="目的地")
        top = page_top("pTitle", k["en"], "pSub", k["sub"]["en"],
                       crumbs([(f"{root}destinations.html", "pathDest", "Destinations")]))
        if own:
            grid = "\n".join(country_slide(c, root, en, zh) for c in own)
            body = top + f"""  <section class="part">
    <div class="slides">
{grid}
    </div>
  </section>
</div>"""
        else:
            en.update(emptyLabel=k["state"]["en"], emptyText="There are no photographs or guides from this continent yet.")
            zh.update(emptyLabel=k["state"]["zh"], emptyText="這個大洲還沒有照片，也還沒有攻略。")
            body = top + blank(root, en, zh, "emptyLabel", en["emptyLabel"], "emptyText", en["emptyText"]) + "\n</div>"
        write(f"continents/{kid}.html", f"{k['en']} — {SITE}", f"{k['zh']} — {SITE}",
              f"{k['en']}: countries photographed by 陳亮元 Thomas Chen.", "destinations", body, en, zh)


def build_countries():
    for c in DATA["countries"]:
        en, zh = {}, {}
        root = "../"
        cid = c["id"]
        k = CONTINENTS[c["continent"]]
        own = [s for s in DATA["slides"] if s["country"] == cid]
        guides = [g for g in DATA["guides"] if g["country"] == cid]
        en.update(pTitle=c["en"], pSub=c["note"]["en"], statLabel=c["date"]["en"],
                  pathDest="Destinations", pathCont=k["en"])
        zh.update(pTitle=c["zh"], pSub=c["note"]["zh"], statLabel=c["date"]["zh"],
                  pathDest="目的地", pathCont=k["zh"])
        path = crumbs([(f"{root}destinations.html", "pathDest", "Destinations"),
                       (f"{root}continents/{k['id']}.html", "pathCont", k["en"])])
        parts = [f"""<div class="wrap">
  <header class="page-top">{path}
    <h1 data-i18n="pTitle">{e(c['en'])}</h1>
    <p data-i18n="pSub">{e(c['note']['en'])}</p>
    <p class="when num" data-i18n="statLabel">{e(c['date']['en'])}</p>
  </header>"""]
        if guides:
            en.update(guidesTitle="Guides", guideOpen="Open the guide")
            zh.update(guidesTitle="攻略", guideOpen="打開攻略")
            rows = []
            for g in guides:
                gid = g["id"]
                en[f"g_{gid}"], zh[f"g_{gid}"] = g["title"]["en"], g["title"]["zh"]
                en[f"gf_{gid}"], zh[f"gf_{gid}"] = g["facts"]["en"], g["facts"]["zh"]
                rows.append(f"""      <a class="row" href="{root}{g['href']}">
        <span class="row__name" data-i18n="g_{gid}">{e(g['title']['en'])}</span>
        <span class="row__note num" data-i18n="gf_{gid}">{e(g['facts']['en'])}</span>
        <span class="row__end"><span data-i18n="guideOpen">Open the guide</span>{icon('right')}</span>
      </a>""")
            parts.append(f"""  <section class="part" aria-labelledby="guides-h">
    <div class="part__head"><h2 id="guides-h" data-i18n="guidesTitle">Guides</h2></div>
    <div class="rows">
{chr(10).join(rows)}
    </div>
  </section>""")
        if own:
            en.update(workTitle="Photographs", workSub="Pick one up to see how it was made.")
            zh.update(workTitle="作品", workSub="拿起一張，看它是怎麼拍的。")
            grid = "\n".join(slide(s["id"], root, en, zh) for s in own)
            parts.append(f"""  <section class="part" aria-labelledby="work-h">
    <div class="part__head">
      <h2 id="work-h" data-i18n="workTitle">Photographs</h2>
      <p data-i18n="workSub">Pick one up to see how it was made.</p>
    </div>
    <div class="slides">
{grid}
    </div>
  </section>""")
        if not guides:
            if own:
                en.update(wipLabel="No guide yet", wipText="The guide for this country is not written yet.")
                zh.update(wipLabel="還沒有攻略", wipText="這個國家的攻略還沒寫。")
            else:
                en.update(wipLabel="Nothing here yet",
                          wipText="The guide for this country is not written yet, and its slides are not on the table.")
                zh.update(wipLabel="還沒有內容", wipText="這個國家的攻略還沒寫，片子也還沒放上桌。")
            if own:
                en.setdefault("backBtn", "Back to destinations")
                zh.setdefault("backBtn", "回到目的地")
                parts.append(f"""  <section class="part">
    <p class="quiet" data-i18n="wipText">{e(en['wipText'])}</p>
  </section>""")
            else:
                parts.append(blank(root, en, zh, "wipLabel", en["wipLabel"], "wipText", en["wipText"]))
        parts.append("</div>")
        write(f"countries/{cid}.html", f"{c['en']} — {SITE}", f"{c['zh']} — {SITE}",
              f"{c['en']}: photographs and guides by 陳亮元 Thomas Chen.", "destinations", "\n".join(parts), en, zh)


def build_blog():
    en, zh = {}, {}
    en.update(pTitle="Blog", pSub="Field notes, travel stories, and what actually happened between the photos.",
              emptyLabel="Nothing published yet",
              emptyText="The first story is planned for after the Vietnam trip.",
              backHome="Back to the photographs")
    zh.update(pTitle="網誌", pSub="田野筆記、旅行故事,以及照片與照片之間真正發生的事。",
              emptyLabel="還沒有文章", emptyText="第一篇故事預計在越南旅程之後刊出。", backHome="回到作品")
    body = page_top("pTitle", "Blog", "pSub", en["pSub"]) + f"""  <section class="part">
    <div class="blank">
      {empty_slide("emptyLabel", en["emptyLabel"])}
      <div>
        <p data-i18n="emptyText">{e(en['emptyText'])}</p>
        <a class="btn btn--line" href="gallery.html">{icon('left')}<span data-i18n="backHome">Back to the photographs</span></a>
      </div>
    </div>
  </section>
</div>"""
    write("blog.html", f"Blog — {SITE}", f"網誌 — {SITE}",
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
    rows = "\n".join(f"""      <div class="row">
        <span class="row__note" data-i18n="s{i}title">{e(en[f's{i}title'])}</span>
        <span></span>
        <span class="row__end" data-i18n="notYet">Not written yet</span>
      </div>""" for i in (1, 2, 3))
    body = page_top("pTitle", "Photography Skills", "pSub", en["pSub"]) + f"""  <section class="part" aria-labelledby="plan-h">
    <div class="part__head">
      <h2 id="plan-h" data-i18n="planned">Planned</h2>
      <p data-i18n="wipNote">{e(en['wipNote'])}</p>
    </div>
    <div class="rows">
{rows}
    </div>
  </section>
</div>"""
    write("skills.html", f"Photography Skills — {SITE}", f"攝影技巧 — {SITE}",
          "How 陳亮元 Thomas Chen plans, shoots and edits.", "skills", body, en, zh)


def build_about():
    en, zh = {}, {}
    cams = sorted({s["camera"] for s in DATA["slides"]})
    lenses = sorted({s["lens"] for s in DATA["slides"]})
    en.update(abTitle="I plan trips like shoots — because they are.",
              abLede="Before every trip I disappear into research: light direction, seasons, opening hours, transport, and the food locals actually eat. Then I go, shoot the plan, and write down what was true and what wasn't.",
              abBody1="This site is that homework, published. Every guide tells you where the photo was taken, when to stand there, and what to do with the rest of your day. Some spots get exact pins; the fragile ones stay vague on purpose — you'll understand when you get there.",
              abCta="Say hello", abPortrait="Portrait, not mounted yet",
              fCountries="Countries", fCountriesV=f"{len(COUNTRIES)} so far",
              fHome="Home base", fHomeV="Taiwan",
              fCamera="Camera", fLens="Lenses", fIg="Instagram")
    zh.update(abTitle="我把旅行當拍攝案規劃——因為它本來就是。",
              abLede="每趟旅行前,我都會埋進研究裡:光線方向、季節、開放時間、交通,還有當地人真正在吃的東西。然後出發、照計畫拍攝,再記下哪些是真的、哪些不是。",
              abBody1="這個網站就是那些功課的出版版本。每份指南都告訴你照片在哪裡拍、什麼時候該站在那裡,以及一天剩下的時間該做什麼。有些機位給精確座標;脆弱的秘境則刻意模糊——到了你就懂。",
              abCta="打聲招呼", abPortrait="肖像，還沒上片夾",
              fCountries="國家數", fCountriesV=f"目前 {len(COUNTRIES)} 個",
              fHome="大本營", fHomeV="台灣",
              fCamera="相機", fLens="鏡頭", fIg="Instagram")
    body = f"""<div class="wrap">
  <section class="about">
    {empty_slide("abPortrait", en["abPortrait"])}
    <div>
      <h1 data-i18n="abTitle">{e(en['abTitle'])}</h1>
      <p class="lede" data-i18n="abLede">{e(en['abLede'])}</p>
      <p data-i18n="abBody1">{e(en['abBody1'])}</p>
      <div class="acts">
        <a class="btn" href="{IG['url']}" target="_blank" rel="noopener">{icon('ig')}<span data-i18n="followCta">Follow on Instagram</span></a>
      </div>
      <dl class="facts">
        <div><dt data-i18n="fCountries">Countries</dt><dd class="num" data-i18n="fCountriesV">{e(en['fCountriesV'])}</dd></div>
        <div><dt data-i18n="fHome">Home base</dt><dd data-i18n="fHomeV">Taiwan</dd></div>
        <div><dt data-i18n="fCamera">Camera</dt><dd>{e(' · '.join(cams))}</dd></div>
        <div><dt data-i18n="fLens">Lenses</dt><dd>{'<br>'.join(e(x) for x in lenses)}</dd></div>
        <div><dt data-i18n="fIg">Instagram</dt><dd><a href="{IG['url']}" target="_blank" rel="noopener">@{IG['handle']}</a></dd></div>
      </dl>
    </div>
  </section>
</div>"""
    write("about.html", f"About — {SITE}", f"關於我 — {SITE}",
          "About 陳亮元 Thomas Chen, landscape photographer.", "about", body, en, zh)


def build_guide(name, title_en, title_zh, desc):
    d = json.loads((ROOT / "content" / f"{name}.i18n.json").read_text(encoding="utf-8"))
    en, zh = d["en"], d["zh"]
    root = "../"
    body = (ROOT / "content" / f"{name}.body.html").read_text(encoding="utf-8")
    body = body.replace("{root}", root)
    body = re.sub(r"\{plate:([a-z0-9-]+)\}", lambda m: plate(m.group(1), root, en, zh), body)
    body = re.sub(r"\{shot:([a-z0-9-]+)\}", lambda m: shot(m.group(1), root, en, zh), body)
    body = re.sub(r"\{map:([^}]+)\}",
                  lambda m: f'<a href="{m.group(1)}" target="_blank" rel="noopener"><span data-i18n="mapLink">Map</span>{icon("out")}</a>',
                  body)
    for a, bb in (('<table class="sheet">', '<table class="sheet" role="table">'), ("<thead>", '<thead role="rowgroup">'),
                  ("<tbody>", '<tbody role="rowgroup">'), ("<tr>", '<tr role="row">'), ("<th ", '<th role="columnheader" '),
                  ("<td>", '<td role="cell">'), ("<td ", '<td role="cell" ')):
        body = body.replace(a, bb)
    body = body.replace("{ate}", f'<span class="ate">{icon("check")}<span data-i18n="ate">eaten</span></span>')
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
    build_guide("barcelona", f"Barcelona — {SITE}", f"巴賽隆納 — {SITE}",
                "A photographer's real 4-day Barcelona guide: Gaudí photo spots with best light, Bunkers del Carmel sunset, Tibidabo, day-by-day route, and a tested tapas list.")
    print("Done.")
