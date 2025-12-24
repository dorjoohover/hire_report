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
export class Workstress {
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
        .font('fontBold')
        .fontSize(16)
        .fillColor(colors.orange)
        .text('Стресс гэж юу вэ?', marginX, doc.y);
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
          'Стресс гэдэг нь бүх төрлийн гадны нөлөөнд үзүүлж буй хүний бие-сэтгэцийн хариу үйлдэл юм. Стрессийг олон байдлаар тодорхойлдог ч, “бие махбодын, сэтгэцийн эсвэл сэтгэл хөдлөлийн ачаалал, цочрол”, эсвэл “хувь хүний нөөц боломж, нөөц бололцооноос давсан шаардлага, нөхцөл байдалтай холбоотой мэдрэмж” гэж нийтлэг байдлаар тодорхойлж болох юм.\n\nБид стрессийн талаар ярихдаа ихэвчлэн хүнд таагүй мэдрэмж үүсгэдэг, эрүүл мэндэд хортой нөлөө үзүүлдэг сөрөг стресс буюу дистрессийг авч үздэг. Гэхдээ өдөр тутмын амьдралд тохиолдох тодорхой хэмжээний стресс нь хэвийн зүйл юм. Энэ төрлийн стрессийг эерэг стресс (eustress) нэрлэдэг бөгөөд ийм стресс нь биднийг сайн ажиллаж, өсөн дэвжихэд шаардлагатай хүчин зүйл болдог. Тухайлбал, ажлын ярилцлага, шалгалтад бэлдэх үед үүсэх стресс нь биднийг анхаарлаа төвлөрүүлж, улам их хичээх хүсэл тэмүүллийг бий болгодог.\n\nСөрөг стресс нь дараах үе шаттай:',
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
            'Хариу үйлдэл эхлэх: Стресс үүсгэгч хүчин зүйлээс үүдэлтэй анхны цочрол',
            'Эсрэг хариу үйлдэл: Стресс үүсгэгч хүчин зүйлийг даван туулах эсвэл дасан зохицох оролдлого',
            'Туйлдах: Удаан хугацаанд үргэлжилсэн стрессээс болж ядарч туйлдах, халшрах',
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
          'Ажил, мэргэжилтэй холбоотой стресс нь стресс үүсгэгч хамгийн том шалтгаан болдог. Энэ төрлийн стресс нь ажлын байран дээрх хэт их ажлын ачаалал, энэхүү үүссэн ачааллыг зохицуулах, шийдвэрлэж чадахгүй байх, нөхцөл байдал хяналтаас гарсан мэдрэмжээс болж үүсдэг байна. Ажлын байран дээрх удаан үргэлжилсэн стресс нь зүрх судасны өвчнөөс эхлээд эрүүл мэндэд олон талын хор хөнөөл учруулах эрсдэлтэй. Тиймээс байгууллагын түвшинд ажилтнуудын дундах сөрөг стрессийг бууруулж, сэргийлж байх нь чухал ач холбогдолтой юм. Стрессийн талаар зөвөөр ойлгож, өөрийн стрессийг зөвөөр үнэлж, стресс зохицуулж сурснаар та сөрөг стрессээс улбаатай хор нөлөөг бууруулж, цаашид өсөн дэвших боломжтой юм. ',
          marginX,
          doc.y,
          {
            align: 'justify',
          },
        )
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
          'Ерөнхий болон ажлын байран дээрх стрессийг илрүүлэх олон төрлийн онол загвар, тестүүд байдаг. Энэхүү тестийн анхны загвар, аргачлалыг Америкийн Стресс Судлалын Институтийн судлаачид хөгжүүлсэн бөгөөд Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв (СЭМҮТ)-ийн эмч, судлаачид Монгол хувилбарыг нь хөгжүүлэн, олон жилийн туршид практикт ашигласаар ирсэн байдаг.  Бид энэхүү тестийг СЭМҮТ-ийн судлаач нарын зөвшөөрөлтэйгөөр ашиглаж байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу.\n\nЭнэхүү сэтгэл түгшилтийг үнэлэх тест нь таны одоогийн сэтгэл түгшилтийн байдлыг үнэлэх бөгөөд хувь хүний сэтгэл түгших хэв шинжийг илрүүлэхгүй.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Тестийн оноог зөв тайлбарлах')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн оноог тооцохдоо асуулт тус бүр дээрх харгалзах оноог хооронд нь нэмж, нэгдсэн үр дүнг  тайлагнана. Тестийн үр дүнг тайлбарлахдаа дараах ангиллын системийг ашиглана. Тухайлбал: Хэрэв та тест бөглөөд 20 оноо авсан бол энэ нь "Бага зэргийн стресстэй” түвшнийг заах бөгөөд танд ажил, мэргэжил, ажлын байртай холбоотой хөнгөн хэлбэрийн стресс байж магадгүйг илэрхийлж байгаа юм. Онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу.',
          { align: 'justify' },
        )
        .moveDown(0.75);

      const tableData = [
        ['Нийт оноо', 'Ангилал, тайлбар'],
        ['15-с доош оноо', 'Стрессгүй'],
        ['16-20 оноо', 'Бага зэргийн стресстэй'],
        ['21-25 оноо', 'Дунд зэргийн стресстэй'],
        ['26-30 оноо', 'Хүнд зэргийн стресстэй'],
        ['31-40 оноо', 'Стрессийн түвшин ноцтой'],
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
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажлын байран дээрх стресс нь хувь хүний сэтгэл зүйн байдал, сэтгэцийн эрүүл мэндийн байдлыг бүхэлд нь илэрхийлэхгүй. ',
          marginX,
          doc.y + 15,
          { continued: true },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэдийгээр энэхүү тест нь таны одоогийн стрессийн түвшний талаар үнэ цэнтэй мэдээлэл өгдөг ч сэтгэл зүй, сэтгэцийн эрүүл мэндтэй холбоотой бусад нөхцөл байдал, зан төрх, дадлыг үнэлэхгүй. Хэрвээ таны хувьд эдгээр мэдээлэл хэрэгтэй, энэ талаар мөн сонирхож буй бол “Сэтгэцийн тулгамдсан асуудлыг илрүүлэх сорил”, “Сэтгэл гутралыг үнэлэх тест”, “Ажлаас халшрах хам шинжийг үнэлэх тест”, “Сэтгэл түгшилтийг үнэлэх сорил”, “Ажлын байрны сэтгэл ханамжийг үнэлэх тест”, “Ажил амьдралын тэнцвэрт байдлыг үнэлэх тест” болон бусад холбогдох тестүүдийг давхар бөглөхийг санал болгож байна.',
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
        .text('Таны ажлын байран дээрх стрессийн түвшин ', marginX, doc.y, {
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
        .text('/' + String(40));

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.point, 40, 41, '');

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
        .text('Cорилын үр дүнгийн тайлбар')
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          result.point <= 15
            ? 'Та харьцангуй сайн амарсан, тайван байна.\n\nТаны хувьд стресстэй холбоотой санаа зовох асуудал алга байна.'
            : result.point <= 20
              ? 'Бага зэргийн стресстэй.\n\nОдоогоор ажил, мэргэжилтэй холбоотой стрессийг амархан даван туулдаг. Гэхдээ хааяа нэг хэцүү өдөртэй тулгардаг. Аливаа зүйлсийг эерэг талаас нь харахыг хичээгээрэй.'
              : result.point <= 25
                ? 'Дунд зэргийн стресстэй\n\nАжил, мэргэжилтэй холбоотой зарим нэг зүйлс таныг нэлээд ихээр стресстэй байлгадаг. Гэхдээ энэхүү стресс ихэнх хүмүүст байдаг, даваад гарч болохоор стресс юм. Хамгийн их оноо бүхий сорилын асуултууд дээр төвлөрч, стрессээ бууруулж болох арга замуудыг эрэлхийлээрэй.'
                : result.point <= 30
                  ? 'Хүнд зэргийн стресстэй\n\nТа одоогоор стрессээ зохицуулж чадаж байгаа хэдий ч заримдаа ажлаа хийхэд төвөгтэй, зовлонтой санагддаг байж магадгүй юм. Та магадгүй өөртөө тохирохгүй ажил, даалгавар хийж байж магадгүй, эсвэл хэмжээ, цаг хугацааны хувьд таны хийж буй ажил танд яг одоо тохирохгүй байж магадгүй юм. Энэ тохиолдолд хэн нэгнээс зөвлөгөө авах нь танд ашигтай.'
                  : 'Стрессийн түвшин ноцтой\n\nТаны оноо өндөр байх тусам илүү ноцтой байдлыг илтгэнэ. Танд мэргэжлийн тусламж, зөвлөгөө хэрэгтэй. Ялангуяа ажил, мэргэжилтэй холбоотой стресс таны эрүүл мэндэд сөргөөр нөлөөлж байгаа бол ажлаа хийж буй арга барил, албан тушаалаа өөрчлөх эсвэл ажлаа солих талаар хүртэл бодож үзэх болох юм.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэрвээ танд ажлын байрны стресс илэрсэн бол харьяа аймаг, дүүргийнхээ сэтгэцийн эмчид хандан сэтгэлзүйн тусламж, үйлчилгээ авч болно.',
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Стрессийг даван туулах энгийн аргууд (СЭМҮТ-ийн зөвлөгөө)')
        .moveDown(1);

      let currentY = doc.y;

      const columnGap = 16;
      const columnWidth = (doc.page.width - marginX * 2 - columnGap) / 2;

      const cardRadius = 10;
      const rowGap = 10;
      const barWidth = 5;
      const cardPaddingX = 10;
      const cardPaddingY = 7;

      const tips = [
        'Стресст өртсөн гэдгээ хүлээн зөвшөөрч, ойлгох',
        'Сэтгэлийг тань зовоож буй зүйлсийн талаар өөрийн итгэдэг ойр дотны хүнтэй ярих буюу мэдрэмжээ хуваалцах',
        'Өөрчилж болохгүй зүйлс болон бусдаас хүлээлт үүсгэхгүй байх',
        'Цагийн хуваарь, төлөвлөгөөтэй болох',
        'Хангалттай унтаж амрах',
        'Цэвэр агаарт зугаалах, байгальтай ойр байх',
        'Дуртай зүйлсээ хийх, шинэ зүйлд суралцах',
        'Эрүүл, зөв хооллох',
        'Тайвшруулах амьсгалын дасгал хийх',
        'Нийгмийн үйл ажиллагаанд оролцох',
        'Тэмдэглэл хөтлөх',
        'Сэтгэл зүйч, сэтгэл засалчтай ярилцах',
      ];

      let columnY = [currentY, currentY];

      const accentColors = [
        colors.blue,
        colors.green,
        colors.purple,
        colors.orange,
        colors.sky,
        colors.leaf,
        colors.red,
      ];

      tips.forEach((item, index) => {
        const col = index % 2;
        const x = startX + col * (columnWidth + columnGap);
        const y = columnY[col];

        doc.font(fontNormal).fontSize(12);

        const textWidth = columnWidth - barWidth - cardPaddingX * 2;

        const textHeight = doc.heightOfString(item, {
          width: textWidth,
        });

        const cardHeight = textHeight + cardPaddingY * 2;

        doc
          .path(
            `M ${x} ${y}
     L ${x + columnWidth - cardRadius} ${y}
     Q ${x + columnWidth} ${y} ${x + columnWidth} ${y + cardRadius}
     L ${x + columnWidth} ${y + cardHeight - cardRadius}
     Q ${x + columnWidth} ${y + cardHeight} ${x + columnWidth - cardRadius} ${y + cardHeight}
     L ${x} ${y + cardHeight}
     Z`,
          )
          .fillColor('#F8F9FB')
          .fill();

        doc
          .rect(x, y, barWidth, cardHeight)
          .fillColor(accentColors[index % accentColors.length])
          .fill();

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(item, x + barWidth + cardPaddingX, y + cardPaddingY + 2.5, {
            width: textWidth,
          });

        columnY[col] += cardHeight + rowGap;
      });

      currentY = Math.max(columnY[0], columnY[1]);
      doc.y = currentY + 6;

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт мэдээлэл');
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.black)
        .text('Cэтгэцийн Эрүүл Мэндийн Төвийн мэдээллийн утас: 1800-2000')
        .moveDown(1);
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
      console.log('workstress', error);
    }
  }
}
