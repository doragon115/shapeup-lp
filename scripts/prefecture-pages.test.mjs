import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, loadJson } from './lib.mjs';
import { loadPrefectures } from './prefecture-data.mjs';
import { buildSite } from './build-site.mjs';

const dataPath = resolve(ROOT, 'data/prefectures.json');
const validatorPath = resolve(ROOT, 'scripts/prefecture-data.mjs');

test('47都道府県の地域データが用意されている', async () => {
  assert.ok(existsSync(dataPath), 'data/prefectures.json が必要です');
  const rows = JSON.parse(await readFile(dataPath, 'utf8'));
  assert.equal(rows.length, 47);
  assert.equal(new Set(rows.map((row) => row.slug)).size, 47);
});

test('地域データは必須項目・3件の根拠・確認日を検証できる', async () => {
  assert.ok(existsSync(validatorPath), 'scripts/prefecture-data.mjs が必要です');
  const { loadPrefectures, validatePrefectures } = await import('./prefecture-data.mjs');
  const rows = await loadPrefectures();
  assert.deepEqual(validatePrefectures(rows), []);

  const broken = structuredClone(rows);
  broken[0].localFacts[0].sourceUrl = '';
  assert.ok(validatePrefectures(broken).some((message) => message.includes('出典不足')));
});

test('地域一覧と47都道府県ページを生成する', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  const result = await buildSite({ posts: [], config, prefectures: rows });
  assert.ok(result.written.includes(`${config.site.baseUrl}/area/`));
  assert.equal(result.written.filter((url) => url.includes('/area/')).length, 48);

  const hokkaido = await readFile(resolve(ROOT, 'public/area/hokkaido/index.html'), 'utf8');
  assert.match(hokkaido, /北海道にお住まいの50代女性/);
  assert.match(hokkaido, /更年期からの食べ方を見直すヒント/);
});

test('ブランドコピーと公式アカウントを一元管理する', async () => {
  const config = await loadJson('config.json');
  assert.equal(config.site.programHeadline, '運動に頼らず、21日間で「続けやすい食習慣」を見直す');
  assert.equal(config.site.proofLine, '4,500人以上が学んだ、50代女性のための食習慣の学校');
  assert.equal(config.instagram.profileUrl, 'https://www.instagram.com/universityshapeup/');
  assert.equal(config.threads.profileUrl, 'https://www.threads.com/@universityshapeup');
  assert.equal(config.cta.lineUrl, 'https://line.me/R/ti/p/@dpi4359e');
  assert.equal(config.cta.lineLabel, '公式LINEに登録して無料PDFを受け取る');
  assert.equal(config.cta.lineBenefit, '更年期からの食べ方を見直すヒント');
  assert.equal(config.publishing.ready, true);
});

