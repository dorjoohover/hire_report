import { Injectable } from '@nestjs/common';
import { ResultEntity, ExamEntity } from 'src/entities';
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
@Injectable()
export class MBTI {
  static values = [
    {
      title: 'Энерги, анхаарлаа зарцуулах байдал:',
      color: colors.blockTeal,
      values: [
        {
          name: 'Экстроверт',
          name_full: 'Extraversion',
          key: 'E',
          color: colors.turquoise,
          description:
            'Экстроверт төрлийн хүмүүс бусадтай хамтарсан, багаар хийх үйл ажиллагаанд дуртай, илүү нийгмийн идэвхтэй. Хүмүүстэй уулзах, нийгмийн харилцаанд орсноор илүү эрч хүчтэй болдог. Интроверт хүмүүстэй харьцуулахад сэтгэл хөдлөл ихтэй, аливаа зүйлд амархан сэтгэл нь хөдөлдөг.',
        },
        {
          name: 'Интроверт',
          name_full: 'Introversion',
          key: 'I',
          color: colors.lightTeal,
          description:
            'Интроверт төрлийн хүмүүс ганцаараа бие даан хийж болох ажил, хөдөлмөрийг илүүд үздэг. Интровертуудын хувьд өөрсдийн дотоод ертөнц, төсөөлөлдөө илүү ач холбогдол өгч, анхаарлаа, энергиэ зарцуулдаг. Тэд дуу чимээ, хурц үнэр зэрэг гаднын нөлөөнд илүү эмзэг, мэдрэмтгий байдаг.',
        },
      ],
    },
    {
      title: 'Мэдээллийг хүлээж авах байдал:',
      color: colors.blockIndigo,
      values: [
        {
          name: 'Бодит байдал',
          name_full: 'Sensing',
          key: 'S',
          color: colors.softIndigo,
          description:
            'Бодит мэдээлэлд чиглэсэн буюу ажиглагч байдлын хүмүүс илүү практикт суурилсан, бодит байдалд тулгуурласан, ажиглалт, туршлага, хэмжилтэд суурилсан мэдээллийг чухалчилдаг.',
        },
        {
          name: 'Хийсвэр байдал',
          name_full: 'Intuition',
          key: 'N',
          color: colors.lavenderIndigo,
          description:
            'Хийсвэр мэдээлэлд чиглэсэн буюу төсөөлөмтгий хүмүүс нь илүү юмыг төсөөлөн бодох, хийсвэрлэх сэтгэлгээ сайтай, аливаа шинэ санаа санаачлагд нээлттэй ханддаг, сониуч байдаг. Энэ төрлийн хүмүүс хуучинсаг, тогтсон хэв загварт дургүй бөгөөд мэдээллийн цаад далд утга учир, ирээдүйн боломжит хувилбаруудыг анхаарч үздэг.',
        },
      ],
    },
    {
      title: 'Шийдвэр гаргах байдал:',
      color: colors.blockRed,
      values: [
        {
          name: 'Бодох',
          name_full: 'Thinking',
          key: 'T',
          color: colors.crimson,
          description:
            'Учир шалтгаан, логик сэтгэлгээ, объектив мэдээлэл, бодит үр дүнд үндэслэн шийдвэр гаргадаг хүмүүс. Энэ төрлийн хүмүүс шийдвэр гаргахдаа сэтгэл хөдлөлөө дарж, хүмүүстэй хамтрахаас илүү үр ашигтай ажиллах байдлыг илүү чухалчилж үздэг. ',
        },
        {
          name: 'Мэдрэх',
          name_full: 'Feeling',
          key: 'F',
          color: colors.rose,
          description:
            'Энэ төрлийн хүмүүс илүү мэдрэмтгий, сэтгэл хөдлөл ихтэй, бусад хүнийг ойлгох чадвар сайтай, урлагийн мэдрэмж өндөртэй, бусадтай нийтэч, нийцтэй байхыг эрхэмлэдэг.\nТэд субьектив мэдээлэл, өөрсдийн мэдрэмж, сэтгэл хөдлөл, үзэл дээр тулгуурласан шийдвэрийг илүүтэй гаргадаг.',
        },
      ],
    },
    {
      title: 'Гадаад орчин, хүмүүст хандах байдал:',
      color: colors.blockOrange,
      values: [
        {
          name: 'Зарчимч',
          name_full: 'Judging',
          key: 'J',
          color: colors.amberOrange,
          description:
            'Энэ төрлийн хүмүүс шийдэмгий, хариуцлагатай, хувийн эмх цэгц, зохион байгуулалтыг эрхэмлэдэг. Тэд аливаа зүйлс тодорхой, ойлгомжтой, төлөвлөгөөний дагуу явагдах нь зүйтэй гэж үздэг.',
        },
        {
          name: 'Зохицогч',
          name_full: 'Perceiving',
          key: 'P',
          color: colors.gold,
          description:
            'Энэ төрлийн хүмүүс аливаа зүйлд хандахдаа илүү уян хатан, нээлттэй ханддаг бөгөөд дасан зохицох, хөрвөх чадвар сайтай. Тэд боломжийг олж харах, бий болгохдоо сайн.',
        },
      ],
    },
  ];
  static pattern = {
    Шинжээч: ['ISTJ'],
    Хамгаалагч: ['ISFJ'],
    Зөвлөгч: ['INFJ'],
    Төлөвлөгч: ['INTJ'],
    Мэргэжилтэн: ['ISTP'],
    Аялагч: ['ISFP'],
    Эвлэрүүлэгч: ['INFP'],
    Судлаач: ['INTP'],
    Санаачлагч: ['ESTP'],
    Хөгжөөгч: ['ESFP'],
    Зохицуулагч: ['ENFP'],
    Мэтгэлцэгч: ['ENTP'],
    Удирдагч: ['ESTJ'],
    Туслагч: ['ESFJ'],
    Нөлөөлөгч: ['ENFJ'],
    Тушаагч: ['ENTJ'],
  };

