// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/flow-layout.spec-lite.ts
// "Хэсэг (box)" шахалт + нөхцөлт харагдац (visibleIf) + "Алгасалт" хувьсагч (kind='skip').
// flow-layout.ts / skip-rules.ts нэгж тест + HADS маягийн 2 хувилбарыг (хариулсан / алгассан)
// DynamicTemplateRenderer-ээр зурж <OUT_DIR|tmp>/flow-answered.pdf, flow-skipped.pdf гаргана (DB-гүй).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { blockIsBlank, boxParents, evalVisibleIf, flowHiddenSet, isBlankRichText, layoutFlow, boxColumnRanges } from '../src/pdf/flow-layout';
import { evaluateSkip, normalizeSkipRules, parseAnswerList, parseQuestionIdList, skipTokenValue } from '../src/pdf/skip-rules';
import { groupQuestionAnswers } from '../src/pdf/question-answer';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { AssetsService } from '../src/assets_service/assets.service';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};
const obj = (m: Map<string, number>) => Object.fromEntries([...m.entries()].sort());

// ── isBlankRichText / blockIsBlank ───────────────────────────────────────────
eq('хоосон rich text', ['', '  ', '****', '==#F36421|==', '^^18|^^', '{..}', '**a**', '[x](http://a)'].map(isBlankRichText), [true, true, true, true, true, true, false, false]);
eq('text блок token хоосон', blockIsBlank({ type: 'text', content: '**{{x}}**' }, (s) => s.replace('{{x}}', '')), true);
eq('heading хоосон контент = блокийн нэр (нуухгүй)', blockIsBlank({ type: 'heading', content: '' }, (s) => s), false);
eq('chips бүгд хоосон', blockIsBlank({ type: 'chips', chips: { items: '{{a}}\n{{b}}' } }, () => ''), true);

// ── evalVisibleIf ────────────────────────────────────────────────────────────
eq('skipped/answered төлөвөөр', [
  evalVisibleIf({ var: 'custom.s', op: 'skipped' }, '0', true),
  evalVisibleIf({ var: 'custom.s', op: 'answered' }, '0', true),
  evalVisibleIf({ var: 'custom.s', op: 'answered' }, '', false),
], [true, false, true]);
eq('skipped төлөвгүй = утгатай ба 0 биш', [evalVisibleIf({ var: 'x', op: 'skipped' }, '1'), evalVisibleIf({ var: 'x', op: 'skipped' }, '0')], [true, false]);
eq('тоо / текст харьцуулалт', [
  evalVisibleIf({ var: 'x', op: '>=', value: '12' }, '12'),
  evalVisibleIf({ var: 'x', op: '<', value: '12' }, '12'),
  evalVisibleIf({ var: 'x', op: '=', value: 'Дунд зэрэг' }, 'дунд зэрэг'),
  evalVisibleIf({ var: 'x', op: '!=', value: '3' }, '3.0'),
  evalVisibleIf({ var: 'x', op: '>', value: '1' }, 'abc'),
  evalVisibleIf({ var: 'x', op: 'empty' }, ' '),
  evalVisibleIf({ var: '', op: 'empty' }, 'a'),
], [true, false, true, false, false, true, true]);

