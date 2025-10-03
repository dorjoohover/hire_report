import { Injectable, StreamableFile, NotFoundException } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
  promises,
  createWriteStream,
} from 'fs';
import { join } from 'path';
import * as AWS from 'aws-sdk';
import * as mime from 'mime-types';
import { PassThrough } from 'stream';
import { Job } from 'bullmq';
import { AppProcessor } from './app.processer';
import { REPORT_STATUS, time } from './base/constants';
import * as os from 'os';
import { pipeline } from 'stream/promises';

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

  async uploadToAwsLaterad(key: string, contentType: string, filePath: string) {
    const fileStream = createReadStream(filePath);

    await this.s3
      .upload({
        Bucket: this.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
      })
      .promise();

    console.log(`Uploaded ${key} to AWS`);
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

    const writeStream = createWriteStream(filePath, {
      highWaterMark: 64 * 1024, // 64KB chunk
    });

    await pipeline(resStream, writeStream);

    return filePath;
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
