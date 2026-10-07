// ts-node --transpile-only -r ./test/stub-native.js -r tsconfig-paths/register test/file-missing.spec-lite.ts
// GET /file/:file — "файл үнэхээр байхгүй" 404 нь `X-Report-File: missing` толгойтой (core
// үүгээр Traefik-ийн 404-өөс ялгана); object storage-ийн түр алдаа 404 БИШ (500 → core 503);
// урсгал дундуур тасрахад хариу гацахгүй.
import { PassThrough, Readable } from 'stream';
import { NotFoundException } from '@nestjs/common';
import { FileService } from '../src/file.service';
import { AppController } from '../src/app.controller';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};

const fakeRes = () => {
  const r: any = new PassThrough();
  r.headers = {} as Record<string, string>;
  r.statusCode = 200;
  r.headersSent = false;
  r.setHeader = (k: string, v: string) => (r.headers[k.toLowerCase()] = v);
  r.removeHeader = (k: string) => delete r.headers[k.toLowerCase()];
  r.status = (c: number) => ((r.statusCode = c), r);
  const end = r.end.bind(r);
  r.end = (...a: any[]) => ((r.ended = true), end(...a));
  return r;
};
const withS3 = (svc: any, headObject: () => Promise<any>) => {
  svc.remoteEnabled = () => true;
  svc.s3 = {
    headObject: () => ({ promise: headObject }),
    getObject: () => ({ createReadStream: () => Readable.from(['%PDF']) }),
  };
  return svc;
};
const err = (props: any) => Object.assign(new Error(props.code || 'x'), props);

async function main() {
  // 1) FileService.getFile
  const s1 = new FileService() as any;
  s1.remoteEnabled = () => false;
  let e1: any = null;
  try { await s1.getFile('report-nope.pdf', fakeRes()); } catch (e) { e1 = e; }
  ok('локалд байхгүй, remote унтраалттай → NotFound', e1 instanceof NotFoundException);

  for (const [label, e] of [
    ['R2 404 NotFound', err({ statusCode: 404, code: 'NotFound' })],
    ['S3 403 (ListBucket эрхгүй)', err({ statusCode: 403, code: 'Forbidden' })],
  ] as const) {
    const s = withS3(new FileService(), () => Promise.reject(e));
    let got: any = null;
    try { await s.getFile('report-nope.pdf', fakeRes()); } catch (x) { got = x; }
    ok(`${label} → NotFound (missing)`, got instanceof NotFoundException);
  }

  for (const [label, e] of [
    ['R2 timeout', err({ code: 'TimeoutError' })],
    ['R2 503 SlowDown', err({ statusCode: 503, code: 'SlowDown' })],
    ['сүлжээ ECONNRESET', err({ code: 'ECONNRESET' })],
  ] as const) {
    const s = withS3(new FileService(), () => Promise.reject(e));
    let got: any = null;
    try { await s.getFile('report-nope.pdf', fakeRes()); } catch (x) { got = x; }
    ok(`${label} → NotFound БИШ (500 → core 503)`, !!got && !(got instanceof NotFoundException), got?.code);
  }

  const sOk = withS3(new FileService(), () => Promise.resolve({ ContentLength: 4 }));
  const rOk = fakeRes();
  const st = await sOk.getFile('report-x.pdf', rOk);
  ok('remote олдвол урсгал буцаана', !!st && rOk.headers['content-type'] === 'application/pdf');

  // 2) AppController.getFile
  const mk = (getFile: any) => new AppController(null as any, { getFile } as any, null as any);
  let res = fakeRes();
  await mk(async () => { throw new NotFoundException('x'); }).getFile('report-a.pdf', res);
  ok('NotFound → 404 + X-Report-File: missing', res.statusCode === 404 && res.headers['x-report-file'] === 'missing' && res.ended);

  res = fakeRes();
  await mk(async () => { throw err({ code: 'TimeoutError' }); }).getFile('report-a.pdf', res);
  ok('түр алдаа → 500, missing толгойгүй', res.statusCode === 500 && !res.headers['x-report-file']);

  res = fakeRes();
  const broken = new Readable({ read() { this.destroy(new Error('socket hang up')); } });
  await mk(async (_f: string, r: any) => { r.setHeader('Content-Length', '99'); r.status(200); return broken; }).getFile('report-a.pdf', res);
  await new Promise((r) => setTimeout(r, 50));
  ok('урсгал тасарвал (header явахаас өмнө) → 500, гацахгүй', res.statusCode === 500 && res.ended && !res.headers['content-length']);

  console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