// ── layoutFlow ───────────────────────────────────────────────────────────────
const B = (id: string, type: string, x: number, y: number, w: number, h: number, extra: any = {}) => ({ id, type, x, y, width: w, height: h, ...extra });
{
  // box 100–200: a 110–130, b 140–160, c 170–190; доор нь X 220.
  const blocks = [
    B('box', 'box', 40, 100, 500, 100),
    B('a', 'text', 50, 110, 480, 20), B('b', 'text', 50, 140, 480, 20), B('c', 'text', 50, 170, 480, 20),
    B('X', 'text', 40, 220, 500, 20), B('hdr', 'header', 0, 0, 600, 70), B('ftr', 'footer', 0, 788, 600, 60),
  ];
  eq('гишүүнчлэл', Object.fromEntries([...boxParents(blocks)].sort()), { a: 'box', b: 'box', c: 'box' });
  const none = layoutFlow(blocks, new Set());
  eq('юу ч нуугдаагүй → хэвээр', [none.y.size, none.height.size], [0, 0]);
  const p1 = layoutFlow(blocks, new Set(['b']));
  eq('дунд нь нуугдвал: c дээшилнэ, box жижгэрнэ, X дээш', [obj(p1.y), obj(p1.height)], [{ X: 190, c: 140 }, { box: 70 }]);
  const p2 = layoutFlow(blocks, new Set(['a']));
  eq('эхнийх нуугдвал дээд зай хадгалагдана', obj(p2.y), { X: 190, b: 110, c: 140 });
  const p3 = layoutFlow(blocks, new Set(['c']));
  eq('сүүлийнх нуугдвал доод зай хадгалагдана', [obj(p3.y), obj(p3.height)], [{ X: 190 }, { box: 70 }]);
  const p4 = layoutFlow(blocks, new Set(['a', 'b', 'c']));
  eq('бүгд нуугдвал box нуугдаж X box-ийн байранд', [[...p4.hidden].sort(), obj(p4.y)], [['a', 'b', 'box', 'c'], { X: 100 }]);
  const p5 = layoutFlow(blocks.map((b) => (b.id === 'box' ? { ...b, box: { pullUp: false } } : b)), new Set(['b']));
  eq('pullUp унтраалттай: доорх блок хөдлөхгүй', obj(p5.y), { c: 140 });
  const p6 = layoutFlow(blocks, new Set(['box']));
  eq('box нөхцлөөр нуугдвал гишүүд хамт', [[...p6.hidden].sort(), obj(p6.y)], [['a', 'b', 'box', 'c'], { X: 100 }]);
}
{
  // 2 багана: зүүн a(110–150) b(160–200), баруун c(110–130) d(140–160). Box 100–210.
  const blocks = [
    B('box', 'box', 40, 100, 500, 110, { box: { columns: 2, gap: 20 } }),
    B('a', 'text', 40, 110, 240, 40), B('b', 'text', 40, 160, 240, 40),
    B('c', 'text', 300, 110, 240, 20), B('d', 'text', 300, 140, 240, 20),
    B('X', 'text', 40, 230, 500, 20),
  ];
  eq('баганын хил', boxColumnRanges(blocks[0]), [{ x0: 40, x1: 280 }, { x0: 300, x1: 540 }]);
  const p = layoutFlow(blocks, new Set(['a']));
  eq('зүүн багана шахагдана, баруун хэвээр; box = хамгийн өндөр багана', [obj(p.y), obj(p.height)], [{ X: 190, b: 110 }, { box: 70 }]);
  const q = layoutFlow(blocks, new Set(['d']));
  eq('богино багана шахагдсан ч box хэвээр', [obj(q.y), obj(q.height)], [{}, {}]);
}
{
  // Box дотор box: гадна 100–300 (гарчиг 110–130, дотор box 140–280: e 150–200, f 210–270), доор X 320.
  const blocks = [
    B('outer', 'box', 40, 100, 500, 200), B('h', 'text', 50, 110, 480, 20),
    B('inner', 'box', 50, 140, 480, 140), B('e', 'text', 60, 150, 460, 50), B('f', 'text', 60, 210, 460, 60),
    B('X', 'text', 40, 320, 500, 20),
  ];
  eq('давхар гишүүнчлэл', Object.fromEntries([...boxParents(blocks)].sort()), { e: 'inner', f: 'inner', h: 'outer', inner: 'outer' });
  const p = layoutFlow(blocks, new Set(['e']));
  eq('дотор box жижгэрч гадна box, X дагана', [obj(p.y), obj(p.height)], [{ X: 260, f: 150 }, { inner: 80, outer: 140 }]);
}
{
  // Хуудасны 2 box (HADS): A 100–260 (хариулсан), B 270–310 (алгассан), дараагийн гарчиг 330.
  const blocks = [
    B('A', 'box', 40, 100, 515, 160), B('a1', 'text', 40, 110, 515, 30), B('a2', 'progress-bar', 40, 150, 515, 16),
    B('B', 'box', 40, 270, 515, 40), B('b1', 'text', 40, 280, 515, 20),
    B('next', 'heading', 40, 330, 515, 24),
  ];
  const ans = layoutFlow(blocks, new Set(['B']));
  eq('хариулсан: B нуугдаж дараагийнх дээш', obj(ans.y), { next: 270 });
  const sk = layoutFlow(blocks, new Set(['A']));
  eq('алгассан: B ба доорх нь A-ийн байранд', obj(sk.y), { B: 100, b1: 110, next: 160 });
}
{
  // hideEmpty: box доторх хоосон текст нуугдана, box-оос гадуурх нь үгүй.
  const blocks: any[] = [
    B('box', 'box', 40, 100, 500, 100), B('t1', 'text', 50, 110, 480, 20, { content: '{{empty}}' }),
    B('t2', 'text', 50, 140, 480, 20, { content: 'a' }), B('t3', 'text', 40, 250, 480, 20, { content: '' }),
  ];
  const h = flowHiddenSet(blocks, () => false, (b: any) => blockIsBlank(b, (s) => s.replace('{{empty}}', '')));
  eq('hideEmpty', [...h], ['t1']);
  const h2 = flowHiddenSet(blocks.map((b) => (b.id === 'box' ? { ...b, box: { hideEmpty: false } } : b)), () => false, (b: any) => blockIsBlank(b, (s) => s));
  eq('hideEmpty унтраалттай', [...h2], []);
}

