// ─────────────────────────────────────────────────────────────────────────────
// Studio-ийн шинэ график блокуудын ерөнхий логик (тохиргоо, геометр, илэрхийлэл):
//   • 'wheel-radar'  — дугуй радар (хариултын ангилал бүр нэг тэнхлэг, Х…Ж түвшин)
//   • 'level-cards'  — түвшний картууд (гарчиг + дэд гарчиг + тайлбар)
//   • 'progress-bar' — шошго + утгаар дүүрэх bar (утга нь илэрхийлэл: {{Нийт оноо}} / {{Дээд оноо}})
//
// studio/lib/reportWidgets.ts ↔ hire_report/src/pdf/report-widgets.ts — ЯГ АДИЛ
// (өөр service тул давхардуулав — өөрчлөхдөө хоёуланг нь синк байлгах).
// ─────────────────────────────────────────────────────────────────────────────

// ── Дугуй радар ─────────────────────────────────────────────────────────────
export interface WheelAxis {
  id?: number | null; // questionAnswerCategory.id (бодит оноо авах)
  name: string; // ангиллын нэр (DB)
  label?: string; // гадна цагираг дээрх бичиг (хоосон бол name)
  color: string; // гадна цагирагийн өнгө
}
export interface WheelLevel {
  code: string; // 'Х'
  label: string; // 'Хангалтгүй'
}
export interface WheelConfig {
  axes: WheelAxis[];
  levels: WheelLevel[]; // төвөөс гадагш
  metric: 'avg' | 'sum';
  // Бүлэг (асуултын ангилал) — зөвхөн энэ бүлгийн асуултуудын оноо. '' = бүгд.
  group: string;
  min: number;
  max: number;
  diameter: number;
  lineColor: string;
  lineWidth: number;
  fillColor: string; // '' = дүүргэлтгүй
  fillOpacity: number;
  markers: 'none' | 'three' | 'all';
  markerColor: string;
  showLegend: boolean;
  legendColumns: number;
  legendCodeColor: string;
  legendTextColor: string;
  ringColors: string[]; // гаднаас дотогш ээлжлэх туузны өнгө
  spokeColor: string;
  labelColor: string;
  labelFontSize: number; // 0 = автомат
}

export const WHEEL_PALETTE = [
  '#B3508A', '#2F52A6', '#E3C33B', '#6B4FA3', '#46A04E',
  '#4583CC', '#8E2A4B', '#8BC155', '#E8A23C', '#D4553A',
];

export const DEFAULT_WHEEL_LEVELS: WheelLevel[] = [
  { code: 'Х', label: 'Хангалтгүй' },
  { code: 'С', label: 'Суурь' },
  { code: 'М', label: 'Мэргэжлийн' },
  { code: 'А', label: 'Ахисан' },
  { code: 'Ж', label: 'Жишиг' },
];

export function defaultWheelConfig(): WheelConfig {
  return {
    axes: [],
    levels: DEFAULT_WHEEL_LEVELS.map((l) => ({ ...l })),
    metric: 'avg',
    group: '',
    min: 0,
    max: 5,
    diameter: 420,
    lineColor: '#233F7A',
    lineWidth: 2,
    fillColor: '',
    fillOpacity: 0.15,
    markers: 'three',
    markerColor: '#4D4D4D',
    showLegend: true,
    legendColumns: 3,
    legendCodeColor: '#8B1E5A',
    legendTextColor: '#6B6B6B',
    ringColors: ['#DEDDDC', '#FFFFFF'],
    spokeColor: '#BDBDBD',
    labelColor: '#FFFFFF',
    labelFontSize: 0,
  };
}

