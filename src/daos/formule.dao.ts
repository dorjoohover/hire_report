import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FormulaEntity } from 'src/entities';
import { DataSource, Repository } from 'typeorm';
import {
  QuestionAnswerCategoryDao,
  QuestionCategoryDao,
  UserAnswerDao,
} from './index.dao';
import { FormuleDto } from 'src/dtos/index.dto';

@Injectable()
export class FormuleDao {
  private db: Repository<FormulaEntity>;
  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => QuestionAnswerCategoryDao))
    private answerCategoryDao: QuestionAnswerCategoryDao,
    @Inject(forwardRef(() => QuestionCategoryDao))
    private questionCategoryDao: QuestionCategoryDao,
    private userAnswerDao: UserAnswerDao,
  ) {
    this.db = this.dataSource.getRepository(FormulaEntity);
  }

  async aggregate(dto: FormuleDto, w: string): Promise<any[]> {
    try {
      const { groupBy, aggregations, filters, limit, order, sort } = dto;

      let select = '';
      let where = w;
      let group = '';
      let l = limit;
      let o = order;

      // Apply JOINs
      // queryBuilder.leftJoinAndSelect('sales.productDetails', 'product');

      // Apply filters
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (where != '') where += ' and ';
          where += `${key} = ${filters[key]}`;
        });
      }

      if (groupBy && groupBy.length > 0) {
        group = groupBy.map((g) => `"${g}"`).join(', ');
      }

      if (groupBy && groupBy.length > 0) {
        let g = groupBy.map((g) => `"${g}"`).join(', ');
        if (g) select += g;
      }

      // Apply aggregations
      aggregations.forEach((agg) => {
        const alias = `${agg.operation.toLowerCase()}_${agg.field.replace('.', '_')}`;
        if (select != '') select += ', ';
        select += `${agg.operation}(${agg.field}) as "${agg.field}"`;
      });
      let query = `select ${select} from "userAnswer"`;
      if (where) query += ` where ${where}`;
      if (group) query += ` group by ${group}`;
      if (o) query += ` order by "${o}" ${sort ? 'desc' : 'asc'}`;
      if (l) query += ` limit  ${l}`;
      console.log(query);
      const res = await this.userAnswerDao.query(query);
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  async calculate(formulaId: number, where: number) {
    const formula = await this.db.findOne({
      where: { id: formulaId },
    });
    let w = `"examId" = ${where}`;
    const res = await this.aggregate(formula, w);

    if (res.length <= 1) return res;

    const isAvg =
      formula.aggregations?.find((a) => a.operation.includes('AVG')) !=
      undefined;

    const response = await Promise.all(
      res.map(async (r) => {
        let aCate = r.answerCategoryId;
        let qCate = r.questionCategoryId;

        if (aCate) {
          aCate = await this.answerCategoryDao.findOne(+aCate);
        }
        if (qCate) {
          qCate = await this.questionCategoryDao.findOne(+qCate);
        }

        let sum = isAvg
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
          (response.reduce((acc, cur) => acc + cur.point, 0) /
            response.length) *
            100,
        ) / 100;

      return response
        .map((item) => ({
          ...item,
          total,
        }))
        .sort((a, b) => b.point - a.point);
    }

    return response.sort((a, b) => b.point - a.point);
  }
}
