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
}
