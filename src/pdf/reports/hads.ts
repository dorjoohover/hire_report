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
import { AssetsService } from 'src/assets_service/assets.service';
@Injectable()
export class HADS {
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
    category?: number,
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
        undefined,
        undefined,
        true,
      );
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Оршил', marginX, doc.y)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хүн сэтгэцийн эрүүл мэндийн асуудалд өртөмтгий болох нь сэтгэл зүйн, биологийн болон нийгмийн олон хүчин зүйлээс хамаардаг. Эдгээр урьдал хүчин зүйлс нь сэтгэцийн эмгэг оношлоход хангалтгүй ч сэтгэцийн эрүүл мэндэд заналхийлэх эрсдэл хэмээн хүлээн зөвшөөрөгддөг. Монгол Улсад сэтгэцийн эрүүл мэнд, тархи мэдрэлийн сэтгэцийн үйл ажиллагааг үнэлэх бүрэн нотолгоотой, стандартчилсан илрүүлгийн арга зүй хараахан нэвтрээгүй байна. Иймд бид эрүүл хүн амд сэтгэл гутрал, түгшүүрийн шинж тэмдгийг илрүүлэх зорилгоор “Түгшүүр, сэтгэл гутралын асуулга” (HADS)-ыг орчуулан баталгаажуулах судалгаа хийлээ. HADS нь хамгийн түгээмэл сэтгэл зүйн хямралуудыг илрүүлэхэд найдвартай, хүчин төгөлдөр, хэрэглэхэд хялбар арга хэрэгсэл юм.\n\n2020 онд нийт 1094 хүнийг санамсаргүй түүврээр сонгосон бөгөөд оролцогчдын нас нь 13–75 насны хооронд, дундаж нас нь 37.7±13.7 байсан. Тэдний 60.9% нь эмэгтэйчүүд, 63.9% нь гэрлэсэн байв. Хоёр хүчин зүйлийн анхны загварын дагуу HADS-ийн нийт оноо дунджаар 13.0±5.7, түгшүүрийн дэд оноо (HADS-A) 6.8±3.6, сэтгэл гутралын дэд оноо (HADS-D) 6.0±3.1 байв. HADS-ийн нийт оноо болон дэд оноонуудын хувьд Дотоод ангиллын корреляцийн коэффициентоор (Intraclass Correlation Coefficient) гадаад найдвартай байдал өндөр гарсан (HADS-T 0.872, HADS-A 0.837, HADS-D 0.801). Хро́нбахын альфа коэффициент нь HADS-T 0.776, HADS-A 0.756, HADS-D 0.582 байсан нь нийт асуулгын хуудасны хувьд дотоод нийцтэй байдал хангалттай, харин HADS-D-ийн хувьд хязгаарлагдмал найдвартай байдлыг илтгэж байна. HADS-ийн хоёр болон гурван хүчин зүйлийн бүтэц нь баталгаажсан факторын шинжилгээгээр батлагдсан бөгөөд загварын тохироо хангалттай байсан. Эцэст нь хэлэхэд, HADS-ийн монгол хувилбар нь нийт хүн амын дунд шинжлэх ухаан болон клиникийн практикт ашиглах боломжтой, хүчин төгөлдөр ба найдвартай хэмжилтийн хэрэгсэл гэж үзэж болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);

      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
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
      const divisors = [21, 21];
      const averages = [22, 22];

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
          .text(category + ' ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(values[index]), { continued: true })
          .fillColor(colors.black)
          .text('/' + String(divisors[index]));

        const result =
          values[index] <= 7
            ? 'Хэвийн'
            : values[index] <= 14
              ? 'Дунд зэрэг'
              : 'Хүнд зэрэг / анхаарах нэн шаардлагатай';

        doc
          .font(fontBold)
          .fontSize(10)
          .fillColor(colors.black)
          .text(`${result}`, marginX, currentY, {
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
    } catch (error) {
      console.log('hads', error);
    }
  }
}
