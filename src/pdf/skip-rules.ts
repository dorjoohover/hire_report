// ─────────────────────────────────────────────────────────────────────────────
// 'Алгасалт' хувьсагч (assessment_variable.kind = 'skip') — шалгуулагч тодорхой асуултууд /
// бүлгийг алгассан (хариулаагүй) эсэх. Нөхцөлт алгасах дүрмээр нуугдсан болон хариулаагүй
// асуулт хоёулаа 'хариулаагүй' (userAnswer мөргүй) гэж тооцогдоно.
//
// ТОЛИН ХУУЛБАР: studio/lib/skipRules.ts ↔ hire_report/src/pdf/skip-rules.ts (' ↔ ').
//
//   {{custom.<key>}} — output 'number' бол 1 (алгассан) / 0, 'text' бол skippedText / answeredText.
//   Блокийн 'Харагдах нөхцөл'-д: 'алгассан бол харуулна' / 'хариулсан бол харуулна'.
//
// Асуултыг 'question[<id>]' хэлбэрээр хадгална — загвар / тест зөөхөд (core remapQuestionTokens)
// ID автоматаар шинэ орчны ID болно.
// ─────────────────────────────────────────────────────────────────────────────

// answer — нэг асуултад заасан хариултыг (жиш 'Үгүй') сонгосон эсвэл тэр асуулт өөрөө хариулаагүй бол.
export type SkipScope = 'questions' | 'category' | 'answer';
// all — нэгд нь ч хариулаагүй; any — аль нэгийг нь хариулаагүй; fewer — хариулсан нь min-ээс цөөн.
export type SkipMode = 'all' | 'any' | 'fewer';

export interface SkipRules {
  scope: SkipScope;
  questions: string[]; // ['question[101]', …] (answer үед эхнийх нь)
  category: string; // бүлгийн (асуултын блок) нэр
  answers: string[]; // scope = answer — 'алгассан' гэж үзэх хариултууд (жиш ['Үгүй'])
  mode: SkipMode;
  min: number; // mode = fewer
  output: 'number' | 'text';
  skippedText: string;
  answeredText: string;
}

export function defaultSkipRules(): SkipRules {
  return {
    scope: 'category',
    questions: [],
    category: '',
    answers: [],
    mode: 'all',
    min: 1,
    output: 'number',
    skippedText: '',
    answeredText: '',
  };
}

const QREF_RE = /question\s*\[\s*(\d+)\s*\]/;

export function normalizeSkipRules(r: any): SkipRules {
  const d = defaultSkipRules();
  const qs: string[] = Array.isArray(r?.questions)
    ? r.questions
        .map((q: any) => {
          const s = String(q ?? '').trim();
          const m = s.match(QREF_RE);
          if (m) return `question[${m[1]}]`;
          return /^\d+$/.test(s) ? `question[${s}]` : '';
        })
        .filter(Boolean)
    : [];
  const min = Math.round(Number(r?.min));
  const answers: string[] = Array.isArray(r?.answers)
    ? Array.from(new Set(r.answers.map((a: any) => String(a ?? '').trim()).filter(Boolean)))
    : [];
  return {
    scope: r?.scope === 'questions' ? 'questions' : r?.scope === 'answer' ? 'answer' : 'category',
    questions: Array.from(new Set(qs)),
    category: String(r?.category ?? '').trim(),
    answers,
    mode: r?.mode === 'any' ? 'any' : r?.mode === 'fewer' ? 'fewer' : 'all',
    min: Number.isFinite(min) && min > 0 ? min : d.min,
    output: r?.output === 'text' ? 'text' : 'number',
    skippedText: String(r?.skippedText ?? ''),
    answeredText: String(r?.answeredText ?? ''),
  };
}

export function skipQuestionIds(r: SkipRules): number[] {
  const out: number[] = [];
  for (const q of r.questions || []) {
    const m = String(q).match(QREF_RE);
    if (m) out.push(Number(m[1]));
  }
  return out;
}

// '101, 102 103' → ['question[101]', 'question[102]', 'question[103]']
export function parseQuestionIdList(text: string): string[] {
  const ids = String(text || '').match(/\d+/g) || [];
  return Array.from(new Set(ids.map((id) => `question[${id}]`)));
}

export function formatQuestionIdList(qs: string[]): string {
  return skipQuestionIds({ ...defaultSkipRules(), questions: qs }).join(', ');
}

// 'Үгүй, Мэдэхгүй' / мөр мөрөөр → ['Үгүй', 'Мэдэхгүй']
export function parseAnswerList(text: string): string[] {
  return Array.from(
    new Set(
      String(text || '')
        .split(/[,\n;]/)
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  );
}

const normAnswer = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

export interface SkipInput {
  answered: (questionId: number) => boolean;
  // Бүлгийн бүх асуултын id (тестийн бүтцээс). Олдохгүй бол [].
  categoryQuestionIds: (name: string) => number[];
  // Бүлгийн асуулт олдоогүй үеийн нөөц — тухайн бүлэгт хариулсан асуултын тоо (null = мэдэгдэхгүй).
  categoryAnsweredCount?: (name: string) => number | null;
  // scope = answer — тухайн асуултад сонгосон хариултуудын текст (матрицын нүд, бичсэн утга орно).
  answerTexts?: (questionId: number) => string[];
}

// true — алгассан, false — хариулсан.
export function evaluateSkip(rules: SkipRules, input: SkipInput): boolean {
  const r = normalizeSkipRules(rules);
  if (r.scope === 'answer') {
    const id = skipQuestionIds(r)[0];
    if (!id) return false;
    // Асуулт өөрөө хариулаагүй (өмнөх дүрмээр нуугдсан) бол дараагийнх нь ч асуугдаагүй.
    if (!input.answered(id)) return true;
    if (!r.answers.length) return false;
    const want = new Set(r.answers.map(normAnswer));
    return (input.answerTexts ? input.answerTexts(id) : []).some((t) => want.has(normAnswer(t)));
  }
  const ids = r.scope === 'questions' ? skipQuestionIds(r) : input.categoryQuestionIds(r.category);
  if (!ids.length) {
    if (r.scope !== 'category' || !r.category) return false;
    const n = input.categoryAnsweredCount ? input.categoryAnsweredCount(r.category) : null;
    if (n === null || n === undefined) return false;
    return r.mode === 'fewer' ? n < r.min : n === 0;
  }
  const answeredN = ids.filter((id) => input.answered(id)).length;
  if (r.mode === 'any') return answeredN < ids.length;
  if (r.mode === 'fewer') return answeredN < r.min;
  return answeredN === 0;
}

export function skipTokenValue(rules: SkipRules, skipped: boolean): string {
  const r = normalizeSkipRules(rules);
  if (r.output === 'text') return skipped ? r.skippedText : r.answeredText;
  return skipped ? '1' : '0';
}

// ── Studio UI ────────────────────────────────────────────────────────────────
export const SKIP_MODE_LABELS: { value: SkipMode; label: string }[] = [
  { value: 'all', label: 'Бүгдийг нь алгассан (нэгд нь ч хариулаагүй)' },
  { value: 'any', label: 'Аль нэгийг нь алгассан' },
  { value: 'fewer', label: 'Хариулсан асуулт N-ээс цөөн' },
];
