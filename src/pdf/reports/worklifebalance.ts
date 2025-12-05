import { Injectable } from '@nestjs/common';
import { ResultEntity, ExamEntity, ResultDetailEntity } from 'src/entities';
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
import { SinglePdf } from '../single.pdf';
import { VisualizationService } from '../visualization.service';
import { AssetsService } from 'src/assets_service/assets.service';
const sharp = require('sharp');

@Injectable()
export class Worklifebalance {
  constructor(private vis: VisualizationService) {}

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
          'Орчин үеийн хурдтай, завгүй, ачаалал ихтэй амьдралд хүн ажил, гэр бүл хоорондын тэнцвэрээ хадгалж, бүгдийг амжуулж чаддаг байх нь том сорилт болжээ. Технологийн ачаар хүмүүсийн дундах харилцаа холбоо хялбар, амархан болсон хэдий ч ажил, гэр, хувийн амьдрал хоорондын зааг, хил хязгаар улам бүр бүдгэрч, сэтгэл зүй, сэтгэцийн эрүүл мэндийн асуудлууд улам бүр хурцаар тавигдах боллоо.\n\nХэрвээ танд хэт их ачаалалтай, өөрт чинь тулгарсан асуудлуудаа амжуулж чадахгүй, амьдралын тэнцвэрээ алдсан мэдрэмж төрж байвал та ганцаараа биш ээ. Канадын Сэтгэц Судлалын Холбооны мэдээлснээр нийт хүн амын талаас илүү хувьд нь (58%) ажил амьдралын тэнцвэрт байдал ямар нэгэн байдлаар алдагдсан байжээ. Цаашлаад ахмад хүмүүстэй харьцуулахад залуучууд, эмэгтэйчүүдтэй харьцуулахад эрчүүд илүү ихээр ажил амьдралын зөрчилтэй байдаг бөгөөд тэнцвэрт байдлыг бага чухалчилж үздэг, энэ талаар бага анхаардаг ажээ (PwC, 2016). ',
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
        'Ажил амьдралын тэнцвэрт байдал',
      );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Ажил амьдралын тэнцвэрийг хадгалах нь яагаад чухал вэ?', {
          align: 'justify',
        })
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Судалгаануудад дурдсанаар ажил амьдралын тэнцвэр алдагдсанаас хүний эрүүл мэндээс эхлээд байгууллагын түвшинд хүртэл олон төрлийн бодитой хохирлууд учирдаг байна. ',
            'Зөвхөн Канад улсад л сэтгэцийн эрүүл мэндтэй холбоотой жил бүр 14.4 тэрбум ам.доллар давсан эдийн засгийн алдагдал хүлээдэг аж (Стивенс ба Жубер, 2001).',
            'Ажлын хэт ачаалалтай холбоотой яс, булчингийн тогтолцооны эмгэгүүд, гэмтэл авах эрсдэл ихэснэ.',
            'Сэтгэцийн эрүүл мэндийн талаас архаг ядаргаа, ажлаас халшрах хам шинж, стресс, сэтгэл гутрал, сэтгэл түгшилтэд илүүтэй өртөнө. Үргэлжилсэн стресс, сэтгэл гутралтай холбоотойгоор анхаарал төвлөрөл байдал буурч, дархлаа суларч, өвчлөмтгий болж, зүрх судасны өвчнөөр өвчлөх эрсдэлүүд нэмэгдэнэ.',
            'Ажлын байрны талаас сэтгэл ханамжгүй байдал, ажил тасдалт болон чөлөө авалт ихсэх, ажлын бүтээмж муудах зэрэг багтана (Канадын Хөдөлмөрийн Эрүүл Мэнд Судлалын Төв, 2022).',
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
      doc.x = marginX - 15;
      doc.image(assetPath(`icons/worklife1`), {
        width: doc.page.width - marginX * 2,
      });
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн тухай');
      doc.x = marginX;

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Онол, судалгаануудад өгүүлснээр хувь хүнд ирж буй үүрэг хариуцлагын дарамтууд хэт ихсэх, эсвэл ажил болон хувийн амьдрал хооронд зөрчил үүсэж, нэг үүрэг нь нөгөө үүргийн хэрэгжилтэд саад болох (Гринхаус ба Бьютелл, 1985), эсвэл нэг талын үүрэг хариуцлага хэт ихсэж бусад талуудад нөлөөлөх байдлаар ажил амьдралын тэнцвэр алдагддаг байна (Гализзи ба Уитмарш, 2019).\n\n"Нөлөөлөл - Сэргэлт" (E–R)-ийн онолын дагуу хүн ажиллах явцдаа өөрийн эрч, хүч энерги зарцуулж, стресст өртөж байдаг бөгөөд дараачийн ажлаас өмнө тодорхой хугацаанд амарч, нөхөн сэргэх зайлшгүй шаардлагатай байдаг. Хэрэв энэхүү нөхөн сэргэх хугацаа хангалтгүй бол ачаалал, стрессүүд хуримтлагдаж улмаар архаг ядаргаа, нойргүйдэл, бие махбод болон сэтгэл зүйд үр дагавруудыг ардаасаа дагуулдаг байна.\n\n“Нөөцийн онол” (COR)-ын дагуу хүн бүр өөрийн гэсэн цаг хугацаа, эрч хүч, энерги, анхаарал, сэтгэл зүй, нийгмийн харилцааны хувьд хязгаарлагдмал нөөцтэй байдаг. Хэт их ачаалал, стрессийн үед энэхүү хязгаарлагдмал нөөц шавхагдаж, хүн аль нэг үүрэг хариуцлагаа биелүүлж чадахгүйд хүрч, зөрчил үүсдэг байна (Лапьерр нар, 2018).\n\nБидний ашиглаж буй ажил амьдралын тэнцвэртэй байдлыг үнэлэх тест нь дээр дурдсан онолууд дээр үндэслэсэн бөгөөд ажил амьдралын хоёрын хоорондын харилцан холбоо, эерэг болон сөрөг нөлөөллийг олон талт чиглэлд үнэлдгээрээ бусад аргуудаас давуу талтай.\n\nАжил амьдралын тэнцвэрийг үнэлэх тест нь ажил ба гэр бүл хоорондын тэнцвэртэй байдлыг дараах 4 хэмжээсээр үнэлнэ. Үүнд: ',
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
            'Ажил → Гэр чиглэлд ирэх эерэг (+) нөлөө ',
            'Гэр → Ажил чиглэлд очих эерэг (+) нөлөө',
            'Ажил →Гэр чиглэлд ирэх сөрөг (-) нөлөө',
            'Гэр → Ажил чиглэлд очих сөрөг (-) нөлөө ',
          ],
          doc.x + 20,
          doc.y,
          {
            align: 'justify',
            // bulletRadius: 1.5,
            columnGap: 8,
            listType: 'numbered',
          },
        )
        .moveDown(0.2);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн тухай');
      doc.x = marginX;
      doc.image(assetPath(`icons/worklife2`), {
        width: doc.page.width - marginX * 2,
      });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажил, амьдралын хоёр талбар нь хоорондоо үргэлж харин харилцан үйлчлэлд оршдог. Хэрэв хүн ар гэр, гэр бүлийн талбарт асуудалтай, улмаар энэ асуудлууд нь ажлаа хийхэд нь сөрөг нөлөө үзүүлдэг бол энэхүү ажил дээр үүссэн стресс, бухимдал нь эргээд гэрт чиглэсэн сөрөг нөлөөллийг давхар үзүүлж, “сөрөг эргэх мөчлөг”-ийг бий болгодог. Үүнтэй адилаар ажил, амьдралын хоорондох эерэг нөлөөлөл ч мөн адил “эерэг эргэх мөчлөг”-ийг бий болгох боломжтой. Өөрөөр хэлбэл хэрвээ та нөхцөл байдлыг засах ямар нэгэн арга хэмжээ авахгүй бол амьдралын аль нэгэн талбарт үүссэн зөрчил нь бусад талбаруудад нөлөөлж, цаашдаа улам даамжрах, хүндрэх хандлагатай байдаг. Өнөөдөр жижиг санагдаж болох асуудал магадагүй ирээдүйд, урт хугацаанд ноцтой, том үр дагаварт хүргэх боломжтой юм.',
          marginX,
          doc.y + 290,
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
          'Ажил амьдралын тэнцвэр, зөрчил, харилцан хамаарлыг судалдаг олон төрлийн онол загвар, тест, үнэлгээний аргууд байдаг. Үүнээс HRS (одоо бидний ашиглаж буй) болон SWING тестүүд нь Нөлөөлөл - Сэргэлтийн онол (Мейжман ба Мулдер, 1998) дээр үндэслэсэн, ажил амьдралын хоёрын хоорондын харилцан холбоо, эерэг болон сөрөг нөлөөллийг олон талт чиглэлд үнэлдгээрээ бусад аргуудаас давуу талтай. Бидний ашиглаж буй энэхүү тест нь олон улсад түгээмэл хэрэглэгддэг, сайтар судлагдаж баталгаажсан.\n\nАНУ-д хүн амын насжилт, хөгшрөлттэй холбоотой үүсэж буй эрүүл мэнд, нийгмийн асуудлуудыг судлах, шийдэхийн тулд 1992 онд АНУ-ын Үндэсний Насжилт Судлалын Хүрээлэн, Нийгмийн Халамжийн Хэлтэсийн санхүүжилт, дэмжлэгтэйгээр Мичиганы Их Сургуулийн Нийгэм Судлалын Төв дээр анхны судалгааг эхэлсэн байдаг. Үүнээс хойш хүн амын эрүүл мэнд, тэтгэврийн нөхцөл байдлыг судлах судалгаа нь тасралтгүй үргэлжилж буй бөгөөд өдгөө 20,000-30,000 гаруй хүнийг тогмтол хамруулдаг, энэ чиглэлийн дэлхий дээрх хамгийн том судалгаа, мэдээллийн сан болж өргөжин тэлсэн байна. Энэхүү судалгаа нь хүн амын насжилт, эрүүл мэндийн байдлыг олон талаас нь цогцоор нь авч судалдаг бөгөөд ажил амьдралын тэнцвэр нь судалгааны нэг чухал хэсэг нь болж орсон байдаг. ',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!\n\nБидний ашиглаж буй тестийн хувилбар нь ямар нэгэн зохиогчийн болон худалдааны эрхийг зөрчөөгүй болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн оноог зөв тайлбарлах');
      doc.strokeColor(colors.black);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн оноог бүлэг буюу чиглэл тус бүрээр тооцож, тайлагнана. Тестийн үр дүнг илүү ойлгомжтой тайлбарлахын тулд дараах ангиллын системийг ашиглалаа. Тухайлбал: Хэрэв та тест бөглөөд “Гэрээс ажилд чиглэх эерэг нөлөөлөл” чиглэлд 10 оноо авсан бол энэ нь "Их буюу хэвийн” түвшнийг заах бөгөөд таны хувьд ар гэр, хувийн амьдралаас ажилд үзүүлэх нөлөө нь хүчтэй эерэг буйг илэрхийлж байгаа юм. Хялбаршуулсан онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу.',
          { align: 'justify' },
        )
        .moveDown(0.75);
      const table = [
        {
          group: 'Эерэг нөлөөлөл',
          rows: [
            { score: '3-5.99', label: 'Бага' },
            { score: '6-8.99', label: 'Дунд' },
            { score: '9-12', label: 'Их буюу хэвийн' },
          ],
        },
        {
          group: 'Сөрөг нөлөөлөл',
          rows: [
            { score: '3-5.99', label: 'Бага буюу хэвийн' },
            { score: '6-8.99', label: 'Дунд' },
            { score: '9-12', label: 'Их' },
          ],
        },
      ];

      const tableWidth = doc.page.width - marginX * 2;
      const colWidths = [
        tableWidth * 0.33,
        tableWidth * 0.17,
        tableWidth * 0.5,
      ];
      const rowHeight = 18;

      let x = marginX;
      let y = doc.y;

      const headers = ['Нөлөөллийн утга', 'Оноо', 'Ангилал'];
      for (let i = 0; i < headers.length; i++) {
        doc.rect(x, y, colWidths[i], rowHeight).stroke();
        doc
          .font(fontBold)
          .fontSize(12)
          .text(headers[i], x + 5, y + 5, {
            width: colWidths[i] - 10,
            align: 'center',
          });
        x += colWidths[i];
      }
      y += rowHeight;

      for (const group of table) {
        const groupHeight = group.rows.length * rowHeight;

        doc.rect(marginX, y, colWidths[0], groupHeight).stroke();
        doc
          .font(fontBold)
          .text(group.group, marginX + 5, y + groupHeight / 2 - 6, {
            width: colWidths[0] - 10,
            align: 'center',
          });

        let rowY = y;
        for (const r of group.rows) {
          doc
            .rect(marginX + colWidths[0], rowY, colWidths[1], rowHeight)
            .stroke();
          doc
            .font(fontNormal)
            .text(r.score, marginX + colWidths[0] + 5, rowY + 5, {
              width: colWidths[1] - 10,
              align: 'center',
            });

          doc
            .rect(
              marginX + colWidths[0] + colWidths[1],
              rowY,
              colWidths[2],
              rowHeight,
            )
            .stroke();
          doc.text(
            r.label,
            marginX + colWidths[0] + colWidths[1] + 5,
            rowY + 5,
            {
              width: colWidths[2] - 10,
              align: 'center',
            },
          );

          rowY += rowHeight;
        }

        y += groupHeight;
      }
      doc.x = marginX;

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Зөвхөн ганцхан төрлийн нөлөөлөл илрэхгүй. ',
          marginX,
          doc.y + 15,
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хүн бүр ажил -> гэр, гэр -> ажил чиглэлд эерэг болон сөрөг нөлөөлөлд нэгэн зэрэг, тогтмол өртөж байдаг. Өөрөөр хэлбэл эдгээр нөлөөллийн зөвхөн аль нэг нь л дангаараа илэрнэ гэсэн ойлголт байхгүй, харин эдгээр нөлөөллийн аль нэг нь бусдаасаа илүү давамгайлж илэрч болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Ажил амьдралын тэнцвэрт байдал нь хувь хүний сэтгэл зүйн байдал, сэтгэцийн эрүүл мэндийн байдлыг бүхэлд нь илэрхийлэхгүй. ',
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэдийгээр энэхүү ажил амьдралын тэнцвэрт байдал нь бидэнд хувийн менежмент, зохион байгуулалт, цаг төлөвлөлт, ерөнхий ажлын ачаалал байдал, сэтгэл зүйн эрүүл мэндийн талаар үнэ цэнтэй мэдээлэл өгдөг ч энэхүү тест нь тэнцвэр алдагдсанаас цаашдаа үүдэн гарч болох сэтгэл зүй, сэтгэцийн эрүүл мэндийн хүндрэлүүдийг үнэлэхгүй. Хэрвээ таны хувьд эдгээр мэдээлэл хэрэгтэй, энэ талаар мөн сонирхож буй бол “Сэтгэцийн тулгамдсан асуудлыг илрүүлэх сорил”, “Ажлаас халшрах хам шинжийг үнэлэх тест”, “Ажлын байрны сэтгэл ханамжийг үнэлэх тест”, “Ажлын байран дээрх оффисын улс төржилтийг үнэлэх тест” болон бусад стресс, сэтгэл түгшилтийг үнэлэх тестүүдийг давхар бөглөхийг санал болгож байна.',
          { align: 'justify' },
        )
        .moveDown(0.5);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажил амьдралын тэнцвэрт байдлын 4-н чиглэлд тус бүрд харгалзах оноог тооцоолж дараах графикт үзүүлэв. Хамгийн өндөр оноотой үр дүн нь танд ирж буй хамгийн том нөлөөллийг илэрхийлж буй бол дараа дараагийн хамгийн өндөр оноо нь дараачийн хүчтэй илэрч буй нөлөөллүүдийг заана.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];
      const results = [];
      const worktohome = [];
      const hometowork = [];

      const max = details.reduce(
        (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
        details[0],
      );

      for (const detail of details) {
        const isPositive = detail.value.includes('эерэг');
        const isHomeToWork = detail.value.includes('Гэрээс ажилд');
        const isWorkToHome = detail.value.includes('Ажлаас гэрт');

        const value = isPositive ? +detail.cause : -detail.cause;

        if (isHomeToWork) {
          if (isPositive) {
            hometowork[0] = value;
          } else {
            hometowork[1] = value;
          }
        }

        if (isWorkToHome) {
          if (isPositive) {
            worktohome[0] = value;
          } else {
            worktohome[1] = value;
          }
        }

        indicator.push({
          name: detail.value,
          max: +max.cause,
        });

        data.push(+detail.cause);
        results.push({
          ...result,
          point: +detail.cause,
          value: detail.value,
        });
      }

      console.log(details);

      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90, progressive: false })
        .toBuffer();
      doc.image(jpeg, 75, doc.y + 10, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 5;
      let x2 = doc.x + (doc.page.width / 8) * 1.75 - marginX;

      y = doc.y + 70;
      const pointSize = (width / 20) * 7;
      const indexSize = (width / 20) * 1;
      const nameSize = (width / 20) * 12;
      doc.font(fontBold).fillColor(colors.black).text(`№`, x2, y);
      doc.text('Хэв шинж', x2 + indexSize * 3, y);
      const pointWidth = doc.widthOfString(`Оноо`);
      doc.text(
        `Оноо`,
        x2 + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
        y,
      );
      doc.y += 7;
      doc
        .moveTo(x2, doc.y)
        .strokeColor(colors.orange)
        .lineTo(
          x2 + indexSize + nameSize + pointSize / 2 + pointWidth / 2,
          doc.y,
        )
        .stroke();
      doc.y += 9;
      results.map((res, i) => {
        y = doc.y;

        const color = colors.black;

        doc
          .font(fontNormal)
          .fillColor(color)
          .text(`${i + 1}.`, x2, y);
        const name = res.value;
        doc.text(name, x2 + indexSize * 3, y);
        const pointWidth = doc.widthOfString(`${res.point}`);
        doc.text(
          `${res.point}`,
          x2 + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
          y,
        );
        doc.y += 5;
      });
      doc.fillColor(colors.black);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Ажлаас гэрт ирэх нөлөөлөл');

      const pageWidth = doc.page.width;
      const pageMargin = marginX;
      const colWidth = pageWidth / 2.2;

      const bar = await this.vis.createNegativeBarChart(
        [
          'Ажлаас гэрт чиглэх эерэг нөлөөлөл',
          'Ажлаас гэрт чиглэх сөрөг нөлөөлөл',
        ],
        worktohome,
      );

      let barjpeg = await sharp(bar)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90 })
        .toBuffer();

      const chartTop = doc.y;

      doc.image(barjpeg, pageMargin, chartTop, {
        width: colWidth,
      });

      const rightX = pageMargin + colWidth + 20;
      doc.y = chartTop;

      doc.image(assetPath(`icons/worklife3`), rightX + 10, doc.y, {
        width: 200,
      });
      doc.moveDown(11);

      function getLevelLabel(score: number, isPositive: boolean) {
        const val = Math.abs(score);

        if (isPositive) {
          if (val >= 3 && val <= 5.99) return 'БАГА ТҮВШИНД';
          if (val >= 6 && val <= 8.99) return 'ДУНД ТҮВШИНД';
          return 'ИХ БУЮУ ХЭВИЙН';
        } else {
          if (val >= 3 && val <= 5.99) return 'БАГА БУЮУ ХЭВИЙН';
          if (val >= 6 && val <= 8.99) return 'ДУНД ТҮВШИНД';
          return 'ИХ ТҮВШИНД';
        }
      }

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны ажлаас гэрт чиглэх эерэг нөлөөлөл ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(`${worktohome[0]}`, doc.x, doc.y, { continued: true })
        .font(fontNormal)
        .fillColor(colors.black)
        .text(' буюу ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(getLevelLabel(worktohome[0], true), doc.x, doc.y, {
          continued: false,
        })
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны ажлаас гэрт чиглэх сөрөг нөлөөлөл ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(`${worktohome[1]}`, doc.x, doc.y, { continued: true })
        .font(fontNormal)
        .fillColor(colors.black)
        .text(' буюу ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(getLevelLabel(worktohome[1], false), doc.x, doc.y, {
          continued: false,
        })
        .moveDown(2);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Эрүүл мэнд, хувийн амьдралд үзүүлэх нөлөө. ', marginX, doc.y, {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Бусад хүмүүстэй харьцуулахад ажил амьдралын хувьд зөрчилтэй хүмүүсийн хувьд сэтгэл гутрал, сэтгэл түгшүүр, архаг ядаргаа, ажлаас халшрах хам шинжид илүү ихээр өртдөг, ажил, амьдралдаа сэтгэл ханамжгүй байх, ажлын бүтээмж, гүйцэтгэл багатай байх нь түгээмэл. Мөн түүнчлэн нойрны чанар муудах, артерийн даралт ихсэх, цусанд холестерин, өөх тосны хэмжээ ихсэх, цаашлаад зүрх судас, дотоод шүүрлийн өвчнөөр өвдөх зэрэг олон эрсдэлүүдэд өртөх магадлалтай  (Мейер, & Спектор, 2019).\n\nУлмаар удаан хугацааны туршид зөрчилтэй явах нь архи, тамхи хэрэглэх, төрөл бүрийн мансууруулах бодис, эмийн донтолтод өртөх, эрүүл бус хооллолтын зуршилтай болох, хөдөлгөөний дутагдалд орох, таргалах зэрэг олон сөрөг дадал зуршилтай болоход хөтөлдөг.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Ар гэр, гэр бүлд үзүүлэх нөлөө. ', marginX, doc.y, {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэрэв та ажил амьдралын тэнцвэрээ алдсан бол энэ нь цаашлаад таны эхнэр/нөхөр, хайр дурлалын амьдралд ч олон талаар нөлөөлж болно. Тухайлбал, тэнцвэргүй байдлаас шалтгаалж хосуудын харилцаа хөрөх, харилцаанаас авах сэтгэл ханамж буурдаг байна (Юсел ба Латшоу, 2020). ',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Ажлаас гэрт ирэх нөлөөлөл');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Эцэг эхийн ажил мэргэжлийн байдал хүүхдүүдийн сэтгэл зүй, зан төлөвт нөлөөлдөг талаар онол судалгаа, баримтууд бий. Тухайлбал, аавуудын гэртээ хүүхэдтэйгээ байх цаг багасах, хэдийгээр гэртээ байсан ч гэртээ ажлаа хийдэг бол хүүхдэд нь сэтгэл зүй, зан төлөвийн асуудлууд үүсэх, хүүхэд өөрийн сэтгэл хөдлөлөө хянах, удирдах тал дээр дутагдалтай байх магадлал ихэсдэг байна (Фридман, 2018).',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Ажлаас гэрт ирэх нөлөөлөл нь буцаад гэрээс ажилд очиж нөлөөлдөг. ',
          marginX,
          doc.y,
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэрвээ хосуудын нэгэнд нь ямар нэгэн хэлбэрээр зөрчил үүссэн бол энэ нь нөгөө хүнийхээ ажлаа хийх арга барил, ажлын бүтээмжид ч сөргөөр нөлөөлж болно. Харин үүний эсрэгээр хэрэв та ажил дээрээ эсвэл гэртээ “эерэг” нөлөөллийг авдаг бол энэ нь мөн адил таны хосод, хамтран амьдрагчид эергээр нөлөөлж, стрессийг бууруулж, харилцаанаас авах сэтгэл ханамжийг ихэсгэдэг байна (Хаммер, 2005). ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text(
          'Хэрвээ таны ажил амьдралын тэнцвэрт байдал алдагдсан бол дараах аргуудыг хэрэглэж үзээрэй. ',
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Интернэтээ салгаарай. 24 цагийн тасралтгүй интернэт, технологи, утасны хэт их хэрэглээ нь заримдаа бидний хувийн амьдралд сөргөөр нөлөөлж болзошгүй. Тиймээс хэрвээ боломжтой бол өдрийн тодорхой цагт интернэт, утасны хэрэглээнээс өөрийгөө салгаж, тодорхой цагийг зөвхөн өөртөө, гэр бүлдээ зарцуулахад анхаараарай.',
            'Ажил үүргээ хуваарилаарай. Гэрийн ажил үүргээ жигд хуваарилж, дүрмээ тодорхой зааж өгөх нь ирээдүйд гарч болох үйл ойлголцол, зөрчлөөс сэргийлэхэд тустай. ',
            'Ажил, гэр хоёрын хооронд жижиг зай гаргаарай. Ажлын дараа богинохон хугацаанд завсарлага авч, алхах, хөгжим сонсох, таавар таах зэрэг хөнгөхөн, хөгжилтэй зүйлс хийгээд үзээрэй.  ',
            'Идэвхтэй байгаарай. Тогтмол дасгал хөдөлгөөн хийх нь стрессийг бууруулж, сэтгэл гутрал, түгшүүр үүсэхээс сэргийлж, дасан зохицох чадварыг сайжруулах зэрэг олон төрлийн ашигтай. Ердөө 15 минут дасгал хийхэд л та илүү эрч хүч, сэргэсэн мэдрэмж авах болно. ',
            'Бусдаас туслалцаа аваарай. Найз нөхөд, гэр бүлийнхэнтэйгээ уулзаж, ярилцах, шаардлагатай үед туслалцаа, дэмжлэг авах нь амьдралын тэнцвэрийг хадгалахад чухал үүрэгтэй. ',
            '“Үгүй” гэж хэлж сураарай. Бид ажил, гэр бүлээс гадна нийгэм, хүрээлэлдээ ч мөн олон төрлийн үүрэг, даалгаврыг давхар биелүүлэх шаардлагатай байдаг. Зарим үед та өөрт хамгийн чухал зүйлсийг авч үлдээд бусдад нь “үгүй” эсвэл "дараа" гэж хэлж сураарай.',
            // 'Мэргэжлийн тусламж аваарай. Хэрэв танд үргэлж ажил амьдралын тэнцвэр алдагдсан мэдрэмж төрдөг, хэт ачаалалтай байдаг бол магадгүй та сэтгэл зүйчид хандаж мэргэжлийн тусламж үйлчилгээ авч болох юм. Эрүүл мэнд, сэтгэл зүйн сайн сайхныхаа төлөө алхам хийх нь сул доройн шинж биш харин ч өөрийнхөө төлөө хийж буй зоригтой үйлдэл гэдгийг санаарай (Канадын Сэтгэцийн Эрүүл Мэнд Судлалын Холбоо, 2025; Сэтгэцийн Эрүүл Мэнд ба Америк, ТББ, 2025).',
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
      header(doc, firstname, lastname, service, 'Гэрээс ажилд очих нөлөөлөл');

      const bar2 = await this.vis.createNegativeBarChart(
        [
          'Гэрээс ажилд чиглэх эерэг нөлөөлөл',
          'Гэрээс ажилд чиглэх сөрөг нөлөөлөл',
        ],
        hometowork,
      );

      let barjpeg2 = await sharp(bar2)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90 })
        .toBuffer();

      doc.image(barjpeg2, pageMargin, chartTop, {
        width: colWidth,
      });

      doc.y = chartTop;

      doc.image(assetPath(`icons/worklife4`), rightX + 10, doc.y, {
        width: 200,
      });
      doc.moveDown(11);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны гэрээс ажилд чиглэх эерэг нөлөөлөл ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(`${hometowork[0]}`, doc.x, doc.y, { continued: true })
        .font(fontNormal)
        .fillColor(colors.black)
        .text(' буюу ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(getLevelLabel(hometowork[0], true), doc.x, doc.y, {
          continued: false,
        })
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны гэрээс ажилд чиглэх сөрөг нөлөөлөл ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(`${hometowork[1]}`, doc.x, doc.y, { continued: true })
        .font(fontNormal)
        .fillColor(colors.black)
        .text(' буюу ', rightX, doc.y, {
          align: 'justify',
          continued: true,
        })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(getLevelLabel(hometowork[1], false), doc.x, doc.y, {
          continued: false,
        })
        .moveDown(2);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Ажлын бүтээмжид үзүүлэх нөлөө. ', marginX, doc.y, {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажил, мэргэжлийн талаас тэнцвэргүй байдал нь ажлын гүйцэтгэл, бүтээмж, ажил дээрх сэтгэл ханамжийг бууруулж, санаачилга ба оролцоотой байдалд сөргөөр нөлөөлдөг. Цаашлаад ажил таслалт, ажлаас чөлөө авах байдлыг нэмэгдүүлж, өөрийн ажил мэргэжлийн сонголт, карьерт эргэлзэх эргэлзээг төрүүлдэг. Судалгаагаар нэг ажилтанд үүссэн сэтгэл зүйн таагүй байдал бусад хамт ажиллагчдад хүртэл тархан нөлөөлдөг байна. Тиймээс байгууллагын талаас ч мөн адил ажилчдынхаа ажил амьдралын тэнцвэрт байдалд анхаарч ажиллах нь зүйтэй юм (Амстад ба Семмер, 2011).',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Ажлын байран дээрх эрүүл мэнд, сэтгэл зүйд үзүүлэх нөлөө. ',
          marginX,
          doc.y,
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажил, амьдралын тэнцвэрийг зохистой түвшинд хадгалах нь олон талын ашиг тустай бөгөөд ажилчдын сэтгэл зүй, бие махбодын эрүүл мэндэд мэдэгдэхүйц эергээр нөлөөлдөг. Тэнцвэрт байдлаа хадгалсан хүмүүс ажилдаа илүү сэтгэл ханамжтай ханддаг, аюулгүй байдлыг мэдэрдэг, стресс багатай байдаг.\n\nАжилчдын дундах ажил, амьдралын эрүүл тэнцвэртэй байдал нь ажил олгогчдод ч мөн адил олон талын ашигтай. Тухайлбал, ажилчдын ажил, амьдралын тэнцвэрт байдлыг дэмжих бодлого, хөтөлбөр хэрэгжүүлдэг бизнесийн байгууллага дээр хүмүүс илүү ажилд',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Гэрээс ажилд очих нөлөөлөл');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'орох, цаашид үргэлжлүүлэн урт хугацаагаар ажиллах хандлага их байдаг бөгөөд ажил хоцролт, таслалт мөн харьцангуй бага байдаг аж (Уильямс нар, 2000).\n\nХарин эсрэгээрээ тэнцвэртэй байдлаа алдсан ажилчдын дунд ажлын сэтгэл ханамж бага, стресс, сэтгэл гутрал, сэтгэл түгшил болон мансууруулах бодист донтох, архи согтууруулах ундааг хэтрүүлэн хэрэглэх үзэгдэл өндөр байдаг нь тогтоогджээ. Судалгаанд өгүүлснээр хэт их ажлын ачаалал, урт ажлын цаг (долоо хоногт 48-н цагаас дээш) нь ажил, амьдралын тэнцвэрийг алдагдуулдаг, зөрчлийг үүсгэдэг хамгийн гол хүчин зүйл гэжээ(Фаган нар, 2012).',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Байгууллагад үзүүлэх нөлөө. ', marginX, doc.y, {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хэдийгээр байгууллагын түвшинд ажлын байрнаас гадуур үүссэн хүмүүсийн хувийн амьдралын зөрчлийг хянаж чадахгүй ч эерэг ажлын орчин нөхцөл, уур амьсгалыг бүрдүүлэх, эсвэл төрөл бүрийн дэмжих хөтөлбөр хэрэгжүүлж цаашид үүсэж болох эрсдэлийг бууруулах боломжтой.\n\nАжилтнуудынхаа ажил, амьдралын тэнцвэртэй байдлыг анхаардаг, илүү уян хатан ажиллах нөхцөл бололцоогоор хангадаг аж ахуй нэгжүүдийн ажилчид илүү бүтээмж, гүйцэтгэл өндөртэй, урам зоригтой, санаачилга оролцоотой, ажилдаа төвлөрч ажилладаг байна.  Тухайлбал, ажилчдын ачаалал, ажиллах цагыг багасгах үед илүү өндөр бүтээмжтэй, үр ашигтай ажилдаг болохыг судалж тогтоожээ (Льюис 1997).\n\nХөтөлбөрүүдээс гадна, байгууллага дээр удирдлага, манлайллын нөлөө мөн чухал. Ажилтынхаа сэтгэл зүйн хэрэгцээг ойлгож чаддаг, урам зориг өгч өдөөдөг, ажилтнууддаа тодорхой хувийн эрх чөлөө, орон зайгаар хангаж чаддаг менежер, манлайлагчдын ур чадвар бас чухал ач холбогдолтой.\n\nЭцэст нь дурдахгүй өнгөрч болохгүй нэг зүйл бол байгууллын соёл, үнэт зүйл юм. Илүү нөхөрсөг, бие биеэ тусалж дэмждэг соёлыг чухалчилсан байгууллагын ажилчдад ажил, амьдралын тэнцвэр алдагдах нь бага бол харин илүү өрсөлдөөнд суурилсан соёлтой газар эсрэгээрээ өндөр байдаг. ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text(
          'Хэрвээ таны ажил амьдралын тэнцвэрт байдал алдагдсан бол дараах аргуудыг хэрэглэж үзээрэй.',
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Завсарлага аваарай. Ажлынхаа дундуур богино хугацааны түр завсарлага авах нь стрессийг бууруулж, сэргэлт авахад тусалдаг. Хэрвээ шаардлагатай бол ажлаасаа түр амралт авч болно. Таны эрүүл мэнд, сэтгэл зүй, ажил, амьдралын хоорондын тэнцвэрт байдал ч мөн адил чухал гэдгийг санаарай. ',
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
      header(doc, firstname, lastname, service, 'Гэрээс ажилд очих нөлөөлөл');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .list(
          [
            'Ажлаа төлөвлөөрэй. Хийх ажлаа өмнөх өдөр нь эсвэл өглөө эрт төлөвлөж, чухал хийгдэх ёстой ажлуудын жагсаалт гаргаарай. Төлөвлөгөө гаргахдаа бодитоор харж, цаг хугацаа, ачааллын хувьд тохирсон, хийх боломжтой төлөвлөгөө гаргахад анхаараарай. ',

            'Ажил, гэр хоёрын хооронд жижиг зай гаргаарай. Ажлын дараа богинохон хугацаанд завсарлага авч, алхах, хөгжим сонсох, таавар таах зэрэг хөнгөхөн, хөгжилтэй зүйлс хийгээд үзээрэй.  ',
            'Ажлаа жижиг зорилтуудад хуваагаарай. Бид хяналтыг гартаа авсан мэдрэмж авах нь чухал байдаг бөгөөд энэ үед бид илүү стресс багатай байдгийг судалж тогтоожээ. Тиймээс ажлаа сайтар төлөвлөж, урт хугацаа шаардах томоохон ажлуудыг жижиг хэсгүүдэд хувааж байх нь чухал юм. Ялангуяа, та хэрвээ ажлаа хойш нь тавих зуршилтай бол, жижиг зорилтуудыг тавьж, алхам алхмаар урагшлах нь нэг мэдэхэд ажлууд овоорч, ажлаасаа халшрах мэдрэмж үүсэхээс сэргийлнэ.',
            'Шуудангаа шалгахад тусад нь цаг гаргаарай. Бид өөрсдөө ч анзааралгүйгээр цахим шуудан, мэйл бүрийг шалгах, буцаагаад хариу өгөх зэрэг энгийн ажилд маш их цаг зарцуулдаг. Тиймээс та өдөрт тодорхой цагт, зөвхөн нэг эсвэл хоёр удаад л цахим шуудангуудаа шалгах төлөвлөгөө зохиож болох юм. ',
            'Ажил, амьдралын заагийг нарийн тодорхойл. Ажлын бус цагаар аль болох утас, цахим төхөөрөмжүүдээс хөндийрч, амралт авч байхыг хичээгээрэй.',
            'Менежер, удирдлагатайгаа ярилцаарай. Хэрвээ танд хэт их ачаалалтай, ажил чинь хяналтаас гарсан мэт санагдаж байвал удирдлагатайгаа чөлөөтэй ярилцаж, зарим ажлаа өөр хүнд шилжүүлэх, эсвэл илүү уян хатан ажиллах боломжтой эсэх талаар асууж болно. Заримдаа үнэхээр хэцүү тохиолдолд "боломжгүй байна" гэж хэлж сурах нь хоорондоо харилцан ойлголцож, баг дотроо ачааллаа зөв хуваарилахад хэрэгтэй байдаг гэдгийг санаарай. ',
            'Бусдаас  тусламж аваарай. Найз нөхөд, хамт ажиллагсад, эсвэл удирдлагатайгаа нээлттэй харилцаатай байж, хэрэгтэй үед тусламж аваарай. Хэрвээ таны хувьд бүх зүйл хяналтаас гарсан мэдрэмж төрч, сэтгэл зүйн хувьд хэцүү, дарамттай санагдаж байгаа, энэ байдал удаан үргэлжилж буй бол магадгүй мэргэжлийн сэтгэл зүйчийн туслалцаа авах цаг болсон байж магадгүй юм (Канадын Сэтгэцийн Эрүүл Мэнд Судлалын Холбоо, 2025; Сэтгэцийн Эрүүл Мэнд ба Америк, ТББ, 2025).   ',
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
      header(doc, firstname, lastname, service, 'Ашигласан эх сурвалж');
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Amstad, F., Meier, L., Fasel, U., Elfering, A., & Semmer, N. (2011). A meta-analysis of work-family conflict and various outcomes with a special emphasis on cross-domain versus matching domain relations. Journal of Occupational Health Psychology, 16(2), 151–169.\n\nCanadian Centre for Occupational Health and Safety. (2022). Work-life balance. Retrieved from https://www.ccohs.ca/\n\nCanadian Mental Health Association. (2025). Work-life balance: Make it your business. Retrieved from https://cmha.ca/\n\nFagan, C., Lyonette, C., Smith, M. and Saldaña-Tejeda, A. (2012). The influence of working time arrangements on work-life integration or ‘balance’: A review of the international evidence.\n\nGalizzi, M.M. and Whitmarsh, L. (2019). How to measure behavioral spillovers: a methodological review and checklist. Frontiers in Psychology, 10, 342.\n\nGreenhaus, J.H. and Beutell, N.J. (1985). Sources of conflict between work and family roles. Academy of Management Review, 10(1), 76-88.\n\nKelly, E., Kopssek, E.E., Hammer, L.B., Durham, M., Bray, J., Chermack, K., & Kaskubar, D. (2008). Getting there from here: Research on the effects of work–family initiatives on work-family conflict and business outcomes. Academy of Management Annuals, 22(1), 305–349.\n\nLapierre, L.M., Li, Y., Kwan, H.K., Greenhaus, J.H., DiRenzo, M.S. and Shao, P. (2018). A meta-analysis of the antecedents of work–family enrichment. Journal of Organizational Behavior, 39(4), 385-401.\n\nLewis, J. (2009). Work–family balance, gender and policy. In Work–Family Balance, Gender and Policy. Edward Elgar Publishing.\n\nMeier, L.L. and Spector, P.E. (2013). Reciprocal effects of work stressors and counterproductive work behavior: a five-wave longitudinal study. Journal of Applied Psychology, 98(3), 529.\n\nMental Health America. (2025). Work life balance. Retrieved from https://mhanational.org/',
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Ашигласан эх сурвалж');
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Mulder, G., Mulder, L.J., Meijman, T.F., Veldman, J.B. and van Roon, A.M. (2000). A psychophysiological approach to working conditions. Engineering Psychophysiology: Issues and Applications, 139-159.\n\nPwC. (2016). Work-life 3.0: Understanding how we’ll work next. Retrieved from https://www.pwc.com/\n\nSteele, L.S., Dewa, C.S., Lin, E. and Lee, K.L. (2007). Education level, income level and mental health services use in Canada: associations and policy implications. Healthcare Policy, 3(1), 96.\n\nWilliams, J.C., Berdahl, J.L. and Vandello, J.A. (2016). Beyond work-life “integration”. Annual Review of Psychology, 67(1), 515-539.\n\nYucel, D., & Latshaw, B. (2020). Spillover and crossover effects of work-family conflict among married and cohabitating couples. Society and Mental Health, 10(1), 35–60.',
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);
      footer(doc);
    } catch (error) {
      console.log('worklifebalance', error);
    }
  }
}
