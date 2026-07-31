# シェイプアップ大学 LP（47都道府県対応・Instagram自動連携）

50代女性向けの47都道府県別LPと、Instagram公式APIの最新投稿を起点にした「最新情報」欄・投稿別ページ・`sitemap.xml`・RSS・IndexNow通知を、まとめて生成する依存ゼロの静的サイトです。

> ⚠️ 検索順位は保証しません。目的は「正しいクロール/インデックス促進」と「継続的な情報更新」です。

## いま出来ること（仮データで動作）

```bash
npm run build      # 仮データからサイト一式を生成（public/ へ出力）
npm run preview    # http://localhost:4321 でプレビュー
npm test           # スモークテスト
```

- 認証情報ゼロで、`data/instagram-mock.json` を使って全機能が動きます。
- `data/prefectures.json` から地域一覧1ページと47都道府県LPを生成します。
- 各LPの最初に「シェイプアップ大学」「21日間」「戻らない食習慣」「4,500人以上」を表示します。
- 各LPには地域固有の文章、身近なたんぱく質例、公的情報の出典、地域識別付きLINEボタンが入ります。
- Instagram、Threads、公式LINEへのリンクを、ファーストビューとフッターに表示します。
- 本番切替は「環境変数 `IG_ACCESS_TOKEN` を渡す」だけ。コードは変更不要です。

> ✅ 公式アカウントの実URLは設定済みで、`publishing.ready` は `true` です。47都道府県LPと地域一覧は検索対象になります。

## 公式アカウント

- Instagram: `https://www.instagram.com/universityshapeup/`
- Threads: `https://www.threads.com/@universityshapeup`
- 公式LINE: `https://line.me/R/ti/p/@dpi4359e`

## 仕組み

```
Instagram投稿
  → scripts/sync.mjs（1日1回 / GitHub Actions）
      ├ fetch-instagram.mjs : APIまたはモックから最新6件
      ├ 差分判定           : data/instagram.json と比較。変化なしなら終了
      ├ build-site.mjs      : LP最新情報欄・投稿別ページ・sitemap・feed 生成
      └ indexnow.mjs        : 変化したURLだけ通知
  → 変化時のみ commit/push → Cloudflare Pages が再デプロイ
```

**「変化があった時だけ」動く**のが要。無投稿日は commit も deploy もしません。

## 生成物

| パス | 内容 |
|---|---|
| `public/index.html` | LP本体（最新6件の「最新情報」欄） |
| `public/area/index.html` | 47都道府県の地域一覧 |
| `public/area/<都道府県slug>/index.html` | 都道府県別LP（47ページ） |
| `public/updates/<id>/index.html` | 投稿別ページ（canonical・meta description・JSON-LD付き） |
| `public/sitemap.xml` | lastmodは各投稿日時 |
| `public/feed.xml` | RSS 2.0 |
| `public/robots.txt` | クロール許可＋sitemap参照 |
| `data/instagram.json` | 差分判定の正本（生成物） |

## 本番化の手順

1. `config.json` の `site.baseUrl` が公開先と一致することを確認する。
2. LINE、Instagram、Threadsのリンクを実際に開き、正しい公式アカウントへ移動することを確認する。
3. Cloudflare Pages にこのリポジトリを接続（ビルド不要、`public/` を公開ディレクトリに）。
4. 公開内容の最終確認後に限り、`publishing.ready` を `true` にする。
5. Metaアプリ作成 → Instagram Login方式でトークン取得。
6. GitHub Secrets に登録（→ `SECRETS-SETUP.md`）。
7. IndexNow を使う場合、`config.json` の `indexnow.enabled` を `true` に。
8. Search Console に `sitemap.xml` を登録（初回のみ手動）。

Cloudflare Pagesへの接続と独自ドメインの取得は、まだ実施していません。外部公開前に、LINEボタンの遷移と都道府県識別データの取得方法を確認してください。

詳細な鍵の登録手順は [`SECRETS-SETUP.md`](./SECRETS-SETUP.md) を参照。
# Updated: 2026年 8月 1日 土曜日 04時12分19秒 JST
