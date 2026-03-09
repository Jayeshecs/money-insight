#!/usr/bin/env node
/**
 * generate-icons.js
 * Generates minimal solid-colour placeholder PNG icons for the PWA manifest.
 * No external dependencies — uses Node.js built-in modules only.
 *
 * Usage (from src/client/):
 *   node scripts/generate-icons.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Build a minimal valid PNG buffer for a solid-colour image.
 * @param {number} width
 * @param {number} height
 * @param {[number,number,number]} rgb  e.g. [25, 118, 210] for #1976d2
 */
function buildPng(width, height, rgb) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width(4) + height(4) + bitDepth(1) + colorType(2=RGB)(1) + compression(1) + filter(1) + interlace(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width,  0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 2; // colour type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data: each row = filter byte (0) + R G B × width
  const rowSize   = 1 + width * 3;
  const rawData   = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const off = y * rowSize;
    rawData[off] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      rawData[off + 1 + x * 3]     = rgb[0];
      rawData[off + 1 + x * 3 + 1] = rgb[1];
      rawData[off + 1 + x * 3 + 2] = rgb[2];
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

/** Wrap data in a PNG chunk with CRC. */
function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

/** Standard CRC-32 implementation (PNG spec §5). */
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c;
  }
  return t;
})();

// Trust Blue = #1976d2 → RGB(25, 118, 210)
const BLUE = [25, 118, 210];

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

for (const { name, size } of icons) {
  const filePath = path.join(OUTPUT_DIR, name);
  if (fs.existsSync(filePath)) {
    console.log(`SKIP  ${name} (already exists)`);
    continue;
  }
  const png = buildPng(size, size, BLUE);
  fs.writeFileSync(filePath, png);
  console.log(`OK    ${name}  (${size}×${size}, ${png.length} bytes)`);
}

console.log('\nIcon generation complete.');
console.log('Replace with final brand assets before production deployment.');
