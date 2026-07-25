// 統括スクリプト: 取得 → 差分判定 → （変化時のみ）生成 → IndexNow通知。
// 使い方:
//   node scripts/sync.mjs           # トークンが無ければ自動でモック
//   node scripts/sync.mjs --mock    # 強制モック
//   node scripts/sync.mjs --force   # 差分が無くても再生成
//
// 「変化があった時だけ生成・コミット」= 無投稿日は何もしない（要件2・6・10）。
import { appendFile } from 'node:fs/promises';
import { loadJson, saveJson, contentSignature } from './lib.mjs';
import { fetchPosts } from './fetch-instagram.mjs';
import { buildSite } from './build-site.mjs';
import { submitIndexNow } from './indexnow.mjs';
import { loadPrefectures } from './prefecture-data.mjs';

const args = new Set(process.argv.slice(2));
const forceMock = args.has('--mock');
const force = args.has('--force');

function postSignature(p) {
  return JSON.stringify({ t: p.timestamp, ti: p.title, s: p.summary, im: p.image, pl: p.permalink });
}

async function setActionOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

async function main() {
  const config = await loadJson('config.json');
  const prefectures = await loadPrefectures();
  const useMock = forceMock || !process.env.IG_ACCESS_TOKEN;
  const siteSignature = JSON.stringify({ config, prefectures });

  const { source, posts } = await fetchPosts({ config, useMock });
  console.log(`[sync] source=${source} fetched=${posts.length} posts`);

  const prev = await loadJson('data/instagram.json', { posts: [] });
  const prevPosts = prev.posts || [];

  const changed = force || siteSignature !== prev.siteSignature || contentSignature(posts) !== contentSignature(prevPosts);
  if (!changed) {
    console.log('[sync] no changes detected — skip build/deploy.');
    await setActionOutput('changed', 'false');
    return;
  }

  // 変化したURLだけ IndexNow に通知するため、投稿単位の差分を取る。
  const prevMap = new Map(prevPosts.map((p) => [p.id, postSignature(p)]));
  const base = config.site.baseUrl.replace(/\/$/, '');
  const changedUrls = new Set();
  for (const p of posts) {
    if (prevMap.get(p.id) !== postSignature(p)) {
      changedUrls.add(`${base}/updates/${p.slug}/`);
    }
  }
  changedUrls.add(`${base}/`); // 最新情報欄が変わるのでトップも通知

  const { written } = await buildSite({ posts, config, prefectures });
  console.log(`[sync] generated ${written.length} pages`);

  // 正本を更新（次回の差分判定の基準になる）
  await saveJson('data/instagram.json', {
    updatedAt: new Date().toISOString(),
    source,
    siteSignature,
    posts,
  });

  const idx = await submitIndexNow({ config, urls: [...changedUrls] });
  console.log(`[sync] indexnow: ${idx.sent ? 'sent' : 'skipped(' + idx.reason + ')'} urls=${idx.urls.length}`);

  await setActionOutput('changed', 'true');
  console.log('[sync] done. Files under public/ updated.');
}

main().catch((err) => {
  console.error('[sync] FAILED:', err.message);
  process.exit(1);
});
