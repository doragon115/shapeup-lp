// 依存ゼロのスモークテスト:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizePost, deriveSummary, deriveTitle, contentSignature, slugFor } from './lib.mjs';

test('normalizePost: title/summary手動値を優先する', () => {
  const p = normalizePost({ id: '1', caption: '本文 #tag', title: '見出し', summary: '要約です。', permalink: 'x', timestamp: '2026-07-01T00:00:00+0900', media_url: 'img' });
  assert.equal(p.title, '見出し');
  assert.equal(p.summary, '要約です。');
  assert.equal(p.image, 'img');
});

test('deriveSummary: ハッシュタグを除去して整える', () => {
  const s = deriveSummary('たんぱく質が主役です。野菜は1割。 #ダイエット #たんぱく質');
  assert.ok(!s.includes('#'));
  assert.ok(s.startsWith('たんぱく質が主役です。'));
});

test('deriveTitle: 末尾の句点を落とす', () => {
  assert.equal(deriveTitle('毎朝たまごを食べていますか？'), '毎朝たまごを食べていますか');
});

test('slugFor: URLに使えない文字を除去する', () => {
  assert.equal(slugFor({ id: '1800/00 1' }), '1800001');
});

test('contentSignature: 並び順が違っても内容が同じなら一致', () => {
  const a = [{ id: '1', timestamp: 't1', title: 'A', summary: 's', image: 'i', permalink: 'p' }, { id: '2', timestamp: 't2', title: 'B', summary: 's', image: 'i', permalink: 'p' }];
  const b = [a[1], a[0]];
  assert.equal(contentSignature(a), contentSignature(b));
});

test('contentSignature: 内容が変われば不一致', () => {
  const a = [{ id: '1', timestamp: 't1', title: 'A', summary: 's', image: 'i', permalink: 'p' }];
  const b = [{ id: '1', timestamp: 't1', title: 'A-changed', summary: 's', image: 'i', permalink: 'p' }];
  assert.notEqual(contentSignature(a), contentSignature(b));
});

test('公開用の投稿データは治療の変更や成果の保証につながる表現を使わない', async () => {
  for (const name of ['instagram.json', 'instagram-mock.json']) {
    const text = await readFile(resolve('data', name), 'utf8');
    assert.doesNotMatch(text, /リバウンドを防ぐ|リバウンド防止|欲求（フードノイズ）が自然に静まります|多くの場合、たんぱく質不足が背景にあります|完全栄養に近い|1日に食べてよい目安/);
  }
});
