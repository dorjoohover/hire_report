// ─────────────────────────────────────────────────────────────────────────────
// 'custom-chart' блок — нэр, утгыг ГАРААР өгдөг диаграм: цагираг (doughnut),
// бүтэн дугуй (pie), багана (bar). Утга нь илэрхийлэл ({{question[12].point}} * 8,
// {{1-р дэд бүлгийн оноо}}, 40 …) — evalNumberExpression-оор бодогдоно.
//
// Геометрийг энд НЭГ удаа тооцоолж 'зурах жагсаалт' (ChartPrim[]) болгоно —
// Studio (SVG) болон hire_report (PDFKit) хоёулаа яг ижил жагсаалтыг зурна.
// hire_report/src/pdf/custom-chart.ts ↔ studio/lib/customChart.ts — ЯГ АДИЛ.
// ─────────────────────────────────────────────────────────────────────────────

export type CustomChartKind = 'doughnut' | 'pie' | 'bar';
export type CustomChartLabelMode = 'outside' | 'legend' | 'none';

export interface CustomChartItem {
  label: string;
  value: string; // илэрхийлэл
  color: string;
}

export interface CustomChartConfig {
  kind: CustomChartKind;
  title: string;
  titleFontSize: number;
  titleColor: string;
  items: CustomChartItem[];
  labelFontSize: number;
  labelColor: string;
  chartHeight: number; // диаграмын талбайн өндөр (гарчиг, тайлбараас гадна)
  // Блокийн нийт өндөр (0 = автомат). Агуулгаас их бол илүү зай нь гарчиг ба
  // диаграмын ХООРОНД нэмэгдэнэ (эгнээн дэх диаграмуудын доод хэсгийг тэгшлэхэд).
  height: number;
  // Дугуй
  labelMode: CustomChartLabelMode;
  showPercent: boolean;
  innerRatio: number; // цагирагийн нүх (0 … 0.9)
  // Багана
  showValues: boolean;
  yMax: string; // хоосон = автомат; илэрхийлэл/тоо
  decimals: number;
  gridColor: string;
  axisColor: string;
}

export const CUSTOM_CHART_PALETTE = [
  '#BFCDEB',
  '#D6BFE0',
  '#E2B3A3',
  '#C8715A',
  '#A8D5BA',
  '#F2D492',
  '#9FB4C7',
  '#E8A23C',
];

export function defaultCustomChartConfig(kind: CustomChartKind = 'doughnut'): CustomChartConfig {
  return {
    kind,
    title: kind === 'bar' ? 'Идэвхгүй, суусан хугацаа' : 'Дасгал хөдөлгөөний төрлөөр',
    titleFontSize: 11,
    titleColor: '#1A1A1A',
    items:
      kind === 'bar'
        ? [{ label: '', value: '660', color: CUSTOM_CHART_PALETTE[0] }]
        : [
            { label: 'Чөлөөт цаг', value: '70', color: CUSTOM_CHART_PALETTE[0] },
            { label: 'Шилжилт хөдөлгөөн', value: '40', color: CUSTOM_CHART_PALETTE[1] },
          ],
    labelFontSize: 8,
    labelColor: '#4B5563',
    chartHeight: 150,
    height: 0,
    labelMode: 'outside',
    showPercent: true,
    innerRatio: 0.45,
    showValues: false,
    yMax: '',
    decimals: 1,
    gridColor: '#E5E7EB',
    axisColor: '#1A1A1A',
  };
}

const numOr = (v: unknown, d: number, min = -Infinity, max = Infinity) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

