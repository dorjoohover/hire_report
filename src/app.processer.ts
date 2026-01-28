import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import * as os from 'os';
import { AppService } from './app.service';
import { PassThrough } from 'stream';
import { REPORT_STATUS, time } from './base/constants';
import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
import { ReportLogDao } from './daos/report.log.dao';
@Injectable()
@Processor('report', { concurrency: 3, lockDuration: 30 * 60 * 1000 })
export class AppProcessor extends WorkerHost {
  constructor(
    private service: AppService,
    private dao: ReportLogDao,
  ) {
    super();
  }
  private CORE = process.env.CORE + 'api/v1';

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
        progress: 10,
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
      axios.get(`${this.CORE}/report/mail/${code}`);
    } catch (error) {
      console.log(error);
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