// Хуучин/дутуу хадгалсан тохиргоог анхдагчаар нөхнө.
export function normalizeWheel(cfg: Partial<WheelConfig> | undefined | null): WheelConfig {
  const d = defaultWheelConfig();
  const c: any = { ...d, ...(cfg || {}) };
  c.axes = Array.isArray(c.axes) ? c.axes : [];
  c.levels = Array.isArray(c.levels) && c.levels.length ? c.levels : d.levels;
  c.ringColors = Array.isArray(c.ringColors) && c.ringColors.length ? c.ringColors : d.ringColors;
  c.min = Number.isFinite(Number(c.min)) ? Number(c.min) : d.min;
  c.max = Number.isFinite(Number(c.max)) ? Number(c.max) : d.max;
  c.diameter = Number(c.diameter) > 0 ? Number(c.diameter) : d.diameter;
  c.lineWidth = Number(c.lineWidth) > 0 ? Number(c.lineWidth) : d.lineWidth;
  c.legendColumns = Math.max(1, Math.round(Number(c.legendColumns) || d.legendColumns));
  c.fillOpacity = Math.min(1, Math.max(0, Number(c.fillOpacity) || 0));
  return c as WheelConfig;
}

export const WHEEL_LEGEND_ROW_H = 18;
export const WHEEL_LEGEND_FS = 11;
export const WHEEL_LEGEND_GAP = 12;

export interface WheelLayout {
  legendH: number;
  D: number;
  outerR: number; // гадна цагирагийн гадна радиус
  ringInner: number; // гадна цагирагийн дотор радиус
  R: number; // саарал (түвшний) хэсгийн радиус
  cx: number;
  cy: number;
  height: number;
  labelFs: number;
  markerR: number;
}

export function wheelLayout(width: number, cfg: WheelConfig): WheelLayout {
  const legendRows =
    cfg.showLegend && cfg.levels.length ? Math.ceil(cfg.levels.length / Math.max(1, cfg.legendColumns)) : 0;
  const legendH = legendRows ? legendRows * WHEEL_LEGEND_ROW_H + WHEEL_LEGEND_GAP : 0;
  const D = Math.max(120, Math.min(cfg.diameter || width, width));
  const outerR = D / 2;
  const ringW = outerR * 0.16;
  const ringInner = outerR - ringW;
  const R = ringInner - outerR * 0.015;
  return {
    legendH,
    D,
    outerR,
    ringInner,
    R,
    cx: width / 2,
    cy: legendH + outerR,
    height: legendH + D,
    labelFs: cfg.labelFontSize > 0 ? cfg.labelFontSize : Math.max(5, Math.round(ringW * 0.27 * 10) / 10),
    markerR: Math.max(4.5, R * 0.036),
  };
}

// Тэнхлэг i-ийн өнцөг (градус, 0 = баруун, цагийн зүүний дагуу эерэг; дээд = -90).
export function wheelAxisAngle(i: number, n: number): number {
  return -90 + (360 / Math.max(1, n)) * i;
}

export function wheelValueFraction(v: number | null | undefined, cfg: WheelConfig): number {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return 0;
  const span = cfg.max - cfg.min;
  if (!span) return 0;
  return Math.min(1, Math.max(0, (Number(v) - cfg.min) / span));
}

// Түвшний тэмдэг (Х, С, …) тавих тэнхлэгүүд.
export function wheelMarkerAxes(n: number, mode: WheelConfig['markers']): number[] {
  if (mode === 'none' || n <= 0) return [];
  if (mode === 'all') return Array.from({ length: n }, (_, i) => i);
  const set = new Set<number>();
  for (let k = 0; k < 3; k++) set.add(Math.round((n * k) / 3) % n);
  return [...set];
}

// Гадна цагирагийн бичгийг 2 мөр хүртэл хуваана ('\n' эсвэл урт бол дундах зайгаар).
export function wheelLabelLines(label: string): string[] {
  const t = (label || '').trim();
  if (!t) return [];
  if (t.includes('\n')) return t.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 2);
  if (t.length <= 12 || !t.includes(' ')) return [t];
  const mid = t.length / 2;
  let best = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? [t] : [t.slice(0, best), t.slice(best + 1)];
}

