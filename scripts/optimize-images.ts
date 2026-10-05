/*
 * src/assets → src/assets_optimized (Docker build дээр: `npm run optimize:images`). 2026-10-05.
 *
 * Яагаад: PDF-ийн хэмжээний ~95% нь зураг. Asset-ууд тайланд харагдах хэмжээнээсээ хэт том
 * (жиш: logo.png 3258×912 px-ийг 70–100pt өргөнөөр → ~3300 ppi; dt1.jpeg 2024×2454-ийг 150pt →
 * ~970 ppi). PDFKit зургийг px-ээр нь бүтнээр шингээдэг тул PDF том, alpha-тай PNG-г задлах
 * (render CPU) ч их.
 *
 * Дүрэм: зураг бүрийг тайланд харагдах ХАМГИЙН ТОМ хэмжээ × ASSET_PPI (default 250) px-ээс ихгүй
 * болгоно (жижигрүүлэх л, томруулахгүй). Хэмжээг src/pdf/** доторх `doc.image(...)` дуудлагуудаас
 * авсан (RULES-ийн `why`). Дүрэмгүй файл → А4 хуудас бүтнээрээ (595×842pt) × ASSET_PPI — ямар ч
 * байрлалд бүдгэрэхгүй хамгийн том хэмжээ.
 * Нэмэлт (алдагдалгүй): alpha суваг нь бүрэн битүү (бүх пиксел 255) PNG-ийн alpha-г хасна →
 * PDFKit задлахгүй, SMask үүсгэхгүй.
 * Хувилбарыг зөвхөн PDF-д шингэх хэмжээ нь (pdfCost) БАГАССАН үед авна; бусад үед, мөн өөрчлөх
 * шаардлагагүй файлыг байт-байтаар хуулна (дахин encode хийхгүй).
 *
 * Studio-ийн "/icons/…" ба upload хийсэн зургууд ЭНД хамаарахгүй — тэдгээрийг render үед блокийн
 * бодит хэмжээнд тааруулна (src/pdf/image-fit.ts), учир нь хэрэглэгч дурын хэмжээгээр байрлуулна.
 *
 * Шалгах: test/asset-optimize.spec-lite.ts (asset бүрийг хамгийн том харагдах хэмжээгээр нь
 * анхны ба optimize хувилбараар зурж харьцуулна). Runtime: LOW_PPI анхааруулга (pdf.services.ts).
 * Буцаах: ASSETS_OPTIMIZED=0 (runtime, rebuild хэрэггүй).
 */
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export const ASSET_PPI = Number(process.env.ASSET_PPI ?? 250);
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
const MARGIN_X = 40; // src/pdf/formatter.ts marginX
const MIN_PIXEL_RATIO = 0.8;
const CONTENT_W = PAGE_W - 2 * MARGIN_X; // 515pt

export interface AssetRule {
  re: RegExp;
  /** Тайланд харагдах хамгийн их өргөн / өндөр (pt). Байхгүй бол хязгааргүй (нөгөө тал л). */
  w?: number;
  h?: number;
  /** Энэ asset-д өөр ppi (жиш: жижиг бичигтэй logo-д 300). */
  ppi?: number;
  why: string;
}

