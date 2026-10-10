// ─────────────────────────────────────────────────────────────────────────────
// 'Хэсэг (box)' блок + нөхцөлт харагдац (block.visibleIf) — PDF болон Studio-д ИЖИЛ тооцоо.
//
// ТОЛИН ХУУЛБАР: studio/lib/flowLayout.ts ↔ hire_report/src/pdf/flow-layout.ts
//   (Studio-д ', hire_report-д ' — sed 's/\'/'/g' + толгойн мөрийг сольж үүсгэнэ).
//
// Box-ийн гишүүн = зүүн дээд булан нь box-ийн тэгш өнцөгт дотор байгаа блок (хамгийн жижиг
// box-д харьяална, box дотор box байж болно). Гишүүн нуугдвал (нөхцөл биелээгүй / хоосон текст)
// тэр блокийн эзэлж байсан босоо зай + араас нь дагах зай арилж, доорх гишүүд дээшилнэ.
// Box олон баганатай бол багана бүр тусдаа шахагдана (гишүүнийг зүүн ирмэгээр нь баганад өгнө).
// Box-ийн өндөр = үлдсэн агуулгын доод ирмэг + анхны доод зай. Бүх гишүүн нуугдвал box өөрөө
// нуугдана. pullUp асаалттай бол хуудасны (box-оос гадуурх) доорх блокууд ч дээш татагдана.
//
// Шахалт = 'босоо зурвас арилгах': нуугдсан блокийн зурвасыг харагдах ямар ч блок эзлээгүй
// хэсэгт л арилгана — тиймээс харагдах блокууд хэзээ ч давхцахгүй, дараалал нь хадгалагдана.
// Юу ч нуугдаагүй бол бүх байрлал ЯГ хэвээр (хуучин загварт нөлөөгүй).
// ─────────────────────────────────────────────────────────────────────────────
import { chipItems, normalizeChips } from './chips';

export interface BoxConfig {
  columns: number; // 1–4 — тэнцүү баганууд (багана бүр тусдаа шахагдана)
  gap: number; // баганын хоорондын зай
  padding: number; // дотор зай — баганын хил, 'Агуулгад тааруулах'-д
  bg: string; // дэвсгэр ('' = байхгүй)
  borderColor: string;
  borderWidth: number; // 0 = хүрээгүй
  radius: number;
  divider: boolean; // баганын хооронд босоо зураас
  dividerColor: string;
  hideEmpty: boolean; // хоосон текст / гарчиг / шошготой гишүүнийг нууж шахна
  pullUp: boolean; // box жижгэрвэл хуудасны доорх блокуудыг дээш татна
}

export function defaultBoxConfig(): BoxConfig {
  return {
    columns: 1,
    gap: 16,
    padding: 0,
    bg: '',
    borderColor: '#E5E7EB',
    borderWidth: 0,
    radius: 8,
    divider: false,
    dividerColor: '#E5E7EB',
    hideEmpty: true,
    pullUp: true,
  };
}

const num = (v: unknown, d: number, min: number, max: number) => {
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? d : Math.min(max, Math.max(min, n));
};

export function normalizeBox(c: Partial<BoxConfig> | null | undefined): BoxConfig {
  const d = defaultBoxConfig();
  return {
    columns: Math.round(num(c?.columns, d.columns, 1, 4)),
    gap: num(c?.gap, d.gap, 0, 200),
    padding: num(c?.padding, d.padding, 0, 200),
    bg: typeof c?.bg === 'string' ? c.bg.trim() : d.bg,
    borderColor: String(c?.borderColor || d.borderColor),
    borderWidth: num(c?.borderWidth, d.borderWidth, 0, 20),
    radius: num(c?.radius, d.radius, 0, 200),
    divider: !!c?.divider,
    dividerColor: String(c?.dividerColor || d.dividerColor),
    hideEmpty: c?.hideEmpty !== false,
    pullUp: c?.pullUp !== false,
  };
}

// ── Нөхцөлт харагдац ─────────────────────────────────────────────────────────
export type VisibleOp = 'skipped' | 'answered' | '=' | '!=' | '>' | '>=' | '<' | '<=' | 'empty' | 'notEmpty';

export interface VisibleIf {
  var: string; // 'custom.hads_skip' гэх мэт token ({{ }}-гүй)
  op: VisibleOp;
  value?: string;
}

