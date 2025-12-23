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
export class Setgeltugshilt {
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
        exam.assessment.usage,
      );
      doc.font(fontBold).fontSize(13).text('Оршил').moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Санаа зовсон, стресстэй, түгшсэн, айсан, тайван бус байдлыг сэтгэл түгшилт гэсэн ойлголтод хамааруулж үздэг. Сэтгэл түгших нь стресст үзүүлж буй хэвийн хариу урвал юм. Гэхдээ сэтгэл түгшсэн байдал удаан хугацаанд үргэлжилж, хүний өдөр тутмын хэвийн үйл ажиллагаанд сөрөг нөлөө үзүүлж буй бол энэ нь сэтгэл түгших эмгэг болно.\n\nСэтгэл түгших эмгэгийн үед: ',
          marginX,
          doc.y,
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Ялимгүй жижиг зүйлд эсвэл сэтгэл түгшилт үүсгэхээргүй нөхцөл байдлаас аяндаа сэтгэл түгших, болоогүй зүйлсийн талаар ирээдүй рүү чиглэсэн хий хоосноор сэтгэл зовних',
            'Тогтворгүй, удаан хугацаагаар үргэлжлэх',
            'Бие сэтгэцийн байдалд сөргөөр нөлөөлнө',
            'Тухайн нөхцөл байдалтай тохироогүй хэт их санаа зовнил айдас, сэтгэл түгшилт илрэх',
            'Өдөр тутмын үйл ажиллагаанд (хичээл, ажил, гэр бүлийн амьдрал, нийгмийн харилцаа гэх мэт) асуудал, саад бэрхшээлүүд үүсэх. Айдас, сэтгэл түгшилттэй холбоотойгоор аливаа үйл ажиллагаа, ажил амьдралын шаардлага, шийдвэрээс зайлсхийх, зугтах зан үйл хийх.',
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
          'Сэтгэл түгшилтийг илрүүлэх олон төрлийн онол загвар, тестүүд байдаг. Энэхүү тестийн анхны загвар, аргачлалыг Чарлес Д. Спилберг нарын судлаачид хөгжүүлсэн бөгөөд Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв (СЭМҮТ)-ийн эмч, судлаачид Монгол хувилбарыг нь хөгжүүлэн, олон жилийн туршид практикт ашигласаар ирсэн байдаг. Бид энэхүү тестийг СЭМҮТ-ийн судлаач нарын зөвшөөрөлтэйгээр ашиглаж байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу. Энэхүү сэтгэл түгшилтийг үнэлэх тест нь таны одоогийн сэтгэл түгшилтийн байдлыг үнэлэх бөгөөд хувь хүний сэтгэл түгших хэв шинжийг илрүүлэхгүй.',
          { align: 'justify' },
        )
        .moveDown(1);
      // doc
      //   .font(fontBold)
      //   .fontSize(13)
      //   .text('Тестийн оноог зөв тайлбарлах')
      //   .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн оноог тооцохдоо асуулт тус бүр дээрх харгалзах оноог хооронд нь нэмж, нэгдсэн үр дүнг  тайлагнана. Тестийн үр дүнг тайлбарлахдаа дараах ангиллын системийг ашиглана. Тухайлбал: Хэрэв та тест бөглөөд 40 оноо авсан бол энэ нь "Сэтгэл түгшилтийн байдал харьцангуй өндөр” түвшнийг заах бөгөөд танд сэтгэл түгшилт байж болохыг илэрхийлж байгаа юм. Онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу.',
          { align: 'justify' },
        )
        .moveDown(0.75);

      const tableData = [
        ['Нийт оноо', 'Ангилал'],
        ['20-38', 'Сэтгэл түгшилтийн байдал харьцангуй бага'],
        ['39-80', 'Сэтгэл түгшилтийн байдал харьцангуй өндөр'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [
        tableWidth * 0.3, // 30%
        tableWidth * 0.7, // 70%
      ];

      let startX = marginX;
      let startY = doc.y;

      for (let row = 0; row < tableData.length; row++) {
        const currentRowHeight = 18;

        let cellX = startX;
        for (let col = 0; col < tableData[row].length; col++) {
          const cellWidth = colWidths[col];

          doc
            .rect(cellX, startY, cellWidth, currentRowHeight)
            .strokeColor(colors.black)
            .stroke();

          doc
            .font(row === 0 ? fontBold : fontNormal)
            .fontSize(11)
            .fillColor('black')
            .text(tableData[row][col], cellX + 5, startY + 4, {
              width: cellWidth - 10,
              align: 'center',
            });

          cellX += cellWidth;
        }

        startY += currentRowHeight;
      }

      doc
        .font(fontNormal)
        .fontSize(10)
        .fillColor(colors.black)
        .text(
          '*Лаура Ж Жулиан нарын судалгааны ажлын үр дүнд үндэслэв, 2011 он.',
          marginX,
          doc.y + 5,
          {
            align: 'right',
          },
        )
        .moveDown(1);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Судлаачид илүү ахмад настай хүмүүсийн дунд сэтгэл түгшилтийн байдлыг илрүүлэх босго оноо илүү өндөр байх ёстойг тэмдэглэсэн байдаг. Хэрэв та 60-аас дээш настай бол босго оноог 54/55 хүртэл өгсөх нь илүү зохистой (Кари Кваал ба бусад, 2005).',
          {
            align: 'justify',
          },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сэтгэл түгшилтийн байдал нь хувь хүний сэтгэл зүйн байдал, сэтгэцийн эрүүл мэндийн байдлыг бүхэлд нь илэрхийлэхгүй. ',
          { continued: true },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэдийгээр энэхүү тест нь сэтгэл түгшилтийн одоогийн байдлын талаар үнэ цэнтэй мэдээлэл өгдөг ч сэтгэл зүй, сэтгэцийн эрүүл мэндтэй холбоотой бусад нөхцөл байдал, зан төрх, дадлыг үнэлэхгүй. Хэрвээ таны хувьд эдгээр мэдээлэл хэрэгтэй, энэ талаар мөн сонирхож буй бол “Сэтгэцийн тулгамдсан асуудлыг илрүүлэх сорил”, “Сэтгэл гутралыг үнэлэх тест”, “Ажлаас халшрах хам шинжийг үнэлэх тест”, “Ажлын байрны сэтгэл ханамжийг үнэлэх тест”, “Ажил амьдралын тэнцвэрт байдлыг үнэлэх тест” болон бусад холбогдох тестүүдийг давхар бөглөхийг санал болгож байна.',
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
        .text('Таны сэтгэл түгшилтийн оноо ', marginX, doc.y, {
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
        .text(`${result.result.toString().toUpperCase()}`, doc.x, doc.y - 3, {
          continued: true,
        })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(' байна. ', marginX, doc.y + 3, {
          continued: false,
        })
        .moveDown(1);

      //   await this.single.examQuartileGraph(doc, result);

      doc.x = marginX;

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны авсан оноо: ' + ' ', { continued: true })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(String(result.point), { continued: true })
        .fillColor(colors.black)
        .text('/' + String(80));

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.point, 80, 81, '');

      doc
        .image(buffer, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        })
        .moveDown(3);

      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.black)
        .text('Cэтгэл түгшилтийн үед илрэх шинж тэмдгүүд')
        .moveDown(0.5);

      const gridStartX = marginX;
      const gridStartY = doc.y;

      const gridGap = 14;
      const gridWidth = doc.page.width - marginX * 2;
      const cardWidth = (gridWidth - gridGap) / 2;
      const padding = 12;

      function calculateCardHeight(title: string, items: string[]): number {
        let height = padding + 18;

        doc.font(fontNormal).fontSize(11);

        for (const item of items) {
          height +=
            doc.heightOfString(item, {
              width: cardWidth - padding * 2 - 6,
              lineGap: 2,
            }) + 2;
        }

        return height + padding;
      }

      function drawSymptomCard(
        x: number,
        y: number,
        height: number,
        title: string,
        items: string[],
        accentColor: string,
      ) {
        doc.roundedRect(x, y, cardWidth, height, 8).fillColor('#FAFAFA').fill();

        doc
          .moveTo(x, y)
          .lineTo(x, y + height)
          .lineWidth(3)
          .strokeColor(accentColor)
          .stroke();

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(title, x + padding, y + padding);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .list(items, x + padding, y + padding + 22, {
            width: cardWidth - padding * 2 - 6,
            bulletRadius: 1.2,
            lineGap: 2,
            textIndent: 6,
          });
      }

      const cognitive = [
        'Дуу чимээнд хэт мэдрэг хандах, цочромтгой болох',
        'Анхаарал төвлөрөх чадвар буурах, анхаарал сарних',
        'Сэтгэн бодох чадвар удаашрах',
      ];

      const physical = [
        'Толгой өвдөх, толгой эргэх',
        'Амьсгал давчдах, цээж бачуурах',
        'Цээж хөндүүрлэх, юм дараад байгаа мэт мэдрэмж төрөх',
        'Зүрх дэлсэх, зүрхээр өвдөх',
        'Даралт ихсэх, алга хөлрөх, ам хатах',
        // 'Юм залгихад горойж, тээглэх, аюулхай орчим эвгүй оргих, өвдөх',
        //'Гар хөл салгалах, бадайрах, нойрны хямрал',
      ];

      const emotional = [
        'Айх, ичих',
        'Tөөрчих вий, осгочих вий, гэмтчих вий, үхчих вий гэх мэт айдас, түгшүүр',
        'Хар аяндаа улигт бодолд автах (яаж байгаа бол, тэгчих вий дээ, ингэчих вий дээ гэх мэт хоосон санаа зовнил)',
        'Сэтгэл түгших',
        'Уйламтгай болох',
        'Сэтгэлээр унах',
      ];

      const behavioral = [
        'Идэвх сонирхолгүй болох',
        'Зөрүүдлэх, нийгмийн харилцаанаас зайлсхийх, ганцаараа байхыг эрмэлзэх',
        'Хорт зуршилд автах, дэлгэц, онлайн, мөрийтэй тоглоомд донтох',
        'Сэтгэл түгшээх орон зай, нөхцөл байдлаас зайлсхийх оролдлогыг тогтмол хийх',
      ];

      const row1Height = Math.max(
        calculateCardHeight('Танин мэдэхүйн талаас', cognitive),
        calculateCardHeight('Бие махбодын талаас', physical),
      );

      drawSymptomCard(
        gridStartX,
        gridStartY,
        row1Height,
        'Танин мэдэхүйн талаас',
        cognitive,
        colors.lightTeal,
      );

      drawSymptomCard(
        gridStartX + cardWidth + gridGap,
        gridStartY,
        row1Height,
        'Бие махбодын талаас',
        physical,
        colors.green,
      );

      const row2Y = gridStartY + row1Height + gridGap;

      const row2Height = Math.max(
        calculateCardHeight('Сэтгэл хөдлөлийн талаас', emotional),
        calculateCardHeight('Зан үйлийн талаас', behavioral),
      );

      drawSymptomCard(
        gridStartX,
        row2Y,
        row2Height,
        'Сэтгэл хөдлөлийн талаас',
        emotional,
        colors.purple,
      );

      drawSymptomCard(
        gridStartX + cardWidth + gridGap,
        row2Y,
        row2Height,
        'Зан үйлийн талаас',
        behavioral,
        colors.gold,
      );

      // Move cursor below grid
      doc.y = row2Y + row2Height + 12;
      doc.lineWidth(1);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэрэв танд дээрх шинж тэмдгүүдээс 4-өөс дээш шинж, 2 долоо хоногоос илүү хугацаанд байнга илэрсэн бол өрх, дүүргийн эмч, сэтгэцийн эмч, сэтгэл засалч эмчид хандан сэтгэлзүйн тусламж, үйлчилгээ аваарай. Сэтгэл түгшилтийг эрүүл мэндийн тусламж үйлчилгээний анхан шатны байгууллагууд дээр оношилж, эмчлэх боломжтой. Сэтгэл заслын эмчилгээний үр дүн болон сэтгэл түгшилтийн хүнд хөнгөний зэргээс хамааран эмийн эмчилгээг мөн эхлүүлж болдог. Энэхүү тестийн үр дүн болон дагалдах мэдээлэл нь танд зөвхөн мэдээлэл өгөх зорилготой бөгөөд сэтгэцийн эмч болон сэтгэл засалч эмчийг орлох оношилгоо биш гэдгийг анхаарна уу.',
          marginX,
          doc.y + 2,
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
          'Сэтгэцийн эрүүл мэндийн төв. (2025). Сэтгэл зүйн сорил. https://ncmh.gov.mn/\n\nJulian, L.J., 2011. Measures of anxiety. Arthritis care & research, 63(0 11), pp.10-1002.\n\nKvaal, K., Ulstein, I., Nordhus, I.H. and Engedal, K., 2005. The Spielberger state-trait anxiety inventory (STAI): the state scale in detecting mental disorders in geriatric patients. International Journal of Geriatric Psychiatry: A journal of the psychiatry of late life and allied sciences, 20(7), pp.629-634.',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('setgeltugshilt', error);
    }
  }
}
