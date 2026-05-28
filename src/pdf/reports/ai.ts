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

const fw = {
  purple: {
    bg: '#EEEDFE',
    accent: '#7F77DD',
    text: '#3C3489',
    muted: '#534AB7',
  },
  teal: { bg: '#E1F5EE', accent: '#1D9E75', text: '#085041', muted: '#0F6E56' },
  coral: {
    bg: '#FAECE7',
    accent: '#D85A30',
    text: '#4A1B0C',
    muted: '#993C1D',
  },
  blue: { bg: '#E6F1FB', accent: '#378ADD', text: '#042C53', muted: '#185FA5' },
  amber: {
    bg: '#FAEEDA',
    accent: '#BA7517',
    text: '#412402',
    muted: '#854F0B',
  },
};

@Injectable()
export class AI {
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
        undefined,
        true,
      );
      doc.font(fontBold).fontSize(13).text('Оршил').moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'ChatGPT зэрэг LLM (Large Language Model буюу хэлний том загварууд) дээр суурилсан хиймэл оюун ухаан бий болсноос хойш хэрэглээ нь дэлхий даяар огцом хурдацтай өсөж байна. Олон улсад зөвлөх үйлчилгээ үзүүлдэг МкКинзей фирмийн 2025 оны тайланд өгүүлснээр нийт байгууллагуудын 88% нь бизнесийн аль нэгэн үйл ажиллагаандаа хиймэл оюун ухааныг тогтмол ашиглаж буй гэжээ. ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.image(service.getAsset(`icons/ai1`), marginX, doc.y, {
        width: doc.page.width - marginX * 2,
      });
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн тухай');
      doc
        .font(fontNormal)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Microsoft-ын Хиймэл Оюун Ухаан, Эдийн Засгийн Хүрээлэнгийн тайланд өгүүлснээр 2025 оны сүүлийн байдлаар дэлхийн хүн амын ойролцоогоор 16.3% буюу зургаан хүн тутмын нэг нь хиймэл оюун ухааныг ашиглаж буй ажээ. Гэхдээ AI-н ашиглалтын байдал улс орон бүрд харилцан адилгүй байна. Тухайлбал, хөгжингүй оронд энэхүү хэрэглээ 24.7%-тай байгаа бол харьцангуй хөгжил буурай орнуудын хувьд 14.1% буюу бараг хоёр дахин бага хэрэглээний түвшинд байгаа юм. Ерөнхийдөө хиймэл оюун ухааны хөгжүүлэлт, хэрэглээг өргөжүүлэх чиглэлд эртнээс их хөрөнгө зарцуулсан орнуудын хувьд уг хэрэглээ илүү өндөр байна. Арабын Нэгдсэн Эмират улсад гэхэд хөдөлмөрийн насны хүмүүсийн дунд хиймэл оюун ухааны хэрэглээ 64.0%-д хүрч буй бол, Сингапурт 60.9%, АНУ-д 28.3%-ийн тус тус хэрэглээний түвшинтэй байна. Манай улсын хувьд 2025 оны сүүлээр хиймэл оюун ухааны хэрэглээний түвшин 14.3%-тай байна. \n\nХарин Стэйнфордын Их Сургуулийн мэдээлснээр LLM бүхий хиймэл оюун ухааны хэрэглээ ердөө 3-хан жилийн дотор 53%-д хүрсэн нь өмнөх компьютер, интернэтийг хэрэглээний хурдыг гүйцэж, түүхэнд байгаагүй хурдан технологийн нэвтрэлт болж буй ажээ.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.image(service.getAsset(`icons/ai2`), marginX, doc.y, {
        width: doc.page.width - marginX * 2,
      });

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн тухай');
      doc
        .font(fontNormal)
        .fillColor(colors.black)
        .fontSize(12)
        .text(
          'Хиймэл оюун ухааныг өмнө нь зөвхөн технологийн шинжлэх ухаан, программчлалын хүрээнд л ярьдаг байсан бол өдгөө хүмүүсийн өдөр тутмын хэрэглээ болсон бөгөөд хурдтай өөрчлөгдөж буй технологийн шинэчлэл, өөрчлөлтөд дасан зохицох нь хүн бүрийн чухал сорилт болоод байна. Тийм учраас хиймэл оюун ухаантай үр бүтээлтэйгээр ажиллах, түүнийг зөв удирдан ашиглах ур чадвар нэн чухалд тооцогдож байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Тэгвэл хиймэл оюун ухаан гэж юу вэ?')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Ерөнхийдөө хүний хийдэг, боддог бүхий л үйл ажиллагааг хөнгөвчилдөг компьютерын системийг хиймэл оюун ухаан хэмээх ойлголтод авч үзэж болно. Үүнд: Хэл яриа, зураг, бичгийг ойлгох, таамаглал дэвшүүлэхээс шийдвэр гаргах хүртэл өргөн хүрээний үйл ажиллагаанууд багтана. Үнэндээ бид бүхэн өөрсдөө ч анзааралгүйгээр өдөр тутмын амьдралдаа хиймэл оюун ухаанд суурилсан технологиудыг ашиглаж байдаг. Тухайлбал: Интернэтийн хайлтын системүүд, фейсбүүк, инстаграмм зэрэг сошиал медиа платформууд, интернэт зар сурталчилгааны алгоритмууд нь бүгд хиймэл оюун ухааныг ашигладаг.\n\nХарин Хиймэл оюун ухааныг ашиглах мэдлэг, ур чадвар гэдэгт хувь хүний өдөр тутмын ажил амьдралдаа хиймэл оюун ухаанд суурилсан төрөл бүрийн систем, техник, хэрэгслүүдийг ялган таних, ойлгож ашиглах, гарсан үр дүнг үнэлэх, эргэцүүлэх, шүүмжлэлтэйгээр хандах зэрэг цогц чадваруудыг авч үздэг. Үүнд мөн хиймэл оюун ухааны хэрэглээтэй холбоотой ёс зүй, эрсдэлийн талаарх мэдлэг, ойлголтууд ч багтана.\n\nОдоо бүгдээрээ таны тестийн үр дүнтэй танилцъя.',
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
          'Хиймэл оюун ухааны мэдлэг, ур чадварыг үнэлдэг олон төрлийн тестүүд сүүлийн жилүүдэд бий болсон. Бидний одоо ашиглаж буй тест нь Германы Вюрцбургийн их сургуулийн эрдэмтэд Астрид Каролус, Мартин Ж. Кох нарын 2023 онд зохион бүтээсэн тест бөгөөд дэлхий дахинд өдгөө энэ чиглэлд хамгийн ихээр ашиглагдаж байна. Уг тест нь хүчин төгөлдөр оношилгооны хэрэгсэл болох нь олон дахин судлагдаж батлагдсан, тестийн урьдчилан таамаглах чадвар, дотоод тогтвортой байдал, найдвартай байдлын үзүүлэлт судалгаануудад харьцангуй өндөр байсан байна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Хэрэглээ: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэхүү сорилыг оюутан, багш, судлаач болон хиймэл оюун ухааныг ямар нэгэн байдлаар ашигладаг хүн бүр өөрийн мэдлэг, ур чадвараа үнэлэхэд ашиглаж болно. Уг сорилыг мөн хиймэл оюунтай ажиллахтай холбоотой үүсэн гарах давуу эсвэл дутагдалтай талуудаа хувь хүн өөрөө илрүүлж, цаашид аль чиглэлд илүү анхаарах талаар мэдээлэл, авах хэрэгсэл болгож ашиглаж болно.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэхүү сорилын дүн нь албан ёсны мэргэжлийн гэрчилгээ, батламж биш. ',
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
          'Сорилын үр дүнг хариултуудын дундаж оноогоор тооцно. Бүлэг тус бүрийн дундаж оноо нь 0-ээс 10-ын хооронд хэлбэлзэх бөгөөд оноо өндөр байх тусам тухайн ур чадварыг сайн эзэмшсэн болохыг илтгэнэ. Хэрэглэгчид ойлгомжтой байлгах үүднээс бүлэг тус бүрийн дундаж оноог өмнөх хүн амд суурилсан судалгааны үр дүнтэй харьцуулж, “харьцангуй бага”, “дунд”, “харьцангуй өндөр” гэсэн гурван түвшинд ангилна.',
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
        .text(`Таны хиймэл оюун ухааны мэдлэг, чадварын `, marginX, doc.y, {
          continued: true,
        })
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(`нийт`, marginX, doc.y, {
          continued: true,
        })
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(` дундаж оноо `, marginX, doc.y, {
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
        .text(' байна.', marginX, doc.y + 3, {
          continued: false,
        })
        .moveDown(1);

      doc.x = marginX;

      doc.moveDown(-1.3);

      const buffer = await this.vis.bar(result.point, 10, 11, '');

      doc
        .image(buffer, {
          width: doc.page.width - marginX * 2,
          height: (130 / 1800) * (doc.page.width - marginX * 2),
        })
        .moveDown(2.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн хамгийн бага оноо нь 0, хамгийн дээд оноо нь 10 байх бөгөөд өндөр оноо авах нь тухайн мэдлэг, ур чадварыг сайн эзэмшсэн, энэ чиглэлд өөртөө итгэлтэй буйг илтгэнэ. ',
          marginX,
          doc.y,
          {
            align: 'justify',
          },
        )
        .moveDown(1);

      const customOrder = [
        'Хиймэл оюун ухааны хэрэглээ',
        'Өөрийн ур чадвар',
        'Өөртөө итгэх итгэл',
        'Хиймэл оюун ухааныг бүтээх',
        'Хиймэл оюун ухааны хэрэглээний ёс зүй',
        'Хиймэл оюун ухааныг илрүүлэх',
        'Хиймэл оюун ухааны ойлголт',
      ];

      const customOrder2 = [
        'Хиймэл оюун ухааны хэрэглээ',
        'Хиймэл оюун ухааны ойлголт',
        'Хиймэл оюун ухааныг илрүүлэх',
        'Хиймэл оюун ухааны хэрэглээний ёс зүй',
        'Хиймэл оюун ухааныг бүтээх',
        'Өөртөө итгэх итгэл',
        'Өөрийн ур чадвар',
      ];

      const details: ResultDetailEntity[] = [...result.details].sort(
        (a, b) => customOrder.indexOf(a.value) - customOrder.indexOf(b.value),
      );
      const details2: ResultDetailEntity[] = [...result.details].sort(
        (a, b) => customOrder2.indexOf(a.value) - customOrder2.indexOf(b.value),
      );
      const indicator = [];
      const data = [];

      for (const detail of details) {
        const result = detail.value;

        indicator.push({
          name: result,
          max: 10,
        });
        data.push(+detail.cause);
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' }) // ил тод байдал → цагаан дэвсгэр
        .jpeg({ quality: 90, progressive: false }) // interlaceгүй, pdfkit-д найдвартай
        .toBuffer();
      doc.image(jpeg, 95, y - 10, {
        width: doc.page.width - 190,
      });

      const getLabel = (name: string, score: number) => {
        if (name === 'Хиймэл оюун ухааны хэрэглээ') {
          if (score <= 1.85) return 'Харьцангуй бага';
          if (score <= 4.95) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Хиймэл оюун ухааны ойлголт') {
          if (score <= 2.49) return 'Харьцангуй бага';
          if (score <= 5.28) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Хиймэл оюун ухааныг илрүүлэх') {
          if (score <= 3.09) return 'Харьцангуй бага';
          if (score <= 6.25) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Хиймэл оюун ухааны хэрэглээний ёс зүй') {
          if (score <= 3.07) return 'Харьцангуй бага';
          if (score <= 5.99) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Хиймэл оюун ухааныг бүтээх') {
          if (score <= 0.28) return 'Харьцангуй бага';
          if (score <= 2.82) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Өөртөө итгэх итгэл') {
          if (score <= 1.83) return 'Харьцангуй бага';
          if (score <= 4.54) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        if (name === 'Өөрийн ур чадвар') {
          if (score <= 3.36) return 'Харьцангуй бага';
          if (score <= 6.15) return 'Дундаж';
          return 'Харьцангуй өндөр';
        }

        return '-';
      };

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 6;
      let x = doc.x + (doc.page.width / 8) * 1.4 - marginX - 30;
      y = doc.y + 5;

      const indexSize = (width / 20) * 1;
      const nameSize = (width / 20) * 10;

      const scoreX = x + indexSize + nameSize + 20;
      const labelX = scoreX + 70;

      doc.font(fontBold).fillColor(colors.black).text(`№`, x, y);

      doc.text('Бүлэг', x + indexSize * 2 - 10, y);

      doc.text('Оноо', scoreX + 10, y, {
        width: 50,
        align: 'center',
      });

      doc.text('Үзүүлэлт', labelX, y, {
        width: 110,
        align: 'center',
      });

      doc.y += 7;

      doc
        .moveTo(x, doc.y)
        .strokeColor(colors.orange)
        .lineTo(labelX + 110, doc.y)
        .stroke();

      doc.y += 9;

      details2.map((res, i) => {
        y = doc.y;

        const color = colors.black;

        doc
          .font(fontNormal)
          .fillColor(color)
          .text(`${i + 1}.`, x, y);

        const name = res.value;

        doc.text(name, x + indexSize * 2 - 10, y, {
          width: nameSize + 10,
        });

        const score = +res.cause;

        doc.text(score.toString(), scoreX + 10, y, {
          width: 50,
          align: 'center',
        });

        const label = getLabel(name, score);

        doc.text(label, labelX, y, {
          width: 110,
          align: 'center',
        });

        doc.y += 5;
      });

      doc.fillColor(colors.black);
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Тайлбар')
        .moveDown(0.5);

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хиймэл оюун ухааны хэрэглээ: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Та өдөр тутмын ажил, амьдралдаа хиймэл оюун ухаанд суурилсан техник, технологиудыг хэр зэрэг үр дүнтэй, сайн ашиглаж буйг ерөнхийд нь үнэлнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хиймэл оюун ухааны ойлголт: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухаан гэж юу болох, хэрхэн ажилладаг талаарх таны ерөнхий, суурь мэдлэгийг шалгана. ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хиймэл оюун ухааныг илрүүлэх: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухаанд суурилсан техник, технологи, системтэй тулгарсан үед түүнийг зөв ялган таньж чадаж буй эсэхийг үнэлнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хэрэглээний ёс зүй: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухаан ба түүнийг ашиглах үед үүсэх эрсдэл, хууль эрх зүй, ёс зүйтэй холбоотой бүх төрлийн асуудлуудыг энэ бүлэгт авч үзнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хиймэл оюун ухааныг бүтээх: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Энэ бүлэгт хиймэл оюун ухааны онол, загварыг ашиглан, шинээр хиймэл оюун ухаанд суурилсан шинэ техник, технологи, ажент, системийг загварчлах, бүтээх ерөнхий мэдлэг, ур чадварыг авч үзнэ. ',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Өөртөө итгэх итгэл: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухааныг ашиглахтай холбоотой үүсэх төрөл бүрийн асуудал, бэрхшээлүүдийг бие даан даван туулах, хурдацтай өөрчлөгдөн шинэчлэгдэж буй технологийн дэвшилтэй хөл нийлүүлэн алхах, суралцах хийгээд хиймэл оюуны тусламжгүйгээр асуудлыг өөрөө бие даан шийдвэрлэх ерөнхий чадвар, өөрийн ур чадварт итгэх итгэл үнэмшлийг үнэлнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Өөрийн ур чадвар: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухаантай харилцах үед үүсэж магадгүй бухимдал, хөөрөл, айдас, сэтгэл түгшил зэрэг төрөл бүрийн сэтгэл хөдлөлөө хянаж, шийдвэр гаргах үйл явцад өөрийгөө хэр зэрэг сайн удирдаж буй чадварыг ерөнхийд нь үнэлнэ.',
          { align: 'justify' },
        )
        .moveDown(1);
      footer(doc);

      const drawPromptBlock = (
        label: string,
        text: string,
        isBad = false,
        is2?: boolean,
      ) => {
        const bg = isBad ? '#FFF2F2' : '#F2FFF6';
        const borderColor = isBad ? '#D9534F' : is2 ? '#0f4fff' : '#3A8C57';
        const labelColor = isBad ? '#C0392B' : is2 ? '#a8bfff' : '#1E7A42';
        const padding = 10;
        const innerWidth = doc.page.width - marginX * 2 - padding * 2 - 4;

        const textHeight = doc.heightOfString(text, {
          width: innerWidth,
        });
        const blockHeight = textHeight + padding * 2;

        const x = marginX;
        const y = doc.y;

        doc
          .roundedRect(x, y, doc.page.width - marginX * 2, blockHeight, 4)
          .fill(bg);

        doc.rect(x, y, 3, blockHeight).fill(borderColor);

        doc
          .font(fontBold)
          .fontSize(10)
          .fillColor(labelColor)
          .text(label, x + 12, y + 5);

        doc
          .font(fontNormal)
          .fontSize(11)
          .fillColor('#1C1C2E')
          .text(text, x + padding + 2, y + 18, {
            width: innerWidth,
            align: 'justify',
          });

        doc.y = y + blockHeight + 8;
        doc.x = marginX;
      };

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хиймэл оюун ухааныг үр дүнтэй ашиглах зөвлөгөө',
      );

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'LLM дээр суурилсан хиймэл оюун ухаанууд тэр дундаа ChatGPT загвартай хэрхэн үр дүнтэй ажиллах талаар OpenAI компанийн зүгээс өгч буй дараах зөвлөгөөнүүдтэй танилцаарай.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.black)
        .text('Ерөнхий зөвлөгөө')
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сайн заавар буюу prompt нь дараах шинж чанарыг агуулсан байна. Үүнд:',
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
            'тодорхой,',
            'өвөрмөц/дэлгэрэнгүй,',
            'нөхцөл заасан,',
            'хүссэн үр дүнг тусгасан байх ёстой.',
          ],
          doc.x + 20,
          doc.y,
          { align: 'justify', bulletRadius: 1.5, listType: 'bullet' },
        )
        .moveDown(0.5);

      doc.x = marginX;

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Мөн түүнчлэн хүсэж буй үр дүнгийн өнгө аяс, загварыг зааж өгч, шаардлагатай тохиолдолд жишээ өгч зааврыг улам баяжуулах, давтан сайжруулах нь чухал юм.',
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('1. Тодорхой бай')
        .moveDown(0.5);
      drawPromptBlock('Муу жишээ', 'Маркетингаа хэрхэн сайжруулах вэ?', true);
      drawPromptBlock(
        'Сайн жишээ',
        'Инстаграм ашиглан жижиг кофе шофоор үйлчлүүлэгчдийн тоог эмэгдүүлэх 30 хоногийн төлөвлөгөөг зохиох.',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('2. Нөхцөлийг заа')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Зорилго, нөхцөл байдал, хүрэхээр зорьж буй бүлэг болон зааг хязгаараа зааж өг.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      drawPromptBlock(
        'Сайн жишээ',
        'Миний хүрэхийг хүсэж буй зорилтот бүлэг/хүмүүс бол жижиг дунд бизнес эрхлэгчид. Бизнесийн салбар дах хиймэл оюун ухааны хэрэглээг эдгээр хүмүүст зориулан энгийн хэлээр тайлбарла.',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('3. Үр дүн/гаралтын загварыг заа')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Таны хүсэж буй үр дүн хүснэгт, шалгах хуудас (checklist), жагсаалт (bullet list), схем, текст, код гэх мэт ямар загвартай байхыг тодорхой зааж өг.',
          { align: 'justify' },
        )
        .moveDown(0.5);

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('4. Өнгө аяс, загварыг заа')
        .moveDown(0.5);
      drawPromptBlock(
        'Сайн жишээ',
        'Тойруу биш шууд утгаар, мэргэжлийн, шинжлэх ухаанч өнгө аястай бич. Энгийн, хар ярианы үг хэллэг бүү ашигла. 200 үгээс хэтрэхгүй байх.',
      );

      footer(doc);

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хиймэл оюун ухааныг үр дүнтэй ашиглах зөвлөгөө',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('5. Заавар болон мэдээллийг ялгаж заа')
        .moveDown(0.5);
      drawPromptBlock(
        'Сайн жишээ',
        'Заавар:\nДоорх текстийг таван хэсэгт хувааж, хураангуйлж, жагсаалт болго.\n\nМэдээлэл:\n[Энэ хэсэгт мэдээллээ оруулж өгөөрэй]',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('6. Өнгө аяс, загвар чухал бол зааж өг')
        .moveDown(0.5);
      drawPromptBlock(
        'Муу жишээ',
        'Мэргэжлийн, шинжлэх ухаанч өнгө аясаар бич.',
        true,
      );
      drawPromptBlock(
        'Сайн жишээ',
        'Дараах хэв загварыг дагуу бич:\n"Сайн байна уу? Цахим шуудан илгээсэнд баярлалаа. Би таны илгээсэн мэдээлэлтэй танилцлаа, удахгүй эргээд хариу өгөх болно."\n\nХувиргах мэдээлэл:\n"Мэдээлэлтэй танилцлаа. Эргээд холбогдъё"',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('7. Хязгаарыг тодорхой зааж өг')
        .moveDown(0.5);
      drawPromptBlock(
        'Сайн жишээ',
        'Хэт мэргэжлийн өвөрмөц, хүнд үг хэллэг бүү ашигла.\n150 үгээс хэтрүүлэхгүй.\nЗөвхөн өгөгдсөн мэдээллийн хүрээнд ажилла.\nБаталгаагүй, нотолгоогүй мэдээлэл бүү ашигла.',
      );

      doc
        .moveDown(0.5)
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text('8. Засварлан сайжруул')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хиймэл оюун ухаан (ялангуяа ChatGPT)-ыг эхний байдлаар боловсруулсан үр дүнгээ хянаж, засварлаж, дахин давтахыг зааж өг.',
          { align: 'justify' },
        )
        .moveDown(0.5);
      drawPromptBlock(
        'Жишээ',
        'Эхний загварыг гарга. Эхний загварыг хянан шүүсний дараагаар, сайжруулсан хувилбарыг дахин бич.',
      );
      footer(doc);

      function drawFrameworkCard(
        doc: PDFKit.PDFDocument,
        accentColor: string,
        bgColor: string,
        textColor: string,
        mutedColor: string,
        fullName: string,
        mnName: string,
        useTag: string,
        steps: Array<{ letter: string; label: string; desc: string }>,
        example: string,
      ): void {
        const measureText = (text: string, options: any) => {
          return doc.heightOfString(text, options);
        };

        const x = marginX;
        const startY = doc.y;

        const cardW = doc.page.width - marginX * 2;

        const padX = 14;
        const padY = 10;

        const stripeW = 3;
        const radius = 8;

        const innerX = x + stripeW + padX;
        const innerW = cardW - stripeW - padX * 2;

        doc.font(fontBold).fontSize(12);
        const titleH = measureText(fullName, { width: innerW });

        doc.font(fontNormal).fontSize(10);
        const subH = measureText(mnName, { width: innerW });

        const tagH = measureText(useTag, { width: innerW });

        const headerH = padY + titleH + 2 + subH + tagH + padY;

        const stepHeights = steps.map((s) => {
          doc.font(fontBold).fontSize(10);
          const labelH = doc.heightOfString(s.label, {
            width: innerW - 18,
          });

          doc.font(fontNormal).fontSize(10);
          const descH = doc.heightOfString(s.desc, {
            width: innerW - 18,
            lineGap: 1,
          });

          return labelH + descH + 14;
        });

        const stepsH =
          stepHeights.reduce((a, b) => a + b, 0) + (steps.length - 1) * 2;

        doc.font(fontNormal).fontSize(10);
        const exampleTextH = doc.heightOfString(example, {
          width: innerW - 6,
          lineGap: 1,
        });

        const exampleH = exampleTextH + 20;

        const totalH = headerH + stepsH + exampleH + 20;

        doc
          .roundedRect(x, startY, cardW, totalH, radius)
          .fillColor('#FFFFFF')
          .fill();

        doc
          .roundedRect(x, startY, cardW, totalH, radius)
          .lineWidth(0.6)
          .strokeColor('#E7E2DC')
          .stroke();

        doc
          .roundedRect(x, startY, stripeW, totalH, radius)
          .fillColor(accentColor)
          .fill();

        doc.rect(x, startY, cardW, headerH).fillColor(bgColor).fill();

        doc.rect(x, startY, stripeW, totalH).fillColor(accentColor).fill();

        let y = startY + padY;

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(textColor)
          .text(fullName, innerX, y, {
            width: innerW,
          });

        y += titleH + 2;

        doc
          .font(fontNormal)
          .fontSize(10)
          .fillColor(mutedColor)
          .text(mnName, innerX, y, {
            width: innerW,
          });

        y += subH + 5;

        doc
          .font(fontNormal)
          .fontSize(10)
          .fillColor(accentColor)
          .text(useTag, innerX, y, {
            width: innerW,
          });

        y = startY + headerH + 10;

        steps.forEach((step, i) => {
          const itemY = y;

          doc
            .font('fontBlack')
            .fontSize(11)
            .fillColor(accentColor)
            .text(step.letter, innerX, itemY);

          doc
            .font(fontBold)
            .fontSize(10)
            .fillColor('#222222')
            .text(step.label, innerX + 18, itemY, {
              width: innerW - 18,
            });

          const labelH = doc.heightOfString(step.label, {
            width: innerW - 18,
          });

          doc
            .font(fontNormal)
            .fontSize(10)
            .fillColor('#5D5955')
            .text(step.desc, innerX + 18, itemY + labelH + 1, {
              width: innerW - 18,
              lineGap: 1,
            });

          y += stepHeights[i];

          if (i !== steps.length - 1) {
            y += 2;
          }
        });

        doc
          .moveTo(innerX, y - 5)
          .lineTo(innerX + innerW, y - 5)
          .lineWidth(0.5)
          .strokeColor('#E8E3DD')
          .stroke();

        y += 8;

        doc
          .font(fontBold)
          .fontSize(10)
          .fillColor(accentColor)
          .text('Жишээ', innerX, y);

        y += 15;

        doc
          .font(fontNormal)
          .fontSize(10)
          .fillColor('#4F4B47')
          .text(example, innerX, y, {
            width: innerW,
            lineGap: 1,
            align: 'justify',
          });

        doc.y = startY + totalH + 10;
        doc.x = marginX;
      }

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хиймэл оюун ухааныг үр дүнтэй ашиглах зөвлөгөө',
      );
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Үүнээс гадна хиймэл оюун ухааныг хэрэглэгчдийн дунд түгээмэл тархсан, хиймэл оюун ухаантай илүү сайн, үр бүтээмжтэй ажиллах талаарх дараах зөвлөгөөнүүд мөн ашиглаж болох юм. Гэхдээ эдгээр зөвлөгөөнүүүд нь OpenAI эсвэл бусад LLM бүхий загваруудыг бүтээж буй байгууллагуудаас гаргасан стандарт зөвлөгөө биш гэдгийг анхаарах нь зүйтэй.',
          { align: 'justify' },
        )
        .moveDown(0.5);

      drawFrameworkCard(
        doc,
        fw.purple.accent,
        fw.purple.bg,
        fw.purple.text,
        fw.purple.muted,
        'Role · Task · Format',
        'Дүр · Даалгавар · Загвар',
        'Өдөр тутмын энгийн ажлууд болон мэйл бичих, сошиал медиа пост бэлтгэхэд хамгийн тохиромжтой.',
        [
          {
            letter: 'R',
            label: 'Дүр',
            desc: 'Хэний дүрд тоглох вэ? (Жишээ нь: Худалдагч, багш…).',
          },
          {
            letter: 'T',
            label: 'Даалгавар',
            desc: 'Яг юу хийх ёстой вэ?',
          },
          {
            letter: 'F',
            label: 'Загвар',
            desc: 'Үр дүн ямар хэлбэрээр гарах ёстой вэ? (Жагсаалт, хүснэгт, текст…).',
          },
        ],
        '"Өөрийгөө зар сурталчилгааны туршлагатай мэргэжилтэн гэж төсөөл. Энэхүү шинэ бүтээгдэхүүнийг Facebook-ын орчинд сурталчлах 3 пост бич. Үр дүнгээ текстийн мэдээллээр гарга."',
      );
      doc.moveDown(0.5);
      drawFrameworkCard(
        doc,
        fw.teal.accent,
        fw.teal.bg,
        fw.teal.text,
        fw.teal.muted,
        'Task · Action · Goal',
        'Даалгавар · Үйлдэл · Зорилго',
        'Тодорхой зорилго, үр дүнд хүрэх эвсэл тодорхой гүйцэтгэлийг үнэлэх ажлуудад.',
        [
          {
            letter: 'T',
            label: 'Даалгавар',
            desc: 'Үндсэн хийх ажил',
          },
          {
            letter: 'A',
            label: 'Үйлдэл',
            desc: 'Ямар аргаар, яаж хийх вэ?',
          },
          {
            letter: 'G',
            label: 'Зорилго',
            desc: 'Эцсийн хүрэх үр дүн, хэмжүүр.',
          },
        ],
        '"Манай байгууллагын борлуулалтын өгөгдөлд дүн шинжилгээ хий. Менежер хүний нүдээр харж, сул талуудыг шүүмжлэлтэйгээр үнэлэх. Гол зорилго нь ирэх сарын борлуулалтыг 15%-иар өсгөх зөвлөмж гаргах."',
      );
      footer(doc);

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хиймэл оюун ухааныг үр дүнтэй ашиглах зөвлөгөө',
      );

      drawFrameworkCard(
        doc,
        fw.coral.accent,
        fw.coral.bg,
        fw.coral.text,
        fw.coral.muted,
        'Before · After · Bridge',
        'Өмнө · Дараа · Холболт',
        'Тодорхой асуудлаас шийдэлд хүрэх, асуудлыг шийдвэрлэх, стратеги боловсруулах, зар сурталчилгааны текст бичихэд.',
        [
          {
            letter: 'B',
            label: 'Өмнө',
            desc: 'Тулгамдаж буй асуудал.',
          },
          {
            letter: 'A',
            label: 'Дараа',
            desc: 'Хүсэж буй ирээдүйн үр дүн.',
          },
          {
            letter: 'B',
            label: 'Холболт',
            desc: 'Асуудлаас шийдэлд хүрэх алхмууд.',
          },
        ],
        '"Манай вэбсайт хайлтын илэрц дээр гарч ирэхгүй байна. Бид хайлтаар эхний 3-т гарч ирдэг болохыг хүсэж байна. Энэ зорилгод хүргэх төлөвлөгөөг боловсруул."',
      );
      doc.moveDown(0.5);

      drawFrameworkCard(
        doc,
        fw.blue.accent,
        fw.blue.bg,
        fw.blue.text,
        fw.blue.muted,
        'Context · Action · Result · Example',
        'Нөхцөл · Үйлдэл · Үр дүн · Жишээ',
        'Бүтээлч ажил, тодорхой загвар, хэв маягийн дагуу ажиллах. ',
        [
          {
            letter: 'C',
            label: 'Нөхцөл',
            desc: 'Суурь нөхцөлийг зааж өгөх',
          },
          {
            letter: 'A',
            label: 'Үйлдэл',
            desc: 'Ямар аргаар, яаж хийх вэ?',
          },
          {
            letter: 'R',
            label: 'Үр дүн',
            desc: 'Хүлээгдэж буй үр дүн',
          },
          {
            letter: 'E',
            label: 'Жишээ',
            desc: 'Сайн загвар, жишээг оруулж өгөх.',
          },
        ],
        '"Бид эрүүл хооллолтыг дэмжих бүтээгдэхүүн үйлдвэрлэдэг. Эрүүл мэндэд эрүүл хооллолтын ач холбогдлыг тайлбарласан нийтлэл бич. Энэхүү бичвэр нь уншигчдад итгэл төрүүлэхүйц байх ёстой. X байгууллагын сурталчилгааны хэв маягтай ижил байх."',
      );
      footer(doc);

      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Хиймэл оюун ухааныг үр дүнтэй ашиглах зөвлөгөө',
      );
      drawFrameworkCard(
        doc,
        fw.amber.accent,
        fw.amber.bg,
        fw.amber.text,
        fw.amber.muted,
        'Role · Input · Steps · Expectation',
        'Дүр · Өгөгдөл · Үе шат · Үр дүн',
        'Их хэмжээний өгөгдөл, мэдээлэлтэй ажиллах, нарийн төвөгтэй даалгавар биелүүлэх.',
        [
          {
            letter: 'R',
            label: 'Дүр',
            desc: 'Хэний дүрд тоглох вэ?',
          },
          {
            letter: 'I',
            label: 'Өгөгдөл',
            desc: 'Өгөгдөл, мэдээллийг оруулах',
          },
          {
            letter: 'S',
            label: 'Үе шат',
            desc: 'Ажлын дарааллыг зааж өгөх',
          },
          {
            letter: 'E',
            label: 'Үр дүн',
            desc: 'Хүлээж буй үр дүн заах',
          },
        ],
        '"Өөрийгөө эдийн засагч гэж төсөөл. Энд хавсаргасан санхүүгийн тайлан, мэдээллийг ашигла. Эхлээд зардлыг бууруулах боломжийг ол, дараа нь орлого нэмэх боломжуудыг эрэмбэлж бич. Тайлан нь товч бөгөөд захиргаа, удирдлагад танилцуулахад тохирсон байх ёстой."',
      );
      doc.x = marginX;
      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Эх сурвалж, ашигласан материал',
      );

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Carolus, A., Koch, M., Straka, S., Latoschik, M.E. and Wienrich, C. (2023) ‘MAILS – Meta AI literacy scale: Development and testing of an AI literacy questionnaire based on well-founded competency models and psychological change- and meta-competencies’, Computers in Human Behavior: Artificial Humans, 1(2), 100014. Available at: https://www.sciencedirect.com/science/article/pii/S2949882123000142 (Accessed: 21 May 2026).\n\nKoch, M.J., Latoschik, M.E. and Wienrich, C. (2024) ‘Overview and confirmatory and exploratory factor analysis of AI literacy scales’, Computers and Education: Artificial Intelligence. Available at: https://www.sciencedirect.com/science/article/pii/S2666920X24001139 (Accessed: 21 May 2026).\n\nMarkova, T. and Yordanova, K. (2025) ‘Measuring the general public artificial intelligence attitudes and literacy: Measurement scales validation by national multistage omnibus survey in Bulgaria’, Computers in Human Behavior: Artificial Humans. https://doi.org/10.1016/j.chbah.2025.100193\n\nMcKinsey & Company (2025) The State of AI: How organizations are rewiring to capture value.\n\nMicrosoft (2026) Global AI Diffusion: Q1 2026 trends and insights. Microsoft AI Economy Institute.\n\nMukherjee, S., Roy, S., Chakraborty, A. and Mukhopadhyay, D. (2025) ‘Perceptions of 1st year undergraduate medical students on artificial intelligence: Mixed-methods survey study from a rural medical college of West Bengal’, Student’s Journal of Health Research Africa, 6(6). https://doi.org/10.51168/sjhrafrica.v6i6.1712\n\nSingla, A., Sukharevsky, A., Yee, L., Chui, M. and Hall, B. (2025) The State of AI: How organizations are rewiring to capture value. McKinsey & Company. \n\nStanford Institute for Human-Centered Artificial Intelligence (2025) Artificial Intelligence Index Report 2025. Stanford, CA: Stanford University.\n\nUluğ, E., Öner, K., Arslantaş, S. and Harmancı, S.T. (2025) ‘Adaptation of the artificial intelligence literacy scale into Turkish: A cross-sectional application among healthcare workers, students, and children’, Education and Information Technologies. https://doi.org/10.1007/s10639-025-13597-3\n\nUniversity of Würzburg (n.d.) MAILS – Meta AI literacy scale. Available at: https://hci.uni-wuerzburg.de/research/MAILS/ (Accessed: 21 May 2026).',
          { align: 'justify' },
        );

      footer(doc);
    } catch (error) {
      console.log('AI', error);
    }
  }
}
