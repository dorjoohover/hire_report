import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import axios from 'axios';
import { AppService } from './app.service';
import { ReportLogDao } from './daos/report.log.dao';
import { ReportSnapshotService } from './report-data/report-snapshot.service';
import { peekSnapshot, PERMANENT_ERROR_MARK } from './report-data/snapshot';
import { logStage, REPORT_STATUS } from './base/constants';
import { CALC_CONCURRENCY, RUNS_CALC } from './base/runtime';

export const CALC_QUEUE = 'report-calc';

/*
 * v1.3.0 тооцооллын worker (REPORT_ROLE=calc — core VPS дээр, DB ба core-ийн Redis-тэй нэг host).
 * Урсгал: core `report-calc` queue → (recalculate бол result устгах) → calculateExamById →
 * snapshot бүрдүүлэх (+ report_snapshot-д хадгалах) → report API `POST /render` (snapshot-той).
 * report_logs мөрийг (core үүсгэсэн, id = logId) шууд DB-д шинэчилнэ.
 */
@Injectable()
@Processor(CALC_QUEUE, {
  concurrency: CALC_CONCURRENCY,
  autorun: RUNS_CALC,
  lockDuration: 2 * 60 * 1000,
  maxStalledCount: 2,
})
export class CalcProcessor extends WorkerHost {
  constructor(
    private service: AppService,
    private snapshots: ReportSnapshotService,
    private logs: ReportLogDao,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { code, role, logId, recalculate, priority, notify, examFinishedAt } = job.data ?? {};
    if (!code || !logId) throw new Error('report-calc: code/logId дутуу');
    const t0 = Date.now();
    const timings: Record<string, number> = { calc_queue_ms: t0 - job.timestamp };
    if (examFinishedAt) timings.finish_to_calc_ms = t0 - Number(examFinishedAt);
    await this.patch(logId, { status: REPORT_STATUS.CALCULATING, progress: 10, error: null, timings });

    if (recalculate) {
      // Ops "recalculate": хуучин result-ийг устгаад шинээр бодно (retry бүрд — хагас
      // үлдсэн дэд result-ийг ч цэвэрлэнэ).
      await this.service.deleteResult(code);
    }

    let t = Date.now();
    await this.service.calculateExamById(code);
    timings.calc_ms = Date.now() - t;

    t = Date.now();
    const snapshot = await this.snapshots.build(code);
    timings.snapshot_ms = Date.now() - t;
    timings.snapshot_keys = Object.keys(snapshot.calls).length;
    this.assertRenderable(code, snapshot);
    const saved = await this.snapshots.save(snapshot);
    if (saved) {
      timings.snapshot_bytes = saved.bytes;
      timings.snapshot_version = saved.version;
    }
    // result бэлэн → web энэ үеэс үр дүнгийн хуудсыг харуулж болно (progress ≥ 40).
    await this.patch(logId, { status: REPORT_STATUS.WRITING, progress: 40, timings });

    t = Date.now();
    const res = await this.handoff({ code, role, logId, snapshot, priority, notify, timings });
    timings.render_handoff_ms = Date.now() - t;
    timings.calc_total_ms = Date.now() - t0;
    await this.patch(logId, { timings });
    logStage('calc_total', timings.calc_total_ms, { jobId: job.id, code });
    return { renderJob: res?.jobId ?? null };
  }

  /**
   * Render-д явуулахаас ӨМНӨ: exam байхгүй бол дахин оролдох утгагүй (UnrecoverableError →
   * шууд FAILED, sweep алгасна). Template/томьёотой тест result-гүй үлдсэн бол тооцоолол
   * чимээгүй унасан (calculateExamById алдааг залгидаг — жиш түр зуурын DB алдаа) → энгийн
   * алдаа шидэж BullMQ-ийн retry-д найдна (render-ийг 3 удаа дэмий унагахгүй).
   */
  private assertRenderable(code: string, snapshot: any) {
    const exam: any = peekSnapshot(snapshot, 'exam.findByCode', [code]);
    if (!exam) throw new UnrecoverableError(`${PERMANENT_ERROR_MARK} exam олдсонгүй (${code})`);
    const result = peekSnapshot(snapshot, 'result.findOne', [code]);
    if (result) return;
    const aid = exam?.assessment?.id;
    const tpl: any = aid ? peekSnapshot(snapshot, 'template.findActiveByAssessment', [aid]) : null;
    if (tpl?.pages?.length || exam?.assessment?.formule) {
      throw new Error(`result үүссэнгүй (${code}) — тооцоолол амжилтгүй, дахин оролдоно`);
    }
  }

  /** report API руу (REPORT_API_URL) эсвэл local бол шууд 'report' queue руу. */
  private async handoff(payload: any): Promise<{ jobId?: string } | undefined> {
    const url = process.env.REPORT_API_URL;
    if (!url) return this.service.enqueueRender(payload);
    const attempts = 5;
    let last: any;
    for (let i = 1; i <= attempts; i++) {
      try {
        const res = await axios.post(`${url.replace(/\/+$/, '')}/render`, payload, {
          headers: process.env.INTERNAL_API_KEY ? { 'x-internal-key': process.env.INTERNAL_API_KEY } : {},
          timeout: 30_000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        return res.data;
      } catch (e: any) {
        last = e;
        console.warn(`⚠️ render handoff ${payload.code} (${i}/${attempts}):`, e?.response?.status ?? e?.code ?? e?.message);
        if (i < attempts) await new Promise((r) => setTimeout(r, i * 2000));
      }
    }
    throw new Error(`render handoff амжилтгүй: ${last?.response?.status ?? last?.code ?? last?.message}`);
  }

  private async patch(
    logId: string,
    p: { status?: string; progress?: number; error?: string | null; timings?: Record<string, number> },
  ) {
    try {
      await this.logs.patch(logId, p);
    } catch (e: any) {
      console.warn(`⚠️ report_logs patch ${logId}:`, e?.message ?? e);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    const max = job.opts?.attempts ?? 1;
    // UnrecoverableError-д BullMQ дахин оролдохгүй (attemptsMade < max байсан ч эцсийнх).
    const final = err?.name === 'UnrecoverableError' || job.attemptsMade >= max;
    if (!final || !job.data?.logId) return;
    await this.patch(job.data.logId, {
      status: REPORT_STATUS.FAILED,
      error: `calc: ${(err?.message || 'Тодорхойгүй алдаа').slice(0, 480)}`,
    });
  }
}
