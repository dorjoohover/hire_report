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
        } catch {
          // олдсонгүй → доорх 404
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
