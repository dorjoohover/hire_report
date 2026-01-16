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
export class Who5 {
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
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
      );
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Оршил', marginX, doc.y + 15)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Дэлхийн Эрүүл Мэндийн Байгууллага (ДЭМБ)-ын тодорхойлсноор эрүүл байх болон эрүүл мэнд гэдэг нь "зөвхөн өвчин эмгэггүй байх төдийгүй бие бялдар, сэтгэл санаа, нийгмийн амьдралын сайн сайхан байдлын цогц байдал” гэж тодорхойлсон байдаг. Харин сэтгэцийн эрүүл мэнд гэдэг нь хүн сэтгэцийн эмгэггүй байхын зэрэгцээ нийгэм болон хүрээлэн байгаа гадаад орчинтойгоо дасан зохицож хэвийн амьдрах, ажиллах, суралцах, нийгэмд зохих байр сууриа эзлэн хувь нэмрээ оруулж чадахуйц байдлыг хэлнэ” гэж сэтгэцийн эрүүл мэндийн тухай хуульд тодорхойлжээ.\n\nӨөрөөр хэлбэл сайн сайхан хэмээх ойлголт нь маш олон хүчин зүйлээс зэрэг хамаардаг бөгөөд зөвхөн сэтгэц, сэтгэл зүйн байдлаас гадна, тухайн хүний  ажил, амьдралын сэтгэл ханамжид нөлөөлж буй бие бялдар, эдийн засаг, нийгэм, сэтгэл хөдлөлийн олон хүчин зүйлсийг цогцоор авч үздэг.\n\nСайн сайхан байдал нь хүн өдөр тутмын амьдралдаа хэрхэн дасан зохицож, эрч хүчтэй, сэтгэл ханамжтай амьдарч буйг илэрхийлдэг чухал ойлголт бөгөөд улс орны түвшинд тухайн улсын хүн амын сэтгэц, сэтгэл зүйн эрүүл мэндийн ерөнхий байдлыг илтгэх хэмжүүр болдог.\n\nГэхдээ сэтгэцийн сайн сайхан байдал хэмээх ойлголтыг тодорхойлоход төвөгтэй, аз жаргал, эрүүл мэндтэй холбоотой амьдралын чанар зэрэг ухагдахуунтай ихэвчлэн андуурагдах магадлал их байдаг бөгөөд эдгээр нь тусдаа ойлголт юм. Хэдийгээр сайн сайхан байдлыг үнэлэх зорилготой олон арван төрлийн тест, аргачлал байдаг ч энэхүү нарийн төвөгтэй, цогц байдлыг үнэн зөв, бүрэн дүүрэн хэмжиж, тодорхойлох амаргүй байдаг.\n\nДЭМБ-5 (WHO-5) сайн сайхан байдлын индекс буюу сэтгэцийн эрүүл, сайн сайхан байдлыг үнэлэх тестийг 1998 онд ДЭМБ-ын судлаачид боловсруулсан. Үүнээс хойш энэхүү тест нь дэлхийн 30 гаруй оронд орчуулагдаж, энэ чиглэлд хамгийн их хэрэглэгддэг тестийн арга болсон юм. Уг асуумж нь таны одоогийн сэтгэцийн эрүүл мэнд, сайн сайхан байдлыг (сэтгэл санаа, идэвхтэй байдал, хүсэл сонирхол) цөөн асуултаар үнэлнэ.',
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
          'Сэтгэцийн эрүүл, сайн сайхан байдлыг үнэлж, судалдаг олон төрлийн онол загвар, тестүүд байдаг. Энэхүү тестийн анхны загвар, аргачлалыг 1998 онд ДЭМБ-ын Европ дахь бүсийн төвөөс хийгдсэн DEPCARE төслийн хүрээнд, Дани Улсын сэтгэцийн төвийн судлаач, эрдэмтэд зохиожээ. 2015 онд энэхүү тестийн хүчин төгөлдөр байдлыг үнэлж, судалсан ба сэтгэл гутрал байгаа эсэхийг давхар илрүүлж чаддаг давуу талтай нь батлагдсан. Тестийн сэтгэл гутралыг илрүүлэх мэдрэг чанар 93%, өвөрмөц чанар 83% байсан.',
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
        .text(
          'Тестийн оноог тооцохдоо асуулт тус бүр дээрх харгалзах оноог хооронд нь нэмж, нэгдсэн үр дүнг нийлбэр оноо болон хувиар тооцож, тайлагнана. Нийт бодит оноо 0-ээс 25-ын хооронд гарна. Үүнээс 0 оноо сэтгэцийн байдал тун таагүй байгааг илэрхийлдэг бол 25 оноо (100%) сэтгэцийн сайн сайхан байдал дээд хэмжээнд сайн буюу амьдралын чанар сайн байгааг илтгэнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      const tableData = [
        ['Нийт оноо (%)', 'Ангилал*'],
        [
          '50% болон түүнээс дээш',
          'Сэтгэцийн эрүүл, сайн сайхан байдал харьцангуй хэвийн',
        ],
        [
          '29%-с 50% хүртэл',
          'Сэтгэцийн эрүүл, сайн сайхан байдал харьцангуй буурсан, хөнгөн зэргийн сэтгэл гутрал байх магадлалтай',
        ],
        [
          '28%-с доош',
          'Сэтгэцийн эрүүл, сайн сайхан байдал харьцангуй буурсан, дунд болон хүнд зэргийн сэтгэл гутрал байх магадлалтай',
        ],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [tableWidth * 0.3, tableWidth * 0.7];
      const rowHeights = [18, 18, 36, 36];

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

      doc
        .font(fontNormal)
        .fontSize(10)
        .fillColor(colors.black)
        .text(
          '*Кристиан Винтер Топп нарын судалгааны ажлын үр дүнд үндэслэв, 2015 он.',
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
        .fillColor(colors.black)
        .text(
          'Үүнээс гадна, 5 асуултын аль нэгэнд нь 0 эсвэл 1 оноо авсан тохиолдолд сэтгэл гутралтай байж болзошгүйг илтгэх учир, сэтгэл гутралыг давхар үнэлнэ. ',
          marginX,
          doc.y,
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сэтгэцийн эрүүл, сайн сайхан байдал нь хувь хүний сэтгэл зүйн байдал, сэтгэцийн эрүүл мэндийн байдлыг бүхэлд нь илэрхийлэхгүй. ',
          { continued: true },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэдийгээр энэхүү тест нь таны сэтгэцийн эрүүл мэнд, сайн сайхан байдлын талаар ерөнхий, анхан шатны, үнэ цэнтэй мэдээлэл өгдөг ч сэтгэл зүй, сэтгэцийн эрүүл мэндтэй холбоотой бусад нөхцөл байдал, зан төрх, дадлыг нарийвчлан үнэлэхгүй. Хэрвээ таны хувьд эдгээр мэдээлэл хэрэгтэй, энэ талаар мөн сонирхож буй бол “Сэтгэцийн тулгамдсан асуудлыг илрүүлэх сорил”, “Сэтгэл гутралыг үнэлэх тест”, “Ажлаас халшрах хам шинжийг үнэлэх тест”, “Ажлын байрны сэтгэл ханамжийг үнэлэх тест”, “Ажил амьдралын тэнцвэрт байдлыг үнэлэх тест” болон бусад холбогдох тестүүдийг цаашид нэмэлтээр бөглөхийг санал болгож байна.',
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
        .text('Таны сэтгэцийн эрүүл, сайн сайхан байдал ', marginX, doc.y, {
          continued: true,
        })
        .font('fontBlack')
        .fontSize(16)
        .fillColor(colors.orange)
        .text(result.value + '%', doc.x, doc.y - 3, { continued: true })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(' буюу ', marginX, doc.y + 3, {
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
          continued: false,
        })
        .moveDown(1);

      const categories = [
        'Нийт оноо',
        ...result.details.map((detail) => detail.value),
      ];

      const values = [
        Number(result.value),
        ...result.details.map((detail) => Number(detail.cause)),
      ];
      const sortedValues = [...values].sort((a, b) => a - b);
      const divisors = [100, 5, 5, 5, 5, 5];
      const averages = [101, 6, 6, 6, 6, 6];

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
          .text(String(sortedValues[index] + (index > 0 ? ' оноо' : '%')), {
            continued: false,
          });

        doc.moveDown(-0.8);

        const buffer = await this.vis.bar(
          sortedValues[index],
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
          'Хэрэв таны нийт оноо 50%-с бага эсвэл 5 асуултын аль нэгэнд нь 0 эсвэл 1 оноо авсан тохиолдолд сэтгэл гутралтай байж болзошгүйг илтгэнэ. Энэ тохиолдолд таныг “Сэтгэл гутралыг үнэлэх тест”-ийг давхар бөглөхийг санал болгож байна.\n\nЭнэхүү тестийн үр дүн болон дагалдах мэдээлэл нь танд зөвхөн мэдээлэл өгөх зорилготой бөгөөд сэтгэцийн эмч болон сэтгэл засалч эмчийг орлох оношилгоо биш гэдгийг анхаарна уу.',
          marginX,
          doc.y + 45,
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
          'World Health Organization. The World Health Organization-Five Well-Being Index (WHO-5). Geneva: World Health Organization; 2024. License: CC-BY-NC-SA 3.0 IGO\n\nTopp CW, Østergaard SD, Søndergaard S, Bech P. The WHO-5 Well-Being Index: a systematic review of the literature. Psychotherapy and psychosomatics. 2015 Mar 28;84(3):167-76.',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('who5', error);
    }
  }
}
