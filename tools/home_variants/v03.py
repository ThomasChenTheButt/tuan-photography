"""Variation 03, "The caption grows / 說明慢慢長出來".

One photograph per screen-height section, centred on paper with wide margins and its name
beneath it as a normal caption. As the photograph settles in the middle of the screen, the
caption unfolds line by line into the photograph's full account (where, when, on which trip,
the camera's settings, the camera, the lens, then the way to how it was made and to the guide
or the place); scrolled away, it folds back to the name. The opening photograph is the site's
own full-window cover; its caption is the first thing on the leaf, directly beneath it.
The way into the four tabs is one more caption that grows.

Motion: CSS scroll-driven animation (animation-timeline: view()), with an IntersectionObserver
fallback in design 1/js/home-variants/v03.js. Under reduced motion every account is simply shown.
"""

META = {
    "name": {"en": "The caption grows", "zh": "說明慢慢長出來"},
    "idea": {"en": "One photograph per screen; as it settles in the middle, its caption unfolds line by line into the whole account of how it was made, and folds back as you move on.",
             "zh": "一個畫面一張照片；照片停在畫面中央時，下面的說明一行一行展開成完整的拍攝紀錄，往下滑就收回成名字。"},
}

COVER = "aoraki"
# five more, in the order they are met: wide, tall, open, near square, tall (the guide last)
PLATES = ["fuji-lake", "sapa-dusk", "calanque", "st-pauls", "park-guell"]

TRIP_HREF = "../journey/wc-sketch/trip/?trip="

LABELS = {
    "v3Where": {"en": "Where", "zh": "地點"},
    "v3When": {"en": "When", "zh": "時間"},
    "v3Trip": {"en": "Trip", "zh": "旅程"},
    "v3Set": {"en": "Settings", "zh": "參數"},
    "v3Cam": {"en": "Camera", "zh": "相機"},
    "v3Lens": {"en": "Lens", "zh": "鏡頭"},
    "v3Made": {"en": "How it was made", "zh": "這張怎麼拍"},
}

TABS = {
    "gallery": {"en": "Every photograph", "zh": "每一張照片"},
    "journey": {"en": "Each trip, along its route", "zh": "每一趟旅程，沿著路線"},
    "guides": {"en": "What to do there, place by place", "zh": "到了那裡做什麼，一地一地寫"},
    "about": {"en": "The photographer, and how to reach him", "zh": "攝影師本人，以及怎麼聯絡他"},
}


def account(k, sid, en, zh):
    """The caption of one photograph: its name, then the lines that unfold beneath it."""
    f = k.facts(sid)
    e = k.e
    en[f"sw_{sid}"], zh[f"sw_{sid}"] = f["where"]["en"], f["where"]["zh"]
    lines = [("v3Where", f'<dd data-i18n="sw_{sid}">{e(f["where"]["en"])}</dd>')]
    if f["month"]:
        k.words(en, zh, f"v3m_{sid}", f["month"])
        lines.append(("v3When", f'<dd class="num" data-i18n="v3m_{sid}">{e(f["month"]["en"])}</dd>'))
    if f["trip"]:
        k.words(en, zh, f"v3t_{sid}", f["trip"]["label"])
        lines.append(("v3Trip", f'<dd><a href="{TRIP_HREF}{f["trip"]["id"]}" data-i18n="v3t_{sid}">'
                                f'{e(f["trip"]["label"]["en"])}</a></dd>'))
    if f["camera"]:
        lines.append(("v3Set", '<dd class="num v3-set">' + "".join(f"<span>{e(p)}</span>" for p in f["camera"]) + "</dd>"))
    if f["body"]:
        lines.append(("v3Cam", f"<dd>{e(f['body'])}</dd>"))
    if f["lens"]:
        lines.append(("v3Lens", f"<dd>{e(f['lens'])}</dd>"))
    rows = "\n".join(f'          <div class="v3-line" style="--i: {i}"><dt class="caps" data-i18n="{key}">{e(LABELS[key]["en"])}</dt>{dd}</div>'
                     for i, (key, dd) in enumerate(lines))
    if f["guide"]:
        k.words(en, zh, f"v3g_{sid}", {"en": f"The {f['guide']['title']['en']} guide", "zh": f"{f['guide']['title']['zh']}攻略"})
        place = f'<a href="../{f["guide"]["href"]}" data-i18n="v3g_{sid}">{e(en[f"v3g_{sid}"])}</a>'
    else:
        c = k.COUNTRIES[k.SLIDES[sid]["country"]]
        k.words(en, zh, f"v3c_{sid}", {"en": f"{c['en']}, in Guides", "zh": f"攻略：{c['zh']}"})
        place = f'<a href="../{f["country_href"]}" data-i18n="v3c_{sid}">{e(en[f"v3c_{sid}"])}</a>'
    go = (f'<p class="v3-line v3-go" style="--i: {len(lines)}">'
          f'<a href="../gallery.html#s-{sid}" data-slide="{sid}" data-i18n="v3Made">How it was made</a>{place}</p>')
    return (f'<figcaption class="v3-cap">\n        <b class="v3-name" data-i18n="sp_{sid}">{e(f["place"]["en"])}</b>\n'
            f'        <dl class="v3-acct">\n{rows}\n        </dl>\n        {go}\n      </figcaption>')


