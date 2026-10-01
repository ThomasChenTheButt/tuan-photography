/* tuan photography 陳亮元 · design 2 · "Two-ink riso print": the press.
   One WebGL pass prints the map the way a risograph would: two drums, two soy inks that
   multiply where they overlap, on a cool uncoated sheet.
   Drum one (teal) prints the land as a halftone screen at 15°, its dot size read from Natural
   Earth's shaded relief, and the sea as a sparse tint that thickens toward the coast.
   Drum two (fluorescent coral) prints his sixteen countries as flats, a little off register.
   During a dive the same two screens print the cover photograph as a duotone, so the map's
   dots grow and resolve into the picture. Ink coverage is uneven and the paper has grain. */
(() => {
  'use strict';

  const VS = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';

  const FS = `
precision highp float;
uniform vec2 uSize;
uniform float uDpr;
uniform sampler2D tMask;
uniform sampler2D tRelief;
uniform sampler2D tPhoto;
uniform vec4 uView;
uniform vec2 uOrigin;
uniform float uCell;
uniform float uSeaCell;
uniform vec2 uMis;
uniform vec3 uPaper;
uniform vec3 uInk1;
uniform vec3 uInk2;
uniform float uRelief;
uniform vec4 uFit;
uniform vec4 uReveal;
uniform float uPhoto;
uniform float uFlat;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec2 rot(vec2 p, float a) { float c = cos(a); float s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
vec4 mask(vec2 p) { return texture2D(tMask, clamp(p / uSize, 0.0, 1.0)); }
float relief(vec2 p) {
  float lon = (p.x - uView.x) / uView.z + uView.w;
  float lat = (uView.y - p.y) / uView.z;
  vec2 uv = vec2(fract(lon / 6.2831853 + 0.5), clamp(0.5 - lat / 3.1415927, 0.001, 0.999));
  return texture2D(tRelief, uv).r;
}
float reveal(vec2 p) {
  if (uPhoto < 0.5) return 0.0;
  float d = length(p - uReveal.xy);
  return 1.0 - smoothstep(uReveal.z - uReveal.w, uReveal.z, d);
}
vec3 photo(vec2 p) { return texture2D(tPhoto, clamp((p - uFit.xy) / uFit.zw, 0.0, 1.0)).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec2 centre(vec2 p, float a, float s, out float dist) {
  vec2 q = rot(p - uOrigin, a);
  vec2 c = (floor(q / s) + 0.5) * s;
  dist = length(q - c);
  return rot(c, -a) + uOrigin;
}
float dotCover(float d, float dist, float s, float aa) {
  float r = s * sqrt(clamp(d, 0.0, 1.0) / 3.1415927) * 1.05;
  return (1.0 - smoothstep(r - aa, r + aa, dist)) * smoothstep(0.0, aa, r);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  float aa = 0.7 / uDpr + 0.2;

  /* drum one: the land screen at 15 degrees, dot size from the relief */
  float dist1;
  vec2 c1 = centre(p, 0.2618, uCell, dist1);
  vec4 m1 = mask(c1);
  float rel = uRelief > 0.5 ? relief(c1) : 0.808;
  float shade = 0.808 - rel;
  vec2 w1 = c1 - uOrigin;
  float even1 = 0.82 + 0.36 * (vnoise(w1 / 74.0) * 0.65 + vnoise(w1 / 17.0) * 0.35);
  float dLand = m1.r * clamp(0.085 + shade * 4.2, 0.022, 0.9) * even1;
  float rv1 = reveal(c1);
  float dPh1 = 0.0;
  if (rv1 > 0.0) {
    float L = luma(photo(c1));
    dPh1 = clamp(pow(1.0 - L, 1.3) * 1.15, 0.0, 1.0);
  }
  float cover1 = dotCover(mix(dLand, dPh1, rv1), dist1, uCell, aa);

  /* drum one again: the sea, a sparse square tint that gathers toward the shore */
  float distS;
  vec2 cs = centre(p, 0.0, uSeaCell, distS);
  float sea = 1.0 - mask(cs).r;
  float coast = 0.0;
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472;
    coast += mask(cs + vec2(cos(a), sin(a)) * 9.0).r;
    coast += mask(cs + vec2(cos(a + 0.5236), sin(a + 0.5236)) * 19.0).r * 0.55;
  }
  coast = clamp(coast / 6.5, 0.0, 1.0);
  float seaR = (0.5 + 1.15 * coast) * sea * (1.0 - reveal(cs)) * uFlat;
  float coverS = (1.0 - smoothstep(seaR - aa, seaR + aa, distS)) * step(0.05, seaR) * 0.72;
  float ink1 = max(cover1, coverS);

  /* drum two: coral flats where he has been, off register; the photograph at 75 degrees */
  vec2 p2 = p - uMis;
  vec4 m2 = mask(p2);
  vec2 w2 = p2 - uOrigin;
  float even2 = 0.84 + 0.16 * vnoise(w2 / 52.0) - 0.05 * vnoise(w2 / 9.0);
  float flat2 = m2.g * mix(0.8, 0.97, m2.b) * even2 * uFlat;
  float ink2 = flat2;
  float rvp = reveal(p2);
  if (rvp > 0.0) {
    float s2 = uCell * 1.08;
    float dist2;
    vec2 c2 = centre(p2, 1.309, s2, dist2);
    vec3 ph = photo(c2);
    float L = luma(ph);
    float warm = clamp(ph.r - ph.b, -0.3, 0.5);
    float dPh2 = clamp((1.0 - L) * 0.62 + warm * 1.1 + 0.1, 0.0, 1.0);
    ink2 = mix(flat2, dotCover(dPh2, dist2, s2, aa), rvp);
  }

  /* the sheet: fibre grain, and specks where the ink did not take */
  vec2 g = floor(p * uDpr * 0.6);
  ink1 *= 1.0 - step(0.968, hash(g + 7.0)) * 0.85;
  ink2 *= 1.0 - step(0.958, hash(floor(p2 * uDpr * 0.6) + 3.0)) * 0.8;
  vec3 paper = uPaper * (0.988 + 0.02 * hash(g) + 0.012 * vnoise(p / 3.0));
  vec3 col = paper * mix(vec3(1.0), uInk1, ink1) * mix(vec3(1.0), uInk2, ink2);
  gl_FragColor = vec4(col, 1.0);
}`;

  function Press(canvas) {
    let gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    } catch (e) { gl = null; }
    if (!gl) return null;

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.warn('riso press:', e.message);
      return null;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uSize', 'uDpr', 'tMask', 'tRelief', 'tPhoto', 'uView', 'uOrigin', 'uCell', 'uSeaCell', 'uMis', 'uPaper', 'uInk1', 'uInk2', 'uRelief', 'uFit', 'uReveal', 'uPhoto', 'uFlat']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    const blank = new Uint8Array([0, 0, 0, 255]);
    function texture(unit, wrapS) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blank);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS || gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }
    const tMask = texture(0);
    const tRelief = texture(1, gl.REPEAT);
    const tPhoto = texture(2);
    gl.uniform1i(U.tMask, 0);
    gl.uniform1i(U.tRelief, 1);
    gl.uniform1i(U.tPhoto, 2);

    let hasRelief = 0, hasPhoto = 0, lost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });

    return {
      get lost() { return lost; },
      resize(w, h, dpr) {
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      mask(src) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tMask);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      },
      relief(img) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tRelief);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        // the relief is 4096 by 2048, so it can carry mipmaps for the wide views
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        hasRelief = 1;
      },
      photo(img) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tPhoto);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        hasPhoto = 1;
      },
      dropPhoto() { hasPhoto = 0; },
      draw(u) {
        if (lost) return;
        gl.uniform2f(U.uSize, u.w, u.h);
        gl.uniform1f(U.uDpr, u.dpr);
        gl.uniform4f(U.uView, u.tx, u.ty, u.s, u.lon0);
        gl.uniform2f(U.uOrigin, u.ox, u.oy);
        gl.uniform1f(U.uCell, u.cell);
        gl.uniform1f(U.uSeaCell, u.seaCell);
        gl.uniform2f(U.uMis, u.mis[0], u.mis[1]);
        gl.uniform3fv(U.uPaper, u.paper);
        gl.uniform3fv(U.uInk1, u.ink1);
        gl.uniform3fv(U.uInk2, u.ink2);
        gl.uniform1f(U.uRelief, hasRelief);
        gl.uniform4fv(U.uFit, u.fit || [0, 0, 1, 1]);
        gl.uniform4fv(U.uReveal, u.reveal || [0, 0, 0, 1]);
        gl.uniform1f(U.uPhoto, hasPhoto && u.reveal && u.reveal[2] > 0 ? 1 : 0);
        gl.uniform1f(U.uFlat, u.flat == null ? 1 : u.flat);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  window.RisoPress = Press;
})();
