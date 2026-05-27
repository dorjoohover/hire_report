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
  getByQuestionCategory = async (code: string) => {
    return await this.db.find({
      where: {
        code,
        questionCategory: {
          is_calculated: false,
        },
      },
    });
  };
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

  getAnswer = async (code: string, questionId: string) => {
    const res = await this.db
      .createQueryBuilder('userAnswer')
      .innerJoin('questionAnswer', 'qa', 'qa.id = userAnswer.answerId')
      .select('qa.value', 'value')
      .where('userAnswer.code = :code', { code })
      .andWhere('userAnswer.questionId = :questionId', { questionId })
      .getRawOne();

    return res?.value ?? null;
  };

  getAnswerValue = async (code: string, questionId: string) => {
    const res = await this.db
      .createQueryBuilder('userAnswer')
      .select('value')
      .where('userAnswer.code = :code', { code })
      .andWhere('userAnswer.questionId = :questionId', { questionId })
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
