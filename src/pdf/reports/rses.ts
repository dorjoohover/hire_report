import { Injectable } from '@nestjs/common';
import { ResultEntity, ExamEntity, ResultDetailEntity } from 'src/entities';
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
import { level } from 'winston';
@Injectable()
export class RSES {
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
        // exam.assessment.usage,
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
          'Хувь хүний өөртөө хандаж буй эерэг болон сөрөг хандлагыг өөрийгөө үнэлэх үнэлэмж гэж энгийнээр тодорхойлсон байдаг. Өөрийгөө үнэлэх үнэлэмж гэдэг ойлголт нь хүн бусадтай өөрийгөө харьцуулж, бусдаас өөрийгөө илүү гэж үзэх бус, харин хүн өөрөө өөрийгөө хүндэлж, аз жаргал, баяр баяслыг мэдрэх эрхтэй гэж үзэхийг хэлнэ.\n\nСудлаач нарын тодорхойлсноор өөрийгөө үнэлэх үнэлэмж багатай хүн ирээдүйд сэтгэл гутрал, сэтгэл түгшилт болон бусад сэтгэцийн асуудалд өртөх эрсдэл илүүтэй өндөр буйг судалж тогтоожээ. Мөн түүнчлэн өөрийгөө үнэлэх үнэлэмж нь амьдралд сэтгэл ханамжтай байх, харилцааны чадвар өндөр байх, ажил дээрх сэтгэл ханамж, ажлын гүйцэтгэл өндөр байхтай холбоотой байхаас гадна сэтгэл зүйн эмчилгээний үр дүн өндөр байхад хүртэл нөлөөлдөг байна.\n\nЭнэхүү тест нь хувь хүний өөрийгөө үнэлэх үнэлэмжийг ерөнхийд нь үнэлэхээс гадна, өөрийгөө үнэлэх үнэлэмж болон өөрийн чадамж гэсэн хоёр чиглэлд нарийвчилсан үнэлгээг өгдөг.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .list(
          [
            'Өөрийн чадамж - Хувь хүний өөрийн чадвар, чадамждаа итгэх итгэл, өөрийн үр нөлөөг мэдрэх мэдрэмжийг тодорхойлно. Мөн энэ дэд бүлэгт хүн өөрийгөө зорилгодоо хүрэх, сорилт бэрхшээлийг чадварлагаар даван туулах чадвартай гэж үзэж буй ерөнхий итгэл үнэмшлийн байдлыг давхар тодорхойлно.',
            'Өөртөө таалагдах байдал  - Хувь хүний өөрийгөө хүлээн зөвшөөрөх, өөрийн үнэ цэнээ эергээр тодорхойлох зэрэг хүний өөр лүүгээ хандсан хандсан илүү эерэг сэтгэл хөдлөлтэй холбоотой байдлыг энд хэмжинэ. Энэ бүлэгт тодорхой амжилт, гүйцэтгэлээс үл хамааран, хүн өөрийгөө “хүн” гэдэг утгаараа хэрхэн хандаж буй үндсэн суурь үнэлэмжийг хамааруулж авч үзнэ.',
          ],
          doc.x + 20,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            listType: 'bullet',
          },
        )
        .moveDown(1);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Одоо таны тестийн үр дүнтэй танилцъя.', marginX, doc.y, {
          align: 'justify',
        })
        .moveDown(0.5);
      footer(doc);

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Тестийн хэрэглээ, анхаарах зүйлс',
      );
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хөгжүүлэлт: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хувь хүний өөрийгөө үнэлэх, өөртөө итгэх байдлыг судалдаг олон төрлийн онол загвар, үнэлгээний аргууд байдаг. Социологич, сэтгэл судлаач Моррис Розенбергын анх 1965 онд боловсруулж, зохиосон. Розенбергын өөрийгөө үнэлэх үнэлэмжийг тодорхойлох тест гэдэг нэрээр алдартай энэхүү сорил нь олон улсад хамгийн түгээмэл хэрэглэгддэг, сайтар судлагдсан бөгөөд энэ чиглэлд “алтан стандарт” гэж тооцогддог.\n\nRSES асуумж нь хүчин төгөлдөр оношилгооны хэрэгсэл болох нь олон улсад олон дахин батлагдсан. Тухайлбал тестийн урьдчилан таамаглах чадвар, дотоод тогтвортой байдал, найдвартай байдлын үзүүлэлт харьцангуй өндөр байдаг.\n\nСэтгэцийн Эрүүл Мэндийн Үндэсний Төв (СЭМҮТ)-ийн эмч, судлаачид Монгол хувилбарыг нь хөгжүүлж, практикт ашиглаж байна. Бид энэхүү тестийг СЭМҮТ-ийн судлаач нарын зөвшөөрөлтэйгөөр ашиглаж байгаа бөгөөд нэмэлт хөгжүүлэлтийг хийж гүйцэтгэсэн болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Тестийн оноог зөв тайлбарлах')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .strokeColor(colors.black)
        .text(
          'Таны авсан оноог бид нийт өгөгдлийн сан дахь бусад хүмүүсийн оноотой харьцуулж, эрэмбэлсэн. Нийт болон дэд бүлэг тус бүрд харгалзах тестийн оноог ойлгомжтой тайлбарлахын тулд таны авсан оноог эрэмбэ дээр суурилж “Маш бага”, “Бага”, “Дундаж”, “Их”, “Маш их” гэсэн 5-н бүлэгт хуваасан (Синклэйр, 2010). Онооны системийн дэлгэрэнгүй тайлбарыг дараах хүснэгтээс харна уу.',
          { align: 'justify' },
        )
        .moveDown(1);

      function drawScoreTable(
        doc: PDFKit.PDFDocument,
        startY: number,
        bodyRows: string[][],
      ) {
        const tableWidth = doc.page.width - 2 * marginX;

        const colWidths = [
          tableWidth * 0.2,
          tableWidth * 0.25,
          tableWidth * 0.15,
          tableWidth * 0.25,
          tableWidth * 0.15,
        ];

        const rowHeights = [18, 36, 18];

        let startX = marginX;
        let currentY = startY;
        let x = startX;

        doc
          .rect(x, currentY, colWidths[0], rowHeights[0] + rowHeights[1])
          .stroke();
        doc.font(fontBold).fontSize(12);

        let text = 'Хариултын\nангилал';
        let textHeight = doc.heightOfString(text, {
          width: colWidths[0] - 10,
          align: 'center',
        });
        doc.text(
          text,
          x + 5,
          currentY + (rowHeights[0] + rowHeights[1] - textHeight) / 2 + 1,
          {
            width: colWidths[0] - 10,
            align: 'center',
          },
        );

        x += colWidths[0];

        doc
          .rect(x, currentY, colWidths[1], rowHeights[0] + rowHeights[1])
          .stroke();
        text = 'Харьцуулсан эрэмбэ\nбуюу перцентиль*';
        textHeight = doc.heightOfString(text, {
          width: colWidths[1] - 10,
          align: 'center',
        });
        doc.text(
          text,
          x + 5,
          currentY + (rowHeights[0] + rowHeights[1] - textHeight) / 2 + 1,
          {
            width: colWidths[1] - 10,
            align: 'center',
          },
        );

        x += colWidths[1];

        doc
          .rect(
            x,
            currentY,
            colWidths[2] + colWidths[3] + colWidths[4],
            rowHeights[0],
          )
          .stroke();

        text = 'Оноо';
        textHeight = doc.heightOfString(text, {
          width: colWidths[2] + colWidths[3] + colWidths[4] - 10,
          align: 'center',
        });
        doc.text(text, x + 5, currentY + (rowHeights[0] - textHeight) / 2 + 1, {
          width: colWidths[2] + colWidths[3] + colWidths[4] - 10,
          align: 'center',
        });

        currentY += rowHeights[0];
        x = startX + colWidths[0] + colWidths[1];

        const subHeaders = ['Нийт', 'Өөртөө таалагдах байдал', 'Өөрийн чадамж'];

        for (let i = 0; i < 3; i++) {
          doc.rect(x, currentY, colWidths[i + 2], rowHeights[1]).stroke();

          textHeight = doc.heightOfString(subHeaders[i], {
            width: colWidths[i + 2] - 10,
            align: 'center',
          });

          doc.text(
            subHeaders[i],
            x + 5,
            currentY + (rowHeights[1] - textHeight) / 2 + 1,
            {
              width: colWidths[i + 2] - 10,
              align: 'center',
            },
          );

          x += colWidths[i + 2];
        }

        currentY += rowHeights[1];
        doc.font(fontNormal).fontSize(12);

        for (const row of bodyRows) {
          x = startX;

          for (let c = 0; c < row.length; c++) {
            doc.rect(x, currentY, colWidths[c], rowHeights[2]).stroke();

            textHeight = doc.heightOfString(row[c], {
              width: colWidths[c] - 10,
              align: 'center',
            });

            doc.text(
              row[c],
              x + 5,
              currentY + (rowHeights[2] - textHeight) / 2 + 1,
              {
                width: colWidths[c] - 10,
                align: 'center',
              },
            );

            x += colWidths[c];
          }

          currentY += rowHeights[2];
        }

        doc.y = currentY + 12;
      }

      drawScoreTable(doc, doc.y, [
        ['Маш бага', '1–14', '0–17', '0–9', '0–7'],
        ['Бага', '15–29', '18–20', '10', '8–9'],
        ['Дундаж', '30–70', '21–26', '11–13', '10–12'],
        ['Их', '71–85', '27–28', '14', '13–14'],
        ['Маш их', '86–100', '29–30', '15', '15'],
      ]);

      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Тестийн хэрэглээ, анхаарах зүйлс',
      );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .strokeColor(colors.black)
        .text(
          'Өөрийгөө үнэлэх үнэлэмж нь нас ахих тусам нэмэгдэх хандлагатай байдаг тул 25-аас доош насныханд өөрийгөө үнэлэх үнэлэмжийн оноо харьцангуй бага байх хандлагатайг анхаараарай. Хэрэв та 25-аас доош настай бол дараах хүснэгтийг ашиглавал илүү зохистой.',
          { align: 'justify' },
        )
        .moveDown(1);

      drawScoreTable(doc, doc.y, [
        ['Маш бага', '1–14', '0–13', '0–6', '0–4'],
        ['Бага', '15–29', '14–16', '7-8', '5–6'],
        ['Дундаж', '30–70', '17–22', '9–12', '7–11'],
        ['Их', '71–85', '23-25', '14', '12–13'],
        ['Маш их', '86–100', '26-30', '15', '14-15'],
      ]);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '* - Харьцуулсан эрэмбэ буюу перцентиль гэж юу вэ? Өгөгдлийн сан дахь бусад хүмүүсийн авсан оноонуудтай харьцуулахад таны авсан оноо хаана эрэмбэлэгдэж буйг зааж, 0-100 хооронд байр эзлүүлдэг. Жишээлбэл таны авсан оноо бусад хүмүүстэй харьцуулахад 85-д эрэмбэлэгдэж буй бол та бусад тест бөглөсөн хүмүүсийн 85%-иас нь илүү өндөр оноо авсан гэж тайлбарлагдана.\n\nЦаашид та өөрийн оноо болон бусад дэлгэрэнгүй мэдээлэлтэй танилцана уу!',
          marginX,
          doc.y,
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
        .text('Таны нийт оноо ', marginX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fontSize(16)
        .fillColor(colors.orange)
        .text(result.value.toString(), doc.x, doc.y - 3, { continued: true })
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
          continued: true,
        })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(' байна.', marginX, doc.y + 3, {
          align: 'justify',
          continued: false,
        })
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Нийт оноо' + ' ', { continued: true })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(String(result.value), { continued: true })
        .fillColor(colors.black)
        .text('/' + '30');

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.value, 30, 31, '');

      doc.image(buffer, {
        width: doc.page.width - marginX * 2,
        height: (130 / 1800) * (doc.page.width - marginX * 2),
      });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн хамгийн бага оноо нь 0, хамгийн дээд оноо нь 30 байх бөгөөд өндөр оноо авах нь өөрийгөө үнэлэх үнэлэмж өндөр байгааг илтгэнэ. Дараах графикаас та өөрийн авсан нийт оноог бусад хүмүүстэй харьцуулан дүгнэх боломжтой.',
          marginX,
          doc.y + 40,
          { align: 'justify' },
        );
      await this.single.examQuartileGraph3(
        doc,
        Number(result.value),
        'Нийт',
        'rses',
      );

      doc.x = marginX;
      doc.y -= 15;
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Тайлбар: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Графикт өмнө нь судалгаанд хамрагдаж байсан хүмүүсийн авсан өөрийгөө үнэлэх үнэлэмжийн оноог давтамжаар нь харуулсан. Та өөрийн оноог бусад хүмүүстэй харьцуулан, өөрийгөө хаана буйг эрэмбэлэн харах боломжтой.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);

      const mindsets = [
        {
          name: 'Маш бага',
          description:
            'Таны оноо нь өөрийгөө үнэлэх үнэлэмжийн ноцтой бэрхшээлийг илтгэх бөгөөд дундаж үзүүлэлтээс илт бага байна. Энэ нь их хэмжээний сөрөг стресс, сэтгэлийн хямрал болон бусад сэтгэцийн эмгэгт өртөх эмзэгтэй холбоотой байж болно.\n\nӨөрийгөө үнэлэх үнэлэмж маш бага түвшинд тодорхойлогдсон хүмүүс ихэвчлэн илт, даамжирсан хэлбэрийн өөртөө эргэлзэх байдал, өөрийн үнэ цэний талаар үргэлж санаа зовох, өөрийгөө үргэлж сөргөөр харах, үнэлэх хандлагатай байдаг. Энэ үзүүлэлт дээр маш бага оноотой хүмүүс нь хүнд хэлбэрийн сэтгэл гутрал, сэтгэл зүйн хүнд хэлбэрийн хямралтай байх магадлал өндөр. Өөрийгөө үнэлэх үнэлэмж маш бага байдал нь цаашид сэтгэл зүйн эмгэг, шинж тэмдгүүдийг улам хүндрүүлэх эрсдэлтэй.\n\nЭнэ тохиолдолд та өөрийгөө тодорхой хэмжээнд зөвөөр үнэлж сурахын тулд танин мэдэхүй, зан төрх, өөртөө хандах хандлагыг өөрчлөхөд чиглэсэн мэргэжлийн сэтгэл, сэтгэц судлалын үйлчилгээ авах нь илүү зүйтэй. ',
          image: 'rses1',
        },
        {
          name: 'Бага',
          description:
            'Таны оноо нь нийтлэг дунджаас харьцангуй бага бөгөөд өөртөө өөрийгөө үнэлэх үнэлэмжийн бага түвшнийг зааж байна. Энэхүү байдал нь сэтгэл зүйн хувьд танд тодорхой сөрөг нөлөө үзүүлж болзошгүй.\n\nӨөрийгөө үнэлэх үнэлэмж нь бага түвшинд тодорхойлогдсон хүмүүс ихэвчлэн өөрийгөө үргэлж шүүмжлэх, өөрийн давуу тал, үнэ цэнээ хэвийн байдлаас доогуур тодорхойлох хандлагатай бөгөөд алдаа дутагдалд эмзэг ханддаг, үгүйсгэсэн мэдрэмжийг хүчтэй мэдэрдэг. Энэ үзүүлэлт дээр бага оноотой хүмүүс нь сэтгэл гутрал, сэтгэл түгшилтийн төрлийн сэтгэл зүйн хямралтай байх магадлал өндөр бөгөөд ямар нэгэн арга хэмжээ авахгүй бол аливааг сөргөөр харах сэтгэлгээ нь нөхцөл байдлыг цаашид улам даамжруулах эрсдэлтэй. Та магадгүй өөрийгөө бусадтай үргэлж харьцуулж, сөргөөр үнэлдэг, алдаа гаргах, бүтэлгүйтэхээс айдаг тул өөрийгөө сорьсон даалгавар, бэрхшээлтэй нүүр тулахаас зайлсхийдэг, эсвэл бусдаас үргэлж баталгаа, дэмжлэг авахыг эрмэлздэг байж болох юм. \n\nЭнэ тохиолдолд таныг өөрийгөө илүү зөвөөр үнэлж сургах, өөрийгөө үгүйсгэсэн дадал зуршлыг засах зорилгоор таны сөрөг сэтгэлгээ, итгэл үнэмшил рүү чиглэсэн танин мэдэхүй, зан төрхийн сэтгэл, сэтгэц судлалын мэргэжлийн үйлчилгээ авч болох юм.',
          image: 'rses2',
        },
        {
          name: 'Дунд',
          description:
            'Таны оноо нь хүмүүсийн нийтлэг дунджийг зааж байна. Өөрийгөө үнэлэх үнэлэмжийн дундаж түвшин нь сэтгэл зүйн хувьд ямар нэгэн ноцтой эмгэг, зовуурьгүй, хэвийн байдлыг илтгэнэ.\n\nЭнэ хүрээнд оноо авсан хүмүүс өөрийгөө хэт их шүүмжлэх эсвэл өөрийгөө хэт өндрөөр үнэлэлгүйгээр, өөртөө харьцангуй тэнцвэртэй ханддаг. Өөрийн үнэ цэнэтэй холбоотой асуудалд харьцангуй сэтгэлийн хаттай ханддаг, сэтгэл хөдлөлөө удирдан зохицуулалтыг чадвар харьцангуй сайн байдаг. \n\nЭнэ тохиолдолд тодорхой чиглэлд та өөрөө өөртөө илүү итгэлтэй болох зорилгоор сэтгэл, сэтгэц судлалын мэргэжлийн үйлчилгээ авч болно. Өөрийгөө үнэлэх үнэлэмжийн өндөр оноотой хүмүүс сэтгэл засал, сэтгэцийн эрүүл мэндийн тусламж үйлчилгээ авах хүсэл, оролцоо харьцангуй өндөр байдаг сайн талтай.',
          image: 'rses3',
        },
        {
          name: 'Их',
          description:
            'Таны авсан оноо нь нийтлэг дунджаас харьцангуй өндөр буюу ойролцоогоор нийт асуумж бөглөсөн 3 хүн тутмын 2-оос их байсан бөгөөд өөрийгөө үнэлэх үнэлэмжийн их түвшнийг зааж байна.\n\nӨөрийгөө үнэлэх үнэлэмж нь их түвшинд тодорхойлогдсон хүмүүс ихэвчлэн өөрийгөө харьцангуй эерэг, өөдрөг талаас харж, үнэлдэг, өөрийгөө хүлээн зөвшөөрөх, өөрийн ур чадвартаа итгэх байдал харьцангуй өндөртэй, сорилт, бэрхшээлд тууштай ханддаг. Өөрийгөө үнэлэх үнэлэмжийн өндөр оноо нь сэтгэл зүй, сэтгэцийн эрүүл мэндийн хувьд харьцангуй сайн сайхан байдлыг илтгэдэг. \n\nГэхдээ хэт өндөр оноо нь нөгөө талаасаа мөн нарциссизм буюу өөрийгөө хэт үнэлэх, хэт өргөмжлөх шинж, зан төрхийг илтгэж харуулж байж магадгүй юм. Тиймээс цаашид энэхүү хэт өндөр оноо нь хэвийн өөрийгөө үнэлэх үнэлэмжийн байдал эсвэл нарциссизм хэлбэрийн хэв шинжийн аль нь болохыг ялган салгахын тулд нэмэлт үнэлгээ шаардлагатай байж болно. Энэ тохиолдолд таныг “Хар гурвал (Dark triad)” тест эсвэл “Нарциссист зан төлөвийн тест”-ийг бөглөхийг зөвлөж байна.',
          image: 'rses4',
        },
        {
          name: 'Маш их',
          description:
            'Таны авсан оноо нь өөрийгөө үнэлэх үнэлэмжийн маш өндөр түвшин буюу та өөрийгөө үнэмлэхүй эерэг, өөдрөг талаас үнэлж буйг илтгэж байна. Өөрийгөө үнэлэх үнэлэмжийн өндөр оноо нь ерөнхийдөө сэтгэл зүй, сэтгэцийн эрүүл мэндийн хувьд харьцангуй сайн сайхан байдал, өөртөө итгэлтэй, эерэг байдлыг илэрхийлнэ.\n\nГэхдээ мөн нөгөө талаар хэт өндөр оноо нь өөрийгөө бодитоор бус, хэт өндрөөр үнэлж буй байдал, эсвэл өөрийн алдаа дутагдлыг хүлээн зөвшөөрөх дургүй зан төрх, нуугдмал айдас, хамгаалах хариу урвалыг зааж харуулж байж болох юм.\n\nТиймээс цаашид энэхүү хэт өндөр оноо нь хэвийн өрийгөө үнэлэх үнэлэмжийн байдал эсвэл өөрийгөө хэт үнэлэх, хэт өргөмжлөх нарциссизм хэв шинжийн аль нь болохыг ялган салгахын тулд нэмэлт үнэлгээ шаардлагатай байж болно. Энэ тохиолдолд таныг “Хар гурвал (Dark triad)” тест эсвэл “Нарциссист зан төлөвийн тест”-ийг бөглөхийг зөвлөж байна.',
          image: 'rses5',
        },
      ];
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        `Сорилын үр дүн: ${result.result}`,
      );

      const mindset = mindsets.find((m) => m.name === result.result);

      if (mindset) {
        const imageWidth = 180;
        const imageHeight = 225;
        const gap = 20;

        const startX = marginX;
        const startY = doc.y;

        doc.image(service.getAsset(`icons/${mindset.image}`), startX, startY, {
          width: imageWidth,
          height: imageHeight,
        });

        const textX = startX + imageWidth + gap;
        const rightWidth = doc.page.width - textX - marginX;

        const fullText = mindset.description;

        doc.font(fontNormal).fontSize(12).fillColor(colors.black);

        let words = fullText.split(' ');
        let visible = '';
        let remaining = '';

        for (let i = 0; i < words.length; i++) {
          const test = visible ? visible + ' ' + words[i] : words[i];
          const h = doc.heightOfString(test, { width: rightWidth });

          if (h > imageHeight) {
            remaining = words.slice(i).join(' ');
            break;
          }

          visible = test;
        }

        doc.text(visible, textX, startY, {
          width: rightWidth,
          align: 'justify',
        });

        if (remaining.trim()) {
          doc.y = startY + imageHeight + 12;

          doc.text(remaining, marginX, doc.y, {
            width: doc.page.width - marginX * 2,
            align: 'justify',
          });
        } else {
          doc.y = startY + imageHeight + 12;
        }
      }

      footer(doc);
      const details: ResultDetailEntity[] = result.details;

      const uneleh = details.find((d) => d.value === 'Өөртөө таалагдах байдал');

      const chadamj = details.find((d) => d.value === 'Өөрийн чадамж');

      doc.addPage();

      header(doc, firstname, lastname, service, 'Өөртөө таалагдах байдал');
      if (uneleh) {
        let levelLabel = '';
        if (Number(uneleh.cause) <= 9) {
          levelLabel = 'Маш бага';
        } else if (Number(uneleh.cause) <= 10) {
          levelLabel = 'Бага';
        } else if (Number(uneleh.cause) <= 13) {
          levelLabel = 'Дундаж';
        } else if (Number(uneleh.cause) <= 14) {
          levelLabel = 'Их';
        } else {
          levelLabel = 'Маш их';
        }

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Таны өөртөө таалагдах байдал бүлэгт харгалзах оноо ',
            marginX,
            doc.y,
            {
              align: 'justify',
              continued: true,
            },
          )
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(uneleh.cause.toString(), doc.x, doc.y - 3, {
            continued: true,
          })
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
          .text(levelLabel.toUpperCase(), doc.x, doc.y - 3, {
            continued: true,
          })
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(' байна.', marginX, doc.y + 3, {
            align: 'justify',
            continued: false,
          })
          .moveDown(1);

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Нийт оноо' + ' ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(uneleh.cause), { continued: true })
          .fillColor(colors.black)
          .text('/' + '15');

        doc.moveDown(-0.8);

        const buffer2 = await this.vis.bar(uneleh.cause, 15, 16, '');

        doc.image(buffer2, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        });
        doc.y += 15;

        await this.single.examQuartileGraph3(
          doc,
          Number(uneleh.cause),
          'Өөрийн үнэлгээ',
          'rses',
        );

        doc.x = marginX;
        doc.y -= 15;
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Өөртөө таалагдах байдал	дэд бүлэгт өөрийгөө хүлээн зөвшөөрөх, өөртөө хандах хандлагыг авч үзнэ. Хэрвээ энэ дэд бүлэгт бага оноо авсан бол өөртөө хэт хатуу хандах, өөрийгөө хэт ихээр шүүмжлэх, өөрийгөө үнэ цэнэгүй гэж үзэх, өөрийн давуу, эерэг талуудаа үгүйсгэх эсвэл хүлээн зөвшөөрөхөд бэрхшээлтэй байх хандлагатай.\n\nТест бөглөх үед хамгийн бага оноо авсан асуулт нь таны өөрийгөө үнэлэх үнэлэмжид хамгийн ихээр сөргөөр нөлөөлж буй, цаашид анхаарвал зохистой чиглэлийг заана. Өөртөө таалагдах байдал дэд бүлгийн асуултууд:',
            { align: 'justify' },
          )
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .list(
            [
              'Би ерөнхийдөө өөртөө сэтгэл хангалуун байна.',
              'Заримдаа би өөрийгөө тус нэмэргүй хүн гэж боддог.',
              'Заримдаа эргэлзээгүйгээр би ямар ч хэрэггүй юм шиг санагддаг.',
              'Би өөрөө өөрийгөө илүү их хүндэлдэг болоосой гэж хүсдэг.',
              'Би өөрөө өөртөө эерэг, өөдрөгөөр ханддаг.',
            ],
            doc.x + 20,
            doc.y,
            {
              align: 'justify',
              bulletRadius: 1.5,
              columnGap: 8,
              listType: 'bullet',
            },
          )
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Энэ дэд бүлгийн оноо бага тохиолдолд өөрийгөө үгүйсгэж буй бодол, сөрөг сэтгэлгээний цаад учир шалтгааныг тодорхойлох, өөрийгөө зөвөөр үнэлж сурах, өөрийгөө шүүмжилсэн дотоод харилцан яриаг өөрчлөхөд чиглэсэн мэргэжлийн сэтгэл, сэтгэц судлалын үйлчилгээ авч болох юм.',
            marginX,
            doc.y,
            { align: 'justify' },
          )
          .moveDown(0.5);
      }

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Өөрийн чадамж');
      if (chadamj) {
        let levelLabel = '';
        if (Number(chadamj.cause) <= 7) {
          levelLabel = 'Маш бага';
        } else if (Number(chadamj.cause) <= 9) {
          levelLabel = 'Бага';
        } else if (Number(chadamj.cause) <= 12) {
          levelLabel = 'Дундаж';
        } else if (Number(chadamj.cause) <= 14) {
          levelLabel = 'Их';
        } else {
          levelLabel = 'Маш их';
        }

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Таны өөрийн чадамж бүлэгт харгалзах оноо ', marginX, doc.y, {
            align: 'justify',
            continued: true,
          })
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(chadamj.cause.toString(), doc.x, doc.y - 3, {
            continued: true,
          })
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
          .text(levelLabel.toUpperCase(), doc.x, doc.y - 3, {
            continued: true,
          })
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(' байна.', marginX, doc.y + 3, {
            align: 'justify',
            continued: false,
          })
          .moveDown(1);

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Нийт оноо' + ' ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(chadamj.cause), { continued: true })
          .fillColor(colors.black)
          .text('/' + '15');

        doc.moveDown(-0.8);

        const buffer2 = await this.vis.bar(chadamj.cause, 15, 16, '');

        doc.image(buffer2, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        });
        doc.y += 15;

        await this.single.examQuartileGraph3(
          doc,
          Number(chadamj.cause),
          'Өөрийн чадамж',
          'rses',
        );

        doc.x = marginX;
        doc.y -= 15;
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Өөрийн чадамж дэд бүлэгт өрийн чадвар, чадамждаа итгэх итгэл, хандлагыг ерөнхийд нь авч үзнэ. Хэрвээ энэ дэд бүлэгт бага оноо авсан бол өөрийн ур чадвараа зөвөөр үнэлэх, өөрийгөө үнэлэх үнэлэмж талаас тодорхой асуудал буйг илтгэнэ. Цаашлаад өөрийн ур чадварт эргэлзэх, сорилт, бэрхшээлтэй нүүр тулахаас бэрхшээх, зорилго зорилтдоо хүрэх хангалттай итгэл үнэмшилгүй байх хандлагатай.\n\nТест бөглөх үед хамгийн бага оноо авсан асуулт нь та өөрийн ур чадвар, чадамжийг зөвөөр үнэлэхэд нөлөөлж буй, цаашид анхаарвал зохистой гол чиглэлийг зааж харуулна. Өөрийн чадамжийн дэд бүлгийн асуултууд:',
            { align: 'justify' },
          )
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .list(
            [
              'Надад олон сайхан чанарууд бий гэж үздэг.',
              'Би бусад хүмүүсийн л адил аливаа зүйлийг хийх чадвартай.',
              'Надад бахархаад байх зүйл төдийлөн байхгүй санагддаг.',
              'Би өөрийгөө үнэ цэнэтэй хүн гэж мэдэрдэг.',
              'Ерөнхийдөө би өөрийгөө бүтэлгүйтсэн хүн гэж үзэх хандлагатай байдаг.',
            ],
            doc.x + 20,
            doc.y,
            {
              align: 'justify',
              bulletRadius: 1.5,
              columnGap: 8,
              listType: 'bullet',
            },
          )
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Энэхүү дэд бүлгийн оноо бага тохиолдолд өөрийн ур чадвар, чадамжийг зөвөөр үнэлэх, өөрийн үнэ цэнэ, давуу талаа тодорхойлох эсвэл шинээр бий болгоход чиглэсэн мэргэжлийн сэтгэл, сэтгэц судлалын үйлчилгээ авч болох юм.',
            marginX,
            doc.y,
            { align: 'justify' },
          )
          .moveDown(0.5);
      }

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт мэдээлэл');

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хувь хүний хэв шинжтэй холбогдох байдал. ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хувь хүний хэв шинж, зан төрхийн талаас авч үзвэл, дотогшоо чиглэсэн хэв шинжтэй (интроверт) хүмүүстэй харьцуулахад гадагшаа чиглэсэн (экстроверт) хэв шинжтэй хүмүүсийн дунд өөрийгөө үнэлэх үнэлэмжийн илүү өндөртэй тодорхойдогддог. Харин эсрэгээрээ өөрийгөө үнэлэх үнэлэмж багатай хүмүүс илүүтэй сэтгэлийн тогтворгүй байдал (Невротизм) бүхий хэв шинжтэй байх магадлал харьцангуй өндөр байдаг байна.*',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Байгууллага, ажлын байран дээрх хэрэглээ. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '“Өөрийгөө үнэлэх хувь хүний үндсэн шинж” нь хүний далд ухамсартай, суурь итгэл үнэмшилтэй холбоотой, цаг хугацааны хувьд төдийлөн өөрчлөгддөггүй, хувь хүнд харьцангуй тогтвортой илэрдэг чухал ойлголт юм. Өөрийгөө үнэлэх хувь хүний үндсэн шинжийг ашиглан ажлын байран дээрх сэтгэл ханамж, ажлын гүйцэтгэл, өндөр бүтээмжтэй байдал зэргийг урьдчилан таамаглах боломжтой байдаг, байгууллага, ажил олгогч талаас чухалчлан авч үздэг шинж юм.\n\nӨөрийгөө үнэлэх хувь хүний үндсэн шинжийг бүрдүүлэгч 4-н гол шинжийн нэг нь өөрийгөө үнэлэх үнэлэмж юм. Үүнээс гадна өөртөө итгэх итгэл, сэтгэлийн тогтвортой байдал буюу невротизм, хяналтын төлөв (locus of control) нь энэхүү үндсэн шинж дотор багтдаг.**',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Эмнэл зүй, сэтгэл засал, сэтгэц судлалын салбар дах хэрэглээ. ',
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Эмч, сэтгэл засалч нар энэхүү тестийг эмчилгээний хүрээнд олон аргаар ашиглах боломжтой. Тухайлбал, тестийг скрининг болон урьдчилан сэргийлэх арга байдлаар хэрэглэж өрийгөө үнэлэх үнэлэмж багатай хүмүүсийн дунд цаашид эдгээр хүмүүсийн дунд сэтгэл гутрал, сэтгэл түгшил зэрэг сэтгэл зүйн асуудал, бэрхшээлтэй хүмүүсийг илрүүлж болно.\n\nҮүнээс гадна, өөрийгөө үнэлэх үнэлэмжийг засаж сайжруулахад чиглэсэн сэтгэл заслын тусламж үйлчилгээнд хэрэглэнэ. Мөн төрөл бүрийн сэтгэл болон сэтгэцийн эрүүл мэндийн асуудалтай хүмүүст тусламж үйлчилгээний үр дүн, үйл явцыг хянах арга байдлаар хэрэглэж болдог чухал ач холбогдолтой үнэлгээний арга юм. RSES тестийн хувьд үнэлгээ хоорондын утгын зөрөө нь 3 болон түүнээс их оноотой үед мэдэгдэхүйц өөрчлөлт гарсан байна гэж үздэг.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Харьцуулах судалгааны үр дүн. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Зарим судалгаагаар өөрийгөө үнэлэх үнэлэмжийн дундаж оноо 22.62 (±5.8), өөрийн чадамжийн дундаж 12.01 (±2.82), өөрийгөө үнэлэх үнэлэмжийн дундаж 10.62 (±3.35), бүлэг хоорондын зөрүү 1.39 (±2.15) байсан байна (Синклэйр, 2010).\n\n* - Хэрвээ та өөрийн хувь хүний хэв шинжээ мэдэхийг хүсвэл цаашид “Үндсэн 5-н хувь хүний хэв шинжийн (Big 5) тест”-ийг бөглөхийг санал болгож байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);

      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт мэдээлэл');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '** - Хэрвээ та өөрийгөө үнэлэхтэй холбоотой хувь хүний үндсэн шинжээ мэдэхийг хүсвэл цаашид “Өөртөө итгэх итгэлийг үнэлэх тест”, “Үндсэн 5-н хувь хүний хэв шинжийн (Big 5) тест”, “Хяналтыг өөр дээрээ авсан байдлыг тодорхойлох тест (Locus of control)”-үүдийг бөглөхийг санал болгож байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.black)
        .text('Cэтгэцийн Эрүүл Мэндийн Төвийн мэдээллийн утас: 1800-2000')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Монгол улсын хэмжээнд олон жилийн туршлагатай мэргэжлийн эмч нар, сэтгэцийн эрүүл мэндийн чиглэлээр 24 цагийн турш зөвлөгөө, мэдээллийг 1800-2000 утсаар дамжуулан энгийн тарифаар, дараах чиглэлүүдээр өгч байна:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Нойргүйдэл',
            'Сэтгэл түгшилт',
            'Айдас',
            'Сэтгэл гутрал',
            'Уур бухимдал',
            'Мэдрэл сульдал',
            'Дэлгэцийн донтолт',
            'Архи, тамхи, мансууруулах бодисын хэрэглээтэй холбоотой асуудал',
            'Жирэмсэн үеийн сэтгэл зүйн өөрчлөлт',
            'Төрсний дараах сэтгэлзүйн хямрал, сэтгэл гутрал',
            'Гэмтлийн дараах /хүчтэй стресс/ сэтгэл зүйн хямрал',
            'Ахимаг насны үеийн сэтгэцийн тулгамдсан асуудал',
            'Хүүхдийн сэтгэцийн тулгамдсан асуудал.',
          ],
          doc.x + 20,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            listType: 'bullet',
          },
        )
        .moveDown(1);
      doc.x = marginX;
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.black)
        .text('Эх сурвалж, ашигласан материал')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Rosenberg, M. (1965). Rosenberg self-esteem scale (RSE). Acceptance and commitment therapy. Measures Package, 61(52), 18.\n\nSinclair, S. J., Blais, M. A., Gansler, D. A., Sandberg, E., Bistis, K., & LoCicero, A. (2010). Psychometric properties of the Rosenberg Self-Esteem Scale: Overall and across demographic groups living within the United States. Evaluation & the Health Professions, 33(1), 56-80. https://doi.org/10.1177/0163278709356187',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('rses', error);
    }
  }
}
