// 静的サイト生成。仮データ・実データどちらでも同じ経路。
//   public/index.html            … LP本体（「最新情報」欄に最新6件）
//   public/updates/<slug>/index.html … 投稿別ページ（検索可能な静的HTML）
//   public/area/<slug>/index.html … 47都道府県別LP
//   public/sitemap.xml           … 更新されたページのlastmodのみ反映
//   public/feed.xml              … RSS 2.0
//   public/robots.txt            … クロール許可 + sitemap参照
import { writeText, escapeHtml, formatDateJa, toW3CDate } from './lib.mjs';

// 1プロジェクト1パレット。青が主役、黄はCTAボタンだけに使う。
// 紙面はイラストのクリーム色に合わせた暖色オフホワイト。純黒・純白は使わない。
const BRAND = {
  paper: '#faf7f2',
  surface: '#fffdf9',
  ink: '#17313f',
  inkSoft: '#56707e',
  line: '#e4ded3',
  blue: '#2ba6df',
  blueDeep: '#0f5f85',
  blueWash: '#eaf3f8',
  cta: '#ffd934',
  ctaEdge: '#cfa400',
};

const HERO_IMAGE_SIZES = '(max-width:899px) 100vw, 500px';

/** ヒーロー画像のsrcset。幅640と1280のWebPを端末に選ばせる。 */
function heroSrcset(slug) {
  const stem = `/images/prefectures/${escapeHtml(slug)}_lp_16x9`;
  return `${stem}-640.webp 640w, ${stem}-1280.webp 1280w`;
}

function heroSrc(slug) {
  return `/images/prefectures/${escapeHtml(slug)}_lp_16x9-1280.webp`;
}

