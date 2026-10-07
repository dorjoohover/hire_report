// ts-node --transpile-only test/answer-category-max.spec-lite.ts
// {{answerCategory[i].max}} / {{i-р дэд бүлгийн дээд оноо}} — дэд бүлэг (хариултын ангилал)
// тус бүрийн дээд оноо асуултын бүтцээс (report-widgets.ts answerCategoryMaxes) +
// DynamicTemplateRenderer.loadAnswerCategories → resolveTokens / томьёо хувьсагч.
import { answerCategoryMaxes, AnswerMaxRow } from '../src/pdf/report-widgets';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { NAMED_SQL } from '../src/report-data/named-sql';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

// pg numeric → string ирдэгтэй адил зарим утгыг string-ээр.
let aid = 0;
const row = (q: number, type: number, o: Partial<AnswerMaxRow> = {}): AnswerMaxRow => ({
  questionId: q,
  type,
  minValue: '1',
  maxValue: '5',
  questionPoint: null,
  isCalculated: true,
  answerId: o.answerId ?? ++aid,
  categoryId: null,
  categoryParentId: null,
  point: '0',
  negative: false,
  reverse: false,
  matrixId: null,
  matrixPoint: null,
  matrixCategoryId: null,
  matrixCategoryParentId: null,
  ...o,
});

const rows: AnswerMaxRow[] = [
  // SLIDERSINGLE (80) — WHOQOL маягийн 1–5: 3 асуулт ангилал 10-д (нэг нь reverse), 1 нь 11-д.
  row(1, 80, { categoryId: '10' }),
  row(2, 80, { categoryId: '10', reverse: true }),
  row(3, 80, { categoryId: 10 }),
  row(4, 80, { categoryId: 11 }),
  // negative гулсуур (1–5) → дээд нь −1.
  row(5, 80, { categoryId: 11, negative: true }),
  // SLIDER (70) — нэг асуултад 2 гулсуур (0–3), өөр ангилал.
  row(6, 70, { minValue: '0', maxValue: '3', categoryId: 12 }),
  row(6, 70, { minValue: '0', maxValue: '3', categoryId: 13 }),
  // SINGLE (10) — бүх хариулт ангилал 12-т (0..3) → 3.
  ...[0, 1, 2, 3].map((p) => row(7, 10, { categoryId: 12, point: String(p) })),
  // SINGLE (10) — холимог: 13 (2), 14 (1); 14-ийн хариулт сөрөг ч 0-ээс доош биш.
  row(8, 10, { categoryId: 13, point: '2' }),
  row(8, 10, { categoryId: 14, point: '-1' }),
  // MULTIPLE (20) — 13-ын эерэг хариултуудын нийлбэр (2 + 1), сөрөгийг тооцохгүй.
  row(9, 20, { categoryId: 13, point: '2' }),
  row(9, 20, { categoryId: 13, point: '1' }),
  row(9, 20, { categoryId: 13, point: '-3' }),
  // CONSTANT_SUM (50) — question.point = 10, хариулт бүр өөр ангилал → тус бүр 10.
  row(10, 50, { questionPoint: '10', categoryId: 15 }),
  row(10, 50, { questionPoint: '10', categoryId: 16 }),
  row(10, 50, { questionPoint: '10', categoryId: 16 }),
  // MATRIX (40) — мөр 900 (мөрийн ангилал 17): баганууд 0/1/2 → 2.
  //               мөр 901: баганын ангилал 18 (1) ба 19 (3) — нүднээс ангилал.
  row(11, 40, { answerId: 900, categoryId: 17, matrixId: 1, matrixPoint: '0' }),
  row(11, 40, { answerId: 900, categoryId: 17, matrixId: 2, matrixPoint: '1' }),
  row(11, 40, { answerId: 900, categoryId: 17, matrixId: 3, matrixPoint: '2' }),
  row(11, 40, { answerId: 901, categoryId: 17, matrixId: 4, matrixPoint: '1', matrixCategoryId: 18 }),
  row(11, 40, { answerId: 901, categoryId: 17, matrixId: 5, matrixPoint: '3', matrixCategoryId: 19 }),
  // TEXT (60) / NUMBER (90) — оноо биш.
  row(12, 60, { categoryId: 20, point: '99' }),
  row(13, 90, { categoryId: 20, maxValue: '1000' }),
  // Эцэг ангилал: 21, 22 нь 30-ийн дэд → 30 = 5 + 5.
  row(14, 80, { categoryId: 21, categoryParentId: 30 }),
  row(15, 80, { categoryId: 22, categoryParentId: '30' }),
];
const m = answerCategoryMaxes(rows);
eq('slider 1–5 × 3 (reverse ч мөн 5)', m.get(10), 15);
eq('slider + negative гулсуур (5 + −1)', m.get(11), 4);
eq('SLIDER 0–3 + SINGLE 0..3', m.get(12), 6);
eq('SLIDER 3 + SINGLE холимог 2 + MULTIPLE 3', m.get(13), 8);
eq('SINGLE холимог сөрөг → 0', m.get(14), 0);
eq('CONSTANT_SUM ангилал бүр question.point (давхардалгүй)', [m.get(15), m.get(16)], [10, 10]);
eq('MATRIX мөрийн ангилал: мөрийн max нүд', m.get(17), 2);
eq('MATRIX баганын ангилал: тухайн нүд (өөр ангиллын нүд сонгож болно)', [m.get(18), m.get(19)], [1, 3]);
eq('TEXT / NUMBER алгасна', m.has(20), false);
eq('эцэг ангилалд дэд ангиллууд нэмэгдэнэ', [m.get(21), m.get(22), m.get(30)], [5, 5, 10]);