def plate(k, sid, en, zh):
    f = k.facts(sid)
    return f"""<section class="v3-plate">
    <figure class="v3-fig" style="--ar: {f['w'] / f['h']:.4f}">
      <a class="v3-photo" {k.opens(sid, en, zh)}>{k.img(sid, "(max-width: 40rem) 92vw, 62vw")}</a>
      {account(k, sid, en, zh)}
    </figure>
  </section>"""


def build(k):
    en, zh = {}, {}
    e = k.e
    for key, pair in LABELS.items():
        k.words(en, zh, key, pair)
    k.words(en, zh, "v3H1", {"en": "tuan photography 陳亮元: landscape photographs, and how each one was made",
                             "zh": "tuan photography 陳亮元：風景攝影，以及每一張是怎麼拍的"})
    k.words(en, zh, "v3Who", {"en": "Thomas Chen", "zh": "陳亮元"})
    k.words(en, zh, "v3WhoLine", {"en": "Landscape photographs, nature and cities", "zh": "旅途中的風景，自然與城市"})

    # the opening photograph's own caption: the first thing on the leaf, right under the photograph
    opening = f"""<section class="v3-plate v3-plate--first">
    <div class="v3-fig v3-fig--words">
      {account(k, COVER, en, zh).replace("<figcaption", "<div", 1).replace("</figcaption>", "</div>")}
    </div>
  </section>"""

    tabs = []
    for i, (nid, key, label, href) in enumerate(k.NAV):
        k.words(en, zh, f"v3d_{nid}", TABS[nid])
        tabs.append(f'          <div class="v3-line" style="--i: {i + 1}"><dt class="caps"><a href="../{href}" data-i18n="{key}">{e(label)}</a></dt>'
                    f'<dd data-i18n="v3d_{nid}">{e(TABS[nid]["en"])}</dd></div>')
    way = f"""<section class="v3-plate v3-plate--last" aria-labelledby="v3-who">
    <div class="v3-fig v3-fig--words">
      <div class="v3-cap">
        <b class="v3-name" id="v3-who" data-i18n="v3Who">Thomas Chen</b>
        <p class="v3-line v3-say" style="--i: 0" data-i18n="v3WhoLine">{e(en['v3WhoLine'])}</p>
        <dl class="v3-acct v3-acct--ways">
{chr(10).join(tabs)}
        </dl>
      </div>
    </div>
  </section>"""

    plates = "\n\n  ".join(plate(k, sid, en, zh) for sid in PLATES)
    body = f"""{k.cover(COVER, en, zh)}

<div class="leaf v3">
  <h1 class="sr" data-i18n="v3H1">{e(en['v3H1'])}</h1>

  {opening}

  {plates}

  {way}
</div>"""
    return body, en, zh
