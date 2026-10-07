/* Ripple. Heat haze over the frame: the photograph bends like air over hot ground, and the
   shimmer settles until it is still and sharp. From the web: the distortion heroes on award
   sites, done here with an SVG displacement filter, no WebGL. */
window.Openings.ripple = function (o) {
  'use strict';
  const stage = o.stage();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="op-haze" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="110" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  img.style.cssText = 'position:absolute;inset:-12%;width:124%;height:124%;object-fit:cover;filter:url(#op-haze);opacity:0;will-change:filter,opacity';
  stage.append(svg, img);
  const turb = svg.querySelector('feTurbulence'), disp = svg.querySelector('feDisplacementMap');
  const T = 5200;
  o.load(img.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      const e = o.easeInOut(o.clamp((u - 0.1) / 0.8));
      img.style.opacity = o.easeOut(o.clamp(u / 0.25)).toFixed(3);
      disp.setAttribute('scale', (110 * (1 - e)).toFixed(1));
      const f = 0.008 + 0.004 * (1 - e);
      turb.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 2).toFixed(4)}`);
      turb.setAttribute('seed', String(3 + Math.floor(u * 40)));              // the air moves
      img.style.filter = e >= 0.999 ? 'none' : 'url(#op-haze)';
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};
