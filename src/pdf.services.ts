import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import * as PDFDocument from 'pdfkit';
import { fontBold, fontNormal, home, marginX, marginY } from './pdf/formatter';
import { REPORT_STATUS, ReportType, time } from 'src/base/constants';
import {
  DISC,
  Belbin,
  Genos,
  Narc,
  Empathy,
  Setgel,
  SingleTemplate,
  Darktriad,
  Holland,
  Grit,
  Ethic,
  Inappropriate,
  Worklifebalance,
  Workstress,
  Setgeltugshilt,
  Mindset,
  Pregnant,
  RSES,
  Nicotine,
  Alcohol,
  GSE,
  RSI,
  Who5,
  PSI,
  CFS,
  BOS,
  Whoqol,
  MBTI,
  Disagreement,
  Burnout,
  HADS,
  SEMUT,
  Office,
  Bigfive,
} from 'src/pdf/reports/index';
import { ExamEntity, ResultEntity } from './entities';
import { ExamDao, ResultDao, UserAnswerDao, PdfTemplateDao, AssessmentDao } from './daos/index.dao';
import { AssetsService } from './assets_service/assets.service';
import { Job } from 'bullmq';
import { AppProcessor } from './app.processer';
import { DynamicTemplateRenderer } from './pdf/dynamic-template.renderer';
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Context passed to every template handler
// ─────────────────────────────────────────────────────────────────────────────
interface PdfContext {
  result: ResultEntity;
  exam: ExamEntity;
  firstname: string;
  lastname: string;
  date: Date;
}

