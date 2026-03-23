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
import { AssetsService } from 'src/assets_service/assets.service';
import { VisualizationService } from '../visualization.service';

const sharp = require('sharp');

@Injectable()
export class RSI {
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
        .text('Оршил', marginX, doc.y)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сүүлийн үеийн судалгааны үр дүнгээс харахад хүмүүсийн унтах цаг улам багасаж байна. АНУ-ын ердийн иргэн дунджаар 6 цаг 40 минут орчим унтдаг, харин хамгийн бага унтдаг хүмүүс нь Япончууд бөгөөд 6 цаг 20 минут л дунджаар унтдаг байна. Орчин үеийн завгүй нийгэмд, хэн бага унтана төдий чинээ илүү их амжилтад хүрдэг гэсэн хандлага ихэнх хүмүүсийн дунд ноёлдог. Гэхдээ сүүлийн үеийн судалгаануудаас үзэхэд энэ нь төөрөгдсөн ойлголт бөгөөд хүн эрүүл аж төрөхийн тулд хоногт 8 хүртэл цаг унтах ёстой ажээ.\n\nУчир нь 5–6 цаг л унтдаг хүмүүсийн дунд олон төрлийн өвчлөл их тохиолдож байгааг судалгаанууд дурдсан байдаг. Бага цаг унтдаг хүмүүсийн дунд даралт ихдэлт, чихрийн шижин, зүрхний титэм судасны өвчин, алцхеймер, сэтгэл гутрал, сэтгэл түгшил, хавдар зэрэг өвчлөл илүү их давтамжтайгаар тохиолддог.\n\nХүний тархинд грелин даавар нь хүний өлсгөлөн мэдрэмж төрүүлж, улам их идэх дуршлыг төрүүлдэг бол харин лептин нь үүний эсрэг үйлчилгээ үзүүлж хүнд цатгалан мэдрэмж төрүүлдэг. Нойр дутуу авах нь грелин дааврыг ялгаралтыг илүү сэдээснээр хүн өдөрт 300-аас 500 ккал илчлэгийг илүү хэмжээгээр авдаг байна. Дутуу нойр авах нь дан ганц их хэмжээгээр идэхэд хүргээд зогсоохгүй, уураг бүхий хүнснээс татгалзаж эсрэгээрээ илүү их чихэрлэг хүнс хэрэглэх хүслийг өдөөж, таргалалт үүсэхэд ихээхэн нөлөөлдөг байна. Нэг өдөрт 4 цагаас бага унтахад дараагийн өдөрт нь хүний дархлаа тогтолцооны систем, тэр дундаа гаднын биетийн эсрэг анхан шатны, чухал хоригийн үүрэг гүйцэтгэдэг дархлааны NK эсийн тоо 70%-аар буурч, ханиад хүрэх магадлал 3 дахин нэмэгддэг гэсэн судалгааны үр дүн бас байдаг.\n\nХүний тархи сэрүүн үед олон хорт бодис ялгаруулдаг бөгөөд хүн унтаж байх үед эдгээр бодис нь биеэс зайлуулагдах байх ёстой. Сэрүүн үед хүний тархинд  бета-амилойд гэдэг бодис хуримтлагддаг бөгөөд энэ нь Алцхеймер өвчин үүсгэгч гол бодис гэж үздэг юм.\n\nНойргүйдлээс болж үүсэж байгаа энэ бүх эрүүл мэндийн зардлаа арилгаж чадвал АНУ жилдээ боловсролд зарцуулж буй хөрөнгө оруулалтаа 2 дахин нэмэгдүүлж чадна гэсэн тооцооллыг гаргасан байна.',
          { align: 'justify' },
        )
        .moveDown(0.5);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нойргүйдэл гэж юу вэ?');

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Богино хугацааны нойргүйдэл нь ихэвчлэн стресс, амьдралын хэмнэл болон орчны өөрчлөлтөөс шалтгаалдаг. Энэ нь хэдэн өдрөөс хэдэн долоо хоног үргэлжилж болно. Харин архаг буюу урт хугацааны нойргүйдэл нь долоо хоногт гурав ба түүнээс дээш удаа давтагдаж, гурван сараас дээш хугацаанд үргэлжилдэг.\n\nАрхаг нойргүйдэл нь хүн амын дунд түгээмэл тохиолддог нойрны эмгэг юм. Нойргүйдэлтэй хүмүүст шөнө унтахад хүндрэлтэй байх, олон дахин сэрэх, эсвэл хангалттай унтсан ч сэргэг биш байх зэрэг шинж илэрч болно. Нойргүйдэлтэй удаан явснаар өдөр нойрмоглож нозоорох, улмаар өдөр тутмын үйл ажиллагаа, ажлаа хийхэд бэрхшээлтэй болж, сэтгэл санаа, эрүүл мэндийн талаас олон сөрөг эрсдэлийг үүсгэнэ.\n\nРегeнсбургийн нойргүйдлийг үнэлэх тест нь нойргүйдлийг танин мэдэхүй, сэтгэл хөдлөл, зан үйлийн талаас үнэлэх зорилготой тест юм. Энэхүү тест нь таны унтсан хугацаанаас гадна нойргүйдэлтэй холбоотой бодол, айдас түгшүүр, шөнө сэрэх давтамж, өглөө хэт эрт сэрэх үзэгдэл, гүн нойроо авч чадахгүй байх, нойрны эмийн хэрэглээг зэргийг цогцоор нь авч үздэг.\n\nТаны тестийн хариу юуг өгүүлж буйг харцгаая.',
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
          'Нойргүйдлийг үнэлэх олон төрлийн асуумж, хэмжүүрүүдийг судлаачид боловсруулсан байдаг. Бидний одоо ашиглаж буй энэхүү тест (RIS)-ийг сэтгэц-физиологийн шалтгаант нойргүйдлийг үнэлэх зорилгоор 2013 онд анх Герман улсад Крөнлайн, Т.; Ланггут, Б болон тэдний багийн эрдэмтэд судлаачид боловсруулсан. Судалгаагаар уг тест нь нойргүйдлийн шинж тэмдгийг үнэн зөв, найдвартай хэмжих боломжтой нь тогтоогдсон. Уг тестийг мөн сэтгэл зүй, сэтгэл засал эмчилгээний өмнө болон дараах өөрчлөлтийг илрүүлэхэд ашигладаг байна.',
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
          'Тестийн нийт оноо 0–ээс 40 хооронд хэлбэлзэх бөгөөд оноо өндөр байх тусам нойргүйдэлтэй холбоотой шинж тэмдгүүд илүү их, тодоор илэрч буйг илтгэнэ. Хэрэв таны оноо 13 болон түүнээс дээш бол архаг нойргүйдэлтэй байж магадгүй гэж үзнэ.',
          { align: 'justify' },
        )
        .moveDown(1);

      const tableData = [
        ['Нийт оноо', 'Тайлбар'],
        ['0-12 оноо', 'Хэвийн'],
        ['13+ оноо', 'Эмнэл зүйн нойргүйдлийн шинжүүд илэрсэн'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [tableWidth * 0.3, tableWidth * 0.7]; // 30% / 70%
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

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      const results = [
        {
          name: 'Хэвийн',
          description:
            'Танд эмнэл зүйн нойргүйдэл бүхий шинж тэмдэг одоогоор илрээгүй байна. Түр зуурын стресс, ажлын хэт ачаалал, амьдралын хэв маягийн өөрчлөлт зэргээс шалтгаалж зарим түр зуур, богино хугацаанд нойргүйдэл тохиолдож болно. Хэрэв цаашид нойргүйдлийн шинж тэмдгүүд нэмэгдэж, үргэлжлэх нэг сараас дээш буюу удаан хугацаанд, тогтмол үргэлжилж, таны өдөр тутмын ажил, амьдралд нөлөөлж эхэлсэн бол мэргэжлийн тусламж үйлчилгээ  авах нь зүйтэй.',
        },
        {
          name: 'Эмнэл зүйн нойргүйдлийн шинжүүд илэрсэн',
          description:
            'Танд шөнө унтахад хүндрэлтэй байх, шөнө дунд сэрэх, сэрэмтгий болох, өглөө эрт сэрэх, нойргүйдэлтэй холбоотой айх, түгших, өдрийн цагийн ядрах зэрэг эмнэл зүйн нойргүйдэл бүхий шинж тэмдгүүд тод илэрч, таны өдөр тутмын үйл ажиллагаанд нөлөөлөх түвшинд хүрсэн байж магадгүй байна. Энэ тохиолдолд нойргүйдлийн шалтгаан, хүндрэлийн түвшнийг илүү нарийвчлан үнэлж илрүүлэх, шаардлагатай бол тусламж, үйлчилгээ авах нь зүйтэй тул та мэргэжлийн эмч, сэтгэл засалч, сэтгэл зүйчид хандах хэрэгтэй.',
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

      doc.x = marginX;

      doc.moveDown(-1.3);

      const buffer = await this.vis.bar(result.point, 40, 45, '');

      doc
        .image(buffer, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        })
        .moveDown(2.5);

      const desc = results.find((res) => res.name === result.result);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(desc.description, startX, doc.y, {
          align: 'justify',
        })
        .moveDown(1);

      // footer(doc);
      // doc.addPage();
      // header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      // doc.font(fontNormal).fontSize(12).fillColor(colors.black);

      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];

      for (const detail of details) {
        const result = detail.value;
        indicator.push({
          name: result,
          max: 4,
        });
        data.push(+detail.cause);
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' }) // ил тод байдал → цагаан дэвсгэр
        .jpeg({ quality: 90, progressive: false }) // interlaceгүй, pdfkit-д найдвартай
        .toBuffer();
      doc.image(jpeg, 95, y - 5, {
        width: doc.page.width - 190,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 6;
      let x = doc.x + (doc.page.width / 8) * 1.4 - marginX;
      y = doc.y - 5;

      const pointSize = (width / 20) * 7;
      const indexSize = (width / 20) * 1;
      const nameSize = (width / 20) * 12;
      doc.font(fontBold).fillColor(colors.black).text(`№`, x, y);
      doc.text('Бүлэг', x + indexSize * 2, y);
      const pointWidth = doc.widthOfString(`Оноо`);
      doc.text(
        `Оноо`,
        x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
        y,
      );
      doc.y += 7;
      doc
        .moveTo(x, doc.y)
        .strokeColor(colors.orange)
        .lineTo(
          x + indexSize + nameSize + pointSize / 2 + pointWidth / 2,
          doc.y,
        )
        .stroke();
      doc.y += 9;
      details.map((res, i) => {
        y = doc.y;

        const color = colors.black;

        doc
          .font(fontNormal)
          .fillColor(color)
          .text(`${i + 1}.`, x, y);
        const name = res.value;
        doc.text(name, x + indexSize * 2, y);
        const pointWidth = doc.widthOfString(`${res.cause}`);
        doc.text(
          `${res.cause}`,
          x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
          y,
        );
        doc.y += 5;
      });
      doc.fillColor(colors.black);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Жич: Тодорхой дэд бүлгийн дундаж оноо өндөр байх нь тухайн чиглэлд хүндрэл илүү байгааг илтгэнэ.',
          marginX,
          doc.y + 10,
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('1. Нойрны чанар. ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Шөнө олон дахин сэрэх, амархан сэрэх, сэрэмтгий болох, өглөө хэт эрт сэрэх зэрэг шинжүүдийг авч үзнэ. Энэ дэд бүлэгт өндөр оноотой бол нойр тогтвортой бус, нойрны чанар муу байгааг илтгэнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(12)
        .text('2. Нойрны хугацаа. ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Орондоо ороод унтах хүртэлх хугацаа, нийт унтсан цаг бага байх, шөнө унтаж чадахгүй, нойргүй хоносон зэрэг шинжүүд орно.  Энэ дэд бүлэгт өндөр оноотой бол нойрны үргэлжлэх хугацаа хангалтгүй байна гэж үзнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(12)
        .text('3. Нойргүйдэлтэй холбоотой айдас, түгшүүр. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Нойргүйдлийн талаар хэт их бодох, унтаж чадахгүй байх вий гэж санаа зовох, үүнээс болж айх, сэтгэл түгших зэрэг сэтгэл зүйн шинж тэмдгүүд орно. Энэ дэд бүлэгт өндөр оноотой бол нойр, нойргүйдэлтэй холбоотой танин мэдэхүй болон сэтгэл зүйн асуудлууд илүү давамгайлж байгааг илтгэнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(12)
        .text('4. Нойрсуулах эмийн хэрэглээ ба өдрийн ядаргаа. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Өдрийн цагаар ядарч, сульдах, ажлын бүтээмж, гүйцэтгэл буурах зэрэг шинжүүд орохоос гадна нойрны эмийн хэрэглээг мөн багтааж үздэг. Энэ дэд бүлэгт өндөр оноотой бол нойргүйдэл өдөр тутмын амьдралд нөлөөлж эхэлж буйг илтгэнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт зөвлөгөө, мэдээлэл');
      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Хүн унтаж байх үедээ илүү бүтээлч байдаг. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хүн унтаж байх үед REM, болон REM бус нойрны үе шатууд олон дахин давтагддаг. REM гэдэг нь rapid eye-movement буюу нүдний хурдан хөдөлгөөн гэдэг үгийн товчлол юм. Та гайхаж магадгүй ч REM нойрны үед хүний тархи сэрүүн байхаас үеэсээ 3 дахин илүү бүтээлчээр ажилдаг байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .image(service.getAsset(`icons/rsi`), {
          width: doc.page.width - marginX * 2,
        })
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сайн нойр авч чадахгүй байх нь хүний нойрны хэвийн бүтэц, мөчлөгийг алдагдуулж сөргөөр нөлөөлдөг. Ямар нэгэн зүйлд суралцаж байх үед өмнө нь эсвэл дараа нь сайн унтаж амраагүй бол тэр өдрийн сурах процесст муугаар нөлөөлдөг. Сайтар унтаагүй үед хүний тархи мэдээллийг харьцангуй муу хүлээж авдаг. Харин сурсны дараа сайн унтаж амраагүй бол эдгээр мэдээлэл нь цаашид сайтар хадгалагдаж чаддаггүй байна. Нойр дутуу авах нь гипокампус хэмээх тархины чухал бүтцийн үйл ажиллагааг маш ихээр дарангуйлагддаг. Гипокампус нь өдөрт хүлээж авч буй бүх мэдээллийг хадгалж цаашид эдгээр мэдээллийг удаан хугацааны санах ой болгон хувиргахад гол үүрэгтэй оролцдог тархины нэг хэсэг юм.',
          marginX,
          doc.y + 315,
          { align: 'justify' },
        );
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт зөвлөгөө, мэдээлэл');
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Тэгвэл хэрхэн сайн нойр авах вэ?', marginX, doc.y)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .list(
          [
            'Өдрийн 14:00 цагаас хойш кофе болон кафейн агуулсан ундаа хэрэглэхгүй байх. Кофе бидний төсөөлснөөс илүү удаан хугацааны туршид үйлчилдэг.',
            'Оройн цагаар архи, согтууруулах ундаа огт хэрэглэхгүй байх. Хүмүүс архи хэрэглэх нь нойр хүрэхэд сайн нөлөөтэй гэж боддог ч, үнэндээ архи, согтууруулах ундаа нь үүний яг эсрэг үйлчилдэг. Нэгдүгээрт архи хүний REM нойрыг арилгадаг. Хоёрдугаарт архи нь биднийг шөнө олон дахин сэрэхэд хүргэж, нойрны хэвийн бүтцийг эвддэг.',
            'Орой унтахаас ядаж 1 цагийн өмнө утсаа оролдохгүй болон телевизор үзэхгүй байх! Харанхуй үед xүний өнчин тархинаас мелатонин хэмээх нойронд маш чухал үүрэг гүйцэтгэдэг бодис ялгардаг. Гэрэлтэй үед энэ бодис ялгардаггүй бөгөөд унтах үедээ утсаа ашиглаж, зурагт үзэж байгаад унтвал энэ бодисын ялгарал 3-аас 4 цагаар хойшилж, өглөө сэрэхэд урьд шөнө нь сайтар амраагүй мэдрэмж өгнө. Аажмаар хүний нойр шилжихэд хүргэдэг.',
            'Тогтмол нэг цагт унтаж сэрдэг болох.',
            'Орон дээрээ 20 минутаас дээш хэвтсэн бол босож, нойр хүрэх хүртлээ өөр зүйл хийж байгаад унтах. Энэ хүний тархинд зөв унтах рефлексийг бий болгодог.',
            'Өрөөний цонхоо онгойлгож, өрөөний температураа багасгах.',
            'Халуун усанд орох.',
            'Өдөр унтахаа болих. Олон хүмүүс өдөр унтах сайн гэдэг болов ч эсрэгээрээ өдөр унтах нь ихэвчлэн шөнө унтах нойрны хэмнэлд муугаар нөлөөлдөг байна.',
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
          'Нойргүйдэл нь хэт их стресс, сэтгэл түгшил, дадал зуршил, амьдралын хэв маяг зэрэг олон хүчин зүйлстэй холбоотой. Тиймээс өөрийн нойрны хэв маяг, унтах орчин,  нойртой холбоотой бодлуудаа ажиглаж, ойлгох нь чухал. Нойргүйдлийг даван туулах, нойрны буруу хэмнэлээ засахын тулд зөвхөн илүү их унтахыг хичээхээс илүүтэйгээр нойртой холбоотой буруу итгэл үнэмшил, зан үйл, дадал зуршлаа өөрчлөх шаардлагатай байдаг. Иймээс нойрыг сайжруулахад хувь хүний хичээл зүтгэл, төлөвлөгөө шаардлагатай.\n\nХэрэв дээрх аргуудыг хэрэглээд үр дүн гараагүй, нойргүйдэл удаан хугацаанд үргэлжилж, улам даамжирч, таны өдөр тутмын амьдралд тань нөлөөлж байвал мэргэжлийн эмч, сэтгэл зүйчид хандахыг зөвлөж байна.',
          marginX,
          doc.y,
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт зөвлөгөө, мэдээлэл');
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
          'Монгол улсын хэмжээнд сэтгэцийн эрүүл мэндийн тулгамдсан асуудалтай хүн бүрд сэтгэл зүйн зөвлөгөө, тусламж үйлчилгээг Сэтгэцийн Эрүүл Мэндийн Үндэсний Төвөөс гадна Улаанбаатар хотын 8 дүүрэг, 21 аймгийн нэгдсэн эмнэлэг дээр байрлах сэтгэц-донтолын кабинетын сэтгэцийн эмч - сэтгэл зүйч нар үзүүлж байна. Иймд танд сэтгэл зүйн тусламж хэрэгтэй бол өөрийн оршин сууж буй аймаг, дүүргийн нэгдсэн эмнэлэгт хандаж үнэ төлбөргүй үйлчилгээ авах боломжтой. Мөн олон жилийн туршлагатай мэргэжлийн эмч нар 1800-2000 утсаар дамжуулан, энгийн тарифаар, 24 цагийн туршид дараах чиглэлүүдээр сэтгэцийн эрүүл мэндийн зөвлөгөө, мэдээллийг үнэ төлбөргүй өгч байна:',
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
          'Crönlein, T., Langguth, B., Popp, R., Lukesch, H., Pieh, C., Hajak, G., & Geisler, P. (2013). Regensburg Insomnia Scale (RIS): A new short rating scale for the assessment of psychological symptoms and sleep in insomnia. Health and Quality of Life Outcomes, 11, 65. https://doi.org/10.1186/1477-7525-11-65\n\nCleveland Clinic. Insomnia. Cleveland Clinic. https://my.clevelandclinic.org/health/diseases/12119-insomnia\n\nNational Heart, Lung, and Blood Institute. (n.d.). Insomnia. U.S. Department of Health and Human Services. https://www.nhlbi.nih.gov/health/insomnia\n\nAPA Citation (7th ed.) Walker, M. (2017). Why we sleep: Unlocking the power of sleep and dreams. Scribner.',
          { align: 'justify' },
        );
      footer(doc);
    } catch (error) {
      console.log('rsi', error);
    }
  }
}