// ── Renderer: loadAnswerCategories → values / alias / томьёо ──────────────────
const cats = [
  { id: 10, name: 'Биеийн эрүүл мэнд' },
  { id: 11, name: 'Нийгмийн харилцаа' },
  { id: 99, name: 'Хоосон' },
];
const r: any = Object.create(DynamicTemplateRenderer.prototype);
Object.assign(r, {
  currentAiJsonData: null,
  currentCustomVariableTokens: {},
  currentCustomVariableEntries: {},
  tokenDepth: 0,
  currentCategoryStats: [],
  currentScoreRules: {},
  currentCustomNames: [],
  currentScoreInput: { point: null, total: null, categories: [] },
  demoMode: false,
  currentAnswerStats: [
    { id: 10, parentId: null, name: 'Биеийн эрүүл мэнд', categoryId: 1, categoryName: 'WHOQOL', point: 12, count: 3 },
    { id: 11, parentId: null, name: 'Нийгмийн харилцаа', categoryId: 1, categoryName: 'WHOQOL', point: 3, count: 2 },
  ],
  currentAnswerCategories: [],
  currentQuestionAnswers: new Map(),
  currentFormulas: {},
  formulaCache: new Map(),
  formulaStack: new Set(),
  userAnswer: {
    query: async (sql: string) =>
      sql === NAMED_SQL.ANSWER_CATEGORY_LIST ? cats : sql === NAMED_SQL.ANSWER_CATEGORY_MAX_ROWS ? rows : [],
  },
});
const ctx: any = { result: {}, exam: {}, firstname: 'A', lastname: 'B' };
const T = (s: string) => r.resolveTokens(s, ctx);

(async () => {
  r.currentAnswerCategories = await r.loadAnswerCategories(112);
  eq('loadAnswerCategories max', r.currentAnswerCategories.map((c: any) => c.max), [15, 4, 0]);
  eq('{{answerCategory[1].score}} / {{answerCategory[1].max}}', T('{{answerCategory[1].score}} / {{answerCategory[1].max}}'), '12 / 15');
  eq('{{answerCategory[1].percent}}', T('{{answerCategory[1].percent}}'), '80');
  eq('{{1-р дэд бүлгийн оноо}} / {{1-р дэд бүлгийн дээд оноо}}', T('{{1-р дэд бүлгийн оноо}} / {{1-р дэд бүлгийн дээд оноо}}'), '12 / 15');
  eq('{{2-р дэд бүлгийн хувь}}', T('{{2-р дэд бүлгийн хувь}}'), '75');
  eq('дээд оноогүй дэд бүлэг → хоосон', T('[{{answerCategory[3].max}}|{{answerCategory[3].percent}}]'), '[|]');
  // WHOQOL хувиргалт: (оноо − асуултын тоо) / (дээд − асуултын тоо) × 100
  r.currentFormulas = {
    whoqol: {
      expression: '({{answerCategory[1].score}} - {{answerCategory[1].count}}) / ({{answerCategory[1].max}} - {{answerCategory[1].count}}) * 100',
      decimals: 1,
    },
  };
  eq('томьёо хувьсагчид answerCategory[1].max', T('{{custom.whoqol}}'), '75');
  // Demo preview — оноо жишээ, дээд оноо бодит бүтцээс.
  r.demoMode = true;
  const demo = await r.loadAnswerCategories(112);
  eq('demo: дээд оноо бодит', demo.map((c: any) => c.max), [15, 4, 0]);
  // Дээд онооны query алдаа гарвал дэд бүлгүүд хэвээр, max байхгүй.
  r.demoMode = false;
  r.userAnswer = {
    query: async (sql: string) => {
      if (sql === NAMED_SQL.ANSWER_CATEGORY_MAX_ROWS) throw new Error('boom');
      return cats;
    },
  };
  const noMax = await r.loadAnswerCategories(112);
  eq('max query алдаа → оноо хэвээр, max undefined', noMax.map((c: any) => [c.point, c.max]), [[12, null], [3, null], [0, null]]);
  console.log(fail ? `\n${fail} алдаа` : '\nбүгд OK');
  process.exit(fail ? 1 : 0);
})();
