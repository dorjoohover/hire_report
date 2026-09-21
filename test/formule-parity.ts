/**
 * Тайлан бодох оптимизацийн PARITY тест.
 *
 * Ажиллуулах:
 *   npx ts-node -P tsconfig.json -r tsconfig-paths/register test/formule-parity.ts
 *
 * Зорилго: N+1-ийг арилгасан шинэ `shapeRows()` нь ХУУЧИН мөр тус бүрд
 * `findOne` дуудаж байсан логиктой ЯГ ижил гаралт өгч байгааг батлах.
 * Хуучин хувилбарыг доор эх хэлбэрээр нь дахин бичиж, хоёуланг нь ижил
 * өгөгдөл дээр ажиллуулж JSON-оор жишнэ.
 */
import { FormuleDao } from '../src/daos/formule.dao';

// ---- Хуурамч ангиллын сан ----
const ANSWER_CATEGORIES: any = {
  1: { id: 1, name: 'Улаан', parent: { id: 100, name: 'Эцэг-1' } },
  2: { id: 2, name: 'Ногоон', parent: null },
  3: { id: 3, name: 'Цэнхэр', parent: { id: 101, name: 'Эцэг-2' } },
};
const QUESTION_CATEGORIES: any = {
  10: { id: 10, name: 'Блок А' },
  11: { id: 11, name: 'Блок Б' },
};

// ---- ХУУЧИН логик (эх кодоос хуулбарласан, мөр бүрд await findOne) ----
async function legacyShape(res: any[], formula: any) {
  if (res.length <= 1) return res;

  const isAvg =
    formula.aggregations?.find((a: any) => a.operation.includes('AVG')) !=
    undefined;

  const response = await Promise.all(
    res.map(async (r: any) => {
      let aCate = r.answerCategoryId;
      let qCate = r.questionCategoryId;
      if (aCate) aCate = ANSWER_CATEGORIES[+aCate] ?? null;
      if (qCate) qCate = QUESTION_CATEGORIES[+qCate] ?? null;

      const sum = isAvg
        ? Math.round(parseFloat(r.point) * 100) / 100
        : parseInt(r.point);

      return qCate
        ? {
            point: sum,
            aCate: aCate?.name ?? aCate,
            qCate: qCate?.name ?? qCate,
            parent: aCate?.parent,
            formula: formula.aggregations,
          }
        : {
            point: sum,
            aCate: aCate?.name ?? aCate,
            parent: aCate?.parent,
            formula: formula.aggregations,
          };
    }),
  );

  if (isAvg) {
    const total =
      Math.round(
        (response.reduce((acc: any, cur: any) => acc + cur.point, 0) /
          response.length) *
          100,
      ) / 100;

    return response
      .map((item: any) => ({ ...item, total }))
      .sort((a: any, b: any) => b.point - a.point);
  }

  return response.sort((a: any, b: any) => b.point - a.point);
}

// ---- ШИНЭ логик (бодит DAO, mock-той) ----
const answerCategoryDao: any = {
  findByIds: async (ids: number[]) =>
    ids.map((i) => ANSWER_CATEGORIES[i]).filter(Boolean),
};
const questionCategoryDao: any = {
  findByIds: async (ids: number[]) =>
    ids.map((i) => QUESTION_CATEGORIES[i]).filter(Boolean),
};
const dataSource: any = { getRepository: () => ({}) };
const userAnswerDao: any = {};

const dao: any = new FormuleDao(
  dataSource,
  answerCategoryDao,
  questionCategoryDao,
  userAnswerDao,
);

async function newShape(res: any[], formula: any) {
  const cache = await dao.buildCategoryCache(res);
  return dao.shapeRows(res, formula, cache);
}

// ---- Тестийн кейсүүд ----
const SUM_FORMULA = { aggregations: [{ operation: 'SUM', field: 'point' }] };
const AVG_FORMULA = { aggregations: [{ operation: 'AVG', field: 'point' }] };