// Бодит оноо байхгүй (Studio / demo preview) үед тэнхлэг бүрт жишээ утга.
const DEMO_FRACTIONS = [0.62, 0.34, 0.82, 0.46, 0.58, 0.38, 0.3, 0.44, 0.54, 0.7];
export function wheelDemoValue(i: number, cfg: WheelConfig): number {
  return cfg.min + DEMO_FRACTIONS[i % DEMO_FRACTIONS.length] * (cfg.max - cfg.min);
}

// ── Түвшний картууд ────────────────────────────────────────────────────────
export interface LevelCard {
  title: string;
  subtitle: string;
  body: string;
  headerBg: string;
  headerColor: string;
  subtitleColor: string;
}
export interface LevelCardsConfig {
  cards: LevelCard[];
  cardBg: string;
  bodyColor: string;
  gap: number;
  headerHeight: number;
  titleFontSize: number;
  bodyFontSize: number;
  radius: number;
  padding: number;
}
export function defaultLevelCard(title = 'Түвшин'): LevelCard {
  return {
    title,
    subtitle: '',
    body: '',
    headerBg: '#8DC63F',
    headerColor: '#1A1A1A',
    subtitleColor: '#3E9B3E',
  };
}
export function defaultLevelCardsConfig(): LevelCardsConfig {
  return {
    cards: [
      { ...defaultLevelCard('Хангалтгүй'), body: 'Би суурь түвшинд дурдсан тодорхойлолтуудыг хангахгүй байна.' },
      {
        ...defaultLevelCard('Суурь'),
        subtitle: 'Хүмүүсийг хөгжих боломжоор хангах',
        body: 'Бүх зүйлийг сурах боломж гэж харж байна уу?',
      },
      { ...defaultLevelCard('Мэргэжлийн'), body: '' },
    ],
    cardBg: '#EEF0F6',
    bodyColor: '#1A1A1A',
    gap: 10,
    headerHeight: 34,
    titleFontSize: 12,
    bodyFontSize: 9,
    radius: 8,
    padding: 10,
  };
}
export function normalizeLevelCards(cfg: Partial<LevelCardsConfig> | undefined | null): LevelCardsConfig {
  const d = defaultLevelCardsConfig();
  const c: any = { ...d, ...(cfg || {}) };
  c.cards = Array.isArray(c.cards) ? c.cards.map((x: any) => ({ ...defaultLevelCard(''), ...(x || {}) })) : d.cards;
  for (const k of ['gap', 'headerHeight', 'titleFontSize', 'bodyFontSize', 'radius', 'padding']) {
    const v = Number(c[k]);
    c[k] = Number.isFinite(v) && v >= 0 ? v : (d as any)[k];
  }
  return c as LevelCardsConfig;
}
// Карт хоорондын зай ба өргөн.
export function levelCardColumns(width: number, cfg: LevelCardsConfig): { x: number; w: number }[] {
  const n = cfg.cards.length;
  if (!n) return [];
  const w = Math.max(10, (width - cfg.gap * (n - 1)) / n);
  return cfg.cards.map((_, i) => ({ x: i * (w + cfg.gap), w }));
}
export const LEVEL_CARD_SUBTITLE_GAP = 8;

