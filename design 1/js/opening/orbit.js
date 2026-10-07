/* Orbit. The earth from space. It turns from Taiwan, home, toward New Zealand and falls,
   the land growing until it is the photograph. From his list: Google Earth's descent,
   Mapbox's fly-to. Drawn offline from the Natural Earth shapes design 2 already carries. */
window.Openings.orbit = function (o) {
  'use strict';
  const stage = o.stage();
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0';
  stage.append(cv, img);
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const load = (src) => new Promise((r) => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = r; document.head.appendChild(s); });
  const home = [121.5, 25.0], there = [o.lead.ll[1], o.lead.ll[0]];   // Taipei, Aoraki (lng, lat)
  Promise.all([load(o.root + 'vendor/d3.min.js').then(() => load(o.root + 'vendor/topojson-client.min.js')),
               fetch(o.root + 'vendor/countries-110m.json').then((r) => r.json()), o.load(img.src)]).then(([, world]) => {
    const d3 = window.d3, land = window.topojson.feature(world, world.objects.land || world.objects.countries);
    const proj = d3.geoOrthographic().translate([W / 2, H / 2]).clipAngle(90);
    const path = d3.geoPath(proj, ctx);
    const graticule = d3.geoGraticule10();
    const route = { type: 'LineString', coordinates: [home, there] };
    const R0 = Math.min(W, H) * 0.36, R1 = Math.max(W, H) * 9;   // from a globe in the window to the ground
    const T = 7000;
    const t0 = performance.now();
    const interp = d3.geoInterpolate(home, there);
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      const turn = o.easeInOut(o.clamp((u - 0.05) / 0.55));     // the turn from home to there
      const fall = o.easeInOut(o.clamp((u - 0.42) / 0.5));      // the fall
      const p = interp(turn);
      proj.rotate([-p[0], -p[1]]).scale(R0 * Math.pow(R1 / R0, fall));
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'oklch(10% 0.01 250)'; ctx.fillRect(0, 0, W, H);
      // the sea
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = 'oklch(34% 0.045 230)'; ctx.fill();
      // the air, a rim of light
      const r = proj.scale();
      if (r < W * 3) {
        const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.92, W / 2, H / 2, r * 1.06);
        g.addColorStop(0, 'oklch(75% 0.08 230 / 0)'); g.addColorStop(0.5, 'oklch(80% 0.08 230 / 0.55)'); g.addColorStop(1, 'oklch(80% 0.08 230 / 0)');
        ctx.beginPath(); ctx.arc(W / 2, H / 2, r * 1.06, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath(); path(graticule); ctx.strokeStyle = 'oklch(60% 0.03 230 / 0.18)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = 'oklch(86% 0.03 80)'; ctx.fill();
      ctx.strokeStyle = 'oklch(60% 0.03 80 / 0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
      // the way there, drawn as the globe turns
      if (turn > 0.02) {
        ctx.beginPath(); path({ type: 'LineString', coordinates: [home, interp(turn)] });
        ctx.strokeStyle = 'oklch(53% 0.088 47)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      // the sun's shadow on the far side
      const sh = ctx.createRadialGradient(W / 2 - r * 0.35, H / 2 - r * 0.3, r * 0.2, W / 2, H / 2, r);
      sh.addColorStop(0, 'oklch(0% 0 0 / 0)'); sh.addColorStop(1, 'oklch(0% 0 0 / 0.55)');
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = sh; ctx.fill();
      // the ground becomes the photograph
      img.style.opacity = o.easeInOut(o.clamp((u - 0.8) / 0.2)).toFixed(3);
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};
