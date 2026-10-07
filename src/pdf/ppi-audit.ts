import { assetNameOf } from '../assets_service/asset-file';

/*
 * Render үеийн нягтралын шалгалт (2026-10-05): asset (AssetsService / assetPath) зураг тайланд
 * REPORT_MIN_PPI-ээс (default 150) бага нягтралтай зурагдвал НЭГ удаа анхааруулна. assets_optimized-ийн
 * хэмжээ (scripts/optimize-images.ts RULES) аль нэг байрлалд хэт жижиг болсныг prod логоос илрүүлнэ.
 * REPORT_MIN_PPI=0 → унтраана.
 */
const MIN_PPI = Number(process.env.REPORT_MIN_PPI ?? 150);
const warned = new Set<string>();

/** PDFKit doc.image()-ийн хэмжээний дүрэмтэй ижил: зурагдах хэмжээнд ногдох ppi (хоёр тэнхлэгийн бага нь). */
export function effectivePpi(iw: number, ih: number, o: any): number {
  let w: number;
  let h: number;
  if (o?.width && o?.height) {
    w = o.width;
    h = o.height;
  } else if (o?.width) {
    w = o.width;
    h = (w * ih) / iw;
  } else if (o?.height) {
    h = o.height;
    w = (h * iw) / ih;
  } else if (Array.isArray(o?.fit)) {
    const s = Math.min(o.fit[0] / iw, o.fit[1] / ih);
    w = iw * s;
    h = ih * s;
  } else if (Array.isArray(o?.cover)) {
    const s = Math.max(o.cover[0] / iw, o.cover[1] / ih);
    w = iw * s;
    h = ih * s;
  } else if (o?.scale) {
    w = iw * o.scale;
    h = ih * o.scale;
  } else {
    w = iw;
    h = ih;
  }
  return Math.min(iw / w, ih / h) * 72;
}

/** doc.image(src, ...args) дуудлага бүрд (createBaseDoc-ийн wrapper). Хурдан — asset биш бол шууд буцна. */
export function auditImagePpi(src: unknown, img: { width?: number; height?: number }, args: any[]): void {
  if (!(MIN_PPI > 0)) return;
  const name = assetNameOf(src);
  if (!name || !img?.width || !img?.height) return;
  const o = args.find((a) => a && typeof a === 'object' && !Array.isArray(a));
  const ppi = effectivePpi(img.width, img.height, o);
  if (!Number.isFinite(ppi) || ppi >= MIN_PPI) return;
  const key = `${name}@${Math.round(ppi)}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(
    `⚠️ LOW_PPI ${name}: ${img.width}×${img.height}px ≈ ${Math.round(ppi)} ppi (< ${MIN_PPI}) — ` +
      'scripts/optimize-images.ts RULES-д энэ asset-ийн хэмжээг томруул (эсвэл ASSETS_OPTIMIZED=0)',
  );
}
