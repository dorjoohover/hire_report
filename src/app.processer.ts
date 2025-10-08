import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import * as os from 'os';
import { AppService } from './app.service';
import { PassThrough } from 'stream';
import { REPORT_STATUS, time } from './base/constants';
import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
@Injectable()
@Processor('report', { concurrency: 3, lockDuration: 15 * 60 * 1000 })
export class AppProcessor extends WorkerHost {
  constructor(private service: AppService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    try {
      console.log('📌 Worker received job:', job.id, job.data);
      console.log('start', time());

      const { code, role } = job.data;
      console.log(code, role);
      // Алхам 1: Exam дуусгах
      await this.service.endExam(code, job);
      await this.updateProgress(job, 10);

      // Алхам 2: Тооцоолол хийх
      const doc = await this.service.getDoc(code, role, job);

      await this.updateProgress(job, 80, REPORT_STATUS.CALCULATING);

      await this.service.generateAndUpload(doc, code);

      // Бүх зүйл амжилттай болсон үед
      await this.updateProgress(job, 100, REPORT_STATUS.COMPLETED);
    } catch (error) {
      console.log(error);
    }
  }

  // 📊 Progress update helper function
  async updateProgress(
    job: Job<any>,
    progress: number,
    status?: string,
    result?: any,
  ) {
    // Job update

    await job.updateProgress(progress);
    console.log(process.env.CORE);
    // Core API update
    await axios.post(
      `${process.env.CORE}report/${job.id}/callback`,
      {
        status:
          progress < 100 ? (status ?? REPORT_STATUS.WRITING) : 'COMPLETED',
        progress,
        ...(result && { result }),
      },
      { timeout: 0 },
    );

    // Console nice format
    console.log(`🔹 Progress: ${progress}%`);
  }
}
