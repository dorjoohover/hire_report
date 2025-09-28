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
import { VisualizationService } from '../visualization.service';

const sharp = require('sharp');

interface Result {
  name: string;
  intro: string;
  description: string;
  image: string;
  high: string;
  low: string;
}

@Injectable()
export class PSI {
  constructor(private vis: VisualizationService) {}

  public result(v: string) {
    let res: Result = {
      name: '',
      intro: '',
      description: '',
      image: '',
      high: '',
      low: '',
    };

    const value = v.toLowerCase();
    if (value == 'удирдагч') {
      res = {
        name: 'Удирдагч',
        intro: '“Хамтдаа хийцгээе! Гэхдээ миний төлөвлөсөн замаар!”',
        description:
          'Удирдагч хэв шинжтэй хүмүүс нь өөртөө итгэлтэй, урдаа тавьсан зорилготой, тэрхүү зорилгодоо хэрхэн хүрэх арга замаа сайн мэддэг, зогсолтгүй тэмүүлдэг гэж гадна талаасаа харагддаг.\n\nЭнэ төрлийн зан төлөвтэй хүмүүс нь бусдад таалагдах гэж хичээхээс илүүтэй амжилт, үр дүнг чухалчилж үздэг. Тиймээс нийгмийн харилцаанд илүү биеэ даасан, өрсөлдөх дуртай бөгөөд төдийлөн яриасаг бус, зарим талаар харилцахад төвөгтэй хүмүүс гэж тодорхойлогддог.\n\nУдирдагчид шийдвэр гаргахдаа сайн, үг ярианаас илүү үйлдэл, үр дүнг чухалчилдаг, өөрийн сэтгэл хөдлөлөө тэр бүр ил гаргадаггүй. Хэдийгээр удирдагч төрлийн хүний гаргаж буй үйлдэл өөрт нь тодорхой мэт санагдаж болох ч, уг үйлдэл, шийдвэрийг гаргасан цаад учир шалтгаан нь бусад хүмүүст ойлгогдохгүй байх тохиолдол бий. Тийм учраас бусад хүмүүс удирдагчдыг хувь хүний талаас нь төдийлөн сайтар ойлгож, гүнзгий таньж мэдэж чаддаггүй байна.\n\nБусад хүмүүс тэднийг зөвхөн зорилгоо биелүүлэх, ажлаа хийхийн тулд л хүмүүстэй харилцаж, хамтран ажилдаг гэж хардаг ч, яг үнэндээ удирдагч төрлийн хүмүүсийн дунд нөхөрсөг, тусч, эелдэг зантай хүмүүс олон бий.',
        image: 'psi1',
        high: '• Хүсэл тэмүүлэлтэй\n• Биеэ даасан\n• Практикт суурилсан\n• Шийдэмгий',
        low: '• Хатуу\n• Албадангуй\n• Дүрэмдэх\n• Хэт их нөлөөлөх, шамдуулах',
      };
    }
    if (value == 'илтгэгч') {
      res = {
        name: 'Илтгэгч',
        intro: '“Хамтдаа хийцгээе! Би эхлээд ярья!”',
        description:
          'Бусад хүмүүсийн хувьд “Илтгэгч” зан төрхтэй хүмүүс нь нөхөрсөг, нийтэч, яриасаг, дулаан уур амьсгал бүрдүүлэгч, үл ялиг бусадтай өрсөлдөх дуртай гэж харагддаг. Тэд бусад хүмүүстэй харилцахдаа өөрсдийн мэдрэмж, үзэл бодлоо чөлөөтэй илэрхийлдэг. \n\nХүмүүстэй харилцахад гаргадаг үйлдлээс нь илтгэгч төрлийн хүмүүсийг нөхөрсөг, бусадтай аль болох танилцах, найзлахыг хичээдэг, бусад хүмүүсийг зорилго, мөрөөдөлдөө хүрэхэд нь дэмжиж, тусалдаг гэж тодорхойлно.\n\nГэхдээ илтгэгч нар бусдад туслахаас гадна мөн алдар нэр, эрх мэдэлд дуртай, өөрийн хувийн үйл хэрэг, зорилгод бусад хүмүүсийг татан оролцуулах, бусдад нөлөөлөл үзүүлж чадах давхар эрмэлзэлтэй гэдгийг дурдах нь зүйтэй. \n\nХэдийгээр андлал нөхөрлөл, хүмүүсийн харилцаа холбоо илтгэгч хүмүүсийн хувьд чухал болов ч, бусад хүмүүс энэхүү харилцааг өнгөц, тур зуурын гэж харах нь элбэг гэдгийг анхаарах хэрэгтэй.',
        image: 'psi2',
        high: '• Амбицтай\n• Өдөөгч, урам зориг өгөгч\n• Нөхөрсөг\n• Урам зоригоор дүүрэн',
        low: '• Хэт их сэтгэл хөдлөлтэй\n• Туйлбаргүй\n• Эго ихтэй\n• Бусдад хэт их нөлөөлөх, залах',
      };
    }
    if (value == 'нийтэч') {
      res = {
        name: 'Нийтэч',
        intro: '“Хамтдаа хийцгээе! Хамгийн гол нь эв найртай байцгаая!”',
        description:
          'Нийтэч зан төрхтэй хүмүүс найрсаг, нөхөрсөг, бусдыг хүндэлж, эелдэг харьцдаг, нөхөрлөлийг ихэд чухалчилж үздэг. Тэд харилцаанд дулаан уур амьсгал бүрдүүлж, бусдад баяр баясал төрүүлж чаддаг.\n\nЭнэ төрлийн хүмүүс дэлхий ертөнцийг өөрсдийн нүдээр харж, тайлбарладаг, сэтгэл хөдлөл ихтэй, хүмүүс хоорондын харилцааг анхааран сонирхдог. "Хэн хэнтэй хамт юу хийсэн, яагаад?" гэсэн асуултыг өөрөөсөө асуудаг хүмүүс юм. \n\nНийтэч хүмүүс бусадтай хамтран ажиллах үедээ, бусдыг хүчилж, тэдэнд нөлөөлж, удирдахаас илүүтэй харилцан ойлголцсон, нэг нэгнээ хүндэлсэн зарчмаар ажиллахыг илүү зорьдог. Сонирхолтой нь тэдний хувьд бусдаас илүү гарах, эрх мэдэлд хүрэх нь төдийлөн чухал зүйл биш ч гэсэн бусдад таалагдах, хүлээн зөвшөөрөгдөж, хүндлэгдэхийг мөн дотроо хүсэж байдаг. Харин нөгөө хүн нь нөхөрсөг, найрсаг зантай бол удирдлага, зааврыг нь дуртайяа дагах хандлагатай. ',
        image: 'psi3',
        high: '• Дэмжигч, туслагч\n• Бусдыг хүндэлдэг\n• Эвсэг\n• Хариуцлагатай',
        low: '• Хэт тайван\n• Эргэлздэг\n• Итгэмтгий\n• Бусдад хэт найдах',
      };
    }
    if (value == 'ажиглагч') {
      res = {
        name: 'Ажиглагч',
        intro: '“Хамтдаа хийцгээе! Эхлээд байгаа бүх мэдээллээ гаргаад ир!”',
        description:
          'Гаднаас нь харахад “Ажиглагч” зан төрхтэй хүмүүс баримт, нотолгоонд, зарчим, логик дээр суурилсан байдлаар амьдралд ханддаг. Ажиглагч хэв маягтай хүмүүсийг бусад хүмүүс сэтгэл хөдлөл багатай эсвэл хүйтэн хөндий, зожиг гэж харах нь олонтой. Хэдийгээр тэд биеэ даасан, төдийлөн яриасаг биш ч, хэрвээ хувийн орон зайг нь өгвөл сайн хамтран ажиллагч нар байж чадна. \n\nАжиглагчид хүмүүстэй холбоо харилцаа тогтоохдоо илүү хойш суусан, болгоомжтой ханддаг бөгөөд аль болох бусад хүмүүсийн оролцоо багатайгаар, ажлыг өөрсдөө биеэ даан хийхийг илүүд үздэг. Хэдийгээр энэ төрлийн хүмүүс бусдаас зайгаа барьсан, хүйтэн хөндий мэт санагдав ч анд нөхрийн холбоог маш ихээр чухалчилж үздэг гэдийг тодотгож хэлэх хэрэгтэй. \n\nАжиглагч зан төрхтэй хүмүүс юуны өмнө эхлээд “мэдээллээ, датагаа шалгая” гэсэн хандлагыг баримталдаг. Тэд эрх мэдлийн араас төдийлөн хөөцөлддөггүй. Гэхдээ зорилгодоо хүрэхэд зайлшгүй шаардлагатай үед удирдлагыг өөрсдийн гартаа авч жолоодохоос буцахгүй. ',
        image: 'psi4',
        high: '• Ажил хэрэгч\n• Тууштай\n• Нухацтай\n• Нарийн, нягт',
        low: '• Шүүмжлэгч\n• Шийдвэр гаргахдаа удаан\n• Их гомдоллодог\n• Хэт ёс зүйг баримтлах',
      };
    }
    return res;
  }

