import { Injectable } from '@nestjs/common';
import { colors, footer, info, marginX, title10 } from 'src/pdf/formatter';
import { SinglePdf } from '../single.pdf';
import { ResultEntity, ExamEntity } from 'src/entities';
import { time } from 'src/base/constants';

@Injectable()
export class SingleTemplate {
  constructor(private single: SinglePdf) {}
  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    exam: ExamEntity,
  ) {
    try {
      title10(doc, result.firstname, result.lastname, result.assessmentName);
      info(
        doc,
        exam.assessment.author,
        exam.assessment.description,
        exam.assessment.measure,
        exam.assessment.usage,
      );

      doc
        .font('fontBold')
        .fontSize(16)
        .fillColor(colors.orange)
        .text('Үр дүн', marginX, doc.y + 10);
      doc
        .moveTo(40, doc.y + 2)
        .strokeColor(colors.orange)
        .lineTo(100, doc.y + 2)
        .stroke()
        .moveDown();

      doc.y;
      console.log('default', time());
      await this.single.default(doc, result);
      footer(doc);
      doc.addPage();
      title10(doc, result.firstname, result.lastname, result.assessmentName);

      console.log('examQuartile', time());
      await this.single.examQuartile(doc, result);

      footer(doc);
    } catch (error) {
      console.log('single', exam?.assessment?.name, error);
    }
  }
}
