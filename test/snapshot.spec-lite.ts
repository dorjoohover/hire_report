// ts-node --transpile-only -r tsconfig-paths/register test/snapshot.spec-lite.ts
// src/report-data/snapshot.ts — record/replay, түлхүүр, огноо, miss, тусгаарлалт (DB-гүй).
import {
  callKey,
  decodeValue,
  encodeValue,
  newSnapshot,
  recordSnapshot,
  replaySnapshot,
  snapshottable,
} from '../src/report-data/snapshot';
import { NAMED_SQL } from '../src/report-data/named-sql';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};

(async () => {
  let dbCalls = 0;
  const fakeDb = {
    findOne: snapshottable('result.findOne', async (code: string) => {
      dbCalls++;
      return { code, point: 7, createdAt: new Date('2026-10-01T02:03:04.000Z'), details: [{ v: 1 }] };
    }),
    partial: snapshottable('ua.partialCalculator', async (code: string, type: number, cat?: number) => {
      dbCalls++;
      return [{ code, type, cat: cat ?? null }];
    }),
    query: snapshottable('ua.query', async (_sql: string, params: any[]) => {
      dbCalls++;
      return [{ p: params[0] }];
    }),
    nothing: snapshottable('exam.findByCode', async (_code: string) => {
      dbCalls++;
      return undefined;
    }),
  };

  // 1) context-гүй — шууд DB
  await fakeDb.findOne('A');
  ok('context-гүй үед шууд дууддаг', dbCalls === 1);

  // 2) түлхүүр
  ok('f(a,b) == f(a,b,undefined)', callKey('ua.partialCalculator', ['A', 10]) === callKey('ua.partialCalculator', ['A', 10, undefined]));
  ok('f(a,b) != f(a,b,3)', callKey('ua.partialCalculator', ['A', 10]) !== callKey('ua.partialCalculator', ['A', 10, 3]));
  ok('NAMED SQL нэрээр', callKey('ua.query', [NAMED_SQL.DISC_ANSWER_POINTS, ['A']]).startsWith('ua.query:DISC_ANSWER_POINTS'));
  ok('whitespace ялгаагүй', callKey('ua.query', ['  ' + NAMED_SQL.DISC_ANSWER_POINTS.replace(/ /g, '  ') + ' ', ['A']]) === callKey('ua.query', [NAMED_SQL.DISC_ANSWER_POINTS, ['A']]));
  ok('нэргүй SQL → raw:', callKey('ua.query', ['select 1', []]).startsWith('ua.query:raw:'));
  ok('объектын түлхүүрийн дараалал ялгаагүй', callKey('x', [{ a: 1, b: 2 }]) === callKey('x', [{ b: 2, a: 1 }]));

  // 3) encode/decode
  const d = decodeValue(encodeValue({ at: new Date('2026-01-02T03:04:05.678Z'), s: 'text 2026-01-02' })) as any;
  ok('ISO огноо → Date', d.at instanceof Date && d.at.toISOString() === '2026-01-02T03:04:05.678Z');
  ok('энгийн текст хэвээр', d.s === 'text 2026-01-02');
  ok('undefined хадгалагдана', decodeValue(encodeValue(undefined)) === undefined);

  // 4) record
  const snap = newSnapshot('A');
  dbCalls = 0;
  await recordSnapshot(snap, async () => {
    await fakeDb.findOne('A');
    await fakeDb.partial('A', 10);
    await fakeDb.query(NAMED_SQL.DISC_ANSWER_POINTS, ['A']);
    await fakeDb.nothing('A');
  });
  ok('record: 4 дуудлага DB-д', dbCalls === 4, `${dbCalls}`);
  ok('record: 4 түлхүүр', Object.keys(snap.calls).length === 4);

  // 5) replay — DB-д хүрэхгүй, шинэ объект, огноо Date
  const wire = JSON.parse(JSON.stringify(snap)); // сүлжээгээр дамжсан мэт
  dbCalls = 0;
  const { value, hits, misses } = await replaySnapshot(wire, async () => {
    const a: any = await fakeDb.findOne('A');
    a.details.push({ v: 2 }); // renderer мутаци
    const b: any = await fakeDb.findOne('A');
    const p: any = await fakeDb.partial('A', 10, undefined);
    const q: any = await fakeDb.query(NAMED_SQL.DISC_ANSWER_POINTS, ['A']);
    const n = await fakeDb.nothing('A');
    return { a, b, p, q, n };
  });
  ok('replay: DB дуудлага 0', dbCalls === 0, `${dbCalls}`);
  ok('replay: hit 5, miss 0', hits === 5 && misses.length === 0, `${hits}/${misses.length}`);
  ok('replay: мутаци дараагийн дуудлагад нөлөөлөхгүй', value.b.details.length === 1);
  ok('replay: огноо Date', value.a.createdAt instanceof Date);
  ok('replay: undefined утга', value.n === undefined);

  // 6) miss → resolveMiss
  const asked: string[] = [];
  const r2 = await replaySnapshot(wire, async () => fakeDb.partial('A', 10, 5), async (name, args) => {
    asked.push(`${name}${JSON.stringify(args)}`);
    return [{ remote: true, at: '2026-03-04T05:06:07.000Z' }];
  });
  ok('miss → resolveMiss нэр/аргумент', asked.length === 1 && asked[0] === 'ua.partialCalculator["A",10,5]', asked[0]);
  ok('miss: remote утгын огноо Date болно', (r2.value as any)[0].at instanceof Date);
  ok('miss тоологдоно', r2.misses.length === 1);

  // 7) miss, resolver-гүй → DB fallback
  dbCalls = 0;
  await replaySnapshot(wire, async () => fakeDb.partial('A', 20));
  ok('resolver-гүй miss → DB fallback', dbCalls === 1);

  // 8) зэрэг 2 replay — context холилдохгүй
  const s1 = newSnapshot('X');
  const s2 = newSnapshot('Y');
  s1.calls[callKey('result.findOne', ['Z'])] = encodeValue({ who: 'X' });
  s2.calls[callKey('result.findOne', ['Z'])] = encodeValue({ who: 'Y' });
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const [x, y] = await Promise.all([
    replaySnapshot(s1, async () => { await delay(20); return fakeDb.findOne('Z'); }),
    replaySnapshot(s2, async () => { await delay(5); return fakeDb.findOne('Z'); }),
  ]);
  ok('зэрэг replay тусгаарлагдсан', (x.value as any).who === 'X' && (y.value as any).who === 'Y');

  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
})();
