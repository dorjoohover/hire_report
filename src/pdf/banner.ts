// ─────────────────────────────────────────────────────────────────────────────
// 'banner' блок — градиент дэвсгэртэй, дугуй булантай баннер: зүүн талд лого,
// баруун талд нь гарчиг (тод) + дэд гарчиг, баруун захад тунгалаг тойргууд (чимэглэл).
//   ЗӨВ ХҮН, ЗӨВ ГАЗАРТ / Зан төлөв, чадамж, мэргэжил, ур чадварын тест, өөрийн үнэлгээ
// Хэмжээ = block.width × block.height. Гарчиг/дэд гарчигт {{хувьсагч}} орно.
//
// Геометрийг (bannerLayout) энд НЭГ удаа тооцно — Studio (BannerView) ба hire_report
// (renderBanner) ижил байрлалд зурна, зөвхөн текстийн өргөн хэмжигч нь тус тусын орчных.
// studio/lib/banner.ts ↔ hire_report/src/pdf/banner.ts — ЯГ АДИЛ.
// ─────────────────────────────────────────────────────────────────────────────

export type BannerLogo = 'hire-white' | 'none' | 'custom';
export type BannerDirection = 'horizontal' | 'vertical';

export interface BannerConfig {
  colorFrom: string;
  colorTo: string;
  direction: BannerDirection;
  radius: number;
  logo: BannerLogo; // 'hire-white' = Hire.mn цагаан лого (assets/logo-white.png)
  logoUrl: string; // logo = 'custom' үед upload хийсэн зураг
  logoWidth: number; // логоны хайрцгийн өргөн (зураг харьцаагаа хадгалан багтана)
  padX: number; // зүүн/баруун дотор зай
  padY: number; // дээд/доод дотор зай (лого, текстийн хамгийн их өндөр)
  gap: number; // лого ба текстийн хоорондох зай
  divider: boolean; // лого ба текстийн хооронд нимгэн босоо шугам
  title: string;
  titleSize: number;
  titleColor: string;
  subtitle: string;
  subtitleSize: number;
  subtitleColor: string;
  textGap: number; // гарчиг ба дэд гарчгийн хооронд
  decor: boolean; // баруун захын тунгалаг тойргууд
  decorOpacity: number;
}

// Gilroy: (ascent − descent + lineGap) / unitsPerEm — бусад текст блоктой ижил мөрийн өндөр.
export const BANNER_LINE_HEIGHT = 1.213;

export function defaultBannerConfig(): BannerConfig {
  return {
    colorFrom: '#E8692E',
    colorTo: '#D63B4A',
    direction: 'horizontal',
    radius: 12,
    logo: 'hire-white',
    logoUrl: '',
    logoWidth: 88,
    padX: 24,
    padY: 14,
    gap: 22,
    divider: false,
    title: 'ЗӨВ ХҮН, ЗӨВ ГАЗАРТ',
    titleSize: 18,
    titleColor: '#FFFFFF',
    subtitle: 'Зан төлөв, чадамж, мэргэжил, ур чадварын тест, өөрийн үнэлгээ',
    subtitleSize: 9,
    subtitleColor: '#FFFFFF',
    textGap: 3,
    decor: true,
    decorOpacity: 0.1,
  };
}

const num = (v: unknown, d: number, min: number, max: number) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);

export function normalizeBanner(c: Partial<BannerConfig> | null | undefined): BannerConfig {
  const d = defaultBannerConfig();
  const logo: BannerLogo = c?.logo === 'none' || c?.logo === 'custom' ? c.logo : 'hire-white';
  return {
    colorFrom: String(c?.colorFrom || d.colorFrom),
    colorTo: String(c?.colorTo || c?.colorFrom || d.colorTo),
    direction: c?.direction === 'vertical' ? 'vertical' : 'horizontal',
    radius: num(c?.radius, d.radius, 0, 200),
    logo,
    logoUrl: str(c?.logoUrl, ''),
    logoWidth: num(c?.logoWidth, d.logoWidth, 10, 400),
    padX: num(c?.padX, d.padX, 0, 200),
    padY: num(c?.padY, d.padY, 0, 200),
    gap: num(c?.gap, d.gap, 0, 200),
    divider: !!c?.divider,
    title: str(c?.title, d.title),
    titleSize: num(c?.titleSize, d.titleSize, 4, 72),
    titleColor: String(c?.titleColor || d.titleColor),
    subtitle: str(c?.subtitle, d.subtitle),
    subtitleSize: num(c?.subtitleSize, d.subtitleSize, 4, 72),
    subtitleColor: String(c?.subtitleColor || d.subtitleColor),
    textGap: num(c?.textGap, d.textGap, 0, 100),
    decor: c?.decor === undefined ? d.decor : !!c.decor,
    decorOpacity: num(c?.decorOpacity, d.decorOpacity, 0, 1),
  };
}

