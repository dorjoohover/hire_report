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
import { SinglePdf } from '../single.pdf';
import { VisualizationService } from '../visualization.service';
@Injectable()
export class Whoqol {
  constructor(private vis: VisualizationService) {}

  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    header(doc, firstname, lastname);
    title(doc, result.assessmentName);
    info(
      doc,
      exam.assessment.author,
      exam.assessment.description,
      exam.assessment.measure,
      exam.assessment.usage,
      true,
    );

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
      .text(
        'Амьдралын чанарыг үнэлэх асуумж нь Биеийн эрүүл мэнд, Сэтгэл зүйн байдал, Нийгмийн харилцаа, Хүрээлэн буй орчны нөлөөлөл гэсэн 4 домайнаас бүрддэг. Тестийн дүнг тооцоолохдоо тухайн домайн дотроо асуултуудын дунджийг бодож, дараа нь 0-100 эсвэл 4-20 онооны шкал руу хөрвүүлдэг. Таны үр дүн:',
        { align: 'justify' },
      )
      .moveDown(1);

    const categories = result.details.map((detail) => detail.value);

    const values = result.details.map((detail) => Number(detail.cause));
    const divisors = [100, 100, 100, 100];
    const averages = [101, 101, 101, 101];

    for (let index = 0; index < categories.length; index++) {
      const category = categories[index];

      if (index > 0) {
        doc.moveDown(3.2);
      }

      const currentY = doc.y;

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(category + ': ', { continued: true })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(String(values[index]), { continued: false });

      const result =
        values[index] <= 39
          ? 'Маш бага / муу чанар'
          : values[index] <= 59
            ? 'Дунд түвшин'
            : values[index] <= 79
              ? 'Сайн чанар'
              : 'Маш сайн, өндөр чанар';

      doc
        .font(fontBold)
        .fontSize(10)
        .fillColor(colors.black)
        .text(result, marginX, currentY, {
          width: doc.page.width - marginX * 2,
          align: 'right',
        });

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
    doc.addPage();
    header(doc, firstname, lastname, 'Судалгааны үр дүн');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Монгол Улсад нийт хүн амын амьдралын чанарын (QOL) талаарх мэдээлэл өнөөг хүртэл байхгүй байсан. Иймд энэ судалгаагаар Дэлхийн Эрүүл Мэндийн Байгууллагын Амьдралын Чанарын товчилсон хувилбар (WHOQOL-BREF)-ын үндсэн үзүүлэлтийг Монголын нийт хүн амын дунд тогтоохыг зорьсон.\n\nЭнэхүү үндэсний хэмжээний, хүн амд суурилсан, огтлолын судалгаа нь 2020 онд Монгол орны 48 түүвэр авах төвд хийгдсэн. Судалгаанд WHOQOL-BREF болон Эмнэлгийн Түгшүүр, Сэтгэл гутралын асуулгын хуудас (HADS)-ыг ашиглаж, эдгээр үзүүлэлтүүдийн амин үзүүлэлтүүд, биеийн хэмжилтүүд, амьдралын хэв маягийн хүчин зүйлүүдтэй хэрхэн хамааралтай болохыг үнэлсэн.\n\nСудалгаанд нийт 714 хүн (261 эрэгтэй, 453 эмэгтэй) оролцсон бөгөөд оролцогчдын дундаж нас нь 40.7 (±13.2) байв. WHOQOL-BREF-ийн дэд оноонуудын дундаж нь дараах байдалтай байлаа: биеийн эрүүл мэнд – 61.5, сэтгэлзүйн эрүүл мэнд – 73.5, нийгмийн харилцаа – 70.1, орчны эрүүл мэнд – 67.2. Оролцогчдын 16.9% нь амьдралын чанар муутай гэж ангилагдсан.\n\nХотын орон сууцанд амьдардаг, HADS-ийн оноо өндөртэй хүмүүсийн амьдралын чанар харьцангуй бага байсан. WHOQOL-BREF-ийн бүх салбарууд түгшүүрийн оноотой (r = -0.353 – -0.206, p < 0.001) болон сэтгэл гутралын оноотой (r = -0.335 – -0.156, p < 0.001) урвуу хамааралтай байв.\n\nБиеийн эрүүл мэнд нь оршин суугаа газар, түгшүүр, сэтгэл гутралаар тодорхойлогдож байв (R^2 = 0.200, p < 0.001); сэтгэлзүйн эрүүл мэнд түгшүүр ба сэтгэл гутралаар (R^2 = 0.203, p < 0.001); нийгмийн харилцаа оршин суугаа газар, насны бүлэг, түгшүүр, сэтгэл гутралаар (R^2 = 0.116, p < 0.001); орчны эрүүл мэнд хөдөлмөр эрхлэлт, түгшүүр, сэтгэл гутралаар (R^2 = 0.117, p < 0.001) хамаарч байв.\n\nЭнэ нь Монголын нийт хүн амын амьдралын чанарын суурь үзүүлэлтийг тогтоосон анхны судалгаа бөгөөд Монголчуудын биеийн эрүүл мэндийн оноо олон улсын дундажтай харьцуулахад доогуур байна. Ялангуяа сэтгэцийн эрүүл мэндийн асуудалтай, хотын бүсэд амьдардаг хүмүүсийн амьдралын чанар муу байгааг энэхүү судалгаа харуулж байна.',
        { align: 'justify' },
      )
      .moveDown(1);
    footer(doc);
  }
}
