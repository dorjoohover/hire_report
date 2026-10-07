// Render замд ашиглагддаг raw SQL-ууд НЭГ газар (v1.3.0). Snapshot-ийн түлхүүр нь
// SQL текст биш НЭР дээр суурилдаг ба remote data endpoint (calc service) зөвхөн
// эндхийн нэрээр л SQL ажиллуулна — сүлжээгээр дурын SQL хүлээж авахгүй.
export const NAMED_SQL = {
  /** DISC: хариулт бүрийн +1/-1 оноо ба хариултын ангиллын нэр (disc.ts, disc-eval-table). */
  DISC_ANSWER_POINTS: `select point, "qac".name from "userAnswer" inner join "questionAnswerCategory" qac on qac.id = "answerCategoryId" where code = $1`,
  /** Тестийн хариултын ангиллууд id дарааллаар (dynamic-template loadAnswerCategories). */
  ANSWER_CATEGORY_LIST: `SELECT id, name FROM "questionAnswerCategory" WHERE "assessmentId" = $1 ORDER BY id ASC`,
  /**
   * Дэд бүлэг (хариултын ангилал) тус бүрийн ДЭЭД оноо — тестийн асуултын бүтэц (хариулт/матрицын
   * нүд бүр нэг мөр). report-widgets.ts answerCategoryMaxes() бодно ({{answerCategory[i].max}}).
   */
  ANSWER_CATEGORY_MAX_ROWS: `SELECT q.id AS "questionId", q.type, q."minValue", q."maxValue", q.point AS "questionPoint", c.is_calculated AS "isCalculated", qa.id AS "answerId", qa."categoryId", acA."parentId" AS "categoryParentId", qa.point, qa.negative, qa.reverse, m.id AS "matrixId", m.point AS "matrixPoint", m."categoryId" AS "matrixCategoryId", acM."parentId" AS "matrixCategoryParentId" FROM question q JOIN "questionCategory" c ON c.id = q."categoryId" JOIN "questionAnswer" qa ON qa."questionId" = q.id LEFT JOIN "questionAnswerMatrix" m ON m."answerId" = qa.id LEFT JOIN "questionAnswerCategory" acA ON acA.id = qa."categoryId" LEFT JOIN "questionAnswerCategory" acM ON acM.id = m."categoryId" WHERE c."assessmentId" = $1 AND COALESCE(q.status, 10) <> 20 ORDER BY q.id, qa.id, m.id`,
} as const;

export type NamedSql = keyof typeof NAMED_SQL;

const BY_TEXT = new Map<string, NamedSql>(
  (Object.keys(NAMED_SQL) as NamedSql[]).map((k) => [normalizeSql(NAMED_SQL[k]), k]),
);

function normalizeSql(sql: string): string {
  return String(sql).replace(/\s+/g, ' ').trim();
}

/** SQL текстээс нэрийг олно (олдохгүй бол null — remote-оор ажиллуулахгүй). */
export function namedSqlOf(sql: string): NamedSql | null {
  return BY_TEXT.get(normalizeSql(sql)) ?? null;
}
