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
import { AssetsService } from 'src/assets_service/assets.service';
import { VisualizationService } from '../visualization.service';
@Injectable()
export class GSE {
  constructor(
    private single: SinglePdf,
    private vis: VisualizationService,
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
          'Хүнд саад бэрхшээл, шинэ сорилт, орчин нөхцөлтэй нүүр тулгарсан ч асуудлыг шийдвэрлэж, даван туулж чадна, амжилтад хүрж чадна гэсэн итгэлийг "Өөртөө итгэх итгэх" буюу "Өөрийн чадварт итгэх итгэл" гэж ерөнхийд нь тодорхойлдог. Энэхүү нь "Би сайн хүн" гэсэн үзлээс илүүтэй "Би өөрт тулгарсан асуудлуудаа өөрөө шийдвэрлэж чадна" гэсэн, өөрийн нөөц бололцоо, ур чадвартаа итгэх итгэл юм.\n\nСудлаачдын тогтоосноор өөртөө итгэх чадвар өндөртэй хүмүүс бусад хүмүүстэй харьцуулахад стресс, сэтгэл зүйн дарамтыг даван туулахдаа сайн, илүү эрүүл зөв дадал зуршилтай, амьдралын чанар, ажлын бүтээмж өндөртэй байдаг байна. Харин эсрэгээрээ өөртөө итгэх итгэл харьцангуй сул хүмүүсийн дунд ирээдүйдээ итгэх итгэлгүй, сэтгэл гутрал, сэтгэл түгшилттэй байх магадлал өндөр, ажлын гүйцэтгэл, бүтээмж бага байх хандлагатай байдаг байна.\n\nӨөртөө итгэх итгэл гэсэн ойлголт, онолыг Стэйнфорд их сургуулийн алдарт сэтгэл судлаач Альберт Бандура 1977 онд анх дэвшүүлсэн байдаг. Уг онолын дагуу хүний итгэл үнэмшил нь хүн хэрхэн бодож сэтгэж, мэдэрч, үйлдэл хийхийг удирдан залж, нөлөөлдөг хүчтэй, суурь ухагдахуун гэж үздэг. Энэхүү онол дээр суурилж, Германы сэтгэл судлаач Ральф Шварцер, Маттиас Иерусалем нар 1981 онд "Өөртөө итгэх итгэлийн тест (GSE)" -ийг боловсруулсан нь өдгөө дэлхийн 30 гаруй хэл дээр орчуулагдаж, энэ чиглэлд "алтан стандарт" гэж үнэлэгддэг тест болжээ.\n\nОдоо таны тестийн үр дүнтэй танилцъя.',
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
          'Өөртөө итгэх итгэлийг үнэлдэг олон төрлийн тест, үнэлгээний аргууд байдаг. Бидний одоо ашиглаж буй тест нь Германы сэтгэл судлаач Ральф Шварцер, Маттиас Иерусалем нарын 1981 онд боловсруулсан "Өөртөө итгэх итгэлийн тест (GSE)" юм. Энэхүү тест нь олон улсад түгээмэл ашиглагддаг, дэлхийн 30 гаруй хэл дээр орчуулагдаж, энэ чиглэлд "алтан стандарт" гэж тооцогддог. GSE тест нь хүчин төгөлдөр оношилгооны хэрэгсэл болох нь олон улсад олон дахин батлагдсан. Тухайлбал тестийн урьдчилан таамаглах чадвар, дотоод тогтвортой байдал, найдвартай байдлын үзүүлэлт харьцангуй өндөр байдаг.',
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
          'Тестийн нийт оноо 10-аас 40 хооронд хэлбэлзэх бөгөөд оноо өндөр байх тусам өөртөө итгэх итгэл өндөр буйг илтгэнэ. Жишээ нь: Хэрэв таны тестийн үр дүн 31 оноотой байсан бол өөртөө итгэх итгэл “Харьцангуй өндөр” байна гэж үзнэ. Дэлгэрэнгүй мэдээллийг дараах хүснэгтээс харна уу.',
          { align: 'justify' },
        )
        .moveDown(1);
      const tableData = [
        [
          'Хариултын ангилал',
          'Нийт оноо',
          'Харьцуулсан эрэмбэ буюу перцентиль*',
        ],
        ['Харьцангуй бага', '0-29', '1-50'],
        ['Харьцангуй өндөр', '30-40', '51-100'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [tableWidth * 0.3, tableWidth * 0.2, tableWidth * 0.5]; // 30% / 70% / 30%
      const rowHeight = 18;

      let startX = marginX;
      let startY = doc.y;

      for (let row = 0; row < tableData.length; row++) {
        let x = startX;
        const y = startY + row * rowHeight;

        for (let col = 0; col < tableData[row].length; col++) {
          const colWidth = colWidths[col];

          doc.rect(x, y, colWidth, rowHeight).strokeColor('black').stroke();

          doc
            .font(row === 0 ? fontBold : fontNormal)
            .fontSize(12)
            .fillColor('black')
            .text(tableData[row][col], x + 5, y + 4, {
              width: colWidth - 10,
              align: 'center',
            });

          x += colWidth;
        }
      }

      doc.moveDown(1);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '* - Харьцуулсан эрэмбэ буюу перцентиль гэж юу вэ? Өгөгдлийн сан дахь бусад хүмүүсийн авсан оноонуудтай харьцуулахад таны авсан оноо хаана эрэмбэлэгдэж буйг зааж, 0-100 хооронд байр эзлүүлдэг. Жишээлбэл таны авсан оноо бусад хүмүүстэй харьцуулахад 85-д эрэмбэлэгдэж буй бол та бусад тест бөглөсөн хүмүүсийн 85%-иас нь илүү өндөр оноо авсан гэж тайлбарлагдана. ',
          marginX,
          doc.y,
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      const results = [
        {
          name: 'Харьцангуй бага',
          image: 'gse1',
          intro:
            'Таны оноо нь нийтлэг дунджаас харьцангуй доогуур бөгөөд өөртөө итгэх итгэл бага түвшнийг зааж байна.\n\nШинэ орчин нөхцөлд дасах, өдөр тутамд тулгарах сорилт, бэрхшээлүүдийг даван туулах өөрийн чадварт итгэх итгэл бага, өөртөө эргэлзэх хандлагатай.',
          description:
            'Өөртөө итгэх итгэл бага түвшинд тодорхойлогдсон хүмүүс шинэ сорилт, бэрхшээлийг шинэ зүйл сурах, өсөх "боломж" гэж харахын оронд өөрт нь ирж буй "стресс, дарамт" гэж илүүтэй хүлээж авах хандлагатай байдаг. Энэ үзүүлэлт дээр бага оноотой хүмүүс нь асуудал, бэрхшээлийн сөрөг тал дээр нь илүүтэй төвлөрч, аливаа асуудалд амархан шантрах, бууж өгөх хандлагатай. \n\nТа хэт өндөр зорилго өмнөө тавихаас зайлсхийж эмээдэг, алдсан, бүтэлгүйтсэн үедээ сэтгэл зүйн хувьд буцаад хэвийн байдалдаа орох гэж уддаг байж болох юм. Өөртөө итгэх итгэл багатай байдал нь цаашид таныг архаг стресс, сэтгэл түгшилт, сэтгэл гутралд илүү өртөмтгий болгох эрсдэлтэй.\n\nЭнэ тохиолдолд та "Би чадахгүй" гэсэн сөрөг бодлоо "Би хичээгээд үзье" болгон өөрчлөхөд анхаараад үзээрэй. Өөртөө итгэх итгэлээ нэмэгдүүлэхийн тулд жижиг, биелэгдэж болохуйц зорилтуудыг тавьж болно. Мөн түүнчлэн өөрийгөө илүү зөвөөр үнэлж, өөрийн чадвар чадамжид итгэж сурахын тулд таны сөрөг сэтгэлгээ, итгэл үнэмшил рүү чиглэсэн танин мэдэхүй, зан төрхийн сэтгэл, сэтгэц судлалын мэргэжлийн үйлчилгээ авч болох юм.',
        },
        {
          name: 'Харьцангуй өндөр',
          image: 'gse2',
          intro:
            'Таны авсан оноо нь нийтлэг дунджаас харьцангуй өндөр бөгөөд өөртөө итгэх итгэлийн өндөр түвшнийг зааж байна. \n\nШинэ орчин нөхцөлд дасан зохицох, өдөр тутамд тулгарах сорилт, бэрхшээлүүдийг даван туулах өөрийн чадвартаа итгэлтэй байдаг. ',
          description:
            'Өөртөө итгэх итгэл өндөр түвшинд тодорхойлогдсон хүмүүс шинэ сорилт, бэрхшээлийг шинэ зүйл сурах, өсөх "боломж" гэж өөдрөг, эерэг талаас нь хардаг, өөрийгөө сорих дуртай, өөрийгөө илүү хүлээн зөвшөөрч, өөрийн ур чадвартаа илүүтэй итгэх хандлагатай байдаг. Энэ үзүүлэлт дээр өндөр оноотой хүмүүс нь "Би чадахгүй юм байна" гэж шантрахын оронд "Би илүү их хичээх хэрэгтэй", "Өөр аргаар оролдоод үзье" гэсэн өөдрөг, өсөлтийн сэтгэлгээтэй байх нь олонтой.\n\nСудалгааны үр дүнгүүдээс харахад өөртөө итгэх итгэл өндөр хүмүүс стресс, сэтгэл гутрал, сэтгэл түгшилтэд харьцангуй бага өртдөг, ажил мэргэжил, хувийн амьдралдаа амжилт гаргах магадал өндөртэй, харьцангуй эрүүл дадал зуршилтай байдаг.\n\nГэхдээ хэт өндөр оноо нь нөгөө талаасаа мөн нарциссизм буюу өөрийгөө хэт үнэлэх, хэт өргөмжлөх шинж, зан төрхийг илтгэж харуулж байж магадгүй юм. Тиймээс цаашид энэхүү хэт өндөр оноо нь хэвийн өөртөө итгэх итгэлийн байдал эсвэл нарциссизм хэлбэрийн хэв шинжийн аль нь болохыг ялган салгахын тулд нэмэлт үнэлгээ шаардлагатай байж болно. Энэ тохиолдолд таныг “Хар гурвал (Dark triad)” тест эсвэл “Нарциссист зан төлөвийн тест”-ийг бөглөхийг зөвлөж байна.',
        },
      ];
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
        .text(' буюу өөртөө итгэх итгэл ', marginX, doc.y + 3, {
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
        .text('/' + '40');

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.value, 40, 41, '');

      doc.image(buffer, {
        width: doc.page.width - marginX * 2,
        height: (130 / 1800) * (doc.page.width - marginX * 2),
      });

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн хамгийн бага оноо нь 10, хамгийн дээд оноо нь 40 байх бөгөөд өндөр оноо авах нь өөртөө итгэх итгэл өндөр байгааг илтгэнэ. Дараах графикаас та өөрийн авсан нийт оноог бусад хүмүүстэй харьцуулан дүгнэх боломжтой. ',
          marginX,
          doc.y + 40,
          { align: 'justify' },
        );

      await this.single.examQuartileGraph3(
        doc,
        Number(result.value),
        'Нийт',
        'gse',
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
          'Графикт өмнө нь судалгаанд хамрагдаж байсан хүмүүсийн авсан өөртөө итгэх итгэлийн оноог давтамжаар нь харуулсан. Та өөрийн оноог бусад хүмүүстэй харьцуулан, өөрийгөө хаана буйг эрэмбэлэн харах боломжтой.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      const mindset = results.find((m) => m.name === result.result);

      if (mindset) {
        const imageWidth = 150;
        const imageHeight = 186.5;
        const gap = 20;

        const startX = marginX;
        const startY = doc.y;

        doc.image(service.getAsset(`icons/${mindset.image}`), startX, startY, {
          width: imageWidth,
          height: imageHeight,
        });

        const titleX = startX + imageWidth + 15;
        const titleY = startY + 30;

        doc
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(result.result, titleX, titleY)
          .moveDown(1);
        doc.y;
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(mindset.intro, titleX, doc.y, {
            align: 'justify',
          });

        const fullText = mindset.description;

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(fullText, marginX, doc.y + 45, {
            align: 'justify',
          });
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
          'Хувь хүний хэв шинж, зан төрхийн талаас авч үзвэл, дотогшоо чиглэсэн хэв шинжтэй (интроверт) хүмүүстэй харьцуулахад гадагшаа чиглэсэн (экстроверт) хэв шинжтэй хүмүүсийн дунд өөртөө итгэх итгэл илүү өндөртэй тодорхойдогддог. Харин эсрэгээрээ өөртөө итгэх итгэл багатай хүмүүс илүүтэй сэтгэлийн тогтворгүй байдал (Невротизм) бүхий хэв шинжтэй байх магадлал харьцангуй өндөр байдаг байна.*',
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
          '“Өөрийгөө үнэлэх хувь хүний үндсэн шинж” нь хүний далд ухамсартай, суурь итгэл үнэмшилтэй холбоотой, цаг хугацааны хувьд төдийлөн өөрчлөгддөггүй, хувь хүнд харьцангуй тогтвортой илэрдэг чухал ойлголт юм. Өөрийгөө үнэлэх хувь хүний үндсэн шинжийг ашиглан ажлын байран дээрх сэтгэл ханамж, ажлын гүйцэтгэл, өндөр бүтээмжтэй байдал зэргийг урьдчилан таамаглах боломжтой байдаг, байгууллага, ажил олгогч талаас чухалчлан авч үздэг шинж юм.\n\nӨөрийгөө үнэлэх хувь хүний үндсэн шинжийг бүрдүүлэгч 4-н гол шинжийн нэг нь өөртөө итгэх итгэл юм. Үүнээс гадна өөрийгөө үнэлэх үнэлэмж, сэтгэлийн тогтвортой байдал буюу невротизм, хяналтын төлөв (locus of control) нь энэхүү үндсэн шинж дотор багтдаг.**',
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
          'Эмч, сэтгэл засалч нар энэхүү тестийг олон аргаар ашиглах боломжтой. Тухайлбал тестийг тамхинаас гарах эмчилгээний үр дүнг таамаглах, амьдралд тохиолдсон томоохон өөрчлөлт, мэс заслын дараах амьдралын чанарыг үнэлэх болон хорт зуршил, хүний зан үйл, дадлыг судалж буй үед ашиглах боломжтой.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '* - Хэрвээ та өөрийн хувь хүний хэв шинжээ мэдэхийг хүсвэл цаашид “Үндсэн 5-н хувь хүний хэв шинжийн (Big 5) тест”-ийг бөглөхийг санал болгож байна.\n\n** - Хэрвээ та өөрийгөө үнэлэхтэй холбоотой хувь хүний үндсэн шинжээ мэдэхийг хүсвэл цаашид “Өөрийгөө үнэлэх үнэлэмжийг тодорхойлох тест”, “Үндсэн 5-н хувь хүний хэв шинжийн (Big 5) тест”, “Хяналтыг өөр дээрээ авсан байдлыг тодорхойлох тест (Locus of control)”-үүдийг бөглөхийг санал болгож байна.',
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
        .text('Сэтгэцийн Эрүүл Мэндийн Төвийн мэдээллийн утас: 1800-2000', {
          align: 'center',
        })
        .moveDown(1);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Монгол улсын хэмжээнд олон жилийн туршлагатай мэргэжлийн эмч нар, сэтгэцийн эрүүл мэндийн чиглэлээр 24 цагийн турш зөвлөгөө, мэдээллийг 1800-2000 утсаар дамжуулан энгийн тарифаар, дараах чиглэлүүдээр өгч байна: ',
          {
            align: 'justify',
          },
        )
        .moveDown(1);

      const chipItems = [
        'Нойргүйдэл',
        'Сэтгэл түгшилт',
        'Айдас',
        'Сэтгэл гутрал',
        'Уур бухимдал',
        'Мэдрэл сульдал',
        'Дэлгэцийн донтолт',
        'Архи, тамхи, мансууруулах бодисын хэрэглээтэй холбоотой асуудал',
        'Жирэмсэн үеийн сэтгэл зүйн өөрчлөлт',
        'Төрсний дараах сэтгэл зүйн хямрал, сэтгэл гутрал',
        'Гэмтлийн дараах /хүчтэй стресс/ сэтгэл зүйн хямрал',
        'Ахимаг насны үеийн сэтгэцийн тулгамдсан асуудал',
        'Хүүхдийн сэтгэцийн тулгамдсан асуудал',
      ];

      const chipFontSize = 10;
      const padX = 8,
        padY = 5;
      const chipH = chipFontSize + padY * 2;
      const gapX = 6,
        gapY = 7;
      const maxRight = doc.page.width - marginX;

      doc.font(fontNormal).fontSize(chipFontSize);

      let cx = marginX;
      let cy = doc.y;

      for (const item of chipItems) {
        const tw = doc.widthOfString(item);
        const cw = tw + padX * 2;

        if (cx + cw > maxRight && cx > marginX) {
          cx = marginX;
          cy += chipH + gapY;
        }

        doc
          .roundedRect(cx, cy, cw, chipH, 8)
          .fillAndStroke('#FFF0EB', colors.orange);

        doc
          .fillColor(colors.black)
          .font(fontNormal)
          .fontSize(chipFontSize)
          .text(item, cx + padX, cy + padY + 1, { lineBreak: false });

        cx += cw + gapX;
      }

      doc.y = cy + chipH + 12;
      doc.x = marginX;
      doc.moveDown(1);
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
          'Schwarzer, R., & Jerusalem, M. (1995). Generalized Self-Efficacy scale. In J. Weinman, S. Wright, & M. Johnston, Measures in health psychology: A user’s portfolio. Causal and control beliefs (pp. 35-37). Windsor, UK: NFER-NELSON.\n\nSchwarzer, R. (2014). Everything you wanted to know about the General Self-Efficacy Scale but were afraid to ask. University of Berlin.',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('gse', error);
    }
  }
}
