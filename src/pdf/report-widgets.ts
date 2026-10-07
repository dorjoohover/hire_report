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
  // Утга (илэрхийлэл) — өгсөн бол id-аар биш үүгээр бодно: {{Бүлэг[Багын оролцоо/Гүйцэтгэл]}},
  // {{custom.x}} * 2, 3.5 … (9 блок × Гүйцэтгэл / Ач холбогдол бүтэцтэй тестэд).
  value?: string;
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
  // Тэнхлэг нь БҮЛЭГ (блок)-ийн нэр бол (9 блок × Гүйцэтгэл / Ач холбогдол) — тэр блок доторх
  // зөвхөн энэ дэд бүлгийн (хариултын ангилал) оноо. '' = блокийн бүх асуулт.
  sub: string;
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
    sub: '',
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
  // Утга 0 (эсвэл тооцогдохгүй / сөрөг) үед блокийг бүхэлд нь (шошго, bar, хувь) нуух.
  // false (анхдагч) — хоосон bar харагдана.
  hideWhenZero: boolean;
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
    hideWhenZero: false,
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
// "0 үед нуух" асаалттай ба утга 0 / тооцогдохгүй (null) / сөрөг бол true.
export function progressHidden(cfg: ProgressConfig, v: number | null): boolean {
  return !!cfg.hideWhenZero && progressFraction(v) <= 0;
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

/**
 * "wheel-radar" тэнхлэгийн утга (дэд бүлэг = хариултын ангилал).
 * Тэнхлэг ангиллыг ID-аар заадаг. Тест хуулсан / өөр орчинд JSON-оор оруулсан үед
 * загвар ЭХ орчны ангиллын ID-г заасан хэвээр үлдэж болох тул (энэ шалгалтын
 * мөрүүдэд тэр ID огт байхгүй бол) нэрээр нь хайна — өмнө нь null болж олон өнцөгт
 * төвдөө шахагдан огт харагддаггүй байв.
 */
export function wheelAxisValue(
  axis: { id?: number | string | null; name: string },
  rows: AnswerStatRow[],
  cfg: Pick<WheelConfig, 'group' | 'metric'> & { sub?: string },
): number | null {
  const group = cfg.group ? cfg.group : null;
  const inGroup = (r: AnswerStatRow) => !group || normName(r.categoryName) === normName(group);
  const id = axis.id != null && axis.id !== '' ? Number(axis.id) : NaN;
  let hit: AnswerStatRow[] = [];
  if (Number.isFinite(id)) {
    const own = (r: AnswerStatRow) => r.id === id || r.parentId === id;
    hit = rows.filter((r) => inGroup(r) && own(r));
    if (!hit.length && !rows.some(own)) hit = answerRowsByName(rows, axis.name, group);
  } else {
    hit = answerRowsByName(rows, axis.name, group);
  }
  if (!hit.length && !rows.some((r) => normName(r.name) === normName(axis.name))) {
    // Тэнхлэгийн нэр хариултын ангилал биш, БҮЛЭГ (блок)-ийн нэр бол — тэр блок доторх
    // cfg.sub (жиш "Гүйцэтгэл") ангиллын оноо ('' = блокийн бүх асуулт).
    const inBlock = rows.filter((r) => normName(r.categoryName) === normName(axis.name));
    if (inBlock.length) {
      if (!cfg.sub) hit = inBlock;
      else {
        const subIds = new Set(rows.filter((r) => normName(r.name) === normName(cfg.sub)).map((r) => r.id));
        hit = inBlock.filter((r) => subIds.has(r.id) || (r.parentId != null && subIds.has(r.parentId)));
      }
    }
  }
  if (!hit.length) return null;
  const point = hit.reduce((a, r) => a + r.point, 0);
  const count = hit.reduce((a, r) => a + r.count, 0);
  if (cfg.metric === 'sum') return point;
  return count ? point / count : null;
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

// Дэд бүлэг (хариултын ангилал) тус бүрийн нийт оноо / хариулсан асуултын тоо — тестийн
// хариултын ангиллын дарааллаар ({{answerCategory[i].…}}, {{custom.x[i]}}). Эцэг ангилал
// бол дэд ангиллуудынхыг нэгтгэнэ. Хариулаагүй ангилал 0 оноотой.
export interface AnswerCategoryTotal {
  id: number;
  name: string;
  point: number;
  count: number;
  /** Дээд оноо (асуултын бүтцээс, answerCategoryMaxes) — тодорхойгүй бол undefined. */
  max?: number;
}
export function answerCategoryTotals(
  cats: { id: number; name: string }[],
  stats: AnswerStatRow[],
  maxes?: Map<number, number>,
): AnswerCategoryTotal[] {
  return (cats || []).map((c) => {
    const rows = (stats || []).filter((r) => r.id === c.id || (r.parentId != null && r.parentId === c.id));
    return {
      id: c.id,
      name: c.name,
      point: rows.reduce((a, r) => a + (Number(r.point) || 0), 0),
      count: rows.reduce((a, r) => a + (Number(r.count) || 0), 0),
      ...(maxes ? { max: maxes.get(c.id) ?? 0 } : {}),
    };
  });
}

// NAMED_SQL.ANSWER_CATEGORY_MAX_ROWS-ийн мөр (хариулт × матрицын нүд). pg numeric → string ирдэг.
export interface AnswerMaxRow {
  questionId: number | string;
  questionCategoryId?: number | string | null;
  questionCategoryName?: string | null;
  type: number | string;
  minValue: number | string | null;
  maxValue: number | string | null;
  questionPoint: number | string | null;
  isCalculated?: boolean | null;
  answerId: number | string;
  categoryId: number | string | null;
  categoryParentId: number | string | null;
  point: number | string | null;
  negative: boolean | null;
  reverse?: boolean | null;
  matrixId: number | string | null;
  matrixPoint: number | string | null;
  matrixCategoryId: number | string | null;
  matrixCategoryParentId: number | string | null;
}

// Дэд бүлэг (хариултын ангилал) тус бүрийн ДЭЭД оноо — хариултаас биш асуултын бүтцээс, core-ийн
// userAnswer.point бодолттой (core user.answer.service.ts) нийцүүлсэн. Асуулт бүрээс тухайн
// ангилалд авч болох хамгийн их оноог нэмнэ:
//   MATRIX (40)          — мөр бүрт нэг нүд: ангилал = нүдний (баганын) ангилал ?? мөрийн ангилал,
//                          мөрийн дээд = тухайн ангиллын нүднүүдийн хамгийн их оноо;
//   SLIDER (70/80)       — гулсуур (хариулт) бүр maxValue (reverse ч ижил муж), negative бол −minValue;
//   CONSTANT_SUM (50)    — асуултын бүх оноог (question.point) нэг хариултад өгч болно;
//   SINGLE / TRUE_FALSE  — нэг хариулт: тухайн ангиллын хариултуудын max (өөр ангиллын хариулт
//                          сонгож болох бол 0-ээс доош биш);
//   MULTIPLE (20)        — тухайн ангиллын эерэг оноотой хариултуудын нийлбэр;
//   TEXT / NUMBER / TIME — оноо биш (алгасна).
// Эцэг ангилалд дэд ангиллуудынх нэмэгдэнэ (answerCategoryTotals-тай ижил, нэг түвшин).
export function answerCategoryMaxes(rows: AnswerMaxRow[]): Map<number, number> {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const direct = new Map<number, number>();
  const parentOf = new Map<number, number | null>();
  const credit = (cat: number, parent: number | null, v: number) => {
    direct.set(cat, (direct.get(cat) ?? 0) + v);
    if (!parentOf.has(cat)) parentOf.set(cat, parent);
  };
  const byQuestion = new Map<number, AnswerMaxRow[]>();
  for (const r of rows || []) {
    const q = Number(r.questionId);
    if (!byQuestion.has(q)) byQuestion.set(q, []);
    byQuestion.get(q)!.push(r);
  }
  // Нэг сонголттой бүлэг (асуулт / матрицын мөр): ангилал бүрийн хамгийн их оноо.
  const pickOne = (opts: { cat: number | null; parent: number | null; point: number }[]) => {
    const best = new Map<number, { parent: number | null; point: number }>();
    for (const o of opts) {
      if (o.cat == null) continue;
      const b = best.get(o.cat);
      if (!b || o.point > b.point) best.set(o.cat, { parent: o.parent, point: o.point });
    }
    for (const [cat, b] of best) {
      const onlyThis = opts.every((o) => o.cat === cat);
      credit(cat, b.parent, onlyThis ? b.point : Math.max(0, b.point));
    }
  };
  for (const qrows of byQuestion.values()) {
    const head = qrows[0];
    const type = Number(head.type);
    const minV = num(head.minValue);
    const maxV = num(head.maxValue);
    // Нэг хариулт нэг удаа (матрицын нүдээр олшрохгүй).
    const answers = new Map<number, AnswerMaxRow>();
    for (const r of qrows) if (!answers.has(Number(r.answerId))) answers.set(Number(r.answerId), r);
    const answerPoint = (a: AnswerMaxRow) => {
      let p = num(a.point) ?? 0;
      if (a.reverse && a.isCalculated !== false) p = (maxV ?? 0) - p + (minV ?? 0);
      return a.negative ? -p : p;
    };
    if (type === 40) {
      for (const a of answers.values()) {
        const cells = qrows.filter((r) => Number(r.answerId) === Number(a.answerId) && r.matrixId != null);
        pickOne(
          cells.map((c) => {
            const mc = num(c.matrixCategoryId);
            return {
              cat: mc ?? num(c.categoryId),
              parent: mc != null ? num(c.matrixCategoryParentId) : num(c.categoryParentId),
              point: num(c.matrixPoint) ?? 0,
            };
          }),
        );
      }
    } else if (type === 70 || type === 80) {
      for (const a of answers.values()) {
        const cat = num(a.categoryId);
        if (cat == null) continue;
        credit(cat, num(a.categoryParentId), a.negative ? -(minV ?? 0) : maxV ?? 0);
      }
    } else if (type === 50) {
      const qp = num(head.questionPoint);
      if (qp == null || qp <= 0) continue;
      const seen = new Set<number>();
      for (const a of answers.values()) {
        const cat = num(a.categoryId);
        if (cat == null || seen.has(cat)) continue;
        seen.add(cat);
        credit(cat, num(a.categoryParentId), qp);
      }
    } else if (type === 20) {
      for (const a of answers.values()) {
        const cat = num(a.categoryId);
        const p = answerPoint(a);
        if (cat == null || p <= 0) continue;
        credit(cat, num(a.categoryParentId), p);
      }
    } else if (type === 10 || type === 30) {
      pickOne(
        [...answers.values()].map((a) => ({
          cat: num(a.categoryId),
          parent: num(a.categoryParentId),
          point: answerPoint(a),
        })),
      );
    }
  }
  const total = new Map<number, number>();
  for (const [cat, v] of direct) {
    total.set(cat, (total.get(cat) ?? 0) + v);
    const parent = parentOf.get(cat);
    if (parent != null && parent !== cat) total.set(parent, (total.get(parent) ?? 0) + v);
  }
  return total;
}

// Бүлэг (асуултын ангилал / блок) — id байвал id-аар, үгүй бол нэрээр (demo, хуучин snapshot).
export interface GroupRef {
  id?: number | null;
  name?: string | null;
}
export function inGroupRef(group: GroupRef, id: unknown, name: string | null | undefined): boolean {
  if (group.id != null && id != null && id !== '') return Number(id) === Number(group.id);
  return !!group.name && normName(name) === normName(group.name);
}

// {{category[g].answerCategory[i].…}} — дэд бүлгийн оноо / дээд оноог НЭГ бүлгийн (блокийн)
// асуултаар хязгаарлана. Жиш "Сэтгэл түгшил" нь HADS ба DASS-21 хоёр блокт байвал
// answerCategory[i] хоёуланг нь нэгтгэдэг; энэ нь зөвхөн тухайн блокийнхыг.
export function groupAnswerCategoryTotal(
  cat: { id: number; name: string },
  group: GroupRef,
  stats: AnswerStatRow[],
  groupMaxes?: Map<number, number>,
): AnswerCategoryTotal {
  const rows = (stats || []).filter(
    (r) => (r.id === cat.id || (r.parentId != null && r.parentId === cat.id)) && inGroupRef(group, r.categoryId, r.categoryName),
  );
  return {
    id: cat.id,
    name: cat.name,
    point: rows.reduce((a, r) => a + (Number(r.point) || 0), 0),
    count: rows.reduce((a, r) => a + (Number(r.count) || 0), 0),
    ...(groupMaxes ? { max: groupMaxes.get(cat.id) ?? 0 } : {}),
  };
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
