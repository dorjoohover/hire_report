import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { AppService } from './app.service';
import { PassThrough } from 'stream';
import { REPORT_STATUS, time } from './base/constants';

@Processor('report')
export class AppProcessor extends WorkerHost {
  constructor(private service: AppService) {
    super();
  }
  async simulateProgressSteps(
    job: Job<any>,
    steps: { percent: number; status: REPORT_STATUS | 'COMPLETED' }[],
  ) {
    for (const step of steps) {
      await job.updateProgress(step.percent);
      await axios.post(`${process.env.CORE}report/${job.id}/callback`, {
        status: step.status,
        progress: step.percent,
      });
      console.log(`🔹 Progress: ${step.percent}%`);
    }
  }
  async process(job: Job<any>): Promise<any> {
    try {
      console.log('📌 Worker received job:', job.id, job.data);
      console.log('start', time());

      const { code, role } = job.data;
      console.log(code, role);
      // Алхам 1: Exam дуусгах
      // await this.service.endExam(code);
      await this.updateProgress(job, 10);

      // Алхам 2: Тооцоолол хийх
      console.log('calculate ', time());
      await this.service.calculateExamById(code);
      await this.updateProgress(job, 20, REPORT_STATUS.CALCULATING);

      // Алхам 3: Result авах
      const { res, result } = await this.service.getResult(code, role);

      await this.updateProgress(job, 40, REPORT_STATUS.CALCULATING);

      // Шууд шатлалтай ахиулна

      console.log('pdf', time());

      const doc = await this.service.getDoc(result, res);
      await this.updateProgress(job, 80, REPORT_STATUS.CALCULATING);

      console.log('pdf end', time());
      const resStream = new PassThrough();
      doc.pipe(resStream);
      doc.end();

      // Алхам 5: Upload хийх (энэ дотор 90 → 100% update болно)
      console.log('uploading', time());
      this.service.upload(code, resStream);
      await this.updateProgress(job, 100, REPORT_STATUS.COMPLETED);
      console.log('end', time());
      return { message: 'Report ready', input: job.data };
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
    await axios.post(`${process.env.CORE}report/${job.id}/callback`, {
      status: progress < 100 ? (status ?? REPORT_STATUS.WRITING) : 'COMPLETED',
      progress,
      ...(result && { result }),
    });

    // Console nice format
    console.log(`🔹 Progress: ${progress}%`);
  }
}
