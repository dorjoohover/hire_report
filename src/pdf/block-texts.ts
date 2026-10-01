// ─────────────────────────────────────────────────────────────────────────────
// Тайлангийн элементүүдийн ТОГТМОЛ бичвэрүүдийг блок бүрт өөрчлөх (block.texts[id]).
// Жиш: квартил графикийн 'Нийт <тест> гүйцэтгэгчдийн 72%-г давсан'-ын 'Нийт',
// 'гүйцэтгэгчдийн', '-г давсан'. Утганд {{хувьсагч}} бичиж болно.
//   exact — бичвэр бүхэлдээ тэнцүү үед л солино (богино үг: 'Нийт', 'Шалгуулагч')
//   sub   — бичвэрийн доторх хэсгийг солино ('Тестийг 12 минутад гүйцэтгэсэн')
// hire_report/src/pdf/block-texts.ts ↔ studio/lib/blockTexts.ts — ЯГ АДИЛ.
// PDF: renderBlock-ийн үед doc.text/widthOfString-ийг солигчоор; Studio: блокийн DOM текст.
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockTextDef {
  id: string;
  label: string;
  text: string;
  match: 'exact' | 'sub';
}

const EXAMINEE: BlockTextDef = { id: 'examinee', label: '«Шалгуулагч»', text: 'Шалгуулагч', match: 'exact' };
const SCORE_DEFAULT: BlockTextDef[] = [
  { id: 'total', label: '«Нийт оноо»', text: 'Нийт оноо', match: 'sub' },
  { id: 'did', label: '«Тестийг»', text: 'Тестийг ', match: 'sub' },
  { id: 'minutes', label: '«минутад гүйцэтгэсэн»', text: 'минутад гүйцэтгэсэн', match: 'sub' },
  { id: 'possible', label: '«(Боломжит»', text: '(Боломжит ', match: 'sub' },
  { id: 'possibleMin', label: '«минут)»', text: 'минут)', match: 'sub' },
];

export const BLOCK_TEXTS: Record<string, BlockTextDef[]> = {
  header: [EXAMINEE],
  title10: [EXAMINEE],
  'user-name': [EXAMINEE],
  info: [
    { id: 'measure', label: '«Хэмжих зүйлс»', text: 'Хэмжих зүйлс', match: 'exact' },
    { id: 'usage', label: '«Хэрэглээ»', text: 'Хэрэглээ', match: 'exact' },
  ],
  'score-default': SCORE_DEFAULT,
  'score-summary': SCORE_DEFAULT,
  quartile: [
    { id: 'total', label: '«Нийт»', text: 'Нийт', match: 'exact' },
    { id: 'prefix', label: '«гүйцэтгэгчдийн»', text: 'гүйцэтгэгчдийн ', match: 'exact' },
    { id: 'suffix', label: '«-г давсан»', text: '-г давсан', match: 'exact' },
  ],
  'score-bar': [{ id: 'total', label: '«Нийт оноо»', text: 'Нийт оноо', match: 'sub' }],
  footer: [
    { id: 'date', label: '«Тайлан боловсруулсан огноо:»', text: 'Тайлан боловсруулсан огноо: ', match: 'sub' },
    {
      id: 'disclaimer',
      label: 'Анхааруулга',
      text: 'Энэхүү тест, үнэлгээний тайлан нь зөвхөн шалгуулагч болон түүний ажил олгогчийн хэрэгцээнд зориулагдсан бөгөөд үнэлгээний тайланг ямар нэгэн байдлаар хуулбарлахыг хориглоно. ',
      match: 'sub',
    },
  ],
  cover: [{ id: 'result', label: '«Үр дүн»', text: 'Үр дүн', match: 'exact' }],
};

// Тухайн блокийн солих функц (солих зүйлгүй бол null).
export function makeTextReplacer(
  type: string,
  overrides: Record<string, string> | null | undefined,
  resolve?: (s: string) => string,
): ((s: string) => string) | null {
  const defs = BLOCK_TEXTS[type];
  if (!defs || !overrides) return null;
  const pairs = defs
    .filter((d) => typeof overrides[d.id] === 'string' && overrides[d.id] !== '' && overrides[d.id] !== d.text)
    .map((d) => ({ from: d.text, to: resolve ? resolve(overrides[d.id]) : overrides[d.id], exact: d.match === 'exact' }))
    .sort((a, b) => b.from.length - a.from.length);
  if (!pairs.length) return null;
  return (s: string) => {
    if (typeof s !== 'string' || !s) return s;
    const trimmed = s.trim();
    // Бүхэлдээ тэнцүү (зай харгалзахгүй) — бүх төрөлд; Studio-ийн JSX 'Тестийг{' '}' мэт хэсэглэсэн текстэд ч.
    for (const p of pairs) {
      if (s === p.from) return p.to;
      if (trimmed && trimmed === p.from.trim()) return s.replace(trimmed, p.to.trim());
    }
    let out = s;
    for (const p of pairs) if (!p.exact && out.includes(p.from)) out = out.split(p.from).join(p.to);
    return out;
  };
}