// Хэмжээнүүд ~1.2–1.5 дахин нөөцтэй (тайлбар дахь бодит утгаас том).
export const RULES: AssetRule[] = [
  { re: /^logo(-white)?\.png$/, w: 100, ppi: 450, why: 'formatter.ts 70pt / logo-white 100pt, semut 70pt, Studio cover_logo ≤100pt; жижиг бичигтэй тул zoom-д 450 ppi' },
  { re: /^top\.png$/, w: PAGE_W, ppi: 200, why: 'formatter.ts — хуудасны өргөн (595pt); зөөлөн чимэглэл, 200 ppi-д SSIM 0.995' },
  { re: /^icons\/header-top-white\.png$/, w: PAGE_W * 0.65, why: 'formatter.ts — хуудасны 0.65' },
  { re: /^icons\/author\.png$/, w: 48, h: 48, ppi: 300, why: 'formatter.ts iconSize = 16·authorFs/14 (≈16–34pt), empathy 16pt' },
  { re: /^icons\/disc_2_[a-z]+\.png$/, w: 24, h: 24, ppi: 300, why: 'disc.ts 16pt' },
  { re: /^icons\/clock\.png$/, w: 36, h: 36, ppi: 300, why: 'single.pdf.ts 24pt' },
  { re: /^icons\/belbin\/(?!agent)[\w-]+\.png$/, w: 60, h: 60, ppi: 250, why: 'belbin.ts 26/30/≈42/47pt, holland.ts 26pt' },
  { re: /^icons\/inapp\d\.png$/, h: 60, ppi: 300, why: 'inappropriate.ts өндөр 40pt' },
  { re: /^icons\/nicotine1\.png$/, w: (CONTENT_W / 4) * 1.25, why: 'nicotine.ts контентын 1/4 (≈129pt)' },
  { re: /^icons\/dt[13]\.jpeg$/, w: 0.3 * CONTENT_W * 1.25, why: 'darktriad.ts availableWidth·0.3 (≈150pt)' },
  { re: /^icons\/dt2\.jpeg$/, w: 0.42 * CONTENT_W * 1.2, why: 'darktriad.ts availableWidth·0.42 (≈210pt)' },
  { re: /^icons\/(grit\.jpeg|mindset4\.jpg)$/, w: 0.4 * CONTENT_W * 1.25, why: 'grit.ts / mindset.ts availableWidth·0.4 (≈200pt)' },
  {
    re: /^report\/disc\/graph\.jpeg$/,
    w: (PAGE_W / 2 - MARGIN_X) * 1.2,
    h: (PAGE_W / 2 - MARGIN_X) * 1.2,
    why: 'disc.ts page/2−marginX (≈258pt)',
  },
];

export function targetBox(rel: string): { wPx: number; hPx: number; ppi: number; why: string } {
  const r = RULES.find((x) => x.re.test(rel));
  const ppi = r?.ppi ?? ASSET_PPI;
  const wPt = r ? (r.w ?? Infinity) : PAGE_W;
  const hPt = r ? (r.h ?? Infinity) : PAGE_H;
  const px = (pt: number) => (Number.isFinite(pt) ? Math.ceil((pt * ppi) / 72) : Infinity);
  return { wPx: px(wPt), hPx: px(hPt), ppi, why: r?.why ?? 'дүрэмгүй — А4 хуудас бүтэн' };
}

export type OptimizeAction = 'copy' | 'resize' | 'drop-alpha' | 'resize+drop-alpha';

export interface OptimizeResult {
  out: Buffer;
  action: OptimizeAction;
  from: [number, number];
  to: [number, number];
}

/** Нэг asset. Өөрчлөх шаардлагагүй бол анхны Buffer-ийг (дахин encode-гүй) буцаана. */
export async function optimizeOne(input: Buffer, rel: string): Promise<OptimizeResult> {
  const meta = await sharp(input, { failOn: 'none', ignoreIcc: true }).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const copy: OptimizeResult = { out: input, action: 'copy', from: [w, h], to: [w, h] };
  if (!w || !h || (meta.format !== 'png' && meta.format !== 'jpeg')) return copy;

  const { wPx, hPx } = targetBox(rel);
  // Пикселийн тоо ≥ 20% буурахгүй бол жижигрүүлэхгүй (JPEG-ийг дэмий дахин шахахгүй).
  const scale = Math.min(1, wPx / w, hPx / h);
  const needResize = scale * scale <= MIN_PIXEL_RATIO;
  const isPalette = !!(meta.isPalette ?? meta.paletteBitDepth);
  let dropAlpha = false;
  if (meta.format === 'png' && meta.hasAlpha && !isPalette) {
    dropAlpha = (await sharp(input, { ignoreIcc: true }).stats()).isOpaque;
  }
  if (!needResize && !dropAlpha) return copy;

  let p = sharp(input, { failOn: 'none', ignoreIcc: true });
  if (needResize) {
    p = p.resize({
      width: Number.isFinite(wPx) ? wPx : undefined,
      height: Number.isFinite(hPx) ? hPx : undefined,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    });
  }
  if (dropAlpha) p = p.removeAlpha();
  p =
    meta.format === 'jpeg'
      ? p.jpeg({ quality: 88, mozjpeg: true })
      : p.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          ...(isPalette ? { palette: true, quality: 100, dither: 0 } : {}),
        });
  const { data, info } = await p.toBuffer({ resolveWithObject: true });
  // Шийдвэр PDF-д шингэх БОДИТ хэмжээгээр: PDFKit JPEG/palette/alpha-гүй PNG-ийг шахсан өгөгдлөөр нь
  // шууд, alpha-тай PNG-ийг задалж дахин шахаж шингээдэг — файлын хэмжээ үргэлж зөв заадаггүй
  // (жиш: жижигрүүлсэн ч anti-alias-ийн улмаас дахин шахалт муудаж PDF томордог). Багасаагүй бол анхныг.
  if ((await pdfCost(data)) >= (await pdfCost(input))) return copy;
  const action: OptimizeAction = needResize ? (dropAlpha ? 'resize+drop-alpha' : 'resize') : 'drop-alpha';
  return { out: data, action, from: [w, h], to: [info.width, info.height] };
}

