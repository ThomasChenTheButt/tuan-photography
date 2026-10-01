/* tuan photography 陳亮元 · design 2 · "Swiss relief": the colouring press.

   Natural Earth's grey rasters come in, a hand-shaded atlas plate goes out, in eight soft inks:
   sea glacier blue, the white of the coastal glow, sage lowlands, ochre uplands, stone, the near-white
   of the peaks, Imhof's warm light and his cool violet shade.

   - GRAY_50M_SR_OB is hypsometric grey times hillshade, with the sea floor in darker greys.
   - SR_50M is hillshade alone; flat ground and the sea read 206.
   So G / (S / 206) gives back the height tint ("h": the sea below ~115, lowlands ~146, peaks ~240),
   and the land / sea edge is a threshold on h. Everything is coloured once, here, off the main
   thread: the 4096 plate when the page opens, and 1350px squares of the 10800 hillshade when the
   map comes close. Nothing is re-coloured while the map moves. */

'use strict';

const BW = 4096, BH = 2048;  // the base plate
let H = null;                // height tint per base pixel (Uint8)
let GLOW = null;             // the white glow along every coast, at half the base size (Uint8)
const GW = BW / 2, GH = BH / 2;

/* the inks, as sRGB */
const RAMP = [
  [0.00, 192, 205, 195],  // sage-grey lowland
  [0.12, 202, 210, 194],
  [0.28, 219, 215, 193],  // pale ochre
  [0.46, 226, 216, 199],  // ochre turning to stone
  [0.66, 229, 224, 216],  // stone
  [0.85, 241, 238, 234],
  [1.00, 252, 251, 249],  // the near-white of the peaks
];
const LIGHT = [255, 250, 236];      // warm light on the slopes facing the north-west sun
const SHADE = [0.7, 0.695, 0.79];   // cool violet-grey in the shade, as a multiplier
const DEEP = [202, 220, 228];       // glacial blue, open ocean
const SHELF = [223, 235, 237];      // paler over the shelves
const SURF = [246, 249, 247];       // the glow along the coast

