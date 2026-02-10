import { Injectable } from '@nestjs/common';
import {
  colors,
  footer,
  info,
  marginX,
  title,
  header,
  fontNormal,
  fontBold,
} from 'src/pdf/formatter';
import { SinglePdf } from '../single.pdf';
import { ResultEntity, ExamEntity } from 'src/entities';
import { AssetsService } from 'src/assets_service/assets.service';
import { VisualizationService } from '../visualization.service';
import { UserAnswerDao } from 'src/daos/user.answer.dao';

@Injectable()
export class SEMUT {
  constructor(
    private single: SinglePdf,
    private vis: VisualizationService,
    private answer: UserAnswerDao,
  ) {}
  async template(
    doc: PDFKit.PDFDocument,
    service: AssetsService,
    result: ResultEntity,
    exam: ExamEntity,
    results: ResultEntity[],
    category?: number,
  ) {
    try {
      header(doc, result.firstname, result.lastname, service);
      title(doc, service, 'УРЬДЧИЛАН СЭРГИЙЛЭХ ҮЗЛЭГИЙН СОРИЛУУДЫН ҮР ДҮН');
      const columnGap = 20;
      const pageWidth = doc.page.width - marginX * 2;
      const colWidth = (pageWidth - columnGap) / 2;

      const startY = doc.y + 20;
      let leftX = marginX;

      doc.font(fontNormal).fontSize(12).fillColor(colors.black);

      doc
        .text('Овог: ', leftX, startY, { continued: true, width: colWidth })
        .font(fontBold)
        .text(result.lastname);
      doc.moveDown(0.25);

      doc
        .font(fontNormal)
        .text('Нэр: ', { continued: true, width: colWidth })
        .font(fontBold)
        .text(result.firstname);
      let rightX = marginX + colWidth + columnGap;

      const nas = await this.answer.getAnswer(result.code, '1881');
      const huis = await this.answer.getAnswer(result.code, '1882');

      doc
        .font(fontNormal)
        .text(`Нас: `, rightX, startY, {
          continued: true,
          width: colWidth,
        })
        .font(fontBold)
        .text(nas ?? '22');

      doc.moveDown(0.25);

      doc
        .font(fontNormal)
        .text(`Хүйс: `, { continued: true, width: colWidth })
        .font(fontBold)
        .text(huis)
        .moveDown(0.25);

      const pageRight = doc.page.width - marginX;
      const fontSize = 12;

      doc.font(fontNormal).fontSize(fontSize).fillColor(colors.black);

      const textWithDots = (text: string) => {
        const x = marginX;
        const y = doc.y;

        doc.text(text, x, y, {
          width: pageRight - marginX,
          lineBreak: false,
        });

        const textWidth = doc.widthOfString(text);

        const lineY = y + fontSize - 2;
        const startX = x + (textWidth > 0 ? textWidth + 6 : 2);

        doc
          .dash(1, { space: 3 })
          .moveTo(startX, lineY)
          .lineTo(pageRight, lineY)
          .strokeColor(colors.black)
          .stroke()
          .undash();
      };

      textWithDots('Одоогийн байдлаар бие махбодын');
      textWithDots('талаас оношлогдсон өвчин:');

      doc.moveDown(0.5);

      doc
        .font('fontBold')
        .fontSize(16)
        .fillColor(colors.orange)
        .text('Сорилуудын үр дүн', marginX, doc.y + 10);
      doc
        .moveTo(40, doc.y + 2)
        .strokeColor(colors.orange)
        .lineTo(100, doc.y + 2)
        .stroke()
        .moveDown();

      const res = await this.answer.partialCalculator(
        result.code,
        result.type,
        category,
      );
      const CATEGORY_ORDER = [
        'АРХИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ AUDIT АСУУМЖ',
        'ТАМХИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ АСУУМЖ',
        'НИКОТИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ АСУУМЖ',
        'Айдас түгшүүр, сэтгэл гутралын сорил (HADS)',
        'Нойргүйдлийг зэргийг үнэлэх асуумж (Insomnia severity index)',
        'СУЛЬДАЛ ИЛРҮҮЛЭХ СОРИЛ (Chalder Fatigue Scale)',
        'Сэтгэл гутрал, сэтгэл түгшилт, стрессийн үнэлдэг (DASS 21) асуумж',
        'ТАРХИНЫ ХЭТ АЧААЛЛЫГ ҮНЭЛЭХ АСУУМЖ',
        'АМЬДРАЛЫН ЧАНАРЫГ ҮНЭЛЭХ АСУУМЖ (WHOQOL-BRIF)',
      ];

      const orderedResults = CATEGORY_ORDER.map((name) =>
        res.find((r) => r.categoryName === name),
      ).filter(Boolean);

      const LEVEL_RULES: Record<
        string,
        (point: number, name?: string) => string
      > = {
        'АРХИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ AUDIT АСУУМЖ': (p) =>
          p <= 0
            ? 'Согтууруулах ундаа огт хэрэглэдэггүй'
            : p <= 7
              ? 'Эрсдэл багатай архины хэрэглээний түвшин'
              : p <= 15
                ? 'Архи хэрэглэгч буюу аюултай хэрэглээний түвшин'
                : p <= 19
                  ? 'Архи хэтрүүлэн хэрэглэгч буюу хортой үр дагавар өгөхүйц хэрэглээний түвшин'
                  : 'Архины хамааралтай гэж сэжиглэх түвшин',

        'ТАМХИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ АСУУМЖ': (p) =>
          p <= 7 ? 'Хэвийн' : p <= 14 ? 'Дунд зэрэг' : 'Хүнд зэрэг',

        'НИКОТИНЫ ХЭРЭГЛЭЭГ ҮНЭЛЭХ АСУУМЖ': (p) =>
          p <= 2
            ? 'Маш бага хамааралтай'
            : p <= 4
              ? 'Бага зэргийн хамааралтай'
              : p <= 5
                ? 'Дунд зэргийн хамааралтай'
                : p <= 7
                  ? 'Хамаарал их'
                  : 'Маш өндөр хамааралтай',

        'Сэтгэл гутрал': (p, name) =>
          name === 'Айдас түгшүүр, сэтгэл гутралын сорил (HADS)'
            ? p <= 7
              ? 'Хэвийн'
              : p <= 10
                ? 'Хөнгөн'
                : p <= 14
                  ? 'Дунд зэрэг'
                  : 'Хүнд зэрэг'
            : p <= 3
              ? 'Хэвийн'
              : p <= 5
                ? 'Хөнгөн'
                : p <= 7
                  ? 'Дунд зэрэг'
                  : p <= 9
                    ? 'Хүндэвтэр'
                    : 'Хүнд',

        'Сэтгэл түгшил': (p, name) =>
          name === 'Айдас түгшүүр, сэтгэл гутралын сорил (HADS)'
            ? p <= 7
              ? 'Хэвийн'
              : p <= 10
                ? 'Хөнгөн'
                : p <= 14
                  ? 'Дунд зэрэг'
                  : 'Хүнд зэрэг'
            : p <= 4
              ? 'Хэвийн'
              : p <= 6
                ? 'Хөнгөн'
                : p <= 10
                  ? 'Дунд зэрэг'
                  : p <= 13
                    ? 'Хүндэвтэр'
                    : 'Хүнд',

        'Нойргүйдлийг зэргийг үнэлэх асуумж (Insomnia severity index)': (p) =>
          p <= 7
            ? 'Клиник ач холбогдол бүхий нойргүйдэл үгүй'
            : p <= 14
              ? 'Клиник шинж тэмдэг бүхий нойргүйдэл бага зэрэг'
              : p <= 21
                ? 'Клиник шинж тэмдэг бүхий нойргүйдэл дунд зэрэг'
                : 'Клиник шинж тэмдэг бүхий нойргүйдэл хүнд зэрэг',

        'СУЛЬДАЛ ИЛРҮҮЛЭХ СОРИЛ (Chalder Fatigue Scale)': (p) =>
          p <= 11
            ? 'Хэвийн'
            : p <= 20
              ? 'Дунд хэлбэрийн сульдал'
              : p <= 26
                ? 'Хүндэвтэр хэлбэрийн сульдал'
                : 'Хүнд хэлбэрийн сульдал',

        Стресс: (p) =>
          p <= 7
            ? 'Хэвийн'
            : p <= 9
              ? 'Хөнгөн'
              : p <= 12
                ? 'Дунд зэрэг'
                : p <= 16
                  ? 'Хүндэвтэр'
                  : 'Хүнд',

        'ТАРХИНЫ ХЭТ АЧААЛЛЫГ ҮНЭЛЭХ АСУУМЖ': (p) =>
          p <= 5 ? 'Хэвийн' : 'Анхаарах',

        'АМЬДРАЛЫН ЧАНАРЫГ ҮНЭЛЭХ АСУУМЖ (WHOQOL-BRIF)': (p) =>
          p >= 80 ? 'Сайн' : p >= 50 ? 'Дунд' : 'Бага',
      };

      const renderSum = async (
        doc: PDFKit.PDFDocument,
        service: AssetsService,
        vis: VisualizationService,
        item: any,
        index: number,
        LEVEL_RULES: Record<string, (point: number) => string>,
        outro?: string,
      ) => {
        const point = Number(item.point);
        const total = Number(item.totalPoint);
        const name = item.categoryName;

        const levelLabel = LEVEL_RULES[name]?.(point) ?? '';

        doc.x = marginX;

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(`${index + 1}. ${name.toUpperCase()} `, { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .fontSize(16)
          .text(String(point), doc.x, doc.y - 3, { continued: true })
          .fontSize(12)
          .fillColor(colors.black)
          .text('/' + String(total), doc.x, doc.y + 3)
          .moveDown(0.5);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Таны үнэлгээний оноо ', marginX, doc.y, { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(point.toString(), { continued: true })
          .font(fontNormal)
          .fillColor(colors.black)
          .text(' буюу ', { continued: true })
          .font('fontBlack')
          .fillColor(colors.orange)
          .text(levelLabel.toUpperCase(), { continued: true })
          .font(fontNormal)
          .fillColor(colors.black)
          .text(outro ? outro : ' байна.')
          .moveDown(0.5);

        doc.moveDown(-0.8);

        const buffer = await vis.bar(point, total, 100, '');

        doc
          .image(buffer, {
            width: doc.page.width - marginX * 2,
            height: (130 / 1800) * (doc.page.width - marginX * 2),
          })
          .moveDown(3);
      };

      const renderAnsCategory = async (
        doc: PDFKit.PDFDocument,
        service: AssetsService,
        vis: VisualizationService,
        item: any,
        index: number,
        LEVEL_RULES: Record<string, (point: number, name?: string) => string>,
        categories: any,
        maxes: any,
        parentheses: boolean,
      ) => {
        const name = item.categoryName;

        doc.x = marginX;

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(`${index + 1}. ${name.toUpperCase()} `)
          .moveDown(0.5);

        for (const [index, category] of categories.entries()) {
          const levelLabel =
            LEVEL_RULES[category.value]?.(category.cause, name) ?? '';

          doc
            .font(fontNormal)
            .fontSize(12)
            .fillColor(colors.black)
            .text(`Таны `, marginX, doc.y, {
              continued: true,
            })
            .font(fontBold)
            .text(`${category.value}`, { continued: true })
            .font(fontNormal)
            .text(' үнэлгээний дэд бүлгийн оноо ', { continued: true })
            .font('fontBlack')
            .fillColor(colors.orange)
            .text(category.cause.toString(), { continued: true })
            .font(fontNormal)
            .fillColor(colors.black)
            .text(' буюу ', { continued: true })
            .font('fontBlack')
            .fillColor(colors.orange)
            .text(levelLabel.toUpperCase(), { continued: true })
            .font(fontNormal)
            .fillColor(colors.black)
            .text(parentheses ? `(-ийн) түвшинд байна.` : ' түвшинд байна.')
            .moveDown(0.5);

          doc.moveDown(-0.8);

          const buffer = await vis.bar(category.cause, maxes[index], 100, '');

          doc
            .image(buffer, {
              width: doc.page.width - marginX * 2,
              height: (130 / 1800) * (doc.page.width - marginX * 2),
            })
            .moveDown(3);
        }
      };

      const separatorLine = (y?: number) => {
        const lineY = doc.y;
        doc
          .save()
          .moveTo(marginX, lineY)
          .lineTo(doc.page.width - marginX, lineY)
          .dash(1, { space: 3 })
          .strokeColor(colors.red)
          .stroke()
          .undash()
          .restore();
      };

      // ARHINII AUDIT
      await renderSum(
        doc,
        service,
        this.vis,
        orderedResults[0],
        0,
        LEVEL_RULES,
      );

      separatorLine();
      doc.moveDown(1.5);

      const tamhi = await this.answer.getAnswer(result.code, '1926');

      // TAMHI
      doc
        .font(fontBold)
        .fontSize(12)
        .fillColor(colors.black)
        .text(`2. ${orderedResults[1].categoryName.toUpperCase()} `)
        .moveDown(0.5);

      doc
        .font(fontBold)
        .text(`Та одоогоор тамхи татдаг уу? `, { continued: true })
        .font(fontNormal)
        .text('гэсэн асуултад ', { continued: true })
        .font(fontBold)
        .text(`“${tamhi}” `, { continued: true })
        .font(fontNormal)
        .text('гэж хариулсан.')
        .moveDown(1);

      separatorLine();
      doc.moveDown(1.5);

      // NICOTINE
      await renderSum(
        doc,
        service,
        this.vis,
        orderedResults[2],
        2,
        LEVEL_RULES,
      );

      separatorLine();
      doc.moveDown(1.5);

      const hads = results.filter((r) => r.question_category === 208);

      // HADS
      await renderAnsCategory(
        doc,
        service,
        this.vis,
        orderedResults[3],
        3,
        LEVEL_RULES,
        hads[0].details,
        [21, 21],
        true,
      );

      footer(doc);
      doc.addPage();

      header(
        doc,
        result.firstname,
        result.lastname,
        service,
        'Сорилуудын үр дүн',
      );

      // NOIRGUIDEL
      await renderSum(
        doc,
        service,
        this.vis,
        orderedResults[4],
        4,
        LEVEL_RULES,
      );

      separatorLine();
      doc.moveDown(1.5);

      // SULIDAL
      await renderSum(
        doc,
        service,
        this.vis,
        orderedResults[5],
        5,
        LEVEL_RULES,
        '(-ыг) илтгэж байна.',
      );

      separatorLine();
      doc.moveDown(1.5);

      //DASS21
      const dass21 = results.filter((r) => r.question_category === 211);

      await renderAnsCategory(
        doc,
        service,
        this.vis,
        orderedResults[6],
        6,
        LEVEL_RULES,
        dass21[0].details,
        [21, 21, 21],
        false,
      );

      separatorLine();
      doc.moveDown(1.5);

      //TARHINII ACHAALAL

      const tarhi = results.filter((r) => r.question_category === 212);

      await renderAnsCategory(
        doc,
        service,
        this.vis,
        orderedResults[7],
        7,
        LEVEL_RULES,
        tarhi[0].details,
        [15, 20, 15],
        false,
      );

      doc.moveDown(1.5);
      footer(doc);
      doc.addPage();

      header(
        doc,
        result.firstname,
        result.lastname,
        service,
        'Сорилуудын үр дүн',
      );

      //WHOQOL

      const whoqol = results.filter((r) => r.question_category === 213);

      await renderAnsCategory(
        doc,
        service,
        this.vis,
        orderedResults[8],
        8,
        LEVEL_RULES,
        whoqol[0].details,
        [20, 20, 20, 20],
        false,
      );
      await renderSum(
        doc,
        service,
        this.vis,
        orderedResults[8],
        8,
        LEVEL_RULES,
      );

      footer(doc);
      doc.addPage();
      header(
        doc,
        result.firstname,
        result.lastname,
        service,
        'Сорилуудын үр дүн',
      );
      doc.font(fontNormal).fillColor(colors.black).fontSize(12);
      textWithDots('Үзлэг хийсэн эмчийн тэмдэглэл:');
      textWithDots('');
      doc.moveDown(1);
      textWithDots('');
      doc.moveDown(1);
      textWithDots('');
      doc.moveDown(1);
      textWithDots('');
      doc.moveDown(2);

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
        .moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .list(
          [
            'Нойргүйдэл',
            'Сэтгэл түгшилт',
            'Айдас',
            'Сэтгэл гутрал',
            'Уур бухимдал',
            'Мэдрэл сульдал',
            'Дэлгэцийн донтолт',
            'Архи, тамхи, мансууруулах бодисын хэрэглээтэй холбоотой асуудал',
            'Жирэмсэн үеийн сэтгэл зүйн өөрчлөлт',
            'Төрсний дараах сэтгэлзүйн хямрал, сэтгэл гутрал',
            'Гэмтлийн дараах /хүчтэй стресс/ сэтгэл зүйн хямрал',
            'Ахимаг насны үеийн сэтгэцийн тулгамдсан асуудал',
            'Хүүхдийн сэтгэцийн тулгамдсан асуудал.',
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

      separatorLine();
      doc.moveDown(1);

      const textX = doc.x - 20;
      const textY = doc.y + 5;
      const textWidth = doc.widthOfString('ЗӨВ ХҮН, ЗӨВ ГАЗАРТ');

      const textGrad = doc.linearGradient(
        textX,
        textY,
        textX + textWidth,
        textY,
      );
      textGrad.stop(5, colors.orange).stop(10, colors.red);

      doc
        .font('fontBlack')
        .fontSize(20)
        .fillColor(textGrad)
        .text('ЗӨВ ХҮН, ЗӨВ ГАЗАРТ', textX, textY, { align: 'center' });

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Зан төлөв, чадамж, мэргэжил, ур чадварын тест, өөрийн үнэлгээ.',
          marginX,
          doc.y,
          {
            align: 'center',
          },
        )
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Hire.mn нь хувь хүний зан төлөв, чадамж, мэргэжлийн мэдлэг, ажлын байрны төрөл бүрийн ур чадварыг шалгах зориулалттай тест, өөрийн үнэлгээний цогц платформ. Энэхүү платформыг хүний нөөцийн сургалт, судалгааны Аксиом Инк компаниас санаачлан их дээд сургуулийн багш нар болон бие даасан судлаач нартай хамтран 2024 оноос хойш хөгжүүлж байна.',
          {
            align: 'justify',
          },
        )
        .moveDown(1);
      footer(doc);
    } catch (error) {
      console.log('single', exam?.assessment?.name, error);
    }
  }
}
