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

@Injectable()
export class Mindset {
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
        .text('Өсөлтийн сэтгэлгээ гэж юу вэ?', marginX, doc.y)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '“Өсөлтийн сэтгэлгээ” буюу “Growth mindset” гэдэг нь хүний оюун ухаан, ур чадвар нь тогтмол, хувьсан өөрчлөгддөггүй зүйл биш, харин ч эсрэгээрээ өөрчлөгдөж болдог, хичээл зүтгэл, дасгал сургуулилтын үр дүнд өсөн дэвжих боломжтой гэсэн хувь хүний эерэг итгэл үнэмшил, сэтгэлгээний байдлыг илэрхийлдэг ойлголт юм. Харин эсрэгээрээ хүний оюун ухаан, ур чадвар бол төрөлхийн шинж чанартай, хүний хичээл зүтгэлээс үл хамаардаг хэмээх өсөлттэй сэтгэлгээний эсрэг,  сөрөг утгатай ухагдахууныг “тогтонги сэтгэлгээ” (Fixed mindset) гэж нэрлэдэг.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text(
          'Өсөлтийн сэтгэлгээ болон тогтонги сэтгэлгээний ялгаа',
          marginX,
          doc.y,
        )
        .moveDown(0.5);
      doc.image(assetPath(`icons/mindsett1`), {
        width: doc.page.width - marginX * 2,
      });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сэтгэлгээ хэмээх ойлголтыг анх Стэйнфордын их сургуулийн багш, судлаач Кэрол Двек (Carol Dweck) анх нээсэн бөгөөд өөрийн амьдралын бүхий л он жилүүдээ өсөлтийн болон тогтонги сэтгэлгээг судлахад зарцуулсан байдаг. Хожим нь Доктор Двек эдгээр судалгааны ажлуудаа нэгтгэн 2006 онд “Сэтгэлгээ: Амжилтын тухай сэтгэл судлалын шинэ чиглэл” (Mindset: The New Psychology of Success) гэсэн нэртэй номыг хэвлүүлсэн нь төд удалгүй бестселлер ном болж, дэлхий даяар олон хэл дээр орчуулагдаж, ихээхэн амжилт, алдар хүндийг зохиогчдоо авчирчээ. Өсөлтийн сэтгэлгээний онол, загварыг сүүлийн үед сэтгэл судлалын салбарт гарсан томоохон нээлтүүдийн нэг гэж үздэг.\n\nЭнэхүү ойлголтыг хувь хүний хөгжил, боловсрол, бизнес зэрэг төрөл бүрийн салбаруудад ихээхэн сонирхож, өргөнөөр ашиглаж байгаа юм. Одоо таны тестийн үр дүн таны сэтгэлгээний тухай юуг өгүүлж буйг харцгаая!',
          marginX,
          doc.y + 210,
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
          'Анх Кэрол Двек судлаач сэтгэлгээний тухай онол, загвар, тестийг боловсруулснаас хойш энэ чиглэлд олон төрлийн судалгааны бүтээл, тестийн аргууд бий болсон байдаг. Бидний одоо ашиглаж буй тест нь 2024 онд Хермундур Сигмундссон болон Моника Хага нарын судлаачдын боловсруулсан 8 асуулт бүхий өсөлтийн сэтгэлгээг үнэлэх тестийн хувилбар юм (GMS-8 буюу Growth Mindset Scale). Өсөлтийн сэтгэлгээг үнэлж буй энэхүү тестийн анхны хувилбар нь олон улсад харьцангуй сайтар судлагдаж, баталгаажсан. Hire.mn судлаачдын баг энэхүү тестийн анхны загвар дээр суурилж, нэмэлт хөгжүүлэлт, өөрчлөлтүүдийг хийж, одоогийн Монгол тестийн хувилбарыг боловсруулсан.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Бидний ашиглаж буй тестийн хувилбар нь Кэрол Двек судлаачийн боловсруулсан онол, загвар, тест дээр суурилсан, төстэй болов ч, түүний тестийн хувилбар биш бөгөөд уг тесттэй холбоотой ямар нэгэн зохиогчийн болон худалдааны эрхийг зөрчөөгүй болно. Мөн түүнчлэн бид зохиогчийн эрхийн хуулийн хүрээнд ажиллаж, нэмэлт хөгжүүлэлт, өөрчлөлтийг хийж, энэхүү тестийн Монгол хувилбарыг хөгжүүлсэн болно.\n\nУг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу.',
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
          'Өсөлтийн сэтгэлгээний тестүүдийн хувьд тодорхой тогтсон эсвэл нийтээр хүлээн зөвшөөрсөн үр дүнг тайлбарлах аргачлал, стандарт гэж байдаггүй. Зарим судлаачдын зүгээс тестийн үр дүнг илүү ойлгомжтой тайлбарлах зорилгоор дараах ангиллын системийг боловсруулсан байдаг. Энэхүү схемийн дагуу өсөлтийн сэтгэлгээний тестийн үр дүн нь тест бөглөсөн онооноос хамаарч дараах 3 бүлгийн аль нэгэнд харьяалагдана. Тухайлбал: өсөлтийн сэтгэлгээ, дунд түвшин, тогтонги сэтгэлгээ. Хэрэв та тест бөглөөд 3.5 оноо авсан бол энэ нь та харьцангуй дунд түвшин буюу өсөлтийн, тогтонги сэтгэлгээний аль аль нь хосолсон сэтгэлгээтэй болохыг илтгэнэ. Гэхдээ өмнө нь өгүүлснээр, энэхүү схем нь тайланг хэрэглэгчид ойлгомжтой харуулахад зориулсан, хялбаршуулсан хувилбар бөгөөд уг схемд ашиглагдсан тоон утгууд нь стандарт биш гэдгийг санах хэрэгтэй (Глерум Ж, 2020).',
          { align: 'justify' },
        )
        .moveDown(1);
      const tableData = [
        ['Оноо', 'Ангилал'],
        ['<3.0', 'Харьцангуй "Тогтонги сэтгэлгээ"'],
        ['3.1-3.9', 'Харьцангуй "Дунд түвшин"'],
        ['>3.9', 'Харьцангуй "Өсөлтийн сэтгэлгээ"'],
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
      header(doc, firstname, lastname, service, 'Тестийн үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Таны тестийн үр дүнгийн оноо ', marginX, doc.y, {
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
        .text(result.result.toString().toUpperCase(), doc.x, doc.y - 3, {
          align: 'justify',
          continued: true,
        })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text('-тэй байна.', marginX, doc.y + 3, {
          align: 'justify',
          continued: false,
        })
        .moveDown(1);

      let y = doc.y;
      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Тогтонги сэтгэлгээ', marginX, y);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('Өсөлтийн сэтгэлгээ', marginX, y, {
          align: 'right',
          width: doc.page.width - marginX * 2,
        });

      doc.moveDown(-0.8);

      const buffer = await this.vis.bar(result.value, 6, 7, '');

      doc.image(buffer, {
        width: doc.page.width - marginX * 2,
        height: (130 / 1800) * (doc.page.width - marginX * 2),
      });

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Таны тестийн оноо нь таны сэтгэлгээний одоогийн, ерөнхий байдлыг илтгэж харуулна. Та өөрийн тестийн үр дүн, оноог өөрийн сул тал гэж шууд ойлгох хэрэггүй. Бид бүгд тогтонги болон өсөлтийн сэтгэлгээний аль аль хэсгийг тодорхой хэмжээгээр өөртөө агуулсан байдаг. Аливаа хүн ямарваа нэг сэдэв дээр тодорхой хэмжээнд тогтсон итгэл үнэмшилтэй, тогтонги сэтгэлгээтэй байх нь хэвийн үзэгдэл бөгөөд эмгэг, гаж зүйл биш юм. Энэхүү үр дүн нь таны зөвхөн одоогийн үзэл бодол, итгэл үнэмшил, сэтгэлгээний байдлыг илтгэн харуулах бөгөөд цаашид өсөж хөгжих, өөрчлөгдөх боломжтой. Тиймээс цаашид тестийн оноог өсөн дэвжих, суралцах боломж гэж өөдрөг, эерэг байдлаар хүлээн авахыг хичээгээрэй.\n\nТа өөрийн авсан тестийн оноогоо хадгалж, дараа дахин тест бөглөж өмнөх оноотойгоо харьцуулж, өөрийн ахиц дэвшлээ хянах боломжтой. Хүний оюун ухаан, авьяас ур чадвар бол тогтонги, төрөлхийн шинж чанартай биш, энэ бол дадал, сургуулилтын үр дүнд хөгжүүлж болдог зүйлс юм.',
          marginX,
          doc.y + 45,
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      const mindsets = [
        {
          name: 'Өсөлтийн сэтгэлгээ',
          description:
            'Та өөрийн оюун ухаан, авьяас, ур чадвараа аажмаар хөгжүүлж, сайжруулж болно гэдэгт итгэдэг. Хүнд, хэцүү нөхцөл байдалтай тулгарах үед та бууж өгөхийн оронд өөрийн арга барилаа өөрчилж, алдаанаасаа суралцаж, үргэлжлүүлэн хөгжих, хичээхийг илүүд үзэх хандлагатай.\n\nӨсөлтийн сэтгэлгээтэй хүмүүсийн хувьд бүх зүйл хүний өөрийн хүчин чармайлт, тууштай байдлаас хамаарах учир хэн байхаас үл хамааран хүн бүр сайжирч, өсөн хөгжих чадвартай гэдэгт итгэдэг. Бусадтай харьцуулахад өсөлтийн сэтгэлгээтэй хүмүүс илүү өөртөө итгэлтэй, аливаад тууштай ханддаг, тэсвэр тэвчээртэй байдаг.  Энэ төрлийн хүмүүс алдаа дутагдал, бүтэлгүйтлийг цаашид суралцах боломж гэж эерэг талаас нь хардаг.\n\nӨсөлтийн сэтгэлгээтэй хүмүүсийн хувьд:',
          image: 'mindset2',
          list: '• Итгэл, үнэмшил - Хүний авьяас чадвар, оюун ухаан өөрчлөгдөж, өсөн нэмэгдэх боломжтой\n• Хичээл, зүтгэл - Хүнд хэцүү даалгавар, сорилтын өөдөөс хүн хичээх ёстой\n• Алдаа - Алдаа бол бас нэгэн суралцах боломж\n• Шүүмж - Сөрөг болон эерэг сэтгэгдлүүдээс хэрэгтэйг нь авч, суралцаж болно\n• Зорилго - Хэцүү төвөгтэй байсан ч, тавьсан зорилгынхоо төлөө тууштай тэмцэх ёстой.',
          last: '• Алдаа дутагдал бол засаж, сайжруулах боломжтой, хийх ажлын жагсаалт гэж үздэг\n• Тухайн үеийн сэтгэл хөдлөл, сэтгэл зүйн байдлаас үл хамааран, хүн өөрийн туршлага, хичээл зүтгэл дээрээ үндэслэн зорилго, хүсэл сонирхолооо бүтээж, бий болгодог гэж итгэдэг\n• Алдаа дутагдал бол ердөө түр зуурын үзэгдэл\n• Үр дүнгээс илүү үр дүнд хүргэсэн үйл явц, хичээл зүтгэл чухал\n• Гүн гүнзгий нөхөрлөл, харилцаа холбоо нь урт хугацааны хүчин чармайлт, хичээл зүтгэлийн үр дүн юм',
        },
        {
          name: 'Тогтонги сэтгэлгээ',
          description:
            'Та өөрийн оюун ухаан, авьяас, ур чадварыг харьцангуй хязгаарлагдмал, төрөлхийн шинж чанартай, өөрчилж, сайжруулахад хэцүү, боломжгүй гэж үзэх хандлагатай.\n\nЕрөнхийдөө, тогтмол сэтгэлгээтэй хүмүүс нь өөрсдийнх нь хийдэг үйлдэл, хэлдэг үгс, гаргадаг зан авир нь төрөлхөөс өөрт нь заяагдсан оюун ухаан, авьяас чадвартай нь хамааралтай гэж үздэг. Тиймээс өөрсдийн хийсэн алдаа дутагдлаа засаж, сайжруулахын оронд эсрэгээрээ гаргасан алдаа, үг үйлдлээ үгүйсгэж, өөрсдийгөө зөвтгөх хандлагатай байдаг. Тогтмол сэтгэлгээтэй хүмүүсийн хувьд цаанаас өгөгдсөн төрөлхийн авьяас чадварын хэмжээнээс шалтгаалан хүн нэг бол гоц ухаантай, төрөлхийн авьяастай эсвэл тийм биш гэсэн хоёрхон төрөлд хүмүүсийг хувааж үздэг. Тийм учраас энэ төрлийн хүмүүс хичээл зүтгэл биш харин авьяас чадвар л амжилт гаргах гол хэмжигдэхүүн гэж үздэг. Жишээлбэл: "Тэр бол төрөлхийн авьяастай дуучин" эсвэл "Би тоондоо угаасаа сайн биш" гэсэн санаа, бодол нь энэ төрлийн хүмүүсийн дунд түгээмэл юм.\n\nТогтонги сэтгэлгээтэй хүмүүсийн хувьд:',
          image: 'mindset1',
          list: '• Итгэл, үнэмшил - Шинэ мэдлэг, ур чадварт суралцаж болох ч хүн өөрөө өөрчлөгдөхгүй\n• Хичээл, зүтгэл - Хэчнээн их хичээсэн ч хүний авьяас чадвар, оюун ухааны түвшин өөрчлөгдөхгүй\n• Алдаа - Алдаа огт гаргахгүй байх нь чухал\n• Шүүмж - Шүүмжлэл голдуу хувийн шинж чанартай. Шүүмжлэл сонсохоос зайлсхийх хэрэгтэй. Сөрөг сэтгэгдэл, санал хүсэлт илүү чухал, ач холбогдолтой гэж боддог\n• Зорилго - Хүнд хэцүү даалгавар, сорилттой нүүр тулахын оронд орхих нь зөв зам',
          last: '• Алдаа, дутагдлыг нь бусад хүн олж мэдэхээс айж, нуух, далдлах\n• Өөрийн үнэ цэнэ, өөртөө итгэх итгэлээ хэвээр хадгалахын тулд өмнө нь мэддэг, чаддаг байсан зүйлсээ л үргэлжлүүлэн хийх\n• Зорилго, сонирхол нь хүн өөрийнхөө дотроос эрж хайх, нээж олох ёстой гэж итгэдэг\n• Алдаа дутагдал, бүтэлгүйтэл нь хүнийг тодорхойлдог\n• Гүн гүнзгий нөхөрлөл, харилцаа холбоо нь анхнаасаа төгс таарч тохирсон, эсвэл ижилхэн санаа бодол, харах өнцөг дээр суурилсан байдаг\n• Үр дүнд хүрэх нь хамгийн чухал. Хэрэв амжилтад хүрэхгүй бүтэлгүйтвэл, бүх л хөдөлмөр, хүчин чармайлтаа талаар болно. Дахиж оролдож үзэх нь утгагүй хэрэг гэж итгэдэг.',
        },
        {
          name: 'Дунд түвшин (өсөлтийн болон тогтонги сэтгэлгээ хосолсон)',
          description:
            'Өөрийн оюун ухаан, авьяас, ур чадвараа цаашид хөгжүүлж, сайжруулах талаар таны итгэл үнэмшил тогтворгүй байдаг. Та зарим тохиолдолд ур чадвартаа итгэдэг ч, хүнд, хэцүү сорилт тулгарахад өөртөө эргэлзэх хандлагатай.\n\nӨсөлтийн болон тогтонги сэтгэлгээ хосолсон сэтгэлгэтэй хүмүүсийн заримдаа өмнө нь хийж үзээгүй, шинэ зүйлийг хийхээс цааргалдаг. Ялангуяа бусад хүмүүсийн дэргэд шинэ зүйл туршиж хийхээс төвөгшөөх, бусад хүмүүс таныг шүүмжилж магадгүй гэж айж, эмээх хандлагатай. Энэ төрлийн хүмүүсийн дунд “Заримдаа би өмнө нь хийж үзэж байгаагүй ажлыг хийж эхлэхээс цааргалах, хойш суудаг" эсвэл "Мэдэхгүй юмаа хийх, тэр талаар сурах дургүй" гэсэн үзэл бодол илүүтэй түгээмэл байдаг. \n\nЭнэ төрлийн хүмүүс шинэ ажил, төслүүдийг хийх шаардлагатай болсон үедээ сандарч, тэвдэх, халшрах магадлалтай. Үүний уршгаар шинэ зүйл сурах, шинэ орчинд ажиллахаас зайлсхийж, өөрийн сайн мэддэг, хийдэг зүйлсээ үргэлжлүүлэн хийхийг илүүд үзэж магадгүй юм. Гэхдээ энэ нь та шинэ ур чадвар эзэмших, шинэ зүйл сурч мэдэх боломжоо үгүйсгэж байна гэсэн үг бөгөөд үргэлж ашигладаг тогтсон зуршил,  баригдмал хэвшилтэй болохоос болгоомжлох хэрэгтэй.',
          image: 'mindset3',
          list: '• Итгэл, үнэмшил - Шинэ мэдлэг, ур чадварт суралцаж болно. Гэхдээ хүн өөрөө тэр бүр өөрчлөгдөхгүй\n• Хичээл, зүтгэл - Хэчнээн их хичээсэн ч хүний авьяас чадвар, оюун ухааны түвшин тэр бүр өөрчлөгдөхгүй\n• Алдаа - Алдаанаасаа суралцаж болно. Гэхдээ алдаа огт гаргахгүй байх нь чухал\n• Шүүмж - Сөрөг сэтгэгдэл, санал хүсэлт дээр илүүтэй төвлөрөх хандлагатай\n• Зорилго - Удаан үргэлжилсэн, хүнд хэцүү сорилт бэрхшээлээс заримдаа халшрах хандлагатай.',
          last: '',
        },
      ];

      const mindsetOrderMap: Record<string, string[]> = {
        'Харьцангуй "Өсөлтийн сэтгэлгээ"': [
          'Өсөлтийн сэтгэлгээ',
          'Дунд түвшин (өсөлтийн болон тогтонги сэтгэлгээ хосолсон)',
          'Тогтонги сэтгэлгээ',
        ],
        'Харьцангуй "Тогтонги сэтгэлгээ"': [
          'Тогтонги сэтгэлгээ',
          'Дунд түвшин (өсөлтийн болон тогтонги сэтгэлгээ хосолсон)',
          'Өсөлтийн сэтгэлгээ',
        ],
        'Харьцангуй "Дунд түвшин"': [
          'Дунд түвшин (өсөлтийн болон тогтонги сэтгэлгээ хосолсон)',
          'Өсөлтийн сэтгэлгээ',
          'Тогтонги сэтгэлгээ',
        ],
      };
      const order =
        mindsetOrderMap[result.value] ?? mindsets.map((m) => m.name);

      const orderedMindsets = order
        .map((name) => mindsets.find((m) => m.name === name))
        .filter(Boolean) as typeof mindsets;

      for (const mindset of orderedMindsets) {
        doc.addPage();

        header(doc, firstname, lastname, service, mindset.name);

        const startX = marginX;
        const startY = doc.y;
        const tableWidth = doc.page.width - marginX * 2;
        const leftW = tableWidth * 0.35;
        const rightW = tableWidth * 0.65;
        const rowHeight = 180;

        doc.lineWidth(1).strokeColor('#000');

        doc
          .moveTo(startX, startY)
          .lineTo(startX + tableWidth, startY)
          .stroke();

        doc
          .moveTo(startX, startY)
          .lineTo(startX, startY + rowHeight)
          .stroke();

        doc
          .moveTo(startX + leftW, startY)
          .lineTo(startX + leftW, startY + rowHeight)
          .stroke();

        doc
          .moveTo(startX + tableWidth, startY)
          .lineTo(startX + tableWidth, startY + rowHeight)
          .stroke();

        doc
          .moveTo(startX, startY + rowHeight)
          .lineTo(startX + tableWidth, startY + rowHeight)
          .stroke();

        const imgPath = service.getAsset(`icons/${mindset.image}`);
        const imgSize = Math.min(leftW - 20, rowHeight - 20);

        doc.image(imgPath, startX + 10, startY + 10, {
          width: imgSize,
          height: imgSize,
        });

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(mindset.list, startX + leftW + 10, startY + 10, {
            width: rightW - 20,
            align: 'left',
          });

        const contentStartY = startY + rowHeight + 20;
        doc.y = contentStartY;

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(mindset.description, startX, doc.y, {
            width: tableWidth,
            align: 'justify',
          });

        doc.moveDown(1);

        if (mindset.last) {
          const items = mindset.last.split('\n');

          for (const item of items) {
            doc.font(fontNormal).fontSize(12).text(item, {
              width: tableWidth,
              align: 'left',
            });
          }
        }

        footer(doc);
      }
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Өсөлтийн сэтгэлгээ ба боловсрол',
      );

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Өсөлтийн сэтгэлгээний онол зарчим, үнэлгээ нь боловсролын салбарт хамгийн их судлагдаж, ашиглагддаг. Тухайлбал, тогтонги сэтгэлгээтэй сурагчидтай харьцуулахад өсөлтийн сэтгэлгээтэй сурагчид хичээлдээ илүү дуртай, хүнд хэцүү даалгавар дээр ажиллах сонирхол ихтэй, сурлагын сайн дүнтэй байдаг бөгөөд ирээдүйд амжилт гаргах, ядуурлаас гарах магадлал илүү байдаг талаар судалж тогтоосон байдаг.\n\nХүүхдүүдийг "Ухаантай шүү" зэргээр оюун ухааны чадварыг нь магтах нь тогтмол сэтгэлгээтэй болоход нөлөөлдөг бол, харин “Сайн хичээж байна шүү" гэх мэтчилэн хүчин чармайлтыг нь магтаж урамшуулах нь өсөлтийн сэтгэлгээтэй болоход илүү нөлөөлдөг талаар судалсан байдаг. Үүнтэй адилаар, эцэг эхчүүд хүүхдийн гаргасан алдаа, дутагдлыг огт байх ёсгүй зүйл гэж үздэг, алдаа гаргах үед нь шийтгэдэг бол хүүхэд нь тогтмол сэтгэлгээтэй байх магадлал илүү өндөр байдаг ажээ. ',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хэрхэн өсөлтийн сэтгэлгээг дэмжих вэ?',
      );
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(13)
        .text(
          'Хичээл зүтгэл, хүчин чармайлтыг үнэлж, илүү ач холбогдол өгч сурах',
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Та өөрийн салбартаа мэргэжилтэн болох урт замын дунд явж байна. Тиймээс та яг одоо л бүх зүйлийг мэддэг эвсэл таны хийсэн бүх зүйл үргэлж төгс төгөлдөр байх албагүй юм. Алдаа гаргах үедээ өөртөө хэт хатуу хандаж, өөрийгөө шүүмжлэхийн оронд алдаа, дутагдлаасаа суралцаж, өсөж хөгжих боломж гэж хараарай.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('"Одоохондоо" гэдэг үгийг ашиглах')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          '"Одоохондоо" эсвэл “хараахан” гэдэг үгсийг ашигласнаар та ирээдүйд илүүтэй анхаарлаа хандуулж сурах бөгөөд юмсыг илүү эергээр, өсөн дэвжих боломж гэж харахад тусална. Жишээлбэл дараах өгүүлбэрийг ашиглаж болно: "Би одоохондоо энэ асуудлыг хэрхэн шийдэхээ мэдэхгүй ч удахгүй мэддэг болно", эсвэл "Би илүү их хичээж, дараагийн удаа илүү сайн хийх болно."',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Өөрийн дотоод хүндээ илүү анхаарлаа хандуулж сурах')
        .moveDown(0.5);

      const pageWidth = doc.page.width;
      const columnGap = 20;
      const availableWidth = pageWidth - marginX * 2 - columnGap;

      const textWidth1 = availableWidth * 0.6;
      const imageWidth1 = availableWidth * 0.4;

      const startY1 = doc.y;

      const imageX1 = marginX + imageWidth1 + columnGap;

      doc.image(
        service.getAsset('icons/mindset4', 'jpg'),
        marginX + 2,
        startY1,
        {
          width: imageWidth1,
        },
      );

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Бусад хүнтэй өөрийгөө харьцуулах, гадаад орчинд анхаарлаа хандуулахын оронд өөртөө, өөрийн бодол санаанд илүү анхаарлаа хандуулах нь сэтгэл хөдлөл, сэтгэл зүйгээ хянаж, зохицуулж, илүү эерэг үзэл бодлыг бий болоход тусалдаг. Та өөрийн дотоод хүнтэйгээ илүү найз, нөхрийн хувиар ярилцах байдлаар өөртөө илүү их анхаарал хандуулж болно. Ялангуяа алдаа, дутагдал гаргасан, хүнд хэцүү бэрхшээл, сорилтуудтай тулгарсан үедээ энэ аргыг ашиглаж үзээрэй.\n\nХэрвээ та өсөлттэй сэтгэлгээний талаар илүү их сонирхож, дэлгэрэнгүй мэдээлэл авахыг хүсэж буй бол цаашид Кэрол Двек зохиолчийн “Сэтгэлгээ” номыг уншихыг санал болгож байна. ',
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
          'Кэрол Двек зохиолчийн “Сэтгэлгээ: Амжилтын тухай сэтгэл судлалын шинэ чиглэл” буюу Mindset: The New Psychology of Success ном (2006 он)',
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
          'Dweck, C.S., Chiu, C.Y. and Hong, Y.Y., 1995. Implicit theories and their role in judgments and reactions: A word from two perspectives. Psychological inquiry, 6(4), pp.267-285.\n\nDweck CS. Mindset: The new psychology of success. Random house; 2006 Feb 28.\n\nGlerum J, Loyens SM, Rikers RM. Mind your mindset. An empirical study of mindset in secondary vocational education and training. Educational Studies. 2020 May 3;46(3):273-81.\n\nSigmundsson H, Haga M. Growth mindset scale: Aspects of reliability and validity of a new 8-item scale assessing growth mindset. New Ideas In Psychology. 2024 Dec 1;75:101111.',
          {
            align: 'justify',
          },
        )
        .moveDown(0.5);
      footer(doc);
    } catch (error) {
      console.log('mindset', error);
    }
  }
}
