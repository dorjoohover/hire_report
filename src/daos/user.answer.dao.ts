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
  query = async (q: string) => {
    const res = await this.db.find({
      where: {
        exam: {
          id: 225,
        },
      },
      relations: ['answerCategory', 'answer', 'matrix'],
    });
    return await this.db.query(q);
  };

  partialCalculator = async (
    id: number,
    type: number,
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

    return await res
      .groupBy('category.name')
      .addGroupBy('category.totalPoint')
      .getRawMany();
  };
}
