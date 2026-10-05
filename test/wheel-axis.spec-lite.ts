// ts-node --transpile-only -r tsconfig-paths/register test/wheel-axis.spec-lite.ts
// "wheel-radar" тэнхлэгийн утга — ID-аар, хуулсан / оруулсан загварт (хуучин ID) нэрээр.
import { wheelAxisValue, AnswerStatRow } from '../src/pdf/report-widgets';

let failed = 0;
const check = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${name} → ${JSON.stringify(got)}${ok ? '' : ` (хүлээсэн ${JSON.stringify(want)})`}`);
};
const R = (id: number, name: string, point: number, count: number, parentId: number | null = null, categoryName = 'Манлайлал'): AnswerStatRow =>
  ({ id, parentId, name, categoryId: 1, categoryName, point, count }) as AnswerStatRow;
// Шинэ орчны ангиллууд: 901 "Хамтын зорилгыг өдөөх", 902 "Хүмүүнлэг манлайлал" (+ дэд 903)
const rows = [R(901, 'Хамтын зорилгыг өдөөх', 12, 3), R(902, 'Хүмүүнлэг манлайлал', 8, 2), R(903, 'Дэд', 4, 1, 902)];
const avg = { group: '', metric: 'avg' as const };

check('W1 ID таарвал ID-аар (avg)', wheelAxisValue({ id: 901, name: 'Хамтын зорилгыг өдөөх' }, rows, avg), 4);
check('W2 эцэг ID → дэд ангиллууд нэгтгэгдэнэ', wheelAxisValue({ id: 902, name: 'x' }, rows, avg), 4);
check('W3 ЭХ орчны (хуучин) ID → нэрээр олно', wheelAxisValue({ id: 12, name: '  Хамтын  зорилгыг өдөөх ' }, rows, avg), 4);
check('W4 хуучин ID, нэр ч таарахгүй → null', wheelAxisValue({ id: 12, name: 'Өөр' }, rows, avg), null);
check('W5 ID-гүй → нэрээр; sum', wheelAxisValue({ name: 'Хүмүүнлэг манлайлал' }, rows, { group: '', metric: 'sum' }), 12);
check('W6 ID байгаа ч бүлэг таарахгүй → null (нэр рүү унахгүй)', wheelAxisValue({ id: 901, name: 'Хамтын зорилгыг өдөөх' }, rows, { group: 'Өөр бүлэг', metric: 'avg' }), null);
// 9 блок × 2 ангилал (Гүйцэтгэл 313 / Ач холбогдол 314) — тэнхлэг нь хуучин (устсан) ангиллын ID,
// нэр нь БЛОКИЙН нэр. cfg.sub-аар тэр блок доторх ангиллыг сонгоно.
const blocks = [
  R(313, 'Гүйцэтгэл', 4, 1, null, 'Багийн оролцоо'), R(314, 'Ач холбогдол', 2, 1, null, 'Багийн оролцоо'),
  R(313, 'Гүйцэтгэл', 3, 1, null, 'Харилцаа'), R(314, 'Ач холбогдол', 4, 1, null, 'Харилцаа'),
];
check('W7 блокийн нэр + sub=Гүйцэтгэл', wheelAxisValue({ id: 238, name: 'Багийн оролцоо' }, blocks, { group: '', metric: 'avg', sub: 'Гүйцэтгэл' }), 4);
check('W8 блокийн нэр + sub=Ач холбогдол', wheelAxisValue({ id: 238, name: 'Харилцаа' }, blocks, { group: '', metric: 'avg', sub: 'Ач холбогдол' }), 4);
check('W9 блокийн нэр, sub хоосон → блокийн бүх асуулт', wheelAxisValue({ name: 'Багийн оролцоо' }, blocks, { group: '', metric: 'avg', sub: '' }), 3);
check('W10 нэр нь ангилал ч бүлэг шүүлтүүрт таарахгүй → блок руу унахгүй', wheelAxisValue({ name: 'Гүйцэтгэл' }, blocks, { group: 'Өөр', metric: 'avg', sub: 'Гүйцэтгэл' }), null);
console.log(failed ? `\n❌ ${failed} унасан` : '\n✅ БҮГД АМЖИЛТТАЙ');
process.exit(failed ? 1 : 0);
