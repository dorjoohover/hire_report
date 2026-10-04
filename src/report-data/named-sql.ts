// Render замд ашиглагддаг raw SQL-ууд НЭГ газар (v1.3.0). Snapshot-ийн түлхүүр нь
// SQL текст биш НЭР дээр суурилдаг ба remote data endpoint (calc service) зөвхөн
// эндхийн нэрээр л SQL ажиллуулна — сүлжээгээр дурын SQL хүлээж авахгүй.
export const NAMED_SQL = {
  /** DISC: хариулт бүрийн +1/-1 оноо ба хариултын ангиллын нэр (disc.ts, disc-eval-table). */
  DISC_ANSWER_POINTS: `select point, "qac".name from "userAnswer" inner join "questionAnswerCategory" qac on qac.id = "answerCategoryId" where code = $1`,
  /** Тестийн хариултын ангиллууд id дарааллаар (dynamic-template loadAnswerCategories). */
  ANSWER_CATEGORY_LIST: `SELECT id, name FROM "questionAnswerCategory" WHERE "assessmentId" = $1 ORDER BY id ASC`,
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
