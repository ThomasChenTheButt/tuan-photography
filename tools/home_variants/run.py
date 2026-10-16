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

# the index: one row per variation, its name and the idea in one line, both languages, and under
# each one his own rank and notes (kept in this browser by js/home-variants/index.js)
en = {"ixTitle": "Home, ten ways",
      "ixSub": "Each one is a whole home page. Same paper, same photographs, a different way of showing that every photograph has a story.",
      "ixHow": "Open one, look, come back, then give it a rank and a note. Everything you write is kept in this browser.",
      "ixRank": "Rank", "ixNone": "None", "ixNote": "Notes", "ixNoteHint": "What you liked, what you would change",
      "ixSeen": "Seen", "ixSort": "Sort by my ranking", "ixUnsort": "Back to 1 to 10",
      "ixCopy": "Copy everything", "ixCopied": "Copied", "ixSaved": "Saved"}
zh = {"ixTitle": "首頁的十種做法",
      "ixSub": "每一版都是完整的首頁。同樣的紙、同樣的照片，用不同的方式讓人看到每張照片背後都有故事。",
      "ixHow": "點開一版看完，回到這裡，給它排名、寫筆記。你寫的東西都存在這個瀏覽器裡。",
      "ixRank": "排名", "ixNone": "未排", "ixNote": "筆記", "ixNoteHint": "喜歡什麼、想改什麼",
      "ixSeen": "看過", "ixSort": "依我的排名排序", "ixUnsort": "回到 1 到 10",
      "ixCopy": "全部複製", "ixCopied": "已複製", "ixSaved": "已存"}
rows = []
for n, m in metas.items():
    en[f"ixN{n}"], zh[f"ixN{n}"] = m["name"]["en"], m["name"]["zh"]
    en[f"ixI{n}"], zh[f"ixI{n}"] = m["idea"]["en"], m["idea"]["zh"]
    ranks = "".join(f'<option value="{r}">{r}</option>' for r in range(1, len(metas) + 1))
    rows.append(f"""      <li class="vx__row" data-n="{n}">
        <span class="num">{n:02d}</span>
        <a class="vx__name" href="v{n:02d}.html"><b data-i18n="ixN{n}">{kit.e(m["name"]["en"])}</b></a>
        <span class="vx__idea" data-i18n="ixI{n}">{kit.e(m["idea"]["en"])}</span>
        <span class="vx__seen caps" data-i18n="ixSeen" hidden>Seen</span>
        <div class="vx__mine">
          <label class="vx__rank"><span class="caps" data-i18n="ixRank">Rank</span>
            <select data-n="{n}"><option value="" data-i18n="ixNone">None</option>{ranks}</select></label>
          <label class="vx__note"><span class="caps" data-i18n="ixNote">Notes</span>
            <textarea rows="2" data-n="{n}"></textarea></label>
        </div>
      </li>""")
body = f"""<div class="wrap">
  <header class="page-top">
    <h1 data-i18n="ixTitle">Home, ten ways</h1>
    <p data-i18n="ixSub">{kit.e(en['ixSub'])}</p>
    <p class="vx__how" data-i18n="ixHow">{kit.e(en['ixHow'])}</p>
  </header>
  <section class="part">
    <div class="vx__tools">
      <button type="button" class="vx__word caps" id="vx-sort" aria-pressed="false" data-i18n="ixSort">Sort by my ranking</button>
      <button type="button" class="vx__word caps" id="vx-copy" data-i18n="ixCopy">Copy everything</button>
      <span class="vx__state caps" id="vx-state" aria-live="polite"></span>
    </div>
    <ol class="vx">
{chr(10).join(rows)}
    </ol>
  </section>
</div>"""
kit.b.write("home-variants/index.html", f"Home, ten ways - {kit.b.SITE}", f"首頁的十種做法 - {kit.b.SITE}",
            "Home page variations, experiment home-variations.", None, body, en, zh,
            scripts=("home-variants/index.js",))
f = kit.OUT / "home-variants" / "index.html"
f.write_text(f.read_text(encoding="utf-8").replace(
    "</head>", f'  <link rel="stylesheet" href="../css/home-variants/index.css?v={kit.b.STAMP}">\n</head>', 1), encoding="utf-8")
print("variations:", ", ".join(f"v{n:02d}" for n in want))
