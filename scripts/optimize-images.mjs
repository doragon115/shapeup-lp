#!/usr/bin/env node
// 都道府県ヒーロー画像を WebP へ変換する。
//
//   node scripts/optimize-images.mjs            変換のみ（元PNGはそのまま）
//   node scripts/optimize-images.mjs --archive  変換後に元PNGを archive/ へ退避
//   node scripts/optimize-images.mjs --force    既存のWebPも作り直す
//
// 元のPNGは 2048x1152 で1枚あたり約2.8MB。ファーストビューに置くには重すぎるので
// 幅640と幅1280の2種類のWebPを作り、srcset で端末に選ばせる。
// 元PNGは削除せず archive/ へ移す。

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/images/prefectures');

export const IMAGE_WIDTHS = [640, 1280];
const QUALITY = 76;

const CWEBP_CANDIDATES = ['/opt/homebrew/bin/cwebp', '/usr/local/bin/cwebp', 'cwebp'];

async function findCwebp() {
  for (const candidate of CWEBP_CANDIDATES) {
    try {
      await execFileAsync(candidate, ['-version']);
      return candidate;
    } catch {
      // 次の候補へ
    }
  }
  throw new Error('cwebp が見つかりません。`brew install webp` を実行してください。');
}

/** `tokyo_lp_16x9.png` と幅から `tokyo_lp_16x9-1280.webp` を作る */
export function webpName(pngName, width) {
  return `${path.basename(pngName, '.png')}-${width}.webp`;
}

async function fileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

async function main() {
  const force = process.argv.includes('--force');
  const archive = process.argv.includes('--archive');

  const cwebp = await findCwebp();
  const entries = (await fs.readdir(SOURCE_DIR)).filter((name) => name.endsWith('.png')).sort();

  if (entries.length === 0) {
    console.log('変換対象のPNGがありません。');
    return;
  }

  let sourceBytes = 0;
  let outputBytes = 0;
  let converted = 0;
  let skipped = 0;

  for (const png of entries) {
    const pngPath = path.join(SOURCE_DIR, png);
    sourceBytes += await fileSize(pngPath);

    for (const width of IMAGE_WIDTHS) {
      const outPath = path.join(SOURCE_DIR, webpName(png, width));

      if (!force && (await fileSize(outPath)) > 0) {
        outputBytes += await fileSize(outPath);
        skipped += 1;
        continue;
      }

      await execFileAsync(cwebp, [
        '-quiet',
        '-q', String(QUALITY),
        '-resize', String(width), '0',
        '-m', '6',
        pngPath,
        '-o', outPath,
      ]);

      outputBytes += await fileSize(outPath);
      converted += 1;
    }
  }

  console.log(`PNG ${entries.length}枚 / 変換 ${converted}件 / 既存流用 ${skipped}件`);
  console.log(`元PNG合計 ${formatMB(sourceBytes)} → WebP合計 ${formatMB(outputBytes)}`);

  if (!archive) {
    console.log('元PNGはそのまま残しています。退避するなら --archive を付けてください。');
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const archiveDir = path.join(ROOT, 'archive', `prefecture-png-${stamp}`);
  await fs.mkdir(archiveDir, { recursive: true });

  for (const png of entries) {
    await fs.rename(path.join(SOURCE_DIR, png), path.join(archiveDir, png));
  }

  console.log(`元PNG ${entries.length}枚を ${path.relative(ROOT, archiveDir)} へ移しました。`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