// ── skip-rules ───────────────────────────────────────────────────────────────
eq('ID жагсаалт', parseQuestionIdList('101, 102 101;103'), ['question[101]', 'question[102]', 'question[103]']);
eq('normalize', normalizeSkipRules({ scope: 'questions', questions: [5, 'question[ 6 ]', 'x'], mode: 'zzz' }).questions, ['question[5]', 'question[6]']);
{
  const answered = new Set([11]);
  const input = {
    answered: (id: number) => answered.has(id),
    categoryQuestionIds: (n: string) => (n === 'HADS' ? [11, 12, 13] : []),
    categoryAnsweredCount: (n: string) => (n === 'Хоосон' ? 0 : null),
  };
  eq('all/any/fewer', [
    evaluateSkip({ ...normalizeSkipRules({}), scope: 'category', category: 'HADS', mode: 'all' }, input),
    evaluateSkip({ ...normalizeSkipRules({}), scope: 'category', category: 'HADS', mode: 'any' }, input),
    evaluateSkip({ ...normalizeSkipRules({}), scope: 'category', category: 'HADS', mode: 'fewer', min: 2 }, input),
    evaluateSkip(normalizeSkipRules({ scope: 'questions', questions: ['question[12]', 'question[13]'] }), input),
  ], [false, true, true, true]);
  eq('бүлгийн асуулт олдоогүй → хариулсан тоогоор', [
    evaluateSkip(normalizeSkipRules({ scope: 'category', category: 'Хоосон' }), input),
    evaluateSkip(normalizeSkipRules({ scope: 'category', category: 'Мэдэгдэхгүй' }), input),
  ], [true, false]);
  eq('token утга', [
    skipTokenValue(normalizeSkipRules({}), true),
    skipTokenValue(normalizeSkipRules({ output: 'text', skippedText: 'Алгассан', answeredText: '' }), false),
  ], ['1', '']);
}

