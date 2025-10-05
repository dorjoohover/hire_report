import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AssetsService {
  private readonly cache = new Map<string, Buffer>();
  private readonly optimizedPath = path.join(process.cwd(), 'src/assets_optimized');
  private readonly originalPath = path.join(process.cwd(), 'src/assets');

  /**
   * Зураг авах
   * @param p relative path жишээ: 'icons/disc_2_blue'
   * @param l file extension: 'png', 'jpg', 'jpeg', 'webp'
   */
  getAsset(p: string, l = 'png'): Buffer {
    const key = `${p}.${l}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Optimize folder байгаа бол тэрнээс уншина
    let filePath = path.join(this.optimizedPath, `${p}.${l}`);
    if (!fs.existsSync(filePath)) {
      // байхгүй бол оригинал assets-аас уншина
      filePath = path.join(this.originalPath, `${p}.${l}`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Asset file not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    this.cache.set(key, buffer);
    return buffer;
  }
}
