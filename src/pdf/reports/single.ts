import { Injectable } from '@nestjs/common';
import { colors, footer, info, marginX, title10 } from 'src/pdf/formatter';
import { SinglePdf } from '../single.pdf';
import { ResultEntity, ExamEntity } from 'src/entities';
import { time } from 'src/base/constants';
import { performance } from 'perf_hooks';

@Injectable()
export class SingleTemplate {
  constructor(private single: SinglePdf) {}
  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    exam: ExamEntity,
  ) {
    const startAll = performance.now();
    try {
      console.time('title10');
      title10(doc, result.firstname, result.lastname, result.assessmentName);
      console.timeEnd('title10');

      console.time('info');
      info(
        doc,
        exam.assessment.author,
        exam.assessment.description,
        exam.assessment.measure,
        exam.assessment.usage,
      );
      console.timeEnd('info');

      console.time('draw header');
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
      console.timeEnd('draw header');

      console.log('📍 default start', new Date().toISOString());
      const startDefault = performance.now();
      await this.single.default(doc, result);
      console.log(
        `✅ default done in ${(performance.now() - startDefault).toFixed(2)} ms`,
      );

      console.time('footer 1');
      footer(doc);
      console.timeEnd('footer 1');

      console.time('addPage + title10');
      doc.addPage();
      title10(doc, result.firstname, result.lastname, result.assessmentName);
      console.timeEnd('addPage + title10');

      console.log('📍 examQuartile start', new Date().toISOString());
      const startQuartile = performance.now();
      await this.single.examQuartile(doc, result);
      console.log(
        `✅ examQuartile done in ${(performance.now() - startQuartile).toFixed(
          2,
        )} ms`,
      );

      console.time('footer 2');
      footer(doc);
      console.timeEnd('footer 2');

      console.log(
        `🎯 template нийт хугацаа: ${(performance.now() - startAll).toFixed(
          2,
        )} ms`,
      );
    } catch (error) {
      console.log('❌ single', exam?.assessment?.name, error);
    }
  }
}
