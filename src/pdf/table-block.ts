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
