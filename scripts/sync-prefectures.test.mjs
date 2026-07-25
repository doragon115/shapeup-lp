import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rm, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT } from './lib.mjs';

function runSync() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['scripts/sync.mjs', '--mock', '--force'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(output));
      else resolvePromise(output);
    });
  });
}

test('通常の同期処理で47都道府県ページを生成する', async () => {
  const areaDir = resolve(ROOT, 'public/area');
  await rm(areaDir, { recursive: true, force: true });
  const output = await runSync();
  const entries = await readdir(areaDir, { withFileTypes: true });
  const prefectureDirs = entries.filter((entry) => entry.isDirectory());
  assert.equal(prefectureDirs.length, 47, output);
  assert.match(output, /generated 57 pages/);
});
