import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { registerAsset, resolveAssetFile } from './asset-file';

@Injectable()
export class AssetsService {
  private readonly cache = new Map<string, Buffer>();

  /**
   * Зураг авах (src/assets_optimized → src/assets, asset-file.ts). Буфер процесс дотор кэшлэгдэнэ —
   * ижил Buffer объект буцдаг тул PDF доторх ба document хоорондын (png-embed-cache) кэш ажиллана.
   * @param p relative path жишээ: 'icons/disc_2_blue'
   * @param l file extension: 'png', 'jpg', 'jpeg', 'webp'
   */
  getAsset(p: string, l = 'png'): Buffer {
    const key = `${p}.${l}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    try {
      const filePath = resolveAssetFile(key);
      if (!filePath) throw new Error(`Asset file not found: ${key}`);
      const buffer = registerAsset(fs.readFileSync(filePath), key);
      this.cache.set(key, buffer);
      return buffer;
    } catch (error) {
      console.log(error);
    }
  }
}
