"""Variation 09, "The fold": each photograph is printed on the top half of a sheet of card
paper whose lower half is folded up behind it. "Unfold" swings the lower half down along the
crease to show the account written on it. The last sheet's fold holds the way into the site.
The moment is the unfold."""

META = {
    "name": {"en": "The fold", "zh": "摺頁"},
    "idea": {"en": "Each photograph is printed on a folded sheet; unfold it and its story is written inside.",
             "zh": "每張照片印在一張對摺的紙上，展開，裡面寫著它的故事。"},
}

COVER = "fuji-lake"
# down the page, alternately a little left and a little right of centre
SHEETS = ["roys-peak", "calanque-tall", "sagrada-plaza", "sapa-terraces", "tower-bridge"]
LAST = "zermatt-dusk"

TABS = {
    "gallery": {"en": "Every photograph, and nothing else.", "zh": "所有照片，只有照片。"},
    "journey": {"en": "Each trip, along its route.", "zh": "每一趟旅程，沿著路線看。"},
    "guides": {"en": "What to do there, place by place.", "zh": "到了當地做什麼，一地一地寫。"},
    "about": {"en": "The photographer, and how to reach him.", "zh": "攝影師是誰，怎麼聯絡他。"},
}


def account(k, sid, en, zh):
    """What is written inside the fold: only what the site knows about the photograph."""
    f = k.facts(sid)
    e, w = k.e, k.words
    country = k.COUNTRIES[k.SLIDES[sid]["country"]]
    rows = []
    if f["month"]:
        rows.append(f'<div><dt data-i18n="v9Taken">Taken</dt><dd data-i18n="v9m_{sid}">{e(w(en, zh, f"v9m_{sid}", f["month"]))}</dd></div>')
    if f["trip"]:
        href = f'../journey/wc-sketch/trip/?trip={f["trip"]["id"]}'
        rows.append(f'<div><dt data-i18n="v9Trip">Trip</dt><dd><a href="{e(href)}" data-i18n="v9t_{sid}">'
                    f'{e(w(en, zh, f"v9t_{sid}", f["trip"]["label"]))}</a></dd></div>')
    if f["camera"]:
        cam = "".join(f"<span>{e(p)}</span>" for p in f["camera"])
        rows.append(f'<div><dt data-i18n="v9Camera">Camera</dt><dd class="fold__cam">{cam}</dd></div>')
    if f["lens"]:
        rows.append(f'<div><dt data-i18n="v9Lens">Lens</dt><dd>{e(f["lens"])}</dd></div>')
    if f["guide"]:
        go = f'<a href="../{e(f["guide"]["href"])}" data-i18n="v9Guide">Read the guide</a>'
    else:
        key = f"v9c_{sid}"
        w(en, zh, key, {"en": f"More from {'the ' if country['en'].startswith(('United', 'Netherlands')) else ''}{country['en']}", "zh": f"更多{country['zh']}的照片"})
        go = f'<a href="../{e(f["country_href"])}" data-i18n="{key}">{e(en[key])}</a>'
    w(en, zh, f"v9p_{sid}", f["place"])
    w(en, zh, f"v9w_{sid}", f["where"])
    return (f'<h2 class="fold__place" data-i18n="v9p_{sid}">{e(f["place"]["en"])}</h2>'
            f'<p class="fold__where" data-i18n="v9w_{sid}">{e(f["where"]["en"])}</p>'
            f'<dl class="fold__facts num">{"".join(rows)}</dl>'
            f'<p class="fold__go"><a {k.opens(sid, en, zh)} data-i18n="v9How">How this was made</a>{go}</p>')


def sheet(k, sid, inside, en, zh, last=False):
    s = k.SLIDES[sid]
    shape = "tall" if s["h"] > s["w"] else "wide"
    return f"""  <article class="fold fold--{shape}{' fold--last' if last else ''}" style="--ar: {s['w'] / s['h']:.4f}">
    <div class="fold__top"><a {k.opens(sid, en, zh)}>{k.img(sid, "(max-width: 52rem) 92vw, 46rem")}</a></div>
    <div class="fold__room"><div class="fold__clip">
      <div class="fold__panel" id="v9-{sid}">{inside}</div>
    </div></div>
    <button class="fold__btn caps" type="button" aria-expanded="false" aria-controls="v9-{sid}" data-i18n="v9Unfold">Unfold</button>
  </article>"""


def build(k):
    en, zh = {}, {}
    e, w = k.e, k.words
    w(en, zh, "v9Head", {"en": "Every photograph has a story", "zh": "每張照片都有它的故事"})
    w(en, zh, "v9Say", {"en": "Each sheet is folded once. Unfold it to read where and when the photograph was taken, on which trip, and with what camera.",
                        "zh": "每張紙都對摺過一次。展開，就能讀到這張照片在哪裡、什麼時候、哪一趟旅程、用什麼相機拍的。"})
    w(en, zh, "v9Unfold", {"en": "Unfold", "zh": "展開"})
    w(en, zh, "v9Fold", {"en": "Fold", "zh": "摺起"})
    w(en, zh, "v9Taken", {"en": "Taken", "zh": "拍攝"})
    w(en, zh, "v9Trip", {"en": "Trip", "zh": "旅程"})
    w(en, zh, "v9Camera", {"en": "Camera", "zh": "相機設定"})
    w(en, zh, "v9Lens", {"en": "Lens", "zh": "鏡頭"})
    w(en, zh, "v9How", {"en": "How this was made", "zh": "這張怎麼拍"})
    w(en, zh, "v9Guide", {"en": "Read the guide", "zh": "閱讀攻略"})
    w(en, zh, "v9Ways", {"en": "The rest of the journal", "zh": "日誌的其他部分"})

    sheets = [sheet(k, sid, account(k, sid, en, zh), en, zh) for sid in SHEETS]

    tabs = []
    for tid, key, label, href in k.NAV:
        w(en, zh, f"v9d_{tid}", TABS[tid])
        tabs.append(f'<li><a href="../{href}"><b data-i18n="{key}">{e(label)}</b>'
                    f'<span data-i18n="v9d_{tid}">{e(TABS[tid]["en"])}</span></a></li>')
    ways = (f'<h2 class="fold__place" data-i18n="v9Ways">{e(en["v9Ways"])}</h2>'
            f'<nav class="fold__ways" aria-label="{e(en["v9Ways"])}" data-i18n-aria="v9Ways"><ul>{"".join(tabs)}</ul></nav>')
    sheets.append(sheet(k, LAST, ways, en, zh, last=True))

    body = f"""{k.cover(COVER, en, zh)}

<div class="leaf">
<section class="wrap intro">
  <h1 data-i18n="v9Head">Every photograph has a story</h1>
  <p data-i18n="v9Say">{e(en["v9Say"])}</p>
</section>

<section class="wrap folds">
{chr(10).join(sheets)}
</section>
</div>"""
    return body, en, zh