const STYLES = `
:root{
  color-scheme:light;
  --paper:${BRAND.paper};
  --surface:${BRAND.surface};
  --ink:${BRAND.ink};
  --ink-soft:${BRAND.inkSoft};
  --line:${BRAND.line};
  --blue:${BRAND.blue};
  --blue-deep:${BRAND.blueDeep};
  --blue-wash:${BRAND.blueWash};
  --cta:${BRAND.cta};
  --cta-edge:${BRAND.ctaEdge};
  --r:14px;
}
*{box-sizing:border-box;}
html{-webkit-text-size-adjust:100%;}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic Medium","Yu Gothic",system-ui,sans-serif;font-size:16px;line-height:1.85;letter-spacing:.02em;}
img{max-width:100%;}
a{color:var(--blue-deep);}
a:hover{color:var(--blue);}
:focus-visible{outline:3px solid rgba(43,166,223,.6);outline-offset:2px;border-radius:4px;}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px;}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
main section{padding:64px 0;}
h2{margin:0 0 20px;font-size:clamp(20px,2.5vw,28px);font-weight:800;line-height:1.55;letter-spacing:.01em;}
h2 span{display:inline-block;padding-bottom:7px;border-bottom:3px solid var(--blue);}
.eyebrow{margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.16em;color:var(--blue-deep);}

.site-bar{background:var(--blue-deep);color:#fff;}
.site-bar .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px 18px;padding-top:11px;padding-bottom:11px;}
.brand-name{margin:0;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:clamp(17px,2.1vw,20px);font-weight:600;letter-spacing:.1em;color:#fff;}
.official-links{display:flex;flex-wrap:wrap;gap:7px;margin:0;}
.official-link{display:inline-block;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:5px 12px;border:1px solid rgba(255,255,255,.45);border-radius:999px;}
.official-link:hover{background:#fff;color:var(--blue-deep);}
.official-link:active{transform:translateY(1px);}

.breadcrumb{padding:13px 0 0;font-size:13px;color:var(--ink-soft);}
.breadcrumb a{text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.breadcrumb i{font-style:normal;margin:0 7px;opacity:.5;}

.program-hero{background:var(--paper);border-bottom:1px solid var(--line);overflow:hidden;}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);gap:clamp(26px,4vw,52px);align-items:center;padding:clamp(28px,4.4vw,60px) 0 clamp(36px,5vw,64px);}
.hero-copy{min-width:0;}
.hero-eyebrow{margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:.14em;color:var(--blue-deep);}
.program-headline{margin:0;font-size:clamp(26px,3.4vw,40px);font-weight:800;line-height:1.45;text-wrap:balance;}
.headline-place{display:block;margin-bottom:9px;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:clamp(17px,2vw,22px);font-weight:600;letter-spacing:.12em;color:var(--blue-deep);}
.program-headline mark{background:transparent;color:inherit;padding:0 .05em;box-shadow:inset 0 -.34em 0 rgba(43,166,223,.24);box-decoration-break:clone;-webkit-box-decoration-break:clone;}
.no-break{white-space:nowrap;}
.proof-line{margin:20px 0 0;max-width:32em;font-size:clamp(14px,1.6vw,16px);color:var(--ink-soft);}
.hero-action{margin:26px 0 0;}
.btn{display:inline-block;background:var(--cta);color:var(--ink);font-weight:800;text-decoration:none;padding:15px 26px;border:1px solid var(--cta-edge);border-radius:999px;box-shadow:0 3px 0 var(--cta-edge);}
.btn:hover{color:var(--ink);transform:translateY(1px);box-shadow:0 2px 0 var(--cta-edge);}
.btn:active{transform:translateY(3px);box-shadow:0 0 0 var(--cta-edge);}
.btn-ghost{background:var(--surface);color:var(--blue-deep);border-color:var(--line);box-shadow:none;}
.btn-ghost:hover{color:var(--blue-deep);border-color:var(--blue);box-shadow:none;}
.btn-ghost:active{box-shadow:none;}

.prefecture-hero-figure{margin:0;min-width:0;}
.prefecture-hero-image{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--r);background:var(--blue-wash);}
.prefecture-hero-label{margin:12px 0 0;font-size:13px;font-weight:700;letter-spacing:.04em;color:var(--ink-soft);}
.home-gallery{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.home-gallery img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--r);background:var(--blue-wash);}

.promise-band{background:var(--blue-wash);border-bottom:1px solid var(--line);}
.promise-list{display:grid;grid-template-columns:repeat(3,1fr);margin:0;padding:24px 0 0;list-style:none;}
.promise-list li{padding:2px 20px;border-left:1px solid rgba(15,95,133,.18);font-size:15px;font-weight:700;}
.promise-list li:first-child{border-left:0;padding-left:0;}
/* 下パディングは次のセクションが重なる30px分を上乗せしてある。減らすと文字が隠れる。 */
.hero-benefit{margin:0;padding:16px 0 56px;font-size:14px;color:var(--ink-soft);}

.local-section{position:relative;z-index:1;margin-top:-30px;padding-top:38px!important;background:var(--paper);border-radius:var(--r) var(--r) 0 0;}
.local-note{margin:0;padding:26px 28px;max-width:760px;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:var(--r);font-size:17px;box-shadow:0 8px 24px rgba(23,49,63,.06);}
.local-note p{margin:0 0 14px;}
.local-note p:last-child{margin-bottom:0;}
.local-note b{color:var(--blue-deep);}
.fact-list{margin:26px 0 0;padding:0;max-width:760px;list-style:none;}
.fact-list li{position:relative;padding:14px 0 14px 26px;border-top:1px solid var(--line);}
.fact-list li::before{content:"";position:absolute;left:0;top:27px;width:13px;height:2px;background:var(--blue);}
.lead-text{max-width:34em;margin:0;color:var(--ink-soft);}
.protein-list{display:flex;flex-wrap:wrap;gap:9px;margin:20px 0 0;padding:0;list-style:none;}
.protein-list li{padding:8px 17px;background:var(--surface);border:1px solid var(--line);border-radius:999px;font-size:15px;font-weight:700;}

.proof-section{max-width:620px;margin:0 auto;text-align:center;}
.proof-count{margin:4px 0 10px;font-size:clamp(23px,3.2vw,33px);font-weight:800;color:var(--blue-deep);}
.proof-section p{margin:0 0 8px;}

.cta{background:var(--blue-deep);color:#fff;border-radius:var(--r);padding:clamp(30px,4.2vw,50px) clamp(22px,3.8vw,44px);}
.cta .eyebrow{color:rgba(255,255,255,.85);}
.cta h2{color:#fff;}
.cta h2 span{border-bottom-color:rgba(255,255,255,.55);}
.cta p{margin:0 0 24px;max-width:34em;color:rgba(255,255,255,.92);}

.source-list{margin:0;padding-left:1.3em;font-size:13px;color:var(--ink-soft);}
.source-list li{margin-bottom:8px;}
.region-links{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none;}
.region-links a{display:inline-block;padding:7px 15px;background:var(--surface);border:1px solid var(--line);border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;}
.region-links a:hover{border-color:var(--blue);background:var(--blue-wash);}
.region-links a:active{transform:translateY(1px);}

.area-groups{display:grid;gap:34px;margin-top:30px;}
.area-group{border-top:1px solid var(--line);padding-top:16px;}
.area-group h3{margin:0 0 14px;font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:20px;font-weight:600;letter-spacing:.08em;color:var(--blue-deep);}
.area-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(216px,1fr));gap:10px;}
.area-card{display:grid;gap:5px;padding:16px 18px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);color:var(--ink);text-decoration:none;}
.area-card strong{font-family:"Hiragino Mincho ProN","Yu Mincho",serif;font-size:19px;font-weight:600;letter-spacing:.06em;color:var(--blue-deep);}
.area-card span{font-size:13px;line-height:1.7;color:var(--ink-soft);}
.area-card:hover{border-color:var(--blue);background:var(--blue-wash);color:var(--ink);}
.area-card:active{transform:translateY(1px);}

.doctrine{padding:26px 28px;max-width:760px;background:var(--blue-wash);border-radius:var(--r);font-size:17px;}
.doctrine b{color:var(--blue-deep);font-size:21px;}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(238px,1fr));gap:16px;margin-top:22px;}
.card{display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);color:var(--ink);text-decoration:none;}
.card img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--blue-wash);}
.card .body{display:flex;flex-direction:column;gap:7px;padding:14px 16px;flex:1;}
.card time{font-size:12px;color:var(--ink-soft);}
.card h3{margin:0;font-size:15px;line-height:1.6;}
.card p{margin:0;font-size:14px;color:var(--ink-soft);flex:1;}
.card .more{font-size:13px;font-weight:800;color:var(--blue-deep);}
.card:hover{border-color:var(--blue);color:var(--ink);}
.card:active{transform:translateY(1px);}

.post-body{font-size:17px;}
.post-meta{color:var(--ink-soft);font-size:14px;}
.post-image{width:100%;border-radius:var(--r);background:var(--blue-wash);}
.backlinks{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;}
.preview-warning{margin:0 0 24px;padding:14px 18px;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--cta-edge);border-radius:var(--r);font-weight:700;}
.page-nav{margin:0;padding:26px 0 0;border-top:1px solid var(--line);font-size:14px;}

footer{padding:40px 0 56px;border-top:1px solid var(--line);color:var(--ink-soft);font-size:13px;}
footer .wrap{display:grid;gap:13px;}
.footer-official{gap:8px;}
.footer-official .official-link{color:var(--ink-soft);border-color:var(--line);}
.footer-official .official-link:hover{background:transparent;color:var(--blue-deep);border-color:var(--blue);}

@media (min-width:900px){
  .prefecture-hero-figure{margin-right:calc(-1 * clamp(6px,2.2vw,30px));margin-top:-16px;}
  .home-gallery img:nth-child(2n){transform:translateY(16px);}
}
@media (max-width:899px){
  .hero-grid{grid-template-columns:1fr;gap:24px;}
  .promise-list{grid-template-columns:1fr;padding-top:18px;}
  .promise-list li{padding:9px 0;border-left:0;border-top:1px solid rgba(15,95,133,.18);}
  .promise-list li:first-child{border-top:0;}
}
@media (max-width:767px){
  body{font-size:15.5px;}
  .wrap{padding:0 16px;}
  main section{padding:44px 0;}
  .local-section{margin-top:-22px;padding-top:30px!important;}
  .local-note{padding:22px 20px;}
  .btn{display:block;width:100%;text-align:center;padding:15px 16px;}
  .backlinks{display:grid;gap:10px;}
  .area-grid,.cards{grid-template-columns:1fr;}
  .doctrine{padding:22px 20px;}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important;}}
`.trim();