export const bannerHasLogo = (cfg: BannerConfig) => cfg.logo === 'hire-white' || (cfg.logo === 'custom' && !!cfg.logoUrl);

// Текстийг maxW-д багтаан үгээр ороох (хэт урт үгийг тэмдэгтээр таслана).
function wrap(text: string, maxW: number, measure: (t: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let cur = '';
    const push = (word: string) => {
      if (measure(word) <= maxW) {
        cur = word;
        return;
      }
      let piece = '';
      for (const ch of word) {
        if (piece && measure(piece + ch) > maxW) {
          out.push(piece);
          piece = ch;
        } else piece += ch;
      }
      cur = piece;
    };
    for (const w of para.split(' ').filter((x) => x !== '')) {
      if (!cur) push(w);
      else if (measure(cur + ' ' + w) <= maxW) cur += ' ' + w;
      else {
        out.push(cur);
        push(w);
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

export interface BannerLine {
  text: string;
  x: number;
  y: number; // мөрийн хайрцгийн дээд ирмэг (өндөр = size × BANNER_LINE_HEIGHT)
  size: number;
}
export interface BannerLayout {
  logo: { x: number; y: number; w: number; h: number } | null;
  divider: { x: number; y1: number; y2: number } | null;
  title: BannerLine[];
  subtitle: BannerLine[];
  circles: { cx: number; cy: number; r: number }[];
}

export function bannerLayout(
  W: number,
  H: number,
  cfg: BannerConfig,
  title: string,
  subtitle: string,
  measureTitle: (t: string) => number,
  measureSub: (t: string) => number,
): BannerLayout {
  const hasLogo = bannerHasLogo(cfg);
  const innerH = Math.max(1, H - 2 * cfg.padY);
  const logo = hasLogo ? { x: cfg.padX, y: cfg.padY, w: cfg.logoWidth, h: innerH } : null;
  const textX = hasLogo ? cfg.padX + cfg.logoWidth + cfg.gap : cfg.padX;
  const textW = Math.max(1, W - textX - cfg.padX);
  const tLines = title.trim() ? wrap(title.trim(), textW, measureTitle) : [];
  const sLines = subtitle.trim() ? wrap(subtitle.trim(), textW, measureSub) : [];
  const tLh = cfg.titleSize * BANNER_LINE_HEIGHT;
  const sLh = cfg.subtitleSize * BANNER_LINE_HEIGHT;
  const blockH = tLines.length * tLh + (tLines.length && sLines.length ? cfg.textGap : 0) + sLines.length * sLh;
  let y = (H - blockH) / 2;
  const titleOut = tLines.map((text, i) => ({ text, x: textX, y: y + i * tLh, size: cfg.titleSize }));
  y += tLines.length * tLh + (tLines.length && sLines.length ? cfg.textGap : 0);
  const subOut = sLines.map((text, i) => ({ text, x: textX, y: y + i * sLh, size: cfg.subtitleSize }));
  const divider = hasLogo && cfg.divider ? { x: cfg.padX + cfg.logoWidth + cfg.gap / 2, y1: cfg.padY, y2: H - cfg.padY } : null;
  // Баруун захын чимэглэл — блокийн хэлбэрээр (бөөрөнхий булантай тэгш өнцөгтөөр) тайрагдана.
  const circles = cfg.decor
    ? [
        { cx: W - H * 1.05, cy: H * 0.2, r: H * 0.55 },
        { cx: W - H * 0.25, cy: H * 0.95, r: H * 0.75 },
      ]
    : [];
  return { logo, divider, title: titleOut, subtitle: subOut, circles };
}
