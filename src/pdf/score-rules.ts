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
export type ScoreRuleSourceType =
  | 'total'
  | 'percent'
  | 'category'
  | 'categoryPercent'
  | 'categoryAvg'
  // Бүлэг (асуултын ангилал) / дэд бүлэг (хариултын ангилал)-ийн дундаж оноо.
  // source.category = бүлгийн нэр ('Гүйцэтгэл') эсвэл бүтэн зам
  // ('Гүйцэтгэл/Багын оролцоо'); {{Нэр[Дэд бүлэг]}} гэж дэд бүлгээр дуудна.
  | 'group'
  // Дэд бүлэг (хариултын ангилал — жиш матрицын мөр Тамхи)-ийн нийт / дундаж оноо
  // (бүх бүлгээр). source.category = дэд бүлгийн нэр; {{custom.x[i]}} — i-р дэд бүлгээр,
  // {{Нэр[Тамхи]}} — нэрээр.
  | 'answerCategory'
  | 'answerCategoryAvg'
  // Томьёо хувьсагчийн (kind = formula) тооцоолсон утга — source.category = тэр хувьсагчийн key.
  | 'variable';

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
  // count — тухайн бүлэгт хариулсан асуултын тоо (categoryAvg-д).
  categories: { categoryName: string; point: number; totalPoint: number; count?: number }[];
  // group эх сурвалжид: (бүлэг, дэд бүлэг?) → дундаж оноо.
  groupValue?: (group: string, sub?: string) => number | null;
  // answerCategory* эх сурвалжид: дэд бүлэг (хариултын ангилал) бүрийн оноо, асуултын тоо.
  answerCategories?: { name: string; point: number; count?: number }[];
  // variable эх сурвалжид: томьёо хувьсагчийн key → тооцоолсон тоо.
  variableValue?: (key: string) => number | null;
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Бүлгийн дундаж оноо = бүлгийн оноо / хариулсан асуултын тоо, 2 оронтой
// бутархай хүртэл тоймлоно ({{category[i].avg}}-д ХЭВЛЭГДЭХ утгатай ижил
// тоогоор нөхцлийг шалгахын тулд).
export function categoryAvg(row: { point: number; count?: number }): number | null {
  const p = toNum(row?.point);
  const n = toNum(row?.count);
  if (p === null || !n) return null;
  return Math.round((p / n) * 100) / 100;
}

export function scoreRuleSourceValue(rules: ScoreRules, input: ScoreRuleInputs): number | null {
  const type = rules?.source?.type;
  const pct = (p: number | null, t: number | null) =>
    p === null || t === null || t === 0 ? null : (p / t) * 100;
  if (type === 'total') return toNum(input.point);
  if (type === 'group') return input.groupValue ? input.groupValue(rules.source.category || '') : null;
  if (type === 'variable') {
    const key = (rules.source.category || '').trim().replace(/^custom\./, '');
    return key && input.variableValue ? toNum(input.variableValue(key)) : null;
  }
  if (type === 'answerCategory' || type === 'answerCategoryAvg') {
    const want = (rules.source.category || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const row = (input.answerCategories || []).find(
      (c) => (c.name || '').trim().replace(/\s+/g, ' ').toLowerCase() === want,
    );
    if (!row) return null;
    return type === 'answerCategory' ? toNum(row.point) : categoryAvg(row);
  }
  if (type === 'percent') return pct(toNum(input.point), toNum(input.total));
  if (type === 'category' || type === 'categoryPercent' || type === 'categoryAvg') {
    const want = (rules.source.category || '').trim().toLowerCase();
    const row = (input.categories || []).find(
      (c) => (c.categoryName || '').trim().toLowerCase() === want,
    );
    if (!row) return null;
    if (type === 'category') return toNum(row.point);
    if (type === 'categoryPercent') return pct(toNum(row.point), toNum(row.totalPoint));
    return categoryAvg(row);
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

export function evaluateScoreRulesWithValue(rules: ScoreRules, x: number | null): string {
  if (!rules) return '';
  if (x === null) return rules.elseText ?? '';
  for (const c of rules.conditions || []) {
    if (matchScoreCondition(c, x)) return c.text ?? '';
  }
  return rules.elseText ?? '';
}

export function evaluateScoreRules(rules: ScoreRules, input: ScoreRuleInputs): string {
  if (!rules) return '';
  return evaluateScoreRulesWithValue(rules, scoreRuleSourceValue(rules, input));
}

// {{Нэр[Багын оролцоо]}} — "group" эх сурвалжтай хувьсагчийг тухайн дэд
// бүлгийн (source.category-д заасан бүлэг доторх) оноогоор үнэлнэ.
export function evaluateScoreRulesForSub(rules: ScoreRules, input: ScoreRuleInputs, sub: string): string {
  if (!rules) return '';
  if (rules.source?.type !== 'group') return evaluateScoreRules(rules, input);
  const x = input.groupValue ? input.groupValue(rules.source.category || '', sub) : null;
  return evaluateScoreRulesWithValue(rules, x);
}

// Дэд бүлгийн (хариултын ангилал) эх сурвалжтай эсэх.
export function isAnswerCategorySource(rules: ScoreRules | null | undefined): boolean {
  return String(rules?.source?.type || '').startsWith('answerCategory');
}

// {{custom.<key>[i]}} / {{Нэр[Тамхи]}} — тухайн дэд бүлгийн оноогоор нөхцлийг шалгана
// (дэд бүлгийн бус эх сурвалжтай бол энгийн үнэлгээ).
export function evaluateScoreRulesForAnswerCategory(
  rules: ScoreRules,
  input: ScoreRuleInputs,
  row: { name: string; point: number; count?: number },
): string {
  if (!rules) return '';
  if (!isAnswerCategorySource(rules)) return evaluateScoreRules(rules, input);
  return evaluateScoreRules(
    { ...rules, source: { ...rules.source, category: row.name } },
    { ...input, answerCategories: [row] },
  );
}

// {{custom.<key>[i]}} — i-р бүлэгт зориулж нөхцлийг шалгана: source.category-г
// тухайн бүлгийн нэрээр сольж үнэлнэ (хэмжигдэхүүн — нийлбэр/хувь/дундаж —
// Studio дээр сонгосноороо үлдэнэ). Бүлгийн бус (total/percent) эх сурвалжтай
// бол энгийн үнэлгээтэй адил.
export function evaluateScoreRulesForCategory(
  rules: ScoreRules,
  input: ScoreRuleInputs,
  categoryName: string,
): string {
  if (!rules) return '';
  const type = String(rules.source?.type || '');
  if (!type.startsWith('category')) return evaluateScoreRules(rules, input);
  return evaluateScoreRules(
    { ...rules, source: { ...rules.source, category: categoryName } },
    input,
  );
}
