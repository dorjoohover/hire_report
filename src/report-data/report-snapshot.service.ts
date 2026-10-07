import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { gzipSync } from 'zlib';
import { ExamDao } from 'src/daos/exam.dao';
import { ResultDao } from 'src/daos/result.dao';
import { UserAnswerDao } from 'src/daos/user.answer.dao';
import { PdfTemplateDao } from 'src/daos/pdf-template.dao';
import { AssessmentVariableDao } from 'src/daos/assessment-variable.dao';
import { QuestionAnswerCategoryDao } from 'src/daos/question.answer.category.dao';
import { NAMED_SQL, namedSqlOf } from './named-sql';
import { callKey, encodeValue, newSnapshot, recordSnapshot, ReportSnapshot } from './snapshot';

/*
 * Snapshot бүрдүүлэх / хадгалах / remote miss шийдэх (v1.3.0, calc service — core VPS).
 *
 * build(code): render замын нийтлэг уншилтуудыг (renderer-уудтай ИЖИЛ аргументаар)
 *   record context дотор дуудаж snapshot-д бичнэ. Энд таараагүй (миссэн) дуудлагыг
 *   render worker core-оор дамжуулан resolve()-оос авна — тиймээс жагсаалт бүрэн байх
 *   албагүй, гэхдээ бүрэн байх тусам сүлжээний дуудлага цөөрнө (SNAPSHOT_MISS лог).
 */
const QUARTILE_TTL_MS = Number(process.env.SNAPSHOT_QUARTILE_TTL_MS ?? 10 * 60 * 1000);

@Injectable()
export class ReportSnapshotService {
  /** Assessment-ийн бүх result-ийн оноо (percentile) — exam бүрд биш, TTL-тэй нэг удаа. */
  private quartileMemo = new Map<string, { exp: number; encoded: string }>();

  constructor(
    private dataSource: DataSource,
    private examDao: ExamDao,
    private resultDao: ResultDao,
    private userAnswer: UserAnswerDao,
    private templateDao: PdfTemplateDao,
    private variableDao: AssessmentVariableDao,
    private qacDao: QuestionAnswerCategoryDao,
  ) {}

  /** Remote-оор (core → calc) ажиллуулж болох функцууд. Нэр = snapshottable нэр. */
  private registry(): Record<string, (...args: any[]) => Promise<unknown>> {
    const ua: any = this.userAnswer;
    const r: any = this.resultDao;
    return {
      'exam.findByCode': (c) => this.examDao.findByCode(c),
      'result.findOne': (c) => r.findOne(c),
      'result.findChild': (c) => r.findChild(c),
      'result.findQuartile': (a) => r.findQuartile(a),
      'result.findQuartileWithTotal': (a) => r.findQuartileWithTotal(a),
      'ua.partialCalculator': (...a) => ua.partialCalculator(...a),
      'ua.categoryStats': (...a) => ua.categoryStats(...a),
      'ua.answerCategoryStats': (...a) => ua.answerCategoryStats(...a),
      'ua.getAnswer': (...a) => ua.getAnswer(...a),
      'ua.getAnswerValue': (...a) => ua.getAnswerValue(...a),
      'ua.getAnswerAll': (...a) => ua.getAnswerAll(...a),
      'ua.getAnswersByCategory': (...a) => ua.getAnswersByCategory(...a),
      'ua.questionAnswers': (...a) => ua.questionAnswers(...a),
      'ua.getAnswerByQuestion': (...a) => ua.getAnswerByQuestion(...a),
      'ua.query': (sql, params) => {
        // Сүлжээгээр ДУРЫН SQL хүлээж авахгүй — зөвхөн NAMED_SQL-д бүртгэлтэй текст.
        if (!namedSqlOf(String(sql ?? ''))) throw new BadRequestException('unknown SQL');
        return ua.query(sql, params);
      },
      'template.findActiveByAssessment': (a) => this.templateDao.findActiveByAssessment(a),
      'variable.findAllByAssessmentId': (a) => this.variableDao.findAllByAssessmentId(a),
      'qac.findByAssessmentId': (a) => this.qacDao.findByAssessmentId(a),
    };
  }

  allowedNames(): string[] {
    return Object.keys(this.registry());
  }

  /** core → POST /internal/report-data. Context-гүй → шууд DB. */
  async resolve(name: string, args: unknown[]): Promise<unknown> {
    const fn = this.registry()[name];
    if (!fn) throw new BadRequestException(`unknown data function: ${name}`);
    if (!Array.isArray(args) || args.length > 6) throw new BadRequestException('bad args');
    return fn(...args);
  }

