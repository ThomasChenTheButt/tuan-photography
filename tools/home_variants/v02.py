"""Variation 02, "Two roads": every photograph is a crossroads between time and place.

The opening is Aoraki with nothing on it. Under it, on the leaf, one line, then five
photographs, each large, in the order they were taken. Beneath each, its name and where and
when, then a 1px fork: one road back to the trip it was made on (Journey), one on to the
place (the guide when one exists, else the country page under Guides). At the end the roads
gather into the four tabs, Journey and Guides where the two roads land, Gallery and About
beside them. Every fact is from kit.facts(); every photograph here has a known trip.
The moment: each fork draws itself under its photograph as it comes into view (v02.js);
under "reduce motion" it is simply drawn.
"""

META = {
    "name": {"en": "Two roads", "zh": "兩條路"},
    "idea": {"en": "Under every photograph the road forks: back to the trip it was made on, and on to the place.",
             "zh": "每張照片底下都分出兩條路：一條回到拍它的那趟旅程，一條通往那個地方。"},
}

LEAD = "aoraki"
# five trips, in the order they were taken; every one has a known trip and camera data
ROADS = ["neuschwanstein", "fuji-lake", "mong-kok", "leshan-buddha", "bunkers"]
JOBS = {
    "gallery": {"en": "Every photograph, nothing else", "zh": "所有照片，沒有別的"},
    "journey": {"en": "Every trip, along its route", "zh": "每一趟旅程，沿著路線"},
    "guides": {"en": "What to do when you get there", "zh": "到了那裡，該做什麼"},
    "about": {"en": "Who took them", "zh": "拍下它們的人"},
}


def fork(extra=""):
    """A thin line splitting in two: a stem, a bar drawn out from the middle, two legs."""
    return (f'<div class="fork{extra}" aria-hidden="true"><i class="fork__stem"></i>'
            '<i class="fork__a"></i><i class="fork__b"></i><i class="fork__c"></i><i class="fork__d"></i></div>')


def build(k):
    en, zh = {}, {}
    e = k.e
    W = lambda key, pair: e(k.words(en, zh, key, pair))   # noqa: E731

    W("v02Trip", {"en": "The trip", "zh": "這趟旅程"})
    W("v02Place", {"en": "The place", "zh": "這個地方"})
    W("v02Guide", {"en": "The guide", "zh": "攻略"})

    roads = []
    for n, sid in enumerate(ROADS):
        f = k.facts(sid)
        s = k.SLIDES[sid]
        ar = f"{f['w'] / f['h']:.4f}"
        line = {"en": f["where"]["en"] + (", " + f["month"]["en"] if f["month"] else ""),
                "zh": f["where"]["zh"] + ("，" + f["month"]["zh"] if f["month"] else "")}
        trip = f["trip"]
        if f["guide"]:
            g = f["guide"]
            place_href, place_name, place_word = "../" + g["href"], g["title"], "v02Guide"
        else:
            c = k.COUNTRIES[s["country"]]
            place_href, place_name, place_word = "../" + f["country_href"], {"en": c["en"], "zh": c["zh"]}, "v02Place"
        sizes = "(max-width: 40rem) 92vw, 68rem" if f["w"] >= f["h"] else "(max-width: 40rem) 92vw, 40rem"
        roads.append(f"""  <article class="road" aria-labelledby="v02-n{n}">
    <figure class="road__photo" style="--ar: {ar}"><a {k.opens(sid, en, zh)}>{k.img(sid, sizes, soon=n == 0)}</a></figure>
    <h2 class="road__name" id="v02-n{n}" data-i18n="v02N{n}">{W(f"v02N{n}", f["place"])}</h2>
    <p class="road__line num" data-i18n="v02L{n}">{W(f"v02L{n}", line)}</p>
    {fork()}
    <div class="road__ends">
      <a class="road__go" href="../journey/"><span class="road__to num" data-i18n="v02T{n}">{W(f"v02T{n}", trip["label"])}</span><span class="caps" data-i18n="v02Trip">The trip</span></a>
      <a class="road__go" href="{place_href}"><span class="road__to" data-i18n="v02P{n}">{W(f"v02P{n}", place_name)}</span><span class="caps" data-i18n="{place_word}">{e(en[place_word])}</span></a>
    </div>
  </article>""")

    # the four tabs, Journey and Guides where the two roads land
    tabs = []
    for nid, key, label, href in k.NAV:
        on = " ends__go--road" if nid in ("journey", "guides") else ""
        tabs.append(f'      <li class="ends__{nid}"><a class="ends__go{on}" href="../{href}"><span class="ends__name" data-i18n="{key}">{e(label)}</span>'
                    f'<span class="ends__job" data-i18n="v02J{nid}">{W("v02J" + nid, JOBS[nid])}</span></a></li>')

    body = f"""{k.cover(LEAD, en, zh)}

<div class="leaf">
<section class="wrap intro v02-intro">
  <h1 data-i18n="v02H">{W("v02H", {"en": "Every photograph has two roads.", "zh": "每張照片都有兩條路。"})}</h1>
  <p data-i18n="v02Say">{W("v02Say", {"en": "One leads back to the trip it was made on, the other on to the place, for your own visit. Open any photograph to see how it was made.", "zh": "一條回到拍下它的那趟旅程，一條通往那個地方，留給你自己去的時候。點開任何一張，看它是怎麼拍的。"})}</p>
</section>

<div class="wrap v02-roads">
{chr(10).join(roads)}
</div>

<div class="band">
  <section class="wrap part ends" aria-labelledby="v02-ends">
    <h2 id="v02-ends" class="ends__head" data-i18n="v02End">{W("v02End", {"en": "Where the roads go", "zh": "路通往哪裡"})}</h2>
    {fork(" fork--ends")}
    <ul class="ends__tabs">
{chr(10).join(tabs)}
    </ul>
  </section>
</div>
</div>"""
    return body, en, zh
