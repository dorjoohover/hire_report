// ts-node --transpile-only -r tsconfig-paths/register test/object-storage.spec-lite.ts
// object-storage.ts: env бүлэг (S3_* / CF_* / AWS_*) сонголт, bucket-ийг endpoint path-аас, нууц хэвлэхгүй.
import { objectStorageConfig, describeObjectStorage, isObjectStorageConfigured } from '../src/object-storage';

let failed = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};
const ACCT = 'a'.repeat(32);
const KEY = 'b'.repeat(32);
const SECRET = 'c'.repeat(64);

// 1) CF_* (хэрэглэгчийн .env хэлбэр), bucket байхгүй
let c = objectStorageConfig({ CF_ENDPOINT: `https://${ACCT}.r2.cloudflarestorage.com`, CF_ACCESS_KEY_ID: KEY, CF_SECRET_ACCESS_KEY: SECRET, CF_TOKEN_VALUE: 'x', AWS_BUCKET_NAME: 'hire.mn', AWS_ACCESS_KEY: 'AKIA' } as any);
ok('CF_* сонгогдоно', c.source === 'CF_*' && c.provider === 'r2' && c.region === 'auto');
ok('AWS bucket/түлхүүр R2-д холилдохгүй', c.bucket === undefined && c.accessKeyId === KEY);
ok('bucket-гүй үед configured=false', isObjectStorageConfigured(c) === false);
// 2) CF_ENDPOINT path-д bucket
c = objectStorageConfig({ CF_ENDPOINT: `https://${ACCT}.r2.cloudflarestorage.com/hire-files/`, CF_ACCESS_KEY_ID: KEY, CF_SECRET_ACCESS_KEY: SECRET } as any);
ok('endpoint path → bucket', c.bucket === 'hire-files' && c.endpoint === `https://${ACCT}.r2.cloudflarestorage.com`, `${c.bucket} ${c.endpoint}`);
ok('configured=true', isObjectStorageConfigured(c));
// 3) CF_BUCKET давуу
c = objectStorageConfig({ CF_ENDPOINT: `https://${ACCT}.r2.cloudflarestorage.com/x`, CF_BUCKET: 'hire-files', CF_ACCESS_KEY_ID: KEY, CF_SECRET_ACCESS_KEY: SECRET } as any);
ok('CF_BUCKET > path', c.bucket === 'hire-files');
// 4) S3_* бүлэг давуу, R2_ACCOUNT_ID
c = objectStorageConfig({ R2_ACCOUNT_ID: ACCT, S3_BUCKET: 'b1', S3_ACCESS_KEY_ID: KEY, S3_SECRET_ACCESS_KEY: SECRET, CF_ENDPOINT: 'https://zzz.r2.cloudflarestorage.com', CF_ACCESS_KEY_ID: 'other' } as any);
ok('S3_* > CF_*', c.source === 'S3_*' && c.bucket === 'b1' && c.accessKeyId === KEY && c.endpoint === `https://${ACCT}.r2.cloudflarestorage.com`);
// 5) зөвхөн AWS_* (одоогийн prod/dev) — өөрчлөлтгүй
c = objectStorageConfig({ AWS_ACCESS_KEY: 'AKIA1', AWS_SECRET_KEY: 'sec', AWS_REGION: 'ap-northeast-2', AWS_BUCKET_NAME: 'hire.mn' } as any);
ok('AWS_* хуучнаараа', c.source === 'AWS_*' && c.provider === 's3' && !c.endpoint && c.region === 'ap-northeast-2' && c.bucket === 'hire.mn' && c.accessKeyId === 'AKIA1');
// 6) хашилттай утга
c = objectStorageConfig({ CF_ENDPOINT: `"https://${ACCT}.r2.cloudflarestorage.com"`, CF_ACCESS_KEY_ID: `'${KEY}'`, CF_SECRET_ACCESS_KEY: SECRET, CF_BUCKET: 'hire-files' } as any);
ok('хашилт арилна', c.accessKeyId === KEY && c.endpoint === `https://${ACCT}.r2.cloudflarestorage.com`);
// 7) describe нууц/account хэвлэхгүй
const d = describeObjectStorage(c);
ok('describe-д нууц/account алга', !d.includes(KEY) && !d.includes(SECRET) && !d.includes(ACCT), d);

console.log(failed === 0 ? '\n✅ БҮГД АМЖИЛТТАЙ' : `\n❌ ${failed} алдаа`);
process.exit(failed ? 1 : 0);
