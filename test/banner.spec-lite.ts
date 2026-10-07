// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/banner.spec-lite.ts
// "banner" блок — banner.ts (bannerLayout) + DynamicTemplateRenderer.renderBanner → <OUT_DIR|tmp>/banner.pdf
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { bannerLayout, defaultBannerConfig, normalizeBanner } from '../src/pdf/banner';
import { DynamicTemplateRenderer } from '../src/pdf/dynamic-template.renderer';
import { AssetsService } from '../src/assets_service/assets.service';

let fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};
const m = (t: string) => t.length * 10;
const cfg = normalizeBanner({ padX: 20, padY: 10, logoWidth: 80, gap: 20, titleSize: 20, subtitleSize: 10, textGap: 4, decor: false });
const L = bannerLayout(500, 80, cfg, 'ГАРЧИГ', 'дэд', m, m);
eq('лого хайрцаг', L.logo, { x: 20, y: 10, w: 80, h: 60 });
eq('текст логоны дараа', [L.title[0].x, L.subtitle[0].x], [120, 120]);
const blockH = 20 * 1.213 + 4 + 10 * 1.213;
eq('босоо төвд', [+L.title[0].y.toFixed(3), +L.subtitle[0].y.toFixed(3)], [+((80 - blockH) / 2).toFixed(3), +((80 - blockH) / 2 + 20 * 1.213 + 4).toFixed(3)]);
eq('логогүй → текст padX-аас', bannerLayout(500, 80, { ...cfg, logo: 'none' }, 'A', '', m, m).title[0].x, 20);
eq('custom лого url-гүй → логогүй', bannerLayout(500, 80, { ...cfg, logo: 'custom', logoUrl: '' }, 'A', '', m, m).logo, null);
eq('урт гарчиг ороогдоно (360 өргөнд)', bannerLayout(500, 80, cfg, 'aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd', '', m, m).title.map((l) => l.text), ['aaaaaaaaaa bbbbbbbbbb cccccccccc', 'dddddddddd']);
eq('хоосон дэд гарчиг → мөргүй', bannerLayout(500, 80, cfg, 'A', '  ', m, m).subtitle.length, 0);
eq('зураас', bannerLayout(500, 80, { ...cfg, divider: true }, 'A', '', m, m).divider, { x: 110, y1: 10, y2: 70 });
eq('чимэглэл 2 тойрог', bannerLayout(500, 80, { ...cfg, decor: true }, 'A', '', m, m).circles.length, 2);
eq('normalize анхдагч', normalizeBanner(undefined).title, defaultBannerConfig().title);

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', f));
const doc = new PDFDocument({ size: 'A4', margins: { left: 40, right: 40, top: 25, bottom: 15 } });
for (const [n, f] of [
  ['Gilroy', 'Gilroy-Medium.ttf'], ['fontNormal', 'Gilroy-Medium.ttf'], ['fontMedium', 'Gilroy-Bold.ttf'],
  ['Gilroy-Bold', 'Gilroy-ExtraBold.ttf'], ['fontBold', 'Gilroy-ExtraBold.ttf'], ['fontBlack', 'Gilroy-Black.ttf'],
]) doc.registerFont(n, font(f));
const OUT = path.join(process.env.OUT_DIR || os.tmpdir(), 'banner.pdf');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
doc.pipe(fs.createWriteStream(OUT));
const userAnswer: any = { query: async () => [], answerCategoryStats: async () => [], categoryStats: async () => [], questionAnswers: async () => [] };
const r = new DynamicTemplateRenderer({} as any, {} as any, userAnswer, { findAllByAssessmentId: async () => [] } as any);
const B = (o: any) => ({ id: Math.random().toString(36).slice(2), label: o.type, style: { fontFamily: 'Gilroy' }, ...o });
const template: any = {
  pages: [{
    id: 'p1',
    blocks: [
      B({ type: 'banner', x: 40, y: 40, width: 515, height: 72, banner: defaultBannerConfig() }),
      B({ type: 'banner', x: 40, y: 130, width: 515, height: 90, banner: { title: 'Урт гарчигтай баннер — хоёр мөрт ороох эсэхийг шалгах', subtitle: 'Хэрэглэгч: {{user.fullname}}', divider: true, colorFrom: '#0369A1', colorTo: '#7B61FF', direction: 'vertical', radius: 20 } }),
      B({ type: 'banner', x: 40, y: 240, width: 300, height: 56, banner: { logo: 'none', title: 'Логогүй', subtitle: '', decor: false } }),
    ],
  }],
};
(async () => {
  await r.render(doc, template, { result: { code: 'DEMO-PREVIEW', point: 1, total: 1 }, exam: {}, firstname: 'Болд', lastname: 'Батбаяр' } as any, new AssetsService());
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
