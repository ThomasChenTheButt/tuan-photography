"""Variation 01, Facing pages: the home page as a run of spreads in an opened travel journal.

After the opening photograph, six spreads on the stone band: a photograph on one page, its
account on the facing page (place, country, month, trip, camera line, lens, and the ways on).
The photograph changes sides from spread to spread; on a phone a spread is the photograph,
then its account. The journal ends with its contents, the way into the four tabs.
Every fact comes from k.facts(); nothing is invented.
"""

META = {
    "name": {"en": "Facing pages", "zh": "對頁"},
    "idea": {"en": "The home page as an opened travel journal: each photograph on one page, its account on the facing page.",
             "zh": "首頁像一本攤開的旅行手帳：照片在一頁，對頁寫著它是怎麼拍的。"},
}

COVER = "roys-peak"
SPREADS = ["bunkers", "fuji-lake", "sapa-terraces", "calanque", "casa-batllo", "tekapo-stars"]


def account(k, f, en, zh):
    """The facing page: the photograph's account, set quietly."""
    sid = f["id"]
    k.words(en, zh, f"sp_{sid}", f["place"])
    k.words(en, zh, f"sw_{sid}", f["where"])
    rows = []
    trip = f["trip"]
    month = f["month"]
    if month and not (trip and trip["label"]["en"] == month["en"]):
        k.words(en, zh, f"v1m_{sid}", month)
        rows.append(f'<div><dt class="caps" data-i18n="v1Taken">Taken</dt><dd data-i18n="v1m_{sid}">{k.e(month["en"])}</dd></div>')
    if trip:
        k.words(en, zh, f"v1t_{sid}", trip["label"])
        rows.append(f'<div><dt class="caps" data-i18n="v1Trip">Trip</dt><dd data-i18n="v1t_{sid}">{k.e(trip["label"]["en"])}</dd></div>')
    if f["camera"]:
        cam = "".join(f"<span>{k.e(p)}</span>" for p in f["camera"])
        rows.append(f'<div><dt class="caps" data-i18n="v1Camera">Camera</dt><dd class="num v01-cam">{cam}</dd></div>')
    if f["lens"]:
        rows.append(f'<div><dt class="caps" data-i18n="v1Lens">Lens</dt><dd>{k.e(f["lens"])}</dd></div>')
    facts = f'\n          <dl class="v01-facts">{"".join(rows)}</dl>' if rows else ""

    # the ways on: how it was made (the viewer), then the guide, or the place's photographs
    how = (f'<a class="caps" href="../gallery.html#s-{sid}" data-slide="{sid}" aria-describedby="v01-n-{sid}" '
           f'data-i18n="v1How">How it was made</a>')
    if f["guide"]:
        on = f'<a class="caps" href="../{f["guide"]["href"]}" aria-describedby="v01-n-{sid}" data-i18n="v1Guide">Read the guide</a>'
    else:
        c = k.COUNTRIES[k.SLIDES[sid]["country"]]
        k.words(en, zh, f"v1c_{sid}", {"en": f"Photographs from {c['en']}", "zh": f"{c['zh']}的照片"})
        on = f'<a class="caps" href="../{f["country_href"]}" data-i18n="v1c_{sid}">Photographs from {k.e(c["en"])}</a>'
    return f"""<div class="v01-page v01-page--words">
          <h2 id="v01-n-{sid}" data-i18n="sp_{sid}">{k.e(f["place"]["en"])}</h2>
          <p class="v01-where" data-i18n="sw_{sid}">{k.e(f["where"]["en"])}</p>{facts}
          <p class="v01-on">{how}{on}</p>
        </div>"""


def build(k):
    en, zh = {}, {}
    for key, pair in {
        "v1Head": {"en": "Travel like a photographer", "zh": "像攝影師一樣旅行"},
        "v1Taken": {"en": "Taken", "zh": "拍攝"},
        "v1Trip": {"en": "Trip", "zh": "旅程"},
        "v1Camera": {"en": "Camera", "zh": "相機設定"},
        "v1Lens": {"en": "Lens", "zh": "鏡頭"},
        "v1How": {"en": "How it was made", "zh": "這張怎麼拍"},
        "v1Guide": {"en": "Read the guide", "zh": "閱讀攻略"},
        "v1Contents": {"en": "Contents", "zh": "目錄"},
        "v1Every": {"en": "Every photograph here leads to how it was made: where, when, on which trip and with what camera.",
                    "zh": "這裡的每一張照片都通往它是怎麼拍的：在哪裡、什麼時候、哪一趟旅程、用什麼相機。"},
    }.items():
        k.words(en, zh, key, pair)

    spreads = []
    for n, sid in enumerate(SPREADS):
        f = k.facts(sid)
        ar = f'{f["w"] / f["h"]:.4f}'
        shape = "tall" if f["h"] > f["w"] else "wide"
        photo = (f'<div class="v01-page v01-page--photo v01-page--{shape}">'
                 f'<a class="v01-photo" {k.opens(sid, en, zh)} style="--ar: {ar}">'
                 f'{k.img(sid, "(max-width: 48rem) 92vw, 40vw")}</a></div>')
        flip = " v01-spread--flip" if n % 2 else ""
        spreads.append(f"""      <article class="v01-spread{flip}" aria-labelledby="v01-n-{sid}">
        {photo}
        {account(k, f, en, zh)}
      </article>""")

    # the journal's contents: the way into the four tabs, with what each one holds (counted by the build)
    held = {
        "gallery": {"en": f"{len(k.SLIDES)} photographs", "zh": f"{len(k.SLIDES)} 張照片"},
        "journey": {"en": f"{len(k.DATA['journeys'])} trips", "zh": f"{len(k.DATA['journeys'])} 趟旅程"},
        "guides": {"en": f"{len(k.COUNTRIES)} countries", "zh": f"{len(k.COUNTRIES)} 個國家"},
        "about": {"en": "Thomas Chen", "zh": "陳亮元"},
    }
    rows = []
    for tid, key, label, href in k.NAV:
        k.words(en, zh, f"v1h_{tid}", held[tid])
        rows.append(f'<li><a href="../{href}"><b data-i18n="{key}">{label}</b><span class="v01-lead" aria-hidden="true"></span>'
                    f'<span class="num" data-i18n="v1h_{tid}">{k.e(held[tid]["en"])}</span></a></li>')
    contents = f"""      <article class="v01-spread v01-spread--end" aria-labelledby="v01-contents">
        <div class="v01-page v01-page--title">
          <h2 id="v01-contents" data-i18n="v1Contents">Contents</h2>
          <p data-i18n="v1Every">{k.e(en["v1Every"])}</p>
        </div>
        <div class="v01-page v01-page--contents">
          <ol class="v01-toc">
            {(chr(10) + "            ").join(rows)}
          </ol>
        </div>
      </article>"""

    body = f"""{k.cover(COVER, en, zh)}
<div class="leaf">
  <section class="v01 band" aria-labelledby="v01-head">
    <h1 class="sr" id="v01-head" data-i18n="v1Head">Travel like a photographer</h1>
    <div class="v01-run">
{chr(10).join(spreads)}
{contents}
    </div>
  </section>
</div>"""
    return body, en, zh