function layout({ title, description, canonical, jsonLd = null, body, ogImage, robots = 'index,follow', preloadImage = null }) {
  const ld = jsonLd ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  const preload = preloadImage
    ? `\n<link rel="preload" as="image" href="${preloadImage.src}" imagesrcset="${preloadImage.srcset}" imagesizes="${preloadImage.sizes}" fetchpriority="high">`
    : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${escapeHtml(robots)}">
<meta name="theme-color" content="${BRAND.blueDeep}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:locale" content="ja_JP">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="シェイプアップ大学 最新情報" href="/feed.xml">${preload}
<style>
${STYLES}
</style>${ld}
</head>
<body>
${body}
</body>
</html>
`;
}

function card(post) {
  const href = `/updates/${post.slug}/`;
  return `<a class="card" href="${href}">
  ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async">` : ''}
  <div class="body">
    <time datetime="${escapeHtml(post.timestamp)}">${formatDateJa(post.timestamp)}</time>
    <h3>${escapeHtml(post.title)}</h3>
    <p>${escapeHtml(post.summary)}</p>
    <span class="more">くわしく読む</span>
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

/** ブランド名と公式アカウントの帯。ヒーローの見出しより上に置く。 */
function siteBar(config) {
  return `<div class="site-bar">
    <div class="wrap">
      <p class="brand-name">${escapeHtml(config.site.name)}</p>
      ${officialLinks(config)}
    </div>
  </div>`;
}

/** パンくず。表示用HTMLと BreadcrumbList JSON-LD を同じ配列から作る。 */
function breadcrumbTrail(items) {
  const parts = items.map((item, index) => {
    const last = index === items.length - 1;
    const label = escapeHtml(item.name);
    const node = last ? `<span aria-current="page">${label}</span>` : `<a href="${escapeHtml(item.path)}">${label}</a>`;
    return index === 0 ? node : `<i aria-hidden="true">/</i>${node}`;
  });
  return `<nav class="breadcrumb wrap" aria-label="パンくずリスト">${parts.join('')}</nav>`;
}

function breadcrumbJsonLd(items, base) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

function programHeadline(config, place = '') {
  const headline = escapeHtml(config.site.programHeadline)
    .replace('21日間', '<mark class="no-break">21日間</mark>')
    .replace('「続けやすい食習慣」', '<mark class="no-break">「続けやすい食習慣」</mark>');
  return place ? `<span class="headline-place">${escapeHtml(place)}</span>${headline}` : headline;
}

/** 県別イラスト。WebPのsrcsetで端末に幅を選ばせ、幅高さを明示してCLSを止める。 */
function prefectureFigure(slug, name) {
  return `<figure class="prefecture-hero-figure">
        <img class="prefecture-hero-image" src="${heroSrc(slug)}" srcset="${heroSrcset(slug)}" sizes="${HERO_IMAGE_SIZES}" width="1280" height="720" alt="${escapeHtml(name)}の地域イラスト" loading="eager" fetchpriority="high" decoding="async">
        <figcaption class="prefecture-hero-label">${escapeHtml(name)}にお住まいの50代女性へ</figcaption>
      </figure>`;
}

function programHero({ config, place = '', eyebrow = '', figure = '', breadcrumb = '', prefectureSlug = '', ctaLabel = '' }) {
  const label = ctaLabel || config.cta.lineLabel;
  return `<header class="hero program-hero">
  ${siteBar(config)}
  ${breadcrumb}
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        ${eyebrow ? `<p class="hero-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1 class="program-headline">${programHeadline(config, place)}</h1>
        <p class="proof-line">${escapeHtml(config.site.proofLine)}</p>
        <p class="hero-action"><a class="btn" href="${escapeHtml(config.cta.lineUrl)}" data-prefecture="${escapeHtml(prefectureSlug)}" data-channel="lp" data-cta="line-register">${escapeHtml(label)}</a></p>
      </div>
      ${figure}
    </div>
  </div>
</header>`;
}

/** ヒーロー直下の約束3つとLINE特典。ファーストビューから外して密度を下げる。 */
function promiseBand(config) {
  return `<div class="promise-band">
  <div class="wrap">
    <ul class="promise-list"><li>21日間の集中プログラム</li><li>運動に頼らない</li><li>我慢を続けない食習慣</li></ul>
    <p class="hero-benefit">LINE登録特典：${escapeHtml(config.cta.lineBenefit)}</p>
  </div>
</div>`;
}

function siteFooter(config) {
  return `<footer>
  <div class="wrap">
    <p>© ${new Date().getFullYear()} ${escapeHtml(config.site.name)}</p>
    ${officialLinks(config, 'footer-official')}
    ${legalLinks(config, 'footer-official')}
  </div>
</footer>`;
}

function legalPageShell({ config, base, title, description, heading, body, canonicalPath }) {
  const canonical = `${base}${canonicalPath}`;
  const isPreview = config.publishing?.ready !== true;
  const trail = [
    { name: 'ホーム', path: '/' },
    { name: heading, path: canonicalPath },
  ];
  return layout({
    title: `${title}｜${config.site.name}`,
    description,
    canonical,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: title, url: canonical, description },
        breadcrumbJsonLd(trail, base),
      ],
    },
    body: `<header class="hero program-hero">
  ${siteBar(config)}
  ${breadcrumbTrail(trail)}
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="hero-eyebrow">法定表記</p>
        <h1 class="program-headline">${escapeHtml(heading)}</h1>
        <p class="proof-line">${escapeHtml(description)}</p>
      </div>
    </div>
  </div>
</header>
<main class="wrap">
  <section>
    ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
    ${body}
  </section>
</main>
${siteFooter(config)}`,
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
  const body = `<div class="local-note">
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
  </div>`;
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
  const body = `<div class="local-note">
    <p>${escapeHtml(summary)}</p>
    <p><b>取得する情報</b><br>氏名、連絡先、LINE登録に付随する情報、説明会やお問い合わせの際に送っていただいた内容。</p>
    <p><b>利用目的</b><br>お問い合わせへの対応、説明会のご案内、サービスの提供と改善、法令に基づく対応のために使います。</p>
    <p><b>第三者提供</b><br>法令に基づく場合を除き、ご本人の同意なく第三者へ提供しません。</p>
    <p><b>管理</b><br>漏えい、滅失、毀損を防ぐため、安全な管理に努めます。</p>
    <p><b>開示・訂正・削除</b><br>ご本人からお申し出があった場合は、確認のうえ対応します。</p>
    <p><b>お問い合わせ</b><br>運営者: ${escapeHtml(operatorName)}</p>
  </div>`;
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
  const trail = [
    { name: 'ホーム', path: '/' },
    { name: '47都道府県別ガイド', path: '/area/' },
  ];
  const gallery = prefectures.filter((row) => ['hokkaido', 'tokyo', 'osaka', 'okinawa'].includes(row.slug));
  const figure = gallery.length === 4
    ? `<figure class="prefecture-hero-figure">
        <div class="home-gallery">${gallery.map((row) => `<img src="${heroSrc(row.slug)}" srcset="${heroSrcset(row.slug)}" sizes="(max-width:899px) 46vw, 240px" width="1280" height="720" alt="${escapeHtml(row.name)}の地域イラスト" loading="eager" decoding="async">`).join('\n          ')}</div>
        <figcaption class="prefecture-hero-label">47都道府県それぞれに専用のページがあります</figcaption>
      </figure>`
    : '';
  const body = `${programHero({
    config,
    place: '47都道府県',
    eyebrow: 'お住まいの地域から選べます',
    figure,
    breadcrumb: breadcrumbTrail(trail),
    prefectureSlug: 'all',
  })}
${promiseBand(config)}
<main class="wrap">
  <section class="local-section">
    ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
    <h2><span>お住まいの地域を選ぶ</span></h2>
    <p class="lead-text">同じ50代でも、暮らす場所によって季節も食卓も違います。身近な食材から始められるページをご覧ください。</p>
    <div class="area-groups">${groupHtml}</div>
  </section>
</main>
${siteFooter(config)}`;
  return layout({
    title: `47都道府県別ガイド｜${config.site.name}`,
    description: '50代女性のための、気候と食文化に合わせた47都道府県別食習慣ガイドです。',
    canonical: `${base}/area/`,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    ogImage: gallery.length ? `${base}${heroSrc(gallery[0].slug)}` : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: `47都道府県別ガイド｜${config.site.name}`,
          url: `${base}/area/`,
          description: '50代女性のための、気候と食文化に合わせた47都道府県別食習慣ガイドです。',
        },
        breadcrumbJsonLd(trail, base),
      ],
    },
    body,
  });
}

function prefecturePage({ prefecture, siblings, config, base }) {
  const canonical = `${base}/area/${prefecture.slug}/`;
  const lineLabel = config.cta.lineLabel || '公式LINEに登録して無料PDFを受け取る';
  const lineBenefit = config.cta.lineBenefit || '更年期からの食べ方を見直すヒント';
  const isPreview = config.publishing?.ready !== true;
  const facts = prefecture.localFacts.map((fact) => `<li>${escapeHtml(fact.text)}</li>`).join('\n');
  const sources = prefecture.localFacts.map((fact) => `<li><a href="${escapeHtml(fact.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(fact.sourceName)}</a>（確認日 ${escapeHtml(fact.checkedAt)}）</li>`).join('\n');
  const proteins = prefecture.proteinExamples.map((food) => `<li>${escapeHtml(food)}</li>`).join('\n');
  const neighbours = siblings.filter((row) => row.slug !== prefecture.slug);
  const trail = [
    { name: 'ホーム', path: '/' },
    { name: '47都道府県', path: '/area/' },
    { name: prefecture.name, path: `/area/${prefecture.slug}/` },
  ];
  const description = `${prefecture.name}の50代女性向けダイエット。${prefecture.localMessage}運動に頼らず、21日間の食習慣見直しに取り組みます。`;
  const neighbourSection = neighbours.length
    ? `<section>
    <h2><span>${escapeHtml(prefecture.region)}のほかのページ</span></h2>
    <p class="lead-text">近い気候と食文化の地域も、あわせてご覧いただけます。</p>
    <ul class="region-links">${neighbours.map((row) => `<li><a href="/area/${escapeHtml(row.slug)}/">${escapeHtml(row.name)}</a></li>`).join('\n')}</ul>
  </section>`
    : '';
  const body = `${programHero({
    config,
    place: prefecture.name,
    figure: prefectureFigure(prefecture.slug, prefecture.name),
    breadcrumb: breadcrumbTrail(trail),
    prefectureSlug: prefecture.slug,
  })}
${promiseBand(config)}
<main class="wrap">
  <section class="local-section">
    ${isPreview ? '<p class="preview-warning">プレビュー中です。公開許可までは検索結果に表示されません。</p>' : ''}
    <h2><span>${escapeHtml(prefecture.name)}の食卓に合わせて、無理なく</span></h2>
    <div class="local-note"><p>${escapeHtml(prefecture.localMessage)}</p></div>
    <ul class="fact-list">${facts}</ul>
  </section>
  <section>
    <h2><span>${escapeHtml(prefecture.name)}で買える、身近なたんぱく質</span></h2>
    <p class="lead-text">特別な健康食品ではなく、いつもの買い物で選べるものを食事の主役にします。</p>
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
  </section>
  ${neighbourSection}
  <section>
    <h2><span>地域情報の出典</span></h2>
    <ul class="source-list">${sources}</ul>
    <p class="page-nav"><a href="/area/">47都道府県一覧へ戻る</a> ／ <a href="/">シェイプアップ大学トップへ</a></p>
  </section>
</main>
${siteFooter(config)}`;
  return layout({
    title: `${prefecture.name}の50代女性向けダイエット｜21日間の食習慣見直し｜${config.site.name}`,
    description,
    canonical,
    robots: isPreview ? 'noindex,nofollow' : 'index,follow',
    ogImage: `${base}${heroSrc(prefecture.slug)}`,
    preloadImage: { src: heroSrc(prefecture.slug), srcset: heroSrcset(prefecture.slug), sizes: HERO_IMAGE_SIZES },
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: `${prefecture.name}の50代女性へ`,
          url: canonical,
          description: prefecture.localMessage,
          primaryImageOfPage: `${base}${heroSrc(prefecture.slug)}`,
          isPartOf: { '@type': 'WebSite', name: config.site.name, url: `${base}/` },
        },
        breadcrumbJsonLd(trail, base),
      ],
    },
    body,
  });
}