// ── Хариултаар ("Тамхи татдаг уу?" → "Үгүй" бол никотины асуултууд алгассан) ─────────
{
  eq('хариултын жагсаалт', parseAnswerList('Үгүй, Хэзээ ч үгүй\nҮгүй;  '), ['Үгүй', 'Хэзээ ч үгүй']);
  const r = new DynamicTemplateRenderer({} as any, {} as any, {} as any, {} as any) as any;
  r.currentQuestionAnswers = groupQuestionAnswers([
    { questionId: 2875, questionType: 10, answerValue: '<p>Үгүй</p>', point: 0 },
    { questionId: 2880, questionType: 40, answerValue: 'Тамхи', matrixValue: 'Тийм', point: 1 },
  ] as any);
  r.currentAnswerMaxRows = [];
  r.currentCategoryStats = [];
  const input = r.skipInput();
  eq('answerTexts (HTML-гүй)', input.answerTexts(2875), ['Үгүй', 'Үгүй']);
  const rule = (q: number, answers: string[]) => normalizeSkipRules({ scope: 'answer', questions: [`question[${q}]`], answers });
  eq('Үгүй → алгассан, Тийм → хариулсан, хариулаагүй → алгассан, матрицын нүд', [
    evaluateSkip(rule(2875, ['үгүй ']), input),
    evaluateSkip(rule(2875, ['Тийм']), input),
    evaluateSkip(rule(9999, ['Үгүй']), input),
    evaluateSkip(rule(2880, ['Тийм']), input),
    evaluateSkip(rule(2875, []), input),
  ], [true, false, true, true, false]);
}