export function normalizeCustomChart(cfg: Partial<CustomChartConfig> | undefined | null): CustomChartConfig {
  const c: any = cfg || {};
  const kind: CustomChartKind = c.kind === 'bar' || c.kind === 'pie' ? c.kind : 'doughnut';
  const d = defaultCustomChartConfig(kind);
  const items: CustomChartItem[] = Array.isArray(c.items)
    ? c.items.map((it: any, i: number) => ({
        label: String(it?.label ?? ''),
        value: String(it?.value ?? ''),
        color: String(it?.color || CUSTOM_CHART_PALETTE[i % CUSTOM_CHART_PALETTE.length]),
      }))
    : d.items;
  return {
    ...d,
    ...c,
    kind,
    title: String(c.title ?? d.title),
    items,
    titleFontSize: numOr(c.titleFontSize, d.titleFontSize, 4, 48),
    labelFontSize: numOr(c.labelFontSize, d.labelFontSize, 4, 36),
    chartHeight: numOr(c.chartHeight, d.chartHeight, 40, 700),
    height: Math.round(numOr(c.height, 0, 0, 1200)),
    innerRatio: kind === 'pie' ? 0 : numOr(c.innerRatio, d.innerRatio, 0, 0.9),
    decimals: Math.round(numOr(c.decimals, d.decimals, 0, 4)),
    labelMode: c.labelMode === 'legend' || c.labelMode === 'none' ? c.labelMode : 'outside',
    showPercent: c.showPercent !== false,
    showValues: !!c.showValues,
    yMax: String(c.yMax ?? ''),
  };
}

// ── Зурах жагсаалт ───────────────────────────────────────────────────────────
// Бүх координат блокийн зүүн дээд булангаас (0,0). Текстийн y = мөрийн ДЭЭД ирмэг.
export type ChartPrim =
  | { k: 'text'; x: number; y: number; text: string; fs: number; bold: boolean; color: string }
  | { k: 'path'; d: string; fill: string; stroke?: string; sw?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; color: string; w: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; fill: string };

export type MeasureText = (text: string, fontSize: number, bold: boolean) => number;

export const CHART_LINE_HEIGHT = 1.213;

const f2 = (v: number) => Math.round(v * 100) / 100;

export function formatChartNumber(v: number, decimals: number): string {
  if (!Number.isFinite(v)) return '';
  const p = Math.pow(10, Math.max(0, decimals));
  return String(Math.round(v * p) / p);
}

