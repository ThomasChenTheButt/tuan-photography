"""Variation 05, "One photograph, all the way": the home page proves the promise with one frame.

The opening is Aoraki with nothing on it. Under it, on the leaf, that one photograph's whole
account set as a printed specification (where, when, how, and where to go next), every value
from kit.facts("aoraki"). Then one line saying every photograph here has the same, six others
small at their own shapes, each opening its own account, and the four tabs.
The moment: the account arrives in order, where, when, how, as it comes into view (v05.js).
"""

META = {
    "name": {"en": "One photograph, all the way", "zh": "一張照片，說到底"},
    "idea": {"en": "The whole page is one photograph's account, set large: where, when, how, and where it leads.",
             "zh": "整頁只講一張照片：在哪裡、什麼時候、怎麼拍、接下來去哪，字放大來排。"},
}

LEAD = "aoraki"
# six others, six countries, at their own shapes (wide, tall, in between); all carry camera data
MORE = ["matterhorn-lake", "sheung-wan-tram", "kinkaku", "gordes", "sapa-terraces", "tower-bridge"]
FIG_LABELS = [("focal", {"en": "Focal length", "zh": "焦距"}), ("aperture", {"en": "Aperture", "zh": "光圈"}),
              ("shutter", {"en": "Shutter", "zh": "快門"}), ("iso", {"en": "ISO", "zh": "ISO"})]


def build(k):
    en, zh = {}, {}
    e = k.e
    f = k.facts(LEAD)
    c = k.COUNTRIES[k.SLIDES[LEAD]["country"]]

    W = lambda key, pair: e(k.words(en, zh, key, pair))   # noqa: E731

    # the account's four rows, each with its label at the left (never above a heading)
    where = (f'<h1 id="v05-name" class="v05-big" data-i18n="v05Place">{W("v05Place", f["place"])}</h1>'
             f'<p class="v05-quiet" data-i18n="v05Where">{W("v05Where", f["where"])}</p>')

    when = ""
    if f["month"]:
        when = f'<p class="v05-mid num" data-i18n="v05Month">{W("v05Month", f["month"])}</p>'
        if f["trip"]:
            lab = f["trip"]["label"]
            when += (f'<p class="v05-quiet"><a href="../journey/" data-i18n="v05Trip">'
                     f'{W("v05Trip", {"en": "The trip of " + lab["en"] + ", in Journey", "zh": "旅程裡的 " + lab["zh"] + "那一趟"})}</a></p>')

    how = ""
    if f["body"]:
        how += f'<p class="v05-mid">{e(f["body"])}</p>'
    if f["lens"]:
        how += f'<p class="v05-quiet">{e(f["lens"])}</p>'
    if f["camera"]:
        cells = []
        for n, ((key, lab), val) in enumerate(zip(FIG_LABELS, f["camera"])):
            if key == "iso":
                val = val.replace("ISO ", "")
            cells.append(f'<div class="v05-fig" style="--i: {n}"><dt class="caps" data-i18n="v05L{key}">{W("v05L" + key, lab)}</dt>'
                         f'<dd class="num">{e(val)}</dd></div>')
        how += f'<dl class="v05-figs">{"".join(cells)}</dl>'

    sees = W("v05See", {"en": "See it whole", "zh": "看完整的照片"})
    k.words(en, zh, "v05Guide", {"en": c["en"] + ", in Guides", "zh": "攻略裡的" + c["zh"]})
    go = (f'<p class="v05-goes"><a class="v05-go caps" {k.opens(LEAD, en, zh)}><span data-i18n="v05See">{sees}</span></a>'
          f'<a class="v05-go caps" href="../{f["country_href"]}" data-i18n="v05Guide">{e(en["v05Guide"])}</a></p>')
    if f["guide"]:
        k.words(en, zh, "v05Read", {"en": "Read the guide", "zh": "閱讀攻略"})
        go = go.replace("</p>", f'<a class="v05-go caps" href="../{f["guide"]["href"]}" data-i18n="v05Read">Read the guide</a></p>')

    rows = [("where", {"en": "Where", "zh": "在哪裡"}, where),
            ("when", {"en": "When", "zh": "什麼時候"}, when),
            ("how", {"en": "How", "zh": "怎麼拍"}, how),
            ("next", {"en": "Next", "zh": "接著看"}, go)]
    acc = []
    for n, (key, lab, inner) in enumerate(rows):
        if not inner:
            continue
        acc.append(f'  <div class="v05-row v05-row--{key}" style="--i: {n}">\n'
                   f'    <p class="v05-label caps" data-i18n="v05R{key}">{W("v05R" + key, lab)}</p>\n'
                   f'    <div class="v05-val">{inner}</div>\n  </div>')

    # every photograph here has one: six others, small, at their own shapes
    more = "\n".join("    " + k.piece(sid, en, zh, "(max-width: 40rem) 46vw, 16vw", flex=True) for sid in MORE)

    ways = "\n".join(f'    <li><a href="../{href}" data-i18n="{key}">{e(label)}</a></li>' for _id, key, label, href in k.NAV)

    body = f"""{k.cover(LEAD, en, zh)}

<div class="leaf">
<section class="wrap v05-account" aria-labelledby="v05-name">
  <div class="v05-sheet" data-v05-sheet>
{chr(10).join(acc)}
  </div>
</section>

<section class="wrap part v05-more" aria-labelledby="v05-one">
  <h2 id="v05-one" class="v05-line" data-i18n="v05One">{W("v05One", {"en": "Every photograph here has one.", "zh": "這裡的每一張照片，都有這樣一段。"})}</h2>
  <p class="v05-sub" data-i18n="v05Open">{W("v05Open", {"en": "Open any of them to read its own.", "zh": "點開任何一張，讀它自己的那一段。"})}</p>
  <div class="v05-row-of">
{more}
  </div>
</section>

<div class="band">
  <nav class="wrap v05-ways" aria-label="{W("v05Ways", {"en": "The way in", "zh": "從這裡進去"})}" data-i18n-aria="v05Ways">
    <ul>
{ways}
    </ul>
  </nav>
</div>
</div>"""
    return body, en, zh