  async build(code: string): Promise<ReportSnapshot> {
    const snap = newSnapshot(code);
    await recordSnapshot(snap, async () => {
      const exam: any = await this.examDao.findByCode(code);
      const result: any = await this.resultDao.findOne(code);
      await this.resultDao.findChild(code);
      const assessmentId: number | undefined = exam?.assessment?.id;
      const tasks: Promise<unknown>[] = [];
      const add = (label: string, p: Promise<unknown>) =>
        tasks.push(
          p.catch((e) => console.warn(`⚠️ snapshot ${label} алдаа (${code}):`, e?.message ?? e)),
        );

      if (assessmentId) {
        add('template', this.templateDao.findActiveByAssessment(assessmentId));
        add('variables', this.variableDao.findAllByAssessmentId(assessmentId));
        add('qac', this.qacDao.findByAssessmentId(assessmentId));
        add('answerCategoryList', this.userAnswer.query(NAMED_SQL.ANSWER_CATEGORY_LIST, [assessmentId]));
        add('answerCategoryMaxRows', this.userAnswer.query(NAMED_SQL.ANSWER_CATEGORY_MAX_ROWS, [assessmentId]));
        add('sliderCategoryMaxRows', this.userAnswer.query(NAMED_SQL.SLIDER_CATEGORY_MAX_ROWS, [assessmentId]));
      }
      add('discPoints', this.userAnswer.query(NAMED_SQL.DISC_ANSWER_POINTS, [code]));
      add('questionAnswers', this.userAnswer.questionAnswers(code));
      add('answerCategoryStats', this.userAnswer.answerCategoryStats(code));
      if (result) {
        // dynamic-template.renderer.ts-тэй ИЖИЛ аргумент (getCategories / categoryStats).
        add('partialCalculator', this.userAnswer.partialCalculator(result.code, result.type));
        add(
          'categoryStats',
          this.userAnswer.categoryStats(
            result.code,
            result.type,
            Number(result.assessment ?? assessmentId) || null,
          ),
        );
      }
      await Promise.all(tasks);
    });
    // Percentile-ийн өгөгдөл (single.pdf.ts) — assessment бүрд TTL-тэй кэш (record-оос гадуур).
    const assessment = Number(decodeAssessment(snap));
    if (assessment) {
      await this.addQuartile(snap, 'result.findQuartile', assessment, () => this.resultDao.findQuartile(assessment));
      await this.addQuartile(snap, 'result.findQuartileWithTotal', assessment, () =>
        this.resultDao.findQuartileWithTotal(assessment),
      );
    }
    return snap;
  }

  private async addQuartile(
    snap: ReportSnapshot,
    name: string,
    assessment: number,
    load: () => Promise<unknown>,
  ) {
    const key = callKey(name, [assessment]);
    const memo = this.quartileMemo.get(key);
    if (memo && memo.exp > Date.now()) {
      snap.calls[key] = memo.encoded;
      return;
    }
    try {
      const encoded = encodeValue(await load());
      this.quartileMemo.set(key, { exp: Date.now() + QUARTILE_TTL_MS, encoded });
      snap.calls[key] = encoded;
    } catch (e: any) {
      console.warn(`⚠️ snapshot ${name} алдаа:`, e?.message ?? e);
    }
  }

  /**
   * Сүүлийн snapshot-ийг core DB-ийн `report_snapshot`-д (gzip) хадгална — код бүрд нэг мөр,
   * version өсөнө. Аудит / дахин зурах / алдаа шинжлэхэд. Хүснэгт байхгүй бол (core DDL
   * хараахан ажиллаагүй) зөвхөн анхааруулна.
   */
  async save(snap: ReportSnapshot): Promise<{ version: number; bytes: number } | null> {
    const json = JSON.stringify(snap);
    const gz = gzipSync(Buffer.from(json));
    try {
      const rows = await this.dataSource.query(
        `INSERT INTO report_snapshot (code, version, data, bytes, "createdAt", "updatedAt")
         VALUES ($1, 1, $2, $3, now(), now())
         ON CONFLICT (code) DO UPDATE
           SET version = report_snapshot.version + 1, data = EXCLUDED.data,
               bytes = EXCLUDED.bytes, "updatedAt" = now()
         RETURNING version`,
        [snap.code, gz, json.length],
      );
      return { version: Number(rows?.[0]?.version ?? 1), bytes: gz.length };
    } catch (e: any) {
      console.warn('⚠️ report_snapshot хадгалж чадсангүй (core v1.3.0 DDL ажилласан эсэхийг шалга):', e?.message ?? e);
      return null;
    }
  }
}

/** Snapshot-оос result.assessment-ийг гаргах (record хийсэн result.findOne-оос). */
function decodeAssessment(snap: ReportSnapshot): number | null {
  const raw = snap.calls[callKey('result.findOne', [snap.code])];
  if (!raw || raw === '__undefined__') return null;
  try {
    const r = JSON.parse(raw);
    return r?.assessment != null ? Number(r.assessment) : null;
  } catch {
    return null;
  }
}