const CASES: { name: string; rows: any[]; formula: any }[] = [
  {
    name: 'SUM · answer+question category',
    formula: SUM_FORMULA,
    rows: [
      { answerCategoryId: 1, questionCategoryId: 10, point: '12' },
      { answerCategoryId: 2, questionCategoryId: 10, point: '30' },
      { answerCategoryId: 3, questionCategoryId: 11, point: '7' },
    ],
  },
  {
    name: 'SUM · зөвхөн answer category',
    formula: SUM_FORMULA,
    rows: [
      { answerCategoryId: 1, questionCategoryId: null, point: '5' },
      { answerCategoryId: 2, questionCategoryId: null, point: '9' },
    ],
  },
  {
    name: 'AVG · total бодогдох ёстой',
    formula: AVG_FORMULA,
    rows: [
      { answerCategoryId: 1, questionCategoryId: 10, point: '4.55' },
      { answerCategoryId: 2, questionCategoryId: 10, point: '2.1' },
      { answerCategoryId: 3, questionCategoryId: 11, point: '3.333' },
    ],
  },
  {
    name: 'Байхгүй ангилал (null болох ёстой)',
    formula: SUM_FORMULA,
    rows: [
      { answerCategoryId: 999, questionCategoryId: 888, point: '1' },
      { answerCategoryId: 1, questionCategoryId: 10, point: '2' },
    ],
  },
  {
    name: 'Ангиллын id 0/null',
    formula: SUM_FORMULA,
    rows: [
      { answerCategoryId: null, questionCategoryId: null, point: '3' },
      { answerCategoryId: 0, questionCategoryId: 0, point: '8' },
    ],
  },
  {
    name: 'Нэг мөр — өөрчлөлтгүй буцаах',
    formula: SUM_FORMULA,
    rows: [{ answerCategoryId: 1, questionCategoryId: 10, point: '42' }],
  },
  {
    name: 'Хоосон',
    formula: SUM_FORMULA,
    rows: [],
  },
  {
    name: 'Ижил оноотой мөрүүд (эрэмбэ тогтвортой байх)',
    formula: SUM_FORMULA,
    rows: [
      { answerCategoryId: 1, questionCategoryId: 10, point: '5' },
      { answerCategoryId: 2, questionCategoryId: 10, point: '5' },
      { answerCategoryId: 3, questionCategoryId: 11, point: '5' },
    ],
  },
];

(async () => {
  let failed = 0;
  for (const c of CASES) {
    const legacy = await legacyShape(
      JSON.parse(JSON.stringify(c.rows)),
      c.formula,
    );
    const next = await newShape(JSON.parse(JSON.stringify(c.rows)), c.formula);
    const ok = JSON.stringify(legacy) === JSON.stringify(next);
    if (!ok) failed++;
    console.log(`${ok ? '✅' : '❌'} ${c.name}`);
    if (!ok) {
      console.log('   хуучин:', JSON.stringify(legacy));
      console.log('   шинэ  :', JSON.stringify(next));
    }
  }

  // --- Round-trip тоог хэмжих ---
  let calls = 0;
  const countingAnswerDao: any = {
    findByIds: async (ids: number[]) => {
      calls++;
      return ids.map((i) => ANSWER_CATEGORIES[i]).filter(Boolean);
    },
  };
  const countingQuestionDao: any = {
    findByIds: async (ids: number[]) => {
      calls++;
      return ids.map((i) => QUESTION_CATEGORIES[i]).filter(Boolean);
    },
  };
  const dao2: any = new FormuleDao(
    dataSource,
    countingAnswerDao,
    countingQuestionDao,
    userAnswerDao,
  );

  // 30 ангилал × 3 мөр = 90 мөр
  const bigRows: any[] = [];
  for (let c = 0; c < 30; c++) {
    for (let a = 1; a <= 3; a++) {
      bigRows.push({
        answerCategoryId: a,
        questionCategoryId: 10 + (c % 2),
        point: `${a * 3}`,
      });
    }
  }
  await dao2.buildCategoryCache(bigRows);
  const legacyCalls = bigRows.filter((r) => r.answerCategoryId).length +
    bigRows.filter((r) => r.questionCategoryId).length;
  console.log(
    `\n📊 90 мөр дээр: хуучин ≈ ${legacyCalls} DB дуудлага → шинэ ${calls} дуудлага`,
  );

  console.log(failed === 0 ? '\n✅ БҮГД ИЖИЛ ГАРАЛТТАЙ' : `\n❌ ${failed} кейс зөрлөө`);
  process.exit(failed === 0 ? 0 : 1);
})();
