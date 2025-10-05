import { Injectable } from '@nestjs/common';
import { color } from 'echarts';
import {
  AssessmentEntity,
  ResultDetailEntity,
  ResultEntity,
} from 'src/entities';
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
import { SinglePdf } from '../single.pdf';
const sharp = require('sharp');

interface Result {
  name: string;
  name_full: string;

  description: string;
  list: string;
  high: string;
  low: string;
}

@Injectable()
export class Genos {
  constructor(
    private vis: VisualizationService,
    private single: SinglePdf,
  ) {}

  public result(v: string) {
    let res: Result = {
      name: '',
      name_full: '',
      description: '',
      list: '',
      high: '',
      low: '',
    };

    const value = v.toLowerCase();
    if (value == 'өөрийн сэтгэл хөдлөлөө танин барих') {
      res = {
        name: 'Өөрийн сэтгэл хөдлөлөө танин барих',
        name_full: 'Өөрийн сэтгэл хөдлөлийг танин барих нь',
        description:
          'Өөрийн мэдрэмж, сэтгэл хөдлөлийг ухамсарлаж ойлгох чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд:',
        list: '• Ажил дээрх сэтгэл хөдлөл, сэтгэл санааны байдал болон мэдрэмжүүд\n• Мэдрэмжүүдийн учир шалтгаан\n• Мэдрэмжүүд таны бодол, шийдвэр гаргалт, зан төлөвт хэрхэн нөлөөлдөг',
        high: '• Та дуу хоолойны илэрхийлэмжээ мэддэг\n• Юу таны сэтгэлийг гонсойлгодог болохыг мэддэг.\n• Та өөрийн биеийн хэлэмжийн илэрхийллийг сайн мэддэг',
        low: '• Таны сэтгэл санааны байдал таны зан төлөвийг хөтөлж байгааг та анзаарч чаддаггүй\n• Аливаа асуудалтай холбоотой өөрийн сэтгэгдлийг тодорхойлоход танд хэцүү байдаг\n• Бусадтай харилцахад сэтгэл санааны байдал тань хэрхэн нөлөөлдөг болохыг та мэддэг',
      };
    }
    if (value == 'бусдын сэтгэл хөдлөлийг мэдэх') {
      res = {
        name: 'Бусдын сэтгэл хөдлөлийг мэдэх',
        name_full: 'Бусдын сэтгэл хөдлөлийг мэдэх нь',
        description:
          'Бусдын сэтгэлийн хөдлөлийг хүртэж ойлгох чадвар юм.  Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд: ',
        list: '• Хүмүүс ажил дээрх асуудлуудад хэрхэн хандаж байгааг\n• Хүмүүсийн сэтгэл зовних, өөдрөг байх зэрэг онцлог сэтгэл хөдлөлийн учир шалтгааныг ойлгодог байх\n• Ажил дээрх бусдын мэдрэмжүүдийг ойлгож байгаагаа илэрхийлэх',
        high: '• Та хамтрагчдаа юунд сэтгэл хангалуун болдог гэдгийг мэддэг\n• Бусдыг ажилдаа оролцоотой байлгахад юу нөлөөлдгийг та ойлгодог\n• Асуудалд хүмүүс хэрхэн хандаж байгааг та тодорхойлж чаддаг',
        low: '• Та бусад хүмүүс танд ямар хандаж байгааг нь тодорхойлж чаддаггүй\n• Юу бусдыг сэдэлжүүлдэг болохыг ойлгоход танд хүндрэлтэй байдаг\n• Нөхцөл байдалд тохироогүй сэтгэл хөдлөлийн хариу үйлдлийг ойлгож чаддаггүй',
      };
    }
    if (value == 'сэтгэл хөдлөлөө илэрхийлэх') {
      res = {
        name: 'Сэтгэл хөдлөлөө илэрхийлэх',
        name_full: 'Сэтгэл хөдлөлөө илэрхийлэх нь',
        description:
          'Сэтгэл хөдлөлийн илэрхийлэл гэдэг нь хэн нэгэн өөрийн сэтгэл хөдлөлийг зөв, ойлгомжтойгоор илэрхийлэх чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд: ',
        list: '• Ажил дээр зохих хэмжээгээр сэтгэл хөдлөлөө илэрхийлдэг\n• Ажлын хамт олонд эерэг хариу үйлдэл үзүүлдэг\n• Зөв цагт, зохих хэмжээгээр зөв хүнд сэтгэл хөдлөлөө илэрхийлдэг',
        high: '• Та бусдад эерэг эргэх холбоо (feedback) өгдөг\n• Та тулгарч буй асуудалтай холбоотой өөрийн сэтгэгдлээ үр дүнтэйгээр илэрхийлдэг\n• Та өөрийн сэтгэгдлээ зөв үед нь илэрхийлдэг',
        low: '• Та өөрийн мэдрэмжээ оновчтой үгээр илэрхийлэхдээ муу\n• Та эерэг сэтгэл хөдлөлөө тохиромжгүйгээр илэрхийлдэг',
      };
    }
    if (value == 'сэтгэл хөдлөлийн учир шалтгааныг таних') {
      res = {
        name: 'Сэтгэл хөдлөлийн учир шалтгааныг таних',
        name_full: 'Сэтгэл хөдлөлийн учир шалтгааныг таних нь',
        description:
          'Сэтгэл хөдлөлийн учир шалтгааныг таних гэдэг нь төлөвлөх болон шийдвэр гаргахад сэтгэл хөдлөл (өөрөөс болон бусдаас)-ийг таних чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд:',
        list: '• Шийдвэр гаргахад өөрийн болон бусдын сэтгэгдлийг харгалзаж үздэг\n• Шийдвэр гаргахдаа хүмүүсийн сэтгэгдлийг харгалзаж үзсэн гэдгийг бусдад нотолдог\n• Оролцогч талуудын итгэлийг олж авах болон шийдвэр гаргалтын талаар үр дүнтэйгээр мэдээлэлдэг',
        high: '• Та шийдвэр гаргахдаа боломжит хувилбаруудын талаарх бусдынхаа сэтгэгдлийг сонсдог\n• Та ажилтай холбоотой шийдвэр гаргахдаа хүлээсэн үүргээ бодолцдог\n• Та гаргасан шийдвэрийнхээ талаар бусдад зохистойгоор тайлбарлаж чаддаг',
        low: 'Энэ ур чадварын хэсэгт таны хувьд сул тал байхгүй байна.',
      };
    }
    if (value == 'сэтгэлийн хөдөлгөөнөө удирдах') {
      res = {
        name: 'Сэтгэлийн хөдөлгөөнөө удирдах',
        name_full: 'Сэтгэл хөдлөлөө удирдах нь',
        description:
          'Сэтгэл хөдлөлөө удирдах гэдэг нь өөрийн сэтгэл хөдлөлийг үр дүнтэйгээр удирдах чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд:',
        list: '• Ажил дээр чамд эерэг сэтгэгдэл төрүүлэх үйл ажиллагаанд идэвхтэй оролцдог\n• Ажил дээр сэтгэл гонсойлгосон зүйлүүдийн учрыг нь тайлдаг\n• Сэтгэл гонсойлгосон зүйлүүдээс салж чаддаг',
        high: '• Танд эерэг сэтгэгдэл төрүүлдэг үйл ажиллагаануудад та идэвхтэй оролцдог\n• Танд төвөг учруулж байгаа зүйлсийг та үр дүнтэйгээр зохицуулж чаддаг\n• Та ажлаа хийж байхдаа эерэг сэтгэл хөдлөл, зан байдлаа илэрхийлж харуулдаг',
        low: '• Та бусдын шүүмжлэлийг өөр дээрээ шууд тусгаж авдаг\n• Таныг сэтгэлээр унагаадаг хүмүүст та зохих хариуг нь өгдөггүй\n• Та стресс ихтэй нөхцөл байдалд үр дүнтэй ажиллаж чаддаггүй',
      };
    }
    if (value == 'бусдын сэтгэл хөдлөлийг удирдах') {
      res = {
        name: 'Бусдын сэтгэл хөдлөлийг удирдах',
        name_full: 'Бусдын сэтгэл хөдлөлийг удирдах нь',
        description:
          'Бусдын сэтгэл хөдлөлийг удирдах гэдэг нь бусдын сэтгэл хөдлөл болон сэтгэл санаанд нөлөөлөх чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд:',
        list: '• Бусдад ажлын эерэг орчныг бий болгодог\n• Хүмүүсийг таагүй үйл явдалд хариу үйлдэл үзүүлэх үр дүнтэй арга олоход нь тусалдаг\n• Тэдгээрийг гүйцэтгэлд нөлөөлөх асуудлыг шийдвэрлэхэд үр дүнтэйгээр тусалдаг',
        high: '• Та бусад хүмүүст ажлын эерэг орчныг бий болгож өгдөг\n• Та бусдыг ажилтай холбоотой зорилгодоо хүрэхэд нь чиглүүлж, идэвхжүүлдэг\n• Та бусдыг өөдрөг байлгахад үр дүнтэйгээр дэмжиж чаддаг',
        low: '• Та бусадтай хамтарч ажиллах эвээ олдоггүй\n• Бусдыг сэтгэлээр унасан үед нь та даван туулах арга олоход нь туслахдаа тааруу\n• Та бусдад сэтгэлээр унагаахад нөлөөлдөг асуудлуудыг хэрхэн шийдвэрлэхэд нь туслахдаа тааруу',
      };
    }
    if (value == 'сэтгэл хөдлөлөө хянах') {
      res = {
        name: 'Сэтгэл хөдлөлөө хянах',
        name_full: 'Сэтгэл хөдлөлөө хянах нь',
        description:
          'Сэтгэл хөдлөлийг хянах гэдэг нь та мэдэрч буй хүчтэй сэтгэл хөдлөлөө үр дүнтэй хянах чадвар юм. Та дараах зүйлсийг хир зэрэг мэдэж байгаагаар үнэлэгдэнэ. Үүнд:',
        list: '• Ажил дээр санаа зовохдоо анхаарлаа төвлөрүүлж чаддаг\n• Ажил дээр уур бухимдлаа зохих хэмжээгээр илэрхийлдэг\n• Өөрийнхөө уурыг хянаж чадахгүй байх \n• Өөрийн мэдэлгүйгээр стрессдчихдэг',
        high: '• Та ажлаа хийж байхдаа урам зориг, тэмүүлэлтэй байдлыг зохистойгоор илэрхийлж харуулдаг\n• Ямар нэг зүйл сэтгэлийг тань гонсойлгоход шууд хариу үйлдэл үзүүлэхээс зайлсхийдэг\n• Та сэтгэл санаагаар унасан үедээ ч саруулаар бодож сэтгэдэг',
        low: '• Та уурласан үедээ зохисгүй авирладаг\n• Та өөрийн зан авирыг хянаж чаддаггүй\n• Та хүнд нөхцөл байдалд биеэ барьж чаддаггүй',
      };
    }

    return res;
  }

