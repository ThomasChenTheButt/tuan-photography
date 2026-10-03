/* tuan photography, design 2 "Pen and wash": the photo ball (opening globe look 4, 2026-10-03)

   A ball covered in his photographs, his idea: prints pinned all round a sphere, each on a thin
   paper mat, turning under the name. The prints are laid on a flat map of the sphere in bands
   (three at each pole, eight in the middle latitudes, twelve round the equator, so none is
   squeezed), and the graphics card wraps that map round the sphere: for every pixel of the disc
   the sphere's normal is found, turned by the globe's rotation, and the map sampled there; one
   soft light from the upper left and a breath of light along the limb give it its roundness.

   WC.photoBall({ slides, src(slide) -> url }) -> { ready: Promise, render(R, lonC, latC) ->
   canvas, done() }: render draws the ball of radius R (device px) centred at (lonC, latC) degrees
   into its own canvas, 2.3R square, and returns it to be drawn where it lies. The map fills in as
   the photographs arrive; `done()` says whether all are in. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  const VS = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS = `
    precision highp float;
    uniform sampler2D uMap;
    uniform vec2 uC; uniform float uR;
    uniform mat3 uM; uniform vec3 uSun;
    const float PI = 3.141592653589793;
    void main() {
      vec2 p = (gl_FragCoord.xy - uC) / uR;
      float r2 = dot(p, p);
      if (r2 > 1.0) discard;
      vec3 n = vec3(p, sqrt(1.0 - r2));
      vec3 w = uM * n;
      float lon = atan(-w.z, w.x), lat = asin(clamp(w.y, -1.0, 1.0));
      vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
      vec3 col = texture2D(uMap, uv).rgb;
      float diff = dot(n, uSun);
      float lit = 0.42 + 0.62 * max(diff, 0.0);
      col *= lit;
      float fres = pow(1.0 - n.z, 2.2);
      col = mix(col, vec3(0.98, 0.97, 0.94), fres * 0.28);
      col *= 1.0 - 0.35 * pow(1.0 - n.z, 6.0);
      // the edge softened over the last pixel
      float a = clamp((1.0 - sqrt(r2)) * uR, 0.0, 1.0);
      gl_FragColor = vec4(col * a, a);
    }`;

  const DEG = Math.PI / 180;
  const PAPER = '#fbfaf5';

  WC.photoBall = (o) => {
    const W = 4096, H = 2048;
    const map = document.createElement('canvas'); map.width = W; map.height = H;
    const g = map.getContext('2d');
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    // the bands: [lat from, lat to, prints across]
    const bands = [[90, 60, 3], [60, 30, 8], [30, 0, 12], [0, -30, 12], [-30, -60, 8], [-60, -90, 3]];
    const cells = [];
    for (const [a, b, n] of bands) {
      const y0 = ((90 - a) / 180) * H, y1 = ((90 - b) / 180) * H;
      for (let i = 0; i < n; i++) cells.push({ x0: (i / n) * W, x1: ((i + 1) / n) * W, y0, y1 });
    }
    // the prints, dealt in a fixed shuffle so the ball looks the same each visit
    const slides = Object.values(o.slides);
    let s = 23;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const deck = slides.slice();
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const gut = 10;
    let left = cells.length, dirty = true;
    const waits = cells.map((c, i) => {
      const sl = deck[i % deck.length];
      const e = WC.photoBitmap(o.src(sl));
      return e.p.then((bm) => {
        if (!bm) return;
        const cw = c.x1 - c.x0 - gut * 2, ch = c.y1 - c.y0 - gut * 2;
        const k = Math.max(cw / bm.width, ch / bm.height);
        g.save();
        g.beginPath(); g.rect(c.x0 + gut, c.y0 + gut, cw, ch); g.clip();
        g.drawImage(bm, c.x0 + gut + (cw - bm.width * k) / 2, c.y0 + gut + (ch - bm.height * k) / 2, bm.width * k, bm.height * k);
        g.restore();
        left -= 1; dirty = true;
      }).catch(() => { left -= 1; });
    });
    const ready = Promise.all(waits);

    const c = document.createElement('canvas');
    const gl = c.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('no webgl');
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(prog, 'uMap'), 0);
    const uC = gl.getUniformLocation(prog, 'uC'), uR = gl.getUniformLocation(prog, 'uR'), uM = gl.getUniformLocation(prog, 'uM'), uSun = gl.getUniformLocation(prog, 'uSun');
    gl.uniform3f(uSun, -0.55, 0.5, 0.67);
    gl.disable(gl.DEPTH_TEST);
    return {
      ready,
      done: () => left <= 0,
      render(R, lonC, latC) {
        const S = Math.ceil(R * 2.3);
        if (c.width !== S || c.height !== S) { c.width = S; c.height = S; gl.viewport(0, 0, S, S); }
        if (dirty) { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map); dirty = false; }
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uC, S / 2, S / 2); gl.uniform1f(uR, R);
        // world = Ry(pi/2 + lonC) * Rx(-latC) * view, east to the right
        const a = -latC * DEG, b = Math.PI / 2 + lonC * DEG;
        const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
        gl.uniformMatrix3fv(uM, false, new Float32Array([cb, 0, -sb, sb * sa, ca, cb * sa, sb * ca, -sa, cb * ca]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return c;
      },
    };
  };
})();
