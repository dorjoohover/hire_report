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
@Injectable()
export class Burnout {
  constructor(private single: SinglePdf) {}

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
      exam.assessment.measure,
      exam.assessment.usage,
    );
    doc.font(fontBold).fontSize(13).text('Оршил').moveDown(0.5);

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Ажлаа хийхээс халширсан уу? эсвэл хэт их ажлын ачааллаас болж ядарсан уу?\n\nӨдрийн 15 цаг болж байхад та аль хэдийн гурав дахь аяга кофегоо уух эсэх талаар бодож сууна. Хийх ёстой ажлууд уул овоо шиг их, ажлын цаг дуусах болоогүй хэдий ч та ядарсан, сэтгэл санааны хувьд энэ өдрийг дуусгахад аль хэдийн бэлэн болсон байна. Энэ бүгд ердөө тур зуурын ажлын ачаалал, ажлаа хийгээд дуусахад бүх зүйл эргээд хэвийн байдалдаа орно гэж та өөртөө хэлэх ч, яг үнэндээ ийм байдалтай олон өдөр хоногийг өнгөрсөн байх үед...\n\nЯдарч туйлдсан, сэтгэл санаагаар унасан байдалтай удаан хугацаагаар явах нь зүгээр ч нэг ажил их байгаа, тур зуур залхуурсан, ядарсан хэрэг биш харин илүү ноцтой асуудал болох ажлаас халшрах хам шинжийг зааж байгаа дохио байж болох юм. Ажлаас халшрах хам шинжтэй эсэхээ мэдэхгүй удаан хугацаагаар явах нь ирээдүйд сэтгэл санаа, бие махбод, ажлын бүтээмж, нийгмийн харилцаанд сөргөөр нөлөөлөхөөс эхлээд сэтгэл гутралд өртөх зэрэг олон хортой үр дагаварт хүргэж болно.\n\nЭнэ бүхэн ердөө түр зуурын сэтгэл санааны уналт уу? эсвэл ажлаас халшрах хам шинж үү? гэдгийг таны тестийн үр дүнгээс харцгаая.',
        { align: 'justify' },
      )
      .moveDown(1);

    footer(doc);
    doc.addPage();
    header(doc, firstname, lastname, 'Тестийн тухай');

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Дэлхийн Эрүүл Мэндийн Байгууллага болон Өвчний Олон Улсын Ангилалд (ICD-11)-д ажлаас халшрах хам шинжийг тусдаа бие даасан сэтгэц, бие махбодын өвчин эмгэг биш, харин ажил мэргэжилтэй холбоотой илэрдэг тодорхой бүлэг шинж тэмдгүүд буюу хам шинж гэж тодорхойлжээ. Энэхүү хам шинж нь урт хугацаанд үргэлжилсэн ажлын хэт ачаалал, ажлын байранд хуримтлагдсан стрессээс голчлон үүдэлтэй гэж үздэг.',
        { align: 'justify' },
      )
      .moveDown(1);

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Ажлаас халшрах хам шинж нь дараах үндсэн гурван бүрлэдхүүн хэсэгтэй:',
        { align: 'justify' },
      )
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .list(
        [
          'Эрч хүч, тамир тэнхээгүй болох, ядарч туйлдах',
          'Сэтгэл, оюун санааны хувьд ажлаасаа холдож, хөндийрөх, эсвэл ажилтайгаа холбоотой сөрөг бодол, таагүй мэдрэмжүүд төрөх',
          'Ажлын гүйцэтгэл, бүтээмж буурах.',
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

    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        '1990-өөд оны дунд үед Дани улсад ажилтнууд олноороо ажлаас гарах, урт хугацаагаар чөлөө авах үзэгдэл ихэссэн тул засгийн газраас нь “Ажлаас халшрах хам шинж, ажлын сэтгэл ханамж, мотивацийг судлах төсөл (PUMA)”-ийг эхлүүлсэн байна. Энэхүү төслийн төслийн хүрээнд явагдсан судалгааны үр дүнд Копенхагены ажлаас халшрах хам шинжийг үнэлэх тест (CBI) бий болжээ. Өдгөө энэхүү тестийг ажлаас халшрах хам шинжийн үнэлэх чиглэлд дэлхий даяар өргөнөөр ашиглаж байна.\n\nЭнэхүү тест нь хувь хүн, ажил, харилцагч/үйлчлүүлэгчтэй холбоотой гэсэн гурван чиглэлд ажлаас халшрах хам шинжийг үнэлдэг.',
        marginX,
        doc.y,
        { align: 'justify' },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.orange)
      .text('Хувь хүнтэй холбоотой');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Удаан хугацааны туршид үргэлжилсэн ерөнхий ядарч цуцсан, халшрах байдал (тодорхой шалтгаанаас үл хамаарах)',
        { align: 'justify' },
      )
      .moveDown(1);

    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.orange)
      .text('Ажилтай холбоотой');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Ажил мэргэжил, ажлын орчин нөхцөл, дарамт, хэт ачаалал, ажлын стресстэй холбоотой үүссэн бие махбод болон сэтгэл санааны ядарч цуцсан, халшрах байдал',
        { align: 'justify' },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(colors.orange)
      .text('Харилцагч/ үйлчлүүлэгчтэй холбоотой');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Харилцагч/үйлчлүүлэгчтэй ажиллахтай холбоотой үүссэн стресс, бие махбод болон сэтгэл санааны ядарч цуцсан, халшрах байдал. Жишээлбэл: Эрүүл мэнд, боловсрол, болон бусад хүмүүстэй харилцдаг үйлчилгээний салбарууд үүнд орно.',
        { align: 'justify' },
      )
      .moveDown(1);
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
        'Ажлаас халшрах хам шинжийг үнэлэх, илрүүлэх зорилготой олон төрлийн тестийн хувилбаруудыг судлаач нар хөгжүүлсэн байдаг.  Бидний одоо ашиглаж буй Копенхагены ажлаас халшрах хам шинжийг үнэлэх тест (CBI) нь “Ажлаас халшрах хам шинж, ажлын сэтгэл ханамж, мотивацийг судлах төсөл (PUMA)”-ийн хүрээнд Дани улсын Ажил Мэргэжлийн Орчны Судалгааны Үндэсний төвийн эрдэмтэн судлаач нар олон жилийн судалгааны ажил дээрээ үндэслэж, боловсруулсан гаргасан 19 асуулт бүхий олон улсад өргөнөөр хэрэглэгддэг, сайтар судлагдаж, баталгаажсан тест юм.',
        { align: 'justify' },
      )
      .moveDown(1);
    doc
      .font(fontBold)
      .fillColor(colors.black)
      .fontSize(12)
      .text('Анхаарах: ', { continued: true });
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношилно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!',
        { align: 'justify' },
      )
      .moveDown(1);

    doc
      .font(fontBold)
      .fillColor(colors.black)
      .fontSize(13)
      .text('Тестийн оноог зөв тайлбарлах')
      .moveDown(0.5);
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(
        'Ажлаас халшрах хам шинжийг үнэлэх тестийн үр дүнг тооцохдоо гурван бүлэг тус бүрд харгалзах асуултуудын оноонуудыг хооронд нь нэгтгэж, дундаж оноог ашигласан. Бүлэг тус бүрд нийт авах боломжтой оноо нь 0-ээс 100 онооны хооронд хэлбэлзэнэ. Ажлаас халшрах хам шинжтэй гэж үзэх доод утга 50 онооноос эхэлнэ. Ажлаас халшрах хам шинжийн түвшнийг цаашид ойлгомжтой тайлбарлахын тулд дараах дөрвөн бүлэгт хуваасан. Онооны системийн дэлгэрэнгүй тайлбарыг доорх хүснэгтээс харна уу!',
        { align: 'justify' },
      )
      .moveDown(1);

    const tableData = [
      ['Харгалзах оноо', 'Түвшин/зэрэг'],
      ['0-49', 'Ажлаас халшрах хам шинжгүй'],
      ['50-74', 'Ажлаас халшрах хам шинж: Дунд түвшин'],
      ['75-99', 'Ажлаас халшрах хам шинж: Өндөр түвшин'],
      ['100', 'Ажлаас халшрах хам шинж: Маш өндөр түвшин'],
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
    header(doc, firstname, lastname, 'Үр дүн');
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(result.result, { align: 'justify' })
      .moveDown(1);
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text(result.value, { align: 'justify' })
      .moveDown(1);
    doc
      .font(fontNormal)
      .fontSize(12)
      .fillColor(colors.black)
      .text('k', { align: 'justify' })
      .moveDown(1);
  }
}
