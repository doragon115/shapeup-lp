# AI Handoff

## Current status

- 47都道府県LPはCloudflare Pagesで公開中: https://shapeup-university.pages.dev/
- `publishing.ready` は `true`。トップ、地域一覧、47都道府県ページは `index,follow`。
- HTTP 200を確認済み: `/`、`/area/tokyo/`、`/robots.txt`、`/sitemap.xml`。
- canonical、robots.txt、sitemap.xmlは `https://shapeup-university.pages.dev/` と一致。
- Google Search Consoleの所有権確認はHTMLファイル方式で完了。`sitemap.xml`は送信済み。
- Search Consoleは送信直後に「Sitemap could not be read」と表示しているが、サイト側ではXML妥当性、51 URL、Googlebot User-AgentでのHTTP 200を確認済み。Google側の初回処理結果を再確認する。
- Cloudflare Web AnalyticsはPagesのMetricsから有効化済み。再デプロイ後、最新デプロイURLとキャッシュバスター付き本番URLでBeacon配信を確認済み。トークンはコード・Git・資料に保存していない。

## Next actions

1. 24時間から72時間後にSearch Consoleで`/sitemap.xml`の取得結果と検出ページ数を確認する。
2. Cloudflare Web Analyticsで数時間から数日後にページビュー、訪問者、流入元、主要ページを確認する。
3. Cloudflare Pagesのデプロイ手順をリポジトリへ明記し、旧chatgpt.site向けのSites設定を整理する。
4. Instagram同期の本番運用前に、`IG_ACCESS_TOKEN`未設定時はモックを公開しない設計へ見直す。

## Do not change

- 公式LINEのURL・設定・配信内容は変更しない。
- Zoom URLを公開LPで使わない。
- `site.baseUrl`をCloudflare Pages以外のドメインへ変更しない。
