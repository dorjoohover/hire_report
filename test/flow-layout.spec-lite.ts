// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/flow-layout.spec-lite.ts
// "Хэсэг (box)" шахалт + нөхцөлт харагдац (visibleIf) + "Алгасалт" хувьсагч (kind='skip').
// flow-layout.ts / skip-rules.ts нэгж тест + HADS маягийн 2 хувилбарыг (хариулсан / алгассан)
// DynamicTemplateRenderer-ээр зурж <OUT_DIR|tmp>/flow-answered.pdf, flow-skipped.pdf гаргана (DB-гүй).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { autoLayoutPage, blockIsBlank, boxParents, evalVisibleIf, flowHiddenSet, isBlankRichText, layoutFlow, boxColumnRanges, normalizeBox } from '../src/pdf/flow-layout';
import { evaluateSkip, normalizeSkipRules, parseAnswerList, parseQuestionIdList, skipTokenValue } from '../src/pdf/skip-rules';
import { groupQuestionAnswers } from '../src/pdf/question-answer';
import { flowRect } from '../src/pdf/flow-layout';
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

// ── Автомат байрлал (autoLayout) ─────────────────────────────────────────────
{
  const n = normalizeBox({ padding: 10 } as any);
  eq('хуучин padding → padX / padY', [n.padX, n.padY, n.autoLayout, n.itemGap, n.align], [10, 10, false, 8, 'stretch']);
  const rect = (r: any) => (r ? [r.x, r.y, r.w, r.h] : null);
  // box 40,100 500×300, padX 12, padY 10, gap 8: a(text, x50 y120 h20), icon(x300 y150 48×48), b(text y130 h30)
  const AB = { autoLayout: true, padX: 12, padY: 10, itemGap: 8 };
  const blocks: any[] = [
    B('box', 'box', 40, 100, 500, 300, { box: AB }),
    B('a', 'text', 50, 120, 200, 20), B('ic', 'icon', 300, 150, 48, 48), B('b', 'text', 60, 130, 100, 30, { flowGap: 20 }),
    B('X', 'text', 40, 420, 500, 20),
  ];
  const r = autoLayoutPage(blocks);
  eq('өрөлт: y-ийн дараалал, дотор зай, сунгалт, icon өргөнөө хадгална, flowGap', [rect(r.rects.get('a')), rect(r.rects.get('b')), rect(r.rects.get('ic')), r.boxes.get('box')!.height], [
    [52, 110, 476, 20], [52, 150, 476, 30], [52, 188, 48, 48], 146,
  ]);
  const again = autoLayoutPage(blocks.map((x) => {
    const q = r.rects.get(x.id);
    return q ? { ...x, x: q.x, y: q.y, width: q.w, height: q.h } : x;
  }));
  eq('давтан өрөхөд өөрчлөлтгүй (тогтвортой)', again.rects.size, 0);
  const hid = autoLayoutPage(blocks, { hidden: new Set(['b']) });
  eq('нуугдсан нь өрөлтөд орохгүй', [rect(hid.rects.get('ic')), hid.boxes.get('box')!.height, hid.boxes.get('box')!.kids.has('b')], [[52, 138, 48, 48], 96, false]);
  const tall = autoLayoutPage(blocks, { heightOf: (b: any, w: number) => (b.id === 'a' ? 80 : flowRect(b).h) });
  eq('heightOf (PDF-ийн бодит өндөр)', [rect(tall.rects.get('b')), tall.boxes.get('box')!.height], [[52, 210, 476, 30], 206]);
  // layoutFlow + auto: жижгэрвэл X дээш, томорвол X доош
  const hs = new Set(['b']);
  const p1 = layoutFlow(blocks, hs, undefined, autoLayoutPage(blocks, { hidden: hs }).boxes);
  eq('auto box жижгэрч X дээш (300 → 96)', [p1.height.get('box'), p1.y.get('X'), p1.y.get('ic'), p1.x.get('a'), p1.width.get('a')], [96, 216, 138, 52, 476]);
  const big = layoutFlow(blocks, new Set(), undefined, autoLayoutPage(blocks, { heightOf: () => 150 }).boxes);
  eq('auto box томорч X доош түлхэгдэнэ', [big.height.get('box'), big.y.get('X')], [10 + 150 + 8 + 150 + 20 + 150 + 10, 420 + (498 - 300)]);
  // fixedHeight: гишүүд өрөгдөнө, box-ийн өндөр (300) хэвээр, X хөдлөхгүй
  const fx = blocks.map((x) => (x.id === 'box' ? { ...x, box: { ...AB, fixedHeight: true } } : x));
  const fr = autoLayoutPage(fx, { heightOf: () => 150 });
  const fp = layoutFlow(fx, hs, undefined, autoLayoutPage(fx, { hidden: hs }).boxes);
  eq('fixedHeight: өндөр тогтмол', [fr.boxes.get('box')!.height, rect(fr.rects.get('b'))?.[1], fp.height.get('box'), fp.y.get('X')], [300, 280, undefined, undefined]);
  const ff = layoutFlow(fx.map((x) => (x.id === 'box' ? { ...x, box: { fixedHeight: true } } : x)), hs);
  eq('fixedHeight (чөлөөт): нуугдсанаар жижгэрэхгүй', [ff.height.get('box'), ff.y.get('X')], [undefined, undefined]);
  // 2 багана + дотор auto box
  const nb: any[] = [
    B('o', 'box', 40, 100, 500, 400, { box: { autoLayout: true, columns: 2, gap: 20, padX: 10, padY: 10, itemGap: 6 } }),
    B('l1', 'text', 50, 110, 100, 20), B('l2', 'text', 50, 140, 100, 20),
    B('in', 'box', 300, 110, 200, 200, { box: { autoLayout: true, padX: 5, padY: 5, itemGap: 4 } }),
    B('i1', 'text', 310, 120, 50, 10), B('i2', 'text', 310, 140, 50, 10),
  ];
  const nr = autoLayoutPage(nb);
  eq('2 багана, дотор auto box', [rect(nr.rects.get('l2')), rect(nr.rects.get('in')), rect(nr.rects.get('i2')), nr.boxes.get('o')!.height], [
    [50, 136, 230, 20], [300, 110, 230, 34], [305, 129, 220, 10], 66,
  ]);
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
const longVar = { key: 'long', label: 'Урт', kind: 'skip', rules: { scope: 'questions', questions: ['question[11]'], mode: 'all', output: 'text', answeredText: 'Богино.', skippedText: 'Энэ бол урт динамик текст: шалгуулагчийн хариултаас хамааран хэд хэдэн мөрөнд ороогдох тайлбар. Studio дээр ганц мөр байсан ч PDF-д бодит өндрөөр нь өрөгдөж, доорх progress bar болон дараагийн хэсэгтэй давхцахгүй байх ёстой. Гурав дахь өгүүлбэр мөр нэмнэ.' } };
const autoTemplate: any = {
  pages: [{
    id: 'p2',
    blocks: [
      T({ id: 'ab', type: 'box', x: 40, y: 60, width: 515, height: 120, box: { autoLayout: true, padX: 16, padY: 14, itemGap: 10, bg: '#FFF5F2', radius: 10 } }),
      T({ id: 'ah', type: 'heading', x: 56, y: 74, width: 483, height: 24, content: 'Автомат байрлал (padX 16, padY 14, зай 10)', style: { fontSize: 14, color: '#231F20', fontFamily: 'fontBold' } }),
      T({ id: 'at', type: 'text', x: 56, y: 108, width: 483, height: 15, content: '{{custom.long}}' }),
      T({ id: 'ap', type: 'progress-bar', x: 56, y: 133, width: 483, height: 16, flowGap: 20, progress: { label: '', labelWidth: 0, value: '0.6' } }),
      T({ id: 'after', type: 'heading', x: 40, y: 200, width: 515, height: 24, content: 'Box-оос доорх хэсэг (түлхэгдэнэ)', style: { fontSize: 14, color: '#231F20', fontFamily: 'fontBold' } }),
    ],
  }],
};
const renderCase = async (file: string, answeredIds: number[], tpl: any = template) => {
  const userAnswer: any = {
    query: async () => [],
    answerCategoryStats: async () => [],
    categoryStats: async () => [],
    questionAnswers: async () => answeredIds.map((id) => ({ questionId: id, questionType: 10, point: 2 })),
  };
  const variableDao: any = { findAllByAssessmentId: async () => [skipVar, msgVar, longVar] };
  const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, variableDao);
  const { doc, out, done } = newDoc(file);
  await r.render(doc, tpl, {
    result: { code: 'T1', point: 10, total: 20, type: 10, assessment: 1 },
    exam: { assessment: { id: 1 } },
    firstname: 'Болд', lastname: 'Батбаяр',
  } as any, new AssetsService());
  doc.end();
  await done;
  console.log('pdf', out, fs.statSync(out).size);
};
// 'info' (Мэдээлэл) автомат box дотор — хадгалсан өндөр (60) биш, бодит зурагдах өндрөөр өрнө.
const infoMeasure = () => {
  const r = new DynamicTemplateRenderer({} as any, {} as any, {} as any, {} as any);
  const { doc } = newDoc('flow-info.pdf');
  const long = 'Урт тайлбар '.repeat(60);
  const ctx: any = { result: { assessmentName: 'Тест' }, exam: { assessment: { author: 'A', description: long, measure: long, usage: long } } };
  const out = (r as any).applyFlow(doc, [
    B('bx', 'box', 40, 100, 515, 200, { box: { autoLayout: true, itemGap: 8 } }),
    B('inf', 'info', 40, 110, 515, 60),
    B('t', 'text', 40, 180, 515, 20, { content: 'доорх', style: { fontSize: 12 } }),
  ], ctx, new AssetsService());
  const inf = out.find((b: any) => b.id === 'inf');
  const t = out.find((b: any) => b.id === 't');
  const h = (r as any).measureInfoHeight(doc, inf, ctx, new AssetsService());
  eq('info: бодит өндөр > хадгалсан, доорх блок давхцахгүй', [h > 200, t.y >= inf.y + h], [true, true]);
};
(async () => {
  infoMeasure();
  await renderCase('flow-answered.pdf', [11, 12]);
  await renderCase('flow-skipped.pdf', []);
  await renderCase('flow-auto-short.pdf', [11], autoTemplate);
  await renderCase('flow-auto-long.pdf', [], autoTemplate);
  console.log(fail ? `\n${fail} FAIL` : '\nALL OK');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
