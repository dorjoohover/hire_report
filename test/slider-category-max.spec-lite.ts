// ts-node --transpile-only -r tsconfig-paths/register test/slider-category-max.spec-lite.ts
// Гулсуурын (SLIDER 70 / SLIDERSINGLE 80) асуулттай бүлгийн дээд оноо — core-ийн totalPoint
// (асуулт бүр 1) биш асуултын бүтцээс: {{category[i].max}} / .percent / progress-bar.
import { sliderCategoryMaxes, SliderCategoryMaxRow } from '../src/pdf/report-widgets';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { NAMED_SQL } from '../src/report-data/named-sql';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

const q = (cat: number, name: string, qid: number, type: number, o: Partial<SliderCategoryMaxRow> = {}): SliderCategoryMaxRow => ({
  categoryId: cat,
  categoryName: name,
  questionCount: null,
  questionId: qid,
  type,
  point: '1',
  sliderMax: null,
  ...o,
});
const rows: SliderCategoryMaxRow[] = [
  // ISI: 7 сингл гулсуур (0–4), questionCount 7 → 28 (core totalPoint = 7).
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => q(213, 'Нойргүйдлийн зэргийг үнэлэх асуумж', i, 80, { questionCount: '7', sliderMax: '4' })),
  // Олон мөртэй гулсуур (Big Five маягийн): 2 асуулт × 10 мөр × 5 = 100; нэг TEXT асуулт (−Infinity) → 0.
  q(141, 'Big Five', 20, 70, { questionCount: 3, sliderMax: '50' }),
  q(141, 'Big Five', 21, 70, { questionCount: 3, sliderMax: '50' }),
  q(141, 'Big Five', 22, 60, { questionCount: 3, point: '-Infinity' }),
  // Холимог: гулсуур (5) + энгийн асуулт (question.point 3) = 8.
  q(300, 'Холимог', 30, 80, { questionCount: 2, sliderMax: '5' }),
  q(300, 'Холимог', 31, 10, { questionCount: 2, point: '3' }),
  // Санамсаргүй: 4 асуултаас 2 (questionCount 2) → (4×4)·2/4 = 8.
  ...[40, 41, 42, 43].map((i) => q(400, 'Санамсаргүй', i, 80, { questionCount: 2, sliderMax: 4 })),
  // Давхардсан мөр (асуулт нэг л удаа тоологдоно).
  q(500, 'Давхар', 50, 80, { sliderMax: '5' }),
  q(500, 'Давхар', 50, 80, { sliderMax: '5' }),
];
const m = sliderCategoryMaxes(rows);
eq('ISI 7 × 4', m.byId.get(213), 28);
eq('олон мөртэй гулсуур + TEXT', m.byId.get(141), 100);
eq('гулсуур + энгийн асуулт', m.byId.get(300), 8);
eq('санамсаргүй сонголт (questionCount < асуулт)', m.byId.get(400), 8);
eq('давхар мөр', m.byId.get(500), 5);
eq('нэрээр (жижиг/том үсэг, зай)', m.byName.get('нойргүйдлийн зэргийг үнэлэх асуумж'), 28);

// ── Renderer ────────────────────────────────────────────────────────────────
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
  currentAnswerStats: [],
  currentAnswerCategories: [],
  currentQuestionAnswers: new Map(),
  currentFormulas: {},
  formulaCache: new Map(),
  formulaStack: new Set(),
  currentAnswerMaxRows: null,
  groupMaxCache: new Map(),
  categoriesCache: new Map(),
  currentSliderMaxes: null,
  userAnswer: {
    query: async (sql: string) => (sql === NAMED_SQL.SLIDER_CATEGORY_MAX_ROWS ? rows : []),
    partialCalculator: async () => [
      { categoryName: 'Нойргүйдлийн  зэргийг үнэлэх асуумж', point: 5, totalPoint: 7 },
      { categoryName: 'AUDIT', point: 3, totalPoint: 40 },
    ],
  },
});
const ctx: any = { result: {}, exam: {}, firstname: 'A', lastname: 'B' };
const T = (s: string) => r.resolveTokens(s, ctx);

(async () => {
  r.currentSliderMaxes = await r.loadSliderCategoryMaxes(112);
  r.currentCategoryStats = r.withSliderMax([
    { id: 209, categoryName: 'AUDIT', point: 3, totalPoint: 40, count: 10 },
    { id: 213, categoryName: 'Нойргүйдлийн зэргийг үнэлэх асуумж', point: 5, totalPoint: 7, count: 7 },
  ]);
  eq('гулсуургүй бүлэг хэвээр', T('{{category[1].score}}/{{category[1].max}}'), '3/40');
  eq('ISI: 5/28 (өмнө нь 5/7)', T('{{category[2].score}}/{{category[2].max}}'), '5/28');
  eq('ISI хувь', T('{{category[2].percent}}'), '18');
  eq('Монгол нэрээр', T('{{2-р бүлгийн оноо}} / {{2-р бүлгийн дээд оноо}}'), '5 / 28');
  eq('id-гүй (partialCalculator) мөр нэрээр', (await r.getCategories({ code: 'X', type: 1 })).map((x: any) => x.totalPoint), [28, 40]);
  // Гулсуургүй тест / query алдаа → өөрчлөлтгүй.
  r.userAnswer = { query: async () => [] };
  eq('гулсуургүй тест → null', await r.loadSliderCategoryMaxes(4), null);
  r.userAnswer = { query: async () => { throw new Error('boom'); } };
  eq('query алдаа → null', await r.loadSliderCategoryMaxes(4), null);
  r.currentSliderMaxes = null;
  eq('maxes байхгүй → мөр хэвээр', r.withSliderMax([{ id: 213, categoryName: 'x', point: 1, totalPoint: 7 }])[0].totalPoint, 7);
  console.log(fail ? `\n${fail} алдаа` : '\nбүгд OK');
  process.exit(fail ? 1 : 0);
})();
