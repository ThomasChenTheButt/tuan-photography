"""Variation 06, Exposure: the making as headline.

After the opening photograph, six photographs, each paired with its own exposure set very
large in the serif (the shutter speed, then aperture, focal length and ISO smaller), while the
place name stays small. The numbers sit beside, beneath or across the gutter from their
photograph, never on it, and each set of numbers is itself the link to how it was made.
Only photographs whose files carry camera data. The way into the four tabs closes the page
in the same voice. Every fact comes from k.facts(); nothing is invented.
"""

META = {
    "name": {"en": "Exposure", "zh": "曝光"},
    "idea": {"en": "Each photograph beside its own exposure, set large: the making is the headline, the place name stays small.",
             "zh": "每張照片旁邊大大寫著它的曝光數字：怎麼拍的是標題，地名只輕輕帶過。"},
}

COVER = "matterhorn-flag"
# (photograph, how its numbers sit against it); shapes alternate wide and tall for pace
PAIRS = [
    ("fuji-shinkansen", "under-end"),     # wide, numbers beneath, set to the right edge
    ("tekapo-stars", "beside-start"),     # tall, numbers beside it on the left, at its foot
    ("bunkers", "under-across"),          # wide, numbers beneath, reaching back across the gutter
    ("the-chair", "beside-end"),          # tall, numbers beside it on the right, at its head
    ("tokyo-night", "beside-end-foot"),   # wide, numbers beside it on the right, at its foot
    ("train-street", "under-centre"),     # tall and small, numbers centred beneath
]


def build(k):
    en, zh = {}, {}
    k.words(en, zh, "x6Head", {"en": "Travel like a photographer", "zh": "像攝影師一樣旅行"})
    k.words(en, zh, "x6How", {"en": "How it was made", "zh": "這張怎麼拍"})
    k.words(en, zh, "x6Ways", {"en": "The way in", "zh": "從這裡進去"})

    pairs = []
    for sid, place in PAIRS:
        f = k.facts(sid)
        if not f["camera"]:   # only photographs whose files carry camera data
            continue
        focal, aperture, shutter, iso = f["camera"]
        k.words(en, zh, f"sp_{sid}", f["place"])
        k.words(en, zh, f"sw_{sid}", f["where"])
        ar = f'{f["w"] / f["h"]:.4f}'
        shape = "tall" if f["h"] > f["w"] else "wide"
        sizes = "(max-width: 52rem) 92vw, 60vw" if shape == "wide" else "(max-width: 52rem) 70vw, 34vw"
        photo = (f'<a class="x6-photo" {k.opens(sid, en, zh)}>'
                 f'{k.img(sid, sizes)}</a>')
        nums = (f'<a class="x6-nums" href="../gallery.html#s-{sid}" data-slide="{sid}" aria-describedby="x6-n-{sid}">'
                f'<span class="x6-big num">{k.e(shutter)}</span>'
                f'<span class="x6-small num"><span>{k.e(aperture)}</span><span>{k.e(focal)}</span><span>{k.e(iso)}</span></span>'
                f'<span class="x6-how caps" data-i18n="x6How">How it was made</span></a>')
        name = (f'<p class="x6-name" id="x6-n-{sid}"><b data-i18n="sp_{sid}">{k.e(f["place"]["en"])}</b>'
                f'<span data-i18n="sw_{sid}">{k.e(f["where"]["en"])}</span></p>')
        pairs.append(f"""    <article class="x6-pair x6-pair--{place} x6-pair--{shape}" style="--ar: {ar}">
      {photo}
      <div class="x6-words">
        {nums}
        {name}
      </div>
    </article>""")

    # the way in: the four tabs in the same voice, each with what it holds, counted by the build
    held = {
        "gallery": {"en": f"{len(k.SLIDES)} photographs", "zh": f"{len(k.SLIDES)} 張照片"},
        "journey": {"en": f"{len(k.DATA['journeys'])} trips", "zh": f"{len(k.DATA['journeys'])} 趟旅程"},
        "guides": {"en": f"{len(k.COUNTRIES)} countries", "zh": f"{len(k.COUNTRIES)} 個國家"},
        "about": {"en": "Thomas Chen", "zh": "陳亮元"},
    }
    ways = []
    for tid, key, label, href in k.NAV:
        k.words(en, zh, f"x6h_{tid}", held[tid])
        ways.append(f'<li><a href="../{href}"><b data-i18n="{key}">{label}</b>'
                    f'<span class="num" data-i18n="x6h_{tid}">{k.e(held[tid]["en"])}</span></a></li>')

    body = f"""{k.cover(COVER, en, zh)}
<div class="leaf">
  <section class="x6 wrap" aria-labelledby="x6-head">
    <h1 class="sr" id="x6-head" data-i18n="x6Head">Travel like a photographer</h1>
{chr(10).join(pairs)}
  </section>
  <nav class="x6-ways wrap" aria-label="The way in" data-i18n-aria="x6Ways">
    <ul>
      {(chr(10) + "      ").join(ways)}
    </ul>
  </nav>
</div>"""
    return body, en, zh