/** 地域データの確認日を lastmod にする。中身が変わらない限り日付も動かない。 */
function prefectureLastmod(prefecture) {
  const dates = (prefecture.localFacts || []).map((fact) => fact.checkedAt).filter(Boolean).sort();
  return toW3CDate(dates.length ? dates[dates.length - 1] : new Date().toISOString());
}

export async function buildSite({ posts, config, prefectures = [] }) {
  const base = config.site.baseUrl.replace(/\/$/, '');
  const written = [];
  const lineSeminarLabel = '公式LINEで説明会の案内を受け取る';

  const byRegion = new Map();
  for (const prefecture of prefectures) {
    if (!byRegion.has(prefecture.region)) byRegion.set(prefecture.region, []);
    byRegion.get(prefecture.region).push(prefecture);
  }

  // ---- LP本体 ----
  const latest = posts.slice(0, config.instagram.latestCount);
  const gallery = prefectures.filter((row) => ['hokkaido', 'tokyo', 'osaka', 'okinawa'].includes(row.slug));
  const homeFigure = gallery.length === 4
    ? `<figure class="prefecture-hero-figure">
        <div class="home-gallery">${gallery.map((row) => `<img src="${heroSrc(row.slug)}" srcset="${heroSrcset(row.slug)}" sizes="(max-width:899px) 46vw, 240px" width="1280" height="720" alt="${escapeHtml(row.name)}の地域イラスト" loading="eager" decoding="async">`).join('\n          ')}</div>
        <figcaption class="prefecture-hero-label">47都道府県それぞれに専用のページがあります</figcaption>
      </figure>`
    : '';
  const homeBody = `${programHero({
    config,
    eyebrow: '50代からの食習慣の学校',
    figure: homeFigure,
    prefectureSlug: 'home',
  })}
${promiseBand(config)}
<main class="wrap">
  <section class="local-section">
    <h2><span>この学校が大切にしていること</span></h2>
    <div class="doctrine">合言葉は <b>野菜1：たんぱく質9</b>。<br>主役はたんぱく質。がまんではなく、一生使える食の知識を学ぶ学校です。</div>
  </section>
  <section>
    <h2><span>地域別の食習慣ガイド</span></h2>
    <p class="lead-text">気候や食文化に合わせた、47都道府県別のヒントを用意しました。</p>
    <p class="hero-action"><a class="btn btn-ghost" href="/area/">お住まいの地域を選ぶ</a></p>
  </section>
  <section id="latest">
    <h2><span>最新情報</span></h2>
    <p class="lead-text">Instagram <a href="${escapeHtml(config.instagram.profileUrl)}" rel="me">@${escapeHtml(config.instagram.handle)}</a> の最新投稿</p>
    <div class="cards">
      ${latest.map((p) => card(p)).join('\n      ')}
    </div>
  </section>
  <section>
    <div class="cta">
      <p class="eyebrow">オンライン説明会</p>
      <h2><span>説明会のご案内</span></h2>
      <p>開催日時や参加方法は、公式LINEでご案内します。</p>
      <a class="btn" href="${escapeHtml(config.cta.lineUrl)}" data-prefecture="home" data-channel="lp" data-cta="line-register">${lineSeminarLabel}</a>
    </div>
  </section>
</main>
${siteFooter(config)}`;

  await writeText('public/index.html', layout({
    title: `${config.site.name}｜${config.site.tagline}`,
    description: config.site.description,
    canonical: `${base}/`,
    ogImage: latest[0]?.image || (gallery.length ? `${base}${heroSrc(gallery[1].slug)}` : undefined),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: config.site.name,
      url: `${base}/`,
      description: config.site.description,
      sameAs: [config.instagram.profileUrl, config.threads.profileUrl],
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
    const trail = [
      { name: 'ホーム', path: '/' },
      { name: '最新情報', path: '/#latest' },
      { name: post.title, path: `/updates/${post.slug}/` },
    ];
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SocialMediaPosting',
          headline: post.title,
          datePublished: toW3CDate(post.timestamp),
          url: canonical,
          author: { '@type': 'Organization', name: config.site.name, url: `${base}/` },
          image: post.image || undefined,
          sharedContent: { '@type': 'WebPage', url: post.permalink },
          description: post.summary,
        },
        breadcrumbJsonLd(trail, base),
      ],
    };
    const body = `<header class="hero program-hero">
  ${siteBar(config)}
  ${breadcrumbTrail(trail)}
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="hero-eyebrow">最新情報</p>
        <h1 class="program-headline">${escapeHtml(post.title)}</h1>
        <p class="proof-line">公開日：<time datetime="${escapeHtml(post.timestamp)}">${formatDateJa(post.timestamp)}</time></p>
      </div>
    </div>
  </div>
</header>
<main class="wrap">
  <section>
    ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" decoding="async">` : ''}
    <p class="post-body">${escapeHtml(post.summary)}</p>
    <div class="local-note">${escapeHtml(post.caption)}</div>
    <p style="margin-top:20px;"><a href="${escapeHtml(post.permalink)}" rel="noopener" target="_blank">この投稿をInstagramで見る</a></p>
    <div class="backlinks">
      <a class="btn" href="${escapeHtml(config.cta.lineUrl)}" data-prefecture="updates" data-channel="lp" data-cta="line-register">${lineSeminarLabel}</a>
      <a class="btn btn-ghost" href="/">シェイプアップ大学トップへ</a>
    </div>
  </section>
