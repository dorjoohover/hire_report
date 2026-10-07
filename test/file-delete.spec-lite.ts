// ts-node --transpile-only -r ./test/stub-native.js -r tsconfig-paths/register test/file-delete.spec-lite.ts
// Ops цэвэрлэгээ: POST /internal/files/delete → FileService.deleteReportFiles — локал uploads/
// (+ .tmp үлдэгдэл) ба R2/S3-аас ЗӨВХӨН заасан code-ийн PDF-ийг устгана, бусад файлд хүрэхгүй.
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import * as os from 'os';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { FileService } from '../src/file.service';
import { InternalKeyGuard } from '../src/guards/internal-key.guard';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const throwsBad = async (fn: () => Promise<any>) => {
  try { await fn(); return false; } catch (e) { return e instanceof BadRequestException; }
};

async function main() {
  const tmp = mkdtempSync(join(os.tmpdir(), 'hr-del-'));
  process.chdir(tmp);
  mkdirSync('uploads');
  for (const f of ['report-111111.pdf', 'report-111111.pdf.77.1700000000000.tmp', 'report-222222.pdf',
                   'report-333333.pdf', 'report-1111110.pdf', 'other.txt'])
    writeFileSync(join('uploads', f), 'x');

  // 1) remote унтраалттай
  const s1 = new FileService() as any;
  s1.remoteDeletable = () => false;
  const r1 = await s1.deleteReportFiles(['111111', '222222', '999999', '111111']);
  const by = (r: any, c: string) => r.results.find((x: any) => x.code === c);
  ok('давхардсан code нэг л удаа', r1.results.length === 3);
  ok('111111: локал устсан + .tmp үлдэгдэл 1', by(r1, '111111').local === 'deleted' && by(r1, '111111').leftovers === 1);
  ok('222222: устсан', by(r1, '222222').local === 'deleted');
  ok('999999: байхгүй → absent', by(r1, '999999').local === 'absent');
  ok('remote унтраалттай → skipped', r1.results.every((x: any) => x.remote === 'skipped') && r1.remote.enabled === false);
  const left = readdirSync('uploads').sort();
  ok('бусад файлд хүрээгүй (333333, 1111110, other.txt)', JSON.stringify(left) === JSON.stringify(['other.txt', 'report-1111110.pdf', 'report-333333.pdf']), left.join(','));

  // 2) remote: DeleteObjects — нэг түлхүүр алдаатай
  const s2 = new FileService() as any;
  s2.remoteDeletable = () => true;
  s2.bucketName = 'b';
  let sent: any = null;
  s2.s3 = { deleteObjects: (p: any) => ({ promise: async () => {
    sent = p;
    return { Deleted: [{ Key: 'reports/report-333333.pdf' }], Errors: [{ Key: 'reports/report-444444.pdf', Code: 'AccessDenied', Message: 'no' }] };
  } }) };
  const r2 = await s2.deleteReportFiles(['333333', '444444']);
  ok('DeleteObjects түлхүүр = reports/report-<code>.pdf', JSON.stringify(sent?.Delete?.Objects) === JSON.stringify([{ Key: 'reports/report-333333.pdf' }, { Key: 'reports/report-444444.pdf' }]));
  ok('333333: local deleted + remote deleted', by(r2, '333333').local === 'deleted' && by(r2, '333333').remote === 'deleted');
  ok('444444: remote error (core DB-г устгахгүй)', by(r2, '444444').remote === 'error' && /AccessDenied/.test(by(r2, '444444').error));

  // 3) remote бүхэлдээ унавал
  const s3 = new FileService() as any;
  s3.remoteDeletable = () => true;
  s3.s3 = { deleteObjects: () => ({ promise: async () => { throw Object.assign(new Error('timeout'), { code: 'TimeoutError' }); } }) };
  const r3 = await s3.deleteReportFiles(['555555']);
  ok('R2 timeout → remote error', by(r3, '555555').remote === 'error');

  // 4) оролтын хамгаалалт
  ok('буруу code (../) → 400', await throwsBad(() => s1.deleteReportFiles(['../etc/passwd'])));
  ok('үсэгтэй code → 400', await throwsBad(() => s1.deleteReportFiles(['12345a'])));
  ok('хоосон → 400', await throwsBad(() => s1.deleteReportFiles([])));
  ok('> 500 → 400', await throwsBad(() => s1.deleteReportFiles(Array.from({ length: 501 }, (_, i) => String(100000 + i)))));
  ok('uploads/ байхгүй ч алдаагүй (absent)', await (async () => {
    const t2 = mkdtempSync(join(os.tmpdir(), 'hr-del2-')); process.chdir(t2);
    const r = await s1.deleteReportFiles(['123456']); process.chdir(tmp);
    return r.results[0].local === 'absent';
  })());

  // 5) InternalKeyGuard (fail-closed)
  const g = new InternalKeyGuard();
  const ctx = (h: any) => ({ switchToHttp: () => ({ getRequest: () => ({ headers: h }) }) }) as any;
  const unauth = (fn: () => any) => { try { fn(); return false; } catch (e) { return e instanceof UnauthorizedException; } };
  delete process.env.INTERNAL_API_KEY;
  ok('INTERNAL_API_KEY тохируулаагүй → 401', unauth(() => g.canActivate(ctx({ 'x-internal-key': 'x' }))));
  process.env.INTERNAL_API_KEY = 'secret';
  ok('буруу түлхүүр → 401', unauth(() => g.canActivate(ctx({ 'x-internal-key': 'nope' }))));
  ok('зөв түлхүүр → OK', g.canActivate(ctx({ 'x-internal-key': 'secret' })) === true);

  ok('main файлууд хэвээр (sanity)', existsSync(join(tmp, 'uploads', 'other.txt')));
  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