  template = async (
    doc: PDFKit.PDFDocument,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    assessment: AssessmentEntity,
  ) => {
    try {
      header(doc, firstname, lastname);
      title(doc, result.assessmentName);
      info(
        doc,
        assessment.author,
        assessment.description,
        assessment.measure,
        assessment.usage,
      );
      doc
        .font('fontBlack')
        .fontSize(16)
        .fillColor('#F36421')
        .text('Тайланг хэрхэн ашиглах вэ?', marginX, doc.y);

      doc
        .moveTo(marginX, doc.y + 2)
        .strokeColor('#F36421')
        .lineTo(marginX + 70, doc.y + 2)
        .stroke()
        .moveDown();

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Энэхүү сэтгэл хөдлөлөө удирдах чадварын үнэлгээний тайлан нь таны үнэлгээний үр дүнд суурилсан болно. Энэ тайлангаас та дараах зүйлсүүдийг мэдэх боломжтой. Үүнд:',
          { align: 'justify' },
        )
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Үнэлгээний үр дүнд тодорхойлогдсон таны давуу талууд',
            'Үнэлгээний үр дүнд тодорхойлогдсон таны хөгжүүлэх шаардлагтай чадварууд',
          ],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(13).text('Зөвлөмж').moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Энэхүү тайлантай танилцсаны дараа сэтгэл хөдлөлөө удирдах чадвараа хөгжүүлэх гарын авлагатай ажиллаарай.\n\nСэтгэл хөдлөлөө удирдах чадварын үр дүнтэй танилцахдаа 7 бүрдэл чадвар тус бүртэй танилцаарай. Чадвар тус бүр нь өмнөх чадвар дээрээ суурилсан байдаг тул дарааллыг алдагдуулахгүй танилцахыг хүсье. Энэхүү үнэлгээний  сайн, муу, зөв, буруу хариулт гэж үгүй болохыг анхаарна уу.',
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        'Сэтгэл хөдлөлөө удирдах чадварын тухай',
      );

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Ажлын байр ба сэтгэл хөдлөл')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Сэтгэл хөдлөл нь шийдвэр гаргалт болон байгууллагын стратегид өдөр тутам нөлөөлж байдаг. Та дараах зүйлсийг өөрөөсөө асуугаарай.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            '“Нэг л биш байна” гэдэг мэдрэмж хэн нэгнийг ажилд авахгүй байх шалтгаан болж байсан уу?',
            'Даргын тань сэтгэл санаа таагүй үед та илүү ямар нэгэн зүйлийг асууж, нэхэж байсан уу?',
            'Уцаарласан харилцагчтай учраа олохдоо олон төрлийн аргуудыг хэрэглэж байсан уу?',
            'Гүйцэтгэл тааруу байгаа багийн гишүүнээ хэрхэн идэвхжүүлэх вэ?',
          ],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Сэтгэл хөдлөл нь ажил дээрх зан төлөвт нөлөөлдөг', marginX)
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Ажил дээрх сэтгэл хөдлөл тань дараах зүйлсээр дамжин бусадтай харилцахад нөлөөлдөг.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          ['Дууны өнгө ', 'Биеийн хэлэмж', 'Нүүрний хувирал'],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Хэмжигдэхүйц өөрчлөлтүүд', marginX)
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Сэтгэл хөдлөлөө удирдах чадвар нь ажил дээр дараах зүйлсэд нөлөөлдөг.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Бүтээмж болон гүйцэтгэл',
            'Хүмүүс хоорондын харилцааны үр ашигтай байдал',
            'Манлайллын чадвар',
            'Борлуулалтын гүйцэтгэл',
            'Багийн ажиллагаа',
            'Харилцагчийн үйлчилгээ',
            'Ажлын сэтгэл ханамж',
          ],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Сэтгэл хөдлөлөө удирдах чадвараа нэмэгдүүлснээр', marginX)
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Өөрийн болон бусдын сэтгэл хөдлөлийг таних, ойлгох боломжууд нэмэгдэнэ',
            'Сэтгэлийн хөдөлгөөнөө илэрхийлэхдээ илүү ухаалаг болно',
            'Шийдвэр гаргалт тань бодит мэдээлэл дээр суурилаж, тэнцвэртэй тулхтай болно',
            'Ажил дээрх бүтээмж болон гүйцэтгэл тань сайжирна.',
          ],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);
      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        'Сэтгэл хөдлөлөө удирдах чадварын тухай',
      );

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Энэхүү тайлан нь сэтгэл хөдлөлөө удирдах чадвараа хөгжүүлэх чухал анхны алхам юм. Та өөрийн сэтгэл хөдлөлийн чадварыг танин барьснаар хөгжүүлэх боломжтой болдог. Мөн уг тайлангаар сэтгэл хөдлөлийн давуу тал болон боломжуудыг жагсаан гаргадаг. ',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(13)
        .text('Genos сэтгэл хөдлөлөө удирдах чадварын загвар')
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Genos-ийн сэтгэл хөдлөлөө удирдах чадварын загвар нь дараах ялгаатай 7 чадваруудыг багтаадаг. Үүнд:',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc.image(assetPath(`icons/genos`, 'jpeg'), marginX, doc.y, {
        width: doc.page.width - marginX * 2,
      });
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Өөрийн сэтгэл хөдлөлийг таньж мэдэх',
            'Сэтгэл хөдлөлөө илэрхийлэх',
            'Бусдын сэтгэл хөдлөлийг таньж мэдэх',
            'Сэтгэл хөдлөлийн эргэцүүлэл',
            'Өөрийн сэтгэл хөдлөлийг удирдах',
            'Бусдын сэтгэл хөдлөлийг удирдах',
            'Өөрийн сэтгэл хөдлөлийг хянах',
          ],
          marginX,
          doc.y + 335,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, 'Судалгааны үр дүнг ойлгох нь');
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Юу хэмжигддэг вэ?')
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Genos сэтгэл хөдлөлөө удирдах чадварын үнэлгээ нь таны төрөлх сэтгэл хөдлөлийн чадварыг хэмждэггүй. Харин таны ажил дээрээ хир их давтамжтайгаар сэтгэл хөдлөлийн чадвараа илэрхийлдгийг хэмждэг.  Энэ нь ажлын байран дээр таны гаднаасаа харагдаж буй байдал болон зан төлөвүүд таны гүйцэтгэлд хамгийн их нөлөөтэй байдагтай холбоотой.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Оноо нь ямар учиртай вэ?')
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Таны зан төлөвүүд жишиг нормын дагуу 7 чадвар тус бүр дээр 1-ээс 99-ийн хооронд оноогоор үнэлэгддэг. Энэ нь таны цэвэр оноо бус жишээ хүмүүсийн оноотой харьцуулсан гаргасан оноо юм.\n\nЖишээ нь: Хэрэв тодорхой нэг чадвар дээр таны оноо 60 байсан гэвэл энэ нь нийтлэг хүмүүсийн 50%-иас таны цэвэр оноо өндөр байна гэж тайлбарлагдаж болох юм.\n\nҮүнээс гадна тестийн оноог ойлгомжтой тайлбарлахын тулд таны оноог нийтлэг хүмүүсийн оноотой харьцуулж “Доогуур”, “Харьцангуй доогуур”, “Хэвийн хэмжээнд”, “Харьцангуй дээгүүр”, “Дээгүүр” гэсэн 5 бүлэгт хуваасан. Хялбаршуулсан онооны системийн тайлбарыг дараах хүснэгтээс дэлгэрэнгүй харна уу!',
          { align: 'justify' },
        )
        .moveDown(1);

      const tableData = [
        [
          '',
          'Доогуур',
          'Харьцангуй доогуур',
          'Хэвийн хэмжээнд',
          'Харьцангуй дээгүүр',
          'Дээгүүр',
        ],
        ['Авсан оноо', '0-18', '19-26', '27-34', '35-42', '43-50'],
        ['Хувь (~)', '0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidth = tableWidth / 6;

      let startX = marginX;
      let startY = doc.y;

      for (let row = 0; row < tableData.length; row++) {
        const currentRowHeight = row === 0 ? 36 : 18;

        for (let col = 0; col < tableData[row].length; col++) {
          const x = startX + col * colWidth;
          const y = startY;

          doc
            .rect(x, y, colWidth, currentRowHeight)
            .strokeColor(colors.black)
            .stroke();

          doc
            .font(row === 0 ? fontBold : fontNormal)
            .fontSize(12)
            .fillColor('black')
            .text(tableData[row][col], x + 5, y + 4, {
              width: colWidth - 10,
              align: 'center',
            });
        }

        startY += currentRowHeight;
      }

      doc
        .moveDown(1)
        .font(fontBold)
        .fontSize(13)
        .text('Давуу тал болон хөгжүүлэх боломжууд', marginX)
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Сэтгэл хөдлөлөө удирдах чадвар бүр нь дараах зүйлүүдийг агуулж байна. ',
          { align: 'justify' },
        )
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            '3 давуу тал – Хамгийн өндөр оноотой зан төлөвүүд',
            '3 хөгжүүлэх боломжтой чадварууд – таны хамгийн муу оноотой чадварууд',
          ],
          marginX,
          doc.y,
          {
            align: 'justify',
            bulletRadius: 1.5,
            columnGap: 8,
          },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        'Таны сэтгэл хөдлөлөө удирдах чадварын үр дүн',
      );
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text('Таны сэтгэл хөдлөлийн чадварын ерөнхий нийлбэр үр дүн, оноо:', {
          align: 'justify',
        })
        .moveDown(1);
      doc
        .font('fontBlack')
        .fontSize(16)
        .fillColor(colors.orange)
        .text(`${result.value.toString()} оноо`, doc.x, doc.y - 3, {
          continued: true,
        })
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
        .text(result.result.toUpperCase(), doc.x, doc.y - 3, {
          continued: true,
        })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(' үзүүлэлттэй байна.', marginX, doc.y + 3, {
          align: 'justify',
          continued: false,
        });
      await this.single.examQuartileGraph3(
        doc,
        Number(result.value) * 7,
        'НИЙТ',
      );

      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        'Таны сэтгэл хөдлөлөө удирдах чадварын үр дүн',
      );

      doc.font(fontNormal).fontSize(12);
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
      doc.image(png, 75, y + 10, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 5.5;
      let x = doc.x + (doc.page.width / 8) * 1.6 - marginX;

      y = doc.y + 50;
      const pointSize = (width / 20) * 5.5;
      const indexSize = (width / 20) * 0.5;
      const nameSize = (width / 20) * 13;
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
      footer(doc);
      for (let index = 0; index < results.length; index++) {
        const res = results[index];
        doc.addPage();

        header(
          doc,
          firstname,
          lastname,
          `Чадвар ${index + 1}: ${res.name_full}`,
        );
        doc
          .font(fontNormal)
          .fontSize(12)
          .lineGap(lh.md)
          .fillColor(colors.black)
          .text(res.description, {
            align: 'justify',
          })
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .lineGap(lh.md)
          .fillColor(colors.black)
          .text(res.list, {
            align: 'left',
          })
          .moveDown(1);

        let category = '';
        if (res.point >= 0 && res.point <= 18) {
          category = 'Доогуур';
        } else if (res.point >= 19 && res.point <= 26) {
          category = 'Харьцангуй доогуур';
        } else if (res.point >= 27 && res.point <= 34) {
          category = 'Хэвийн хэмжээнд';
        } else if (res.point >= 35 && res.point <= 42) {
          category = 'Харьцангуй дээгүүр';
        } else if (res.point >= 43 && res.point <= 50) {
          category = 'Дээгүүр';
        }

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Таны авсан оноо ', marginX, doc.y + 3, {
            align: 'justify',
            continued: true,
          })
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(`${res.point.toString()}`, doc.x, doc.y - 3, {
            continued: true,
          })
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
          .text(category.toUpperCase(), doc.x, doc.y - 3, {
            continued: true,
          })
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(' үзүүлэлттэй байна.', marginX, doc.y + 3, {
            align: 'justify',
            continued: false,
          });

        await this.single.examQuartileGraph3(doc, res.point, res.value);
        doc.x = marginX;
        doc.y -= 15;
        doc
          .font(fontBold)
          .fontSize(13)
          .fillColor(colors.black)
          .text('Таны давуу талууд:', {
            align: 'justify',
          });
        doc
          .font(fontNormal)
          .fontSize(12)
          .lineGap(lh.md)
          .fillColor(colors.black)
          .text(res.high, {
            align: 'left',
          })
          .moveDown(1);
        doc
          .font(fontBold)
          .fontSize(13)
          .fillColor(colors.black)
          .text('Таны сул талууд:', {
            align: 'left',
          });
        doc
          .font(fontNormal)
          .fontSize(12)
          .lineGap(lh.md)
          .fillColor(colors.black)
          .text(res.low, {
            align: 'left',
          })
          .moveDown(1);
        footer(doc);
      }
    } catch (error) {
      console.log('genos', error);
    }
  };
}
