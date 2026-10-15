"""Variation 04, "The back of the print": six prints laid on the stone table, each one turned
over by a word beneath it to show the notes written on its back. The moment is the turn."""

META = {
    "name": {"en": "The back of the print", "zh": "照片背面"},
    "idea": {"en": "Six prints on the table; turn one over and its story is written on the back.",
             "zh": "桌上六張照片，翻到背面，就是它的故事。"},
}

COVER = "aoraki"
# in the order they lie on the table; their place on it is set in v04.css
PRINTS = ["bunkers", "tekapo-stars", "fushimi-inari", "matterhorn-flag", "peak-night", "sapa-terraces"]

TABS = {
    "gallery": {"en": "Every photograph, and nothing else.", "zh": "所有照片，只有照片。"},
    "journey": {"en": "Each trip, along its route.", "zh": "每一趟旅程，沿著路線看。"},
    "guides": {"en": "What to do there, place by place.", "zh": "到了當地做什麼，一地一地寫。"},
    "about": {"en": "The photographer, and how to reach him.", "zh": "攝影師是誰，怎麼聯絡他。"},
}


def back(k, sid, en, zh):
    """The notes on the back of one print: only what the site knows about it."""
    f = k.facts(sid)
    e, w = k.e, k.words
    country = k.COUNTRIES[k.SLIDES[sid]["country"]]
    rows = []
    if f["month"]:
        rows.append(f'<div><dt data-i18n="v4Taken">Taken</dt><dd data-i18n="v4m_{sid}">{e(w(en, zh, f"v4m_{sid}", f["month"]))}</dd></div>')
    if f["trip"]:
        href = f'../journey/wc-sketch/trip/?trip={f["trip"]["id"]}'
        rows.append(f'<div><dt data-i18n="v4Trip">Trip</dt><dd><a href="{e(href)}" data-i18n="v4t_{sid}">'
                    f'{e(w(en, zh, f"v4t_{sid}", f["trip"]["label"]))}</a></dd></div>')
    if f["camera"]:
        cam = "".join(f"<span>{e(p)}</span>" for p in f["camera"])
        rows.append(f'<div><dt data-i18n="v4Camera">Camera</dt><dd class="back__cam">{cam}</dd></div>')
    if f["lens"]:
        rows.append(f'<div><dt data-i18n="v4Lens">Lens</dt><dd>{e(f["lens"])}</dd></div>')
    if f["guide"]:
        go = (f'<a href="../{e(f["guide"]["href"])}" data-i18n="v4Guide">Read the guide</a>')
    else:
        key = f"v4c_{sid}"
        w(en, zh, key, {"en": f"More from {'the ' if country['en'].startswith(('United', 'Netherlands')) else ''}{country['en']}", "zh": f"更多{country['zh']}的照片"})
        go = f'<a href="../{e(f["country_href"])}" data-i18n="{key}">{e(en[key])}</a>'
    w(en, zh, f"v4p_{sid}", f["place"])
    w(en, zh, f"v4w_{sid}", f["where"])
    return f"""<div class="print__back" id="v4b-{sid}">
          <h2 class="back__place" data-i18n="v4p_{sid}">{e(f["place"]["en"])}</h2>
          <p class="back__where" data-i18n="v4w_{sid}">{e(f["where"]["en"])}</p>
          <dl class="back__facts num">{"".join(rows)}</dl>
          <p class="back__go"><a {k.opens(sid, en, zh)} data-i18n="v4How">How this was made</a>{go}</p>
        </div>"""


def build(k):
    en, zh = {}, {}
    e, w = k.e, k.words
    w(en, zh, "v4Head", {"en": "Every photograph has a story", "zh": "每張照片都有它的故事"})
    w(en, zh, "v4Say", {"en": "A print carries its own on the back. Turn one over to read where and when it was taken, on which trip, and with what camera.",
                        "zh": "照片的故事寫在背面。翻過來，就能看到在哪裡、什麼時候、哪一趟旅程、用什麼相機拍的。"})
    w(en, zh, "v4Turn", {"en": "Turn over", "zh": "翻到背面"})
    w(en, zh, "v4Taken", {"en": "Taken", "zh": "拍攝"})
    w(en, zh, "v4Trip", {"en": "Trip", "zh": "旅程"})
    w(en, zh, "v4Camera", {"en": "Camera", "zh": "相機設定"})
    w(en, zh, "v4Lens", {"en": "Lens", "zh": "鏡頭"})
    w(en, zh, "v4How", {"en": "How this was made", "zh": "這張怎麼拍"})
    w(en, zh, "v4Guide", {"en": "Read the guide", "zh": "閱讀攻略"})
    w(en, zh, "v4Ways", {"en": "The four parts of the site", "zh": "網站的四個部分"})

    prints = []
    for sid in PRINTS:
        s = k.SLIDES[sid]
        prints.append(f"""    <div class="print print--{'tall' if s['h'] > s['w'] else 'wide'}" id="v4-{sid}" style="--ar: {s['w'] / s['h']:.4f}">
      <div class="print__stage">
        <div class="print__card">
        <div class="print__front"><a {k.opens(sid, en, zh)}>{k.img(sid, "(max-width: 52rem) 92vw, 40vw")}</a></div>
        {back(k, sid, en, zh)}
        </div>
      </div>
      <button class="print__turn caps" type="button" aria-pressed="false" aria-controls="v4-{sid}" data-i18n="v4Turn">Turn over</button>
    </div>""")

    tabs = []
    for tid, key, label, href in k.NAV:
        w(en, zh, f"v4d_{tid}", TABS[tid])
        tabs.append(f'<li><a class="backs__card" href="../{href}"><b data-i18n="{key}">{e(label)}</b>'
                    f'<span data-i18n="v4d_{tid}">{e(TABS[tid]["en"])}</span></a></li>')

    body = f"""{k.cover(COVER, en, zh)}

<div class="leaf">
<section class="wrap intro">
  <h1 data-i18n="v4Head">Every photograph has a story</h1>
  <p data-i18n="v4Say">{e(en["v4Say"])}</p>
</section>

<div class="band">
  <section class="wrap part v4">
    <div class="table">
{chr(10).join(prints)}
    </div>
    <nav class="backs" aria-label="{e(en['v4Ways'])}" data-i18n-aria="v4Ways">
      <ul>{"".join(tabs)}</ul>
    </nav>
  </section>
</div>
</div>"""
    return body, en, zh
