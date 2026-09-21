import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import * as https from 'https';
import { AppService } from './app.service';
import { REPORT_STATUS, time } from './base/constants';
import { Injectable } from '@nestjs/common';
import { ReportLogDao } from './daos/report.log.dao';
@Injectable()
@Processor('report', { concurrency: 1, lockDuration: 5 * 60 * 1000 })
export class AppProcessor extends WorkerHost {
  constructor(
    private service: AppService,
    private dao: ReportLogDao,
  ) {
    super();
    console.log('🚀 APP PROCESSOR CREATED');
  }
  private CORE = process.env.CORE + 'api/v1';
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log('Processing:', job.id);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log('Completed:', job.id);
  }
  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    console.log('Failed:', job.id, err.message);
    // BullMQ 'failed' event нь attempt бүрт дуудагдана (job.attemptsMade нь
    // одоогийн оролдлогын дугаар). Зөвхөн БҮХ retry (attempts: 3,
    // app.module.ts) дуусаад эцэслэн амжилтгүй болсон үед л DB-ийн
    // report_logs мөрийг FAILED болгоно — эсвэл core-ийн
    // /api/v1/exam/pdf/:code polling endpoint (202 vs 500) буруу цаг үед
    // хэрэглэгчид "алдаа" харуулна.
    const attemptsMax = job.opts?.attempts ?? 1;
    if (job.attemptsMade < attemptsMax) return;

    try {
      await this.dao.updateById(job.id as string, {
        status: REPORT_STATUS.FAILED,
        error: (err?.message || 'Тодорхойгүй алдаа').slice(0, 500),
      });
    } catch (dbErr) {
      console.error(
        '⚠️ Report-ийг FAILED болгож DB-д бичихэд алдаа гарлаа:',
        job.id,
        dbErr,
      );
    }
  }
  private httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  async process(job: Job<any>): Promise<any> {
    try {
      console.log('📌 Worker received job:', job.id, job.data);
      console.log('start', time());

      const { code, role } = job.data;
      console.log(code, role, 'role');
      // Алхам 1: Exam дуусгах
      await this.service.endExam(code, job);
      await this.updateProgress({
        id: job.id,
        progress: 30,
        code,
        status: REPORT_STATUS.WRITING,
      });

      // Алхам 2: Тооцоолол хийх
      const doc = await this.service.getDoc(code, role, job);

      await this.updateProgress({
        id: job.id,
        progress: 80,
        code,
        status: REPORT_STATUS.CALCULATING,
      });

      await this.service.generateAndUpload(doc, code);

      // Бүх зүйл амжилттай болсон үед
      await this.updateProgress({
        id: job.id,
        progress: 100,
        code,
        status: REPORT_STATUS.COMPLETED,
      });
      await axios.get(`${this.CORE}/report/mail/${code}`, {
        httpsAgent: this.httpsAgent,
      });
    } catch (error) {
      console.error('❌ Report job алдаатай:', job.id, error);
      // ⚠️ FIX: өмнө нь энд алдааг зөвхөн log хийгээд залгичихдаг байсан тул
      // BullMQ job-ыг "амжилттай" гэж үзэж, report_logs.status хэзээ ч
      // FAILED болдоггүй, мөнхөд WRITING/CALCULATING дээр гацдаг байсан
      // ("тайлан уншаад гацдаг" гэсэн хэрэглэгчийн гомдол). Заавал rethrow
      // хийж BullMQ-д мэдэгдэж, retry (attempts: 3)/onFailed-ийг ажиллуулна.
      throw error;
    }
  }

  // 📊 Progress update helper function
  async updateProgress(input: {
    id: string;
    progress: number;
    status?: REPORT_STATUS;
    result?: any;
    code: string;
  }) {
    const { id, progress, status, result, code } = input;
    // Job update

    this.dao.updateById(id, {
      status:
        progress < 100
          ? (status ?? REPORT_STATUS.WRITING)
          : REPORT_STATUS.COMPLETED,
      progress,
      ...(result && { result }),
      code,
    });

    console.log(`🔹 Progress: ${progress}%`);
  }
}
