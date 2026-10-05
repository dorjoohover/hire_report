// ts-node --transpile-only test/fontkit-table-cache.spec-lite.ts
// src/pdf/fontkit-table-cache.ts — Gilroy-ийн эвдэрхий GDEF-ийг дахин decode хийхгүй, гаралт ИЖИЛ эсэх.
// ⚠️ canvas/sharp хэрэггүй (pdfkit + fontkit л) — macOS-д build хийсэн node_modules-тай Linux VM-д ч ажиллана.
import * as fs from 'fs';
import * as path from 'path';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const FONT = path.join(process.cwd(), 'src/assets/fonts/Gilroy-Medium.ttf');
const fontBuf = fs.readFileSync(FONT);
const TEXT =
  'Таны зан төлөв бусадтай харилцах хэв маяг ажлын орчинд хэрхэн илэрдэг тухай дэлгэрэнгүй тайлбар. ' +
  'Dominance Influence Steadiness Compliance — AV To fi ffl 1234567890.';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fontkit = require(require.resolve('fontkit', { paths: [path.dirname(require.resolve('pdfkit'))] }));

// Patch-аас ӨМНӨ үүсгэсэн font = хуучин үйлдэл (getter нь хуучин _getTable-д bind хийгдсэн).
const before = fontkit.create(fontBuf);
const layoutOf = (f: any) =>
  JSON.stringify(
    TEXT.split(' ').map((w) => {
      const r = f.layout(w + ' ');
      return [r.glyphs.map((g: any) => g.id), r.positions.map((p: any) => [p.xAdvance, p.yAdvance, p.xOffset, p.yOffset])];
    }),
  );
const refLayout = layoutOf(before);
ok('Gilroy-д GDEF хүснэгт байгаа ч fontkit decode хийж чаддаггүй (кэшлэгддэггүй)', !!before.directory.tables.GDEF && before.GDEF === undefined && !('GDEF' in before._tables));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { installFontkitTableCache, fontkitTableCacheStats } = require('../src/pdf/fontkit-table-cache');
ok('суулгалт амжилттай', installFontkitTableCache(FONT) === true);

const after = fontkit.create(fontBuf);
ok('GDEF нь өмнөхтэй адил undefined', after.GDEF === undefined);
ok('амжилтгүй decode кэшлэгдсэн (_tables-д GDEF түлхүүр)', 'GDEF' in after._tables);
const n0 = fontkitTableCacheStats.cachedFailures;
for (let i = 0; i < 50; i++) void after.GDEF;
ok('дахин уншихад decode хийхгүй', fontkitTableCacheStats.cachedFailures === n0);
ok('layout (glyph id + байрлал) ЯГ ИЖИЛ', layoutOf(after) === refLayout);

// Хурд: ижил үгсийг шинэ font дээр (pdfkit document бүрд шинэ font үүсгэдэг)
const words = Array.from({ length: 300 }, (_, i) => `тест${i}үг`);
const time = (f: any) => {
  const t = process.hrtime.bigint();
  for (const w of words) f.layout(w);
  return Number(process.hrtime.bigint() - t) / 1e6;
};
const tBefore = time(before); // patch-аас өмнө үүссэн (хуучин getter)
const tAfter = time(fontkit.create(fontBuf));
ok('layout хурдассан', tAfter < tBefore, `${tBefore.toFixed(0)}ms → ${tAfter.toFixed(0)}ms (300 үг)`);

// pdfkit-ээр бүтэн PDF: patch-тэй/гүй content stream ижил (CreationDate/ID-гээс бусад)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
const makePdf = () =>
  new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: 'A4', info: { CreationDate: new Date(0) } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont('g', fontBuf);
    doc.font('g').fontSize(11).text(TEXT.repeat(20), { width: 400, align: 'justify' });
    doc.end();
  });
(async () => {
  const a = await makePdf();
  const b = await makePdf();
  const norm = (d: Buffer) => d.toString('latin1').replace(/\/ID \[<[0-9a-f]+> <[0-9a-f]+>\]/, '');
  ok('pdfkit PDF тогтвортой (patch-тэй хоёр удаа ижил)', norm(a) === norm(b));
  ok('pdfkit-ийн font дээр GDEF кэшлэгдэж байна', fontkitTableCacheStats.cachedFailures > n0);
  console.log(failed ? `\n${failed} алдаа` : '\nбүгд OK');
  process.exit(failed ? 1 : 0);
})();
