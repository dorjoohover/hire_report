// ─────────────────────────────────────────────────────────────────────────────
// 'chips' блок — хүрээтэй, дугуй булантай шошгонууд ('Нойргүйдэл', 'Сэтгэл түгшилт' …).
// Нэг мөр = нэг шошго. {{хувьсагч}} орно: утга нь хоосон бол тэр шошго ГАРАХГҮЙ (нөхцөлт
// хувьсагчаар зөвхөн илэрсэн асуудлуудыг харуулна), олон мөр утгатай бол мөр бүр тусдаа шошго.
// Мөр дүүрвэл дараагийн мөрөнд шилжинэ; блокийн өргөнөөс урт шошгон дотор текст ороогдоно.
//
// Геометрийг (chipsLayout) энд НЭГ удаа тооцно — Studio (ChipsView) ба hire_report (renderChips)
// ижил байрлалд зурна, зөвхөн текстийн өргөн хэмжигч (measure) нь тус тусын орчных.
// studio/lib/chips.ts ↔ hire_report/src/pdf/chips.ts — ЯГ АДИЛ.
// ─────────────────────────────────────────────────────────────────────────────

export type ChipsAlign = 'left' | 'center' | 'right';

export interface ChipsConfig {
  items: string; // нэг мөр = нэг шошго
  fontSize: number;
  bold: boolean;
  textColor: string;
  fill: string; // 'transparent' / хоосон = дүүргэлтгүй
  borderColor: string;
  borderWidth: number; // 0 = хүрээгүй
  radius: number; // булан (шошгоны өндрийн хагасаас ихгүй)
  padX: number; // хүрээнээс текст хүртэлх хэвтээ зай
  padY: number; // босоо зай
  gapX: number; // шошго хоорондын зай
  gapY: number; // мөр хоорондын зай
  align: ChipsAlign;
}

// Gilroy: (ascent − descent + lineGap) / unitsPerEm — бусад текст блоктой ижил мөрийн өндөр.
export const CHIPS_LINE_HEIGHT = 1.213;

export function defaultChipsConfig(): ChipsConfig {
  return {
    items: 'Нойргүйдэл\nСэтгэл түгшилт\nАйдас\nСэтгэл гутрал',
    fontSize: 11,
    bold: false,
    textColor: '#1F2937',
    fill: '#FFF4EE',
    borderColor: '#E8692E',
    borderWidth: 1,
    radius: 8,
    padX: 10,
    padY: 6,
    gapX: 8,
    gapY: 8,
    align: 'left',
  };
}

const num = (v: unknown, d: number, min: number, max: number) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

export function normalizeChips(c: Partial<ChipsConfig> | null | undefined): ChipsConfig {
  const d = defaultChipsConfig();
  return {
    items: typeof c?.items === 'string' ? c.items : d.items,
    fontSize: num(c?.fontSize, d.fontSize, 4, 72),
    bold: !!c?.bold,
    textColor: String(c?.textColor || d.textColor),
    fill: c?.fill === '' ? '' : String(c?.fill || d.fill),
    borderColor: String(c?.borderColor || d.borderColor),
    borderWidth: num(c?.borderWidth, d.borderWidth, 0, 10),
    radius: num(c?.radius, d.radius, 0, 500),
    padX: num(c?.padX, d.padX, 0, 100),
    padY: num(c?.padY, d.padY, 0, 100),
    gapX: num(c?.gapX, d.gapX, 0, 200),
    gapY: num(c?.gapY, d.gapY, 0, 200),
    align: c?.align === 'center' || c?.align === 'right' ? c.align : 'left',
  };
}

export const chipsHasFill = (cfg: ChipsConfig) => !!cfg.fill && cfg.fill.toLowerCase() !== 'transparent';

// Шошгоны жагсаалт: мөр бүрийг resolve() (token) → дахин мөрөөр хувааж, хоосныг хасна.
export function chipItems(items: string, resolve?: (s: string) => string): string[] {
  const out: string[] = [];
  for (const raw of String(items || '').split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const v = resolve ? resolve(raw) : raw;
    for (const part of String(v ?? '').split(/\r?\n/)) {
      const t = part.replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
    }
  }
  return out;
}

export interface ChipBox {
  text: string;
  lines: string[];
  x: number; // блокийн зүүн дээд булангаас
  y: number;
  w: number;
  h: number;
}

// Текстийг maxW-д багтаан үгээр ороох (хэт урт үгийг тэмдэгтээр таслана).
function wrapText(text: string, maxW: number, measure: (t: string) => number): string[] {
  const lines: string[] = [];
  let cur = '';
  const pushWord = (word: string) => {
    if (measure(word) <= maxW) {
      cur = word;
      return;
    }
    let piece = '';
    for (const ch of word) {
      if (piece && measure(piece + ch) > maxW) {
        lines.push(piece);
        piece = ch;
      } else piece += ch;
    }
    cur = piece;
  };
  for (const word of text.split(' ')) {
    if (!cur) pushWord(word);
    else if (measure(cur + ' ' + word) <= maxW) cur += ' ' + word;
    else {
      lines.push(cur);
      pushWord(word);
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [text];
}

// Шошгонуудын байрлал (блокийн дотор) ба нийт өндөр.
export function chipsLayout(
  items: string[],
  width: number,
  cfg: ChipsConfig,
  measure: (t: string) => number,
): { boxes: ChipBox[]; height: number } {
  const W = Math.max(1, width);
  const lineH = cfg.fontSize * CHIPS_LINE_HEIGHT;
  const insetX = cfg.padX + cfg.borderWidth;
  const insetY = cfg.padY + cfg.borderWidth;
  const maxText = Math.max(1, W - 2 * insetX);
  const rows: ChipBox[][] = [];
  let row: ChipBox[] = [];
  let x = 0;
  for (const text of items) {
    const tw = measure(text);
    const lines = tw <= maxText ? [text] : wrapText(text, maxText, measure);
    const textW = lines.length === 1 ? Math.min(tw, maxText) : Math.max(...lines.map((l) => Math.min(measure(l), maxText)));
    const w = Math.min(W, textW + 2 * insetX);
    const h = lines.length * lineH + 2 * insetY;
    if (row.length && x + w > W + 0.01) {
      rows.push(row);
      row = [];
      x = 0;
    }
    row.push({ text, lines, x, y: 0, w, h });
    x += w + cfg.gapX;
  }
  if (row.length) rows.push(row);
  const boxes: ChipBox[] = [];
  let y = 0;
  rows.forEach((r, i) => {
    const rowW = r[r.length - 1].x + r[r.length - 1].w;
    const off = cfg.align === 'center' ? (W - rowW) / 2 : cfg.align === 'right' ? W - rowW : 0;
    const rowH = Math.max(...r.map((b) => b.h));
    for (const b of r) boxes.push({ ...b, x: b.x + off, y });
    y += rowH + (i < rows.length - 1 ? cfg.gapY : 0);
  });
  return { boxes, height: y };
}

// Шошгоны булан — өндөр/өргөний хагасаас ихгүй (их утга = бүтэн дугуй 'pill').
export const chipRadius = (cfg: ChipsConfig, b: ChipBox) => Math.max(0, Math.min(cfg.radius, b.h / 2, b.w / 2));
