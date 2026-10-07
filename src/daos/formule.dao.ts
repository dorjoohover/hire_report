import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AssessmentEntity, FormulaEntity } from 'src/entities';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
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
      if (Array.isArray(aggregations)) {
        aggregations?.forEach((agg) => {
          const alias = `${agg.operation.toLowerCase()}_${agg.field.replace('.', '_')}`;
          if (select != '') select += ', ';
          select += `${agg.operation}(${agg.field}) as "${agg.field}"`;
        });
      }
      let query = `select ${select} from "userAnswer"`;
      if (where) query += ` where ${where}`;
      if (group) query += ` group by ${group}`;
      if (o) query += ` order by "${o}" ${sort ? 'desc' : 'asc'}`;
      if (l) query += ` limit  ${l}`;
      const res = await this.userAnswerDao.query(query);
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
      // Олон assessmentFormula ихэвчлэн ИЖИЛ formule-ийг заадаг — өмнө нь тус бүрд
      // findOne (N query) хийдэг байсныг ялгаатай id-уудаар НЭГ query болгов.
      const formulas = await this.loadFormulas(
        assessmentFormulas.map((f) => f.formule?.id),
      );
      const calculations = await Promise.all(
        assessmentFormulas.map(async (formula) => {
          const res = await this.calculate(
            formula.formule.id,
            exam,
            formula.question_category.id,
            formulas.get(+formula.formule.id),
          );
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
  async calculate(
    formulaId: number,
    where: number,
    category?: number,
    preloaded?: FormulaEntity,
  ) {
    const formula =
      preloaded ??
      (await this.db.findOne({
        where: { id: formulaId },
      }));
    let w = `"examId" = ${where}`;
    const res = await this.aggregate(
      {
        ...formula,
        category,
      },
      w,
    );

    if (res.length <= 1) return res;

    // Өмнө нь мөр БҮРД answerCategoryDao.findOne + questionCategoryDao.findOne
    // (N+1: 30 ангилал × 3 мөр ≈ 180 query, report VPS → DB сүлжээгээр тус бүр
    // round-trip) хийдэг байсан. Одоо бүх мөрийн id-г цуглуулж 2 batch query,
    // дараа нь санах ойд зурагладаг — гаралт ижил (test/formule-parity.ts).
    const cache = await this.buildCategoryCache(res);
    return this.shapeRows(res, formula, cache);
  }

  /** Ялгаатай formule id-уудыг НЭГ query-ээр ачаална → Map<id, FormulaEntity>. */
  async loadFormulas(ids: number[]): Promise<Map<number, FormulaEntity>> {
    const unique = [...new Set(ids.filter((id) => id != null).map((id) => +id))];
    if (!unique.length) return new Map();
    const rows = await this.db.find({ where: { id: In(unique) } });
    return new Map(rows.map((f) => [+f.id, f]));
  }

  /** Aggregate мөрүүдийн ангиллын id-уудыг 2 batch query-ээр (answer + question) ачаална. */
  async buildCategoryCache(rows: any[]) {
    const answerIds = new Set<number>();
    const questionIds = new Set<number>();
    for (const r of rows) {
      if (r.answerCategoryId) answerIds.add(+r.answerCategoryId);
      if (r.questionCategoryId) questionIds.add(+r.questionCategoryId);
    }
    const [answers, questions] = await Promise.all([
      answerIds.size
        ? this.answerCategoryDao.findByIds([...answerIds])
        : Promise.resolve([]),
      questionIds.size
        ? this.questionCategoryDao.findByIds([...questionIds])
        : Promise.resolve([]),
    ]);
    return {
      answer: new Map<number, any>(answers.map((c: any) => [+c.id, c])),
      question: new Map<number, any>(questions.map((c: any) => [+c.id, c])),
    };
  }

  /**
   * Хуучин мөр-тутмын логиктой ЯГ ижил хэлбэржүүлэлт (cache-ээс уншина).
   * Олдоогүй id → null (findOne-ийн адил), 0/null id → өөрчлөлтгүй.
   */
  shapeRows(
    res: any[],
    formula: any,
    cache: { answer: Map<number, any>; question: Map<number, any> },
  ) {
    if (res.length <= 1) return res;

    const isAvg =
      formula.aggregations?.find((a) => a.operation.includes('AVG')) !=
      undefined;

    const response = res.map((r) => {
      let aCate = r.answerCategoryId;
      let qCate = r.questionCategoryId;
      if (aCate) {
        aCate = cache.answer.get(+aCate) ?? null;
      }
      if (qCate) {
        qCate = cache.question.get(+qCate) ?? null;
      }

      // Ангиллаар бүлэглэхэд зарим бүлгийн SUM/AVG нь NULL (жиш зөвхөн текст хариулт)
      // байж болно → NaN оноо result-д хадгалагдаж, эрэмбэ / тайлан эвдэрдэг байсан → 0.
      // SUM-ийг parseInt хийвэл бутархай оноо ("Оноо байршуулах" 2.5 гэх мэт) тасардаг байсан
      // (7.5 → 7). Бүхэл нийлбэрт үр дүн өөрчлөгдөхгүй.
      const raw = Math.round(parseFloat(r.point) * 100) / 100;
      let sum = Number.isFinite(raw) ? raw : 0;

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
    });

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
