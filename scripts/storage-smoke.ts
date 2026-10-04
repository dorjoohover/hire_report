/*
 * Object storage (Cloudflare R2 / AWS S3) smoke тест — v1.3.0.
 * Bucket-д туршилтын 2 объект бичээд, уншиж (sha256 тулгаж), presigned URL-аар
 * татаж, жагсааж, эцэст нь УСТГАНА. Production өгөгдөлд хүрэхгүй (`smoke/` угтвар).
 *
 * Ажиллуулах (Mac, hire_report/ дотроос):
 *   cp ../ops/shared/r2.env.example .env.r2   # дотор нь утгуудаа бөглө (hire_report/.gitignore: .env* → git-д ОРОХГҮЙ)
 *   TS_NODE_TRANSPILE_ONLY=1 node -r ts-node/register scripts/storage-smoke.ts --env .env.r2
 * Нэмэлт: --pdf <локал PDF зам>  → `reports/` угтвартай бодит PDF-ийг хуулж presigned URL хэвлэнэ (устгахгүй).
 */
import * as dotenv from 'dotenv';
import { createHash, randomBytes } from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { basename } from 'path';
import { createReadStream, statSync } from 'fs';

const argv = process.argv.slice(2);
const opt = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
dotenv.config({ path: opt('--env') ?? '.env.r2' });

// env ачаалсны ДАРАА import (config нь process.env-ээс уншдаг)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const storage = require('../src/object-storage');

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 16);

function httpsGet(url: string): Promise<{ status: number; headers: any; body: Buffer }> {
  return new Promise((resolve, reject) => {
    (url.startsWith('https:') ? https : http)
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  const cfg = storage.objectStorageConfig();
  console.log(`config: ${storage.describeObjectStorage(cfg)}`);
  if (!storage.isObjectStorageConfigured(cfg)) {
    console.error('❌ S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY (+ R2_ACCOUNT_ID эсвэл S3_ENDPOINT) дутуу.');
    process.exit(2);
  }
  const s3 = storage.createS3Client(cfg);
  const Bucket = cfg.bucket;
  const results: [string, boolean, string][] = [];
  const step = async (name: string, fn: () => Promise<string>) => {
    const t = Date.now();
    try {
      const info = await fn();
      results.push([name, true, `${Date.now() - t}ms ${info}`]);
      console.log(`✅ ${name} (${Date.now() - t}ms) ${info}`);
    } catch (e: any) {
      results.push([name, false, `${e?.code ?? ''} ${e?.message ?? e}`]);
      console.log(`❌ ${name}: ${e?.code ?? ''} ${e?.message ?? e}`);
    }
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const small = Buffer.from(`hire smoke ${stamp}\n`);
  const big = randomBytes(1024 * 1024);
  const kSmall = `smoke/${stamp}-small.txt`;
  const kBig = `smoke/${stamp}-1mb.bin`;

  await step('PUT small', async () => {
    await s3.putObject({ Bucket, Key: kSmall, Body: small, ContentType: 'text/plain' }).promise();
    return kSmall;
  });
  await step('PUT 1MB (managed upload)', async () => {
    await s3.upload({ Bucket, Key: kBig, Body: big, ContentType: 'application/octet-stream' }).promise();
    return kBig;
  });
  await step('HEAD', async () => {
    const a = await s3.headObject({ Bucket, Key: kSmall }).promise();
    const b = await s3.headObject({ Bucket, Key: kBig }).promise();
    return `small=${a.ContentLength}B big=${b.ContentLength}B type=${a.ContentType}`;
  });
  await step('GET + sha256', async () => {
    const b = (await s3.getObject({ Bucket, Key: kBig }).promise()).Body as Buffer;
    if (sha(b) !== sha(big)) throw new Error(`hash зөрлөө ${sha(b)} != ${sha(big)}`);
    return `sha=${sha(b)}`;
  });
  await step('presigned GET', async () => {
    const url = await s3.getSignedUrlPromise('getObject', { Bucket, Key: kBig, Expires: 120 });
    const r = await httpsGet(url);
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    if (sha(r.body) !== sha(big)) throw new Error('presigned body hash зөрлөө');
    return `HTTP 200 ${r.body.length}B`;
  });
  await step('presigned GET + Content-Disposition override', async () => {
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket,
      Key: kSmall,
      Expires: 120,
      ResponseContentDisposition: 'inline; filename="report-test.pdf"',
      ResponseContentType: 'application/pdf',
    });
    const r = await httpsGet(url);
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    return `disposition="${r.headers['content-disposition'] ?? '-'}" type=${r.headers['content-type'] ?? '-'}`;
  });
  await step('LIST smoke/', async () => {
    const l = await s3.listObjectsV2({ Bucket, Prefix: `smoke/${stamp}` }).promise();
    return `${l.KeyCount ?? l.Contents?.length ?? 0} объект`;
  });
  await step('DELETE', async () => {
    await s3.deleteObject({ Bucket, Key: kSmall }).promise();
    await s3.deleteObject({ Bucket, Key: kBig }).promise();
    try {
      await s3.headObject({ Bucket, Key: kBig }).promise();
      throw new Error('устгасны дараа HEAD олдсон');
    } catch (e: any) {
      if (e?.statusCode !== 404 && e?.code !== 'NotFound') throw e;
    }
    return 'устгагдсан (HEAD 404)';
  });

  const pdf = opt('--pdf');
  if (pdf) {
    await step('PDF upload (reports/)', async () => {
      const Key = `${(process.env.REPORT_PDF_PREFIX ?? 'reports/').replace(/^\/+/, '')}${basename(pdf)}`;
      const t = Date.now();
      await s3
        .upload({ Bucket, Key, Body: createReadStream(pdf), ContentType: 'application/pdf' }, { partSize: 8 * 1024 * 1024, queueSize: 2 })
        .promise();
      const url = await s3.getSignedUrlPromise('getObject', { Bucket, Key, Expires: 600 });
      return `${Key} ${statSync(pdf).size}B ${Date.now() - t}ms\n   10 мин хүчинтэй холбоос: ${url}`;
    });
  }

  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${failed === 0 ? '✅ БҮГД АМЖИЛТТАЙ' : `❌ ${failed} алхам амжилтгүй`} (${results.length} алхам)`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
