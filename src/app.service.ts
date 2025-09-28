import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REPORT_STATUS, ReportType, Role, time } from './base/constants';
import { ExamDao, FormuleDao, ResultDao, UserDao } from './daos/index.dao';
import {
  AssessmentEntity,
  ExamEntity,
  ResultEntity,
  UserEntity,
} from './entities';
import { Belbin, DISC, Holland } from './pdf/reports';
import { ResultDetailDto } from './dtos/index.dto';
import { maxDigitDISC } from './pdf/formatter';
import { PdfService } from './pdf.services';
import { PassThrough } from 'stream';
import { FileService } from './file.service';
import * as mime from 'mime-types';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { Job } from 'bullmq';
import { AppProcessor } from './app.processer';
import { MBTI } from './pdf/reports/mbti';
@Injectable()
export class AppService {
  constructor(
    private dao: ExamDao,
    private resultDao: ResultDao,
    private userDao: UserDao,
    private formuleDao: FormuleDao,
    private pdfService: PdfService,
    @Inject(forwardRef(() => AppProcessor)) private processor: AppProcessor,
    private fileService: FileService,
  ) {}

  public endExam = async (code: number, calculate = false) => {
    // new Promise((resolve) => setTimeout(resolve, 10000));
    // await this.dao.endExam(code);
    // return res;
  };

  public async checkExam(code: number) {
    await this.dao.checkExam(code);
  }

  public async getResult(id: number, role: number, job?: Job) {
    try {
      const res = await this.dao.findByCode(id);
      console.log(res);
      // if (!res?.visible && role == Role.client) {
      //   throw new HttpException(
      //     'Байгууллагын зүгээс үр дүнг нууцалсан байна.',
      //     HttpStatus.FORBIDDEN,
      //   );
      // }
      const result = await this.resultDao.findOne(id);
      this.processor.updateProgress(job, 40, REPORT_STATUS.CALCULATING);
      console.log(result);
      return { res, result };
    } catch (err) {
      console.log(err);
    }
  }

  public async getDoc(code: number, role: number, job?: Job) {
    const { res, result } = await this.getResult(code, role, job);
    console.log(res, result);
    return await this.pdfService.createPdfInOneFile(result, res, code);
  }
  public async getPdf(id: number, role?: number) {
    const doc = await this.getDoc(id, role);
    const resStream = new PassThrough();
    doc.pipe(resStream);

    this.upload(`${id}`, resStream);
    return doc;
  }

