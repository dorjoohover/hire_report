/*
 * Тайлан бэлдэх замыг ЛОКАЛ DB дээр хэмжинэ (2026-10-02). DB-д юу ч БИЧИХГҮЙ:
 *   - calc  : formuleDao.calculateFixer (тооцооллын DB aggregate-ууд, read-only)
 *   - render: AppService.getDoc (= createPdfInOneFile, бэлэн result-аар PDF зурна)
 *   - end   : doc.end() (font subset, зураг, zlib — PDF-ийг эцэслэх)
 * Үе шат бүрд: хугацаа, DB query-ийн тоо ба нийт хугацаа, event loop-ийн хамгийн
 * урт түгжрэл (API ба worker нэг процесст байх эрсдэлийг харуулна), PDF хэмжээ.
 *
 * Prod-д DB өөр VPS дээр байгаа тул: prod_db_ms ≈ queries × (perf-diag.sh-ийн
 * "report → DB round-trip" p50). Тиймээс query-ийн ТОО энд хамгийн чухал тоо.
 *
 * Ажиллуулах (Mac, hire_report/ дотроос; sanitize хийгдсэн hp_prod дээр):
 *   REPORT_ROLE=api DATABASE_URL="postgresql://$USER@localhost:5432/hp_prod" REDIS_HOST=localhost \
 *   TS_NODE_TRANSPILE_ONLY=1 node --cpu-prof --cpu-prof-dir=../logs/prof \
 *     -r ts-node/register -r tsconfig-paths/register scripts/profile-report.ts <examCode> [<examCode> ...]
 * Дараа нь: node scripts/analyze-cpuprofile.js ../logs/prof/<файл>.cpuprofile
 * Орчин: RUNS (default 2 — эхнийх JIT/кэш халаалт), PROF_OUT (default ../logs/prof).
 */
import { performance, monitorEventLoopDelay } from 'perf_hooks';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// REPORT_ROLE=api → BullMQ worker autorun:false: локал queue-ээс job авахгүй.
process.env.REPORT_ROLE = process.env.REPORT_ROLE || 'api';

// TypeORM-ийн бүх query pg.Client.prototype.query-ээр явдаг — тоолж, хугацааг нэмнэ.
const q = { n: 0, ms: 0 };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pg = require('pg');
const origQuery = pg.Client.prototype.query;
pg.Client.prototype.query = function (...args: any[]) {
  const t = performance.now();
  const r = origQuery.apply(this, args);
  if (r && typeof r.then === 'function') {
    q.n++;
    return r.finally(() => {
      q.ms += performance.now() - t;
    });
  }
  return r;
};

async function phase<T>(fn: () => Promise<T>) {
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();
  const n0 = q.n;
  const ms0 = q.ms;
  const t0 = performance.now();
  const value = await fn();
  const ms = performance.now() - t0;
  h.disable();
  return {
    value,
    ms: Math.round(ms),
    queries: q.n - n0,
    dbMs: Math.round(q.ms - ms0),
    maxBlockMs: Math.round(h.max / 1e6),
  };
}

async function main() {
  const codes = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (!codes.length) {
    console.error('usage: profile-report.ts <examCode> [<examCode> ...]');
    process.exit(2);
  }
  const runs = Math.max(1, Number(process.env.RUNS ?? 2) || 2);
  const outDir = process.env.PROF_OUT || join(process.cwd(), '..', 'logs', 'prof');
  mkdirSync(outDir, { recursive: true });

  // Import-ууд env тавьсны ДАРАА (decorator-ууд REPORT_ROLE-ийг уншдаг).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { NestFactory } = require('@nestjs/core');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppModule } = require('../src/app.module');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppService } = require('../src/app.service');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const service: any = app.get(AppService);
  const rows: any[] = [];
  // Тайлангийн код олон console.log хийдэг — хэмжилтийн гаралтыг бохирдуулахгүйн тулд дарна.
  const realLog = console.log;
  const out = (...a: any[]) => realLog(...a);

  for (const code of codes) {
    for (let run = 1; run <= runs; run++) {
      const row: any = { code, run };
      try {
        console.log = () => undefined;
        const exam = await service.dao.findByCode(code);
        if (!exam) throw new Error('exam олдсонгүй');
        row.report = exam.assessment?.report;
        row.assessment = exam.assessment?.name;

        if (exam.assessment?.formule) {
          const c = await phase(() =>
            service.formuleDao.calculateFixer({ assessment: exam.assessment, exam: exam.id }),
          );
          row.calc = { ms: c.ms, queries: c.queries, dbMs: c.dbMs, maxBlockMs: c.maxBlockMs };
        }

        const r = await phase(() => service.getDoc(code, undefined));
        row.render = { ms: r.ms, queries: r.queries, dbMs: r.dbMs, maxBlockMs: r.maxBlockMs };

        const doc: any = r.value;
        const chunks: Buffer[] = [];
        doc.on('data', (b: Buffer) => chunks.push(b));
        const e = await phase(
          () =>
            new Promise<void>((resolve) => {
              doc.on('end', () => resolve());
              doc.end();
            }),
        );
        const pdf = Buffer.concat(chunks);
        row.end = { ms: e.ms, maxBlockMs: e.maxBlockMs };
        row.pdfKB = Math.round(pdf.length / 1024);
        row.pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        row.images = doc._imageCount ?? null;
        row.rssMB = Math.round(process.memoryUsage().rss / 1048576);
        if (run === runs) writeFileSync(join(outDir, `report-${code}.pdf`), pdf);
      } catch (err: any) {
        row.error = String(err?.message || err).slice(0, 300);
      } finally {
        console.log = realLog;
      }
      out(JSON.stringify(row));
      rows.push(row);
    }
  }

  const file = join(outDir, `profile-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(rows, null, 2));
  out(`\n→ ${file}`);
  out('Хүснэгт (сүүлийн run):');
  for (const r of rows.filter((x) => x.run === runs)) {
    out(
      [
        r.code,
        `report=${r.report}`,
        r.calc ? `calc ${r.calc.ms}ms/${r.calc.queries}q` : 'calc -',
        r.render ? `render ${r.render.ms}ms/${r.render.queries}q (db ${r.render.dbMs}ms, block ${r.render.maxBlockMs}ms)` : '',
        r.end ? `end ${r.end.ms}ms` : '',
        r.pdfKB ? `${r.pdfKB}KB ${r.pages}p` : '',
        r.error ? `ERROR ${r.error}` : '',
      ].join('  '),
    );
  }
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
