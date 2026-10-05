/*
 * fontkit-ийн "decode хийж чадаагүй" хүснэгтийг кэшлэх — 2026-10-05.
 *
 * Асуудал: Gilroy-*.ttf бүгд 64 байтын эвдэрхий GDEF хүснэгттэй (markAttachClassDef offset нь
 * толгой дотор заадаг). fontkit `_getTable()` decode-ийг try/catch-аар оролдож, амжилтгүй
 * болбол `undefined` буцаадаг ч ҮР ДҮНГ НЬ КЭШЛЭДЭГГҮЙ. Харин layout нь `font.GDEF`-ийг глиф
 * бүрийн `id` тохируулахад (GlyphInfo) болон GPOS байрлал бүрд (applyPositionValue) уншдаг тул
 * GDEF-ийг дахин дахин decode хийж (restructure Struct._setup/decode) алдаа шиддэг байв.
 * Үр дүн: үг бүрийн layout ~1ms, DISC тайлан (олон мянган үг) render-ийн ~70% нь энэ —
 * k6-аар DISC render ~3.9с, profile-д `restructure` 64%.
 *
 * Шийдэл: decode амжилтгүй болсон (`undefined`) хүснэгтийг `_tables`-д `undefined`-ээр
 * тэмдэглэнэ → дараагийн уншилт шууд `undefined` (өмнөхтэй ЯГ ИЖИЛ утга) буцаана. Гаралт
 * өөрчлөгдөхгүй: GDEF-гүй гэж үзсэн хуучин үйлдэл хэвээр, зөвхөн давтагдсан ажил арилна.
 *
 * ⚠️ fontkit нь хүснэгтийн getter-ийг font үүсэх үед `this._getTable.bind(this, table)`-ээр
 * холбодог тул энэ patch-ийг ЯМАР Ч font үүсэхээс ӨМНӨ (module ачаалах үед) суулгана.
 * pdfkit-ийн ашигладаг fontkit instance-ийг pdfkit-ийн байрлалаас resolve хийнэ.
 * Унтраах: FONTKIT_TABLE_CACHE=0.
 */
import { readFileSync } from 'fs';
import { dirname } from 'path';

let installed = false;
export const fontkitTableCacheStats = { cachedFailures: 0 };

export function installFontkitTableCache(probeFontPath: string): boolean {
  if (installed) return true;
  installed = true;
  if (process.env.FONTKIT_TABLE_CACHE === '0') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fontkit = require(require.resolve('fontkit', { paths: [dirname(require.resolve('pdfkit'))] }));
    const probe = fontkit.create(readFileSync(probeFontPath));
    const proto = Object.getPrototypeOf(probe);
    if (!proto || typeof proto._getTable !== 'function' || typeof probe._tables !== 'object') {
      console.warn('⚠️ fontkit-table-cache: fontkit-ийн бүтэц өөр — кэшгүй ажиллана');
      return false;
    }
    const orig = proto._getTable;
    proto._getTable = function (this: any, table: any) {
      const value = orig.call(this, table);
      if (value === undefined && table && typeof table.tag === 'string' && !(table.tag in this._tables)) {
        this._tables[table.tag] = undefined;
        fontkitTableCacheStats.cachedFailures++;
      }
      return value;
    };
    return true;
  } catch (err) {
    console.warn('⚠️ fontkit-table-cache суулгаж чадсангүй — кэшгүй ажиллана:', (err as Error)?.message);
    return false;
  }
}
