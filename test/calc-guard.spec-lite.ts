// ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/calc-guard.spec-lite.ts
// CalcProcessor: render-д явуулахаас өмнөх шалгалт (exam/result) ба эцсийн алдааны тэмдэглэл (DB-гүй).
import { UnrecoverableError } from 'bullmq';
import { CalcProcessor } from '../src/calc.processor';
import { callKey, encodeValue, newSnapshot, peekSnapshot, PERMANENT_ERROR_MARK } from '../src/report-data/snapshot';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const snap = (calls: Record<string, [string, unknown[], unknown]>) => {
  const s = newSnapshot('C1');
  for (const [, [name, args, v]] of Object.entries(calls)) s.calls[callKey(name, args)] = encodeValue(v);
  return s;
};
const guard = (s: any) => {
  try {
    (CalcProcessor.prototype as any).assertRenderable.call({}, 'C1', s);
    return null;
  } catch (e) {
    return e as Error;
  }
};

(async () => {
  const exam = { id: 1, assessment: { id: 7, formule: null } };
  const s0 = snap({ a: ['exam.findByCode', ['C1'], exam] });
  ok('peekSnapshot утга', (peekSnapshot(s0, 'exam.findByCode', ['C1']) as any)?.assessment?.id === 7);
  ok('peekSnapshot байхгүй → undefined', peekSnapshot(s0, 'result.findOne', ['C1']) === undefined);

  const e1 = guard(snap({ a: ['exam.findByCode', ['C1'], null] }));
  ok('exam байхгүй → UnrecoverableError + [permanent]', e1 instanceof UnrecoverableError && e1.message.includes(PERMANENT_ERROR_MARK), e1?.message);

  const e2 = guard(snap({
    a: ['exam.findByCode', ['C1'], exam],
    b: ['result.findOne', ['C1'], null],
    c: ['template.findActiveByAssessment', [7], { id: 3, pages: [{ id: 'p1' }] }],
  }));
  ok('template-тэй, result-гүй → энгийн (retry) алдаа', !!e2 && !(e2 instanceof UnrecoverableError), e2?.message);

  const e3 = guard(snap({
    a: ['exam.findByCode', ['C1'], { id: 1, assessment: { id: 7, formule: 12 } }],
    b: ['result.findOne', ['C1'], null],
  }));
  ok('томьёотой, result-гүй → retry алдаа', !!e3 && !(e3 instanceof UnrecoverableError));

  ok('template/томьёогүй, result-гүй → хуучнаараа render руу', guard(snap({
    a: ['exam.findByCode', ['C1'], exam],
    b: ['result.findOne', ['C1'], null],
    c: ['template.findActiveByAssessment', [7], null],
  })) === null);

  ok('result байгаа → OK', guard(snap({
    a: ['exam.findByCode', ['C1'], exam],
    b: ['result.findOne', ['C1'], { code: 'C1' }],
  })) === null);

  // onFailed: UnrecoverableError бол 1-р оролдлогод ч FAILED; энгийн алдаа бол сүүлийн оролдлогод л.
  const patches: any[] = [];
  const self: any = { patch: async (id: string, p: any) => patches.push({ id, ...p }) };
  const onFailed = (CalcProcessor.prototype as any).onFailed;
  await onFailed.call(self, { attemptsMade: 1, opts: { attempts: 3 }, data: { logId: 'v2-C1' } }, new Error('x'));
  ok('энгийн алдаа, 1/3 → FAILED бичихгүй', patches.length === 0);
  await onFailed.call(self, { attemptsMade: 1, opts: { attempts: 3 }, data: { logId: 'v2-C1' } }, new UnrecoverableError(`${PERMANENT_ERROR_MARK} exam олдсонгүй (C1)`));
  ok('Unrecoverable, 1/3 → FAILED + тэмдэг', patches.length === 1 && patches[0].status === 'FAILED' && patches[0].error.includes(PERMANENT_ERROR_MARK), JSON.stringify(patches[0]));
  await onFailed.call(self, { attemptsMade: 3, opts: { attempts: 3 }, data: { logId: 'v2-C1' } }, new Error('db down'));
  ok('энгийн алдаа, 3/3 → FAILED', patches.length === 2 && patches[1].error === 'calc: db down');

  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
})();
