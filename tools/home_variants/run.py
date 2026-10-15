#!/usr/bin/env python3
"""Experiment home-variations: write every variation, and the index that lists them.

    python3 tools/home_variants/run.py          all of them
    python3 tools/home_variants/run.py 3 7      only variations 3 and 7 (and the index)
"""
import importlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import kit  # noqa: E402

nums = sorted(int(p.stem[1:]) for p in HERE.glob("v[0-9][0-9].py"))
want = [int(a) for a in sys.argv[1:]] or nums
metas = {}
for n in nums:
    mod = importlib.import_module(f"v{n:02d}")
    metas[n] = mod.META
    if n in want:
        body, en, zh = mod.build(kit)
        kit.write(n, body, en, zh, js=(kit.OUT / "js" / "home-variants" / f"v{n:02d}.js").exists())

# the index: one row per variation, its name and the idea in one line, both languages
en, zh = {"ixTitle": "Home, ten ways", "ixSub": "Each one is a whole home page. Same paper, same photographs, a different way of showing that every photograph has a story."}, \
         {"ixTitle": "首頁的十種做法", "ixSub": "每一版都是完整的首頁。同樣的紙、同樣的照片，用不同的方式讓人看到每張照片背後都有故事。"}
rows = []
for n, m in metas.items():
    en[f"ixN{n}"], zh[f"ixN{n}"] = m["name"]["en"], m["name"]["zh"]
    en[f"ixI{n}"], zh[f"ixI{n}"] = m["idea"]["en"], m["idea"]["zh"]
    rows.append(f'      <li><a href="v{n:02d}.html"><span class="num">{n:02d}</span>'
                f'<b data-i18n="ixN{n}">{kit.e(m["name"]["en"])}</b><span data-i18n="ixI{n}">{kit.e(m["idea"]["en"])}</span></a></li>')
body = f"""<div class="wrap">
  <header class="page-top">
    <h1 data-i18n="ixTitle">Home, ten ways</h1>
    <p data-i18n="ixSub">{kit.e(en['ixSub'])}</p>
  </header>
  <section class="part">
    <ol class="vx">
{chr(10).join(rows)}
    </ol>
  </section>
</div>"""
kit.b.write("home-variants/index.html", f"Home, ten ways - {kit.b.SITE}", f"首頁的十種做法 - {kit.b.SITE}",
            "Home page variations, experiment home-variations.", None, body, en, zh)
f = kit.OUT / "home-variants" / "index.html"
f.write_text(f.read_text(encoding="utf-8").replace(
    "</head>", f'  <link rel="stylesheet" href="../css/home-variants/index.css?v={kit.b.STAMP}">\n</head>', 1), encoding="utf-8")
print("variations:", ", ".join(f"v{n:02d}" for n in want))