// ── Progress bar ────────────────────────────────────────────────────────────
export interface ProgressConfig {
  label: string;
  value: string; // илэрхийлэл → 0..1 (1-ээс их, 100-аас бага бол хувь гэж үзнэ)
  labelColor: string;
  labelWidth: number;
  labelFontSize: number;
  colorFrom: string;
  colorTo: string;
  trackColor: string;
  barHeight: number;
  showValue: boolean;
  valueColor: string;
}
export function defaultProgressConfig(): ProgressConfig {
  return {
    label: 'Үр дүнд хөтлөх',
    value: '{{Нийт оноо}} / {{Дээд оноо}}',
    labelColor: '#E8A23C',
    labelWidth: 130,
    labelFontSize: 11,
    colorFrom: '#E8672C',
    colorTo: '#D23C3C',
    trackColor: '#E3E3E3',
    barHeight: 8,
    showValue: false,
    valueColor: '#1A1A1A',
  };
}
export function normalizeProgress(cfg: Partial<ProgressConfig> | undefined | null): ProgressConfig {
  const d = defaultProgressConfig();
  const c: any = { ...d, ...(cfg || {}) };
  for (const k of ['labelWidth', 'labelFontSize', 'barHeight']) {
    const v = Number(c[k]);
    c[k] = Number.isFinite(v) && v >= 0 ? v : (d as any)[k];
  }
  return c as ProgressConfig;
}
// Илэрхийллийн үр дүнг 0..1 болгоно.
export function progressFraction(v: number | null): number {
  if (v === null || !Number.isFinite(v)) return 0;
  let f = v;
  if (f > 1 && f <= 100) f = f / 100;
  return Math.min(1, Math.max(0, f));
}
// Bar-ийн босоо хэмжээ: шошгоны мөр ба bar-ийн аль өндөр нь.
export function progressHeight(cfg: ProgressConfig): number {
  return Math.max(cfg.barHeight, cfg.label ? cfg.labelFontSize * 1.213 : 0, cfg.showValue ? cfg.labelFontSize * 1.213 : 0);
}

// ── Тоон илэрхийлэл ─────────────────────────────────────────────────────────
// '{{Нийт оноо}} / {{Дээд оноо}}', 'score.total / score.max * 100',
// '({{1-р бүлгийн дундаж}} - 1) / 4' — + - * / ба хаалт. Хувьсагчийг resolve()
// тоон текст болгож өгнө. Буруу/0-д хуваах → null. eval() АШИГЛАХГҮЙ.
export function evalNumberExpression(expr: string, resolve: (key: string) => string): number | null {
  const src = (expr || '').trim();
  if (!src) return null;
  const toks: (string | number)[] = [];
  const re = /\s*(\{\{[^{}]+\}\}|\d+(?:[.,]\d+)?|[A-Za-z_][\w.\[\]]*|[-+*/()])/y;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) {
      if (/^\s*$/.test(src.slice(pos))) break;
      return null;
    }
    pos = re.lastIndex;
    const t = m[1];
    if (/^\d/.test(t)) toks.push(Number(t.replace(',', '.')));
    else if (t.startsWith('{{') || /^[A-Za-z_]/.test(t)) {
      const key = t.startsWith('{{') ? t.slice(2, -2).trim() : t;
      const raw = String(resolve(key) ?? '').replace(/[%\s]/g, '').replace(',', '.');
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) return null;
      toks.push(n);
    } else toks.push(t);
  }
  let i = 0;
  const peek = () => toks[i];
  const expr_ = (): number | null => {
    let a = term();
    while (a !== null && (peek() === '+' || peek() === '-')) {
      const op = toks[i++];
      const b = term();
      if (b === null) return null;
      a = op === '+' ? a + b : a - b;
    }
    return a;
  };
  const term = (): number | null => {
    let a = factor();
    while (a !== null && (peek() === '*' || peek() === '/')) {
      const op = toks[i++];
      const b = factor();
      if (b === null) return null;
      if (op === '/') {
        if (b === 0) return null;
        a = a / b;
      } else a = a * b;
    }
    return a;
  };
  const factor = (): number | null => {
    const t = toks[i++];
    if (typeof t === 'number') return t;
    if (t === '-') {
      const v = factor();
      return v === null ? null : -v;
    }
    if (t === '+') return factor();
    if (t === '(') {
      const v = expr_();
      if (toks[i++] !== ')') return null;
      return v;
    }
    return null;
  };
  const v = expr_();
  if (i !== toks.length || v === null || !Number.isFinite(v)) return null;
  return v;
}

