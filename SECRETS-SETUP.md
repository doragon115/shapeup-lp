# 秘密情報の登録手順（あとで実施）

**トークン・シークレット・パスワードは、この手順に沿ってご自身で登録画面に貼ってください。**
チャットやコードやコミットに書かないでください。ログにも出さない設計になっています。

登録する鍵は最大4つ。プレビュー確認が終わってから登録すればOKです。

| 鍵 | どこで作る | 登録先 |
|---|---|---|
| `IG_ACCESS_TOKEN` | Metaアプリ（Instagram Login） | GitHub Secrets |
| `INDEXNOW_KEY` | 自分で生成した英数字文字列 | GitHub Secrets |
| （任意）`CF_DEPLOY_HOOK_URL` | Cloudflare Pages | 使う場合のみ |
| Meta App Secret | Metaアプリ | Metaの管理画面内のみ（GitHubには不要） |

## 1. GitHub Secrets の登録場所

リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**

- Name: `IG_ACCESS_TOKEN` / Secret: （取得した長期トークンを貼る）
- Name: `INDEXNOW_KEY` / Secret: （後述の生成した文字列を貼る）

登録後、Actionsのログではマスクされ表示されません。

## 2. Instagram 長期トークンの取得（Instagram Login方式）

1. https://developers.facebook.com/ でアプリを作成（用途: Instalgram / Business）。
2. 「Instagram」プロダクトを追加し、**Instagram Login** を有効化。
   - この方式はFacebookページ接続を必須にしません。
   - もし途中でFacebookページ接続を求められた場合だけ、こちらに一報ください（設計を切り替えます）。
3. 権限 `instagram_business_basic` を付与。
4. 発行された短期トークンを**長期トークン（約60日有効）**に交換。
5. その長期トークンを `IG_ACCESS_TOKEN` として GitHub Secrets に登録。

> トークンは約60日で失効します。ワークフローに定期リフレッシュを後で追加します（無料）。

## 3. IndexNow キー

1. 英数字16〜32文字程度のランダム文字列を用意（例: パスワードマネージャの生成機能）。
2. その文字列を `INDEXNOW_KEY` として GitHub Secrets に登録。
3. 本番デプロイ時、`public/<その文字列>.txt`（中身も同じ文字列）を自動生成する処理を有効化します。
4. `config.json` の `indexnow.enabled` を `true` に。

## 4. Cloudflare Pages

- 基本は **GitリポジトリをPagesに接続**するだけで、push時に自動再デプロイされます（Deploy Hookは不要）。
- Deploy Hookを使う構成にしたい場合のみ、URLを `CF_DEPLOY_HOOK_URL` としてSecrets登録し、ワークフローに1行足します。

---

### 露出中トークンについて（別件・要対応）
`ai-brain-vault` リポジトリの git remote URL に GitHub の個人アクセストークン（`ghp_…`）が平文で埋め込まれています。
GitHub → Settings → Developer settings → Personal access tokens で**該当トークンを失効（Revoke）→再発行**し、
remoteを `git remote set-url origin https://github.com/doragon115/ai-brain-vault.git` に貼り替えてください（以後は認証はキーチェーン/ghに任せる）。
