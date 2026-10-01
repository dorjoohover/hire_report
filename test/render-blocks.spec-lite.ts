// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/render-blocks.spec-lite.ts
// Studio-ийн шинэ блокуудыг (shape, icon, text дэвсгэр + ^^хэмжээ^^, хүснэгтийн хүрээ, block.texts)
// DynamicTemplateRenderer-ээр demo горимд зурж <OUT_DIR|tmp>/render-blocks.pdf гаргана (DB-гүй).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { AssetsService } from '../src/assets_service/assets.service';

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', f));
const doc = new PDFDocument({ size: 'A4', margins: { left: 40, right: 40, top: 25, bottom: 15 } });
for (const [n, f] of [
  ['Gilroy', 'Gilroy-Medium.ttf'], ['fontNormal', 'Gilroy-Medium.ttf'], ['fontMedium', 'Gilroy-Bold.ttf'],
  ['Gilroy-Bold', 'Gilroy-ExtraBold.ttf'], ['fontBold', 'Gilroy-ExtraBold.ttf'], ['fontBlack', 'Gilroy-Black.ttf'],
  ['fontNormalItalic', 'Gilroy-MediumItalic.ttf'], ['fontBoldItalic', 'Gilroy-ExtraBoldItalic.ttf'], ['fontBlackItalic', 'Gilroy-BlackItalic.ttf'],
]) doc.registerFont(n, font(f));
const OUT = path.join(process.env.OUT_DIR || os.tmpdir(), 'render-blocks.pdf');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
doc.pipe(fs.createWriteStream(OUT));

const userAnswer: any = { query: async () => [], answerCategoryStats: async () => [], categoryStats: async () => [], questionAnswers: async () => [] };
const variableDao: any = { findAllByAssessmentId: async () => [] };
const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, variableDao);
const B = (o: any) => ({ id: Math.random().toString(36).slice(2), label: o.type, ...o });
const table = {
  colWidths: [1, 1, 1], rowHeights: [22, 22, 22],
  rows: [
    [{ text: 'Нэгтгэсэн толгой', weight: 'bold', align: 'center', colSpan: 2 }, { text: '' }, { text: 'C', weight: 'bold' }],
    [{ text: 'дээд хүрээгүй', borders: { t: false } }, { text: 'хүрээгүй нүд', borders: { t: false, r: false, b: false, l: false } }, { text: 'энгийн' }],
    [{ text: 'a' }, { text: 'b' }, { text: 'доод хүрээгүй', borders: { b: false } }],
  ],
  headerRows: 1, headerBg: '#F36421', headerColor: '#ffffff', borderColor: '#555555', borderWidth: 1, fontSize: 10, padding: 4,
};
const template: any = {
  pages: [{
    id: 'p1',
    blocks: [
      B({ type: 'text', x: 40, y: 40, width: 300, height: 60, content: 'Энгийн ^^20|**ТОМ**^^ текст, ^^9|жижиг^^ ба ==#7B61FF|^^16|өнгөт 16^^==.', style: { backgroundColor: '#FFF5F2', padding: 10, borderRadius: 8, fontSize: 12 } }),
      B({ type: 'shape', x: 360, y: 40, width: 190, height: 60, shape: { kind: 'rect', color: '#E0F2FE', radius: 10, borderWidth: 2, borderColor: '#0369A1' } }),
      B({ type: 'shape', x: 40, y: 120, width: 510, height: 3, shape: { kind: 'hline', color: '#F36421' } }),
      B({ type: 'shape', x: 40, y: 135, width: 510, height: 2, shape: { kind: 'hline', color: '#9CA3AF', dashed: true } }),
      B({ type: 'shape', x: 300, y: 150, width: 3, height: 80, shape: { kind: 'vline', color: '#10B981' } }),
      B({ type: 'icon', x: 40, y: 150, width: 48, height: 48, imageUrl: '/icons/clock.png', imageStyle: { bg: 'circle', bgColor: '#FFE4D6', padding: 8 } }),
      B({ type: 'icon', x: 100, y: 150, width: 48, height: 48, imageUrl: '/icons/book.png', imageStyle: { bg: 'rounded', bgColor: '#E0F2FE', padding: 6, opacity: 0.6 } }),
      B({ type: 'table', x: 40, y: 250, width: 360, height: 80, table }),
      B({ type: 'user-name', x: 40, y: 350, width: 300, height: 40, texts: { examinee: 'Оролцогч' } }),
    ],
  }],
};
(async () => {
  await r.render(doc, template, { result: { code: 'DEMO-PREVIEW', point: 76, total: 100 }, exam: {}, firstname: 'Болд', lastname: 'Батбаяр' } as any, new AssetsService());
  doc.end();
  setTimeout(() => console.log('ok', OUT, fs.statSync(OUT).size), 300);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
