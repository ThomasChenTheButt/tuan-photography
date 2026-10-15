"""Variation 08, "Margin notes / 頁邊筆記".

A field notebook. A wide main column holds the photographs, large; a narrow margin on the right
holds the notes for each one, level with it, in small type: the place in the serif, where, the
month, the trip, the camera's settings, the camera, the lens, and the way to how it was made and
to the guide or the place. Nothing joins a note to its photograph but alignment and one short
hairline. Between the photographs the margin carries nothing. The last note in the margin is the
way into the four tabs, beside the last photograph. On a phone each photograph's notes sit
directly under it, indented.

The moment: each note sticks beside its photograph while the photograph passes
(position: sticky inside its own row), so the notes read as one running column. No script.
"""

META = {
    "name": {"en": "Margin notes", "zh": "頁邊筆記"},
    "idea": {"en": "A field notebook: the photographs large in the main column, and beside each one, in the margin, its notes, staying level with it while it passes.",
             "zh": "像一本野外筆記：照片大大放在主欄，每張旁邊的頁邊寫著它的筆記，照片經過時筆記一路跟在旁邊。"},
}

# seven, in the order they are met; the last is tall, so the margin has room for the way in
ROWS = ["matterhorn-lake", "sapa-terraces", "kinkaku", "gothic", "edge-night", "peak-night", "tekapo-stars"]

TRIP_HREF = "../journey/wc-sketch/trip/?trip="

TABS = {
    "gallery": {"en": "Every photograph", "zh": "每一張照片"},
    "journey": {"en": "Each trip, along its route", "zh": "每一趟旅程，沿著路線"},
    "guides": {"en": "What to do there, place by place", "zh": "到了那裡做什麼，一地一地寫"},
    "about": {"en": "The photographer, and how to reach him", "zh": "攝影師本人，以及怎麼聯絡他"},
}


def notes(k, sid, en, zh):
    """The notes for one photograph, as they stand in the margin."""
    f = k.facts(sid)
    e = k.e
    en[f"sw_{sid}"], zh[f"sw_{sid}"] = f["where"]["en"], f["where"]["zh"]
    first = [f'<span data-i18n="sw_{sid}">{e(f["where"]["en"])}</span>']
    if f["month"]:
        k.words(en, zh, f"v8m_{sid}", f["month"])
        first.append(f'<span class="num" data-i18n="v8m_{sid}">{e(f["month"]["en"])}</span>')
    groups = ['<p class="v8-lines">' + "".join(first) + "</p>"]
    if f["trip"]:
        k.words(en, zh, f"v8t_{sid}", {"en": f"The {f['trip']['label']['en']} trip", "zh": f"{f['trip']['label']['zh']}的旅程"})
        groups.append(f'<p><a href="{TRIP_HREF}{f["trip"]["id"]}" data-i18n="v8t_{sid}">{e(en[f"v8t_{sid}"])}</a></p>')
    kit_lines = []
    if f["camera"]:
        kit_lines.append('<span class="num v8-set">' + "".join(f"<span>{e(p)}</span>" for p in f["camera"]) + "</span>")
    if f["body"]:
        kit_lines.append(f"<span>{e(f['body'])}</span>")
    if f["lens"]:
        kit_lines.append(f"<span>{e(f['lens'])}</span>")
    if kit_lines:
        groups.append('<p class="v8-lines v8-kit">' + "".join(kit_lines) + "</p>")
    if f["guide"]:
        k.words(en, zh, f"v8g_{sid}", {"en": f"The {f['guide']['title']['en']} guide", "zh": f"{f['guide']['title']['zh']}攻略"})
        place = f'<a href="../{f["guide"]["href"]}" data-i18n="v8g_{sid}">{e(en[f"v8g_{sid}"])}</a>'
    else:
        c = k.COUNTRIES[k.SLIDES[sid]["country"]]
        k.words(en, zh, f"v8c_{sid}", {"en": f"{c['en']}, in Guides", "zh": f"攻略：{c['zh']}"})
        place = f'<a href="../{f["country_href"]}" data-i18n="v8c_{sid}">{e(en[f"v8c_{sid}"])}</a>'
    groups.append(f'<p class="v8-lines v8-go"><a href="../gallery.html#s-{sid}" data-slide="{sid}" data-i18n="v8Made">How it was made</a>{place}</p>')
    body = "\n          ".join(groups)
    return (f'<div class="v8-note">\n          <b class="v8-place" data-i18n="sp_{sid}">{e(f["place"]["en"])}</b>\n'
            f"          {body}\n        </div>")


def row(k, sid, en, zh, n):
    f = k.facts(sid)
    shape = "tall" if f["w"] < f["h"] else "wide"
    return f"""<figure class="v8-row v8-row--{shape}" style="--ar: {f['w'] / f['h']:.4f}">
      <a class="v8-photo" {k.opens(sid, en, zh)}>{k.img(sid, "(max-width: 52rem) 92vw, 64vw", first=n == 0, soon=n == 1)}</a>
      <figcaption class="v8-margin">
        {notes(k, sid, en, zh)}
      </figcaption>
    </figure>"""


def build(k):
    en, zh = {}, {}
    e = k.e
    k.words(en, zh, "v8H1", {"en": "tuan photography 陳亮元: landscape photographs, and how each one was made",
                             "zh": "tuan photography 陳亮元：風景攝影，以及每一張是怎麼拍的"})
    k.words(en, zh, "v8Made", {"en": "How it was made", "zh": "這張怎麼拍"})
    k.words(en, zh, "v8Way", {"en": "The way in", "zh": "從這裡進去"})

    rows = [row(k, sid, en, zh, n) for n, sid in enumerate(ROWS[:-1])]

    tabs = []
    for nid, key, label, href in k.NAV:
        k.words(en, zh, f"v8d_{nid}", TABS[nid])
        tabs.append(f'          <li><a class="v8-place" href="../{href}" data-i18n="{key}">{e(label)}</a>'
                    f'<span data-i18n="v8d_{nid}">{e(TABS[nid]["en"])}</span></li>')
    last = ROWS[-1]
    end = f"""<div class="v8-end">
    {row(k, last, en, zh, len(ROWS) - 1)}
      <nav class="v8-ways" aria-label="{e(en['v8Way'])}" data-i18n-aria="v8Way">
        <ul>
{chr(10).join(tabs)}
        </ul>
      </nav>
  </div>"""

    body = f"""<div class="wrap v8">
  <h1 class="sr" data-i18n="v8H1">{e(en['v8H1'])}</h1>

  {(chr(10) + chr(10) + '  ').join(rows)}

  {end}
</div>"""
    return body, en, zh