// Handler type — each report type implements this signature
type TemplateHandler = (
  doc: PDFKit.PDFDocument,
  ctx: PdfContext,
) => Promise<void>;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PdfService {
  private readonly fontCache: Record<string, Buffer>;

  // ── Report handler map — add new report types here ────────────────────────
  // Key   : ReportType value (number)
  // Value : async (doc, ctx) => ...  — call the matching template class
  //
  // Signature variants:
  //   Standard  : .template(doc, assets, result, firstname, lastname, exam)
  //   CORRECT   : .template(doc, assets, result, exam)
  //   DISC      : .report(doc, assets, result, fn, ln, code, assessment, answers)
  //   BELBIN    : .template(doc, assets, result, date, fn, ln, assessment)
  //   GENOS/NARC: .template(doc, assets, result, fn, ln, assessment)  ← exam.assessment
  //   SEMUT     : .template(doc, assets, result, exam, results)       ← extra DB call
  // ─────────────────────────────────────────────────────────────────────────
  private readonly handlerMap: Map<number, TemplateHandler>;

  constructor(
    private disc: DISC,
    private genos: Genos,
    private narc: Narc,
    private belbin: Belbin,
    private empathy: Empathy,
    private setgel: Setgel,
    private darktriad: Darktriad,
    private holland: Holland,
    private grit: Grit,
    private ethic: Ethic,
    private inappropriate: Inappropriate,
    private worklifebalance: Worklifebalance,
    private workstress: Workstress,
    private setgeltugshilt: Setgeltugshilt,
    private mindset: Mindset,
    private pregnant: Pregnant,
    private rses: RSES,
    private nicotine: Nicotine,
    private alcohol: Alcohol,
    private gse: GSE,
    private rsi: RSI,
    private who5: Who5,
    private psi: PSI,
    private cfs: CFS,
    private bos: BOS,
    private whoqol: Whoqol,
    private mbti: MBTI,
    private disagreement: Disagreement,
    private burnout: Burnout,
    private hads: HADS,
    private semut: SEMUT,
    private office: Office,
    private bigfive: Bigfive,
    private singleTemplate: SingleTemplate,
    private userAnswer: UserAnswerDao,
    private assetService: AssetsService,
    private resultDao: ResultDao,
    private examDao: ExamDao,
    private pdfTemplateDao: PdfTemplateDao,
    private assessmentDao: AssessmentDao,
    private dynamicRenderer: DynamicTemplateRenderer,
    @Inject(forwardRef(() => AppProcessor)) private processor: AppProcessor,
  ) {
    this.fontCache = {
      normal: fs.readFileSync(
        path.join(process.cwd(), 'src/assets/fonts/Gilroy-Medium.ttf'),
      ),
      medium: fs.readFileSync(
        path.join(process.cwd(), 'src/assets/fonts/Gilroy-Bold.ttf'),
      ),
      bold: fs.readFileSync(
        path.join(process.cwd(), 'src/assets/fonts/Gilroy-ExtraBold.ttf'),
      ),
      black: fs.readFileSync(
        path.join(process.cwd(), 'src/assets/fonts/Gilroy-Black.ttf'),
      ),
    };

    // ── Handler map — to add a new report type:
    //    1. Import the template class above
    //    2. Inject it in the constructor
    //    3. Add one entry here: [ReportType.NEW_TYPE, async (doc, ctx) => ...]
    this.handlerMap = new Map<number, TemplateHandler>([

      // Standard signature: (doc, assets, result, firstname, lastname, exam)
      [ReportType.SETGEL,         async (doc, { result, exam, firstname, lastname }) =>
        this.setgel.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.EMPATHY,        async (doc, { result, exam, firstname, lastname }) =>
        this.empathy.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.DARKTRIAD,      async (doc, { result, exam, firstname, lastname }) =>
        this.darktriad.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.HOLLAND,        async (doc, { result, exam, firstname, lastname }) =>
        this.holland.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.GRIT,           async (doc, { result, exam, firstname, lastname }) =>
        this.grit.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.ETHIC,          async (doc, { result, exam, firstname, lastname }) =>
        this.ethic.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.INAPPROPRIATE,  async (doc, { result, exam, firstname, lastname }) =>
        this.inappropriate.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.WORKLIFEBALANCE, async (doc, { result, exam, firstname, lastname }) =>
        this.worklifebalance.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.WORKSTRESS,     async (doc, { result, exam, firstname, lastname }) =>
        this.workstress.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.SETGELTUGSHILT, async (doc, { result, exam, firstname, lastname }) =>
        this.setgeltugshilt.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.MINDSET,        async (doc, { result, exam, firstname, lastname }) =>
        this.mindset.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.PREGNANT,       async (doc, { result, exam, firstname, lastname }) =>
        this.pregnant.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.RSES,           async (doc, { result, exam, firstname, lastname }) =>
        this.rses.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.NICOTINE,       async (doc, { result, exam, firstname, lastname }) =>
        this.nicotine.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.ALCOHOL,        async (doc, { result, exam, firstname, lastname }) =>
        this.alcohol.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.GSE,            async (doc, { result, exam, firstname, lastname }) =>
        this.gse.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.RSI,            async (doc, { result, exam, firstname, lastname }) =>
        this.rsi.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.WHO5,           async (doc, { result, exam, firstname, lastname }) =>
        this.who5.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.PSI,            async (doc, { result, exam, firstname, lastname }) =>
        this.psi.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.CFS,            async (doc, { result, exam, firstname, lastname }) =>
        this.cfs.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.BOS,            async (doc, { result, exam, firstname, lastname }) =>
        this.bos.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.WHOQOL,         async (doc, { result, exam, firstname, lastname }) =>
        this.whoqol.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.MBTI,           async (doc, { result, exam, firstname, lastname }) =>
        this.mbti.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.DISAGREEMENT,   async (doc, { result, exam, firstname, lastname }) =>
        this.disagreement.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.BURNOUT,        async (doc, { result, exam, firstname, lastname }) =>
        this.burnout.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.HADS,           async (doc, { result, exam, firstname, lastname }) =>
        this.hads.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.OFFICE,         async (doc, { result, exam, firstname, lastname }) =>
        this.office.template(doc, this.assetService, result, firstname, lastname, exam)],

      [ReportType.BIGFIVE,        async (doc, { result, exam, firstname, lastname }) =>
        this.bigfive.template(doc, this.assetService, result, firstname, lastname, exam)],

      // ── Non-standard signatures ─────────────────────────────────────────

      // CORRECT: no firstname/lastname passed
      [ReportType.CORRECT,        async (doc, { result, exam }) =>
        this.singleTemplate.template(doc, this.assetService, result, exam)],

      // DISC: calls .report() + extra params (exam.code, exam.assessment, userAnswer)
      [ReportType.DISC,           async (doc, { result, exam, firstname, lastname }) =>
        this.disc.report(
          doc, this.assetService, result,
          firstname, lastname,
          exam.code, exam.assessment,
          this.userAnswer,
        )],

      // BELBIN: extra `date` param, uses exam.assessment (not exam)
      [ReportType.BELBIN,         async (doc, { result, exam, firstname, lastname, date }) =>
        this.belbin.template(
          doc, this.assetService, result,
          date, firstname, lastname,
          exam.assessment,
        )],

      // GENOS: uses exam.assessment instead of exam
      [ReportType.GENOS,          async (doc, { result, exam, firstname, lastname }) =>
        this.genos.template(doc, this.assetService, result, firstname, lastname, exam.assessment)],

      // NARC: uses exam.assessment instead of exam
      [ReportType.NARC,           async (doc, { result, exam, firstname, lastname }) =>
        this.narc.template(doc, this.assetService, result, firstname, lastname, exam.assessment)],

      // SEMUT: needs extra DB call to fetch child results
      [ReportType.SEMUT,          async (doc, { result, exam }) => {
        const results = await this.resultDao.findChild(exam.code);
        await this.semut.template(doc, this.assetService, result, exam, results);
      }],
    ]);
  }

  // Font бүртгэл + А4 margin-той хоосон PDFDocument — cover page (home())
  // өөрөө оруулахгүй. createDefaultPdf() болон dynamic template renderer
  // хоёулаа үүнийг ашиглана (cover-ыг хэн хэзээ зурахаа өөрсдөө шийднэ).
  private createBaseDoc(): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      margins: {
        left: marginX,
        right: marginX,
        top: marginY,
        bottom: marginY - 10,
      },
      size: 'A4',
    });

    doc.registerFont(fontNormal, this.fontCache.normal);
    doc.registerFont('fontNormal', this.fontCache.normal);
    doc.registerFont('fontMedium', this.fontCache.medium);
    doc.registerFont(fontBold, this.fontCache.bold);
    doc.registerFont('fontBold', this.fontCache.bold);
    doc.registerFont('fontBlack', this.fontCache.black);
    return doc;
  }

  async createDefaultPdf(
    lastname: string,
    firstname: string,
    title: string,
    code: string,
  ): Promise<PDFKit.PDFDocument> {
    const doc = this.createBaseDoc();
    home(doc, this.assetService, lastname, firstname, title, code);
    doc.addPage();
    return doc;
  }

  // Studio-ийн "PDF-ээр урьдчилан харах" товч — жинхэнэ exam/result шаардахгүй,
  // demo дата ашиглан дурын (хадгалагдаагүй ч байж болно) template-ийг шууд
  // PDF болгож зурна. template.assessmentId тавигдсан бол ТЭР ЖИНХЭНЭ
  // assessment-ээс нэр/зохиогч/тайлбар зэргийг татаж {{assessment.*}}
  // placeholder-үүдэд ашиглана (⚠ template.name — studio-ийн дотоод
  // загварын нэр — ЭНД ХЭРЭГЛЭХГҮЙ, assessment.name-тэй андуурч болохгүй).
  // Ангилал тус бүрийн оноо шаарддаг блокууд (score-section/category-list/
  // radar_chart/bar_chart) энд хоосон гарна — жинхэнэ userAnswer түүхгүй тул.
  //
  // examCode (заавал биш) — АЛЬ ХЭДИЙН ӨГСӨН (дуусгасан) бодит тестийн код.
  // Заасан бол demo дата ашиглахгүй, харин createPdfInOneFile-тэй яг ижил
  // байдлаар exam/result-ыг бодитоор ачаалж (result.value/result.result гэх
  // мэт ЖИНХЭНЭ утгаараа) preview зурна — гэхдээ template нь ХАДГАЛАГДААГҮЙ ч
  // canvas дээрх хувилбар байж болно (жинхэнэ generate-ийн active template
  // шаардлагагүй, зөвхөн "preview" — DB-д юу ч бичихгүй).
  async createPreviewPdf(template: any, examCode?: string): Promise<PDFKit.PDFDocument> {
    if (examCode) {
      const exam = await this.examDao.findByCode(examCode).catch(() => null);
      if (!exam) {
        throw new HttpException(
          `Тест олдсонгүй: "${examCode}"`,
          HttpStatus.NOT_FOUND,
        );
      }
      const result = await this.resultDao.findOne(examCode).catch(() => null);
      const doc = this.createBaseDoc();
      await this.dynamicRenderer.render(
        doc,
        template,
        {
          result,
          exam,
          firstname: exam.firstname ?? '',
          lastname: exam.lastname ?? '',
        },
        this.assetService,
      );
      return doc;
    }

    const assessment = template?.assessmentId
      ? await this.assessmentDao.findOne(template.assessmentId).catch(() => null)
      : null;

    const assessmentName = assessment?.name || 'Манлайлалын чадвар үнэлгээ';
    const author = assessment?.author || 'Д.Батбаяр, Ph.D';
    const description =
      assessment?.description ||
      'Энэхүү үнэлгээ нь ажилтны манлайлалын чадвар, шийдвэр гаргах ур чадвар болон хамт олонтой ажиллах чадварыг хэмжинэ.';
    const measure =
      assessment?.measure ||
      'Манлайлал, шийдвэр гаргах, харилцааны ур чадвар зэрэг үзүүлэлтүүдийг хэмжинэ.';
    const usage =
      assessment?.usage ||
      'Ажилтан сонгон шалгаруулалт, карьерийн хөгжлийн үнэлгээ, манлайллын хөгжилд ашиглана.';

    const demoExam: any = {
      code: 'DEMO-PREVIEW',
      firstname: 'Болд',
      lastname: 'Батбаяр',
      email: 'demo@hire.mn',
      assessmentName,
      userStartDate: new Date(),
      userEndDate: new Date(),
      assessment: {
        id: assessment?.id ?? template?.assessmentId ?? 0,
        author,
        description,
        measure,
        usage,
      },
    };
    const demoResult: any = {
      code: 'DEMO-PREVIEW',
      // Бодит userAnswer-тэй давхцахгүй утга — score-section/category-list/
      // radar_chart/bar_chart зэрэг ангиллын дата хайх блокууд аюулгүйгээр
      // хоосон буцна (partialCalculator-т тохирох мөр олдохгүй тул).
      type: -1,
      assessment: assessment?.id ?? template?.assessmentId ?? 0,
      assessmentName,
      total: 100,
      point: 76,
      duration: 90,
      // {{result.value}}/{{result.valueLabel}}/{{result.resultCode}}/
      // {{result.styleLabel}} token-уудыг (DISC-шиг ангилал тодорхойлдог
      // тест) preview дээр ч харуулахын тулд demo утга — жинхэнэ generate
      // хийхэд бодит result.value/result-ээр солигдоно.
      value: 'Creative',
      result: 'd',
    };

    const doc = this.createBaseDoc();
    await this.dynamicRenderer.render(
      doc,
      template,
      { result: demoResult, exam: demoExam, firstname: demoExam.firstname, lastname: demoExam.lastname },
      this.assetService,
    );
    return doc;
  }

  async createPdfInOneFile(code: string, job?: Job) {
    const exam = await this.examDao.findByCode(code);
    const result = await this.resultDao.findOne(code);

    if (job) {
      await this.processor.updateProgress({
        id: job.id,
        progress: 60,
        code,
        status: REPORT_STATUS.CALCULATING,
      });
    }

    const firstname = exam?.firstname ?? '';
    const lastname = exam?.lastname ?? '';
    const date = new Date(exam.userStartDate);

    // ── Studio-гоос идэвхжүүлсэн (isActive) загвар байгаа эсэхийг шалгана.
    // Байвал ТЭР ЧИГТ нь ашиглана — render дундаа алдаа гарсан ч хуучин руу
    // буцахгүй, алдаагаа шууд шидэнэ (санаатай: template идэвхжсэн бол
    // үр дүнг чимээгүйгээр хуучин загвараар орлуулахгүй, асуудлыг нуухгүй).
    // Зөвхөн энэ assessment дээр огт идэвхтэй template ТОХИРУУЛААГҮЙ үед л
    // хуучин (hardcoded) renderer ашиглагдана.
    const assessmentId = exam?.assessment?.id;
    const activeTemplate = assessmentId
      ? await this.pdfTemplateDao.findActiveByAssessment(assessmentId)
      : null;

    if (activeTemplate?.pages?.length) {
      const dynamicDoc = this.createBaseDoc();
      await this.dynamicRenderer.render(
        dynamicDoc,
        activeTemplate,
        { result, exam, firstname, lastname },
        this.assetService,
      );
      console.log(
        `[PdfService] Rendered via studio template #${activeTemplate.id} (assessment ${assessmentId})`,
      );
      return dynamicDoc;
    }

    // ── Legacy (hardcoded) renderer — зөвхөн идэвхтэй template ТОХИРУУЛААГҮЙ
    // assessment-д ашиглагдана. Бусад талаараа өөрчлөгдөөгүй.
    const doc = await this.createDefaultPdf(
      lastname,
      firstname,
      exam?.assessmentName,
      exam?.code ?? code,
    );

    const reportType: number = exam.assessment.report;
    const handler = this.handlerMap.get(reportType);

    if (!handler) {
      console.warn(`[PdfService] No handler registered for ReportType ${reportType}`);
      return doc;
    }

    try {
      const ctx: PdfContext = { result, exam, firstname, lastname, date };
      await handler(doc, ctx);
      console.log('pdf end', time());
      return doc;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to generate PDF');
    }
  }
}
