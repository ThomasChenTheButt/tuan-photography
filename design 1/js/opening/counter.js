/* Counter. The award-site classic: a number counts to one hundred in the corner of the
   paper, a hairline grows along the foot, and at a hundred the photograph wipes up from
   below. The numbers sit on paper and are gone before the photograph is there. */
window.Openings.counter = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-cn .num { position: absolute; left: var(--edge); bottom: calc(var(--edge) * 0.9); font-family: var(--serif); font-weight: 400; font-size: clamp(5rem, 14vw, 13rem); line-height: 0.9; letter-spacing: -0.02em; color: var(--text); font-variant-numeric: tabular-nums; }
    .op-cn .num small { display: block; margin-top: 0.6rem; font-family: var(--sans); font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-2); }
    html[lang|="zh"] .op-cn .num small { letter-spacing: 0.14em; }
    .op-cn .rule { position: absolute; left: 0; bottom: 0; height: 1px; width: 0; background: var(--text); }
    .op-cn .pic { position: absolute; inset: 0; clip-path: inset(100% 0 0 0); }
    .op-cn .pic img { width: 100%; height: 100%; object-fit: cover; display: block; transform: scale(1.1); }
  `);
  stage.classList.add('op-cn');
  const zh = /^zh/.test(document.documentElement.lang);
  const num = document.createElement('div'); num.className = 'num';
  const n = document.createElement('span'); n.textContent = '0';
  const small = document.createElement('small'); small.textContent = zh ? '陳亮元 · 風景攝影' : 'tuan photography · landscapes';
  num.append(n, small);
  const rule = document.createElement('div'); rule.className = 'rule';
  const pic = document.createElement('div'); pic.className = 'pic';
  const img = new Image(); img.src = o.src(o.lead); img.alt = ''; pic.appendChild(img);
  stage.append(num, rule, pic);
  const T_COUNT = 2600, T_WIPE = 1100;
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  o.load(img.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T_COUNT);
      const e = 1 - Math.pow(1 - u, 2.2);                     // quick, then the last numbers slow
      n.textContent = String(Math.round(e * 100));
      rule.style.width = (e * 100).toFixed(2) + '%';
      if (u < 1) { requestAnimationFrame(frame); return; }
      pic.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: T_WIPE, easing: ease, fill: 'both' });
      img.animate([{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: T_WIPE + 500, easing: ease, fill: 'both' });
      num.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 300, fill: 'both' });
      o.done(stage, T_WIPE + 500);
    }
    setTimeout(() => requestAnimationFrame(frame), 250);
  });
};
