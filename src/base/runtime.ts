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
export type ReportRole = 'all' | 'api' | 'worker' | 'render' | 'calc';

/*
 * v1.3.0 role-ууд:
 *   all     (default) — бүгд нэг процесст (local dev). calc + render + HTTP.
 *   api     — зөвхөн HTTP (report VPS): POST /render (v2), POST / (legacy), /file, /job ...
 *   worker  — 'report' queue (legacy calc+render ба v2 render), DB-тэй.
 *   render  — 'report' queue, v2 snapshot-оос зурна. DATABASE_URL заавал биш (DB-гүй горим),
 *             төлөвийг core-оор (PATCH /report/internal/status) дамжуулна.
 *   calc    — 'report-calc' queue (core VPS, core-ийн Redis + DB): тооцоолол → snapshot →
 *             report API руу render хүсэлт. Мөн POST /internal/report-data (snapshot miss).
 */
const rawRole = (process.env.REPORT_ROLE || 'all').trim().toLowerCase();
export const REPORT_ROLE: ReportRole = (['api', 'worker', 'render', 'calc'] as const).includes(
  rawRole as any,
)
  ? (rawRole as ReportRole)
  : 'all';

/** 'report' queue (render) боловсруулах эсэх. */
export const RUNS_RENDER = REPORT_ROLE === 'all' || REPORT_ROLE === 'worker' || REPORT_ROLE === 'render';
/** Хуучин нэр (v1.2.x) — RUNS_RENDER-тэй ижил. */
export const RUNS_WORKER = RUNS_RENDER;
/** 'report-calc' queue боловсруулах эсэх. */
export const RUNS_CALC = REPORT_ROLE === 'all' || REPORT_ROLE === 'calc';

/** render role + DATABASE_URL байхгүй → DB-гүй горим (metadata л, query хийхгүй). */
export const DB_DISABLED = REPORT_ROLE === 'render' && !process.env.DATABASE_URL;

/** Нэг worker процесс зэрэг хэдэн тайлан зурах. CPU-bound тул 1 зөв. */
export const REPORT_CONCURRENCY = Math.max(
  1,
  Number(process.env.REPORT_CONCURRENCY ?? 1) || 1,
);

/** calc зэрэгцээ (I/O голдуу — DB нэг host дээр). */
export const CALC_CONCURRENCY = Math.max(1, Number(process.env.CALC_CONCURRENCY ?? 2) || 2);

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
