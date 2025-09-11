import { Injectable, StreamableFile, NotFoundException } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import * as AWS from 'aws-sdk';
import * as mime from 'mime-types';
import { PassThrough } from 'stream';
import { Job } from 'bullmq';
import { AppProcessor } from './app.processer';
import { REPORT_STATUS } from './base/constants';

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
      await this.s3
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
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
  async processMultipleImages(
    files: Express.Multer.File[],
    pt?: PassThrough,
    key?: string,
    ct?: string,
  ): Promise<string[]> {
    try {
      // Upload эхлэх үед → 80%

      let results: string[] = [];

      // 1. Хэрэв файл байхгүй бол stream-ийг upload хийнэ
      if (files.length === 0 && pt && key && ct) {
        const buffer = await this.streamToBuffer(pt);
        const res = await this.upload(key, ct, buffer);
        results = [res];
      } else {
        // 2. Файлуудыг зэрэг upload хийнэ
        const uploads = files.map((file) => {
          const fileKey = `${Date.now()}_${file.originalname}`;
          return this.upload(fileKey, file.mimetype, file.buffer);
        });

        // 3. Promise.all ашиглаад бүгдийг дуусахаар хүлээнэ
        results = await Promise.all(uploads);
      }

      return results;
    } catch (error) {
      console.error(error);
      throw error;
    }
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
  async getFile(filename: string): Promise<StreamableFile> {
    try {
      const filePath = join(this.localPath, filename);
      console.log(filename);
      if (!existsSync(filePath)) {
        const file = await this.downloadFromS3(filename);
        console.log('file', file);
        if (!file) {
          throw new NotFoundException('File not found in S3');
        }

        writeFileSync(filePath, file);
      }

      const stream = createReadStream(filePath);
      const mimeType = mime.lookup(filename) || 'application/octet-stream';

      return new StreamableFile(stream, {
        type: mimeType,
        disposition: `inline; filename="${filename}"`,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async downloadFromS3(key: string): Promise<Buffer | null> {
    try {
      // Upload дээрээ "report/<filename>" болгож хадгалсан бол энд тааруулна
      const finalKey = `report/${key}`;

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
