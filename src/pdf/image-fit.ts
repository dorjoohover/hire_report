/*
 * Studio-ийн зураг (upload хийсэн "Зураг блок", "/icons/…" icon) — 2026-10-05.
 *
 * Өмнө нь render БҮРД файлыг дахин уншиж / core-оос HTTP-ээр татаж, анхны хэмжээгээр нь (жиш:
 * 4000×3000 утасны зураг 150pt блокт) PDF-д шингээдэг байв: PDF том, render удаан, мөн буфер
 * бүр шинэ тул png-embed-cache ажилладаггүй.
 *
 * Одоо: (1) татсан эх буферыг URL-аар кэшлэнэ (TTL), (2) блокийн бодит хэмжээ × IMAGE_FIT_PPI-д
 * (default 250) тааруулж жижигрүүлнэ (томруулахгүй), үр дүнг (URL, px хэмжээ)-ээр кэшлэнэ → ижил
 * Buffer объект → document хооронд PNG задлалт ч давтагдахгүй. PDFKit-ийн дэмждэггүй формат
 * (webp/gif/svg) → PNG. Алдаа гарвал анхны буферыг буцаана (өмнөх зан төлөв).
 * IMAGE_FIT=0 → зөвхөн эх буферын кэш, хэмжээ өөрчлөхгүй.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

const PPI = Number(process.env.IMAGE_FIT_PPI ?? 250);
// sharp бодитоор ачаалагдсан эсэх (spec-lite-ийн stub-native.js нь Proxy-оор орлуулдаг — тэр үед алгасна).
const SHARP_OK = (() => {
  try {
    return typeof sharp?.versions?.vips === 'string';
  } catch {
    return false;
  }
})();
const TTL_MS = Number(process.env.IMAGE_CACHE_TTL_MS ?? 30 * 60 * 1000);
const MAX_ENTRIES = 300;
const MAX_BYTES = 200 * 1024 * 1024;

type Entry = { buf: Buffer; exp: number; bytes: number };

class LruCache {
  private map = new Map<string, Entry>();
  private bytes = 0;
  get(key: string): Buffer | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, e); // LRU: сүүлд ашигласныг төгсгөлд
    return e.buf;
  }
  set(key: string, buf: Buffer) {
    this.delete(key);
    this.map.set(key, { buf, exp: Date.now() + TTL_MS, bytes: buf.length });
    this.bytes += buf.length;
    while (this.map.size > MAX_ENTRIES || this.bytes > MAX_BYTES) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.delete(oldest);
    }
  }
  delete(key: string) {
    const e = this.map.get(key);
    if (e) {
      this.bytes -= e.bytes;
      this.map.delete(key);
    }
  }
  clear() {
    this.map.clear();
    this.bytes = 0;
  }
  get size() {
    return this.map.size;
  }
}

const raw = new LruCache();
const fitted = new LruCache();
const inflight = new Map<string, Promise<Buffer>>();
export const imageFitStats = { rawHits: 0, rawMisses: 0, fitHits: 0, fitMisses: 0, resized: 0, converted: 0 };

/** Эх буфер (URL-аар кэш, зэрэг дуудлагыг нэгтгэнэ). */
export async function cachedSource(url: string, load: () => Promise<Buffer>): Promise<Buffer> {
  const hit = raw.get(url);
  if (hit) {
    imageFitStats.rawHits++;
    return hit;
  }
  const pending = inflight.get(url);
  if (pending) return pending;
  imageFitStats.rawMisses++;
  const p = load()
    .then((buf) => {
      raw.set(url, buf);
      return buf;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

/** Блокийн хайрцаг (pt) — px руу; PPI-ээр. */
export function boxPx(wPt: number, hPt: number, ppi = PPI) {
  return { w: Math.max(1, Math.ceil((wPt * ppi) / 72)), h: Math.max(1, Math.ceil((hPt * ppi) / 72)) };
}

/**
 * `src`-ийг wPt×hPt хайрцагт (fit: inside) харагдахад хангалттай хэмжээ хүртэл жижигрүүлнэ.
 * key = эх URL (кэшийн түлхүүр). Хэмжээ хангалттай, формат PDFKit-д тохирох бол эх буферыг буцаана.
 */
export async function fitForBox(key: string, src: Buffer, wPt: number, hPt: number): Promise<Buffer> {
  if (!SHARP_OK || process.env.IMAGE_FIT === '0' || !(wPt > 0) || !(hPt > 0)) return src;
  const { w: bw, h: bh } = boxPx(wPt, hPt);
  const ck = `${key}|${bw}x${bh}`;
  const hit = fitted.get(ck);
  if (hit) {
    imageFitStats.fitHits++;
    return hit;
  }
  imageFitStats.fitMisses++;
  let out = src;
  try {
    const meta = await sharp(src, { failOn: 'none', ignoreIcc: true }).metadata();
    const rotated = (meta.orientation ?? 1) >= 5; // EXIF 5–8: өргөн/өндөр солигдоно
    const w = (rotated ? meta.height : meta.width) ?? 0;
    const h = (rotated ? meta.width : meta.height) ?? 0;
    const supported = meta.format === 'png' || meta.format === 'jpeg';
    const scale = w && h ? Math.min(1, bw / w, bh / h) : 1;
    // ≥ 20% цөөн пиксел болохгүй бол дахин encode хийхгүй (JPEG чанар хадгална).
    const needResize = scale * scale <= 0.8;
    if (needResize || !supported) {
      let p = sharp(src, { failOn: 'none', ignoreIcc: true }).rotate(); // EXIF чиглэлийг пикселд шингээнэ (дахин encode-д EXIF алга болно)
      if (needResize) p = p.resize({ width: bw, height: bh, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' });
      const isPalette = !!(meta.isPalette ?? meta.paletteBitDepth);
      p =
        meta.format === 'jpeg'
          ? p.jpeg({ quality: 88, mozjpeg: true })
          : p.png({ compressionLevel: 6, adaptiveFiltering: true, ...(isPalette ? { palette: true, quality: 100, dither: 0 } : {}) });
      out = await p.toBuffer();
      if (needResize) imageFitStats.resized++;
      if (!supported) imageFitStats.converted++;
    }
  } catch (e: any) {
    console.warn(`[image-fit] ${key.slice(0, 120)}: ${e?.message ?? e} — эх зургаар`);
    out = src;
  }
  fitted.set(ck, out);
  return out;
}

/** Тест / ops: кэшийг цэвэрлэх. */
export function clearImageFitCache() {
  raw.clear();
  fitted.clear();
  inflight.clear();
  for (const k of Object.keys(imageFitStats)) (imageFitStats as any)[k] = 0;
}