// ── Бүлэг / Дэд бүлгийн утга ────────────────────────────────────────────────
// Бүлэг = асуултын ангилал (questionCategory, admin-ы 'блок'),
// Дэд бүлэг = хариултын ангилал (questionAnswerCategory).
//   {{Бүлэг[Гүйцэтгэл]}}                           — бүлгийн дундаж оноо
//   {{Бүлэг[Гүйцэтгэл/Хамтын зорилгыг өдөөх]}}     — бүлэг доторх дэд бүлэг
//   {{Дэд бүлэг[Хамтын зорилгыг өдөөх]}}           — дэд бүлэг (бүх бүлгээр)
//   ({{Хариулт[…]}} = {{Дэд бүлэг[…]}}-ийн өөр нэр)
// '.дундаж' (анхдагч) = оноо / хариулсан асуултын тоо, '.нийт' = оноо,
// '.тоо' = хариулсан асуултын тоо. Эцэг хариултын ангилал бол дэд ангиллуудыг нэгтгэнэ.
export const GROUP_TOKEN_RE =
  /\{\{\s*(Бүлэг|Дэд бүлэг|Хариулт)\s*\[([^\]{}]+)\]\s*(?:\.\s*(дундаж|нийт|тоо))?\s*\}\}/g;

export interface AnswerStatRow {
  id: number; // хариултын ангилал
  parentId: number | null;
  name: string;
  categoryId: number | null; // асуултын ангилал (бүлэг)
  categoryName: string | null;
  point: number;
  count: number;
}
export interface GroupStatRow {
  categoryName: string;
  point: number;
  count?: number;
}

const normName = (s: string | null | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

function pickField(point: number, count: number, field?: string): number | null {
  if (field === 'нийт') return point;
  if (field === 'тоо') return count;
  return count ? point / count : null;
}

// Хариултын ангиллын мөрүүдийг (эцэг → дэд ангиллууд хамт) нэрээр шүүнэ.
export function answerRowsByName(rows: AnswerStatRow[], name: string, groupName?: string | null): AnswerStatRow[] {
  const want = normName(name);
  const inGroup = (r: AnswerStatRow) => !groupName || normName(r.categoryName) === normName(groupName);
  const ids = new Set(rows.filter((r) => normName(r.name) === want).map((r) => r.id));
  if (!ids.size) return [];
  return rows.filter((r) => inGroup(r) && (ids.has(r.id) || (r.parentId != null && ids.has(r.parentId))));
}

export function groupTokenValue(
  kind: string,
  path: string,
  field: string | undefined,
  groups: GroupStatRow[],
  answers: AnswerStatRow[],
): number | null {
  const p = (path || '').trim();
  if (kind === 'Бүлэг') {
    const slash = p.indexOf('/');
    if (slash < 0) {
      const g = groups.filter((r) => normName(r.categoryName) === normName(p));
      if (!g.length) return null;
      const point = g.reduce((a, r) => a + (Number(r.point) || 0), 0);
      const count = g.reduce((a, r) => a + (Number(r.count) || 0), 0);
      return pickField(point, count, field);
    }
    const hit = answerRowsByName(answers, p.slice(slash + 1), p.slice(0, slash));
    if (!hit.length) return null;
    return pickField(
      hit.reduce((a, r) => a + r.point, 0),
      hit.reduce((a, r) => a + r.count, 0),
      field,
    );
  }
  const hit = answerRowsByName(answers, p);
  if (!hit.length) return null;
  return pickField(
    hit.reduce((a, r) => a + r.point, 0),
    hit.reduce((a, r) => a + r.count, 0),
    field,
  );
}

// Studio / demo preview-д бодит хариулт байхгүй — нэрээс тогтмол жишээ утга.
export function answerDemoValue(name: string, field?: string): number {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const avg = 1.5 + (h % 31) / 10; // 1.5 … 4.5
  if (field === 'тоо') return 1;
  return Math.round(avg * 10) / 10;
}

export function formatAnswerNumber(n: number | null): string {
  return n === null || !Number.isFinite(n) ? '' : String(Math.round(n * 100) / 100);
}
