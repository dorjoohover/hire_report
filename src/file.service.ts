import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync, promises } from 'fs';
import { join } from 'path';
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
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
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

  async getFile(filename: string, res: Response) {
    console.log(filename)
    const filePath = join(this.localPath, filename);
    if (!existsSync(filePath)) {
      // Хэрэв локалд байхгүй бол S3-аас татаж локалд хадгалах
      const buffer = await this.downloadFromS3(filename);
      if (!buffer) throw new Error('File not found in S3');
      writeFileSync(filePath, buffer);
    }
    const type = mime.lookup(filename) || 'application/pdf';

    res.setHeader('Content-Type', type);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.status(HttpStatus.OK);

    const stream = createReadStream(filePath);

    return stream;
  }
private async downloadFromS3(k: string): Promise<Buffer | null> {
  try {
    let key = k.replace('report-', '').replace('.pdf', '')
    const possibleKeys = [
      key.endsWith('.pdf') ? key : `${key}.pdf`,
      `report-${key}.pdf`,
      `report-${key}`,
    ];

    let foundKey: string | null = null;

    for (const k of possibleKeys) {
      console.log(k)
      try {
        await this.s3.headObject({
          Bucket: this.bucketName,
          Key: k, // ⬅️ яг S3 дээрх key
        }).promise();

        foundKey = k;
        break;
      } catch {}
    }

    if (!foundKey) {
      throw new Error(`S3 object not found for keys: ${possibleKeys.join(', ')}`);
    }

    const object = await this.s3.getObject({
      Bucket: this.bucketName,
      Key: foundKey,
    }).promise();

    return object.Body as Buffer;
  } catch (err: any) {
    console.error('❌ S3 download error:', err.message);
    return null;
  }
}
}
