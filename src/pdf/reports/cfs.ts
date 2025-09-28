import { Injectable } from '@nestjs/common';
import { ResultEntity, ExamEntity } from 'src/entities';
import {
  colors,
  fontBold,
  fontNormal,
  footer,
  header,
  info,
  lh,
  marginX,
  title,
} from 'src/pdf/formatter';
import { VisualizationService } from '../visualization.service';
import { SinglePdf } from '../single.pdf';
@Injectable()
export class CFS {
  constructor(
    private vis: VisualizationService,
    private single: SinglePdf,
  ) {}

  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    try {
      header(doc, firstname, lastname);
      title(doc, result.assessmentName);
      info(doc, exam.assessment.author, exam.assessment.description);
      doc
        .font('fontBold')
        .fontSize(16)
        .fillColor(colors.orange)
        .text('Үр дүн', marginX, doc.y);
      doc
        .moveTo(40, doc.y + 2)
        .strokeColor(colors.orange)
        .lineTo(100, doc.y + 2)
        .stroke()
        .moveDown();

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны оноо ', marginX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fontSize(16)
        .fillColor(colors.orange)
        .text(result.point.toString(), doc.x, doc.y - 3, { continued: true })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(' буюу ', marginX, doc.y + 3, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fontSize(16)
        .fillColor(colors.orange)
        .text(result.result.toString().toUpperCase(), doc.x, doc.y - 3, {
          continued: false,
        });

      await this.single.examQuartileGraph(doc, result);

      doc.x = marginX;

      const categories = result.details.map((detail) => detail.value);

      const values = result.details.map((detail) => Number(detail.cause));
      const divisors = [24, 18];
      const averages = [25, 19];

      for (let index = 0; index < categories.length; index++) {
        const category = categories[index];

        if (index > 0) {
          doc.moveDown(3.2);
        }

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(category + ' ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(values[index]), { continued: true })
          .fillColor(colors.black)
          .text('/' + String(divisors[index]));

        doc.moveDown(-0.8);

        const buffer = await this.vis.bar(
          values[index],
          divisors[index],
          averages[index],
          '',
        );

        doc.image(buffer, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        });
      }

      footer(doc);
    } catch (error) {
      console.log('cfs', error);
    }
  }
}