export const VISIBLE_OPS: { value: VisibleOp; label: string }[] = [
  { value: '=', label: 'тэнцүү (=)' },
  { value: '!=', label: 'тэнцүү биш (≠)' },
  { value: '>', label: 'их (>)' },
  { value: '>=', label: 'их буюу тэнцүү (≥)' },
  { value: '<', label: 'бага (<)' },
  { value: '<=', label: 'бага буюу тэнцүү (≤)' },
  { value: 'notEmpty', label: 'утгатай (хоосон биш)' },
  { value: 'empty', label: 'хоосон' },
];

export const SKIP_VISIBLE_OPS: { value: VisibleOp; label: string }[] = [
  { value: 'skipped', label: 'алгассан бол харуулна' },
  { value: 'answered', label: 'хариулсан бол харуулна' },
];

const toNum = (v: string): number | null => {
  const t = String(v ?? '').trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// {{custom.x}} / custom.x → custom.x
export function visibleIfVarKey(cond: VisibleIf | null | undefined): string {
  return String(cond?.var ?? '')
    .trim()
    .replace(/^\{\{\s*/, '')
    .replace(/\s*\}\}$/, '')
    .trim();
}

// value — {{var}}-ийн шийдсэн утга. skipped — var нь 'Алгасалт' хувьсагч бол түүний төлөв
// (бусад үед undefined: 'алгассан' = утгатай ба 0 биш).
export function evalVisibleIf(cond: VisibleIf | null | undefined, value: string, skipped?: boolean): boolean {
  if (!cond || !visibleIfVarKey(cond)) return true;
  const v = String(value ?? '').trim();
  const truthy = v !== '' && v !== '0';
  switch (cond.op) {
    case 'skipped':
      return skipped !== undefined ? skipped : truthy;
    case 'answered':
      return skipped !== undefined ? !skipped : !truthy;
    case 'empty':
      return v === '';
    case 'notEmpty':
      return v !== '';
    default:
      break;
  }
  const want = String(cond.value ?? '').trim();
  const a = toNum(v);
  const b = toNum(want);
  if (cond.op === '=' || cond.op === '!=') {
    const eq = a !== null && b !== null ? Math.abs(a - b) < 1e-9 : v.toLowerCase() === want.toLowerCase();
    return cond.op === '=' ? eq : !eq;
  }
  if (a === null || b === null) return false;
  switch (cond.op) {
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    default:
      return true;
  }
}

// Rich-text тэмдэглэгээг (**, ~~, __, ==#hex|…==, ^^18|…^^, [текст](url), {..}) хасаад хоосон эсэх.
export function isBlankRichText(s: string | null | undefined): boolean {
  const t = String(s ?? '')
    .replace(/==#[0-9A-Fa-f]{3,8}\|/g, '')
    .replace(/\^\^\d{1,2}(?:\.\d)?\|/g, '')
    .replace(/\[([^\]\n]*)\]\([^)\s]*\)/g, '$1')
    .replace(/\{\.\.\}/g, '')
    .replace(/\*\*|~~|__|==|\^\^/g, '');
  return t.trim() === '';
}

// Box доторх 'хоосон' гишүүн (box.hideEmpty үед нуугдана). resolve — {{token}} шийдэгч.
export function blockIsBlank(
  b: { type: string; content?: string | null; chips?: any },
  resolve: (s: string) => string,
): boolean {
  switch (b.type) {
    case 'text':
      return isBlankRichText(resolve(String(b.content || '')));
    case 'heading':
      // Гарчиг хоосон бол PDF блокийн нэрийг харуулдаг — зөвхөн token нь хоосон болсон үед нуугдана.
      return !!String(b.content || '').trim() && isBlankRichText(resolve(String(b.content)));
    case 'chips':
      return chipItems(normalizeChips(b.chips).items, resolve).length === 0;
    default:
      return false;
  }
}

// ── Байршил ──────────────────────────────────────────────────────────────────
export interface FlowBlock {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  box?: Partial<BoxConfig> | null;
}

// Хуудасны тогтмол байрлалтай блокууд — шахалтад оролцохгүй.
export const FLOW_FIXED_TYPES = new Set(['header', 'title10', 'footer', 'cover']);
const PAGE_W = 595.28;
const MARGIN_X = 40;