  public async upload(id: string, resStream: PassThrough) {
    return await this.fileService.processMultipleImages(
      [], // files байхгүй
      resStream,
      `report-${id}.pdf`,
      'application/pdf',
    );
  }
  public async calculateExamById(id: number, job?: Job) {
    try {
      const calculate = false;
      const result = await this.resultDao.findOne(id);
      const {
        email,
        assessment,
        visible,
        id: examId,
        user: u,
        userEndDate,
        userStartDate,
        code,
        firstname,
        lastname,
      } = await this.dao.findByCode(id);
      let user = u;
      if (user == null) user = await this.userDao.getByEmail(email);
      if (
        visible != undefined &&
        !result &&
        !visible &&
        user.role == Role.client &&
        !calculate
      )
        throw new HttpException(
          'Байгууллагаас зүгээс үр дүнг нууцалсан байна.',
          HttpStatus.FORBIDDEN,
        );

      if (result)
        return {
          // calculate: result.,
          visible: visible,
          icons: assessment?.icons,
          value: visible ? result : null,
        };

      const formule = assessment.formule;
      if (formule) {
        const res = await this.formuleDao.calculate(formule, examId);
        const calculate = await this.calculateByReportType(
          res,
          assessment,
          userEndDate,
          userStartDate,
          lastname,
          firstname,
          code,
          user,
          id,
        );
        this.processor.updateProgress(job, 20, REPORT_STATUS.CALCULATING);
        return {
          calculate,
          visible: visible,
          icons: assessment?.icons,
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async calculateByReportType(
    res: any,
    assessment: AssessmentEntity,
    userEndDate: Date,
    userStartDate: Date,
    lastname: string,
    firstname: string,
    code: number,
    user: UserEntity,
    id: number,
  ) {
    try {
      const type = assessment.report;
      const diff = Math.floor(
        (Date.parse(userEndDate?.toString()) -
          Date.parse(userStartDate?.toString())) /
          60000,
      );
      console.log(res);
      const point = Math.round((res?.[0]?.point ?? 0) * 100) / 100;
      if (type == ReportType.CORRECT) {
        await this.dao.update(+id, {
          lastname: lastname ?? user?.lastname,
          firstname: firstname ?? user?.firstname,
          email: user?.email,
          phone: user?.phone,
          user: {
            id: user.id,
          },
        });

        await this.resultDao.create({
          assessment: assessment.id,
          assessmentName: assessment.name,
          code: code,
          duration: diff,
          firstname: firstname ?? user.firstname,
          lastname: lastname ?? user.lastname,
          type: !res[0]?.formula?.toLowerCase().includes('count')
            ? ReportType.CORRECT
            : ReportType.CORRECTCOUNT,
          limit: assessment.duration,
          total: assessment.totalPoint,
          point: point,
        });
        return point;
      }
      if (type == ReportType.SETGEL) {
        const result =
          point <= 4
            ? 'Бараг байхгүй'
            : point <= 9
              ? 'Энгийн, сэтгэл гутрал бараг үгүй'
              : point <= 14
                ? 'Хөнгөн сэтгэл гутрал'
                : point <= 19
                  ? 'Дунд зэргийн сэтгэл гутрал'
                  : 'Дундаас дээш зэргийн сэтгэл гутрал';
        await this.resultDao.create({
          assessment: assessment.id,
          assessmentName: assessment.name,
          code: code,
          duration: diff,
          firstname: firstname ?? user.firstname,
          lastname: lastname ?? user.lastname,
          type: assessment.report,
          limit: assessment.duration,
          total: assessment.totalPoint,
          result: result,
          value: point.toString(),
          point: point,
        });
        return { point: point };
      }

      if (type == ReportType.WHOQOL) {
        let details: ResultDetailDto[] = [];
        let summary: string[] = [];

        const abbrevMap: Record<string, string> = {
          'Биеийн эрүүл мэнд': 'БЭМ',
          'Сэтгэл зүйн байдал': 'СЗХ',
          'Нийгмийн харилцаа': 'НХ',
          'Хүрээлэн буй орчны нөлөөлөл': 'ХБОН',
        };

        for (const r of res) {
          const cate = r['aCate'];
          if (cate === 'N') continue;

          const raw = r['point'];

          let min = 0,
            max = 0;
          switch (cate) {
            case 'Биеийн эрүүл мэнд':
              min = 7;
              max = 35;
              break;
            case 'Сэтгэл зүйн байдал':
              min = 6;
              max = 30;
              break;
            case 'Нийгмийн харилцаа':
              min = 3;
              max = 15;
              break;
            case 'Хүрээлэн буй орчны нөлөөлөл':
              min = 8;
              max = 40;
              break;
            default:
              continue;
          }

          const score_4_20 = ((raw - min) / (max - min)) * 16 + 4;
          const score_0_100 = ((score_4_20 - 4) / 16) * 100;

          details.push({
            cause: Math.round(score_0_100).toString(),
            value: cate,
          });

          const short = abbrevMap[cate] ?? cate;
          summary.push(`${short}: ${Math.round(score_0_100)}`);
        }

        console.log('details', details);
        console.log('res', res);

        const point = res
          .filter((r) => r['aCate'] !== 'N')
          .reduce((sum, r) => sum + r['point'], 0);

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: summary.join(', '),
            value: null,
            point: null,
          },
          details,
        );

        return { point: point, details };
      }

      if (type == ReportType.EMPATHY) {
        const result =
          point <= 44
            ? 'Эмпатийн түвшин сул'
            : point <= 54
              ? 'Эмпатийн оноо тогтвортой түвшинд'
              : 'Өндөр түвшний эмпатийн мэдрэмжтэй';
        await this.resultDao.create({
          assessment: assessment.id,
          assessmentName: assessment.name,
          code: code,
          duration: diff,
          firstname: firstname ?? user.firstname,
          lastname: lastname ?? user.lastname,
          type: assessment.report,
          limit: assessment.duration,
          total: assessment.totalPoint,
          result: result,
          value: (point ?? '').toString(),
          point: point,
        });
        return { point: point };
      }
      if (type == ReportType.DISC) {
        const order = ['D', 'i', 'S', 'C'];
        let response = '',
          agent = '';
        const defaultData = order.map((letter) => ({
          aCate: letter,
          point: 0,
        }));
        const mergedData = defaultData.map(
          (item) =>
            res.find((obj) => obj['aCate']?.toLowerCase() === item.aCate) ||
            item,
        );
        let index = {
          D: [],
          i: [],
          S: [],
          C: [],
        };
        let intens = {
          D: 0,
          i: 0,
          S: 0,
          C: 0,
        };

        for (const r of mergedData) {
          let inten = -1,
            total = '';
          const aCate = r.aCate?.toLowerCase();
          const cate = DISC.graph3[aCate];
          const point = +r['point'];
          if (cate != null) {
            for (const [k, v] of Object.entries(cate)) {
              for (const { min, max, intensity } of v as any) {
                if (point == min && point == max) {
                  inten = intensity;
                  total = `${k}`;
                  break;
                }
                if (point >= min && point <= max) {
                  inten = intensity;
                  total = `${k}`;
                  break;
                }
              }
            }
            response += total;
          }
          if (inten != -1) {
            const float = inten % 1 !== 0;
            let startInterval = 3,
              endInterval = 3;
            if (float) {
              endInterval = 2;
              inten = Math.floor(inten);
            }
            let start = 28 - inten;
            if (start <= 3) {
              start = 0;
              startInterval = 0;
            }
            if (start + endInterval > 27) {
              endInterval = 27 - start;
            }
            const indexs = Object.values(DISC.index[aCate]).slice(
              start - startInterval,
              start + endInterval + 1,
            );
            intens[aCate] = inten;
            index[aCate] = indexs;
          }
        }
        for (const [k, v] of Object.entries(DISC.pattern)) {
          for (const value of v) {
            if (+response == value) {
              agent = k;
              break;
            }
          }
        }
        let details: ResultDetailDto[] = [];
        for (const [k, v] of Object.entries(index)) {
          for (const i of v) {
            details.push({
              category: k,
              cause: intens[k],
              value: i,
            });
          }
        }
        const values = maxDigitDISC(response);
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: values,
            segment: response,
            value: agent,
          },
          details,
        );
        await this.dao.update(+id, {
          result: agent,
          lastname: user?.lastname,
          firstname: user?.firstname,
          email: user?.email,
          phone: user?.phone,
          user: {
            id: user.id,
          },
        });
        return {
          agent,
          index,
        };
      }
      if (type == ReportType.MBTI) {
        let details: ResultDetailDto[] = [];
        console.log('step 1', res);
        const modifiers: Record<string, number> = {
          'J-P': 18,
          'I-E': 30,
          'S-N': 12,
          'F-T': 30,
        };

        for (const r of res) {
          const cate = r['aCate'];
          const point = Number(r['point'] ?? 0);
          const modifier = modifiers[cate] ?? 0;

          details.push({
            cause: (point + modifier).toString(),
            value: cate,
          });
        }

        const scores: Record<string, number> = {};
        details.forEach((d) => {
          scores[d.value] = (scores[d.value] ?? 0) + Number(d.cause);
        });

        console.log('scores', scores);

        const typeStr =
          (scores['I-E'] > 24 ? 'E' : 'I') +
          (scores['S-N'] > 24 ? 'N' : 'S') +
          (scores['F-T'] > 24 ? 'T' : 'F') +
          (scores['J-P'] > 24 ? 'P' : 'J');

        let pattern = '';
        for (const [name, codes] of Object.entries(MBTI.pattern)) {
          if (codes.includes(typeStr)) {
            pattern = name;
            break;
          }
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: typeStr,
            value: pattern,
          },
          details,
        );

        return { details };
      }

      if (type == ReportType.DARKTRIAD) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );

