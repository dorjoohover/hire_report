// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/text-leader.spec-lite.ts
// Текст блокийн {..} "цэг гүйцээх" (dot leader) — rich-layout.ts layoutWithLeaders + drawRichText.
// 1) {..}-гүй текстийн layout leaders=true/false үед ЯГ ИЖИЛ (хуучин загвар өөрчлөгдөхгүй).
// 2) {..} мөр: баруун хэсэг баруун захтай тулна, цэгүүд дүүргэнэ, зүүн урт текст мөр таслана.
// 3) Demo template-ийг бүтнээр нь <OUT_DIR|tmp>/text-leader.pdf болгон зурна (нүдээр шалгах).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { layoutRichText, RichSeg } from '../src/pdf/rich-layout';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { AssetsService } from '../src/assets_service/assets.service';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const font = (f: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', f));
const mkDoc = () => {
  const d = new PDFDocument({ size: 'A4', margins: { left: 40, right: 40, top: 25, bottom: 15 } });
  for (const [n, f] of [
    ['Gilroy', 'Gilroy-Medium.ttf'], ['fontNormal', 'Gilroy-Medium.ttf'], ['fontMedium', 'Gilroy-Bold.ttf'],
    ['Gilroy-Bold', 'Gilroy-ExtraBold.ttf'], ['fontBold', 'Gilroy-ExtraBold.ttf'], ['fontBlack', 'Gilroy-Black.ttf'],
    ['fontNormalItalic', 'Gilroy-MediumItalic.ttf'], ['fontBoldItalic', 'Gilroy-ExtraBoldItalic.ttf'], ['fontBlackItalic', 'Gilroy-BlackItalic.ttf'],
  ]) d.registerFont(n, font(f));
  return d;
};

// ── 1–2: layout түвшинд ──────────────────────────────────────────────────────
const d0 = mkDoc();
const setFont = (s: RichSeg) => d0.font(s.black ? 'fontBlack' : s.bold ? 'fontBold' : 'fontNormal');
const base = { width: 300, fontSize: 12, lineHeight: 1.213, setFont, align: 'left' as const };
const seg = (text: string, extra: Partial<RichSeg> = {}): RichSeg => ({ text, ...extra });
const strip = (l: any) => JSON.stringify(l.lines.map((x: any) => [x.contentWidth, x.size, x.advance, x.words.length]));

const plain = [seg('Энгийн текст, '), seg('тод', { bold: true }), seg(' хэсэг\n\nхоосон мөрийн дараа урт урт урт урт урт урт урт урт урт урт урт урт текст\n')];
ok('{..}-гүй текст: leaders=true/false layout ИЖИЛ', strip(layoutRichText(d0, plain, base)) === strip(layoutRichText(d0, plain, { ...base, leaders: true })));

const lead = [seg('Хувь хүний мэдээлэл '), seg('', { leader: true }), seg(' 12 / 40')];
const L1 = layoutRichText(d0, lead, { ...base, leaders: true });
const l1 = L1.lines[0] as any;
ok('нэг мөр', L1.lines.length === 1);
ok('leader мэдээлэлтэй', !!l1.leader && l1.leader.rightWidth > 0);
d0.font('fontNormal').fontSize(12);
const rw = d0.widthOfString('12 / 40');
ok('баруун хэсгийн өргөн = "12 / 40" (зайг хассан)', Math.abs(l1.leader.rightWidth - rw) < 0.01, `${l1.leader.rightWidth.toFixed(2)} vs ${rw.toFixed(2)}`);
const lw = d0.widthOfString('Хувь хүний мэдээлэл');
ok('зүүн хэсгийн өргөн (ардах зайг хассан)', Math.abs(l1.contentWidth - lw) < 0.01);

