// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/chips.spec-lite.ts
// "chips" (Шошго / таг) блок — chips.ts (chipItems, chipsLayout) + DynamicTemplateRenderer.renderChips.
// <OUT_DIR|tmp>/chips.pdf гаргана (DB-гүй).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { chipItems, chipsLayout, normalizeChips, defaultChipsConfig } from '../src/pdf/chips';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { AssetsService } from '../src/assets_service/assets.service';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

// ── chipItems ────────────────────────────────────────────────────────────────
const vals: Record<string, string> = { '{{a}}': 'Нойргүйдэл', '{{empty}}': '', '{{multi}}': 'Айдас\n\nСэтгэл гутрал' };
eq('мөр бүр шошго, хоосон мөр / хоосон утга алгасна, олон мөр утга задарна',
  chipItems('{{a}}\n\n{{empty}}\n  Сэтгэл   түгшилт \n{{multi}}', (s) => vals[s.trim()] ?? s),
  ['Нойргүйдэл', 'Сэтгэл түгшилт', 'Айдас', 'Сэтгэл гутрал']);
eq('resolve-гүй (Studio non-demo)', chipItems('A\nB'), ['A', 'B']);

// ── chipsLayout (тэмдэгт бүр 10pt өргөнтэй хэмжигч) ───────────────────────────
const m = (t: string) => t.length * 10;
const cfg = normalizeChips({ fontSize: 10, padX: 5, padY: 2, borderWidth: 1, gapX: 4, gapY: 6 });
const lh = 10 * 1.213;
const L = chipsLayout(['aaaa', 'bbbbbb', 'cc'], 100, cfg, m);
// w = text + 2·(5+1): 52, 72, 32. 52 + 4 + 72 = 128 > 100 → 2-р мөр; 72 + 4 + 32 = 108 > 100 → 3-р мөр.
eq('өргөн', L.boxes.map((b) => b.w), [52, 72, 32]);
eq('мөр шилжилт (x)', L.boxes.map((b) => b.x), [0, 0, 0]);
const h = lh + 2 * 3;
eq('y', L.boxes.map((b) => +b.y.toFixed(2)), [0, +(h + 6).toFixed(2), +(2 * (h + 6)).toFixed(2)]);
eq('нийт өндөр', +L.height.toFixed(2), +(3 * h + 2 * 6).toFixed(2));
const L2 = chipsLayout(['aa', 'bb', 'cc'], 100, { ...cfg, align: 'center' }, m);
// 32 + 4 + 32 = 68, + 4 + 32 = 104 > 100 → 2 мөр: [aa bb] (68) → off 16; [cc] (32) → off 34.
eq('төвд', L2.boxes.map((b) => b.x), [16, 52, 34]);
const L3 = chipsLayout(['aa', 'bb'], 100, { ...cfg, align: 'right' }, m);
eq('баруун', L3.boxes.map((b) => b.x), [32, 68]);
// Блокоос урт → шошгон дотор ороогдоно (max text = 100 − 12 = 88 → 8 тэмдэгт).
const L4 = chipsLayout(['aaaa bbbb cccc', 'x'], 100, cfg, m);
eq('урт шошго ороогдоно', L4.boxes[0].lines, ['aaaa', 'bbbb', 'cccc']);
eq('урт шошгоны өндөр 3 мөр', +L4.boxes[0].h.toFixed(2), +(3 * lh + 6).toFixed(2));
eq('урт үг тэмдэгтээр', chipsLayout(['abcdefghijkl'], 100, cfg, m).boxes[0].lines, ['abcdefgh', 'ijkl']);
eq('хоосон жагсаалт', chipsLayout([], 100, cfg, m), { boxes: [], height: 0 });
eq('normalize: хоосон дүүргэлт хадгална', normalizeChips({ fill: '' }).fill, '');
eq('normalize: анхдагч', normalizeChips(undefined).borderColor, defaultChipsConfig().borderColor);

// ── PDF ──────────────────────────────────────────────────────────────────────
const font = (f: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', f));
const doc = new PDFDocument({ size: 'A4', margins: { left: 40, right: 40, top: 25, bottom: 15 } });
for (const [n, f] of [
  ['Gilroy', 'Gilroy-Medium.ttf'], ['fontNormal', 'Gilroy-Medium.ttf'], ['fontMedium', 'Gilroy-Bold.ttf'],
  ['Gilroy-Bold', 'Gilroy-ExtraBold.ttf'], ['fontBold', 'Gilroy-ExtraBold.ttf'], ['fontBlack', 'Gilroy-Black.ttf'],
]) doc.registerFont(n, font(f));
const OUT = path.join(process.env.OUT_DIR || os.tmpdir(), 'chips.pdf');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
doc.pipe(fs.createWriteStream(OUT));
const userAnswer: any = { query: async () => [], answerCategoryStats: async () => [], categoryStats: async () => [], questionAnswers: async () => [] };
const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, { findAllByAssessmentId: async () => [] } as any);
const B = (o: any) => ({ id: Math.random().toString(36).slice(2), label: o.type, style: { fontFamily: 'Gilroy' }, ...o });
const items = [
  'Нойргүйдэл', 'Сэтгэл түгшилт', 'Айдас', 'Сэтгэл гутрал', 'Уур бухимдал', 'Мэдрэл сульдал', 'Дэлгэцийн донтолт',
  'Архи, тамхи, мансууруулах бодисын хэрэглээтэй холбоотой асуудал', 'Жирэмсэн үеийн сэтгэл зүйн өөрчлөлт',
  'Төрсний дараах сэтгэл зүйн хямрал, сэтгэл гутрал', 'Гэмтлийн дараах /хүчтэй стресс/ сэтгэл зүйн хямрал',
  'Ахимаг насны үеийн сэтгэцийн тулгамдсан асуудал', 'Хүүхдийн сэтгэцийн тулгамдсан асуудал',
].join('\n');
const template: any = {
  pages: [{
    id: 'p1',
    blocks: [
      B({ type: 'chips', x: 40, y: 40, width: 515, height: 100, chips: { ...defaultChipsConfig(), items } }),
      B({ type: 'chips', x: 40, y: 340, width: 300, height: 60, chips: { items: 'Төв\nбайрлал\nтод бичиг', align: 'center', bold: true, radius: 99, fill: '#E0F2FE', borderColor: '#0369A1' } }),
      B({ type: 'chips', x: 40, y: 400, width: 120, height: 60, chips: { items: 'Блокоос урт нэртэй шошго ороогдоно', borderWidth: 2 } }),
      B({ type: 'chips', x: 200, y: 400, width: 200, height: 60, chips: { items: '{{custom.none}}\n   ' } }),
      B({ type: 'text', x: 200, y: 400, width: 300, height: 20, content: 'Хоосон шошго блокийн (дээр) дараа — юу ч зурагдаагүй байх ёстой.' }),
    ],
  }],
};
(async () => {
  await r.render(doc, template, { result: { code: 'DEMO-PREVIEW', point: 1, total: 1 }, exam: {}, firstname: 'Б', lastname: 'Б' } as any, new AssetsService());
  doc.end();
  setTimeout(() => {
    console.log('pdf', OUT, fs.statSync(OUT).size);
    console.log(fail ? `\n${fail} алдаа` : '\nбүгд OK');
    process.exit(fail ? 1 : 0);
  }, 300);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