// Үгээр мөр таслах (хэт урт үг байвал тэр чигээр нь үлдээнэ).
export function wrapChartText(text: string, maxW: number, measure: (t: string) => number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Өргөнд багтахгүй бол '…'-ээр таслана.
export function ellipsizeChartText(text: string, maxW: number, measure: (t: string) => number): string {
  const t = String(text || '');
  if (maxW <= 0) return '';
  if (measure(t) <= maxW) return t;
  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(`${t.slice(0, mid)}…`) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${t.slice(0, lo)}…` : '';
}

// 0 … max тэнхлэгийн 'гоё' алхам (1, 2, 2.5, 5 × 10^k) — ~4 хэсэг.
export function niceAxis(maxValue: number, explicitMax?: number | null): { max: number; step: number } {
  if (explicitMax != null && Number.isFinite(explicitMax) && explicitMax > 0) {
    const raw = explicitMax / 4;
    const step = niceStep(raw);
    return { max: explicitMax, step };
  }
  const m = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
  const step = niceStep(m / 4);
  return { max: Math.max(step, Math.ceil(m / step - 1e-9) * step), step };
}
function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / e;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return n * e;
}

export function customChartDisplay(
  width: number,
  cfg: CustomChartConfig,
  values: (number | null)[],
  measure: MeasureText,
  yMaxValue?: number | null,
): { prims: ChartPrim[]; height: number } {
  const prims: ChartPrim[] = [];
  const W = Math.max(40, width);
  let y = 0;
  const title = (cfg.title || '').trim();
  if (title) {
    const fs = cfg.titleFontSize;
    const lines = wrapChartText(title, W, (t) => measure(t, fs, true));
    for (const line of lines) {
      prims.push({ k: 'text', x: f2((W - measure(line, fs, true)) / 2), y: f2(y), text: line, fs, bold: true, color: cfg.titleColor });
      y += fs * CHART_LINE_HEIGHT;
    }
    y += 6;
  }
  const vals = cfg.items.map((_, i) => {
    const v = values[i];
    return v != null && Number.isFinite(v) && v > 0 ? v : 0;
  });
  const draw = (out: ChartPrim[], top: number) =>
    cfg.kind === 'bar'
      ? drawBars(out, W, top, cfg, vals, measure, yMaxValue)
      : drawPie(out, W, top, cfg, vals, measure);
  // Өндөр гараар өгсөн бол: диаграмын өндрийг (top-оос хамааралгүй) эхлээд хэмжээд,
  // илүү гарсан зайг гарчиг ба диаграмын хооронд нэмнэ. Агуулгаас бага өндөр → автомат.
  if (cfg.height > 0) y += Math.max(0, cfg.height - (y + draw([], y)));
  const h = draw(prims, y);
  return { prims, height: f2(y + h) };
}

function drawPie(
  prims: ChartPrim[],
  W: number,
  top: number,
  cfg: CustomChartConfig,
  vals: number[],
  measure: MeasureText,
): number {
  const H = cfg.chartHeight;
  const fs = cfg.labelFontSize;
  const LH = fs * CHART_LINE_HEIGHT;
  const outside = cfg.labelMode === 'outside';
  // Гадна шошгонд үлдээх зай — хамгийн урт ҮГний өргөнөөр (шошго 2 мөр хүртэл таслагдана).
  const longestWord = outside
    ? Math.max(
        measure('100.0%', fs, true),
        ...cfg.items.flatMap((it) => String(it.label || '').split(/\s+/).filter(Boolean).map((w) => measure(w, fs, false))),
      )
    : 0;
  const side = outside ? Math.min(W * 0.36, Math.max(30, longestWord + 20)) : 0;
  const R = Math.max(10, Math.min(H / 2 - 2, W / 2 - side));
  const r = R * (cfg.kind === 'pie' ? 0 : cfg.innerRatio);
  const cx = W / 2;
  const cy = top + H / 2;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (rr: number, deg: number) => [cx + rr * Math.cos(rad(deg)), cy + rr * Math.sin(rad(deg))];
  const total = vals.reduce((a, b) => a + b, 0);
  const ring = (fill: string, stroke?: string) => {
    // Бүтэн цагираг / дугуй — хоёр хагас нуман.
    const [ax, ay] = pt(R, -90);
    const [bx, by] = pt(R, 90);
    let d = `M ${f2(ax)} ${f2(ay)} A ${f2(R)} ${f2(R)} 0 1 1 ${f2(bx)} ${f2(by)} A ${f2(R)} ${f2(R)} 0 1 1 ${f2(ax)} ${f2(ay)} Z`;
    if (r > 0) {
      const [ix, iy] = pt(r, -90);
      const [jx, jy] = pt(r, 90);
      d += ` M ${f2(ix)} ${f2(iy)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(jx)} ${f2(jy)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(ix)} ${f2(iy)} Z`;
    }
    prims.push({ k: 'path', d, fill, stroke, sw: stroke ? 0.8 : undefined });
  };

  const slices: { i: number; a0: number; a1: number; pct: number }[] = [];
  if (total <= 0) {
    ring('#E5E7EB');
  } else {
    let a = -90;
    vals.forEach((v, i) => {
      if (v <= 0) return;
      const sweep = (v / total) * 360;
      slices.push({ i, a0: a, a1: a + sweep, pct: (v / total) * 100 });
      a += sweep;
    });
    for (const s of slices) {
      const color = cfg.items[s.i].color;
      if (s.a1 - s.a0 >= 359.99) {
        ring(color, '#FFFFFF');
        continue;
      }
      const large = s.a1 - s.a0 > 180 ? 1 : 0;
      const [ox0, oy0] = pt(R, s.a0);
      const [ox1, oy1] = pt(R, s.a1);
      let d: string;
      if (r > 0) {
        const [ix1, iy1] = pt(r, s.a1);
        const [ix0, iy0] = pt(r, s.a0);
        d =
          `M ${f2(ox0)} ${f2(oy0)} A ${f2(R)} ${f2(R)} 0 ${large} 1 ${f2(ox1)} ${f2(oy1)} ` +
          `L ${f2(ix1)} ${f2(iy1)} A ${f2(r)} ${f2(r)} 0 ${large} 0 ${f2(ix0)} ${f2(iy0)} Z`;
      } else {
        d = `M ${f2(cx)} ${f2(cy)} L ${f2(ox0)} ${f2(oy0)} A ${f2(R)} ${f2(R)} 0 ${large} 1 ${f2(ox1)} ${f2(oy1)} Z`;
      }
      prims.push({ k: 'path', d, fill: color, stroke: '#FFFFFF', sw: 0.8 });
    }
  }

  const pctText = (p: number) => `${formatChartNumber(p, 1)}%`;
  let extra = 0;

  if (cfg.labelMode === 'outside' && slices.length) {
    // Шошго + хувь нь нумын голоос гадагш, тал бүрт давхцахгүй байхаар доош түлхэнэ.
    type Lab = {
      s: (typeof slices)[number];
      right: boolean;
      ty: number;
      p1: number[];
      p2: number[];
      endX: number;
      lines: { t: string; bold: boolean }[];
      h: number;
    };
    const labs: Lab[] = slices.map((s) => {
      const m = (s.a0 + s.a1) / 2;
      const p1 = pt(R, m);
      const p2 = pt(R + 8, m);
      const right = Math.cos(rad(m)) >= 0;
      const endX = p2[0] + (right ? 6 : -6);
      const avail = Math.max(10, right ? W - endX - 4 : endX - 4);
      const mw = (t: string) => measure(t, fs, false);
      // Шошго 2 мөр хүртэл, илүү бол 2-р мөрийг '…'-ээр таслана.
      let words = wrapChartText(cfg.items[s.i].label, avail, mw);
      if (words.length > 2) words = [words[0], words.slice(1).join(' ')];
      const lines = words.map((t) => ({ t: ellipsizeChartText(t, avail, mw), bold: false }));
      if (cfg.showPercent) lines.push({ t: pctText(s.pct), bold: true });
      const h = Math.max(1, lines.length) * LH;
      return { s, right, ty: p2[1] - h / 2, p1, p2, endX, lines, h };
    });
    for (const right of [true, false]) {
      const group = labs.filter((l) => l.right === right).sort((a, b) => a.ty - b.ty);
      for (let k = 1; k < group.length; k++) {
        const minTy = group[k - 1].ty + group[k - 1].h;
        if (group[k].ty < minTy) group[k].ty = minTy;
      }
    }
    for (const l of labs) {
      const midY = l.ty + l.h / 2;
      prims.push({ k: 'line', x1: f2(l.p1[0]), y1: f2(l.p1[1]), x2: f2(l.p2[0]), y2: f2(midY), color: '#9CA3AF', w: 0.6 });
      prims.push({ k: 'line', x1: f2(l.p2[0]), y1: f2(midY), x2: f2(l.endX), y2: f2(midY), color: '#9CA3AF', w: 0.6 });
      l.lines.forEach((ln, k) => {
        if (!ln.t) return;
        const tw = measure(ln.t, fs, ln.bold);
        const tx = l.right ? l.endX + 2 : l.endX - 2 - tw;
        prims.push({ k: 'text', x: f2(tx), y: f2(l.ty + k * LH), text: ln.t, fs, bold: ln.bold, color: cfg.labelColor });
      });
      extra = Math.max(extra, l.ty + l.h - (top + H));
    }
  } else if (cfg.labelMode === 'legend' && cfg.items.length) {
    // Тайлбар: өнгөт дөрвөлжин + нэр (+ хувь), мөр бүрт нэг, голлуулсан.
    const rows = cfg.items.map((it, i) => {
      const s = slices.find((x) => x.i === i);
      const text = cfg.showPercent ? `${it.label} — ${pctText(s ? s.pct : 0)}` : it.label;
      return { color: it.color, text: ellipsizeChartText(text, W - 14, (t) => measure(t, fs, false)) };
    });
    const maxW = Math.max(...rows.map((rw) => measure(rw.text, fs, false)));
    const lx = Math.max(0, (W - (maxW + 12)) / 2);
    let ly = top + H + 6;
    for (const rw of rows) {
      const sq = Math.min(8, LH - 2);
      prims.push({ k: 'rect', x: f2(lx), y: f2(ly + (LH - sq) / 2), w: sq, h: sq, fill: rw.color });
      prims.push({ k: 'text', x: f2(lx + 12), y: f2(ly), text: rw.text, fs, bold: false, color: cfg.labelColor });
      ly += LH + 2;
    }
    extra = ly - (top + H);
  }
  return H + Math.max(0, extra);
}

function drawBars(
  prims: ChartPrim[],
  W: number,
  top: number,
  cfg: CustomChartConfig,
  vals: number[],
  measure: MeasureText,
  yMaxValue?: number | null,
): number {
  const H = cfg.chartHeight;
  const fs = cfg.labelFontSize;
  const LH = fs * CHART_LINE_HEIGHT;
  const n = Math.max(1, cfg.items.length);
  const hasLabels = cfg.items.some((it) => (it.label || '').trim());
  const axis = niceAxis(Math.max(0, ...vals), yMaxValue);
  const ticks: number[] = [];
  for (let t = 0; t <= axis.max + axis.step * 1e-6 && ticks.length < 50; t += axis.step) ticks.push(t);
  const tickLabel = (t: number) => formatChartNumber(t, cfg.decimals);
  const axisW = Math.max(...ticks.map((t) => measure(tickLabel(t), fs, false)));
  const plotX = axisW + 6;
  const plotW = Math.max(10, W - plotX);
  const valueTop = cfg.showValues ? LH + 2 : LH / 2;
  const plotTop = top + valueTop;
  const plotBottom = top + H - (hasLabels ? LH + 4 : 0);
  const plotH = Math.max(10, plotBottom - plotTop);
  const yOf = (v: number) => plotBottom - (Math.min(v, axis.max) / axis.max) * plotH;

  for (const t of ticks) {
    const ty = yOf(t);
    prims.push({
      k: 'line',
      x1: f2(plotX),
      y1: f2(ty),
      x2: f2(W),
      y2: f2(ty),
      color: t === 0 ? cfg.axisColor : cfg.gridColor,
      w: t === 0 ? 0.8 : 0.5,
    });
    const tl = tickLabel(t);
    prims.push({ k: 'text', x: f2(plotX - 6 - measure(tl, fs, false)), y: f2(ty - LH / 2), text: tl, fs, bold: false, color: cfg.labelColor });
  }

  const slot = plotW / n;
  const barW = Math.min(slot * 0.6, 120);
  cfg.items.forEach((it, i) => {
    const v = vals[i] || 0;
    const bx = plotX + slot * i + (slot - barW) / 2;
    const by = yOf(v);
    const bh = plotBottom - by;
    if (bh > 0) prims.push({ k: 'rect', x: f2(bx), y: f2(by), w: f2(barW), h: f2(bh), fill: it.color });
    if (cfg.showValues) {
      const vt = formatChartNumber(v, cfg.decimals);
      prims.push({ k: 'text', x: f2(bx + (barW - measure(vt, fs, true)) / 2), y: f2(by - LH - 1), text: vt, fs, bold: true, color: cfg.labelColor });
    }
    if (hasLabels && (it.label || '').trim()) {
      const lt = ellipsizeChartText(it.label.trim(), slot - 4, (t) => measure(t, fs, false));
      prims.push({ k: 'text', x: f2(plotX + slot * i + (slot - measure(lt, fs, false)) / 2), y: f2(plotBottom + 3), text: lt, fs, bold: false, color: cfg.labelColor });
    }
  });
  return H;
}
