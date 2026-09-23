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
@Injectable()
export class FileService {
  private readonly s3: AWS.S3;
  private readonly bucketName = process.env.AWS_BUCKET_NAME;
  private readonly localPath = './uploads';

  constructor() {
    // ⚠️ FIX: accessKeyId/secretAccessKey undefined үед AWS SDK v2 чимээгүйгээр
    // EC2 instance-metadata (169.254.169.254) руу fallback хийдэг — VPS дээр
    // (EC2 биш) энэ хаяг байхгүй тул EHOSTUNREACH шидээд, upload бүрт л
    // (олон минут хүлээгээд) гарч ирдэг, эхлэх үед огт мэдэгддэггүй байсан.
    // Одоо process эхлэх дор дороо тодорхой сануулга өгнө.
    if (!process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY) {
      console.error(
        '⚠️ AWS_ACCESS_KEY/AWS_SECRET_KEY тохируулагдаагүй байна — S3 upload бүр EHOSTUNREACH (EC2 metadata fallback) алдаагаар унана. .env-ээ шалгаарай.',
      );
    }
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      httpOptions: {
        timeout: 600000,
        connectTimeout: 15000,
      },
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
      // Хэрэв локалд байхгүй бол S3-аас татаж локалд хадгалах
      // const buffer = await this.downloadFromS3(filename);
      // if (!buffer) throw new Error('File not found in S3');
      // writeFileSync(filePath, buffer);
      throw new NotFoundException('File not found locally or in S3');  
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
