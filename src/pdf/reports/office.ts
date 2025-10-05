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
export class Office {
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
        exam.assessment.usage,
      );

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('“Ажлын байран дээрх оффисын улс төржилт” ', {
          align: 'justify',
          continued: true,
        })
        .font(fontNormal)
        .text(
          'гэдэг нь ажил дээрээ өөрийн эрх мэдэл, албан тушаал, танил тал, нөлөөллөө ашиглан, хувийн болон мэргэжлийн ашиг сонирхлынхоо төлөө ямар нэгэн үйлдэл гаргахыг хэлнэ. Бусдыг ятгах, зорилгодоо хүрэхийн тулд бусадтай нөхөрлөх, танилын хүрээгээ ашиглах зэрэг шударга бус байдлаар тодорхой шийдвэр гаргахад нөлөөлж буй бүх үйлдэл үүнд хамаарна.',
          { align: 'justify', continued: false },
        )
        .moveDown();

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажлын байран дээрх оффисын улс төржилт хэт ихсэх эсвэл ажилчдын дунд оффисын улс төржилтийн ямар нэгэн хэлбэр оршин байна гэсэн итгэл үнэмшил үүсэх нь байгууллагын соёлд сөргөөр нөлөөлж, ажилчдын ажлаа хийх урам зоригийг мохоодог. Жишээлбэл: Хэрэв ажилчдын дунд байгууллага дотор тогтсон дүрэм журмаас дээгүүр, нөлөөлөл бүхий бүлэг, фракц, хувь хүн оршин байдаг гэсэн итгэл үнэмшил үүсвэл цаашид ажилчид сэтгэлээсээ ажилдаа хандахаа болих, өөрийн хувийн эрх ашгаа байгууллагын зорилгоос дээгүүр тавих, амин хувиа хичээх, бусад хүмүүсийн адилаар “тоглоомын дүрэм”-ийн дагуу тоглож албан тушаал ахих, нөлөө бүхий бүлэг, фракцад элсэн орохын төлөө зүтгэх зэрэг сөрөг үйлдлүүд гарч болно.\n\nҮүнээс гадна, оффисын улс төржилт ихтэй байгууллага гэсэн шошго зүүх нь танай байгууллагад цаашид шинээр ажилтан элсүүлэх, сайн ажилчдыг байгууллагадаа авч үлдэхэд хүндрэл учруулж, байгууллагын нэр хүндэд хүртэл сөргөөр нөлөөлж болзошгүй юм. Тест нь дараах 3 бүлэг чиглэлд ажлын байран дээрх оффисын улс төржилтийн байдлыг үнэлдэг. Тухайлбал: ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Байгууллага дээрх оффисын улс төрийн ерөнхий зан төлөв, байдал',
            'Бусдыг даган, дуурайх хандлага',
            'Цалин, урамшууллын бодлого.',
          ],
          doc.x + 20,
          doc.y,
          {
            align: 'justify',
            //   bulletRadius: 1.5,
            columnGap: 8,
            listType: 'numbered',
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
          'Ажлын байран дээрх оффисын улс төржилтийг үнэлэх зорилготой олон төрлийн тест, үнэлгээг судлаач нар хөгжүүлсэн байдаг.  Энэхүү тест, загварыг анх профессор К. Мишель Какмар болон түүний хамтран зүтгэгч нар 1989 оноос хойш боловсруулж, 1997 онд бидний одоо ашиглаж буй тестийн хувилбарыг бий болгосон. Энэхүү тест нь нь 3 бүлэг, нийт 15 асуулт бүхий олон улсад өргөнөөр хэрэглэгддэг, сайтар судлагдаж, баталгаажсан хувилбар нь юм.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажлын байран дээрх оффисын улс төрийг үнэлэх тестийн албан ёсны  зохиогчийн эрхийг тест зохиогчид, судлаач нар эзэмшинэ. Тестийг сургалт, судалгааны зорилгоор болон хувь хүн, байгууллага өөрийгөө үнэлэх байдлаар үнэгүй, нээлттэй ашиглах боломжтой. Тестийн тооцоолол, үр дүнд суурилсан тайлан, зөвлөгөө болон бусад үйлчилгээтэй холбоотой эрхийг Hire.mn эзэмшинэ.',
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
          'Ажлын байран дээрх оффисын улс төрийг үнэлэх тестийн үр дүнг тооцохдоо бүлэг тус бүрд харгалзах оноонуудыг хооронд нь нэгтгэж, дундаж оноог тооцоолсон. Бүлэг тус бүрд нийт авах боломжтой оноо нь 1-ээс 5 хүртэлх онооны хооронд хэлбэлзэнэ.\n\nТестийн үр дүнг цаашид ойлгомжтой тайлбарлахын тулд таны авсан оноог нийт гурван бүлэгт хуваасан: “Харьцангуй бага”, “Дунд түвшин”, “Харьцангуй өндөр”. Үр дүнг харьцуулахдаа Монгол орны нийгэм, эдийн засаг болон бусад хүн амын хүчин зүйлстэй ойролцоо нөхцөлтэй улс оронд судлагдаж, үр дүн нь олон улсын эрдэм шинжилгээний сэтгүүлд хэвлэгдсэн судалгааг ашигласан (С.Самад ба С.Амри, 2011).\n\nАжлын байран дээрх оффисын улс төрийг үнэлэх тестийн хариу өндөр оноотой гарах нь үргэлж сөрөг, ноцтой үр дүнг заахгүй. Өөрөөр хэлбэл та өөрийн байгууллага дотроо оффисын улс төржилтийн ямар хэлбэрийг хүлээн зөвшөөрөх, юуг нь огт хүлээн зөвшөөрөхгүй болохоо өөрөө шийдэх ёстой. Тиймээс тестийн үр дүнг шууд авч ашиглахаас илүүтэй өөрийн байгууллага, багын орчин нөхцөлд тохируулан авч ашиглах, тайлбарлах нь зүйтэй.\n\nТестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!',
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
        .text(
          'Ажлын байран дээрх оффисын улс төрийг үнэлэх тестийн нийт болон бүлэг тус бүрд харгалзах оноог дараах графикт нэгтгэн үзүүлэв.',
          { align: 'justify' },
        )
        .moveDown(1);
      const categories = [
        'НИЙТ',
        ...result.details.map((detail) => detail.value),
      ];

      const values = [
        Number(result.value),
        ...result.details.map((detail) => Number(detail.cause)),
      ];
      const divisors = [5, 5, 5, 5];
      const averages = [6, 6, 6, 6];

      for (let index = 0; index < categories.length; index++) {
        const category = categories[index];

        if (index > 0) {
          doc.moveDown(3.2);
        }
        const currentY = doc.y;

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(category + ': ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(String(values[index]), { continued: false });

        let level = '';
        const score = values[index];

        if (category === 'Оффисын улс төрийн ерөнхий байдал') {
          if (score <= 2) level = 'Харьцангуй бага';
          else if (score <= 3.4) level = 'Дунд түвшин';
          else level = 'Харьцангуй өндөр';
        } else if (category === 'Бусдыг даган, дуурайх хандлага') {
          if (score <= 2.9) level = 'Харьцангуй бага';
          else if (score <= 4) level = 'Дунд түвшин';
          else level = 'Харьцангуй өндөр';
        } else if (category === 'Цалин, урамшууллын бодлого') {
          if (score <= 1.4) level = 'Харьцангуй бага';
          else if (score <= 2.9) level = 'Дунд түвшин';
          else level = 'Харьцангуй өндөр';
        } else if (category === 'НИЙТ') {
          if (score <= 2) level = 'Харьцангуй бага';
          else if (score <= 3.4) level = 'Дунд түвшин';
          else level = 'Харьцангуй өндөр';
        }

        doc
          .font(fontBold)
          .fontSize(10)
          .fillColor(colors.black)
          .text(`${level}`, marginX, currentY, {
            width: doc.page.width - marginX * 2,
            align: 'right',
          });

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

      doc.y = doc.y + 20;
      await this.single.examQuartileGraph(doc, result);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Та өөрийн авсан оноогоо эргэцүүлж, дараах асуултуудад дотроо хариулаарай.',
          marginX,
          doc.y + 5,
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Таны тестийн үр дүн, оноо тест өгөхөөс өмнөх төсөөлөлтэй чинь зөрж байна уу?',
            'Таны бөглөсөн тестийн үр дүн болон одоогийн танай баг, байгууллагын нөхцөл байдлыг авч үзвэл, аль хэсэгт нь хамгийн их анхаарал хандуулах ёстой гэж та бодож байна вэ?',
          ],
          doc.x + 20,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            //   listType: 'numbered',
          },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт зөвлөмж, мэдээлэл');
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Багийн ажлыг илүү дэмжих, урамшуулах.')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Баг, хамтын ажиллагаа нь ажилчдын дундах харилцааг сайжруулж, нөхөрлөлийг илүү бат бэх болгохоос гадна байгууллагын доторх буруу ойлголт, итгэл үнэмшлийг өөрчлөхөд тусална. Дараах аргуудаас сонгон хэрэглэж болно:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Ажилчдыг багаар хамтран ажиллахыг илүүтэй урамшуулах, багаар ажиллах орчныг бүрдүүлэх',
            'Гүйцэтгэлийн үнэлгээнд багаар ажиллах ур чадварыг нэмэлт туслах хэмжүүр болгон оруулах',
            'Баг, төслийн удирдагчийг нь биш, харин баг хамт олны хичээл зүтгэлийг нийтээр нь сайшаах, магтах',
          ],
          doc.x,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            //   listType: 'numbered',
          },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text(
          'Ажилчдыг чөлөөтэй үгээ хэлэх, үзэл бодлоо илэрхийлэхэд нь дэмжлэг үзүүлэх.',
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажлын байран дээрх оффисын улс төржилт хэт ихэссэн үед хүмүүс өөрийн бодол санааг хуваалцахаас айж эмээж, чимээгүй байх нь өөрт нь илүү ашигтай, аюулгүй алхам гэж үзэх хандлага бий болдог. Энэ нь эргээд ажилчдын бүтээлч сэтгэлгээг унтрааж, ажилчид өөрсдийн мэдлэг, ур чадвараа бүрэн гүйцэд ашиглахад саад болж, шинэ санаа, сэдэл төрөн гарах үүд хаалгыг хаадаг. Дараах аргуудаас сонгон хэрэглэж болно:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Албан тушаалаас нь үл хамааран бүх ажилчдыг үгээ хэлэх, бодол санаагаа хуваалцах боломжоор хангах, үгээ хэлэх үед нь дэмжих, сайшаах',
            'Зөв, зүйтэй шүүмжлэлийг дэмжих, урамшуулах',
            'Ажилчдыг шийдвэр гаргах үйл ажиллагаанд идэвхтэй оролцуулж байх',
          ],
          doc.x,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            //   listType: 'numbered',
          },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Тогтсон бүлэг, фракцуудыг задлах.')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ажил дээр тодорхой бүлэг, фракцууд бүрэлдэн бий болох нь танай байгууллага дотор мэдээлэл чөлөөтэй урсахад саад болж, улмаар ажилчдын дунд нэг нь нөгөөгөө гадуурхах, талцан хуваалцах байдалд хүргэх эрсдэлтэй. Та дараах аргуудаас сонгон хэрэглэж болно:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Бүлэг, фракцууд үүсэхээс сэргийлэх эвсэл арилгахын тулд аль болох өөр өөр баг, хэлтсүүдээс ажилчдыг сонгож, хамтад нь ажиллуулж байх.',
            'Баг, хэлтсүүдийн хоорондын хамтын ажиллагааг дэмжиж, урамшуулж байх',
          ],
          doc.x,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
            //   listType: 'numbered',
          },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Оффисын улс төрийн эерэг тал.')
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Эцэст нь сануулахад ажлын байран дээрх оффисын улс төржилт нь үргэлж сөрөг үр дагавар дагуулахгүй. Байгууллагын соёл, удирдлагын бодлогоос шалтгаалан зарим төрлийн оффисын улс төржилтийг хүлээн зөвшөөрөх боломжтой.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Нэмэлт зөвлөмж, мэдээлэл');

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тухайлбал, оффисын улс төржилт нь тодорхой түвшинд ажилчдын дундах өрсөлдөөнийг идэвхжүүлж, ажлын гүйцэтгэлийг нэмэгдүүлэхээс гадна ажилчдын өөрийгөө бусдад илэрхийлэх, эрсдэл үүрэх чадварыг сайжруулах зэргээр сайн нөлөө үзүүлж болно. Судалгаануудад оффисын улс төр хийх ур чадварыг сайн эзэмшсэн хувь хүмүүс ажлын өндөр гүйцэтгэлтэй, стресс багатай, ирээдүйд албан тушаал ахих, амжилт гаргах магадлал илүү их байдаг гэж дүгнэсэн байдаг.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Ашигласан эх сурвалж')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Kacmar KM, Ferris GR. Perceptions of organizational politics scale (POPS): Development and construct validation. Educational and Psychological Measurement. 1991 Mar;51(1):193-205.\n\nKacmar KM, Carlson DS. Further validation of the perceptions of politics scale (POPS): A multiple sample investigation. Journal of Management. 1997 Jan 1;23(5):627-58.\n\nSamad S, Amri S. Examining the influence of organizational politics on job performance. Australian Journal of Basic and Applied Sciences. 2011;5(12):1353-63.',
          { align: 'justify' },
        )
        .moveDown(0.5);

      footer(doc);
    } catch (error) {
      console.log('office', error);
    }
  }
}
