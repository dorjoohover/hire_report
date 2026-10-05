import * as fs from 'fs';
import * as path from 'path';

/*
 * Asset файлын байршил (2026-10-05): build үед үүсгэсэн src/assets_optimized (scripts/optimize-images.ts —
 * тайланд харагдах хэмжээнд тааруулж жижигрүүлсэн) байвал тэрнээс, үгүй бол src/assets-аас.
 * ASSETS_OPTIMIZED=0 → үргэлж анхныг (rebuild-гүйгээр буцаах).
 * Мөн Buffer → asset нэрийн бүртгэл: render үеийн LOW_PPI шалгалт (pdf.services.ts) аль asset болохыг мэднэ.
 */
const OPTIMIZED_DIR = path.join(process.cwd(), 'src/assets_optimized');
const ORIGINAL_DIR = path.join(process.cwd(), 'src/assets');

export function assetsOptimizedEnabled(): boolean {
  return process.env.ASSETS_OPTIMIZED !== '0';
}

/** 'icons/clock.png' гэх мэт key → файлын зам (байхгүй бол null). */
export function resolveAssetFile(key: string): string | null {
  if (key.includes('..')) return null;
  if (assetsOptimizedEnabled()) {
    const opt = path.join(OPTIMIZED_DIR, key);
    if (fs.existsSync(opt)) return opt;
  }
  const orig = path.join(ORIGINAL_DIR, key);
  return fs.existsSync(orig) ? orig : null;
}

const names = new WeakMap<Buffer, string>();

export function registerAsset(buf: Buffer, key: string): Buffer {
  names.set(buf, key);
  return buf;
}

export function assetNameOf(buf: unknown): string | undefined {
  return Buffer.isBuffer(buf) ? names.get(buf) : undefined;
}
