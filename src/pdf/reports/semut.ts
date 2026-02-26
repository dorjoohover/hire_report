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

      const ovog = await this.answer.getAnswerValue(result.code, '1901');
      const name = await this.answer.getAnswerValue(result.code, '1902');

      doc.font(fontNormal).fontSize(12).fillColor(colors.black);

      doc
        .text('Овог: ', leftX, startY, { continued: true, width: colWidth })
        .font(fontBold)
        .text(ovog);
      doc.moveDown(0.25);

      doc
        .font(fontNormal)
        .text('Нэр: ', { continued: true, width: colWidth })
        .font(fontBold)
        .text(name);
      let rightX = marginX + colWidth + columnGap;

      const nas = await this.answer.getAnswerValue(result.code, '1907');
      const huis = await this.answer.getAnswer(result.code, '1908');

      doc
        .font(fontNormal)
        .text(`Нас: `, rightX, startY, {
          continued: true,
          width: colWidth,
        })
        .font(fontBold)
        .text(nas);

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
        'Архины хэрэглээг үнэлэх асуумж (AUDIT)',
        'Тамхины хэрэглээг үнэлэх асуумж',
        'Никотины хэрэглээг үнэлэх асуумж',
        'Айдас түгшүүр, сэтгэл гутралын асуумж (HADS)',
        'Нойргүйдлийн зэргийг үнэлэх асуумж',
        'Сульдал илрүүлэх асуумж',
        'Сэтгэл гутрал, сэтгэл түгшилт, стрессийг үнэлдэг асуумж (DASS-21)',
        'Тархины хэт ачааллыг үнэлэх асуумж',
        'Амьдралын чанарыг үнэлэх асуумж (WHOQOL-BREF)',
      ];

      const orderedResults = CATEGORY_ORDER.map((name) =>
        res.find((r) => r.categoryName === name),
      ).filter(Boolean);

      const LEVEL_RULES: Record<
        string,
        (point: number, name?: string) => string
      > = {
        'Архины хэрэглээг үнэлэх асуумж (AUDIT)': (p) =>
          p <= 0
            ? 'Согтууруулах ундаа огт хэрэглэдэггүй'
            : p <= 7
              ? 'Эрсдэл багатай архины хэрэглээний түвшин'
              : p <= 15
                ? 'Архи хэрэглэгч буюу аюултай хэрэглээний түвшин'
                : p <= 19
                  ? 'Архи хэтрүүлэн хэрэглэгч буюу хортой үр дагавар өгөхүйц хэрэглээний түвшин'
                  : 'Архины хамааралтай гэж сэжиглэх түвшин',

        'Тамхины хэрэглээг үнэлэх асуумж': (p) =>
          p <= 7 ? 'Хэвийн' : p <= 14 ? 'Дунд зэрэг' : 'Хүнд зэрэг',

        'Никотины хэрэглээг үнэлэх асуумж': (p) =>
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
          name === 'Айдас түгшүүр, сэтгэл гутралын асуумж (HADS)'
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
                  ? 'Дунд'
                  : p <= 9
                    ? 'Хүндэвтэр'
                    : 'Хүнд',

        'Сэтгэл түгшил': (p, name) =>
          name === 'Айдас түгшүүр, сэтгэл гутралын асуумж (HADS)'
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
                  ? 'Дунд'
                  : p <= 13
                    ? 'Хүндэвтэр'
                    : 'Хүнд',

        'Нойргүйдлийн зэргийг үнэлэх асуумж': (p) =>
          p <= 7
            ? 'Клиник ач холбогдол бүхий нойргүйдэл үгүй'
            : p <= 14
              ? 'Клиник шинж тэмдэг бүхий нойргүйдэл бага зэрэг'
              : p <= 21
                ? 'Клиник шинж тэмдэг бүхий нойргүйдэл дунд зэрэг'
                : 'Клиник шинж тэмдэг бүхий нойргүйдэл хүнд зэрэг',

        'Сульдал илрүүлэх асуумж': (p) =>
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
                ? 'Дунд'
                : p <= 16
                  ? 'Хүндэвтэр'
                  : 'Хүнд',

        'Биеийн эрүүл мэнд': (p) =>
          p <= 39
            ? 'Маш бага / муу чанар'
            : p <= 59
              ? 'Дунд түвшин'
              : p <= 79
                ? 'Сайн чанар'
                : 'Маш сайн, өндөр чанар',

        'Сэтгэл зүйн байдал': (p) =>
          p <= 39
            ? 'Маш бага / муу чанар'
            : p <= 59
              ? 'Дунд түвшин'
              : p <= 79
                ? 'Сайн чанар'
                : 'Маш сайн, өндөр чанар',

        'Орчны нөлөөлөл': (p) =>
          p <= 39
            ? 'Маш бага / муу чанар'
            : p <= 59
              ? 'Дунд түвшин'
              : p <= 79
                ? 'Сайн чанар'
                : 'Маш сайн, өндөр чанар',

        'Нийгмийн харилцаа': (p) =>
          p <= 39
            ? 'Маш бага / муу чанар'
            : p <= 59
              ? 'Дунд түвшин'
              : p <= 79
                ? 'Сайн чанар'
                : 'Маш сайн, өндөр чанар',
      };

      const renderSum = async (
        doc: PDFKit.PDFDocument,
        service: AssetsService,
        vis: VisualizationService,
        item: any,
        index: number,
        LEVEL_RULES: Record<string, (point: number) => string>,
        outro?: string,
        sum?: number,
      ) => {
        const point = Number(item.point);
        const total = sum ?? Number(item.totalPoint);
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
        parentheses: string,
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
            .text(
              parentheses === 'true'
                ? `(-ийн) түвшинд байна.`
                : parentheses === 'who'
                  ? '-тай байна.'
                  : ' түвшинд байна.',
            )
            .moveDown(0.5);

          doc.moveDown(-0.8);

          const buffer = await vis.bar(category.cause, maxes[index], 101, '');

          doc
            .image(buffer, {
              width: doc.page.width - marginX * 2,
              height: (130 / 1800) * (doc.page.width - marginX * 2),
            })
            .moveDown(3);
        }
      };

      const renderAnsWithoutLevel = async (
        doc: PDFKit.PDFDocument,
        service: AssetsService,
        vis: VisualizationService,
        item: any,
        index: number,
        categories: any,
        maxes: any,
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
          const isNiiт = category.value === 'Нийт';

          if (isNiiт) {
            doc
              .font(fontNormal)
              .fontSize(12)
              .fillColor(colors.black)
              .text(`Таны нийт оноо `, marginX, doc.y, { continued: true })
              .font('fontBlack')
              .fillColor(colors.orange)
              .text(category.cause.toString(), { continued: true })
              .font('fontBlack')
              .fillColor(colors.black)
              .text('/' + maxes[index].toString(), { continued: true })
              .font(fontNormal)
              .fillColor(colors.black)
              .text(' байна.')
              .moveDown(0.5);
          } else {
            doc
              .font(fontNormal)
              .fontSize(12)
              .fillColor(colors.black)
              .text(`Таны `, marginX, doc.y, { continued: true })
              .font(fontBold)
              .text(`${category.value}`, { continued: true })
              .font(fontNormal)
              .text(' үнэлгээний дэд бүлгийн оноо ', { continued: true })
              .font('fontBlack')
              .fillColor(colors.orange)
              .text(category.cause.toString(), { continued: true })
              .font('fontBlack')
              .fillColor(colors.black)
              .text('/' + maxes[index].toString(), { continued: true })
              .font(fontNormal)
              .fillColor(colors.black)
              .text(' байна.')
              .moveDown(0.5);
          }

          doc.moveDown(-0.8);

          const buffer = await vis.bar(category.cause, maxes[index], 60, '');

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
        undefined,
        40,
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
        undefined,
        10,
      );

      separatorLine();
      doc.moveDown(1.5);

      const hads = results.filter((r) => r.question_category === 208);

      console.log('hadse', hads);

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
        'true',
      );
      separatorLine();

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
        undefined,
        28,
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
        42,
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
        'false',
      );

      separatorLine();

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

      // TARHINII ACHAALAL
      const tarhi = results.filter((r) => r.question_category === 212);

      const tarhiMaxMap: Record<string, number> = {
        'Тайван бус байдал': 20,
        'Хэт мэдрэг байдал': 15,
        'Бодлогошрох байдал': 15,
      };

      const tarhiDetails = tarhi[0].details
        .filter((d: any) => tarhiMaxMap[d.value] !== undefined)
        .sort((a: any, b: any) => {
          const order = [
            'Тайван бус байдал',
            'Хэт мэдрэг байдал',
            'Бодлогошрох байдал',
          ];
          return order.indexOf(a.value) - order.indexOf(b.value);
        });

      const tarhiTotal = tarhiDetails.reduce(
        (sum: number, d: any) => sum + Number(d.cause),
        0,
      );

      const tarhiWithTotal = [
        ...tarhiDetails,
        { value: 'Нийт', cause: String(tarhiTotal) },
      ];

      const tarhiMaxes = [
        ...tarhiDetails.map((d: any) => tarhiMaxMap[d.value]),
        50,
      ];

      await renderAnsWithoutLevel(
        doc,
        service,
        this.vis,
        orderedResults[7],
        7,
        tarhiWithTotal,
        tarhiMaxes,
      );

      separatorLine();
      doc.moveDown(1.5);

      //WHOQOL
      const whoqol = results.filter((r) => r.question_category === 213);

      const whoqolMaxMap: Record<string, { min: number; max: number }> = {
        'Биеийн эрүүл мэнд': { min: 7, max: 35 },
        'Сэтгэл зүйн байдал': { min: 6, max: 30 },
        'Нийгмийн харилцаа': { min: 3, max: 15 },
        'Орчны нөлөөлөл': { min: 8, max: 40 },
      };

      const whoqolDetails = whoqol[0].details
        .filter(
          (d: any) => d.value !== null && whoqolMaxMap[d.value] !== undefined,
        )
        .map((d: any) => {
          const range = whoqolMaxMap[d.value];
          const raw = Number(d.cause);
          const score_4_20 =
            ((raw - range.min) / (range.max - range.min)) * 16 + 4;
          const score_0_100 = Math.round(((score_4_20 - 4) / 16) * 100);
          return { ...d, cause: String(score_0_100) };
        });

      await renderAnsCategory(
        doc,
        service,
        this.vis,
        orderedResults[8],
        8,
        LEVEL_RULES,
        whoqolDetails,
        [100, 100, 100, 100],
        'who',
      );

      separatorLine();

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

      separatorLine();
      doc.moveDown(1.75);

      const sectionY = doc.y;
      const bannerW = doc.page.width - marginX * 2;
      const bannerH = 70;
      const logoWidth = 70;

      const grad = doc.linearGradient(
        marginX,
        sectionY,
        marginX + bannerW,
        sectionY + bannerH,
      );
      grad.stop(0, colors.orange).stop(1, colors.red);

      doc.roundedRect(marginX, sectionY, bannerW, bannerH, 10).fill(grad);

      doc
        .circle(marginX + bannerW - 20, sectionY - 10, 40)
        .fillOpacity(0.08)
        .fill('#ffffff');
      doc
        .circle(marginX + bannerW - 10, sectionY + bannerH - 10, 30)
        .fillOpacity(0.06)
        .fill('#ffffff');
      doc.fillOpacity(1);

      const logoW = 70;
      const logoH = 28;
      doc.image(
        service.getAsset('logo-white'),
        marginX + 18,
        sectionY + (bannerH - logoH) / 2 + 5,
        { width: logoW },
      );

      const divX = marginX + 18 + logoW + 14;
      doc
        .moveTo(divX, sectionY + 16)
        .lineTo(divX, sectionY + bannerH - 16)
        .strokeColor('rgba(255,255,255,0.35)')
        .lineWidth(1)
        .stroke();

      const titleX = divX + 14;
      const titleW = marginX + bannerW - titleX - 12;

      doc
        .font('fontBlack')
        .fontSize(17)
        .fillColor('#ffffff')
        .text('ЗӨВ ХҮН, ЗӨВ ГАЗАРТ', titleX, sectionY + 22, {
          width: titleW,
          lineGap: 2,
        });

      doc
        .font(fontNormal)
        .fontSize(9)
        .fillColor('rgba(255,255,255,0.8)')
        .text(
          'Зан төлөв, чадамж, мэргэжил, ур чадварын тест, өөрийн үнэлгээ',
          titleX,
          sectionY + 42,
          { width: titleW },
        );

      doc.y = sectionY + bannerH + 14;
      doc.x = marginX;

      doc
        .font(fontNormal)
        .fontSize(11)
        .fillColor(colors.black)
        .text(
          'Hire.mn нь хувь хүний зан төлөв, чадамж, мэргэжлийн мэдлэг, ажлын байрны төрөл бүрийн ур чадварыг шалгах зориулалттай тест, өөрийн үнэлгээний цогц платформ. Энэхүү платформыг хүний нөөцийн сургалт, судалгааны Аксиом Инк компаниас санаачлан их дээд сургуулийн багш нар болон бие даасан судлаач нартай хамтран 2024 оноос хойш хөгжүүлж байна.',
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
    } catch (error) {
      console.log('single', exam?.assessment?.name, error);
    }
  }
}
