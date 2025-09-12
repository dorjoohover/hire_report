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
import { REPORT_STATUS } from './base/constants';
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
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
  async uploadToAwsLater(key: string, ct: string, buffer: Buffer) {
    setImmediate(async () => {
      try {
        await this.upload(key, ct, buffer); // AWS upload
        console.log('Uploaded to AWS:', key);
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
    try {
      let results: string[] = [];

      if (files.length === 0 && pt && key && ct) {
        const buffer = await this.streamToBuffer(pt);

        // ⬇ эхлээд локалд хадгална
        const tempPath = join(os.tmpdir(), key);
        await promises.writeFile(tempPath, buffer);

        // шууд локал замыг буцааж, дараа нь async-аар AWS руу upload хийнэ
        this.uploadToAwsLater(key, ct, buffer);
        results = [tempPath];
      } else {
        const uploads = await Promise.all(
          files.map(async (file) => {
            const fileKey = `${Date.now()}_${file.originalname}`;
            const tempPath = await this.saveLocalTempFile(file);

            // upload дараа нь async-аар
            this.uploadToAwsLater(fileKey, file.mimetype, file.buffer);

            return tempPath; // шууд локал замыг буцаана
          }),
        );
        results = uploads;
      }

      return results;
    } catch (error) {
      console.error(error);
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
