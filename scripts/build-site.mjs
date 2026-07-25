// 静的サイト生成。仮データ・実データどちらでも同じ経路。
//   public/index.html            … LP本体（「最新情報」欄に最新6件）
//   public/updates/<slug>/index.html … 投稿別ページ（検索可能な静的HTML）
//   public/sitemap.xml           … 更新されたページのlastmodのみ反映
//   public/feed.xml              … RSS 2.0
//   public/robots.txt            … クロール許可 + sitemap参照
import { writeText, escapeHtml, formatDateJa, toW3CDate } from './lib.mjs';

const BRAND = {
  blue: '#2BA6DF',
  yellow: '#FFD934',
  ink: '#173042',
};

function layout({ title, description, canonical, jsonLd = null, body, ogImage, robots = 'index,follow' }) {
  const ld = jsonLd ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${escapeHtml(robots)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="シェイプアップ大学 最新情報" href="/feed.xml">
<style>
:root{--blue:${BRAND.blue};--yellow:${BRAND.yellow};--ink:${BRAND.ink};}
*{box-sizing:border-box;}
body{margin:0;color:var(--ink);font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",system-ui,sans-serif;line-height:1.75;background:#fff;}
a{color:var(--blue);}
.wrap{max-width:960px;margin:0 auto;padding:0 20px;}
header.hero{background:linear-gradient(135deg,var(--blue),#4fc0f0);color:#fff;text-align:center;padding:64px 20px;}
header.hero h1{font-size:clamp(28px,5vw,44px);margin:0 0 12px;}
header.hero p{font-size:clamp(15px,2.4vw,20px);margin:0 auto;max-width:640px;}
.btn{display:inline-block;background:var(--yellow);color:var(--ink);font-weight:800;text-decoration:none;padding:14px 28px;border-radius:999px;box-shadow:0 6px 0 #e0b900;margin-top:24px;}
.btn:hover{transform:translateY(2px);box-shadow:0 4px 0 #e0b900;}
section{padding:48px 0;}
h2{font-size:clamp(22px,4vw,32px);text-align:center;position:relative;}
h2 span{background:var(--yellow);padding:2px 10px;border-radius:8px;}
.doctrine{background:#f4fbff;border-radius:16px;padding:24px;text-align:center;font-size:18px;}
.doctrine b{color:var(--blue);font-size:22px;}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:24px;}
.card{border:2px solid #eef3f6;border-radius:16px;overflow:hidden;background:#fff;display:flex;flex-direction:column;transition:.15s;}
.card:hover{border-color:var(--blue);transform:translateY(-3px);}
.card img{width:100%;aspect-ratio:1;object-fit:cover;background:#e9f4fb;}
.card .body{padding:14px 16px;display:flex;flex-direction:column;gap:8px;flex:1;}
.card time{font-size:12px;color:#7c8b96;}
.card h3{font-size:16px;margin:0;line-height:1.5;}
.card p{font-size:14px;margin:0;color:#42576a;flex:1;}
.card .more{font-weight:700;font-size:14px;}
.cta{background:var(--blue);color:#fff;text-align:center;border-radius:20px;padding:40px 20px;}
.cta h2{color:#fff;}
.cta h2 span{color:var(--ink);}
footer{text-align:center;padding:40px 20px;color:#7c8b96;font-size:13px;}
.post-body{font-size:17px;}
.post-meta{color:#7c8b96;font-size:14px;}
.backlinks{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;}
.eyebrow{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px;}
.program-hero{position:relative;overflow:hidden;padding:30px 20px 68px;background:linear-gradient(145deg,#087faf 0%,var(--blue) 58%,#62c7ed 100%);}
.program-hero::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0,transparent 39px,rgba(255,255,255,.08) 40px);pointer-events:none;}
.program-hero .wrap{position:relative;z-index:1;max-width:1040px;}
.program-hero .brand-name{display:inline-block;max-width:none;margin:0;padding:5px 14px 7px;border:2px solid rgba(255,255,255,.78);border-radius:8px;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:clamp(18px,2.4vw,24px);font-weight:900;letter-spacing:.08em;}
.program-hero .local-audience{max-width:none;margin:18px 0 0;font-size:clamp(14px,2vw,18px);font-weight:800;letter-spacing:.04em;}
.program-hero .program-headline{max-width:920px;margin:15px auto 14px;font-size:clamp(31px,5.4vw,56px);font-weight:900;line-height:1.28;letter-spacing:-.025em;text-wrap:balance;}
.program-headline mark{display:inline;padding:0 .16em .08em;background:linear-gradient(transparent 10%,var(--yellow) 10%,var(--yellow) 92%,transparent 92%);color:var(--ink);box-decoration-break:clone;-webkit-box-decoration-break:clone;}
.program-headline .no-break{white-space:nowrap;}
.program-hero .proof-line{max-width:720px;margin:0 auto;font-size:clamp(16px,2.2vw,20px);font-weight:700;}
.promise-list{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:22px 0 0;padding:0;list-style:none;}
.promise-list li{background:rgba(7,74,106,.28);border:1px solid rgba(255,255,255,.65);padding:7px 13px;border-radius:999px;font-size:14px;font-weight:800;}
.program-hero .hero-benefit{max-width:680px;margin:20px auto -10px;font-size:14px;}
.prefecture-hero-figure{position:relative;width:min(100%,920px);margin:28px auto 0;}
.prefecture-hero-label{position:absolute;z-index:1;top:clamp(12px,2.6vw,28px);left:clamp(12px,2.6vw,28px);display:block;width:max-content;max-width:44%;margin:0;padding:6px 10px;background:rgba(255,252,239,.95);border:2px solid rgba(23,48,66,.2);border-radius:16px;color:var(--ink);font-size:clamp(12px,1.8vw,18px);font-weight:900;line-height:1.35;overflow-wrap:anywhere;box-shadow:0 3px 10px rgba(23,48,66,.18);}
.prefecture-hero-image{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border:4px solid rgba(255,255,255,.78);border-radius:22px;box-shadow:0 14px 30px rgba(7,74,106,.22);}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
.official-links{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:20px;}
.official-link{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.78);border-radius:999px;padding:7px 14px;font-size:14px;font-weight:800;}
.official-link:hover,.official-link:focus-visible{background:#fff;color:#126f9d;outline:3px solid rgba(255,217,52,.55);outline-offset:2px;}
.footer-official{margin:12px 0 0;}
.footer-official .official-link{color:#526879;border-color:#9ab1bf;}
.footer-official .official-link:hover,.footer-official .official-link:focus-visible{color:#126f9d;border-color:#126f9d;}
.area-intro{max-width:720px;margin:0 auto;text-align:center;color:#42576a;}
.area-groups{display:grid;gap:36px;margin-top:36px;}
.area-group{border-top:1px solid #cfe3ee;padding-top:18px;}
.area-group h3{font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:22px;margin:0 0 14px;}
.area-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
.area-card{color:var(--ink);text-decoration:none;border:1px solid #cfe3ee;border-radius:14px;padding:18px;background:#f8fcfe;display:grid;gap:6px;transition:.15s;}
.area-card strong{font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:21px;color:#126f9d;}
.area-card span{font-size:13px;color:#42576a;line-height:1.6;}
.area-card:hover,.area-card:focus-visible{border-color:var(--blue);transform:translateY(-2px);outline:3px solid rgba(43,166,223,.2);outline-offset:2px;}
.local-note{position:relative;background:#f4fbff;border:1px solid #bfe2f2;border-radius:18px;padding:28px;margin-top:24px;}
.local-note::before{content:"地域の食卓メモ";position:absolute;top:-13px;left:18px;background:var(--yellow);padding:2px 12px;border-radius:999px;font-size:13px;font-weight:800;}
.protein-list{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;list-style:none;padding:0;margin:24px 0 0;}
.protein-list li{border:1px solid #bfe2f2;border-radius:999px;padding:8px 16px;background:#fff;font-weight:700;}
.fact-list{display:grid;gap:14px;list-style:none;padding:0;}
.fact-list li{border-left:4px solid var(--blue);padding:10px 14px;background:#f8fcfe;}
.source-list{font-size:13px;color:#526879;padding-left:20px;}
.source-list li{margin-bottom:10px;}
.proof-section{max-width:720px;margin:0 auto;text-align:center;}
.proof-section p{margin:10px 0;}
.proof-section .proof-count{font-size:clamp(19px,3vw,24px);font-weight:900;color:#126f9d;}
.preview-warning{background:#fff4d6;border:2px solid #e0b900;border-radius:14px;padding:14px 18px;font-weight:700;color:#6b5300;margin:20px 0;}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;}}
@media (max-width:560px){header.hero{padding:46px 18px;}.program-hero{padding:24px 14px 46px;}.program-hero .program-headline{font-size:clamp(29px,9.2vw,38px);line-height:1.32;}.program-hero .local-audience{margin-top:15px;}.promise-list{gap:7px;}.promise-list li{font-size:12px;padding:6px 10px;}section{padding:36px 0;}.wrap{padding:0 16px;}.local-note{padding:26px 18px 20px;}.btn{width:100%;text-align:center;padding:15px 18px;}.official-links{gap:8px;}.official-link{font-size:13px;padding:7px 11px;}}
</style>${ld}
</head>
<body>
${body}
</body>
</html>
`;
}

function card(post, baseUrl) {
  const href = `/updates/${post.slug}/`;
  return `<a class="card" href="${href}">
  ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">` : ''}
  <div class="body">
    <time datetime="${escapeHtml(post.timestamp)}">${formatDateJa(post.timestamp)}</time>
    <h3>${escapeHtml(post.title)}</h3>
    <p>${escapeHtml(post.summary)}</p>
    <span class="more">くわしく読む →</span>
  </div>
</a>`;
}

function prefectureCard(prefecture) {
  return `<a class="area-card" href="/area/${escapeHtml(prefecture.slug)}/">
  <strong>${escapeHtml(prefecture.name)}</strong>
  <span>${escapeHtml(prefecture.lead)}</span>
</a>`;
}

function officialLinks(config, className = '') {
  const classes = ['official-links', className].filter(Boolean).join(' ');
  return `<nav class="${classes}" aria-label="${escapeHtml(config.site.name)} 公式アカウント">
  <a class="official-link" href="${escapeHtml(config.instagram.profileUrl)}" target="_blank" rel="noopener">Instagram</a>
  <a class="official-link" href="${escapeHtml(config.threads.profileUrl)}" target="_blank" rel="noopener">Threads</a>
  <a class="official-link" href="${escapeHtml(config.cta.lineUrl)}" target="_blank" rel="noopener">公式LINE</a>
</nav>`;
}

function legalLinks(config, className = '') {
  const classes = ['official-links', className].filter(Boolean).join(' ');
  return `<nav class="${classes}" aria-label="${escapeHtml(config.site.name)} 法定表記">
  <a class="official-link" href="/tokusho/">特定商取引法に基づく表記</a>
  <a class="official-link" href="/privacy/">プライバシーポリシー</a>
</nav>`;
}

function programHeadline(config) {
  return escapeHtml(config.site.programHeadline)
    .replace('21日間', '<mark class="no-break">21日間</mark>')
    .replace('「続けやすい食習慣」', '<mark class="no-break">「続けやすい食習慣」</mark>')
    .replace('で<mark', 'で<br><mark');
}

function programHero({ config, audience, prefectureSlug, prefectureName = '' }) {
  const heroImage = prefectureSlug && prefectureSlug !== 'all'
    ? `<figure class="prefecture-hero-figure"><span class="prefecture-hero-label">${escapeHtml(prefectureName)}にお住まいの50代女性へ</span><img class="prefecture-hero-image" src="/images/prefectures/${escapeHtml(prefectureSlug)}_lp_16x9.png" alt="${escapeHtml(prefectureName)}の地域イラスト" loading="eager" decoding="async"></figure>`
    : '';
  return `<header class="hero program-hero">
  <div class="wrap">
    <p class="brand-name">${escapeHtml(config.site.name)}</p>
    <p class="local-audience">${escapeHtml(audience)}</p>
    <h1 class="program-headline">${programHeadline(config)}</h1>
    <p class="proof-line">${escapeHtml(config.site.proofLine)}</p>
    <ul class="promise-list"><li>21日間の集中プログラム</li><li>運動に頼らない</li><li>我慢を続けない食習慣</li></ul>
  <p class="hero-benefit">LINE登録特典：${escapeHtml(config.cta.lineBenefit)}</p>
  <a class="btn" href="${escapeHtml(config.cta.lineUrl)}" data-prefecture="${escapeHtml(prefectureSlug)}" data-channel="lp" data-cta="line-register">${escapeHtml(config.cta.lineLabel)}</a>
  ${officialLinks(config)}
  ${legalLinks(config)}
  ${heroImage}
  </div>
</header>`;
}

function legalPageShell({ config, base, title, description, heading, body, canonicalPath }) {
  const canonical = `${base}${canonicalPath}`;
  const isPreview = config.publishing?.ready !== true;
  return layout({
    title: `${title}｜${config.site.name}`,
    description,
    canonical,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    body: `<header class="hero program-hero">
  <div class="wrap">
    <p class="brand-name">${escapeHtml(config.site.name)}</p>
    <p class="local-audience">法定表記</p>
    <h1 class="program-headline">${escapeHtml(heading)}</h1>
    <p class="proof-line">${escapeHtml(description)}</p>
    ${officialLinks(config)}
    ${legalLinks(config)}
  </div>
</header>
<main class="wrap">
  ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
  ${body}
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)}${officialLinks(config, 'footer-official')}${legalLinks(config, 'footer-official')}</footer>`,
  });
}

function tokushoPage({ config, base }) {
  const legal = config.legal || {};
  const operatorName = legal.operatorName || config.site.name;
  const postalCode = legal.postalCode || '';
  const address = legal.address || '';
  const phone = legal.phone || '';
  const responsiblePerson = legal.responsiblePerson || '';
  const contactLabel = legal.contactLabel || '公式LINE';
  const contactUrl = legal.contactUrl || config.cta.lineUrl;
  const body = `<section>
  <div class="local-note">
    <p><b>販売業者</b><br>${escapeHtml(operatorName)}</p>
    <p><b>所在地</b><br>${escapeHtml([postalCode, address].filter(Boolean).join(' '))}</p>
    <p><b>電話番号</b><br>${escapeHtml(phone)}</p>
    <p><b>メールアドレス</b><br>${escapeHtml(legal.email || '公式LINEからお問い合わせください')}</p>
    <p><b>運営責任者</b><br>${escapeHtml(responsiblePerson)}</p>
    <p><b>販売価格</b><br>説明会や各ご案内ページで、その都度ご案内します。</p>
    <p><b>商品代金以外の必要料金</b><br>通信料、振込手数料、必要に応じた決済手数料がかかる場合があります。</p>
    <p><b>引き渡し時期</b><br>お申込み後、または説明会後にご案内します。</p>
    <p><b>お支払い方法</b><br>ご案内時にお知らせする方法に従ってください。</p>
    <p><b>返品・キャンセル</b><br>サービスの性質上、提供済みコンテンツの返金可否は個別のご案内に従います。</p>
    <p><b>お問い合わせ</b><br><a href="${escapeHtml(contactUrl)}" target="_blank" rel="noopener">${escapeHtml(contactLabel)}</a></p>
  </div>
</section>`;
  return legalPageShell({
    config,
    base,
    title: '特定商取引法に基づく表記',
    description: 'シェイプアップ大学の特定商取引法に基づく表記です。お問い合わせやお申込みの前にご確認ください。',
    heading: '特定商取引法に基づく表記',
    body,
    canonicalPath: '/tokusho/',
  });
}

function privacyPage({ config, base }) {
  const legal = config.legal || {};
  const operatorName = legal.operatorName || config.site.name;
  const summary = legal.privacySummary || '取得した個人情報は、お問い合わせ対応や説明会のご案内、サービス改善のために必要な範囲で使います。';
  const body = `<section>
  <div class="local-note">
    <p>${escapeHtml(summary)}</p>
    <p><b>取得する情報</b><br>氏名、連絡先、LINE登録に付随する情報、説明会やお問い合わせの際に送っていただいた内容。</p>
    <p><b>利用目的</b><br>お問い合わせへの対応、説明会のご案内、サービスの提供と改善、法令に基づく対応のために使います。</p>
    <p><b>第三者提供</b><br>法令に基づく場合を除き、ご本人の同意なく第三者へ提供しません。</p>
    <p><b>管理</b><br>漏えい、滅失、毀損を防ぐため、安全な管理に努めます。</p>
    <p><b>開示・訂正・削除</b><br>ご本人からお申し出があった場合は、確認のうえ対応します。</p>
    <p><b>お問い合わせ</b><br>運営者: ${escapeHtml(operatorName)}</p>
  </div>
</section>`;
  return legalPageShell({
    config,
    base,
    title: 'プライバシーポリシー',
    description: 'シェイプアップ大学のプライバシーポリシーです。個人情報の取り扱いについてまとめています。',
    heading: 'プライバシーポリシー',
    body,
    canonicalPath: '/privacy/',
  });
}

function prefectureIndexPage({ prefectures, config, base }) {
  const isPreview = config.publishing?.ready !== true;
  const groups = new Map();
  for (const prefecture of prefectures) {
    if (!groups.has(prefecture.region)) groups.set(prefecture.region, []);
    groups.get(prefecture.region).push(prefecture);
  }
  const groupHtml = [...groups.entries()].map(([region, rows]) => `<div class="area-group">
    <h3>${escapeHtml(region)}</h3>
    <div class="area-grid">${rows.map(prefectureCard).join('\n')}</div>
  </div>`).join('\n');
  const body = `${programHero({ config, audience: '47都道府県から、あなたの地域を選べます', prefectureSlug: 'all' })}
<main class="wrap">
  ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
  <section>
    <h2><span>お住まいの地域を選ぶ</span></h2>
    <p class="area-intro">同じ50代でも、暮らす場所によって季節も食卓も違います。身近な食材から始められるページをご覧ください。</p>
    <div class="area-groups">${groupHtml}</div>
  </section>
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)} ／ <a href="/">トップへ</a>${officialLinks(config, 'footer-official')}</footer>`;
  return layout({
    title: `47都道府県別ガイド｜${config.site.name}`,
    description: '50代女性のための、気候と食文化に合わせた47都道府県別食習慣ガイドです。',
    canonical: `${base}/area/`,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    body,
  });
}

function prefecturePage({ prefecture, config, base }) {
  const canonical = `${base}/area/${prefecture.slug}/`;
  const lineLabel = config.cta.lineLabel || '公式LINEに登録して無料PDFを受け取る';
  const lineBenefit = config.cta.lineBenefit || '更年期からの食べ方を見直すヒント';
  const isPreview = config.publishing?.ready !== true;
  const facts = prefecture.localFacts.map((fact) => `<li>${escapeHtml(fact.text)}</li>`).join('\n');
  const sources = prefecture.localFacts.map((fact) => `<li><a href="${escapeHtml(fact.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(fact.sourceName)}</a>（確認日 ${escapeHtml(fact.checkedAt)}）</li>`).join('\n');
  const proteins = prefecture.proteinExamples.map((food) => `<li>${escapeHtml(food)}</li>`).join('\n');
  const body = `${programHero({ config, audience: `${prefecture.name}にお住まいの50代女性へ`, prefectureSlug: prefecture.slug, prefectureName: prefecture.name })}
<main class="wrap">
  <section>
    <h2><span>地域に合わせて、無理なく</span></h2>
    <div class="local-note"><p>${escapeHtml(prefecture.localMessage)}</p></div>
    <ul class="fact-list">${facts}</ul>
  </section>
  <section>
    <h2><span>身近なたんぱく質から</span></h2>
    <p class="area-intro">特別な健康食品ではなく、いつもの買い物で選べるものを食事の主役にします。</p>
    <ul class="protein-list">${proteins}</ul>
  </section>
  <section class="proof-section">
    <h2><span>${escapeHtml(config.site.proofSection.heading)}</span></h2>
    <p class="proof-count">${escapeHtml(config.site.proofSection.graduateCount)}</p>
    <p>${escapeHtml(config.site.proofSection.instructorBasis)}</p>
  </section>
  <section>
    <div class="cta">
      <p class="eyebrow">LINE登録特典</p>
      <h2><span>${escapeHtml(lineBenefit)}</span></h2>
      <p>日々の生活リズムを踏まえ、毎日の食事を見直すための無料PDFです。</p>
      <a class="btn" href="${escapeHtml(config.cta.lineUrl)}" data-prefecture="${escapeHtml(prefecture.slug)}" data-channel="lp" data-cta="line-register">${escapeHtml(lineLabel)}</a>
    </div>
    ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
  </section>
  <section>
    <h2><span>地域情報の出典</span></h2>
    <ul class="source-list">${sources}</ul>
  </section>
  <p><a href="/area/">47都道府県一覧へ戻る</a> ／ <a href="/">シェイプアップ大学トップへ</a></p>
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)}${officialLinks(config, 'footer-official')}</footer>`;
  return layout({
    title: `${prefecture.name}の50代女性向けダイエット｜21日間の食習慣見直し｜${config.site.name}`,
    description: `${prefecture.name}の50代女性向けダイエット。${prefecture.localMessage}運動に頼らず、21日間の食習慣見直しに取り組みます。`,
    canonical,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${prefecture.name}の50代女性へ`,
      url: canonical,
      description: prefecture.localMessage,
      isPartOf: { '@type': 'WebSite', name: config.site.name, url: `${base}/` },
    },
    body,
  });
}

export async function buildSite({ posts, config, prefectures = [] }) {
  const base = config.site.baseUrl.replace(/\/$/, '');
  const written = [];
  const lineSeminarLabel = '公式LINEで説明会の案内を受け取る';

  // ---- LP本体 ----
  const latest = posts.slice(0, config.instagram.latestCount);
  const homeBody = `
<header class="hero">
  <div class="wrap">
    <h1>${escapeHtml(config.site.name)}</h1>
    <p>${escapeHtml(config.site.description)}</p>
    <a class="btn" href="${escapeHtml(config.cta.lineUrl)}">${lineSeminarLabel}</a>
  </div>
</header>
<main class="wrap">
  <section>
    <div class="doctrine">合言葉は <b>野菜1：たんぱく質9</b>。<br>主役はたんぱく質。がまんではなく、一生使える食の知識を学ぶ学校です。</div>
  </section>
  <section>
    <h2><span>地域別の食習慣ガイド</span></h2>
    <p style="text-align:center;color:#42576a;">気候や食文化に合わせた、47都道府県別のヒントを用意しました。</p>
    <p style="text-align:center;"><a class="btn" href="/area/">お住まいの地域を選ぶ</a></p>
  </section>
  <section id="latest">
    <h2><span>最新情報</span></h2>
    <p style="text-align:center;color:#42576a;">Instagram <a href="${escapeHtml(config.instagram.profileUrl)}" rel="me">@${escapeHtml(config.instagram.handle)}</a> の最新投稿</p>
    <div class="cards">
      ${latest.map((p) => card(p, base)).join('\n      ')}
    </div>
  </section>
  <section>
    <div class="cta">
      <h2><span>説明会のご案内</span></h2>
      <p>開催日時や参加方法は、公式LINEでご案内します。</p>
      <a class="btn" href="${escapeHtml(config.cta.lineUrl)}">${lineSeminarLabel}</a>
    </div>
  </section>
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)} ／ <a href="/tokusho/">特定商取引法に基づく表記</a>・<a href="/privacy/">プライバシーポリシー</a></footer>`;

  await writeText('public/index.html', layout({
    title: `${config.site.name}｜${config.site.tagline}`,
    description: config.site.description,
    canonical: `${base}/`,
    ogImage: latest[0]?.image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: config.site.name,
      url: `${base}/`,
      description: config.site.description,
      sameAs: [config.instagram.profileUrl],
    },
    body: homeBody,
  }));
  written.push(`${base}/`);

  await writeText('public/tokusho/index.html', tokushoPage({ config, base }));
  written.push(`${base}/tokusho/`);

  await writeText('public/privacy/index.html', privacyPage({ config, base }));
  written.push(`${base}/privacy/`);

  // ---- 投稿別ページ ----
  for (const post of posts) {
    const canonical = `${base}/updates/${post.slug}/`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      headline: post.title,
      datePublished: toW3CDate(post.timestamp),
      url: canonical,
      author: { '@type': 'Organization', name: config.site.name, url: `${base}/` },
      image: post.image || undefined,
      sharedContent: { '@type': 'WebPage', url: post.permalink },
      description: post.summary,
    };
    const body = `
<header class="hero" style="padding:40px 20px;">
  <div class="wrap"><h1 style="font-size:clamp(22px,4vw,32px);">${escapeHtml(post.title)}</h1></div>
</header>
<main class="wrap">
  <section>
    <p class="post-meta">公開日：<time datetime="${escapeHtml(post.timestamp)}">${formatDateJa(post.timestamp)}</time></p>
    ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" style="width:100%;border-radius:16px;">` : ''}
    <p class="post-body">${escapeHtml(post.summary)}</p>
    <div class="doctrine" style="text-align:left;">${escapeHtml(post.caption)}</div>
    <p style="margin-top:20px;"><a href="${escapeHtml(post.permalink)}" rel="noopener" target="_blank">この投稿をInstagramで見る →</a></p>
    <div class="backlinks">
      <a class="btn" href="${escapeHtml(config.cta.lineUrl)}">${lineSeminarLabel}</a>
      <a class="btn" style="background:#fff;border:2px solid var(--blue);box-shadow:none;color:var(--blue);" href="/">シェイプアップ大学トップへ</a>
    </div>
  </section>
</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)} ／ <a href="/">トップ</a>・<a href="/#latest">最新情報</a></footer>`;
    await writeText(`public/updates/${post.slug}/index.html`, layout({
      title: `${post.title}｜${config.site.name}`,
      description: post.summary.slice(0, 120),
      canonical,
      ogImage: post.image,
      jsonLd,
      body,
    }));
    written.push(canonical);
  }

  // ---- 47都道府県別LP ----
  if (prefectures.length) {
    await writeText('public/area/index.html', prefectureIndexPage({ prefectures, config, base }));
    written.push(`${base}/area/`);
    for (const prefecture of prefectures) {
      const canonical = `${base}/area/${prefecture.slug}/`;
      await writeText(`public/area/${prefecture.slug}/index.html`, prefecturePage({ prefecture, config, base }));
      written.push(canonical);
    }
  }

  // ---- sitemap.xml（各ページのlastmodは投稿日時＝実際の更新時刻） ----
  const homeLastmod = latest.length ? toW3CDate(latest[0].timestamp) : toW3CDate(new Date().toISOString());
  const buildLastmod = toW3CDate(new Date().toISOString());
  const urls = [
    { loc: `${base}/`, lastmod: homeLastmod, priority: '1.0' },
    { loc: `${base}/tokusho/`, lastmod: buildLastmod, priority: '0.4' },
    { loc: `${base}/privacy/`, lastmod: buildLastmod, priority: '0.4' },
    ...posts.map((p) => ({ loc: `${base}/updates/${p.slug}/`, lastmod: toW3CDate(p.timestamp), priority: '0.7' })),
    ...(prefectures.length ? [{ loc: `${base}/area/`, lastmod: buildLastmod, priority: '0.8' }] : []),
    ...prefectures.map((p) => ({ loc: `${base}/area/${p.slug}/`, lastmod: buildLastmod, priority: '0.7' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  await writeText('public/sitemap.xml', sitemap);

  // ---- feed.xml（RSS 2.0） ----
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escapeHtml(config.site.name)}｜最新情報</title>
  <link>${base}/</link>
  <description>${escapeHtml(config.site.description)}</description>
  <language>ja</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts.map((p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${base}/updates/${p.slug}/</link>
    <guid isPermaLink="true">${base}/updates/${p.slug}/</guid>
    <pubDate>${new Date(p.timestamp).toUTCString()}</pubDate>
    <description>${escapeHtml(p.summary)}</description>
  </item>`).join('\n')}
</channel></rss>
`;
  await writeText('public/feed.xml', rss);

  // ---- robots.txt ----
  await writeText('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

  return { written, sitemapUrls: urls.map((u) => u.loc) };
}