        const abbrevMap: Record<string, string> = {
          Machiavellianism: 'Mach',
          Narcissism: 'Narc',
          Psychopathy: 'Psych',
        };

        const resultStr = details
          .map((d) => `${abbrevMap[d.value] ?? d.value}: ${d.cause}`)
          .join(', ');
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: null,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.CFS) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const totalPoints = details.reduce(
          (sum, d) => sum + Number(d.cause),
          0,
        );

        let resultStr = '';
        if (totalPoints <= 14) {
          resultStr = 'Хөнгөн ядаргаа';
        } else if (totalPoints <= 24) {
          resultStr = 'Дунд зэргийн ядаргаа';
        } else if (totalPoints <= 43) {
          resultStr = 'Хүнд хэлбэрийн ядаргаа';
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: totalPoints.toString(),
            point: totalPoints,
          },
          details,
        );
        return {
          agent: totalPoints,
          details,
        };
      }
      if (type == ReportType.HADS) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const totalPoints = details.reduce(
          (sum, d) => sum + Number(d.cause),
          0,
        );

        let resultStr = '';
        if (totalPoints <= 14) {
          resultStr = 'Хэвийн';
        } else if (totalPoints <= 28) {
          resultStr = 'Дунд зэрэг';
        } else if (totalPoints <= 42) {
          resultStr = 'Хүнд зэргийн эмгэг';
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: totalPoints.toString(),
            point: totalPoints,
          },
          details,
        );
        return {
          agent: totalPoints,
          details,
        };
      }
      if (type == ReportType.BOS) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const totalPoints = details.reduce(
          (sum, d) => sum + Number(d.cause),
          0,
        );

        let resultStr = '';
        if (totalPoints <= 19) {
          resultStr = 'Хэвийн';
        } else if (totalPoints <= 29) {
          resultStr = 'Хөнгөн';
        } else if (totalPoints <= 39) {
          resultStr = 'Дунд зэрэг';
        } else {
          resultStr = 'Хүнд';
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: totalPoints.toString(),
            point: totalPoints,
          },
          details,
        );
        return {
          agent: totalPoints,
          details,
        };
      }
      if (type == ReportType.BIGFIVE) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );

        const abbrevMap: Record<string, string> = {
          'Хариуцлагатай байдал': 'ХБ',
          'Нийтэч байдал': 'НБ',
          'Тогтвортой байдал': 'СТБ',
          'Сониуч байдал': 'СБ',
          'Гадагшаа чиглэсэн байдал': 'ГЧБ',
        };

        const resultStr = details
          .map((d) => `${abbrevMap[d.value] ?? d.value}: ${d.cause}`)
          .join(', ');
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: null,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.BELBIN) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        for (const v of Belbin.values) {
          const include =
            details.filter(
              (detail) => detail.value?.toLowerCase() == v?.toLowerCase(),
            ).length != 0;
          if (!include)
            details.push({
              cause: '0',
              value: v,
            });
        }

        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: max.value,
            value: max.category,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.HOLLAND) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }

        for (const v of Holland.values) {
          const include =
            details.filter(
              (detail) => detail.value?.toLowerCase() == v?.toLowerCase(),
            ).length != 0;
          if (!include)
            details.push({
              cause: '0',
              value: v,
            });
        }

        const sorted = details.sort(
          (a, b) => parseInt(b.cause) - parseInt(a.cause),
        );

        const top1 = sorted[0];

        const abbrev = sorted
          .slice(0, 3)
          .map((d) => d.value[0])
          .join('');

        const finalResult = `${abbrev}`;

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: abbrev,
            value: top1.value,
          },
          details,
        );

        return {
          agent: top1.value,
          details,
          result: finalResult,
        };
      }
      if (type == ReportType.DISAGREEMENT) {
        console.log('disagree', res);
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );

        const abbrevMap: Record<string, string> = {
          'Хамтран ажиллагч (Collaborating)': 'ХА',
          'Тохиролцогч (Compromising)': 'Тох',
          'Зайлсхийгч (Avoiding)': 'Зай',
          'Буулт хийгч (Accommodating)': 'БХ',
          'Өрсөлдөгч (Competing)': 'Өрс',
        };

        const resultStr = details
          .map((d) => `${abbrevMap[d.value] ?? d.value}: ${d.cause}`)
          .join(', ');
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: null,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.PSI) {
        console.log('psi', res);
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: max.value,
            value: max.cause,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.OFFICE) {
        let details: ResultDetailDto[] = [];

        console.log('res', res);
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];

          details.push({
            cause: point,
            value: cate,
          });
        }

        const avgFixed = Number(res[0].total);

        let level = '';
        if (avgFixed >= 0 && avgFixed <= 2) {
          level = 'Харьцангуй бага';
        } else if (avgFixed > 2 && avgFixed <= 3.4) {
          level = 'Дунд түвшин';
        } else if (avgFixed >= 3.5 && avgFixed <= 5) {
          level = 'Харьцангуй өндөр';
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: level,
            value: avgFixed.toString(),
            point: avgFixed,
          },
          details,
        );
        return {
          // agent: max.category,
          details,
        };
      }
      if (type == ReportType.BURNOUT) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const qCate = r['qCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: qCate,
          });
        }

        const abbrevMap: Record<string, string> = {
          'Хувь хүнтэй холбоотой': 'Хувь хүн',
          'Ажилтай холбоотой': 'Ажил',
          'Харилцагч/үйлчлүүлэгчтэй холбоотой': 'ХҮ',
        };

        const resultStr = details
          .map((d) => `${abbrevMap[d.value] ?? d.value}: ${d.cause}`)
          .join(', ');

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: null,
          },
          details,
        );

        return {
          agent: res,
          details,
          result: res,
        };
      }
      if (type == ReportType.ETHIC) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const qCate = r['qCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: qCate,
          });
        }

        const abbrevMap: Record<string, string> = {
          'Ажилтнуудаас хүлээж буй ёс зүйн хэм хэмжээний хүлээлт': 'Ажилтнууд',
          'Ёс зүйтэй шийдвэр гаргалт': 'Шийдвэр',
          'Ёс зүй бол эрхэмлэх үнэт зүйл мөн болох': 'Үнэт зүйл',
          'Дотоодын ёс зүйн хөтөлбөр, үйл ажиллагааг дэмжих': 'Үйл ажиллагаа',
        };

        const resultStr = details
          .map((d) => `${abbrevMap[d.value] ?? d.value}: ${d.cause}`)
          .join(', ');

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: null,
          },
          details,
        );

        return {
          agent: res,
          details,
          result: res,
        };
      }
      if (type == ReportType.INAPPROPRIATE) {
        console.log('inappropriate', res);
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const qCate = r['qCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: qCate,
          });
        }

        const totalPoints = Number(res[0].total);

        let resultStr = '';
        if (totalPoints <= 1.9) {
          resultStr = 'Маш бага';
        } else if (totalPoints <= 2.9) {
          resultStr = 'Бага';
        } else if (totalPoints <= 3.9) {
          resultStr = 'Дунд';
        } else {
          resultStr = 'Өндөр';
        }

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: resultStr,
            value: totalPoints.toString(),
          },
          details,
        );

        return {
          agent: res,
          details,
          result: res,
        };
      }
      if (type == ReportType.GENOS) {
        let details: ResultDetailDto[] = [];
        for (const r of res) {
          const cate = r['aCate'];
          const point = r['point'];
          details.push({
            cause: point,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );
        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: max.value + 'чадвар',
            value: max.category,
          },
          details,
        );
        return {
          agent: max.category,
          details,
        };
      }
      if (type == ReportType.NARC) {
        let details: ResultDetailDto[] = [];
        let total = 0;
        for (const r of res) {
          const cate = r['aCate'];
          const count = r['point'];

          total += count;

          details.push({
            cause: count,
            value: cate,
          });
        }
        const max = details.reduce(
          (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
          details[0],
        );

        const result =
          total <= 9
            ? 'Бага түвшин'
            : total <= 15
              ? 'Дундаж түвшин'
              : total <= 20
                ? 'Харьцангуй өндөр түвшин'
                : 'Үнэмлэхүй өндөр түвшин';

        await this.resultDao.create(
          {
            assessment: assessment.id,
            assessmentName: assessment.name,
            code: code,
            duration: diff,
            firstname: firstname ?? user.firstname,
            lastname: lastname ?? user.lastname,
            type: assessment.report,
            limit: assessment.duration,
            total: assessment.totalPoint,
            result: result,
            value: total.toString(),
          },
          details,
        );
        return {
          total,
          result,
          all: assessment.totalPoint,
          details,
        };
      }
    } catch (error) {
      console.log(error);
    }
  }
}
