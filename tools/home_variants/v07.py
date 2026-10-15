"""Variation 07, "One at a time": one photograph owns the screen, the next is one flick away.

The opening is Aoraki with nothing on it. Under it, on the leaf, one line, then a section of
its own that scrolls in whole sheets (CSS scroll-snap, mandatory, on that section only, so the
top bar and the footer work as everywhere else). Each sheet is paper with one photograph
large on it, whole and with real margins; its name and one line of its account (where, the
month, the camera) set low beneath it; and at the sheet's right edge a quiet column of three
words: How it was made (the viewer), The trip (Journey), The place (the guide or the country).
On a phone the words sit in a row under the account. After the last sheet, the four tabs.
Eight photographs, eight trips' worth, in the order they were taken; every fact from kit.facts().
The moment: the snap itself, crisp, with the next photograph already loaded (v07.js), and
Page Down, the arrows, Home and End move a keyboard user one sheet at a time.
"""

META = {
    "name": {"en": "One at a time", "zh": "一次一張"},
    "idea": {"en": "One photograph owns the screen on its own sheet of paper; the next is one flick away.",
             "zh": "一次只有一張照片，獨佔一整頁紙；下一張，滑一下就到。"},
}

LEAD = "aoraki"
# in the order they were taken; every one has camera data and a known trip
SHEETS = ["matterhorn-flag", "kifune", "temple-street", "roys-peak", "supertrees",
          "hongya-cave", "casa-batllo", "hoi-an-night"]
JOBS = {
    "gallery": {"en": "Every photograph, nothing else", "zh": "所有照片，沒有別的"},
    "journey": {"en": "Every trip, along its route", "zh": "每一趟旅程，沿著路線"},
    "guides": {"en": "What to do when you get there", "zh": "到了那裡，該做什麼"},
    "about": {"en": "Who took them", "zh": "拍下它們的人"},
}


def build(k):
    en, zh = {}, {}
    e = k.e
    W = lambda key, pair: e(k.words(en, zh, key, pair))   # noqa: E731

    W("v07Made", {"en": "How it was made", "zh": "怎麼拍的"})
    W("v07Trip", {"en": "The trip", "zh": "這趟旅程"})
    W("v07Place", {"en": "The place", "zh": "這個地方"})
    W("v07Guide", {"en": "The guide", "zh": "攻略"})

    sheets = []
    for n, sid in enumerate(SHEETS):
        f = k.facts(sid)
        s = k.SLIDES[sid]
        ar = f"{f['w'] / f['h']:.4f}"
        sizes = "(max-width: 40rem) 92vw, 62vw" if f["w"] >= f["h"] else "(max-width: 40rem) 80vw, 36vw"
        line = f'<span data-i18n="v07W{n}">{W(f"v07W{n}", f["where"])}</span>'
        if f["month"]:
            line += f'<span data-i18n="v07M{n}">{W(f"v07M{n}", f["month"])}</span>'
        if f["camera"]:
            line += '<span class="sheet__cam">' + "".join(f"<span>{e(v)}</span>" for v in f["camera"]) + "</span>"
        words = [f'<li><a class="sheet__go" href="../gallery.html#s-{sid}" data-slide="{sid}">'
                 f'<span class="caps" data-i18n="v07Made">How it was made</span></a></li>']
        if f["trip"]:
            words.append(f'<li><a class="sheet__go" href="../journey/"><span class="caps" data-i18n="v07Trip">The trip</span>'
                         f'<span class="sheet__sub num" data-i18n="v07T{n}">{W(f"v07T{n}", f["trip"]["label"])}</span></a></li>')
        if f["guide"]:
            g = f["guide"]
            words.append(f'<li><a class="sheet__go" href="../{g["href"]}"><span class="caps" data-i18n="v07Guide">The guide</span>'
                         f'<span class="sheet__sub" data-i18n="v07P{n}">{W(f"v07P{n}", g["title"])}</span></a></li>')
        else:
            c = k.COUNTRIES[s["country"]]
            words.append(f'<li><a class="sheet__go" href="../{f["country_href"]}"><span class="caps" data-i18n="v07Place">The place</span>'
                         f'<span class="sheet__sub" data-i18n="v07P{n}">{W(f"v07P{n}", {"en": c["en"], "zh": c["zh"]})}</span></a></li>')
        sheets.append(f"""  <article class="sheet" aria-labelledby="v07-n{n}">
    <figure class="sheet__photo"><a {k.opens(sid, en, zh)} style="--ar: {ar}">{k.img(sid, sizes, soon=n < 2)}</a></figure>
    <div class="sheet__acc">
      <h2 class="sheet__name" id="v07-n{n}" data-i18n="v07N{n}">{W(f"v07N{n}", f["place"])}</h2>
      <p class="sheet__line num">{line}</p>
    </div>
    <ul class="sheet__words">
      {chr(10).join("      " + w if i else w for i, w in enumerate(words))}
    </ul>
  </article>""")

    tabs = []
    for nid, key, label, href in k.NAV:
        tabs.append(f'      <li><a class="v07-tab" href="../{href}"><span class="v07-tab__name" data-i18n="{key}">{e(label)}</span>'
                    f'<span class="v07-tab__job" data-i18n="v07J{nid}">{W("v07J" + nid, JOBS[nid])}</span></a></li>')

    W("v07Feed", {"en": "Eight photographs, one at a time", "zh": "八張照片，一次一張"})
    body = f"""{k.cover(LEAD, en, zh)}

<div class="leaf">
<section class="wrap intro v07-intro">
  <h1 data-i18n="v07H">{W("v07H", {"en": "One photograph at a time.", "zh": "一次一張。"})}</h1>
  <p data-i18n="v07Say">{W("v07Say", {"en": "Each one on a sheet of its own, with how it was made, the trip it came from, and the place it shows.", "zh": "每一張自成一頁：它是怎麼拍的、出自哪一趟旅程、拍的是哪裡。"})}</p>
</section>

<section class="feed" aria-label="{e(en['v07Feed'])}" data-i18n-aria="v07Feed">
{chr(10).join(sheets)}
</section>

<div class="band">
  <section class="wrap part v07-ends" aria-labelledby="v07-ends">
    <h2 id="v07-ends" data-i18n="v07End">{W("v07End", {"en": "Where to go from here", "zh": "從這裡出發"})}</h2>
    <ul class="v07-tabs">
{chr(10).join(tabs)}
    </ul>
  </section>
</div>
</div>"""
    return body, en, zh
