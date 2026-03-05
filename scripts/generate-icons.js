// Generates 192x192 and 512x512 PNG icons for the PWA.
// No external dependencies — uses Node.js built-in zlib.
// Design: lavender (#c4b5fd) background, white "G" drawn as pixels.

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
  // pixels: Uint8Array of width*height*3 (RGB)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  // bytes 10-12: compression=0, filter=0, interlace=0

  // Add filter byte (0 = None) per row
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter type
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Icon drawing ─────────────────────────────────────────────────────────────

// Draw a "G" glyph scaled to the icon size.
// The glyph is defined on a 7x9 grid of on/off pixels.
const G_GLYPH = [
  [0,1,1,1,1,0,0],
  [1,1,0,0,1,1,0],
  [1,0,0,0,0,0,0],
  [1,0,0,0,0,0,0],
  [1,0,0,1,1,1,0],
  [1,0,0,0,0,1,0],
  [1,1,0,0,0,1,0],
  [0,1,1,1,1,1,0],
  [0,0,0,0,0,0,0],
];
const GLYPH_COLS = G_GLYPH[0].length;
const GLYPH_ROWS = G_GLYPH.length;

function drawIcon(size) {
  const bg = [196, 181, 253]; // #c4b5fd lavender
  const fg = [255, 255, 255]; // white

  const pixels = new Uint8Array(size * size * 3);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = bg[0];
    pixels[i * 3 + 1] = bg[1];
    pixels[i * 3 + 2] = bg[2];
  }

  // Scale glyph to ~50% of icon width, centred
  const scale = Math.floor(size * 0.5 / GLYPH_COLS);
  const glyphW = GLYPH_COLS * scale;
  const glyphH = GLYPH_ROWS * scale;
  const offsetX = Math.floor((size - glyphW) / 2);
  const offsetY = Math.floor((size - glyphH) / 2);

  for (let gy = 0; gy < GLYPH_ROWS; gy++) {
    for (let gx = 0; gx < GLYPH_COLS; gx++) {
      if (!G_GLYPH[gy][gx]) continue;
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          const ix = offsetX + gx * scale + px;
          const iy = offsetY + gy * scale + py;
          if (ix < 0 || ix >= size || iy < 0 || iy >= size) continue;
          const idx = (iy * size + ix) * 3;
          pixels[idx] = fg[0];
          pixels[idx + 1] = fg[1];
          pixels[idx + 2] = fg[2];
        }
      }
    }
  }

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
