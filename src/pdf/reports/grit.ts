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
const sharp = require('sharp');

@Injectable()
export class Grit {
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
        undefined,
        undefined,
        false,
        true,
      );

      doc
        .font('fontBold')
        .fontSize(16)
        .fillColor(colors.orange)
        .text('Тестийн тухай', marginX, doc.y);
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
          'Тэсвэр тэвчээр буюу Grit гэдэг ойлголт нь зүгээр л идэвхгүй байдлаар тэсэж тэвчих эсвэл сэтгэл хөдлөлөө дотроо хадгалж үлдэхийг хэлдэггүй. Харин эсрэгээрээ таны хүсэл тэмүүлэл, зорилготой байдлаас гадна сахилга баттай, оролдлого, идэвхтэй, хичээл зүтгэлтэй байдлыг хамтад нь багтаасан цогц ойлголт юм.\n\nТэсвэр тэвчээр чухал болохыг анх Пенсильванийн Их Сургуулийн алдарт сэтгэл судлаач Профессор Анжела Даквортын өөрийн олон жилийн судалгааны үр дүнд олж тогтоож, өөрийн тестийг хөгжүүлсэн байдаг. Анжела Даквортын тэсвэр тэвчээрийн судалгааг сүүлийн үед сэтгэл судлалын салбарт гарсан хамгийн том нээлтүүдийн нэг гэж үзэх нь ч бий. Түүний судалгаагаар зарим тохиолдолд тэсвэр тэвчээр нь хүмүүсийн ирээдүйд амжилт гаргах байдлыг IQ эсвэл авьяас, ур чадвараас илүү үр дүнтэйгээр урьдчилан таамаглаж байжээ. Мөн түүнчлэн тэсвэр тэвчээр гэдэг нь төрөлхийн чадвар биш. Өөрөөр хэлбэл төрөхөөсөө тэсвэр тэвчээр сайтаа эсвэл тэсвэрлэх чадвар багатай хүн гэж байдаггүй. Харин эсрэгээрээ тэсвэр тэвчээр нь цаг тутамд ихсэх эсвэл багасаж байдаг динамик ур чадвар бөгөөд бид хүсвэл өөрсдийн тэсвэр тэвчээрийг сайжруулах, хөгжүүлэх боломжтой юм.\n\nТест нь тэсвэр тэвчээртэй холбоотой дараах 4 үзүүлэлтийг нарийвчлан хэмжинэ. Тухайлбал: Сонирхол, зорилго, хичээл зүтгэл, итгэл найдвар.\n\nОдоо таны тестийн үр дүн таны тухай юу өгүүлж буйг харцгаая!',
          { align: 'justify' },
        );
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
          'Бидний одоо ашиглаж буй тестийг 2022 онд Сара Э. Шимшал болон түүний багийн судлаачид Анжела Даквортын ахны онол, загвар дээр суурилан, нэмэлт судалгаа хөгжүүлэлтүүдийг хийж, боловсруулсан хувилбар юм. Энэхүү тестийн үндсэн болон нэмэлт хувилбаруудын аль аль нь олон улсад харьцангуй сайтар судлагдсан.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!\n\nБидний ашиглаж буй тестийн хувилбар нь Анжела Даквортын боловсруулсан онол, загвар дээр суурилсан боловч түүний Grit Scale тестийн хувилбараас ялгаатай, өөр бөгөөд энэхүү тесттэй холбоотой ямар нэгэн зохиогчийн болон худалдааны эрхийг зөрчөөгүй болно.',
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
          'Тестийн оноог бүлэг тус бүрээр болон нийтэд нь тооцож, тайлагнана. Судлаачдын зүгээс тестийн үр дүнг илүү ойлгомжтой тайлбарлахын тулд дараах ангиллын системийг боловсруулсан. Тэсвэр тэвчээрийн тестийн үр дүн нь тест бөглөсөн онооноос нь хамаарч дараах 6 бүлгийн аль нэг бүлэгт харьяалагдана.\n\nТухайлбал: Хэрэв та тест бөглөөд 4.5 оноо авсан бол энэ нь та 4-р түвшин буюу таны тэсвэр тэвчээрийн байдал дунд болон харьцангуй түвшинд байгаа бөгөөд та энэхүү ур чадвараа харьцангуй хөгжүүлсэн байгааг илтгэнэ. Хялбаршуулсан онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу.',
          { align: 'justify' },
        )
        .moveDown(0.75);

      const tableData = [
        ['Оноо', 'Ангилал', 'Түвшин', 'Тайлбар'],
        ['<2.0', 'Маш бага', '1-р түвшин', 'Хөгжүүлээгүй'],
        ['2.0 – 2.9', 'Бага', '2-р түвшин', 'Суурь'],
        ['3.0 – 3.9', 'Харьцангуй багаас дунд', '3-р түвшин', 'Дунд'],
        [
          '4.0 – 4.9',
          'Дунд болон харьцангуй өндөр',
          '4-р түвшин',
          'Хөгжүүлсэн',
        ],
        ['5.0 – 5.9', 'Өндөр', '5-р түвшин', 'Сайн хөгжүүлсэн'],
        ['6.0 – 7.0', 'Маш өндөр', '6-р түвшин', 'Маш сайн хөгжүүлсэн'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidths = [
        tableWidth * 0.15, // 15%
        tableWidth * 0.35, // 35%
        tableWidth * 0.25, // 25%
        tableWidth * 0.25, // 25%
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
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны нийт тэсвэр тэвчээрийн оноо ', marginX, doc.y, {
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
        .text(' үзүүлэлттэй байна.', marginX, doc.y + 3, {
          align: 'justify',
          continued: false,
        })
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны оноо' + ' ', { continued: true })
        .font('fontBlack')
        .fillColor(colors.orange)
        .text(String(result.value), { continued: true })
        .fillColor(colors.black)
        .text('/' + '7');

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.value, 7, 8, '');

      doc.image(buffer, {
        width: doc.page.width - marginX * 2,
        height: (130 / 1800) * (doc.page.width - marginX * 2),
      });

      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];

      // let max = details[0];
      // for (let i = 1; i < details.length; i++) {
      //   if (parseInt(details[i].cause) > parseInt(max.cause)) {
      //     max = details[i];
      //   }
      // }

      for (const detail of details) {
        const result = detail.value;
        indicator.push({
          name: result,
          max: 7,
        });
        data.push(+detail.cause);
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' }) // ил тод байдал → цагаан дэвсгэр
        .jpeg({ quality: 90, progressive: false }) // interlaceгүй, pdfkit-д найдвартай
        .toBuffer();
      doc.image(jpeg, 75, y + 40, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 5;
      let x = doc.x + (doc.page.width / 8) * 1.75 - marginX;

      y = doc.y + 90;
      const pointSize = (width / 20) * 7;
      const indexSize = (width / 20) * 1;
      const nameSize = (width / 20) * 12;
      doc.font(fontBold).fillColor(colors.black).text(`№`, x, y);
      doc.text('Хэв шинж', x + indexSize * 3, y);
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
        doc.text(name, x + indexSize * 3, y);
        const pointWidth = doc.widthOfString(`${res.cause}`);
        doc.text(
          `${res.cause}`,
          x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
          y,
        );
        doc.y += 5;
      });
      doc.fillColor(colors.black);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Таны тестийн “нийт” оноо таны тэсвэр тэвчээрийн ерөнхий байдлыг илтгэж харуулна. Харин бүлэг тус бүрийн дэлгэрэнгүй оноог ашиглан таны тэсвэр тэвчээртэй холбоотой, түүнийг бүрэлдүүлэгч хэсгүүдийн аль нь илүү сайн хүчтэй хөгжсөн, эсвэл аль хэсгийг нь цаашид илүү хөгжүүлэх боломжтой, шаардлагатай байгааг харуулна. Жишээ нь: Хэрвээ та сонирхол хэсэг дээр өндөр оноотой бол та шинэ зүйлд татагдах, суралцах, шинэ зүйлийг туршиж үзэх дуртай, өөрийн ажиллаж, амьдарч дассан, тав тухтай бүсээс гарч шинэ орчинд орж ажиллахаас айж эмээдэггүй болохыг харуулна. Хэрэв та сонирхол, зорилгын хувьд өндөр оноотой болов ч хичээл зүтгэлийн хувьд харьцангуй сул оноо авсан бол хэдий их хүсэл тэмүүлэл, том зорилготой болов ч тэр зорилгынхоо төлөө төдийлөн их хичээж ажилладаггүй, бэрхшээл тулгарсан үед заримдаа арагшаа суудаг, сэтгэл санааны хувьд харьцангуй амархан ядардаг байж магадгүйг харуулж байгаа юм.',
          { align: 'justify' },
        );

      const pageWidth = doc.page.width;
      const columnGap = 20;
      const availableWidth = pageWidth - marginX * 2 - columnGap;

      const textWidth1 = availableWidth * 0.6;
      const imageWidth1 = availableWidth * 0.4;

      const startY1 = doc.y + 15;

      const imageX1 = marginX + imageWidth1 + columnGap;

      doc.image(service.getAsset('icons/grit', 'jpeg'), marginX + 2, startY1, {
        width: imageWidth1,
      });

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Гэхдээ та өөрийн оноо багатай хэсгүүдийг өөрийн сул тал гэж шууд ойлгох хэрэггүй. Энэ хэсгүүд бол эсрэгээрээ таны цаашид өсөж, хөгжих боломжтой чиглэлүүд юм. Жишээлбэл, хичээл зүтгэл дээр оноо багатай бол цаашид илүүтэй тогтмол дадал зуршлуудыг өөртөө бий болгоход анхаарах, эсвэл итгэл найдварын хэсэг дээр бага оноотой бол цаашид гаргасан алдаагаа илүү боломж гэж өөдрөг, эерэг байдлаар хүлээн авахыг хичээх хэрэгтэй.\n\nТа өөрийн авсан тестийн оноогоо хадгалж, дараа дахин тест бөглөж өмнөх оноотойгоо харьцуулж, өөрийн ахиц дэвшлээ хянах боломжтой. Тэсвэр тэвчээр бол тогтонги, төрөлхийн чанар биш, энэ бол дадал, сургуулилтаар хөгжүүлж болдог дотоод хүч, ур чадвар юм.\n\nХэрвээ та тэсвэр тэвчээрийн судалгааны талаар сонирхож буй бөгөөд илүү дэлгэрэнгүй мэдээлэл авахыг хүсэж буй бол цаашид Анжела Дакворт-ын Grit номыг уншихыг санал болгож байна.',
          imageX1,
          startY1,
          {
            align: 'justify',
            width: textWidth1,
          },
        );

      const imgBottomY1 = startY1 + imageWidth1 * 1.53;

      doc
        .font(fontNormal)
        .fontSize(10)
        .fillColor(colors.black)
        .text(
          'Анжела Дакворт зохиолчийн “Grit: The Power of Passion and Perseverance” буюу “Тэсвэр тэвчээр: Хүсэл тэмүүлэл ба тууштай байдлын хүч” ном (2016 он)',
          marginX,
          imgBottomY1 + 10,
          {
            width: imageWidth1,
            align: 'center',
          },
        );

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Ашигласан эх сурвалж');
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Duckworth, A.L., Peterson, C., Matthews, M.D. and Kelly, D.R., 2007. Grit: perseverance and passion for long-term goals. Journal of personality and social psychology, 92(6), p.1087.\n\nSchimschal, S.E., Visentin, D., Kornhaber, R., Barnett, T. and Cleary, M., 2022. Development of a scale to measure the psychological resources of grit in adults. Nursing & Health Sciences, 24(3), pp.752-763.\n\nSchimschal, S.E., Cleary, M., Kornhaber, R.A., Barnett, T. and Visentin, D.C., 2023. Psychometric evaluation of the grit psychological resources scale (GPRS). Journal of multidisciplinary healthcare, pp.913-925.',
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);
      footer(doc);
    } catch (error) {
      console.log('grit', exam?.assessment?.name, error);
    }
  }
}
