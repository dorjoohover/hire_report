// ts-node --transpile-only test/png-embed-cache.spec-lite.ts
// src/pdf/png-embed-cache.ts — document хоорондын PNG embed кэш: hit/miss ба гаралтын stream ИЖИЛ эсэх.
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { installPngEmbedCache, pngEmbedCacheStats } from '../src/pdf/png-embed-cache';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const asset = (p: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets', p));

// RGBA (splitAlphaChannel), indexed + tRNS (loadIndexedAlphaChannel), interlaced RGB (decodeData).
const rgba = asset('logo.png');
const indexed = asset('icons/header-top-white.png');
function interlacedPng(): Buffer {
  const w = 8, h = 8; // ≥ 8: png-js хоосон pass-ийг алгасдаггүй
  const crc = (b: Buffer) => {
    let c = ~0;
    for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
    return (~c) >>> 0;
  };
  const chunk = (t: string, d: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const td = Buffer.concat([Buffer.from(t), d]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[12] = 1; // RGB, Adam7
  // Adam7 (png-js-ийн pass(x0, y0, dx, dy) дараалал) — pass бүрийн мөрийг filter 0-тэй дүүргэнэ.
  const passes = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
  const rows: Buffer[] = [];
  for (const [x0, y0, dx, dy] of passes) {
    const pw = Math.ceil((w - x0) / dx), ph = Math.ceil((h - y0) / dy);
    if (pw <= 0 || ph <= 0) continue;
    for (let y = 0; y < ph; y++) rows.push(Buffer.concat([Buffer.from([0]), Buffer.alloc(pw * 3, 0x7f)]));
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const interlaced = interlacedPng();

function render(): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (b: Buffer) => chunks.push(b));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.image(rgba, 10, 10, { width: 200 });
    doc.image(indexed, 10, 120, { width: 200 });
    doc.image(interlaced, 10, 300, { width: 40 });
    doc.end();
  });
}
// Объектын дараалал өөр байж болно (кэш хит нь синхрон finalize хийдэг) — stream-уудыг эрэмбэлж харьцуулна.
const streams = (pdf: Buffer) => {
  const s = pdf.toString('latin1');
  const out: string[] = [];
  const re = /stream\n([\s\S]*?)\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1]);
  return out.sort();
};

(async () => {
  ok('суулгалт', installPngEmbedCache(PDFDocument) === true);
  const a = await render();
  const missesAfterFirst = pngEmbedCacheStats.misses;
  const hitsAfterFirst = pngEmbedCacheStats.hits;
  const b = await render();
  const c = await render();
  ok('эхний document: 3 miss (rgba, indexed, interlaced)', missesAfterFirst === 3 && hitsAfterFirst === 0, `${missesAfterFirst} miss / ${hitsAfterFirst} hit`);
  ok('дараагийн 2 document: 6 hit, шинэ miss-гүй', pngEmbedCacheStats.hits === 6 && pngEmbedCacheStats.misses === 3, JSON.stringify(pngEmbedCacheStats));
  const sa = streams(a), sb = streams(b), sc = streams(c);
  ok('stream-ууд ИЖИЛ (miss vs hit)', sa.length > 0 && JSON.stringify(sa) === JSON.stringify(sb) && JSON.stringify(sb) === JSON.stringify(sc), `${sa.length} stream`);
  ok('SMask (alpha) хадгалагдсан', /\/SMask \d+ 0 R/.test(b.toString('latin1')));
  ok('PDF хэмжээ ижил', a.length === b.length, `${a.length} / ${b.length}`);
  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
})();
