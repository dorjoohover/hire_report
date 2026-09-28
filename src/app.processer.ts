import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import * as https from 'https';
import { AppService } from './app.service';
import { REPORT_STATUS, time, logStage } from './base/constants';
import { Injectable } from '@nestjs/common';
import { ReportLogDao } from './daos/report.log.dao';
@Injectable()
// ⚠️ lockDuration: job-ыг эхлүүлсэн worker ЭНЭ хугацаанд Redis-ээс дахин renew хийхгүй бол BullMQ уг job-ыг "хаягдсан" гэж vзээд өөр worker-т дахин олгоно ("could not renew lock" / "Lock mismatch ... retryJob from active" гэсэн алдаа яг үvнээс vvсдэг). Энэ нь DB query timeout шиг "богиносгож найдвартай болгох" зvйл БИШ — эсрэгээрээ,
// report container нь prod дээр cpus:1.5/mem:2g хязгаартай (ops/report-vps/docker-compose.yml)
// бөгөөд Postgres-руу pgbouncer-ээр (өөр VPS) хандадаг тул Test VPS-ээс илvv удаан/тогтворгvй
// хариу vзvvлж болно. 60сек лоck хэт хатуу тул PDF vvсгэх vеийн богино зогсолт (Puppeteer CPU
// contention, pgbouncer round-trip) дор ч lock алдагдаж job дахин эхэлдэг байсан — 5мин рvv буцаав.
// maxStalledCount: анхны утга нь 1 — өөрөөр хэлбэл lock алдагдаад (жиш нь CPU stall-аас болж) job "stalled" болвол ЗӨВХӨН НЭГ удаа дахин оролдоод, дараа нь дахиад stall хийвэл attempts (3) дуусаагvй байсан ч
// шууд FAILED болгодог — яг report-2 дээр 6997/6999 job vvнээс шалтгаалж "гацсан"/алдагдсан байх магадлалтай. 3 болгож attempts-тэй адилтгав.
// concurrency: 3 vеэс 1 болгов. report container нь prod дээр cpus:1.5 хатуу
// хязгаартай (ops/report-vps/docker-compose.yml) — Puppeteer-ээр PDF vvсгэхэд
// нэг render ойролцоогоор 1 core шаарддаг тул concurrency:3 vед 1.5 core-ийг 3
// job хуваалцаж тус бvр CPU өлссөнөөс аль хэдийн удааширч, тэр дундуур lock
// renew хийх цаг олдоггvй байсан ("could not renew lock"/"Lock mismatch" —
// job 6997/6999). concurrency:1 бол тухайн container 1.5 core-оо бvтэн 1 job-д
// өгнө — 2 replica (report-1/report-2)-тай хамт нийт 2 зэрэг PDF vvсгэх хэвээр,
// гэхдээ тус бvр эрс хурдан бөгөөд stall/retry vvсэх магадлал багасна. Хэрэв
// илvv зэрэгцээ багтаамж хэрэгтэй бол concurrency биш, report VPS-д илvv cpus
// (эсвэл илvv replica) нэмэх нь зөв чиглэл.
@Processor('report', { concurrency: 1, lockDuration: 5 * 60 * 1000, limiter: { max: 5, duration: 1000 }, maxStalledCount: 3 })
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
    const __tProcess = Date.now();
    try {
      console.log('📌 Worker received job:', job.id, job.data);
      console.log('start', time());
      // ⏱️ job.timestamp = BullMQ-д ЭНЭ job нэмэгдсэн цаг (queue.add үед).
      // Одоогийн цагтай зөрүү нь "queue-д хvлээсэн" + "worker сулрахыг
      // хvлээсэн" хугацааны нийлбэр (BullMQ хоёрыг тусад нь гаргаж өгдөггvй,
      // тиймээс нэг дор "queue_wait" гэж бүртгэв — хэрэв энэ тоо тогтмол том
      // бол active-той харьцуулж (`LLEN bull:report:active`) шалтгааныг ялгаж болно).
      logStage('queue_wait', __tProcess - job.timestamp, {
        jobId: job.id,
        code: job.data?.code,
      });

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
      const __tRender = Date.now();
      const doc = await this.service.getDoc(code, role, job);
      // ⏱️ getDoc = createPdfInOneFile бvхэлдээ (дотор нь "db_fetch_render"
      // тусад нь бас логлогдоно — render_total-оос db_fetch_render-г хасвал
      // цэвэр PDF/chart render хугацаа гарна).
      logStage('render_total', Date.now() - __tRender, { jobId: job.id, code });

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
        headers: process.env.INTERNAL_API_KEY
          ? { 'x-internal-key': process.env.INTERNAL_API_KEY }
          : undefined,
      });
      // ⏱️ Worker өөрөө (dequeue-с хойш, queue_wait ОРОЛЦОХГVЙ) нийт хэр
      // удаан ажилласан — db_fetch_calc+calc+render_total+db_fetch_render+
      // upload_local_disk-ийн нийлбэртэй ойролцоо байх ёстой (зөрvv гарвал
      // энд логлогдоогvй өөр зvйл цаг иддэг гэсэн vг).
      logStage('process_total', Date.now() - __tProcess, { jobId: job.id, code });
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
