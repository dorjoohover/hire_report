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
import { AssetsService } from 'src/assets_service/assets.service';
@Injectable()
export class BOS {
  constructor(
    private vis: VisualizationService,
    private single: SinglePdf,
  ) {}

  async template(
    doc: PDFKit.PDFDocument,
    service: AssetsService,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    try {
      header(doc, firstname, lastname, service);
      title(doc, service, result.assessmentName);
      info(
        doc,
        service,
        exam.assessment.author,
        exam.assessment.description,
        exam.assessment.measure,
      );
      doc.font(fontBold).fontSize(13).text('Судалгааны үр дүн').moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сэтгэл зүйн хямрал нь бие махбодын шинж тэмдгээр илэрдэг тохиолдолд илүү төвөгтэй байдаг. Сэтгэцийн эмгэгийг илрүүлэх уламжлалт үнэлгээний хэрэгслүүд нь ихэвчлэн сэтгэл хөдлөлийн үг хэллэг ашигладаг тул эдгээр нь хүмүүст тохиромжгүй байж болно.\n\nИймээс клиникийн оношгүй боловч сэтгэл зүйн болон бие махбодын шинж тэмдгийг зэрэг тодорхойлох боломжтой шинэ үзлэгийн хэрэгслийг боловсруулан гаргасан.\n\nСудалгаагаар тархины хэт ачааллын түвшинг хэмжиж, үүнийг сэтгэл зүйн хямралын шинжүүдээр тайлбарлах боломжтой 10 асуулттай өөрийгөө үнэлэх шинэ хэмжүүрийг (BOS-10) боловсруулан, түүний хүчин төгөлдөр, найдвартай байдлыг үнэлэн гаргасан.\n\nТухайлбал Монгол Улсын 64 түүврийн төвөөс 16–65 насны нийт 739 насанд хүрэгчдийг санамсаргүй байдлаар сонгон оролцуулж, хүн амд суурилсан огтлолын судалгаа хийсэн. Дотоод нийцтэй байдлыг McDonald’s ω коэффициентоор, харин туршилт-давтан үнэлгээний (test-retest) найдвартай байдлыг Intraclass Correlation Coefficient (ICC)-ээр үнэлсэн. Бүтцийн болон нийцлийн хүчин төгөлдөр байдлыг гол бүрэлдэхүүн хэсгийн шинжилгээ (PCA) болон баталгаажсан хүчин зүйлийн шинжилгээ (CFA)-ээр шалгасан. Эмнэлгийн түгшүүр, сэтгэл гутралын асуулгын хуудас (HADS), ДЭМБ-ын амьдралын чанарын товчилсон хувилбар (WHOQOL-BREF)-ыг шалгуур хүчин төгөлдөр байдлыг үнэлэхэд ашигласан.\n\nСудалгаанд оролцогчдын 70.9% нь эмэгтэй, 22% нь бакалаврын болон түүнээс дээш боловсролтой, 38.8% нь ажил эрхэлдэг, 66% нь гэр бүлтэй байв. BOS-10-ийн McDonald’s ω коэффициент 0.861 байсан нь дотоод нийцтэй байдал маш сайн байгааг харуулсан. Давтан үнэлгээний ICC нь 0.75 гарсан нь гадаад найдвартай байдал дунд зэргийн түвшинд байгааг илтгэсэн.',
          { align: 'justify' },
        );
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'PCA болон CFA-гийн үр дүнгээр BOS-10 нь гурван хүчин зүйлээс (хэт их бодол, хэт мэдрэг байдал, тайван бус авир) бүрдсэн бүтэцтэй бөгөөд загварын тохироо маш сайн гарсан (RMSEA = 0.033, TLI = 0.984, CFI = 0.989, χ² = 58, p = 0.003).\n\nШкалын бүх асуултууд нь өөрсдийн харьяалагдах дэд бүлэгтэй илүү өндөр хамааралтай байсан ба бүлгүүдийн хоорондын хамаарал 0.547–0.615-ийн хооронд байсан. BOS-10 нь HADS-тэй эерэг, харин WHOQOL-BREF-тэй сөрөг хамааралтай байв.',
          { align: 'justify' },
        )
        .moveDown(1);
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
      const divisors = [15, 15, 20];
      const averages = [16, 16, 21];

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
      console.log('bos', error);
    }
  }
}
