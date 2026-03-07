// Generates 192x192 and 512x512 PNG icons for the PWA.
// No external dependencies — uses Node.js built-in zlib.
// Design: lavender (#c4b5fd) background, white ribbon bow.

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ─── CRC32 ───────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ─── PNG builder ─────────────────────────────────────────────────────────────

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcVal]);
}

function makePNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function setPixel(pixels, size, x, y, r, g, b) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (Math.round(y) * size + Math.round(x)) * 3;
  pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b;
}

/** Filled ellipse — anti-aliased via partial coverage. */
function fillEllipse(pixels, size, cx, cy, rx, ry, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - rx - 1));
  const x1 = Math.min(size - 1, Math.ceil(cx + rx + 1));
  const y0 = Math.max(0, Math.floor(cy - ry - 1));
  const y1 = Math.min(size - 1, Math.ceil(cy + ry + 1));

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1.0) {
        const idx = (py * size + px) * 3;
        pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b;
      }
    }
  }
}

/** Hollow ellipse ring (outer - inner). */
function strokeEllipse(pixels, size, cx, cy, rx, ry, thickness, r, g, b) {
  fillEllipse(pixels, size, cx, cy, rx, ry, r, g, b);
  const bg = [196, 181, 253]; // lavender bg
  fillEllipse(pixels, size, cx, cy, rx - thickness, ry - thickness, bg[0], bg[1], bg[2]);
}

/** Filled rectangle. */
function fillRect(pixels, size, x, y, w, h, r, g, b) {
  for (let py = Math.max(0, y); py < Math.min(size, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(size, x + w); px++) {
      const idx = (py * size + px) * 3;
      pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b;
    }
  }
}

/** Diagonal ribbon tail — drawn as a parallelogram. */
function fillTail(pixels, size, x1, y1, x2, y2, width, r, g, b) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(len * 2);
  const hw = width / 2;
  // Normal vector
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mx = x1 + (x2 - x1) * t;
    const my = y1 + (y2 - y1) * t;
    for (let w = -hw; w <= hw; w += 0.5) {
      setPixel(pixels, size, Math.round(mx + nx * w), Math.round(my + ny * w), r, g, b);
    }
  }
}

// ─── Bow drawing ──────────────────────────────────────────────────────────────

function drawIcon(size) {
  const BG  = [196, 181, 253]; // #c4b5fd lavender
  const BOW = [255, 255, 255]; // white loops + tails
  const KNOT = [167, 139, 250]; // #a78bfa slightly darker lavender for knot

  const pixels = new Uint8Array(size * size * 3);
  // Background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BG[0]; pixels[i * 3 + 1] = BG[1]; pixels[i * 3 + 2] = BG[2];
  }

  const cx = size * 0.5;
  const cy = size * 0.42;
  const t  = size * 0.055; // stroke thickness

  // ── Ribbon tails (draw first so loops sit on top) ──
  const tailTop = cy + size * 0.08;
  const tailW   = size * 0.09;
  fillTail(pixels, size, cx, tailTop, cx - size * 0.12, size * 0.82, tailW, ...BOW);
  fillTail(pixels, size, cx, tailTop, cx + size * 0.12, size * 0.82, tailW, ...BOW);

  // ── Left loop ──
  const lx = cx - size * 0.22;
  strokeEllipse(pixels, size, lx, cy, size * 0.22, size * 0.28, t, ...BOW);

  // ── Right loop ──
  const rx = cx + size * 0.22;
  strokeEllipse(pixels, size, rx, cy, size * 0.22, size * 0.28, t, ...BOW);

  // ── Center knot (solid, covers the loop join) ──
  fillEllipse(pixels, size, cx, cy, size * 0.11, size * 0.10, ...BOW);
  fillEllipse(pixels, size, cx, cy, size * 0.07, size * 0.065, ...KNOT);

  return pixels;
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const pixels = drawIcon(size);
  const png = makePNG(size, size, pixels);
  const outPath = path.join(outDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
}
