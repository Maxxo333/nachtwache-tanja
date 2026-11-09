#!/usr/bin/env node
/*
 * Erzeugt die PNG-Icons für „Nachtwache mit Tanja“ ohne Bildbibliothek.
 * Motiv: Mondsichel mit einem „T“ für Tanja (gleiche Geometrie wie icons/icon.svg).
 * Aufruf (im Projektordner):  ~/android-werkzeuge/node/bin/node werkzeuge/icons-erzeugen.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const HINTERGRUND = [0x0f, 0x14, 0x24];
const MOND = [0xf2, 0xc4, 0x6d];
const HELL = [0xf4, 0xef, 0xe6];

// Geometrie in Einheiten 0..100 (wie im SVG)
function farbeAn(x, y) {
  const imKreis = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  const imRechteck = (rx, ry, w, h) => x >= rx && x <= rx + w && y >= ry && y <= ry + h;
  if (imRechteck(50, 36, 24, 5) || imRechteck(59.5, 36, 5, 24)) return HELL;      // „T“
  if (imKreis(25, 25, 2) || imKreis(80, 76, 1.6)) return HELL;                    // Sterne
  if (imKreis(46, 52, 30) && !imKreis(60, 42, 25)) return MOND;                   // Sichel
  return HINTERGRUND;
}

// Abgerundetes Quadrat (rx 22) für das normale Icon
function imHintergrund(x, y) {
  const r = 22;
  const cx = Math.min(Math.max(x, r), 100 - r);
  const cy = Math.min(Math.max(y, r), 100 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function bildErzeugen(groesse, maskable) {
  const S = 4; // 4×4-Supersampling für glatte Kanten
  const daten = Buffer.alloc(groesse * (groesse * 4 + 1));
  for (let py = 0; py < groesse; py++) {
    const zeile = py * (groesse * 4 + 1);
    daten[zeile] = 0; // PNG-Filter „None“
    for (let px = 0; px < groesse; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          let u = ((px + (sx + 0.5) / S) / groesse) * 100;
          let v = ((py + (sy + 0.5) / S) / groesse) * 100;
          let sichtbar = true;
          if (maskable) {
            // Motiv in die innere Sicherheitszone (80 %) verkleinern, Hintergrund füllt alles
            u = 50 + (u - 50) / 0.8;
            v = 50 + (v - 50) / 0.8;
          } else {
            sichtbar = imHintergrund(u, v);
          }
          if (!sichtbar) continue;
          const f = farbeAn(u, v);
          r += f[0]; g += f[1]; b += f[2]; a += 255;
        }
      }
      const n = S * S;
      const o = zeile + 1 + px * 4;
      const deckend = a / 255;
      daten[o] = deckend ? Math.round(r / deckend) : 0;
      daten[o + 1] = deckend ? Math.round(g / deckend) : 0;
      daten[o + 2] = deckend ? Math.round(b / deckend) : 0;
      daten[o + 3] = Math.round(a / n);
    }
  }
  return pngKodieren(groesse, groesse, daten);
}

// ---- Minimaler PNG-Kodierer ----
const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABELLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function block(typ, inhalt) {
  const laenge = Buffer.alloc(4); laenge.writeUInt32BE(inhalt.length);
  const typInhalt = Buffer.concat([Buffer.from(typ, 'ascii'), inhalt]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typInhalt));
  return Buffer.concat([laenge, typInhalt, crc]);
}
function pngKodieren(breite, hoehe, rohdaten) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0); ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8 Bit, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', zlib.deflateSync(rohdaten, { level: 9 })),
    block('IEND', Buffer.alloc(0))
  ]);
}

const ziel = path.join(__dirname, '..', 'icons');
fs.mkdirSync(ziel, { recursive: true });
const auftraege = [
  ['icon-180.png', 180, true],   // Apple: ohne Transparenz, daher wie maskable gefüllt
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true]
];
for (const [name, groesse, maskable] of auftraege) {
  fs.writeFileSync(path.join(ziel, name), bildErzeugen(groesse, maskable));
  console.log('erstellt: icons/' + name);
}
