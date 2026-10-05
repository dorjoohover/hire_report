import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
  promises,
} from 'fs';
import { join, basename } from 'path';
import * as AWS from 'aws-sdk';
import * as mime from 'mime-types';
import { PassThrough } from 'stream';
import * as os from 'os';
import { writeFile } from 'fs/promises';
import { Response } from 'express';
import {
  createS3Client,
  describeObjectStorage,
  isObjectStorageConfigured,
  objectStorageConfig,
} from './object-storage';
/** Ops цэвэрлэгээ (`POST /internal/files/delete`) — exam code (core OPS_CODE_RE-тэй ижил). */
export const DELETE_CODE_RE = /^\d{6,20}$/;
/** Нэг хүсэлтэд устгах дээд тоо (R2 DeleteObjects нь 1000 хүртэл). */
export const DELETE_MAX_CODES = 500;

export type FileDeleteResult = {
  code: string;
  /** Локал `uploads/report-<code>.pdf` (+ `.tmp`/`.bak` үлдэгдэл). */
  local: 'deleted' | 'absent' | 'error';
  /** Хамт устгасан үлдэгдэл файлын тоо (`report-<code>.pdf.*`). */
  leftovers: number;
  /** R2/S3 `reports/report-<code>.pdf` — DeleteObjects идемпотент тул байхгүй ч "deleted". */
  remote: 'deleted' | 'skipped' | 'error';
  error?: string;
};

@Injectable()
export class FileService {
  private readonly s3: AWS.S3;
  // v1.3.0: AWS S3 эсвэл Cloudflare R2 (S3_ENDPOINT / R2_ACCOUNT_ID) — src/object-storage.ts
  private readonly storage = objectStorageConfig();
  private readonly bucketName = this.storage.bucket;
  private readonly localPath = './uploads';
  /** R2/S3 дахь тайлангийн PDF-ийн угтвар (bucket дотор). */
  private readonly reportPrefix = (process.env.REPORT_PDF_PREFIX ?? 'reports/').replace(/^\/+/, '');

  constructor() {
    this.s3 = createS3Client(this.storage);
    if (this.remoteEnabled()) {
      console.log(`🗄️ report PDF remote storage ON: ${describeObjectStorage(this.storage)}`);
    } else if (process.env.REPORT_PDF_REMOTE === '1') {
      console.warn(
        `⚠️ REPORT_PDF_REMOTE=1 боловч storage дутуу/SAFE_MODE — remote унтраалттай: ${describeObjectStorage(this.storage)}`,
      );
    }
  }

  /**
   * PDF-ийг R2/S3-д давхар бичих эсэх. Зөвхөн REPORT_PDF_REMOTE=1 + bucket/түлхүүр бүрэн +
   * SAFE_MODE биш үед. Default УНТРААЛТТАЙ — локал uploads/ үндсэн хэвээр.
   */
  remoteEnabled(): boolean {
    return (
      process.env.REPORT_PDF_REMOTE === '1' &&
      isObjectStorageConfigured(this.storage) &&
      !/^(1|true|yes|on)$/i.test(process.env.SAFE_MODE ?? '')
    );
  }

  private reportKey(filename: string): string {
    return `${this.reportPrefix}${basename(filename)}`;
  }

  /** Локал PDF-ийг R2/S3 руу хуулна (`reports/report-<code>.pdf`). */
  async uploadReportPdf(filePath: string): Promise<{ key: string; bytes: number }> {
    const key = this.reportKey(filePath);
    const bytes = statSync(filePath).size;
    await this.s3
      .upload(
        {
          Bucket: this.bucketName,
          Key: key,
          Body: createReadStream(filePath),
          ContentType: 'application/pdf',
        },
        { partSize: 8 * 1024 * 1024, queueSize: 2 },
      )
      .promise();
    return { key, bytes };
  }

