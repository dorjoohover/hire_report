// ─────────────────────────────────────────────────────────────────────────────
// Studio "Нөхцөлт хувьсагч" (assessment_variable.kind = 'score') — оноо/хувиас
// хамааран өөр өөр текст сонгох логик.
//
// studio/lib/scoreRules.ts-тэй ЯГ АДИЛ (өөр service тул давхардуулав — 2 талд
// өөрчлөлт хийхдээ хоёуланг нь синк байлгах).
//
// Нөхцлүүдийг ДАРААЛЛААР нь шалгаж, ЭХНИЙ тохирсон нөхцөлийн текстийг
// буцаана; аль нь ч тохирохгүй бол elseText. "between" нь 2 талдаа
// хамааруулсан (value ≤ x ≤ value2).
// ─────────────────────────────────────────────────────────────────────────────

export type ScoreRuleOp = '<' | '<=' | '>' | '>=' | '=' | 'between';
export type ScoreRuleSourceType = 'total' | 'percent' | 'category' | 'categoryPercent';

export interface ScoreRuleCondition {
  op: ScoreRuleOp;
  value: number | null;
  value2?: number | null;
  text: string;
}

export interface ScoreRules {
  source: { type: ScoreRuleSourceType; category?: string };
  conditions: ScoreRuleCondition[];
  elseText?: string;
}

export interface ScoreRuleInputs {
  point: number | null; // нийт оноо (result.point)
  total: number | null; // дээд оноо (result.total)
  categories: { categoryName: string; point: number; totalPoint: number }[];
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function scoreRuleSourceValue(rules: ScoreRules, input: ScoreRuleInputs): number | null {
  const type = rules?.source?.type;
  const pct = (p: number | null, t: number | null) =>
    p === null || t === null || t === 0 ? null : (p / t) * 100;
  if (type === 'total') return toNum(input.point);
  if (type === 'percent') return pct(toNum(input.point), toNum(input.total));
  if (type === 'category' || type === 'categoryPercent') {
    const want = (rules.source.category || '').trim().toLowerCase();
    const row = (input.categories || []).find(
      (c) => (c.categoryName || '').trim().toLowerCase() === want,
    );
    if (!row) return null;
    return type === 'category'
      ? toNum(row.point)
      : pct(toNum(row.point), toNum(row.totalPoint));
  }
  return null;
}

export function matchScoreCondition(c: ScoreRuleCondition, x: number): boolean {
  const a = toNum(c.value);
  if (a === null) return false;
  switch (c.op) {
    case '<':
      return x < a;
    case '<=':
      return x <= a;
    case '>':
      return x > a;
    case '>=':
      return x >= a;
    case '=':
      return Math.abs(x - a) < 1e-9;
    case 'between': {
      const b = toNum(c.value2);
      if (b === null) return false;
      return x >= Math.min(a, b) && x <= Math.max(a, b);
    }
    default:
      return false;
  }
}

export function evaluateScoreRules(rules: ScoreRules, input: ScoreRuleInputs): string {
  if (!rules) return '';
  const x = scoreRuleSourceValue(rules, input);
  if (x === null) return rules.elseText ?? '';
  for (const c of rules.conditions || []) {
    if (matchScoreCondition(c, x)) return c.text ?? '';
  }
  return rules.elseText ?? '';
}
