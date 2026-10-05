// ts-node --transpile-only test/asset-optimize.spec-lite.ts   (pdftoppm шаардлагатай — poppler-utils)
// scripts/optimize-images.ts: өөрчлөгдсөн asset бүрийг тайланд харагдах ХАМГИЙН ТОМ хэмжээгээр нь
// (RULES; дүрэмгүй бол А4 хуудас) анхны ба optimize хувилбараар PDF-д зурж, 200 ба 300 DPI-д
// растерлаад SSIM-ээр харьцуулна (PSNR зөвхөн мэдээлэл) (саарал дэвсгэр — alpha ирмэгийн алдааг ч илрүүлнэ). Мөн хэмжээ, формат.
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { optimizeAll, targetBox, PAGE_W, PAGE_H, RULES } from '../scripts/optimize-images';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};

// 0.90: дахин түүвэрлэлтийн дэд-пикселийн шилжилт (текст/шугамтай зураг) ~0.91–0.99 өгдөг;
// буруу дүрэм (жиш: 2–4× хэт жижиг) ~0.6–0.8 болдог тул тэрийг л барина.
const MIN_SSIM_200 = Number(process.env.MIN_SSIM ?? 0.9);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-opt-'));
const inDir = path.join(process.cwd(), 'src/assets');
const outDir = path.join(tmp, 'opt');

function pdfWith(img: Buffer, wPt: number, hPt: number, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [wPt + 20, hPt + 20], margin: 0 });
    const ws = fs.createWriteStream(file);
    ws.on('finish', () => resolve());
    ws.on('error', reject);
    doc.pipe(ws);
    doc.rect(0, 0, wPt + 20, hPt + 20).fill('#808080');
    doc.image(img, 10, 10, { fit: [wPt, hPt], align: 'center', valign: 'center' });
    doc.end();
  });
}