/** Зургийг PDFKit-ээр PDF-д шингээхэд нэмэгдэх байт (хоосон PDF-тэй харьцуулахад). */
export function pdfCost(buf: Buffer): Promise<number> {
  const size = (draw: (d: any) => void) =>
    new Promise<number>((resolve, reject) => {
      const d = new PDFDocument({ size: 'A4', compress: true });
      let n = 0;
      d.on('data', (b: Buffer) => (n += b.length));
      d.on('end', () => resolve(n));
      d.on('error', reject);
      draw(d);
      d.end();
    });
  return Promise.all([size((d) => d.image(buf, 0, 0, { width: 100 })), size(() => undefined)]).then(([a, b]) => a - b);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : /\.(png|jpe?g)$/i.test(f) ? [p] : [];
  });
}

export async function optimizeAll(inDir: string, outDir: string) {
  const files = walk(inDir);
  const manifest: Record<string, any> = {};
  let bytesIn = 0;
  let bytesOut = 0;
  let changed = 0;
  for (const file of files) {
    const rel = path.relative(inDir, file).split(path.sep).join('/');
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const input = fs.readFileSync(file);
    let r: OptimizeResult;
    try {
      r = await optimizeOne(input, rel);
    } catch (e: any) {
      console.warn(`⚠️ ${rel}: ${e?.message ?? e} — анхныг нь хуулав`);
      r = { out: input, action: 'copy', from: [0, 0], to: [0, 0] };
    }
    fs.writeFileSync(dest, r.out);
    bytesIn += input.length;
    bytesOut += r.out.length;
    if (r.action !== 'copy') changed++;
    manifest[rel] = { action: r.action, from: r.from, to: r.to, bytesIn: input.length, bytesOut: r.out.length };
  }
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ ppi: ASSET_PPI, generatedAt: new Date().toISOString(), files: manifest }, null, 1),
  );
  return { files: files.length, changed, bytesIn, bytesOut, manifest };
}

if (require.main === module) {
  const inDir = path.join(process.cwd(), 'src/assets');
  const outDir = process.env.ASSETS_OUT || path.join(process.cwd(), 'src/assets_optimized');
  optimizeAll(inDir, outDir)
    .then((s) => {
      for (const [rel, m] of Object.entries<any>(s.manifest)) {
        if (m.action !== 'copy') console.log(`  ${m.action.padEnd(17)} ${rel}: ${m.from.join('×')} → ${m.to.join('×')}`);
      }
      console.log(
        `✅ assets_optimized: ${s.files} файл, ${s.changed} өөрчлөгдсөн (ppi ${ASSET_PPI}), ` +
          `${Math.round(s.bytesIn / 1024)}KB → ${Math.round(s.bytesOut / 1024)}KB`,
      );
    })
    .catch((e) => {
      // Build-ийг унагахгүй — assets_optimized байхгүй бол AssetsService анхныг ашиглана.
      console.error('❌ optimize-images:', e);
    });
}