// a lookup of the ramp, 256 steps of elevation
const RAMP_LUT = new Float32Array(256 * 3);
for (let i = 0; i < 256; i++) {
  const e = i / 255;
  let k = 0;
  while (k < RAMP.length - 2 && e > RAMP[k + 1][0]) k++;
  const a = RAMP[k], b = RAMP[k + 1];
  const t = Math.min(1, Math.max(0, (e - a[0]) / (b[0] - a[0])));
  RAMP_LUT[i * 3] = a[1] + (b[1] - a[1]) * t;
  RAMP_LUT[i * 3 + 1] = a[2] + (b[2] - a[2]) * t;
  RAMP_LUT[i * 3 + 2] = a[3] + (b[3] - a[3]) * t;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// one pixel: h (height tint), s (hillshade, 206 flat), glow (0..1); writes rgb into out at o
function ink(h, s, glow, out, o) {
  const land = smooth(117, 129, h);
  let r = 0, g = 0, b = 0;
  if (land > 0) {
    const e = Math.min(1, Math.max(0, (h - 146) / (232 - 146)));
    const li = (e * 255) | 0;
    r = RAMP_LUT[li * 3]; g = RAMP_LUT[li * 3 + 1]; b = RAMP_LUT[li * 3 + 2];
    const d = s / 206 - 1;
    // aerial perspective: the high ground carries the strongest light and shade
    const strength = 0.58 + 0.42 * e;
    if (d < 0) {
      const k = Math.min(1, -d / 0.44) * strength;
      r *= 1 - k + k * SHADE[0]; g *= 1 - k + k * SHADE[1]; b *= 1 - k + k * SHADE[2];
    } else if (d > 0) {
      const k = Math.min(1, d / 0.2) * strength * 0.55;
      r += (LIGHT[0] - r) * k; g += (LIGHT[1] - g) * k; b += (LIGHT[2] - b) * k;
    }
  }
  if (land < 1) {
    const st = Math.min(1, Math.max(0, (h - 84) / 30));
    let sr = DEEP[0] + (SHELF[0] - DEEP[0]) * st;
    let sg = DEEP[1] + (SHELF[1] - DEEP[1]) * st;
    let sb = DEEP[2] + (SHELF[2] - DEEP[2]) * st;
    const k = glow * 0.75;
    sr += (SURF[0] - sr) * k; sg += (SURF[1] - sg) * k; sb += (SURF[2] - sb) * k;
    r = r * land + sr * (1 - land); g = g * land + sg * (1 - land); b = b * land + sb * (1 - land);
  }
  out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
}

// a box blur, run three times, is near enough a gaussian
function blur(src, w, h, r) {
  const a = new Float32Array(src), b = new Float32Array(src.length);
  const n = 2 * r + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / n;
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / n;
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

function makeBase(gray, shade) {
  const n = BW * BH;
  H = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const s = shade[j];
    H[i] = Math.min(255, (gray[j] * 206) / Math.max(s, 72));
  }
  // the coast's glow: the land mask at half size, blurred tight and wide, kept to the sea side
  const m = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * 2 * BW + x * 2;
    m[y * GW + x] = (smooth(117, 129, H[i]) + smooth(117, 129, H[i + 1]) + smooth(117, 129, H[i + BW]) + smooth(117, 129, H[i + BW + 1])) / 4;
  }
  const near = blur(m, GW, GH, 1), far = blur(m, GW, GH, 5);
  GLOW = new Uint8Array(GW * GH);
  for (let i = 0; i < GLOW.length; i++) GLOW[i] = Math.min(255, (near[i] * 0.75 + far[i] * 0.65) * 255);

  const out = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < BH; y++) {
    const gy = Math.min(GH - 1, y >> 1);
    for (let x = 0; x < BW; x++) {
      const i = y * BW + x;
      ink(H[i], shade[i * 4], GLOW[gy * GW + (x >> 1)] / 255, out, i * 4);
    }
  }
  return out;
}

// bilinear sample of a byte field
function sample(arr, w, h, fx, fy) {
  const x0 = Math.max(0, Math.min(w - 1, Math.floor(fx))), y0 = Math.max(0, Math.min(h - 1, Math.floor(fy)));
  const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const tx = Math.min(1, Math.max(0, fx - x0)), ty = Math.min(1, Math.max(0, fy - y0));
  const a = arr[y0 * w + x0], b = arr[y0 * w + x1], c = arr[y1 * w + x0], d = arr[y1 * w + x1];
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

// a square of the 10800 hillshade (x0, y0 in 10800 pixels), coloured with heights from the base
function makeTile(px, x0, y0, size) {
  const out = new Uint8ClampedArray(size * size * 4);
  const f = BW / 10800;
  for (let y = 0; y < size; y++) {
    const by = (y0 + y + 0.5) * f - 0.5;
    const gy = (y0 + y + 0.5) * f * 0.5 - 0.5;
    for (let x = 0; x < size; x++) {
      const bx = (x0 + x + 0.5) * f - 0.5;
      const h = sample(H, BW, BH, bx, by);
      const glow = h < 129 ? sample(GLOW, GW, GH, bx * 0.5, gy) / 255 : 0;
      const o = (y * size + x) * 4;
      ink(h, px[o], glow, out, o);
    }
  }
  return out;
}

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'base') {
    const out = makeBase(new Uint8ClampedArray(m.gray), new Uint8ClampedArray(m.shade));
    self.postMessage({ type: 'base', rgba: out.buffer }, [out.buffer]);
  } else if (m.type === 'tile') {
    if (!H) return;
    const out = makeTile(new Uint8ClampedArray(m.px), m.x0, m.y0, m.size);
    self.postMessage({ type: 'tile', id: m.id, rgba: out.buffer }, [out.buffer]);
  }
};
