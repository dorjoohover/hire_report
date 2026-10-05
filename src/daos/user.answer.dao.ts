import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReportType } from 'src/base/constants';
import { UserAnswerEntity } from 'src/entities';
import { CreateUserAnswerDto } from 'src/dtos/index.dto';

@Injectable()
export class UserAnswerDao {
  private db: Repository<UserAnswerEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(UserAnswerEntity);
  }
  query = async (q: string, params?: any[]) => {
    return this.db.query(q, params);
  };
  // getByQuestionCategory = async (code: string) => {
  //   return await this.db.find({
  //     where: {
  //       code,
  //       questionCategory: {
  //         is_calculated: false,
  //       },
  //     },
  //   });
  // };
  partialCalculator = async (
    id: string,
    type: number,
    category?: number,
  ): Promise<
    {
      categoryName: string;
      point: number;
      totalPoint: number;
    }[]
  > => {
    const res = this.db
      .createQueryBuilder('userAnswer')
      .select('category.name', 'categoryName')
      .addSelect('category.totalPoint', 'totalPoint')
      .addSelect(
        `${type === ReportType.CORRECTCOUNT ? 'COUNT' : 'SUM'}(userAnswer.point)`,
        'point',
      )
      .innerJoin(
        'questionCategory',
        'category',
        'category.id = "userAnswer"."questionCategoryId"',
      )
      .where('"userAnswer"."code" = :id', { id });

    if (type === ReportType.CORRECTCOUNT) {
      res.andWhere('"userAnswer"."correct" = true');
    }
    if (category) {
      res.andWhere(`category.id = ${category}`);
    }
    return await res
      .groupBy('category.name')
      .addGroupBy('category.totalPoint')
      .getRawMany();
  };

  // Studio template-тэй assessment-ийн ерөнхий тооцоо (томьёогүй үед) —
  // тухайн exam-ийн бүх хариултын онооны нийлбэр (countCorrect бол зөв
  // хариултын тоо).
  totalPoint = async (code: string, countCorrect = false): Promise<number> => {
    const row = await this.db
      .createQueryBuilder('userAnswer')
      .select(
        countCorrect
          ? 'COUNT(*) FILTER (WHERE "userAnswer"."correct" = true)'
          : 'COALESCE(SUM("userAnswer"."point"), 0)',
        'point',
      )
      .where('"userAnswer"."code" = :code', { code })
      .getRawOne();
    return Number(row?.point) || 0;
  };

  // Studio "бүлэг тус бүрийн" хувьсагчид ({{category[1].avg}},
  // {{custom.<key>[1]}}) — partialCalculator-тэй ижил оноо, нэмээд хариулсан
  // асуултын тоо (дундаж оноонд) ба тестийн бүлгийн ДАРААЛАЛ (orderNumber,
  // дараа нь id). partialCalculator-ийг хуучин тайлангууд ашигладаг тул
  // тусад нь бичив.
  categoryStats = async (
    id: string,
    type: number,
    assessmentId?: number | null,
  ): Promise<
    { categoryName: string; point: number; totalPoint: number; count: number }[]
  > => {
    // Тестийн id мэдэгдэж байвал: асуулттай БҮХ бүлэг (хариулаагүй ч 0 оноотой) admin-ий
    // блокийн дарааллаар — {{category[i]}}-ийн дугаар нэг бүлэг бүхэлдээ алгасагдсан
    // (хариултгүй) үед шилждэггүй, admin дээрх "N-р бүлэг"-тэй ижил байна.
    if (assessmentId) {
      const pt =
        type === ReportType.CORRECTCOUNT
          ? 'COUNT(ua.id) FILTER (WHERE ua."correct" = true)'
          : 'COALESCE(SUM(ua."point"), 0)';
      const rows = await this.db.query(
        `SELECT c.name AS "categoryName", c."totalPoint" AS "totalPoint",
                ${pt} AS point, COUNT(DISTINCT ua."questionId") AS count
           FROM "questionCategory" c
           LEFT JOIN "userAnswer" ua ON ua."questionCategoryId" = c.id AND ua.code = $1
          WHERE c."assessmentId" = $2
          GROUP BY c.id, c.name, c."totalPoint", c."orderNumber"
         HAVING COUNT(ua.id) > 0
             OR EXISTS (SELECT 1 FROM question q WHERE q."categoryId" = c.id AND q.status = 10)
          ORDER BY c."orderNumber" ASC NULLS LAST, c.id ASC`,
        [id, assessmentId],
      );
      return rows.map((r: any) => ({
        categoryName: r.categoryName,
        point: Number(r.point) || 0,
        totalPoint: Number(r.totalPoint) || 0,
        count: Number(r.count) || 0,
      }));
    }
    // CORRECTCOUNT: оноо = зөв хариултын тоо, харин асуултын тоо нь БҮХ
    // хариулсан асуулт (дундаж = зөв/нийт) — тиймээс WHERE биш FILTER.
    const pointExpr =
      type === ReportType.CORRECTCOUNT
        ? 'COUNT(*) FILTER (WHERE "userAnswer"."correct" = true)'
        : 'COALESCE(SUM("userAnswer"."point"), 0)';
    const res = this.db
      .createQueryBuilder('userAnswer')
      .select('category.name', 'categoryName')
      .addSelect('category.totalPoint', 'totalPoint')
      .addSelect(pointExpr, 'point')
      .addSelect('COUNT(DISTINCT "userAnswer"."questionId")', 'count')
      .innerJoin(
        'questionCategory',
        'category',
        'category.id = "userAnswer"."questionCategoryId"',
      )
      .where('"userAnswer"."code" = :id', { id });
    const rows = await res
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.totalPoint')
      .addGroupBy('category.orderNumber')
      .orderBy('category.orderNumber', 'ASC', 'NULLS LAST')
      .addOrderBy('category.id', 'ASC')
      .getRawMany();
    return rows.map((r: any) => ({
      categoryName: r.categoryName,
      point: Number(r.point) || 0,
      totalPoint: Number(r.totalPoint) || 0,
      count: Number(r.count) || 0,
    }));
  };

  // "wheel-radar" блок — хариултын ангилал (questionAnswerCategory) бүрийн
  // нийт оноо, хариулсан асуултын тоо. parentId-г хамт буцаана — тэнхлэгт
  // эцэг ангилал сонгосон бол дэд ангиллуудын оноог нэгтгэж тооцоход.
  answerCategoryStats = async (
    code: string,
  ): Promise<
    {
      id: number;
      parentId: number | null;
      name: string;
      categoryId: number | null;
      categoryName: string | null;
      point: number;
      count: number;
    }[]
  > => {
    // Хариултын ангилал (дэд бүлэг) × асуултын ангилал (бүлэг) тус бүрийн
    // нийт оноо, хариулсан асуултын тоо. parentId — эцэг хариултын ангилал
    // сонгосон үед дэд ангиллуудыг нэгтгэхэд.
    const rows = await this.db
      .createQueryBuilder('userAnswer')
      .select('ac.id', 'id')
      .addSelect('ac."parentId"', 'parentId')
      .addSelect('ac.name', 'name')
      .addSelect('qc.id', 'categoryId')
      .addSelect('qc.name', 'categoryName')
      .addSelect('COALESCE(SUM("userAnswer"."point"), 0)', 'point')
      .addSelect('COUNT(DISTINCT "userAnswer"."questionId")', 'count')
      .innerJoin('questionAnswerCategory', 'ac', 'ac.id = "userAnswer"."answerCategoryId"')
      .leftJoin('questionCategory', 'qc', 'qc.id = "userAnswer"."questionCategoryId"')
      .where('"userAnswer"."code" = :code', { code })
      .groupBy('ac.id')
      .addGroupBy('ac."parentId"')
      .addGroupBy('ac.name')
      .addGroupBy('qc.id')
      .addGroupBy('qc.name')
      .getRawMany();
    return rows.map((r: any) => ({
      id: Number(r.id),
      parentId: r.parentId != null ? Number(r.parentId) : null,
      name: r.name,
      categoryId: r.categoryId != null ? Number(r.categoryId) : null,
      categoryName: r.categoryName ?? null,
      point: Number(r.point) || 0,
      count: Number(r.count) || 0,
    }));
  };

  getAnswer = async (
    code: string,
    questionId: string,
    questionInstanceId: string,
  ) => {
    const res = await this.db
      .createQueryBuilder('userAnswer')
      .innerJoin('questionAnswer', 'qa', 'qa.id = userAnswer.answerId')
      .select('qa.value', 'value')
      .where('userAnswer.code = :code', { code })
      .andWhere(
        '(userAnswer.questionId = :questionId OR userAnswer.questionId = :questionInstanceId)',
        {
          questionId,
          questionInstanceId,
        },
      )
      .getRawOne();

    return res?.value ?? null;
  };

  getAnswerValue = async (
    code: string,
    questionId: string,
    questionInstanceId: string,
  ) => {
    const res = await this.db
      .createQueryBuilder('userAnswer')
      .select('value')
      .where('userAnswer.code = :code', { code })
      .andWhere(
        '(userAnswer.questionId = :questionId OR userAnswer.questionId = :questionInstanceId)',
        {
          questionId,
          questionInstanceId,
        },
      )
      .getRawOne();

    return res?.value ?? null;
  };

  getAnswerAll = async (code: string) => {
    return await this.db
      .createQueryBuilder('us')
      .leftJoin('questionAnswer', 'qa', 'qa.id = us.answerId')
      .select([
        'us.questionCategoryId AS "questionCategoryId"',
        `
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'questionId', us.questionId,
        'value', us.value,
        'point', us.point,
        'answerValue', qa.value
      )
      ORDER BY us.questionId ASC
    ) AS answers
    `,
      ])
      .where('us.code = :code', { code })
      .groupBy('us.questionCategoryId')
      .orderBy('us.questionCategoryId', 'ASC')
      .getRawMany();
  };

  // Studio (pdf-builder) placeholder-уудад зориулсан. Тухайн нэг category-ийн
  // хариултуудыг question-ы orderNumber дарааллаар ангилж буцаана.
  getAnswersByCategory = async (code: string, categoryId: number) => {
    return await this.db.query(
      `SELECT ua."questionId"   AS "questionId",
              q.name             AS "questionName",
              q."orderNumber"    AS "orderNumber",
              ua.value           AS value,
              ua.point           AS point,
              qa.value           AS "answerValue"
       FROM "userAnswer" ua
       JOIN question q              ON q.id = ua."questionId"
       LEFT JOIN "questionAnswer" qa ON qa.id = ua."answerId"
       WHERE ua.code = $1 AND ua."questionCategoryId" = $2
       ORDER BY q."orderNumber" ASC, ua.id ASC`,
      [code, categoryId],
    );
  };

  // {{question[<id>].answer}} — тухайн шалгалтын бүх хариулт асуултын id-аар (нэг query).
  // Сонгосон хариултын текст (qa.value), матрицын баганын текст (m.value), бичсэн утга
  // (ua.value — TEXT / NUMBER / TIME), оноо, асуултын төрөл / текст.
  questionAnswers = async (code: string) => {
    return await this.db.query(
      `SELECT ua."questionId"   AS "questionId",
              q.type             AS "questionType",
              q.name             AS "questionName",
              q.slider           AS slider,
              q."minValue"       AS "minValue",
              ua.value           AS value,
              ua.point           AS point,
              qa.value           AS "answerValue",
              m.value            AS "matrixValue"
       FROM "userAnswer" ua
       JOIN question q                    ON q.id = ua."questionId"
       LEFT JOIN "questionAnswer" qa       ON qa.id = ua."answerId"
       LEFT JOIN "questionAnswerMatrix" m  ON m.id = ua."matrixId"
       WHERE ua.code = $1
       ORDER BY ua."questionId" ASC, qa."orderNumber" ASC NULLS LAST, ua.id ASC`,
      [code],
    );
  };

  // Studio placeholder-аар асуултын ID-аар нэг л хариулт авах.
  // Олон сонголттой асуултанд олон мөр буцах боломжтой тул array буцаана.
  getAnswerByQuestion = async (code: string, questionId: number) => {
    return await this.db.query(
      `SELECT ua."questionId" AS "questionId",
              ua.value         AS value,
              ua.point         AS point,
              qa.value         AS "answerValue"
       FROM "userAnswer" ua
       LEFT JOIN "questionAnswer" qa ON qa.id = ua."answerId"
       WHERE ua.code = $1 AND ua."questionId" = $2
       ORDER BY ua.id ASC`,
      [code, questionId],
    );
  };
}
