import { AsyncLocalStorage } from 'async_hooks';
import { createHash } from 'crypto';
import { namedSqlOf } from './named-sql';

/*
 * Тайлангийн өгөгдлийн snapshot (v1.3.0).
 *
 * Санаа: render замд ашиглагддаг DAO функцуудыг (`snapshottable`-аар) ороосон.
 * Async context (AsyncLocalStorage) идэвхгүй үед ЯГ хуучнаараа DB-ээс уншина —
 * зан төлөв өөрчлөгдөхгүй. Context идэвхтэй үед:
 *   - record: DB-ээс уншаад үр дүнг snapshot.calls[түлхүүр]-т JSON-оор хадгална
 *             (calc service — core VPS дээр, DB-тэй нэг host).
 *   - replay: snapshot-оос буцаана; байхгүй (miss) бол resolveMiss (core-оор дамжин
 *             calc service-ээс ижил DAO функцийг ажиллуулна) эсвэл DB fallback.
 * Түлхүүр = функцийн нэр + аргумент (тогтвортой JSON). Ингэснээр render worker
 * (report VPS) DB-д хандахгүйгээр ЯГ ижил өгөгдлөөр зурна.
 */

export const SNAPSHOT_VERSION = 1;

export interface ReportSnapshot {
  v: number;
  code: string;
  createdAt: string;
  /** түлхүүр → JSON (encodeValue). */
  calls: Record<string, string>;
}

export type MissResolver = (name: string, args: unknown[]) => Promise<unknown>;

interface Ctx {
  mode: 'record' | 'replay';
  snapshot: ReportSnapshot;
  misses: string[];
  hits: number;
  resolveMiss?: MissResolver;
}

const store = new AsyncLocalStorage<Ctx>();

export function newSnapshot(code: string): ReportSnapshot {
  return { v: SNAPSHOT_VERSION, code, createdAt: new Date().toISOString(), calls: {} };
}

/** Төгсгөлийн undefined/null-уудыг хасаж, доторх undefined-г null болгоно — `f(a,b)` ба `f(a,b,undefined)` ижил түлхүүр. */
export function normalizeArgs(args: unknown[]): unknown[] {
  const out = args.map((a) => (a === undefined ? null : a));
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable((v as any)[k])}`).join(',')}}`;
}

/**
 * Дуудлагын түлхүүр. `ua.query` (raw SQL)-ийг SQL текстээр биш NAMED_SQL нэрээр;
 * нэргүй SQL бол `raw:<hash>` (remote-оор шийдэгдэхгүй — DB fallback л).
 */
export function callKey(name: string, args: unknown[]): string {
  const a = normalizeArgs(args);
  if (name === 'ua.query') {
    const sqlName = namedSqlOf(String(a[0] ?? ''));
    const tag = sqlName ?? `raw:${createHash('sha1').update(String(a[0] ?? '')).digest('hex').slice(0, 12)}`;
    return `ua.query:${tag}${stable(a.slice(1))}`;
  }
  return `${name}${stable(a)}`;
}

const UNDEF = '__undefined__';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;

export function encodeValue(v: unknown): string {
  return v === undefined ? UNDEF : JSON.stringify(v);
}

/** JSON → утга. ISO огноог Date болгоно (DB-ээс ирсэн entity-тэй адил). Дуудлага бүрд ШИНЭ объект. */
export function decodeValue(s: string): unknown {
  if (s === UNDEF) return undefined;
  return JSON.parse(s, (_k, val) =>
    typeof val === 'string' && ISO_DATE.test(val) ? new Date(val) : val,
  );
}

/** DAO функцийг snapshot-д хамааруулах. Context-гүй үед өөрчлөлтгүй. */
export function snapshottable<F extends (...args: any[]) => Promise<any>>(name: string, fn: F): F {
  const wrapped = async (...args: any[]) => {
    const ctx = store.getStore();
    if (!ctx) return fn(...args);
    const key = callKey(name, args);
    if (ctx.mode === 'record') {
      const value = await fn(...args);
      ctx.snapshot.calls[key] = encodeValue(value);
      return decodeValue(ctx.snapshot.calls[key]);
    }
    const hit = ctx.snapshot.calls[key];
    if (hit !== undefined) {
      ctx.hits++;
      return decodeValue(hit);
    }
    ctx.misses.push(key);
    console.warn(`⚠️ SNAPSHOT_MISS ${key.slice(0, 200)} (code ${ctx.snapshot.code})`);
    const value = ctx.resolveMiss ? await ctx.resolveMiss(name, normalizeArgs(args)) : await fn(...args);
    ctx.snapshot.calls[key] = encodeValue(value);
    return decodeValue(ctx.snapshot.calls[key]);
  };
  return wrapped as unknown as F;
}

/** Snapshot бүрдүүлэх (calc service): fn доторх snapshottable дуудлагууд бичигдэнэ. */
export async function recordSnapshot<T>(snapshot: ReportSnapshot, fn: () => Promise<T>): Promise<T> {
  return store.run({ mode: 'record', snapshot, misses: [], hits: 0 }, fn);
}

/** Snapshot-оос зурах (render worker). Буцаахдаа miss/hit статистик. */
export async function replaySnapshot<T>(
  snapshot: ReportSnapshot,
  fn: () => Promise<T>,
  resolveMiss?: MissResolver,
): Promise<{ value: T; misses: string[]; hits: number }> {
  const ctx: Ctx = { mode: 'replay', snapshot, misses: [], hits: 0, resolveMiss };
  const value = await store.run(ctx, fn);
  return { value, misses: ctx.misses, hits: ctx.hits };
}

/** Snapshot-д бичигдсэн дуудлагын утга (байхгүй бол undefined) — calc-ийн шалгалтад. */
export function peekSnapshot(snapshot: ReportSnapshot, name: string, args: unknown[]): unknown {
  const hit = snapshot.calls[callKey(name, args)];
  return hit === undefined ? undefined : decodeValue(hit);
}

/** Дахин оролдох (sweep) утгагүй алдааны тэмдэг — core-ийн sweep үүнийг алгасна. */
export const PERMANENT_ERROR_MARK = '[permanent]';

/** Одоо snapshot context дотор байгаа эсэх (жиш: progress-ийг DB-д бичих эсэхийг шийдэх). */
export function inSnapshotContext(): boolean {
  return !!store.getStore();
}

export function isReportSnapshot(v: any): v is ReportSnapshot {
  return !!v && typeof v === 'object' && typeof v.code === 'string' && v.calls && typeof v.calls === 'object';
}
