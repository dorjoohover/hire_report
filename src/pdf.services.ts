import { Injectable } from '@nestjs/common';

import * as PDFDocument from 'pdfkit';
import { fontBold, fontNormal, home, marginX, marginY } from './pdf/formatter';
import { ReportType, time } from 'src/base/constants';
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
  PSI,
  CFS,
  BOS,
  Whoqol,
  MBTI,
  Disagreement,
  Burnout,
  HADS,
  Office,
  Bigfive,
} from 'src/pdf/reports/index';
import { ExamEntity, ResultEntity } from './entities';
import { UserAnswerDao } from './daos/index.dao';
import { AssetsService } from './assets_service/assets.service';
const fs = require('fs');
const path = require('path');

@Injectable()
export class PdfService {
  private readonly fontCache: Record<string, Buffer>;
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
    private psi: PSI,
    private cfs: CFS,
    private bos: BOS,
    private whoqol: Whoqol,
    private mbti: MBTI,
    private disagreement: Disagreement,
    private burnout: Burnout,
    private hads: HADS,
    private office: Office,
    private bigfive: Bigfive,
    private singleTemplate: SingleTemplate,
    private userAnswer: UserAnswerDao,
    private assetService: AssetsService,
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
  }

  async createDefaultPdf(
    lastname: string,
    firstname: string,
    title: string,
    code: number,
  ): Promise<PDFKit.PDFDocument> {
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

    home(doc, this.assetService, lastname, firstname, title, code);
    doc.addPage();
    return doc;
  }

  async createPdfInOneFile(
    result: ResultEntity,
    exam: ExamEntity,
    code: number,
  ) {
    const firstname = result?.firstname ?? '';
    const lastname = result?.lastname ?? '';

    const doc = await this.createDefaultPdf(
      result?.lastname ?? '',
      result?.firstname ?? '',
      result?.assessmentName,
      result?.code ?? code,
    );

    try {
      const date = new Date(exam.userStartDate);
      if (exam.assessment.report == ReportType.CORRECT)
        await this.singleTemplate.template(
          doc,
          this.assetService,
          result,
          exam,
        );
      if (exam.assessment.report == ReportType.SETGEL)
        await this.setgel.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.EMPATHY)
        await this.empathy.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.DARKTRIAD)
        await this.darktriad.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.HOLLAND)
        await this.holland.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.GRIT)
        await this.grit.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.ETHIC)
        await this.ethic.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.INAPPROPRIATE)
        await this.inappropriate.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.PSI)
        await this.psi.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.CFS)
        await this.cfs.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.BOS)
        await this.bos.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.WHOQOL)
        await this.whoqol.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.MBTI)
        await this.mbti.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.DISAGREEMENT)
        await this.disagreement.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.BURNOUT)
        await this.burnout.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.HADS)
        await this.hads.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.OFFICE)
        await this.office.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.BIGFIVE)
        await this.bigfive.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam,
        );
      if (exam.assessment.report == ReportType.DISC) {
        await this.disc.report(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam.code,
          exam.assessment,
          this.userAnswer,
        );
      }

      if (exam.assessment.report == ReportType.BELBIN) {
        await this.belbin.template(
          doc,
          this.assetService,
          result,
          date,
          firstname,
          lastname,
          exam.assessment,
        );
      }

      if (exam.assessment.report == ReportType.GENOS) {
        await this.genos.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam.assessment,
        );
      }

      if (exam.assessment.report == ReportType.NARC) {
        await this.narc.template(
          doc,
          this.assetService,
          result,
          firstname,
          lastname,
          exam.assessment,
        );
      }
      console.log('pdf end', time());
      return doc;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to generate PDF');
    }
  }
}