// ── Render: HADS 2 хувилбар ──────────────────────────────────────────────────
const font = (f: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', f));
const newDoc = (file: string) => {
  const doc = new PDFDocument({ size: 'A4', margins: { left: 40, right: 40, top: 25, bottom: 15 } });
  for (const [n, f] of [
    ['Gilroy', 'Gilroy-Medium.ttf'], ['fontNormal', 'Gilroy-Medium.ttf'], ['fontMedium', 'Gilroy-Bold.ttf'],
    ['Gilroy-Bold', 'Gilroy-ExtraBold.ttf'], ['fontBold', 'Gilroy-ExtraBold.ttf'], ['fontBlack', 'Gilroy-Black.ttf'],
    ['fontNormalItalic', 'Gilroy-MediumItalic.ttf'], ['fontBoldItalic', 'Gilroy-ExtraBoldItalic.ttf'], ['fontBlackItalic', 'Gilroy-BlackItalic.ttf'],
  ]) doc.registerFont(n, font(f));
  const out = path.join(process.env.OUT_DIR || os.tmpdir(), file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ws = fs.createWriteStream(out);
  doc.pipe(ws);
  return { doc, out, done: new Promise<void>((res) => ws.on('finish', () => res())) };
};
const T = (o: any) => ({ label: o.type, style: { fontSize: 12 }, ...o });
const skipVar = { key: 'hads_skip', label: 'HADS алгассан', kind: 'skip', rules: { scope: 'questions', questions: ['question[11]', 'question[12]'], mode: 'all' } };
const msgVar = { key: 'hads_msg', label: 'HADS мессеж', kind: 'skip', rules: { scope: 'questions', questions: ['question[11]', 'question[12]'], mode: 'all', output: 'text', skippedText: 'Оноо бүртгэгдээгүй (асуулт алгассан).', answeredText: '' } };
const template: any = {
  pages: [{
    id: 'p1',
    blocks: [
      T({ id: 'title', type: 'heading', x: 40, y: 40, width: 515, height: 24, content: '4. Айдас түгшүүр, сэтгэл гутралын асуумж (HADS)', style: { fontSize: 14, color: '#231F20', fontFamily: 'fontBold' } }),
      // Хариулсан үеийн хувилбар
      T({ id: 'A', type: 'box', x: 40, y: 75, width: 515, height: 150, box: { bg: '#FFF5F2', radius: 8, padding: 10 }, visibleIf: { var: 'custom.hads_skip', op: 'answered' } }),
      T({ id: 'a1', type: 'text', x: 50, y: 85, width: 495, height: 30, content: 'Таны **Сэтгэл түгшил** үнэлгээний дэд бүлгийн оноо ==12== буюу ==ДУНД ЗЭРЭГ== түвшинд байна.' }),
      T({ id: 'a2', type: 'progress-bar', x: 50, y: 122, width: 495, height: 16, progress: { label: '', labelWidth: 0, value: '0.55' } }),
      T({ id: 'a3', type: 'text', x: 50, y: 150, width: 495, height: 30, content: 'Таны **Сэтгэл гутрал** үнэлгээний дэд бүлгийн оноо ==8== буюу ==ХӨНГӨН== түвшинд байна.' }),
      T({ id: 'a4', type: 'progress-bar', x: 50, y: 190, width: 495, height: 16, progress: { label: '', labelWidth: 0, value: '0.38' } }),
      // Алгассан үеийн хувилбар
      T({ id: 'B', type: 'box', x: 40, y: 235, width: 515, height: 44, box: { borderWidth: 1, borderColor: '#F36421', radius: 8 }, visibleIf: { var: 'custom.hads_skip', op: 'skipped' } }),
      T({ id: 'b1', type: 'text', x: 52, y: 249, width: 490, height: 16, content: '{{custom.hads_msg}}' }),
      // 2 баганатай box — хоосон текст баганад шахагдана
      T({ id: 'C', type: 'box', x: 40, y: 290, width: 515, height: 90, box: { columns: 2, gap: 15, divider: true, bg: '#F7F7F8', padding: 10 } }),
      T({ id: 'c1', type: 'text', x: 50, y: 300, width: 240, height: 16, content: 'Зүүн: {{custom.hads_skip}}' }),
      T({ id: 'c2', type: 'text', x: 50, y: 322, width: 240, height: 16, content: '{{custom.hads_msg}}', style: { fontSize: 12, color: '#ED1C45' } }),
      T({ id: 'c3', type: 'text', x: 50, y: 344, width: 240, height: 16, content: 'Зүүн сүүлийн мөр' }),
      T({ id: 'c4', type: 'text', x: 305, y: 300, width: 240, height: 60, content: 'Баруун багана — үргэлж ижил өндөртэй урт текст, хоёр, гурван мөрөнд ороогдоно.' }),
      T({ id: 'next', type: 'heading', x: 40, y: 395, width: 515, height: 24, content: '5. Дараагийн хэсэг', style: { fontSize: 14, color: '#231F20', fontFamily: 'fontBold' } }),
      T({ id: 'line', type: 'shape', x: 40, y: 425, width: 515, height: 2, shape: { kind: 'hline', color: '#F36421' } }),
    ],
  }],
};
const renderCase = async (file: string, answeredIds: number[]) => {
  const userAnswer: any = {
    query: async () => [],
    answerCategoryStats: async () => [],
    categoryStats: async () => [],
    questionAnswers: async () => answeredIds.map((id) => ({ questionId: id, questionType: 10, point: 2 })),
  };
  const variableDao: any = { findAllByAssessmentId: async () => [skipVar, msgVar] };
  const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, variableDao);
  const { doc, out, done } = newDoc(file);
  await r.render(doc, template, {
    result: { code: 'T1', point: 10, total: 20, type: 10, assessment: 1 },
    exam: { assessment: { id: 1 } },
    firstname: 'Болд', lastname: 'Батбаяр',
  } as any, new AssetsService());
  doc.end();
  await done;
  console.log('pdf', out, fs.statSync(out).size);
};
(async () => {
  await renderCase('flow-answered.pdf', [11, 12]);
  await renderCase('flow-skipped.pdf', []);
  console.log(fail ? `\n${fail} FAIL` : '\nALL OK');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
