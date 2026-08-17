# AI Handoff

## Current status

- 2026-08-17、48ページ（トップ＋47都道府県）のデザインを刷新して本番へ反映済み。ブランチ `redesign/prefecture-lp-taste` を `main` へマージ（`52914b7`）。375px実機で表示確認済み。
  - 配色は青が主役、黄はCTAボタンだけ。紙面は暖色オフホワイト `#faf7f2`。純黒・純白は使わない。
  - ヒーロー画像を法定表記リンクの下から見出し直後へ移動。SNSリンクと法定表記はフッターへ。
  - PNG（1枚2.8MB／47枚で128MB）をWebP 640・1280pxの2段へ変換。合計2.2MB。375px端末の東京都ページは2,716KB→9KB。
  - 元PNGは `archive/prefecture-png-2026-08-16/` へ退避。`archive/` はgitignore済み（git履歴には残っているので復元可）。
  - 画像変換は `scripts/optimize-images.mjs`。`cwebp` 品質76。
  - SEO: h1に県名、パンくず（HTML＋BreadcrumbList JSON-LD）、og:image、同一地方の相互リンク、sitemap lastmodを内容ベースへ。
  - デザインは `scripts/build-site.mjs` の `STYLES` 定数1箇所に集約。ここを直せば48ページに反映される。
- `npm run preview` はNode v24で起動しない（`--experimental-default-type=module` が削除済み）。`node scripts/serve.mjs` を直接叩く。デザイン刷新とは無関係の既存問題。
- 47都道府県LPはCloudflare Pagesで公開中: https://shapeup-university.pages.dev/
- `publishing.ready` は `true`。トップ、地域一覧、47都道府県ページは `index,follow`。
- HTTP 200を確認済み: `/`、`/area/tokyo/`、`/robots.txt`、`/sitemap.xml`。
- canonical、robots.txt、sitemap.xmlは `https://shapeup-university.pages.dev/` と一致。
- Google Search Consoleの所有権確認はHTMLファイル方式で完了。`sitemap.xml`は送信済み。
- Search Consoleは送信直後に「Sitemap could not be read」と表示しているが、サイト側ではXML妥当性、51 URL、Googlebot User-AgentでのHTTP 200を確認済み。Google側の初回処理結果を再確認する。
- Cloudflare Web AnalyticsはPagesのMetricsから有効化済み。再デプロイ後、最新デプロイURLとキャッシュバスター付き本番URLでBeacon配信を確認済み。トークンはコード・Git・資料に保存していない。

## Next actions

1. デザイン刷新後のCore Web Vitals（特にモバイルLCP）をPageSpeed InsightsかSearch Consoleで確認する。画像が128MB→2.2MBになったので改善しているはず。

あとまわし:

- Search Consoleで`/sitemap.xml`の取得結果と検出ページ数を確認する。
- Cloudflare Web Analyticsでページビュー、訪問者、流入元、主要ページを確認する。
- Cloudflare Pagesのデプロイ手順をリポジトリへ明記し、旧chatgpt.site向けのSites設定を整理する。
- Instagram同期の本番運用前に、`IG_ACCESS_TOKEN`未設定時はモックを公開しない設計へ見直す。

## Do not change

- 公式LINEのURL・設定・配信内容は変更しない。
- Zoom URLを公開LPで使わない。
- `site.baseUrl`をCloudflare Pages以外のドメインへ変更しない。
