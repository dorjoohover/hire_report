import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AssessmentEntity, FormulaEntity } from 'src/entities';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import {
  QuestionAnswerCategoryDao,
  QuestionCategoryDao,
  UserAnswerDao,
} from './index.dao';
import { FormuleDto } from 'src/dtos/index.dto';
import { AssessmentFormulaEntity } from 'src/entities/assessment.formule.entity';

@Injectable()
export class FormuleDao {
  private db: Repository<FormulaEntity>;
  private assessmentFormulaDb: Repository<AssessmentFormulaEntity>;
  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => QuestionAnswerCategoryDao))
    private answerCategoryDao: QuestionAnswerCategoryDao,
    @Inject(forwardRef(() => QuestionCategoryDao))
    private questionCategoryDao: QuestionCategoryDao,
    private userAnswerDao: UserAnswerDao,
  ) {
    this.db = this.dataSource.getRepository(FormulaEntity);
    this.assessmentFormulaDb = this.dataSource.getRepository(
      AssessmentFormulaEntity,
    );
  }

  async aggregate(dto: FormuleDto, w: string): Promise<any[]> {
    try {
      const { groupBy, aggregations, filters, limit, order, sort, category } =
        dto;

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
      if (category) {
        where += ` and "questionCategoryId" = ${category}`;
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
  async getValueOfCategory() {}
  async calculateFixer(input: { exam: number; assessment: AssessmentEntity }) {
    const { exam, assessment } = input;
    const { id, formule } = assessment;
    let formulaId = formule;
    const assessmentFormulas = await this.getFormula(id);
    if (assessmentFormulas && assessmentFormulas.length > 0) {
      const calculations = await Promise.all(
        assessmentFormulas.map(async (formula) => {
          console.log(formula.formule.id, exam, formula.question_category.id);
          const res = await this.calculate(
            formula.formule.id,
            exam,
            formula.question_category.id,
          );
          console.log(res, 'formula', formula);
          return {
            calculation: res,
            type: formula.type,
            total: +(formula.question_category.totalPoint ?? '0'),
            category: formula.question_category.id,
          };
        }),
      );
      return {
        multiple: true,
        data: calculations,
      };
    }
    const calculate = await this.calculate(formulaId, exam);
    return {
      multiple: false,
      data: calculate,
    };
  }
  async calculate(formulaId: number, where: number, category?: number) {
    const formula = await this.db.findOne({
      where: { id: formulaId },
    });
    let w = `"examId" = ${where}`;
    const res = await this.aggregate(
      {
        ...formula,
        category,
      },
      w,
    );

    if (res.length <= 1) return res;

    const isAvg =
      formula.aggregations?.find((a) => a.operation.includes('AVG')) !=
      undefined;

    const response = await Promise.all(
      res.map(async (r) => {
        let aCate = r.answerCategoryId;
        let qCate = r.questionCategoryId;
        console.log(qCate, aCate);
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

  async getFormula(assessment: number) {
    try {
      const formule = await this.assessmentFormulaDb.find({
        where: {
          assessment: {
            id: assessment,
          },
          parent: Not(IsNull()),
        },

        relations: ['formule', 'parent', 'question_category'],
      });
      return formule;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
