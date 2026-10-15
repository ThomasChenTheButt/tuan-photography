"""Variation 10, "Same place, twice": the home page told by pairs.

Five places he photographed twice, each pair side by side at their own shapes (one above the
other on a phone), one photograph larger than the other, the larger side alternating from pair
to pair. Under each photograph its month and camera line; under the pair the place's name and
the way on (its country under Guides, or the guide when one exists). Every fact from k.facts.
The moment: the second photograph of each pair arrives a beat after the first (v10.js).
"""

META = {
    "name": {"en": "Same place, twice", "zh": "同一個地方，兩次"},
    "idea": {"en": "Five places photographed twice, side by side, with the month and settings under each.",
             "zh": "五個拍過兩次的地方，兩張並排，每張底下是月份和設定。"},
}

OPEN = "roys-peak"   # not one of the pairs
# (first, second, the photograph whose name titles the pair); every one his, every one with camera data
PAIRS = [("peak-day", "peak-night", "peak-day"),
         ("matterhorn-lake", "matterhorn-flag", "matterhorn-flag"),
         ("hoi-an-gate", "hoi-an-night", "hoi-an-gate"),
         ("fuji-lake", "fuji-shinkansen", "fuji-shinkansen"),
         ("calanque", "calanque-tall", "calanque")]
BIG = 1.6   # how much taller the larger photograph of a pair stands than the smaller


def build(k):
    en, zh = {}, {}
    e = k.e
    W = lambda key, pair: e(k.words(en, zh, key, pair))   # noqa: E731

    def shot(sid, big, late):
        f = k.facts(sid)
        cls = "v10-shot" + (" v10-shot--big" if big else "") + (" v10-shot--late" if late else "")
        line = ""
        if f["month"]:
            line += f'<span class="num" data-i18n="v10m_{sid}">{W("v10m_" + sid, f["month"])}</span>'
        if f["camera"]:
            line += '<span class="data">' + "".join(f"<span>{e(p)}</span>" for p in f["camera"]) + "</span>"
        cap = f"<figcaption>{line}</figcaption>" if line else ""
        return (f'<figure class="{cls}" style="--ar: {f["w"] / f["h"]:.4f}">'
                f'<a {k.opens(sid, en, zh)}>{k.img(sid, "(max-width: 40rem) 92vw, 50vw")}</a>{cap}</figure>')

    pairs = []
    for n, (a, b, named) in enumerate(PAIRS):
        flip = n % 2 == 1   # the larger photograph alternates: first, then second, then first
        ars = [k.SLIDES[s]["w"] / k.SLIDES[s]["h"] for s in (a, b)]
        g = [1, BIG] if flip else [BIG, 1]
        shape = (ars[0] * g[0] + ars[1] * g[1]) / BIG   # the pair's width over the larger one's height
        f = k.facts(named)
        c = k.COUNTRIES[k.SLIDES[named]["country"]]
        way = (f'<a class="v10-go caps" href="../{f["guide"]["href"]}" data-i18n="v10g{n}">'
               f'{W(f"v10g{n}", {"en": "Read the guide", "zh": "閱讀攻略"})}</a>') if f["guide"] else \
              (f'<a class="v10-go caps" href="../{f["country_href"]}" data-i18n="v10g{n}">'
               f'{W(f"v10g{n}", {"en": c["en"] + ", in Guides", "zh": "攻略裡的" + c["zh"]})}</a>')
        pairs.append(f"""<section class="wrap v10-pair{' v10-pair--flip' if flip else ''}" aria-labelledby="v10-h{n}">
  <div class="v10-two" data-v10-pair style="--ar: {shape:.4f}">
    {shot(a, not flip, False)}
    {shot(b, flip, True)}
  </div>
  <div class="v10-name">
    <h2 id="v10-h{n}" data-i18n="v10t{n}">{W(f"v10t{n}", f["place"])}</h2>
    <p>{way}</p>
  </div>
</section>""")

    ways = "\n".join(f'      <li><a href="../{href}" data-i18n="{key}">{e(label)}</a></li>' for _id, key, label, href in k.NAV)

    body = f"""{k.cover(OPEN, en, zh)}

<div class="leaf">
<section class="wrap v10-intro">
  <h1 data-i18n="v10Title">{W("v10Title", {"en": "Same place, twice", "zh": "同一個地方，兩次"})}</h1>
  <p data-i18n="v10Say">{W("v10Say", {"en": "Five places, each photographed twice. Open either one to see how it was made.", "zh": "五個地方，各拍了兩次。點開任何一張，看它是怎麼拍的。"})}</p>
</section>

{chr(10).join(pairs)}

<nav class="wrap v10-ways" aria-label="{W("v10Ways", {"en": "The way in", "zh": "從這裡進去"})}" data-i18n-aria="v10Ways">
  <ul>
{ways}
  </ul>
</nav>
</div>"""
    return body, en, zh