  async template(
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    try {
      header(doc, firstname, lastname);
      title(doc, result.assessmentName);
      info(
        doc,
        exam.assessment.author,
        exam.assessment.description,
        exam.assessment.measure,
        exam.assessment.usage,
      );
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Оршил')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэхүү тест нь нийгмийн харилцаанд хүмүүсийн гаргадаг зан төрхийг үнэлrж, харилцааны хэв шинжийг тодорхойлох үндсэн зорилготой. Та өөрийн өвөрмөц хэв шинж, зан төлөвийг мэдэж авснаар өөрийгөө илүү сайн таньж мэдэхээс гадна цаашид хүмүүстэй харилцах харилцаагаа илүү бүтээмжтэй, үр дүнтэйгээр удирдан ашиглаж болно. Мөн түүнэчлэн хүмүүс хоорондын харилцаанд ажиглагддаг ерөнхий зан төлөвийн онцлог шинжүүдийг ойлгож, мэдэж авсны дараагаар энэхүү мэдлэгээ ашиглан бусад хүмүүсийн гаргах үйлдлийг урьдчилан таамаглах боломж олдох юм.\n\nДэвид Меррил, Рожер Рийд нарын судлаачдын анх хөгжүүлсэн энэхүү онол, тест нь дэлхий даяар түгэн дэлгэрч, хамгийн ихээр ашиглагддаг тестүүдийн нэг болсон юм. TRACOM группээс гаргасан SOCIAL STYLE® тестийн хувилбарыг л авч үзэхэд, нийт 20 гаруй хэл дээр 100 гаруй оронд ашиглагддаг байна.',
          { align: 'justify' },
        );

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, 'Тестийн тухай');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тест нь хүмүүсийн нийгмийн харилцаанд гаргадаг зан төрхийг үзэл бодлоо илэрхийлэх байдал болон сэтгэл хөдлөлөө илэрхийлэх байдал гэсэн хоёр хэмжээсээр үнэлж, доор үзүүлсэн 4 хэв шинжид хуваадаг. Тухайлбал: Удирдагч, илтгэгч, нийтэч  болон ажиглагч.',
          { align: 'justify' },
        );
      doc.image(assetPath(`icons/PSI-graphic`), {
        width: doc.page.width - marginX * 2,
      });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэхүү 2 хэмжээсний төрөл бүрийн хослолоос нийт 4 өөр төрлийн өвөрмөц, хоорондоо ялгаатай хэв шинжүүд үүсдэг. Жишээлбэл: Хэрэв та бусад хүмүүстэй харьцуулахад үзэл бодлоо чөлөөтэй илэрхийлж чаддаг буюу сонсохоос илүүтэй өөрөө ярьдаг болов ч сэтгэл хөдлөлөө илэрхийлэхдээ тийм ч сайн биш буюу сэтгэл хөдлөлөө дардаг, дотроо хадгалдаг бол та “Удирдагч” төрлийн харилцааны хэв шинжтэй гэсэн үг.\n\nЭдгээр 4-н төрлийн хэв шинжийн аль нэг нь сайн, эсвэл аль нэг нь муу гэсэн ойлголт огт байхгүй. Энэхүү сорилын гол зорилго нь таны бусадтай харилцах харилцаанд гаргаж буй өвөрмөц зан төлөвийг тодорхойлж, өөрийгөө илүү сайн, зөвөөр ойлгоход туслах юм. Одоо таны хэв шинж таны тухай юу өгүүлж буйг харцгаая!',
          marginX,
          doc.y + 290,
          { align: 'justify' },
        );

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
          'Анх 1981 онд Дэвид Меррил, Рожер Рийд нар хүмүүсийн нийгмийн харилцаанд гаргадаг хэв шинжүүдийг судалж, өөрсдийн онол, загвараа ном болгон хэвлүүлж, олонд танилцуулж байжээ. Үүнээс хойш “Меррил-Рийд”-ын харилцааны хэв шинжийн онол, загвар дээр суурилсан олон төрлийн тестүүд гарсан байдаг. Бидний одоо ашиглаж буй тест нь доктор “Меррил-Рийд”-ын анхны онол, асуулт дээр суурилж Вашингтоны Их Сургуулийн эрдэмтэдийн нэмж хөгжүүлж, боловсруулсан хувилбар юм. Энэхүү тестийн үндсэн хувилбар нь олон улсад түгээмэл хэрэглэгддэг, харьцангуй сайтар судлагдсан.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношлоно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу. Бидний ашиглаж буй тестийн хувилбар нь TRACOM группын SOCIAL STYLE® тестийн хувилбараас ялгаатай, өөр бөгөөд энэхүү тесттэй холбоотой ямар нэгэн зохиогчийн болон худалдааны эрхийг зөрчөөгүй болно!',
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
          'Бидний өмнө нь дурдсанчлан харилцааны хэв шинжүүдийн нэг нь нөгөөгөөсөө илүү эсвэл сайн гэсэн ойлголт байхгүй. Бүх хэв шинж нь өөрийн давуу болон сул талуудтай. Тухайн нөхцөл байдлаас шалтгаалан тодорхой хэв шинж нь зарим үед илүү ашигтай буюу үр дүнтэй байж болох юм.  ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Зөвхөн ганцхан төрлийн зан төрх үргэлж илрэхгүй. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хүн бүр дээрх 4-н хэв шинжийг бүгдийг нь тодрохой хэмжээгээр өөртөө агуулсан байдаг бөгөөд аль нэгэн хэв шинж эсвэл шинжүүд нь хосолсон байдлаар бусдаасаа илүү давамгайлж илэрч байдаг.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Харилцааны зан төрхийн байдал нь хувь хүний хэв шинжийг бүхэлд нь илэрхийлэхгүй. ',
          {
            continued: true,
          },
        );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Харилцааны зан төрхийн онол анх үүсч хөгжихдөө хувь хүний хэв шинж бус, харин хүний бодит амьдрал дээр гаргаж буй дадал зуршил, үйлдэл дээр илүүтэй суурилж, судлагдаж хөгжсөн байдаг. Тиймээс энэхүү тест, онол нь хувь хүний үндсэн хэв шинж, сэтгэцийн байдал эсвэл тухайн хүний хэрхэн бодож, мэдэрч буй талаарх ойлголтыг төдийлөн хөндөөгүй юм. Хэрвээ та хувь хүний хэв шинжтэй холбоотой мэдээллийг мөн адил сонирхож буй бол “Үндсэн 5-н хувь хүний хэв шинжийн тест”, “Хувь хүний 16-н хэв шинжийн тест буюу Юнгийн тест (MBTI-тест), “DiSC” зэрэг зан төрхийн хэв шинжийн тестүүдийг давхар өгөхийг санал болгож байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Ихэнх хүмүүс танаас өөр, ялгаатай. ', {
          continued: true,
        });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хүн бүр өөр өөрсдийн өвөрмөц хэрэгцээ, зорилготой. Тиймээс ихэнх хүн таниас өөр амьдралаар амьдарч, шийдвэр гаргаж, өөр хэлбэрээр харилцаж, маргаантай асуудалд өөр байдлаар хандаж, өөр шийдлийг олж хардаг гэдгийг санах хэрэгтэй.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Харилцааны үндсэн 4-н хэв шинж тус бүрд харгалзах оноог тооцоолж дараах графикт үзүүлэв. Хамгийн өндөр оноо бүхий хэв шинж нь таны хувь хүний үндсэн гол зан төрхийг илэрхийлж буй бол дараа дараагийн хамгийн өндөр оноо бүхий хэв шинж нь таны харилцаандаа гаргадаг дараачийн зан төрх, хэв шинжүүдийг заана.',
          { align: 'justify' },
        )
        .moveDown(1);
      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];
      const results = [];

      const max = details.reduce(
        (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
        details[0],
      );

      for (const detail of details) {
        const result = this.result(detail.value);
        indicator.push({
          name: result.name,
          max: +max.cause,
        });
        data.push(+detail.cause);
        results.push({ ...result, point: +detail.cause, value: detail.value });
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let png = await sharp(pie).png({ progressive: false }).toBuffer();
      doc.image(png, 75, y, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 5;
      let x = doc.x + (doc.page.width / 8) * 1.75 - marginX;

      y = doc.y + 50;
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
      results.map((res, i) => {
        y = doc.y;

        const color = colors.black;

        doc
          .font(fontNormal)
          .fillColor(color)
          .text(`${i + 1}.`, x, y);
        const name = res.name;
        doc.text(name, x + indexSize * 3, y);
        const pointWidth = doc.widthOfString(`${res.point}`);
        doc.text(
          `${res.point}`,
          x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
          y,
        );
        doc.y += 5;
      });
      doc.fillColor(colors.black);
      footer(doc);
      results.forEach((res) => {
        doc.addPage();

        header(doc, firstname, lastname, res.name);

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.intro)
          .moveDown(1);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Таны авсан оноо: ', doc.x, doc.y, { continued: true });

        doc
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(res.point.toString(), doc.x, doc.y - 2.5, { continued: false });

        const tableWidth = doc.page.width - 2 * marginX;
        const colWidths = [
          tableWidth * 0.3,
          tableWidth * 0.35,
          tableWidth * 0.35,
        ];

        const rowH1 = 27;
        const rowH2 = 140;

        let posX = marginX;
        let posY = doc.y + 10;

        const headers = ['', 'Давуу тал', 'Дутагдалтай тал'];

        headers.forEach((headerText, i) => {
          const x = posX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc
            .rect(x, posY, colWidths[i], rowH1)
            .strokeColor(colors.black)
            .stroke();
          doc
            .font(fontBold)
            .fontSize(12)
            .fillColor(colors.black)
            .text(headerText, x + 10, posY + 8, {
              width: colWidths[i] - 20,
              align: 'left',
            });
        });

        posY += rowH1;

        let x = posX;

        doc.rect(x, posY, colWidths[0], rowH2).stroke();
        const imgPath = assetPath(`icons/${res.image}`);
        const imgSize = Math.min(colWidths[0], rowH2);

        doc.image(imgPath, posX + 5, posY, {
          width: imgSize,
          height: imgSize,
        });

        x += colWidths[0];
        doc.rect(x, posY, colWidths[1], rowH2).stroke();
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.high, x + 10, posY + 10, {
            width: colWidths[1] - 20,
            align: 'left',
          });

        x += colWidths[1];
        doc.rect(x, posY, colWidths[2], rowH2).stroke();
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.low, x + 10, posY + 8, {
            width: colWidths[2] - 20,
            align: 'left',
          });

        posY += rowH2 + 20;

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.description, marginX, posY, {
            align: 'justify',
            width: tableWidth,
          })
          .moveDown(2);

        footer(doc);
      });
    } catch (error) {
      console.log('psi', error);
    }
  }
}