const longLeft = [seg('Архины хэрэглээг үнэлэх асуумж (AUDIT) — маш урт нэртэй бүлэг, хоёр мөрөнд орох ёстой '), seg('', { leader: true }), seg('8 / 40', { bold: true })];
const L2 = layoutRichText(d0, longLeft, { ...base, leaders: true });
ok('урт зүүн хэсэг мөр таслана, цэг сүүлийн мөрөнд', L2.lines.length >= 2 && !!(L2.lines[L2.lines.length - 1] as any).leader && !(L2.lines[0] as any).leader);
const maxLeft = 300 - (L2.lines[L2.lines.length - 1] as any).leader.rightWidth - 1.5 * 12;
ok('зүүн мөрүүд (өргөн − баруун − 1.5em)-д багтана', L2.lines.every((l) => l.contentWidth <= maxLeft + 0.01));

const mixed = [seg('Гарчиг\n'), seg('А '), seg('', { leader: true }), seg(' 1\nБ'), seg('', { leader: true }), seg('2\n\nТөгсгөл')];
const L3 = layoutRichText(d0, mixed, { ...base, leaders: true, align: 'center' });
ok('холимог: 5 мөр (гарчиг, А, Б, хоосон, төгсгөл)', L3.lines.length === 5, String(L3.lines.length));
ok('leader мөр forceLeft (center-ийг үл тоомсорлоно)', !!(L3.lines[1] as any).forceLeft && !(L3.lines[0] as any).forceLeft);
ok('leaders=false үед {..} үл тоомсорлогдоно', layoutRichText(d0, lead, base).lines.every((l: any) => !l.leader));

// ── 3: бүтэн demo template ────────────────────────────────────────────────────
const doc = mkDoc();
const OUT = path.join(process.env.OUT_DIR || os.tmpdir(), 'text-leader.pdf');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
doc.pipe(fs.createWriteStream(OUT));
const userAnswer: any = { query: async () => [], answerCategoryStats: async () => [], categoryStats: async () => [], questionAnswers: async () => [] };
const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, { findAllByAssessmentId: async () => [] } as any);
const B = (o: any) => ({ id: Math.random().toString(36).slice(2), label: o.type, ...o });
const template: any = {
  demoData: { categories: [
    { name: 'Хувь хүний мэдээлэл', score: 12, maxScore: 40, count: 10 },
    { name: 'Архины хэрэглээг үнэлэх асуумж (AUDIT)', score: 8, maxScore: 40, count: 10 },
  ] },
  pages: [{ id: 'p1', blocks: [
    B({ type: 'text', x: 40, y: 40, width: 400, height: 80, style: { fontSize: 12 },
      content: '**{{category[1].name}}** {..} {{category[1].score}} / {{category[1].max}}\n{{category[2].name}} {..} ==#F36421|**{{category[2].score}}**== / {{category[2].max}}\nДээд оноо {..} {{score.max}}' }),
    B({ type: 'text', x: 40, y: 140, width: 260, height: 90, style: { fontSize: 11, backgroundColor: '#FFF5F2', padding: 8, borderRadius: 6, textAlign: 'center' },
      content: 'Гарчиг (төвд)\nМаш урт нэртэй бүлэг, хоёр мөрөнд хуваагдана {..} **99**\n{..} зүүнгүй\nЭнгийн мөр' }),
    B({ type: 'text', x: 40, y: 260, width: 400, height: 40, style: { fontSize: 14 }, content: '~~Нийт~~ ^^10|{..}^^ ~~76~~' }),
  ] }],
};
(async () => {
  await r.render(doc, template, { result: { code: 'DEMO-PREVIEW', point: 76, total: 100 }, exam: {}, firstname: 'Болд', lastname: 'Батбаяр' } as any, new AssetsService());
  doc.end();
  setTimeout(() => {
    const size = fs.statSync(OUT).size;
    ok('demo template зурагдсан', size > 1000, `${OUT} ${size}B`);
    console.log(failed ? `\n${failed} алдаа` : '\n✅ БҮГД АМЖИЛТТАЙ');
    process.exit(failed ? 1 : 0);
  }, 400);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
