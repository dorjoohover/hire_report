// ts-node --transpile-only test/formula-variable.spec-lite.ts
// Томьёо хувьсагч (kind='formula'), "variable" эх сурвалжтай нөхцөлт хувьсагч,
// хариулаагүй асуултын оноо = 0 — DynamicTemplateRenderer-ийн жинхэнэ resolveTokens-оор.
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { evaluateScoreRules } from '../src/pdf/score-rules';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

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
});
const ctx: any = { result: {}, exam: {}, firstname: 'A', lastname: 'B' };
const row = (id: number, point: number, value?: string) => ({
  questionId: id, questionName: `Q${id}`, questionType: 90, point, value, answerValue: null, matrixValue: null,
});
// Excel "Тооцоолол" жишээ: ажил — Үгүй/Үгүй; шилжилт Р7=1, Р8=6 өдөр, Р9=40 мин;
// чөлөөт Р10=1, Р11=3, Р12=60 мин; Р13=1, Р14=1, Р15=60; суугаа Р16=16 цаг = 960 мин.
// Р2,Р3,Р5,Р6 (ажлын) — "Үгүй" гэснээр АЛГАССАН → хариултгүй.
const answers: [number, number][] = [
  [1, 0], [4, 0], [7, 1], [8, 6], [9, 40], [10, 1], [11, 3], [12, 60], [13, 1], [14, 1], [15, 60], [16, 960],
];
for (const [id, p] of answers) r.currentQuestionAnswers.set(id, [row(id, p)]);
const q = (i: number) => `{{question[${i}].point}}`;
r.currentFormulas = {
  work: { expression: `${q(1)} * ${q(2)} * ${q(3)} * 8 + ${q(4)} * ${q(5)} * ${q(6)} * 4`, decimals: 0 },
  travel: { expression: `${q(7)} * ${q(8)} * ${q(9)} * 4`, decimals: 0 },
  leisure: { expression: `${q(10)} * ${q(11)} * ${q(12)} * 8 + ${q(13)} * ${q(14)} * ${q(15)} * 4`, decimals: 0 },
  totalMet: { expression: '{{custom.work}} + {{custom.travel}} + {{custom.leisure}}', decimals: 0 },
  vigorous: { expression: `${q(1)} * ${q(2)} * ${q(3)} * 8 + ${q(10)} * ${q(11)} * ${q(12)} * 8`, decimals: 0 },
  moderate: { expression: `${q(4)} * ${q(5)} * ${q(6)} * 4 + ${q(7)} * ${q(8)} * ${q(9)} * 4 + ${q(13)} * ${q(14)} * ${q(15)} * 4`, decimals: 0 },
  sitting: { expression: q(16), decimals: 0 },
  hours: { expression: '{{custom.sitting}} / 7', decimals: 2 },
  loopA: { expression: '{{custom.loopB}} + 1', decimals: 0 },
  loopB: { expression: '{{custom.loopA}} + 1', decimals: 0 },
  bad: { expression: '{{custom.work}} / 0', decimals: 0 },
};
r.currentCustomNames = [{ key: 'totalMet', label: 'Нийт МЕТ' }];
r.currentScoreInput.variableValue = (k: string) => r.formulaValue(k, ctx);

const T = (s: string) => r.resolveTokens(s, ctx);
eq('алгассан асуултын оноо', T(q(2)), '0');
eq('ажлын байр (бүгд Үгүй)', T('{{custom.work}}'), '0');
eq('шилжилт = 1·6·40·4', T('{{custom.travel}}'), '960');
eq('чөлөөт = 1·3·60·8 + 1·1·60·4', T('{{custom.leisure}}'), '1680');
eq('нийт (Excel 2640)', T('{{custom.totalMet}}'), '2640');
eq('өндөр эрчим (Excel 1440)', T('{{custom.vigorous}}'), '1440');
eq('дунд эрчим (Excel 1200)', T('{{custom.moderate}}'), '1200');
eq('суугаа (16 цаг)', T('{{custom.sitting}}'), '960');
eq('аравтын 2 орон', T('{{custom.hours}}'), '137.14');
eq('нэрээр {{Нийт МЕТ}}', T('Таны {{Нийт МЕТ}} МЕТ-минут'), 'Таны 2640 МЕТ-минут');
eq('тойрог → хоосон', T('{{custom.loopA}}'), '');
eq('0-д хуваах → хоосон', T('{{custom.bad}}'), '');

const level = {
  source: { type: 'variable', category: 'totalMet' },
  conditions: [
    { op: '<', value: 600, text: 'Хангалтгүй' },
    { op: 'between', value: 600, value2: 3999, text: 'Харьцангуй идэвхитэй' },
    { op: 'between', value: 4000, value2: 7999, text: 'Харьцангуй өндөр идэвхитэй' },
    { op: '>=', value: 8000, text: 'Маш өндөр идэвхитэй' },
  ],
  elseText: '',
};
eq('түвшин (variable эх сурвалж)', evaluateScoreRules(level as any, r.currentScoreInput), 'Харьцангуй идэвхитэй');
const who = { source: { type: 'variable', category: 'custom.totalMet' }, conditions: [{ op: '>=', value: 600, text: 'Хүрсэн' }], elseText: 'Хүрээгүй' };
eq('ДЭМБ (custom. угтвартай key)', evaluateScoreRules(who as any, r.currentScoreInput), 'Хүрсэн');
const sit = { source: { type: 'variable', category: 'sitting' }, conditions: [{ op: '<', value: 240, text: 'бага' }, { op: '<', value: 480, text: 'дунд' }, { op: '<', value: 660, text: 'өндөр' }], elseText: 'Маш өндөр' };
eq('суугаа түвшин', evaluateScoreRules(sit as any, r.currentScoreInput), 'Маш өндөр');
eq('байхгүй хувьсагч → elseText', evaluateScoreRules({ ...who, source: { type: 'variable', category: 'nope' } } as any, r.currentScoreInput), 'Хүрээгүй');

console.log(fail ? `\n${fail} FAIL` : '\nall ok');
process.exit(fail ? 1 : 0);