  static names = {
    E: 'Экстроверт',
    I: 'Интроверт',
    S: 'Бодит байдал',
    N: 'Хийсвэр байдал',
    T: 'Бодох',
    F: 'Мэдрэх',
    J: 'Зарчимч',
    P: 'Зохицогч',
  };
  constructor(private vis: VisualizationService) {}

  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    header(doc, firstname, lastname);
    title(doc, result.assessmentName);
    info(
      doc,
      exam.assessment.author,
      exam.assessment.description,
      exam.assessment.usage,
    );

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Та өмнө нь яагаад өөрийгөө олон хүнтэй үдэшлэгт очих дургүй атлаа гэртээ ганцаараа дуртай киногоо үзэхийг илүүд үздэг юм бол гэж бодож байсан уу? Яагаад зарим хүн лифтэнд хамт суусан танихгүй хүнтэй шууд, нээлттэй ярилцаж чаддаг байхад бусад нь тэгж чаддаггүй вэ? Яагаад зарим хүн чанга дуу чимээтэй, олон хүнтэй газраас эрч хүчээ авдаг байхад, харин энгийн жижиг чимээ ч хүртэл анхаарлыг чинь сарниулдаг юм бол?\n\nҮнэндээ таны өдөр тутамдаа хийдэг эдгээр үйлдлүүд нь огт санамсаргүй тохиолдлын чанартай биш, харин үүний цаана сайтар судлагдсан сэтгэл зүйн онол, загварууд, хувь хүний төрлүүд оршин байдаг.\n\nШинжлэх ухааны түүхэнд тод мөрөө үлдээсэн алдарт сэтгэл судлаач Карл Юнг одоогоос зуу гаруй жилийн өмнө сэтгэл судлал, зан төрхийн хувьд хүмүүс дотроо тодорхой төрөл, бүлгүүдэд хуваагддаг талаар өөрийн онолыг танилцуулж байжээ. Үүнээс хойш олон судлаачид энэхүү онол дээр суурилан, хүний хэв шинж, зан төрхийг илрүүлэх төрөл бүрийн тестүүдийг хөгжүүлж, гаргажээ. Энэ төрлийн тестүүдээс хамгийн ихээр олон хүнд хүрсэн, алдартай болсон, дэлхий даяар өргөнөөр ашиглагддаг тест бол хувь хүний 16 хэв шинжийг тодорхойлох тест юм.',
        { align: 'justify' },
      )
      .moveDown(1);

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
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Алдарт Швейцарын сэтгэл судлаач, философич Карл Юнг (1875-1961)-ын дэвшүүлсэн хувь хүний хэв шинжийн талаарх анхны онолыг Кэтрин Бриггс болон түүний охин Изабел Майерс нар цаашид тест болгон хөгжүүлж, өөрсдийн нэрээр Майерс-Бриггсийн зан төрхийн тест (MBTI) хэмээн нэрлэсэн нь дэлхий даяар олонд хүнд түгээж, маш их алдартай болжээ.',
        { align: 'justify' },
      )
      .moveDown(1);

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Хувь хүний 16-н шинж');

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Энэхүү тест нь хувь хүний зан төрхийн өвөрмөц онцлогийг үндсэн 4 хэмжээсээр үнэлж, хүмүүсийг 16 хэв шинжид хуваадаг. Монголчууд бидний олонх нь дөрвөн темперамент (холерик, сангвиник, флегматик, меланхолик)-ын онол загвартай аль хэдийн танил болсон билээ. Тэгвэл дэлхий дахинд хувь хүний 16 хэв шинжийн онол нь энэхүү дөрвөн темпераментын онолтой адил маш их алдартай бөгөөд, сүүлийн үед хэрэглээ нь улам ихэссээр байна.\n\nЭдгээр 16 хэв шинжийг дараах 4 хэмжээсний хослолоор үнэлдэг:',
        { align: 'justify' },
      )
      .moveDown(1);
    for (let i = 0; i < MBTI.values.length; i++) {
      const dim = MBTI.values[i];

      const titleHeight = 24;
      const titleWidth = doc.page.width - marginX * 2;

      doc.rect(marginX, doc.y, titleWidth, titleHeight).fill(dim.color);

      doc
        .font('fontBlack')
        .fontSize(13)
        .fillColor('#ffffff')
        .text(dim.title, marginX, doc.y + 6.5, {
          width: titleWidth,
          align: 'center',
        });

      const sectionY = doc.y;

      doc
        .moveTo(marginX, sectionY)
        .lineTo(doc.page.width - marginX, sectionY)
        .lineWidth(4)
        .strokeColor(dim.values[0].color)
        .stroke();

      doc.moveDown(0.5);

      const colWidth = (doc.page.width - marginX * 2 - 20) / 2;
      let startX = marginX;
      let startY = doc.y;

      for (const trait of dim.values) {
        doc
          .font('fontBlack')
          .fontSize(13)
          .fillColor(trait.color)
          .text(trait.name, startX, startY);

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(trait.color)
          .text(trait.name_full, startX, startY + 15);

        const circleRadius = 12;
        const circleX = startX + colWidth - circleRadius * 2 + 12;
        const circleY = startY;

        doc
          .circle(circleX, circleY + circleRadius, circleRadius)
          .fill(trait.color);

        doc
          .font('fontBlack')
          .fontSize(12)
          .fillColor('#fff')
          .text(trait.key, circleX - circleRadius + 1, circleY + 6, {
            width: circleRadius * 2 - 2,
            align: 'center',
          });

        doc
          .moveDown(1)
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(trait.description, startX, doc.y, {
            width: colWidth,
            align: 'justify',
          });

        startX += colWidth + 20;
      }

      doc.moveDown(2);

      if (i === 1) {
        doc.lineWidth(1);
        footer(doc);
        doc.addPage();
        header(doc, firstname, lastname, 'Хувь хүний 16-н хэв шинж');
      }
    }

    doc
      .font(fontNormal)
      .fontSize(12)
      .lineGap(lh.md)
      .fillColor(colors.black)
      .text(
        'Энэхүү 4 хэмжээсний төрөл бүрийн хослолоос нийт 16-н өвөрмөц, хоорондоо ялгаатай хэв шинжүүд үүсдэг. Жишээлбэл: Хэрэв та INTJ хэв шинжтэй бол энэ нь Интроверт - Хийсвэр байдал - Бодох - Зарчимч гэсэн 4 төрлийн хослолыг илэрхийлэх бөгөөд хэв шинжийн төрлүүдийг агли нэрийн эхний үсгээр нь кодлогдож хэрэглэх нь түгээмэл байдаг (INTJ -Introversion - Intuition -  Thinking - Judging).\n\nЭдгээр 16-н хэв шинжийн аль нэг нь сайн, эсвэл аль нэг нь муу гэсэн ойлголт огт байхгүй. Энэхүү сорилын гол зорилго нь таныг өөрийн өвөрмөц зан төлөвийг тодорхойлж, өөрийгөө илүү сайн, зөвөөр ойлгоход туслах юм. Одоо таны хэв шинж таны тухай юу өгүүлж буйг харцгаая!',
        marginX,
        doc.y,
        { align: 'justify' },
      )
      .moveDown(1);
    doc.lineWidth(1);
    footer(doc);

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Тестийн хэрэглээ, анхаарах зүйлс');

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
        'Хувь хүний 16-н хэв шинжийн тест буюу Юнгын тест нь MBTI буюу Майер-Бриггсийн хувь хүний хэв шинжийг тодорхойлох тесттэй адил төстэй. Бидний ашиглаж буй тестийн хувилбар нь Карл Юнгын онолд суурилагдсан, Эрик Жоргенсоны боловсруулж, хөгжүүлсэн, нийт 32 асуулт бүхий тестийн хувилбар юм (Open Extended Jungian Type Scales 1.2). Энэхүү тест түгээмэл хэрэглэгддэг, харьцангуй судлагдсан.',
        { align: 'justify' },
      )
      .moveDown(1);
    doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!\n\nХэдийгээр 16-н хэв шинжийн тест нь дэлхий даяар маш их алдартай, өргөнөөр тархсан болов ч академик судалгаанд энэ төрлийн тестийг төдийлөн ашигладаггүй болохыг анхаарна уу.\n\nБидний ашиглаж буй тест нь Майер-Бриггсийн тестээс ялгаатай өөр хувилбар бөгөөд энэ тесттэй холбоотой ямар нэгэн зохиогчийн болон худалдааны эрхийг зөрчөөгүй болно.',
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
        'Хувь хүний хэв шинж тус бүрд харгалзах тестийн оноог ойлгомжтой, дэлгэрэнгүй тайлбарлахын тулд 4-н хэмжээс тус бүр дээр график үүсгэж, хоорондоо эсрэг тэсрэг хослолуудыг графикийн хоёр талд харуулсан. График дээрээс давамгайлан илэрч буй хэмжээсний төрлийг хувиар илэрхийлсэн.',
        { align: 'justify' },
      )
      .moveDown(2);
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text('44% - Интроверт', { align: 'center' });
    const imgPath2 = assetPath('icons/bar');
    const imgWidth2 = doc.page.width - 2 * marginX;

    doc.image(imgPath2, marginX, doc.y - 1, { width: imgWidth2 });
    const leftLabel = 'E - Экстроверт';
    const rightLabel = 'I - Интроверт';

    const y = doc.y + 24;

    doc
      .font('fontBlack')
      .fontSize(12)
      .fillColor(colors.black)
      .text(leftLabel, marginX, y, { align: 'left' });

    doc
      .font('fontBlack')
      .fontSize(12)
      .fillColor(colors.black)
      .text(rightLabel, marginX, y, { align: 'right' });

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Сорилын үр дүн');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Үндсэн 4 хэмжээст харгалзах таны тестийн оноог хувиар тооцоолж графикт үзүүлэв.',
        { align: 'justify' },
      )
      .moveDown(1);

    const categories = result.details.map((detail) => detail.value);

    const values = result.details.map((detail) => Number(detail.cause));
    const percentages = values.map((value) => Math.round((value / 40) * 100));
    const divisors = [100, 100, 100, 100];

    const bar_color_start = ['#FF7F50', '#1E90FF', '#32CD32', '#9370DB'];
    const bar_color_end = ['#FF4500', '#00BFFF', '#228B22', '#8A2BE2'];

    for (let index = 0; index < categories.length; index++) {
      const names = ['Интроверт', 'Хийсвэр байдал', 'Мэдрэх', 'Зохицогч'];
      const names_start = [
        'I - Интроверт',
        'N - Хийсвэр байдал',
        'F - Мэдрэх',
        'P - Зохицогч',
      ];
      const names_end = [
        'E - Экстроверт',
        'S - Бодит байдал',
        'T - Бодох',
        'J - Зарчимч',
      ];

      const category = names[index];
      const value = Number(values[index]);

      const pct = Math.round((value / 40) * 100);
      const userText = `${pct}% - ${category}`;

      if (index > 0) {
        doc.moveDown(0.75);
      }

      const buffer = await this.vis.bar2(
        percentages[index],
        divisors[index],
        bar_color_start[index],
        bar_color_end[index],
        userText,
      );

      doc.image(buffer, {
        width: doc.page.width - marginX * 2,
        height: (130 / 1800) * (doc.page.width - marginX * 2),
      });
      const y = doc.y + 29;

      doc
        .font('fontBlack')
        .fontSize(12)
        .fillColor(colors.black)
        .text(names_end[index], marginX, y, { align: 'left' });

      doc
        .font('fontBlack')
        .fontSize(12)
        .fillColor(colors.black)
        .text(names_start[index], marginX, y, { align: 'right' });
    }
    doc.moveDown(1);
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text('Таны хувь хүний хэв шинж бол', { align: 'justify' });

    doc
      .font('fontBlack')
      .fontSize(16)
      .fillColor(colors.orange)
      .text(result.value)
      .moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text('Таны мэргэжлийн сонирхолд тохирох код бол');

    const baseX = doc.x;
    const baseY = doc.y;

    const codeWidth = doc
      .font('fontBlack')
      .fontSize(18)
      .fillColor(colors.orange)
      .widthOfString(result.result.toString());

    const buyuuWidth = doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .widthOfString(' буюу ');

    doc
      .font('fontBlack')
      .fontSize(18)
      .fillColor(colors.orange)
      .text(result.result.toString(), baseX, baseY);

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(' буюу ', baseX + codeWidth + 1, baseY + 4.5);

    const namesMN = result.result
      .split('')
      .map((letter) => MBTI.names[letter])
      .join(', ');

    console.log(namesMN);

    doc
      .font('fontBlack')
      .fontSize(14)
      .fillColor(colors.orange)
      .text(namesMN, baseX + codeWidth + 1 + buyuuWidth, baseY + 3.5)
      .moveDown(0.75);
  }
}
