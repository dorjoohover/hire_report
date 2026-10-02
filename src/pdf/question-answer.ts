// {{question[<id>].answer}} — тухайн асуултад шалгуулагчийн өгсөн хариултыг текстээр.
//   {{question[2656].answer}} / .answer.value / {{question[2656]}} — хариултын текст
//   {{question[2656].point}} — оноо (олон мөртэй бол нийлбэр)
//   {{question[2656].name}}  — асуултын текст (HTML-гүй)
// Төрлөөр: SINGLE / MULTIPLE / TRUE_FALSE — сонгосон хариулт(ууд) ", "-аар;
// MATRIX — "Мөр: Багана" "; "-аар; SLIDER — "Мөр: утга"; SLIDERSINGLE — утга (шошготой бол
// шошго); TEXT / NUMBER / TIME — бичсэн утга.

export const QUESTION_TOKEN_KEY_RE = /^question\[(\d+)\](?:\.(answer\.value|answer|value|point|name))?$/;

export interface QuestionAnswerRow {
  questionId: number;
  questionType: number;
  questionName?: string | null;
  slider?: string | null;
  minValue?: number | string | null;
  value?: string | null;
  point?: number | string | null;
  answerValue?: string | null;
  matrixValue?: string | null;
}

const SLIDER = 70;
const SLIDERSINGLE = 80;

const fmt = (v: unknown): string => {
  const n = Number(v);
  if (v === null || v === undefined || v === '' || !Number.isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
};

export function stripHtml(html: string | null | undefined): string {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>\s*<p[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Слайдерын утгыг шошгоор (question.slider = "Хэзээ ч үгүй, Заримдаа, …", minValue-аас эхэлнэ).
function sliderLabel(row: QuestionAnswerRow): string {
  const p = Number(row.point);
  if (!Number.isFinite(p)) return '';
  const labels = String(row.slider ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const min = Number(row.minValue) || 0;
  const label = labels[Math.round(p) - min];
  return label || fmt(p);
}

export function groupQuestionAnswers(rows: QuestionAnswerRow[]): Map<number, QuestionAnswerRow[]> {
  const map = new Map<number, QuestionAnswerRow[]>();
  for (const r of rows || []) {
    const id = Number(r.questionId);
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(r);
  }
  return map;
}

export function questionTokenValue(rows: QuestionAnswerRow[] | undefined, field?: string): string {
  // Хариулаагүй (жиш "Үгүй" гэснээр алгассан) асуултын оноо = 0 — томьёонд
  // ('{{question[1].point}} * {{question[2].point}} * 8 + …') бүх илэрхийллийг хоосон болгохгүй.
  if (!rows || !rows.length) return field === 'point' ? '0' : '';
  if (field === 'name') return stripHtml(rows[0].questionName);
  if (field === 'point') {
    const pts = rows.map((r) => Number(r.point)).filter((n) => Number.isFinite(n));
    return pts.length ? fmt(pts.reduce((a, b) => a + b, 0)) : '0';
  }
  const type = Number(rows[0].questionType);
  const isMatrix = rows.some((r) => r.matrixValue != null && r.matrixValue !== '');
  const parts = rows
    .map((r) => {
      if (r.matrixValue != null && r.matrixValue !== '') {
        return r.answerValue ? `${r.answerValue}: ${r.matrixValue}` : String(r.matrixValue);
      }
      if (type === SLIDERSINGLE) return sliderLabel(r);
      if (type === SLIDER) {
        const v = sliderLabel(r);
        return r.answerValue ? `${r.answerValue}: ${v}` : v;
      }
      if (r.value != null && r.value !== '') return String(r.value);
      if (r.answerValue != null && r.answerValue !== '') return String(r.answerValue);
      return fmt(r.point);
    })
    .filter((s) => s !== '');
  return parts.join(isMatrix || type === SLIDER ? '; ' : ', ');
}
