/* Reel. His own footage. Four Barcelona clips cut hard one after another, the cuts
   quickening, then the still. From his list: his highlight clips, the jump-cut openings on
   Awwwards, Shainblum's time-lapse site. */
window.Openings.reel = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-re video, .op-re img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
    .op-re .on { opacity: 1; }
  `);
  stage.classList.add('op-re');
  const clips = [1, 2, 3, 4].map((n) => {
    const v = document.createElement('video');
    v.src = o.root + 'images/clips/barcelona-' + n + '.mp4';
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    stage.appendChild(v); return v;
  });
  const still = new Image(); still.src = o.src(o.lead); still.alt = ''; stage.appendChild(still);
  const cuts = [[0, 1500], [1, 1150], [2, 900], [3, 1300]];   // clip, how long it holds
  const canPlay = (v) => new Promise((r) => { if (v.readyState >= 3) r(); else { v.oncanplaythrough = r; v.onerror = r; } });
  Promise.race([Promise.all(clips.map(canPlay).concat([o.load(still.src)])), new Promise((r) => setTimeout(r, 9000))]).then(() => {
    let i = 0;
    const show = () => {
      if (i > 0) { clips[cuts[i - 1][0]].classList.remove('on'); clips[cuts[i - 1][0]].pause(); }
      if (i >= cuts.length) { still.classList.add('on'); o.done(stage, 700); return; }
      const v = clips[cuts[i][0]];
      v.currentTime = 0.4; v.classList.add('on'); v.play().catch(() => {});
      setTimeout(show, cuts[i][1]); i++;
    };
    show();
  });
};
