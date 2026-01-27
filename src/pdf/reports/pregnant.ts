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
export class Pregnant {
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
        undefined,
        undefined,
        undefined,
        true,
      );
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text(
          'Жирэмсний болон төрсний дараах үеийн сэтгэл гутрал гэж юу вэ?',
          marginX,
          doc.y,
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Жирэмсэн болон төрсний дараах үедээ байгаа эмэгтэйчүүдэд тохиолддог сэтгэл гутрах төрлийн эмгэгийг хэлэх бөгөөд дараах шинж тэмдгүүдээр илэрдэг. Үүнд, өдрийн ихэнх цагт:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .list(
          [
            'уйтгарлан гуних',
            'итгэл найдвараа алдсан мэдрэмж төрөх',
            'аливаа зүйлд сонирхолгүй болох',
            'ядарч сульдах',
            'нойрмоглох',
            'хооллох байдал нь өөрчлөгдөх',
            'уурлаж уцаарлах',
            'аз жаргалыг мэдэрч чадахгүй байх зэрэг шинж тэмдэгүүд орно.',
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
        .text(
          'Олон улсын судалгаанууд дурдсанаар нийт жирэмсэн эхчүүдийн 10-15% нь буюу ойролцоогоор 7 жирэмсэн эмэгтэй тутмын нэг нь ямар нэг хэмжээгээр сэтгэл гутралд өртдөг ажээ. Монгол улсын хувьд СЭМҮТ (Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв)-өөс 2022 онд хийсэн судалгаагаар 5-аас 6 эмэгтэй тутмын нэг нь (жирэмсэн үеийн сэтгэл гутрал 15.9%, төрсний дараах сэтгэл гутрал 20.3%) энэхүү эмгэгт өртөж байгааг тогтоосон байдаг.\n\nОдоо таны сорилын үр дүнтэй танилцъя.',
          marginX,
          doc.y,
          { align: 'justify' },
        )
        .moveDown(0.5);
      footer(doc);

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Сорилын хэрэглээ, анхаарах зүйлс',
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
          'Жирэмсний болон төрсний дараах үеийн сэтгэл гутралыг илрүүлэх олон төрлийн онол загвар, тестүүд байдаг. Эдинбургийн сорил гэдэг нэрээр алдартай энэхүү сорил нь олон улсад түгээмэл хэрэглэгддэг, сайтар судлагдсан. Энэхүү тестийн анхны загвар, аргачлалыг Ж.Л. Кокс ба Ж.М. Холден Р. Саговски нарын судлаачид хөгжүүлсэн бөгөөд Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв (СЭМҮТ)-ийн эмч, судлаачид Монгол хувилбарыг нь хөгжүүлэн, олон жилийн туршид практикт ашигласаар ирсэн байдаг. Бид энэхүү тестийг СЭМҮТ-ийн судлаач нарын зөвшөөрөлтэйгөөр ашиглаж байгаа бөгөөд нэмэлт хөгжүүлэлтийг хийж гүйцэтгэсэн болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу.\n\nЭнэхүү тест нь таны таны өнгөрсөн долоо хоногийн болон одоогийн сэтгэл зүйн байдлыг үнэлж байгаа тул шаардлагатай тохиолдол бүрд дахин бөглөөрэй.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Сорилын оноог зөв тайлбарлах')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн оноог тооцохдоо асуулт тус бүр дээрх харгалзах оноог хооронд нь нэмж, нэгдсэн үр дүнг  тайлагнана. Тестийн үр дүнг тайлбарлахдаа дараах ангиллын системийг ашиглана. Тухайлбал: Хэрэв та тест бөглөөд 15 оноо авсан бол энэ нь "Сэтгэл гутралтай байх магадлал өндөр” түвшнийг зааж байгаа юм. Онооны системийн дэлгэрэнгүй тайлбарыг дараах хүснэгтээс харна уу.',
          { align: 'justify' },
        )
        .moveDown(1);
      const tableData = [
        ['Нийт оноо', 'Ангилал*'],
        [
          '9 болон түүнээс доош оноо',
          'Хэвийн буюу сэтгэл гутралтай байх магадлал бага',
        ],
        ['10–аас 12 оноо', 'Сэтгэл гутралтай байх магадлал харьцангуй өндөр'],
        ['13 болон түүнээс дээш оноо', 'Сэтгэл гутралтай байх магадлал өндөр'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [tableWidth * 0.3, tableWidth * 0.7];
      const rowHeights = [18, 36, 18, 36];

      let startX = marginX;
      let currentY = doc.y;

      for (let row = 0; row < tableData.length; row++) {
        let x = startX;
        const rowHeight = rowHeights[row];

        for (let col = 0; col < tableData[row].length; col++) {
          const colWidth = colWidths[col];
          const text = tableData[row][col];

          doc
            .rect(x, currentY, colWidth, rowHeight)
            .strokeColor('black')
            .stroke();

          doc
            .font(row === 0 ? fontBold : fontNormal)
            .fontSize(12)
            .fillColor('black');

          const textHeight = doc.heightOfString(text, {
            width: colWidth - 10,
            align: 'center',
          });

          const textY = currentY + (rowHeight - textHeight) / 2;

          doc.text(text, x + 5, textY + 2, {
            width: colWidth - 10,
            align: 'center',
          });

          x += colWidth;
        }

        currentY += rowHeight;
      }

      doc.y = currentY + 12;

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '*Үүнээс гадна, хэрэв 10 дахь асуултад 1-ээс дээш оноо авсан бол "цаашид нэмэлт үнэлгээ, мэргэжлийн тусламж үйлчилгээ авах шаардлагатай".',
          marginX,
          doc.y,
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Таны жирэмсэн болон төрсний дараах үеийн сэтгэл гутралын түвшин ',
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
        .text(result.value, doc.x, doc.y - 3, { continued: true })
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

      const categories = ['Нийт оноо', '10 дахь асуултын оноо'];

      const values = [
        Number(result.value),
        Number(result.details?.[1]?.cause ?? 0),
      ];
      const divisors = [30, 3];
      const averages = [31, 4];

      for (let index = 0; index < categories.length; index++) {
        const category = categories[index];

        if (index > 0) {
          doc.moveDown(3.2);
        }

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(category + ': ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(values[index]), { continued: true })
          .fillColor(colors.black)
          .text('/' + divisors[index]);

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
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэрэв та сорилын 10 дахь асуулт буюу "Надад өөрийгөө гэмтээх тухай бодол төрч байсан" гэсэн асуултанд 1-ээс дээш оноо авсан бол  та өөрийн болон хүүхдийнхээ аюулгүй байдлыг хангах үүднээс, сэтгэл гутралын түвшнийг үл харгалзан, заавал мэргэжлийн тусламж, үйлчилгээ хугацаа алдалгүй аваарай.\n\nСорилын тусламжтай зөвхөн таны өнгөрсөн долоо хоногийн сэтгэл зүйн байдлыг үнэлж байгаа тул шаардлагатай тохиолдол бүрд дахин  бөглөөрэй.',
          marginX,
          doc.y + 45,
          { align: 'justify' },
        )
        .moveDown(1);

      let levelLabel = '';
      let caseTitle = '';

      if (Number(result.value) <= 9) {
        levelLabel = 'Хэвийн буюу сэтгэл гутралтай байх магадлал бага';
        caseTitle =
          'Сэтгэл гутралын зарим шинж тэмдгүүд богино хугацаанд үргэлжилдэг. Энэхүү байдал нь гэр эсвэл ажил дээрээ өдөр тутмын амьдралаа хэвийн үргэлжлүүлэхэд бараг саад учруулдаггүй. Гэвч эдгээр шинж тэмдгүүд 1–2 долоо хоногоос дээш хугацаанд үргэлжилбэл тусламж авах шаардлагатай.';
      } else if (Number(result.value) <= 12) {
        levelLabel = 'Сэтгэл гутралтай байх магадлал харьцангуй өндөр';
        caseTitle =
          'Сэтгэл гутралын шинж тэмдгүүд нь таагүй мэдрэмж төрүүлэхүйц байна. Хоёр долоо хоногийн дараа энэхүү сорилыг дахин бөглөж, өөрийгөө тогтмол хянах хэрэгтэй. 10-аас дээш оноотой үед хөнгөн эсвэл хүнд хэлбэрийн сэтгэл гутралтай байж болзошгүй. Хэрэв дахин бөглөхөд 12-оос дээш оноо авбал мэргэжлийн тусламж авах шаардлагатай.';
      } else {
        levelLabel = 'Сэтгэл гутралтай байх магадлал өндөр';
        caseTitle =
          '12-оос дээш оноо нь сэтгэл гутралтай байх магадлал өндөр байгааг илтгэдэг тул зохих арга хэмжээг хугацаа алдалгүй авах хэрэгтэй. Сэтгэцийн эмч эсвэл сэтгэл зүйчид хандаарай.';
      }

      doc.font(fontBold).fontSize(13).text(levelLabel).moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(caseTitle, { align: 'justify' })
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт мэдээлэл');

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэхүү сэтгэл гутрах эмгэг нь жирэмсний сүүлийн саруудад илүүтэй тохиолддог. Төрсний дараагаар сэтгэл гутралд өртсөн эхчүүдийн 40-өөс 50%-д сэтгэл гутралын анхны шинж тэмдгүүд нь жирэмсэн үедээ эхэлсэн байдаг.\n\nМонгол улсад хийгдсэн судалгаагаар хэт залуу насандаа эсвэл төлөвлөөгүй жирэмсэн болох, гэр бүлийн харилцаа тайван амгалан биш байх, хүчирхийлэлтэй тэр дундаа сэтгэл санааны хүчирхийлэлтэй орчинд байх зэрэг нь сэтгэл гутрал үүсэхэд нөлөөлж буйг дурдсан бөгөөд хоттой харьцуулахад хөдөө, орон нутагт амьдарч буй эмэгтэйчүүдэд илүү их сэтгэл гутралд өртдөг гэж дүгнэжээ.\n\nЖирэмсэн үеийн сэтгэл гутрал нь эх, урагт адилхан сөргөөр нөлөөлдөг. Тухайлбал жирэмсэн эмэгтэй сэтгэл гутралтай удаан явах нь ураг зулбах, цагаасаа өмнө төрөх, ургийн өсөлтийн саатах, хожуу үеийн жирэмсний хордлогод өртөх зэрэг олон эрсдэлийг нэмэгдүүлдэг. Мөн түүнчлэн ирээдүйд мэндлэх хүүхдийн талаас жин багатай төрөх, ээжтэйгээ ээнэгшил үүсэхэд бэрхшээлтэй байх, хүүхдийн хүчирхийлэл болон үл хайхрах байдалд өртөх, анхаарал дутмагшил хэт хөдөлгөөнтөх эмгэг, импульсив эмгэг, хэл ярианы бэрхшээл, төрх үйлийн эмгэг зэргээр өвчлөх эрсдэлтэй болохыг тогтоожээ.\n\nХэрэв жирэмсэн үеийн сэтгэл гутралыг эмчлэхгүй бол цаашид даамжирч төрсний дараах сэтгэл гутралаар өвчлөх эрсдэлийг нэмэгдүүлдэг. Иймээс жирэмсэн үеийн сэтгэл гутралыг эрт илрүүлж, цаг алдалгүй тусламж үйлчилгээ үзүүлэх нь эх, хүүхдийн бие болоод сэтгэцийн эрүүл мэндэд чухал ач холбогдолтой юм.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт мэдээлэл');
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
          'Сэтгэцийн Эрүүл Мэндийн Төв. (2025). Сэтгэл зүйн сорил. https://ncmh.gov.mn/\n\nЭрүүл Мэндийн Яам, Сэтгэцийн Эрүүл Мэндийн Төв. (2022). “Жирэмсэн болон төрсний дараах үеийн сэтгэл гутрал түүнд нөлөөлөх зарим эрсдэлт хүчин зүйлсийг тогтоох” судалгааны тайлан.\n\nИх Британы Үндэсний Эрүүл Мэндийн Үйлчилгээ. (2025). https://www.rightdecisions.scot.nhs.uk/',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('pregnant', error);
    }
  }
}
