// ─────────────────────────────────────────────────────────────────────────────
// Studio "table" блокийн (гараар үүсгэх хүснэгт) цэвэр туслах функцүүд —
// studio/lib/table.ts-ийн buildAnchorMap()/spanOf()-той ЯГ адил дүрэм
// (өөр service тул давхардуулав — 2 талд өөрчлөлт хийхдээ синк байлгах).
// Зурах хэсэг нь dynamic-template.renderer.ts-ийн renderTable().
// ─────────────────────────────────────────────────────────────────────────────

export interface TableCell {
  text: string;
  weight?: 'normal' | 'bold' | 'black';
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  fontSize?: number;
  colSpan?: number;
  rowSpan?: number;
  borders?: { t?: boolean; r?: boolean; b?: boolean; l?: boolean };
}

export interface TableConfig {
  colWidths: number[];
  rowHeights: number[];
  rows: TableCell[][];
  headerRows: number;
  headerBg: string;
  headerColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
  padding: number;
  stripe?: string;
}

export function buildAnchorMap(t: TableConfig): [number, number][][] {
  const R = t.rows.length;
  const C = t.colWidths.length;
  const map: ([number, number] | null)[][] = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => null),
  );
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (map[r][c]) continue;
      const cell = t.rows[r]?.[c] || { text: '' };
      const rs = Math.max(1, Math.min(cell.rowSpan || 1, R - r));
      let cs = Math.max(1, Math.min(cell.colSpan || 1, C - c));
      for (let k = 1; k < cs; k++)
        if (map[r][c + k]) {
          cs = k;
          break;
        }
      for (let i = 0; i < rs; i++)
        for (let k = 0; k < cs; k++) if (!map[r + i][c + k]) map[r + i][c + k] = [r, c];
    }
  }
  return map as [number, number][][];
}

export function spanOf(t: TableConfig, map: [number, number][][], r: number, c: number) {
  let rs = 1;
  while (r + rs < t.rows.length && map[r + rs][c]?.[0] === r && map[r + rs][c]?.[1] === c) rs++;
  let cs = 1;
  while (c + cs < t.colWidths.length && map[r][c + cs]?.[0] === r && map[r][c + cs]?.[1] === c) cs++;
  return { rs, cs };
}

export interface TableAnchor {
  r: number;
  c: number;
  rs: number;
  cs: number;
  cell: TableCell;
}

export function listAnchors(t: TableConfig): TableAnchor[] {
  const map = buildAnchorMap(t);
  const out: TableAnchor[] = [];
  for (let r = 0; r < t.rows.length; r++)
    for (let c = 0; c < t.colWidths.length; c++) {
      const a = map[r][c];
      if (a && a[0] === r && a[1] === c) {
        const { rs, cs } = spanOf(t, map, r, c);
        out.push({ r, c, rs, cs, cell: t.rows[r][c] || { text: '' } });
      }
    }
  return out;
}

export function cellVisual(t: TableConfig, cell: TableCell, r: number, baseColor: string) {
  const isHeader = r < (t.headerRows || 0);
  const bodyIndex = r - (t.headerRows || 0);
  const bg = cell.bg || (isHeader ? t.headerBg : t.stripe && bodyIndex % 2 === 1 ? t.stripe : '') || '';
  const color = cell.color || (isHeader ? t.headerColor : baseColor);
  return { bg, color, weight: cell.weight || 'normal' };
}

// Нүдний хүрээ тал тус бүрээр — anchor нүд өөрийн БАРУУН, ДООД талыг (1-р мөрөнд ДЭЭД,
// 1-р баганад ЗҮҮН талыг ч) зурна. Хоёр нүдний дундах шугам аль нэг нүд нь нуусан
// (borders.t/r/b/l === false) бол харагдахгүй. studio/lib/table.ts ↔ hire_report/src/pdf/table-block.ts — ЯГ АДИЛ.
export function cellEdges(
  t: TableConfig,
  map: [number, number][][],
  r: number,
  c: number,
  rs: number,
  cs: number,
): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
  const R = t.rows.length;
  const C = t.colWidths.length;
  const own = t.rows[r]?.[c]?.borders || {};
  const anchorAt = (rr: number, cc: number) => {
    const a = map[rr]?.[cc];
    return a ? t.rows[a[0]]?.[a[1]] : null;
  };
  let right = own.r !== false;
  if (right && c + cs < C)
    for (let i = r; i < r + rs; i++)
      if (anchorAt(i, c + cs)?.borders?.l === false) {
        right = false;
        break;
      }
  let bottom = own.b !== false;
  if (bottom && r + rs < R)
    for (let k = c; k < c + cs; k++)
      if (anchorAt(r + rs, k)?.borders?.t === false) {
        bottom = false;
        break;
      }
  return { top: r === 0 && own.t !== false, left: c === 0 && own.l !== false, right, bottom };
}
