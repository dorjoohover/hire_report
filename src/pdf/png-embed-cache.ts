/*
 * PDFKit PNG embed-ийн процесс хоорондын (document хоорондын) кэш — 2026-10-05.
 *
 * Asуудал: alpha-тай (RGBA/GA), indexed+tRNS эсвэл interlaced PNG-г PDFKit document БҮРД
 * png-js-ээр задлаад (inflate + filter), alpha-г салгаж, 2 удаа zlib.deflateSync хийдэг.
 * Тайлангийн толгойн 3258×912 RGBA зураг гэх мэт статик asset-ууд тайлан бүрд дахин
 * задлагдаж render worker-ийн CPU-ийн ~40%-ийг (finalize-ийн ихэнх хэсэг) иддэг байв.
 *
 * Шийдэл: задалсны дараах PDF-д бичигдэх бэлэн өгөгдлийг (deflate хийсэн imgData /
 * alphaChannel) эх PNG Buffer-ийн identity-гаар WeakMap-д хадгалж, дараагийн document-д
 * шууд finalize хийнэ. Гаралтын PDF байт ИЖИЛ (deflate детерминистик, өгөгдөл өөрчлөгдөхгүй).
 * AssetsService ижил Buffer объектыг буцаадаг тул статик зургууд кэшлэгдэнэ; chart мэт
 * render бүрд шинэ Buffer → WeakMap хит хийхгүй, GC-д чөлөөлөгдөнө (санах ойн алдагдалгүй).
 * PDFKit-ийн дотоод API-д (PNGImage прототип) тулгуурладаг тул бүтэц өөрчлөгдвөл
 * ажиллахгүй болж (warn) хуучнаараа явна — PNG_EMBED_CACHE=0 бол унтраана.
 */
// 1×1 RGBA PNG — PNGImage класс (прототип)-ыг олоход л хэрэглэнэ.
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

type Entry = { imgData?: Buffer; alphaChannel?: Buffer };
const METHODS = ['splitAlphaChannel', 'loadIndexedAlphaChannel', 'decodeData'] as const;

let installed = false;
export const pngEmbedCacheStats = { hits: 0, misses: 0 };

export function installPngEmbedCache(PDFDocument: any): boolean {
  if (installed) return true;
  installed = true;
  if (process.env.PNG_EMBED_CACHE === '0') return false;
  try {
    const probe = new PDFDocument({ autoFirstPage: false });
    const proto = Object.getPrototypeOf(probe.openImage(Buffer.from(TINY_PNG, 'base64')));
    if (!proto || typeof proto.finalize !== 'function' || METHODS.some((m) => typeof proto[m] !== 'function')) {
      console.warn('⚠️ png-embed-cache: PDFKit PNGImage бүтэц өөр — кэшгүй ажиллана');
      return false;
    }
    const cache = new WeakMap<Buffer, Partial<Record<(typeof METHODS)[number], Entry>>>();
    for (const m of METHODS) {
      const orig = proto[m];
      proto[m] = function (this: any) {
        const key: Buffer | undefined = this.image?.data;
        if (!Buffer.isBuffer(key)) return orig.call(this);
        const hit = cache.get(key)?.[m];
        if (hit) {
          pngEmbedCacheStats.hits++;
          if (hit.imgData) this.imgData = hit.imgData;
          if (hit.alphaChannel) this.alphaChannel = hit.alphaChannel;
          return this.finalize();
        }
        pngEmbedCacheStats.misses++;
        // Энэ instance-ийн finalize-ийг нэг удаа барьж (өгөгдөл бэлэн болсон агшин) кэшлэнэ.
        this.finalize = function (this: any) {
          delete this.finalize;
          const e: Entry = {};
          if (m !== 'loadIndexedAlphaChannel' && Buffer.isBuffer(this.imgData)) e.imgData = this.imgData;
          if (Buffer.isBuffer(this.alphaChannel)) e.alphaChannel = this.alphaChannel;
          const byMethod = cache.get(key) ?? {};
          byMethod[m] = e;
          cache.set(key, byMethod);
          return proto.finalize.call(this);
        };
        return orig.call(this);
      };
    }
    return true;
  } catch (e: any) {
    console.warn('⚠️ png-embed-cache суулгаж чадсангүй:', e?.message ?? e);
    return false;
  }
}
