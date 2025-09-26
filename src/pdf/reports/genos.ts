import { Injectable } from '@nestjs/common';
import { color } from 'echarts';
import { AssessmentEntity, ResultEntity } from 'src/entities';
import {
  assetPath,
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
export class Genos {
  constructor(
    private vis: VisualizationService,
    private single: SinglePdf,
  ) {}

  template = async (
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    assessment: AssessmentEntity,
  ) => {
    header(doc, firstname, lastname);
    title(doc, result.assessmentName);
    info(
      doc,
      assessment.author,
      assessment.description,
      assessment.measure,
      assessment.usage,
    );
    doc
      .font('fontBlack')
      .fontSize(16)
      .fillColor('#F36421')
      .text('Тайланг хэрхэн ашиглах вэ?', marginX, doc.y);

    doc
      .moveTo(marginX, doc.y + 2)
      .strokeColor('#F36421')
      .lineTo(marginX + 70, doc.y + 2)
      .stroke()
      .moveDown();

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Энэхүү сэтгэл хөдлөлөө удирдах чадварын үнэлгээний тайлан нь таны үнэлгээний үр дүнд суурилсан болно. Энэ тайлангаас та дараах зүйлсүүдийг мэдэх боломжтой. Үүнд:',
        { align: 'justify' },
      )
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          'Үнэлгээний үр дүнд тодорхойлогдсон таны давуу талууд',
          'Үнэлгээний үр дүнд тодорхойлогдсон таны хөгжүүлэх шаардлагтай чадварууд',
        ],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);

    doc.font(fontBold).fontSize(13).text('Зөвлөмж').moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Энэхүү тайлантай танилцсаны дараа сэтгэл хөдлөлөө удирдах чадвараа хөгжүүлэх гарын авлагатай ажиллаарай.\n\nСэтгэл хөдлөлөө удирдах чадварын үр дүнтэй танилцахдаа 7 бүрдэл чадвар тус бүртэй танилцаарай. Чадвар тус бүр нь өмнөх чадвар дээрээ суурилсан байдаг тул дарааллыг алдагдуулахгүй танилцахыг хүсье. Энэхүү үнэлгээний  сайн, муу, зөв, буруу хариулт гэж үгүй болохыг анхаарна уу.',
        { align: 'justify' },
      )
      .moveDown(1);

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Сэтгэл хөдлөлөө удирдах чадварын тухай');

    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.black)
      .text('Ажлын байр ба сэтгэл хөдлөл')
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Сэтгэл хөдлөл нь шийдвэр гаргалт болон байгууллагын стратегид өдөр тутам нөлөөлж байдаг. Та дараах зүйлсийг өөрөөсөө асуугаарай.',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          '“Нэг л биш байна” гэдэг мэдрэмж хэн нэгнийг ажилд авахгүй байх шалтгаан болж байсан уу?',
          'Даргын тань сэтгэл санаа таагүй үед та илүү ямар нэгэн зүйлийг асууж, нэхэж байсан уу?',
          'Уцаарласан харилцагчтай учраа олохдоо олон төрлийн аргуудыг хэрэглэж байсан уу?',
          'Гүйцэтгэл тааруу байгаа багийн гишүүнээ хэрхэн идэвхжүүлэх вэ?',
        ],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .text('Сэтгэл хөдлөл нь ажил дээрх зан төлөвт нөлөөлдөг', marginX)
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Ажил дээрх сэтгэл хөдлөл тань дараах зүйлсээр дамжин бусадтай харилцахад нөлөөлдөг.',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        ['Дууны өнгө ', 'Биеийн хэлэмж', 'Нүүрний хувирал'],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .text('Хэмжигдэхүйц өөрчлөлтүүд', marginX)
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Сэтгэл хөдлөлөө удирдах чадвар нь ажил дээр дараах зүйлсэд нөлөөлдөг.',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          'Бүтээмж болон гүйцэтгэл',
          'Хүмүүс хоорондын харилцааны үр ашигтай байдал',
          'Манлайллын чадвар',
          'Борлуулалтын гүйцэтгэл',
          'Багийн ажиллагаа',
          'Харилцагчийн үйлчилгээ',
          'Ажлын сэтгэл ханамж',
        ],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.black)
      .text('Сэтгэл хөдлөлөө удирдах чадвараа нэмэгдүүлснээр', marginX)
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          'Өөрийн болон бусдын сэтгэл хөдлөлийг таних, ойлгох боломжууд нэмэгдэнэ',
          'Сэтгэлийн хөдөлгөөнөө илэрхийлэхдээ илүү ухаалаг болно',
          'Шийдвэр гаргалт тань бодит мэдээлэл дээр суурилаж, тэнцвэртэй тулхтай болно',
          'Ажил дээрх бүтээмж болон гүйцэтгэл тань сайжирна.',
        ],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);
    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Сэтгэл хөдлөлөө удирдах чадварын тухай');

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Энэхүү тайлан нь сэтгэл хөдлөлөө удирдах чадвараа хөгжүүлэх чухал анхны алхам юм. Та өөрийн сэтгэл хөдлөлийн чадварыг танин барьснаар хөгжүүлэх боломжтой болдог. Мөн уг тайлангаар сэтгэл хөдлөлийн давуу тал болон боломжуудыг жагсаан гаргадаг. ',
        { align: 'justify' },
      )
      .moveDown(1);

    doc
      .font(fontBold)
      .fontSize(13)
      .text('Genos сэтгэл хөдлөлөө удирдах чадварын загвар')
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Genos-ийн сэтгэл хөдлөлөө удирдах чадварын загвар нь дараах ялгаатай 7 чадваруудыг багтаадаг. Үүнд:',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc.image(assetPath(`icons/genos`), marginX, doc.y, {
      width: doc.page.width - marginX * 2,
    });
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          'Өөрийн сэтгэл хөдлөлийг таньж мэдэх',
          'Сэтгэл хөдлөлөө илэрхийлэх',
          'Бусдын сэтгэл хөдлөлийг таньж мэдэх',
          'Сэтгэл хөдлөлийн эргэцүүлэл',
          'Өөрийн сэтгэл хөдлөлийг удирдах',
          'Бусдын сэтгэл хөдлөлийг удирдах',
          'Өөрийн сэтгэл хөдлөлийг хянах',
        ],
        marginX,
        doc.y + 335,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Судалгааны үр дүнг ойлгох нь');
    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.black)
      .text('Юу хэмжигддэг вэ?')
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Genos сэтгэл хөдлөлөө удирдах чадварын үнэлгээ нь таны төрөлх сэтгэл хөдлөлийн чадварыг хэмждэггүй. Харин таны ажил дээрээ хир их давтамжтайгаар сэтгэл хөдлөлийн чадвараа илэрхийлдгийг хэмждэг.  Энэ нь ажлын байран дээр таны гаднаасаа харагдаж буй байдал болон зан төлөвүүд таны гүйцэтгэлд хамгийн их нөлөөтэй байдагтай холбоотой.',
        { align: 'justify' },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .text('Оноо нь ямар учиртай вэ?')
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Таны зан төлөвүүд жишиг нормын дагуу 7 чадвар тус бүр дээр 1-ээс 99-ийн хооронд оноогоор үнэлэгддэг. Энэ нь таны цэвэр оноо бус жишээ хүмүүсийн оноотой харьцуулсан гаргасан оноо юм.\n\nЖишээ нь: Хэрэв тодорхой нэг чадвар дээр таны оноо 60 байсан гэвэл энэ нь нийтлэг хүмүүсийн 50%-иас таны цэвэр оноо өндөр байна гэж тайлбарлагдаж болох юм.\n\nҮүнээс гадна тестийн оноог ойлгомжтой тайлбарлахын тулд таны оноог нийтлэг хүмүүсийн оноотой харьцуулж “Доогуур”, “Харьцангуй доогуур”, “Хэвийн хэмжээнд”, “Харьцангуй дээгүүр”, “Дээгүүр” гэсэн 5 бүлэгт хуваасан. Хялбаршуулсан онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу!',
        { align: 'justify' },
      )
      .moveDown(1);

    const tableData = [
      [
        '',
        'Доогуур',
        'Харьцангуй доогуур',
        'Хэвийн хэмжээнд',
        'Харьцангуй дээгүүр',
        'Дээгүүр',
      ],
      ['Авсан оноо', '0-18', '19-26', '27-34', '35-42', '43-50'],
      ['Хувь (~)', '0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
    ];

    const tableWidth = doc.page.width - 2 * marginX;
    const colWidth = tableWidth / 6;

    let startX = marginX;
    let startY = doc.y;

    for (let row = 0; row < tableData.length; row++) {
      const currentRowHeight = row === 0 ? 36 : 18;

      for (let col = 0; col < tableData[row].length; col++) {
        const x = startX + col * colWidth;
        const y = startY;

        doc
          .rect(x, y, colWidth, currentRowHeight)
          .strokeColor(colors.black)
          .stroke();

        doc
          .font(row === 0 ? fontBold : fontNormal)
          .fontSize(12)
          .fillColor('black')
          .text(tableData[row][col], x + 5, y + 4, {
            width: colWidth - 10,
            align: 'center',
          });
      }

      startY += currentRowHeight;
    }

    doc
      .moveDown(1)
      .font(fontBold)
      .fontSize(13)
      .text('Давуу тал болон хөгжүүлэх боломжууд', marginX)
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Сэтгэл хөдлөлөө удирдах чадвар бүр нь дараах зүйлүүдийг агуулж байна. ',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          '3 давуу тал – Хамгийн өндөр оноотой зан төлөвүүд',
          '3 хөгжүүлэх боломжтой чадварууд – таны хамгийн муу оноотой чадварууд',
        ],
        marginX,
        doc.y,
        {
          align: 'justify',
          bulletRadius: 1.5,
          columnGap: 8,
        },
      )
      .moveDown(1);

    footer(doc);
    doc.addPage();
    header(
      doc,
      firstname,
      lastname,
      'Таны сэтгэл хөдлөлөө удирдах чадварын үр дүн',
    );
    await this.single.examQuartileGraph2(doc, result, 'Machiavellianism');
  };
}
