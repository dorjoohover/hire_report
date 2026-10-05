// ts-node --transpile-only test/image-fit.spec-lite.ts
// src/pdf/image-fit.ts — Studio зургийн кэш ба блокийн хэмжээнд тааруулах (DB-гүй).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { cachedSource, clearImageFitCache, fitForBox, imageFitStats } from '../src/pdf/image-fit';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const img = (w: number, h: number, fmt: 'png' | 'jpeg' | 'webp', alpha = false) =>
  sharp({ create: { width: w, height: h, channels: alpha ? 4 : 3, background: { r: 200, g: 80, b: 20, alpha: 0.5 } } })
    [fmt]()
    .toBuffer();

if (typeof sharp?.versions?.vips !== 'string') {
  // stub-native.js (macOS-д build хийсэн native модуль Linux VM дээр) — sharp бодит биш тул алгасна.
  console.log('ℹ️ sharp (native) ачаалагдаагүй — энэ тестийг алгаслаа (stub-native-гүй ажиллуул)');
  process.exit(0);
}

(async () => {
  // 1) эх буферын кэш: ижил URL → load нэг л удаа (зэрэг дуудлага ч)
  let loads = 0;
  const big = await img(2000, 1000, 'png', true);
  const load = async () => {
    loads++;
    await new Promise((r) => setTimeout(r, 20));
    return big;
  };
  const [s1, s2] = await Promise.all([cachedSource('u1', load), cachedSource('u1', load)]);
  const s3 = await cachedSource('u1', load);
  ok('cachedSource: зэрэг + дараагийн дуудлага → load 1 удаа', loads === 1 && s1 === s2 && s2 === s3, `loads=${loads}`);

  // 2) том PNG → 100×50pt хайрцаг × 250ppi = 348×174px; дахин дуудахад ИЖИЛ Buffer объект
  const f1 = await fitForBox('u1', big, 100, 50);
  const m1 = await sharp(f1).metadata();
  ok('fitForBox: 2000×1000 → 348×174 (250 ppi), PNG, alpha хэвээр', m1.width === 348 && m1.height === 174 && m1.format === 'png' && !!m1.hasAlpha, `${m1.width}×${m1.height} ${m1.format}`);
  const f2 = await fitForBox('u1', big, 100, 50);
  ok('fitForBox: кэш → ижил Buffer (png-embed-cache хит)', f1 === f2 && imageFitStats.fitHits >= 1);

  // 3) хангалттай жижиг → эх буфер (дахин encode-гүй)
  const small = await img(200, 100, 'jpeg');
  ok('жижиг JPEG → эх буфер', (await fitForBox('u2', small, 100, 50)) === small);

  // 4) PDFKit-ийн дэмждэггүй webp → PNG
  const webp = await img(300, 300, 'webp');
  const f4 = await fitForBox('u3', webp, 200, 200);
  ok('webp → png', (await sharp(f4).metadata()).format === 'png');

  // 5) EXIF orientation 6 (90°) JPEG: эргүүлж пикселд шингээнэ, EXIF-гүй
  const rot = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#336699' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const f5 = await fitForBox('u4', rot, 100, 300);
  const m5 = await sharp(f5).metadata();
  ok('EXIF 6: өргөн/өндөр солигдож, orientation алга', m5.height! > m5.width! && !m5.orientation, `${m5.width}×${m5.height} o=${m5.orientation}`);

  // 6) эвдэрсэн буфер → эх буфер (алдаа шидэхгүй)
  const bad = Buffer.from('not an image');
  ok('эвдэрсэн → эх буфер', (await fitForBox('u5', bad, 50, 50)) === bad);

  // 7) IMAGE_FIT=0 → хэмжээ өөрчлөхгүй
  process.env.IMAGE_FIT = '0';
  ok('IMAGE_FIT=0 → эх буфер', (await fitForBox('u6', big, 10, 10)) === big);
  delete process.env.IMAGE_FIT;

  clearImageFitCache();
  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