test('説明会CTAはZoomではなく公式LINEで案内する', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });
  const home = await readFile(resolve(ROOT, 'public/index.html'), 'utf8');
  assert.match(home, new RegExp(`${config.cta.lineUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(home, /公式LINEで説明会の案内を受け取る/);
  assert.match(home, /開催日時や参加方法は、公式LINEでご案内します/);
  assert.doesNotMatch(home, /example\.com\/zoom-seminar/);
});

test('全都道府県ページに地域識別付きLINE CTAがある', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });
  for (const row of rows) {
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    assert.match(html, new RegExp(`data-prefecture="${row.slug}"`));
    assert.match(html, /data-channel="lp"/);
    assert.match(html, /data-cta="line-register"/);
  }
});

test('全都道府県ページに対応する16:9地域画像がある', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  for (const row of rows) {
    for (const width of [640, 1280]) {
      const imagePath = resolve(ROOT, `public/images/prefectures/${row.slug}_lp_16x9-${width}.webp`);
      assert.ok(existsSync(imagePath), `${row.name}の画像（幅${width}）が必要です`);
    }
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    assert.match(html, new RegExp(`/images/prefectures/${row.slug}_lp_16x9-640\\.webp 640w`));
    assert.match(html, new RegExp(`/images/prefectures/${row.slug}_lp_16x9-1280\\.webp 1280w`));
    assert.match(html, new RegExp(`alt="${row.name}の地域イラスト"`));
    assert.match(html, new RegExp(`class="prefecture-hero-label">${row.name}にお住まいの50代女性へ`));
  }
});

test('ヒーロー画像はファーストビューに置かれ、大きさが先に決まっている', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  const tokyo = await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8');
  const hero = tokyo.match(/<header class="hero program-hero">([\s\S]*?)<\/header>/)?.[1] || '';
  assert.match(hero, /class="prefecture-hero-image"/, 'ヒーロー画像はheader内にある');
  assert.match(hero, /width="1280" height="720"/, 'CLS防止のため幅と高さを明示する');
  assert.match(hero, /loading="eager"/);
  assert.match(hero, /fetchpriority="high"/);
  assert.match(tokyo, /<link rel="preload" as="image"[^>]*tokyo_lp_16x9-1280\.webp/);
  assert.match(tokyo, /<meta property="og:image" content="[^"]*tokyo_lp_16x9-1280\.webp">/);
});

test('都道府県ページにパンくずと同じ地方への内部リンクがある', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  const tokyo = await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8');
  assert.match(tokyo, /<nav class="breadcrumb wrap" aria-label="パンくずリスト">/);
  assert.match(tokyo, /"@type":"BreadcrumbList"/);
  assert.match(tokyo, /https:\/\/shapeup-university\.pages\.dev\/area\/tokyo\/"/);
  // 関東の他県へのリンク（東京都以外の6県）
  const kanto = rows.filter((row) => row.region === '関東' && row.slug !== 'tokyo');
  assert.ok(kanto.length > 0);
  for (const row of kanto) {
    assert.match(tokyo, new RegExp(`<li><a href="/area/${row.slug}/">${row.name}</a></li>`));
  }
});

test('sitemapの都道府県lastmodは確認日から決まる（ビルド時刻ではない）', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  const sitemap = await readFile(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
  const tokyoEntry = sitemap.match(/<loc>[^<]*\/area\/tokyo\/<\/loc><lastmod>([^<]+)<\/lastmod>/)?.[1];
  assert.equal(tokyoEntry, '2026-07-20T00:00:00.000Z');
});

test('公開許可済みなら47都道府県ページは検索対象になる', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  assert.equal(config.publishing.ready, true);
  await buildSite({ posts: [], config, prefectures: rows });
  const tokyo = await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8');
  const areaIndex = await readFile(resolve(ROOT, 'public/area/index.html'), 'utf8');
  assert.match(tokyo, /<meta name="robots" content="index,follow">/);
  assert.match(areaIndex, /<meta name="robots" content="index,follow">/);
  assert.doesNotMatch(tokyo, /プレビュー中です/);
  assert.doesNotMatch(areaIndex, /プレビュー中です/);
});

test('全都道府県ページでサービス内容と公式アカウントが最初に伝わる', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  for (const row of rows) {
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    const hero = html.match(/<header class="hero program-hero">([\s\S]*?)<\/header>/)?.[1] || '';
    assert.match(hero, /class="brand-name"[^>]*>シェイプアップ大学/);
    assert.match(hero, /21日間/);
    assert.match(hero, /続けやすい食習慣/);
    assert.match(hero, /<span class="no-break">21日間<\/span>/);
    assert.match(hero, /<mark class="no-break">「続けやすい食習慣」<\/mark>/);
    assert.match(hero, /4,500人以上/);
    assert.match(hero, /https:\/\/www\.instagram\.com\/universityshapeup\//);
    assert.match(hero, /https:\/\/www\.threads\.com\/@universityshapeup/);
    assert.match(hero, /https:\/\/line\.me\/R\/ti\/p\/@dpi4359e/);
  }

  const areaIndex = await readFile(resolve(ROOT, 'public/area/index.html'), 'utf8');
  assert.match(areaIndex, /class="brand-name"[^>]*>シェイプアップ大学/);
  assert.match(areaIndex, /21日間/);
  assert.match(areaIndex, /www\.instagram\.com\/universityshapeup/);
});

test('47ページは地域固有の文章・URL・出典を持つ', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  const result = await buildSite({ posts: [], config, prefectures: rows });
  const titles = new Set();
  const descriptions = new Set();
  const canonicals = new Set();

  for (const row of rows) {
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="(.*?)">/)?.[1];
    titles.add(title);
    descriptions.add(description);
    canonicals.add(canonical);
    assert.match(title, new RegExp(`${row.name}.*50代女性.*ダイエット`));
    assert.match(description, new RegExp(`${row.name}.*50代女性.*ダイエット`));
    assert.match(description, /運動に頼らず、21日間の食習慣見直しに取り組みます/);
    assert.match(html, new RegExp(row.localMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal((html.match(/確認日 2026-07-20/g) || []).length, 3);
  }

  assert.equal(titles.size, 47);
  assert.equal(descriptions.size, 47);
  assert.equal(canonicals.size, 47);
  assert.equal(result.sitemapUrls.filter((url) => url.includes('/area/')).length, 48);
});

test('都道府県ページは成果を保証するような健康表現を使わない', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  for (const row of rows) {
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    assert.doesNotMatch(html, /21日間で戻らない食習慣/);
    assert.doesNotMatch(html, /リバウンドしない/);
    assert.doesNotMatch(html, /「戻らない」食べ方/);
  }
});

test('全都道府県ページに実績の根拠を表示する', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  assert.equal(config.site.proofSection.heading, '実績について');
  assert.equal(config.site.proofSection.graduateCount, '累計4,500人以上の卒業生');
  assert.equal(config.site.proofSection.instructorBasis, '指導は、シェイプアップ大学を卒業した方々が担っています。');

  for (const row of rows) {
    const html = await readFile(resolve(ROOT, `public/area/${row.slug}/index.html`), 'utf8');
    assert.match(html, /<h2><span>実績について<\/span><\/h2>/);
    assert.match(html, /累計4,500人以上の卒業生/);
    assert.match(html, /指導は、シェイプアップ大学を卒業した方々が担っています。/);
  }
});

test('公開許可を明示した場合だけ検索登録できる設定になる', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  try {
    config.publishing.ready = false;
    await buildSite({ posts: [], config, prefectures: rows });
    const tokyo = await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8');
    assert.match(tokyo, /<meta name="robots" content="noindex,nofollow">/);
    assert.match(tokyo, /プレビュー中です/);
  } finally {
    config.publishing.ready = true;
    await buildSite({ posts: [], config, prefectures: rows });
  }
});

test('Google Search Consoleの所有権確認ファイルを公開する', async () => {
  const verification = await readFile(
    resolve(ROOT, 'public/google78dd5e33ad64202c.html'),
    'utf8',
  );
  assert.equal(
    verification,
    'google-site-verification: google78dd5e33ad64202c.html\n',
  );
});

/** ページのHTMLからWebMCPの部分を取り出し、対応ブラウザのふりをして動かす。 */
function runWebmcp(html) {
  const data = html.match(/<script type="application\/json" id="webmcp-data">([\s\S]*?)<\/script>/);
  const code = html.match(/<script>\((function\(\)\{[\s\S]*?)\)\(\);<\/script>\s*<\/body>/);
  assert.ok(data, 'webmcp-data が見つかりません');
  assert.ok(code, 'WebMCP のスクリプトが見つかりません');

  const registered = [];
  const doc = {
    getElementById: (id) => (id === 'webmcp-data' ? { textContent: data[1] } : null),
    modelContext: { registerTool: (tool) => registered.push(tool) },
  };
  new Function('document', 'navigator', `(${code[1]})();`)(doc, {});

  const call = async (name, args) => {
    const tool = registered.find((item) => item.name === name);
    assert.ok(tool, `${name} が登録されていません`);
    return JSON.parse((await tool.execute(args)).content[0].text);
  };
  return { names: registered.map((tool) => tool.name), call };
}

test('全ページにWebMCPを載せ、対応ブラウザだけで道具として使える', async () => {
  const rows = await loadPrefectures();
  const config = await loadJson('config.json');
  await buildSite({ posts: [], config, prefectures: rows });

  const pages = [
    'public/index.html',
    'public/404.html',
    'public/area/index.html',
    'public/tokusho/index.html',
    ...rows.map((row) => `public/area/${row.slug}/index.html`),
  ];
  for (const page of pages) {
    const html = await readFile(resolve(ROOT, page), 'utf8');
    assert.match(html, /id="webmcp-data"/, `${page} にWebMCPがありません`);
  }

  const tokyo = runWebmcp(await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8'));
  assert.deepEqual(tokyo.names, ['get_program_overview', 'find_prefecture_page', 'get_local_guidance']);

  const overview = await tokyo.call('get_program_overview', {});
  assert.equal(overview.lineUrl, config.cta.lineUrl);

  const osaka = await tokyo.call('find_prefecture_page', { name: '大阪' });
  assert.equal(osaka.matches[0].url, `${config.site.baseUrl}/area/osaka/`);
  assert.equal((await tokyo.call('find_prefecture_page', {})).count, 47);
  assert.equal((await tokyo.call('find_prefecture_page', { name: '架空県' })).matches.length, 0);

  const guidance = await tokyo.call('get_local_guidance', {});
  assert.equal(guidance.name, '東京都');
  assert.equal(guidance.facts.length, 3);

  // 都道府県ページ以外に地域アドバイスは載せない。
  const top = runWebmcp(await readFile(resolve(ROOT, 'public/index.html'), 'utf8'));
  assert.deepEqual(top.names, ['get_program_overview', 'find_prefecture_page']);
});

test('WebMCP非対応のブラウザでは何も起きない', async () => {
  const html = await readFile(resolve(ROOT, 'public/area/tokyo/index.html'), 'utf8');
  const code = html.match(/<script>\((function\(\)\{[\s\S]*?)\)\(\);<\/script>\s*<\/body>/);
  const doc = { getElementById: () => ({ textContent: '{}' }) };
  assert.doesNotThrow(() => new Function('document', 'navigator', `(${code[1]})();`)(doc, {}));
});
