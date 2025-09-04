import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { AppService } from './app.service';
import { PassThrough } from 'stream';
import { REPORT_STATUS } from './base/constants';

@Processor('report')
export class AppProcessor extends WorkerHost {
  constructor(private service: AppService) {
    super();
  }
  async simulateLongProgress(
    job: Job<any>,
    start: number,
    end: number,
    durationMs: number,
  ) {
    const steps = 10; // хэдэн алхамд update хийх
    const interval = durationMs / steps;
    for (let i = 1; i <= steps; i++) {
      const progress = start + Math.floor(((end - start) * i) / steps);
      await job.updateProgress(progress);
      await axios.post(`${process.env.CORE}report/${job.id}/callback`, {
        status: progress < 100 ? REPORT_STATUS.WRITING : 'COMPLETED',
        progress,
      });
      console.log(`🔹 Progress: ${progress}%`);
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  async process(job: Job<any>): Promise<any> {
    console.log('📌 Worker received job:', job.id, job.data);
    console.log(process.env.CORE);
    const { code, role } = job.data;

    // Алхам 1: Exam дуусгах
    await this.service.endExam(code);
    await this.updateProgress(job, 10);

    // Алхам 2: Тооцоолол хийх
    const calc = await this.service.calculateExamById(code);
    await this.updateProgress(job, 20, REPORT_STATUS.CALCULATING);

    // Алхам 3: Result авах
    const { res, result } = await this.service.getResult(code, role);
    this.simulateLongProgress(job, 40, 95, 3000);

    // Алхам 4: Doc үүсгэж upload хийх
    const doc = await this.service.getDoc(result, res);
    const resStream = new PassThrough();
    doc.pipe(resStream);
    doc.end();
    await this.service.upload(code, resStream);

    // Алхам 5: Дууссан
    await this.updateProgress(job, 100, REPORT_STATUS.COMPLETED, res);

    return { message: 'Report ready', input: job.data };
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
      status: progress < 100 ? (status ?? 'PROCESSING') : 'COMPLETED',
      progress,
      ...(result && { result }),
    });

    // Console nice format
    console.log(`🔹 Progress: ${progress}%`);
  }
}
