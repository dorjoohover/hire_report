import { Injectable, StreamableFile, NotFoundException } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
  promises,
} from 'fs';
import { join } from 'path';
import * as AWS from 'aws-sdk';
import * as mime from 'mime-types';
import { PassThrough } from 'stream';
import { Job } from 'bullmq';
import { AppProcessor } from './app.processer';
import { REPORT_STATUS, time } from './base/constants';
import * as os from 'os';

@Injectable()
export class FileService {
  private readonly s3: AWS.S3;
  private readonly bucketName = process.env.AWS_BUCKET_NAME;
  private readonly localPath = './uploads';

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async upload(key: string, ct: string, body) {
    try {
      this.s3
        .upload({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: ct,
        })
        .promise();

      // Optional: Save locally
      const localFilePath = join(this.localPath, key);
      writeFileSync(localFilePath, body);

      // Add public S3 URL
      const fileUrl = `${key}`;
      return fileUrl;
    } catch (error) {
      console.log(error);
    }
  }
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      );
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }
  async uploadToAwsLater(key: string, ct: string, buffer: Buffer) {
    setImmediate(async () => {
      try {
        await this.upload(key, ct, buffer); // AWS upload
        console.log('Uploaded to AWS:', key, time());
      } catch (err) {
        console.error('AWS upload failed:', key, err);
      }
    });
  }
  async processMultipleImages(
    files: Express.Multer.File[],
    pt?: PassThrough,
    key?: string,
    ct?: string,
  ): Promise<string[]> {
    const startTime = Date.now(); // 🟢 нийт хугацаа эхлэх
    try {
      let results: string[] = [];

      console.log(
        `⏳ START processMultipleImages: ${new Date().toISOString()}`,
      );

      // 1. Хэрэв файлууд байхгүй, stream-ээр ирсэн бол
      if (files.length === 0 && pt && key && ct) {
        const s1 = Date.now();
        const buffer = await this.streamToBuffer(pt);
        console.log(`✅ streamToBuffer done in ${Date.now() - s1} ms`);

        const tempPath = join(this.localPath, key);
        await promises.writeFile(tempPath, buffer);
        console.log(`✅ writeFile done in ${Date.now() - s1} ms (cumulative)`);

        // 1.2 AWS руу дараа нь async upload хийнэ
        this.uploadToAwsLater(key, ct, buffer);
        console.log('📤 async AWS upload scheduled');

        results = [tempPath];
      } else {
        // 2. Файлууд байгаа бол бүгдийг нь локалд түр хадгална
        const s2 = Date.now();
        const uploads = await Promise.all(
          files.map(async (file) => {
            const fStart = Date.now();
            const fileKey = `${Date.now()}_${file.originalname}`;
            const tempPath = join(os.tmpdir(), fileKey);

            // 2.1 Локалд хадгална
            await promises.writeFile(tempPath, file.buffer);
            console.log(
              `📝 Saved file ${file.originalname} in ${Date.now() - fStart} ms`,
            );

            // 2.2 AWS руу дараа нь async upload хийнэ
            this.uploadToAwsLater(fileKey, file.mimetype, file.buffer);

            return tempPath; // Локал замыг буцаана
          }),
        );

        console.log(`✅ All files processed in ${Date.now() - s2} ms`);
        results = uploads;
      }

      console.log(
        `🏁 FINISHED processMultipleImages in ${Date.now() - startTime} ms`,
      );
      return results;
    } catch (error) {
      console.error(
        `❌ processMultipleImages failed after ${Date.now() - startTime} ms`,
        error,
      );
      throw error;
    }
  }

  async saveLocalTempFile(file: Express.Multer.File): Promise<string> {
    const tempPath = join(os.tmpdir(), `${Date.now()}_${file.originalname}`);
    await promises.writeFile(tempPath, file.buffer);
    return tempPath;
  }

  async getFileBuf(filename: string): Promise<{ path: string; size: number }> {
    mkdirSync(this.localPath, { recursive: true });
    const filePath = join(this.localPath, filename);

    if (!existsSync(filePath)) {
      const buf = await this.downloadFromS3(filename);
      if (!buf) throw new NotFoundException('File not found in S3');
      writeFileSync(filePath, buf);
    }
    const size = statSync(filePath).size;
    return { path: filePath, size };
  }
  async getFile(filename: string): Promise<string> {
    const filePath = join(this.localPath, filename);

    if (!existsSync(filePath)) {
      // Хэрэв локалд байхгүй бол S3-аас татаж локалд хадгалах
      const buffer = await this.downloadFromS3(filename);
      if (!buffer) throw new Error('File not found in S3');
      writeFileSync(filePath, buffer);
    }

    return filePath;
  }
  private async downloadFromS3(key: string): Promise<Buffer | null> {
    try {
      // Upload дээрээ "report/<filename>" болгож хадгалсан бол энд тааруулна
      const finalKey = `${key}`;

      console.log('▶️ S3 Download Key:', finalKey);

      // Тухайн object байгаа эсэхийг шалгана
      await this.s3
        .headObject({
          Bucket: this.bucketName,
          Key: finalKey,
        })
        .promise();

      // Object татах
      const object = await this.s3
        .getObject({
          Bucket: this.bucketName,
          Key: finalKey,
        })
        .promise();

      console.log('✅ S3 Downloaded:', {
        key: finalKey,
        size: object.ContentLength,
        type: object.ContentType,
      });

      return object.Body as Buffer;
    } catch (err) {
      console.error('❌ S3 download error:', err.message);
      return null;
    }
  }
}