export function flowRect(b: FlowBlock): { x: number; y: number; w: number; h: number } {
  const x = Number(b.x) || 0;
  const y = Number(b.y) || 0;
  const w = Number(b.width) > 0 ? Number(b.width) : Math.max(0, PAGE_W - x - MARGIN_X);
  const h = Number(b.height) > 0 ? Number(b.height) : 0;
  return { x, y, w, h };
}

// Box-ийн баганын хэвтээ хил (дотор зай, хоорондын зайг хассан).
export function boxColumnRanges(box: FlowBlock): { x0: number; x1: number }[] {
  const cfg = normalizeBox(box.box);
  const r = flowRect(box);
  const n = cfg.columns;
  const inner0 = r.x + cfg.padding;
  const innerW = Math.max(1, r.w - cfg.padding * 2);
  const colW = Math.max(1, (innerW - cfg.gap * (n - 1)) / n);
  const out: { x0: number; x1: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = inner0 + i * (colW + cfg.gap);
    out.push({ x0, x1: x0 + colW });
  }
  return out;
}

// Зүүн ирмэгээр нь аль баганад хамаарахыг (тэр ирмэгийг агуулсан / хамгийн ойрын багана) —
// анхдагч өргөнтэй (515) блокийг зүүн баганад тавиад X-ийг нь өгөхөд ч зөв баганад орно.
export function columnIndexOf(b: FlowBlock, cols: { x0: number; x1: number }[]): number {
  if (cols.length <= 1) return 0;
  const r = flowRect(b);
  const cx = r.x + Math.min(2, r.w / 2);
  let best = 0;
  let bestD = Infinity;
  cols.forEach((c, i) => {
    const d = cx < c.x0 ? c.x0 - cx : cx > c.x1 ? cx - c.x1 : 0;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

// Блок бүрийн шууд эцэг box (зүүн дээд булан нь дотор, хамгийн жижиг талбайтай) — анхдагч
// өргөнтэй (515) блок box-оос баруун тийш халив ч гишүүн хэвээр. Box зөвхөн өөрөөсөө ТОМ
// box-ийн гишүүн болно (тойрог үүсэхгүй).
export function boxParents(blocks: FlowBlock[]): Map<string, string> {
  const boxes = blocks.filter((b) => b.type === 'box');
  const out = new Map<string, string>();
  if (!boxes.length) return out;
  for (const b of blocks) {
    if (FLOW_FIXED_TYPES.has(b.type)) continue;
    const r = flowRect(b);
    const cx = r.x + Math.min(1, r.w / 2);
    const cy = r.y + Math.min(1, r.h / 2);
    const area = r.w * r.h;
    let best: FlowBlock | null = null;
    let bestArea = Infinity;
    for (const B of boxes) {
      if (B.id === b.id) continue;
      const R = flowRect(B);
      const A = R.w * R.h;
      if (b.type === 'box' && !(A > area)) continue;
      if (cx >= R.x && cx <= R.x + R.w && cy >= R.y && cy <= R.y + R.h && A < bestArea) {
        best = B;
        bestArea = A;
      }
    }
    if (best) out.set(b.id, best.id);
  }
  return out;
}

// Box-ийн бүх үр удам (гишүүд, тэдгээрийн гишүүд …) — Studio-д box-ийг чирэхэд хамт зөөнө.
export function boxDescendants(blocks: FlowBlock[], boxId: string, parents?: Map<string, string>): string[] {
  const p = parents ?? boxParents(blocks);
  const out: string[] = [];
  const walk = (id: string) => {
    for (const b of blocks) {
      if (p.get(b.id) === id) {
        out.push(b.id);
        if (b.type === 'box') walk(b.id);
      }
    }
  };
  walk(boxId);
  return out;
}

// Нөхцөл / хоосон гишүүнээр нуугдах блокууд.
//   condHidden(b) — block.visibleIf биелээгүй эсэх;
//   blank(b) — хоосон эсэх (зөвхөн hideEmpty асаалттай box-ийн шууд гишүүнд).
export function flowHiddenSet<T extends FlowBlock>(
  blocks: T[],
  condHidden: (b: T) => boolean,
  blank: (b: T) => boolean,
  parents?: Map<string, string>,
): Set<string> {
  const p = parents ?? boxParents(blocks);
  const byId = new Map(blocks.map((b) => [b.id, b] as [string, T]));
  const out = new Set<string>();
  for (const b of blocks) {
    if (condHidden(b)) {
      out.add(b.id);
      continue;
    }
    const parentId = p.get(b.id);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent && normalizeBox(parent.box).hideEmpty && b.type !== 'box' && blank(b)) out.add(b.id);
  }
  return out;
}

type Iv = [number, number];

function unionIv(ivs: Iv[]): Iv[] {
  const s = ivs.filter((v) => v[1] - v[0] > 1e-6).sort((a, b) => a[0] - b[0]);
  const out: Iv[] = [];
  for (const v of s) {
    const last = out[out.length - 1];
    if (last && v[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], v[1]);
    else out.push([v[0], v[1]]);
  }
  return out;
}

function subtractIv(a: Iv[], b: Iv[]): Iv[] {
  let cur = a.map((v) => [v[0], v[1]] as Iv);
  for (const [b0, b1] of b) {
    const next: Iv[] = [];
    for (const [a0, a1] of cur) {
      if (b1 <= a0 || b0 >= a1) next.push([a0, a1]);
      else {
        if (b0 > a0) next.push([a0, b0]);
        if (b1 < a1) next.push([b1, a1]);
      }
    }
    cur = next;
  }
  return cur.filter((v) => v[1] - v[0] > 1e-6);
}

interface FlowItem {
  id: string;
  top: number;
  bottom: number; // анхны доод ирмэг
  keptBottom: number; // шинэ өндрөөр (box жижгэрсэн бол) — анхны координатад
  visible: boolean;
  collapsible: boolean; // нуугдах / жижгэрэхэд зайгаа чөлөөлөх эсэх
}

// Анхны y → шинэ y (нуугдсан зурваснуудыг арилгасан) функц.
function compress(items: FlowItem[]): (y: number) => number {
  const freed: Iv[] = [];
  const occ: Iv[] = [];
  for (const it of items) {
    if (it.visible) {
      if (it.collapsible) {
        occ.push([it.top, it.keptBottom]);
        if (it.keptBottom < it.bottom - 0.01) freed.push([it.keptBottom, it.bottom]);
      } else {
        occ.push([it.top, it.bottom]);
      }
    } else if (it.collapsible) {
      // Нуугдсан блокийн зурвас + араас нь дагах зай (доорх эхний ХАРАГДАХ блок хүртэл).
      let next = Infinity;
      for (const o of items) {
        if (o !== it && o.visible && o.top >= it.bottom - 0.5 && o.top < next) next = o.top;
      }
      freed.push([it.top, Number.isFinite(next) ? Math.max(it.bottom, next) : it.bottom]);
    }
  }
  const f = subtractIv(unionIv(freed), unionIv(occ));
  if (!f.length) return (y) => y;
  return (y) => {
    let d = 0;
    for (const [a, b] of f) {
      if (a >= y) break;
      d += Math.min(b, y) - a;
    }
    return y - d;
  };
}

export interface FlowPlan {
  hidden: Set<string>; // зурагдахгүй блокууд (нөхцөл / хоосон / бүх агуулга нь нуугдсан box)
  y: Map<string, number>; // шинэ y (өөрчлөгдсөн блокуудад л)
  height: Map<string, number>; // box-ийн шинэ өндөр (өөрчлөгдсөнд л)
}

const r2 = (n: number) => Math.round(n * 100) / 100;

// hiddenIn — flowHiddenSet-ийн үр дүн.
export function layoutFlow(blocks: FlowBlock[], hiddenIn: Set<string>, parents?: Map<string, string>): FlowPlan {
  const plan: FlowPlan = { hidden: new Set(hiddenIn), y: new Map(), height: new Map() };
  const p = parents ?? boxParents(blocks);
  const hasBox = blocks.some((b) => b.type === 'box');
  if (!hasBox) return plan;

  const children = new Map<string, FlowBlock[]>();
  for (const b of blocks) {
    if (FLOW_FIXED_TYPES.has(b.type)) continue;
    const k = p.get(b.id) ?? '';
    if (!children.has(k)) children.set(k, []);
    children.get(k)!.push(b);
  }
  const newH = new Map<string, number>();
  const relY = new Map<string, number>();

  const hideSubtree = (id: string) => {
    plan.hidden.add(id);
    for (const c of children.get(id) || []) hideSubtree(c.id);
  };

  const layoutBox = (B: FlowBlock): boolean => {
    if (hiddenIn.has(B.id)) {
      hideSubtree(B.id);
      return false;
    }
    const R = flowRect(B);
    const kids = children.get(B.id) || [];
    if (!kids.length) {
      newH.set(B.id, R.h);
      return true;
    }
    const vis = new Map<string, boolean>();
    const kidH = new Map<string, number>();
    for (const c of kids) {
      if (c.type === 'box') {
        const v = layoutBox(c);
        vis.set(c.id, v);
        kidH.set(c.id, v ? newH.get(c.id) ?? flowRect(c).h : 0);
      } else {
        const v = !hiddenIn.has(c.id);
        vis.set(c.id, v);
        kidH.set(c.id, flowRect(c).h);
      }
    }
    if (!kids.some((c) => vis.get(c.id))) {
      hideSubtree(B.id);
      return false;
    }
    const cols = boxColumnRanges(B);
    const groups: FlowBlock[][] = cols.map(() => []);
    for (const c of kids) groups[columnIndexOf(c, cols)].push(c);
    let maxBottomAll = -Infinity;
    for (const c of kids) {
      const r = flowRect(c);
      maxBottomAll = Math.max(maxBottomAll, r.y + r.h);
    }
    const bottomPad = R.y + R.h - maxBottomAll;
    let contentBottom = -Infinity;
    for (const g of groups) {
      if (!g.length) continue;
      const items: FlowItem[] = g.map((c) => {
        const r = flowRect(c);
        return {
          id: c.id,
          top: r.y,
          bottom: r.y + r.h,
          keptBottom: r.y + (kidH.get(c.id) ?? r.h),
          visible: !!vis.get(c.id),
          collapsible: true,
        };
      });
      const map = compress(items);
      for (const it of items) {
        if (!it.visible) continue;
        const ny = map(it.top);
        relY.set(it.id, ny);
        contentBottom = Math.max(contentBottom, ny + (kidH.get(it.id) ?? 0));
      }
    }
    newH.set(B.id, Math.max(0, contentBottom + bottomPad - R.y));
    return true;
  };

  const roots = children.get('') || [];
  const rootItems: FlowItem[] = roots.map((b) => {
    const r = flowRect(b);
    if (b.type === 'box') {
      const v = layoutBox(b);
      const cfg = normalizeBox(b.box);
      return {
        id: b.id,
        top: r.y,
        bottom: r.y + r.h,
        keptBottom: r.y + (v ? newH.get(b.id) ?? r.h : 0),
        visible: v,
        collapsible: cfg.pullUp,
      };
    }
    return { id: b.id, top: r.y, bottom: r.y + r.h, keptBottom: r.y + r.h, visible: !hiddenIn.has(b.id), collapsible: false };
  });
  const F = compress(rootItems);

  const place = (b: FlowBlock, top: number) => {
    if (Math.abs(top - (Number(b.y) || 0)) > 0.01) plan.y.set(b.id, r2(top));
    if (b.type !== 'box') return;
    const nh = newH.get(b.id);
    if (nh != null && Math.abs(nh - flowRect(b).h) > 0.01) plan.height.set(b.id, r2(nh));
    for (const c of children.get(b.id) || []) {
      if (plan.hidden.has(c.id)) continue;
      const ry = relY.get(c.id);
      place(c, top + ((ry ?? c.y) - (Number(b.y) || 0)));
    }
  };
  for (const b of roots) {
    if (plan.hidden.has(b.id)) continue;
    place(b, F(Number(b.y) || 0));
  }
  return plan;
}

// Box-ийн өндрийг гишүүдэд тааруулах (Studio 'Агуулгад тааруулах') — доод зай = дотор зай.
export function boxFitHeight(blocks: FlowBlock[], boxId: string): number | null {
  const box = blocks.find((b) => b.id === boxId);
  if (!box) return null;
  const p = boxParents(blocks);
  const kids = blocks.filter((b) => p.get(b.id) === boxId);
  if (!kids.length) return null;
  const R = flowRect(box);
  const bottom = Math.max(...kids.map((k) => flowRect(k).y + flowRect(k).h));
  return Math.max(8, Math.ceil(bottom - R.y + normalizeBox(box.box).padding));
}
