// Процесс ямар үүрэгтэй ажиллахыг env-ээр тодорхойлно (2026-10-02).
//
//   REPORT_ROLE=all     (default) — HTTP API + BullMQ worker нэг процесст (хуучин горим).
//   REPORT_ROLE=api     — зөвхөн HTTP (core-ийн POST /, /job/:id, /file/:name ...).
//                         BullMQ worker үүсдэг ч autorun:false тул job АВАХГҮЙ.
//   REPORT_ROLE=worker  — `node dist/src/worker.js`-тэй хамт: HTTP-гүй, зөвхөн job.
//
// Яагаад: PDF render нь event loop-ийг 10+ секунд түгждэг тул нэг процесст
// байхад core-ийн POST (тайлан үүсгэх) хариу авч чадахгүй timeout болж
// "core-failed-*" мөр үүсдэг байсан (hire_core_report_handoff_dropped_root_cause_2026-09-28).
// API-г тусад нь ажиллуулбал хүлээн авах тал үргэлж чөлөөтэй.
export type ReportRole = 'all' | 'api' | 'worker';

const rawRole = (process.env.REPORT_ROLE || 'all').trim().toLowerCase();
export const REPORT_ROLE: ReportRole =
  rawRole === 'api' || rawRole === 'worker' ? rawRole : 'all';

/** Энэ процесс BullMQ job боловсруулах эсэх. */
export const RUNS_WORKER = REPORT_ROLE !== 'api';

/** Нэг worker процесс зэрэг хэдэн тайлан зурах. CPU-bound тул 1 зөв. */
export const REPORT_CONCURRENCY = Math.max(
  1,
  Number(process.env.REPORT_CONCURRENCY ?? 1) || 1,
);

let handlersInstalled = false;
/**
 * Нэг холболтын алдаа (DB timeout г.м.) бүх процессыг унагаахаас сэргийлнэ —
 * тухайн job FAILED/retry болж, бусад нь үргэлжилнэ. main.ts, worker.ts хоёулаа дуудна.
 */
export function installProcessHandlers(): void {
  if (handlersInstalled) return;
  handlersInstalled = true;
  process.on('unhandledRejection', (err) => {
    console.error('🔴 UNHANDLED REJECTION:', err);
  });
  process.on('uncaughtException', (err) => {
    console.error('🔴 UNCAUGHT EXCEPTION:', err);
  });
}
