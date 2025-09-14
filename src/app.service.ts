import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportType, Role, time } from './base/constants';
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
@Injectable()
export class AppService {
  constructor(
    private dao: ExamDao,
    private resultDao: ResultDao,
    private userDao: UserDao,
    private formuleDao: FormuleDao,
    private pdfService: PdfService,
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

  public async getResult(id: number, role: number) {
    const res = await this.dao.findByCode(id);
    if (!res?.visible && role == Role.client) {
      throw new HttpException(
        'Байгууллагын зүгээс үр дүнг нууцалсан байна.',
        HttpStatus.FORBIDDEN,
      );
    }
    const result = await this.resultDao.findOne(id);
    return { res, result };
  }

  public async getDoc(result: ResultEntity, res: ExamEntity) {
    return await this.pdfService.createPdfInOneFile(result, res);
  }
  public async getPdf(id: number, role?: number) {
    const { res, result } = await this.getResult(id, role);
    const doc = await this.getDoc(result, res);
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
  public async calculateExamById(id: number, calculate = false) {
    try {
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
      console.log('result', time());
      let user = u;
      if (user == null) user = await this.userDao.getByEmail(email);
      console.log('user', time());
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
        console.log('calculate', time());
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
        console.log('calculateByReportType', time());
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
    const type = assessment.report;
    const diff = Math.floor(
      (Date.parse(userEndDate?.toString()) -
        Date.parse(userStartDate?.toString())) /
        60000,
    );
    const point = Math.round(res[0].point * 100) / 100;
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
      const defaultData = order.map((letter) => ({ aCate: letter, point: 0 }));
      const mergedData = defaultData.map(
        (item) =>
          res.find((obj) => obj['aCate']?.toLowerCase() === item.aCate) || item,
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
      // console.log(res);
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

      const finalResult = `${abbrev} / ${top1.value}`;

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
          result: finalResult, // store SAE / Social
          value: top1.value, // store main top1 category
        },
        details,
      );

      return {
        agent: top1.value,
        details,
        result: finalResult,
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
  }
}