  /**
   * Хугацаатай (presigned) татах холбоос — Node-оор дамжуулалгүй хэрэглэгч шууд
   * R2-оос татна. R2: дээд тал 7 хоног; зөвхөн S3 API домэйн дээр ажиллана.
   */
  async signedReportUrl(filename: string, expiresSec = 300): Promise<string | null> {
    if (!this.remoteEnabled()) return null;
    const key = this.reportKey(filename);
    try {
      await this.s3.headObject({ Bucket: this.bucketName, Key: key }).promise();
    } catch {
      return null;
    }
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: Math.min(Math.max(expiresSec, 30), 7 * 24 * 3600),
    });
  }

  async uploadToAwsLaterad(key: string, contentType: string, filePath: string) {
    const fileStream = createReadStream(filePath, {
      highWaterMark: 50 * 1024 * 1024,
    });
    await this.s3
      .upload(
        {
          Bucket: this.bucketName,
          Key: key,
          Body: fileStream,
          ContentType: contentType,
        },
        {
          partSize: 5 * 1024 * 1024,
          queueSize: 4,
        },
      )
      .promise();

    console.log(`Uploaded ${key} to AWS`);
    // await this.s3.deleteObject({ Bucket: this.bucketName, Key: key }).promise();
    // console.log(`Deleted ${key}`);
  }
  // async uploadToAwsLater(key: string, ct: string, buffer: Buffer) {
  //   setImmediate(async () => {
  //     try {
  //       await this.upload(key, ct, buffer); // AWS upload
  //       console.log('Uploaded to AWS:', key, time());
  //     } catch (err) {
  //       console.error('AWS upload failed:', key, err);
  //     }
  //   });
  // }
  async uploadLocal(code: string, resStream: PassThrough): Promise<string> {
    const filename = `report-${code}.pdf`;
    const filePath = join(this.localPath, filename);

    const chunks: Buffer[] = [];

    for await (const chunk of resStream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    await writeFile(filePath, buffer);

    return filePath;
  }

  async saveLocalTempFile(file: Express.Multer.File): Promise<string> {
    const tempPath = join(os.tmpdir(), `${Date.now()}_${file.originalname}`);
    await promises.writeFile(tempPath, file.buffer);
    return tempPath;
  }

  // ⚠ S3 fallback-ийг устгасан: generateAndUpload() дотор S3 upload
  // алхам аль хэдийн идэвхгүй болгогдсон тул (app.service.ts) энд S3-аас
  // татах гэж оролдох нь ХЭЗЭЭ Ч амжилтгүй болохоор заяасан байсан бөгөөд
  // AWS credential тохируулагдаагүй үед AWS SDK v2 EC2 metadata руу удаан
  // (10+ секунд) fallback хийж, core-ийн 30с timeout-оос давдаг байв.
  // Одоо локал файл байхгүй бол шууд хурдан 404 буцаана.
  async getFileBuf(filename: string): Promise<{ path: string; size: number }> {
    mkdirSync(this.localPath, { recursive: true });
    const filePath = join(this.localPath, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    const size = statSync(filePath).size;
    return { path: filePath, size };
  }

  /**
   * Ops "PDF гараар солих" (`PUT /internal/files/:name`, InternalKeyGuard) —
   * core-оос ирсэн түүхий PDF байтуудыг локал `uploads/`-д бичнэ (өмнө нь энэ
   * route/method огт байгаагүй тул core үргэлж 404 авдаг байсан — cannot PUT).
   * `filename`-ийг basename болгож, зөвхөн `report-<...>.pdf` хэлбэрийг
   * зөвшөөрнө (path traversal хамгаалалт — core талд `code`-оос угсарсан ч
   * дотоод түлхүүртэй endpoint учир нэмэлт хамгаалалт).
   */
  async saveFile(
    filename: string,
    buffer: Buffer,
  ): Promise<{ path: string; size: number; replaced: boolean }> {
    const base = basename(filename);
    if (!/^report-[A-Za-z0-9_-]+\.pdf$/.test(base)) {
      throw new BadRequestException('Буруу файлын нэр');
    }
    mkdirSync(this.localPath, { recursive: true });
    const filePath = join(this.localPath, base);
    const replaced = existsSync(filePath);
    await writeFile(filePath, buffer);
    return { path: filePath, size: buffer.length, replaced };
  }

  /**
   * Object storage-ээс устгах боломжтой эсэх. Upload-оос (REPORT_PDF_REMOTE=1) ялгаатай нь
   * зөвхөн тохиргоо бүрэн + SAFE_MODE биш байхыг шаардана — remote-ийг түр унтраасан ч
   * өмнө нь хуулсан объектууд R2-д үлдсэн байж болно.
   */
  remoteDeletable(): boolean {
    return (
      isObjectStorageConfigured(this.storage) &&
      !/^(1|true|yes|on)$/i.test(process.env.SAFE_MODE ?? '')
    );
  }

  /**
   * Ops цэвэрлэгээ (core `/ops/cleanup/apply` → `POST /internal/files/delete`):
   * тайлангийн PDF-ийг локал `uploads/`-оос ба R2/S3-аас устгана. Зөвхөн
   * `report-<code>.pdf` (+ ижил угтвартай `.tmp`/`.bak` үлдэгдэл) ба
   * `<REPORT_PDF_PREFIX>report-<code>.pdf` түлхүүр — өөр файлд хүрэхгүй.
   * Code бүрийн үр дүнг буцаана; core зөвхөн алдаагүй code-ийн DB мөрийг устгана.
   */
  async deleteReportFiles(codes: string[]): Promise<{
    remote: { enabled: boolean; bucket?: string; prefix: string };
    results: FileDeleteResult[];
  }> {
    const list = [...new Set((codes ?? []).map((c) => String(c ?? '').trim()))];
    if (!list.length) throw new BadRequestException('codes хоосон байна');
    if (list.length > DELETE_MAX_CODES) {
      throw new BadRequestException(`Нэг удаад ${DELETE_MAX_CODES}-аас ихгүй code`);
    }
    const bad = list.filter((c) => !DELETE_CODE_RE.test(c));
    if (bad.length) {
      throw new BadRequestException(`Буруу code: ${bad.slice(0, 5).join(', ')}`);
    }

    // Локал: нэг readdir → code бүрийн үлдэгдэл (.tmp/.bak).
    let names: string[] = [];
    try {
      names = await promises.readdir(this.localPath);
    } catch (e: any) {
      if (e?.code !== 'ENOENT') throw e;
    }
    const byCode = new Map<string, string[]>();
    for (const n of names) {
      const m = /^report-(\d{6,20})\.pdf(\..+)?$/.exec(n);
      if (!m) continue;
      if (!byCode.has(m[1])) byCode.set(m[1], []);
      byCode.get(m[1])!.push(n);
    }

    const results = new Map<string, FileDeleteResult>();
    for (const code of list) {
      const files = byCode.get(code) ?? [];
      const main = `report-${code}.pdf`;
      const r: FileDeleteResult = {
        code,
        local: files.includes(main) ? 'deleted' : 'absent',
        leftovers: 0,
        remote: 'skipped',
      };
      for (const f of files) {
        try {
          await promises.unlink(join(this.localPath, f));
          if (f !== main) r.leftovers++;
        } catch (e: any) {
          if (e?.code === 'ENOENT') continue;
          r.local = 'error';
          r.error = `local ${f}: ${e?.code ?? e?.message}`;
        }
      }
      results.set(code, r);
    }

    // Remote: DeleteObjects (≤1000 түлхүүр) — байхгүй түлхүүр ч "Deleted" гэж буцна.
    const remoteOn = this.remoteDeletable();
    if (remoteOn) {
      const keyOf = (code: string) => this.reportKey(`report-${code}.pdf`);
      try {
        const out = await this.s3
          .deleteObjects({
            Bucket: this.bucketName,
            Delete: { Objects: list.map((c) => ({ Key: keyOf(c) })), Quiet: false },
          })
          .promise();
        const failed = new Map<string, string>();
        for (const e of out.Errors ?? []) failed.set(e.Key!, `${e.Code}: ${e.Message}`);
        for (const code of list) {
          const r = results.get(code)!;
          const err = failed.get(keyOf(code));
          if (err) {
            r.remote = 'error';
            r.error = [r.error, `remote ${err}`].filter(Boolean).join('; ');
          } else {
            r.remote = 'deleted';
          }
        }
      } catch (e: any) {
        for (const code of list) {
          const r = results.get(code)!;
          r.remote = 'error';
          r.error = [r.error, `remote ${e?.code ?? ''} ${e?.message ?? e}`.trim()]
            .filter(Boolean)
            .join('; ');
        }
      }
    }

    const all = list.map((c) => results.get(c)!);
    console.log(
      `🗑️ report files delete: ${all.length} code, local deleted=${all.filter((r) => r.local === 'deleted').length}` +
        ` remote=${remoteOn ? all.filter((r) => r.remote === 'deleted').length : 'off'}` +
        ` errors=${all.filter((r) => r.local === 'error' || r.remote === 'error').length}`,
    );
    return {
      remote: { enabled: remoteOn, bucket: remoteOn ? this.bucketName : undefined, prefix: this.reportPrefix },
      results: all,
    };
  }

  async getFile(filename: string, res: Response) {
    console.log(filename);
    const filePath = join(this.localPath, filename);
    if (!existsSync(filePath)) {
      // v1.3.0: локалд байхгүй бол (жиш: өөр host дээрх worker зурсан) R2/S3-аас урсгана.
      if (this.remoteEnabled() && /^report-[A-Za-z0-9_-]+\.pdf$/.test(basename(filename))) {
        const key = this.reportKey(filename);
        try {
          const head = await this.s3.headObject({ Bucket: this.bucketName, Key: key }).promise();
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${basename(filename)}"`);
          if (head.ContentLength != null) res.setHeader('Content-Length', String(head.ContentLength));
          res.status(HttpStatus.OK);
          return this.s3.getObject({ Bucket: this.bucketName, Key: key }).createReadStream();
        } catch (e: any) {
          // Зөвхөн "объект байхгүй" (404; эрхгүй S3 нь байхгүй түлхүүрт 403 өгдөг) бол
          // доорх 404 (`X-Report-File: missing` — core "файл байхгүй" гэж үзнэ). R2-ийн
          // timeout / 5xx / сүлжээний алдаа "байхгүй" биш — дээш шидэж controller 500 →
          // core 503 (web 5с-ийн дараа дахин оролдоно).
          const sc = Number(e?.statusCode);
          if (!(sc === 404 || sc === 403 || e?.code === 'NotFound' || e?.code === 'NoSuchKey')) {
            console.error('object storage headObject алдаа:', key, e?.code, e?.message);
            throw e;
          }
        }
      }
      throw new NotFoundException('File not found locally or in object storage');
    }
    const type = mime.lookup(filename) || 'application/pdf';

    res.setHeader('Content-Type', type);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.status(HttpStatus.OK);

    const stream = createReadStream(filePath);

    return stream;
  }
  // downloadFromS3 устгагдсан — upload идэвхгүй тул ямар ч файл S3-д
  // байхгүй, иймд энэ функц хэзээ ч амжилттай байж чадахгүй байсан
  // (зөвхөн удаан хугацаагаар гацаад унадаг байсан).
}