async function raster(pdf: string, dpi: number): Promise<{ data: Buffer; w: number; h: number }> {
  const prefix = pdf.replace(/\.pdf$/, `-${dpi}`);
  execFileSync('pdftoppm', ['-r', String(dpi), '-png', '-singlefile', pdf, prefix]);
  const { data, info } = await sharp(`${prefix}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** SSIM (luma, 8×8 цонх, алхам 4) — хүний нүдний мэдрэмжтэй ойр; PSNR нь ирмэгийн дэд-пикселийн
 *  шилжилтэд хэт мэдрэмтгий (текст зураг) тул шалгуурыг SSIM-ээр тавина. */
function ssim(a: Buffer, b: Buffer, w: number, h: number): number {
  const L = (buf: Buffer, i: number) => 0.299 * buf[i * 3] + 0.587 * buf[i * 3 + 1] + 0.114 * buf[i * 3 + 2];
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  let sum = 0;
  let n = 0;
  for (let y = 0; y + 8 <= h; y += 4) {
    for (let x = 0; x + 8 <= w; x += 4) {
      let ma = 0, mb = 0, va = 0, vb = 0, cov = 0;
      for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
          const k = (y + j) * w + (x + i);
          const pa = L(a, k), pb = L(b, k);
          ma += pa; mb += pb; va += pa * pa; vb += pb * pb; cov += pa * pb;
        }
      }
      ma /= 64; mb /= 64;
      va = va / 64 - ma * ma; vb = vb / 64 - mb * mb; cov = cov / 64 - ma * mb;
      sum += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      n++;
    }
  }
  return n ? sum / n : 1;
}

function psnr(a: Buffer, b: Buffer): number {
  let se = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    se += d * d;
  }
  const mse = se / a.length;
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
}

if (typeof sharp?.versions?.vips !== 'string') {
  // stub-native.js (macOS-д build хийсэн native модуль Linux VM дээр) — sharp бодит биш тул алгасна.
  console.log('ℹ️ sharp (native) ачаалагдаагүй — энэ тестийг алгаслаа (stub-native-гүй ажиллуул)');
  process.exit(0);
}

(async () => {
  const s = await optimizeAll(inDir, outDir);
  ok('optimizeAll: бүх файл гарсан', s.files > 0 && Object.keys(s.manifest).length === s.files, `${s.files} файл, ${s.changed} өөрчлөгдсөн`);

  let hasPoppler = true;
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
  } catch {
    hasPoppler = false;
    console.log('ℹ️ pdftoppm байхгүй — растер харьцуулалтыг алгаслаа (хэмжээ/формат л шалгана)');
  }

  const rows: string[] = [];
  let worst = { rel: '', p: 1 };
  for (const [rel, m] of Object.entries<any>(s.manifest)) {
    const origBuf = fs.readFileSync(path.join(inDir, rel));
    const optBuf = fs.readFileSync(path.join(outDir, rel));
    if (m.action === 'copy') {
      if (!origBuf.equals(optBuf)) ok(`copy байт ижил: ${rel}`, false);
      continue;
    }
    const meta = await sharp(optBuf).metadata();
    const { wPx, hPx } = targetBox(rel);
    if (m.action.includes('resize')) {
      ok(`${rel}: хэмжээ ≤ дүрэм (${m.to.join('×')})`, (meta.width ?? 0) <= wPx && (meta.height ?? 0) <= hPx && meta.width! < m.from[0]);
    } else {
      // alpha хасах л — пиксел ЯГ ижил байх ёстой (ICC хөрвүүлэлтгүй, алдагдалгүй).
      const [x, y] = await Promise.all(
        [origBuf, optBuf].map((b) => sharp(b, { ignoreIcc: true }).removeAlpha().raw().toBuffer()),
      );
      ok(`${rel}: хэмжээ хэвээр, пиксел ижил`, meta.width === m.from[0] && meta.height === m.from[1] && x.equals(y));
    }
    ok(`${rel}: формат хэвээр (${meta.format})`, meta.format === (rel.endsWith('.png') ? 'png' : 'jpeg'));
    if (m.action.includes('drop-alpha')) ok(`${rel}: alpha хасагдсан`, !meta.hasAlpha);
    if (!hasPoppler) continue;

    // Харагдах хамгийн том хайрцаг (pt): дүрмийн w/h (байхгүй тал → зургийн харьцаагаар), дүрэмгүй бол А4.
    const rule = RULES.find((r) => r.re.test(rel));
    const [ow, oh] = m.from;
    let wPt = rule ? (rule.w ?? Infinity) : PAGE_W;
    let hPt = rule ? (rule.h ?? Infinity) : PAGE_H;
    const sc = Math.min(wPt / ow, hPt / oh);
    wPt = ow * sc;
    hPt = oh * sc;
    const a = path.join(tmp, `${rel.replace(/\W/g, '_')}-orig.pdf`);
    const b = path.join(tmp, `${rel.replace(/\W/g, '_')}-opt.pdf`);
    await pdfWith(origBuf, wPt, hPt, a);
    await pdfWith(optBuf, wPt, hPt, b);
    const res: string[] = [];
    for (const dpi of [200, 300]) {
      const [ra, rb] = [await raster(a, dpi), await raster(b, dpi)];
      const p = psnr(ra.data, rb.data);
      const q = ssim(ra.data, rb.data, ra.w, ra.h);
      res.push(`${dpi}dpi SSIM ${q.toFixed(4)} PSNR ${p.toFixed(1)}dB`);
      if (dpi === 200) {
        if (q < worst.p) worst = { rel, p: q };
        ok(`${rel} @${Math.round(wPt)}×${Math.round(hPt)}pt: 200dpi SSIM ≥ ${MIN_SSIM_200}`, q >= MIN_SSIM_200, q.toFixed(4));
      }
    }
    rows.push(`${rel.padEnd(36)} ${m.from.join('×').padEnd(10)} → ${m.to.join('×').padEnd(10)} ${String(Math.round(m.bytesIn / 1024)).padStart(5)}KB→${String(Math.round(m.bytesOut / 1024)).padStart(5)}KB  ${res.join('  ')}`);
  }
  if (rows.length) console.log('\n' + rows.join('\n'));
  if (hasPoppler) console.log(`\nхамгийн бага SSIM (200dpi): ${worst.rel} ${worst.p.toFixed(4)}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