</main>
${siteFooter(config)}`;
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
      const siblings = byRegion.get(prefecture.region) || [];
      await writeText(`public/area/${prefecture.slug}/index.html`, prefecturePage({ prefecture, siblings, config, base }));
      written.push(canonical);
    }
  }

  // ---- sitemap.xml（各ページのlastmodは投稿日時＝実際の更新時刻） ----
  const homeLastmod = latest.length ? toW3CDate(latest[0].timestamp) : toW3CDate(new Date().toISOString());
  const buildLastmod = toW3CDate(new Date().toISOString());
  const areaLastmod = prefectures.length
    ? prefectures.map(prefectureLastmod).sort().at(-1)
    : buildLastmod;
  const urls = [
    { loc: `${base}/`, lastmod: homeLastmod, priority: '1.0' },
    { loc: `${base}/tokusho/`, lastmod: buildLastmod, priority: '0.4' },
    { loc: `${base}/privacy/`, lastmod: buildLastmod, priority: '0.4' },
    ...posts.map((p) => ({ loc: `${base}/updates/${p.slug}/`, lastmod: toW3CDate(p.timestamp), priority: '0.7' })),
    ...(prefectures.length ? [{ loc: `${base}/area/`, lastmod: areaLastmod, priority: '0.8' }] : []),
    ...prefectures.map((p) => ({ loc: `${base}/area/${p.slug}/`, lastmod: prefectureLastmod(p), priority: '0.7' })),
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
