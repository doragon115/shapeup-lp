// Instagram投稿の取得。
//   - モックモード（既定）: data/instagram-mock.json を読む
//   - 本番モード: Instagram Graph API (Instagram Login方式) を叩く
// 取得結果は正規化して返すだけ。ファイル書き込みや差分判定は sync.mjs が行う。
//
// 本番切替は「環境変数 IG_ACCESS_TOKEN を渡す」だけ。トークンはコードに書かない。
import { loadJson, normalizePost } from './lib.mjs';

const GRAPH_VERSION = 'v21.0';
// Instagram Login方式（Facebookページ不要）の自分メディア取得エンドポイント。
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

export async function fetchPosts({ config, useMock }) {
  const token = process.env.IG_ACCESS_TOKEN;
  const limit = config?.instagram?.latestCount ?? 6;

  if (useMock || !token) {
    const mock = await loadJson('data/instagram-mock.json', { data: [] });
    const posts = (mock.data || []).map(normalizePost);
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { source: 'mock', posts: posts.slice(0, limit) };
  }

  // ---- 本番: Instagram Graph API ----
  // Instagram Login方式では /me/media が使える（IGユーザートークン）。
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me/media`);
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('limit', String(Math.max(limit, 6)));
  url.searchParams.set('access_token', token);

  const res = await fetch(url);
  if (!res.ok) {
    // トークン本体はログに出さない。
    const body = await res.text();
    throw new Error(`Instagram API error ${res.status}: ${body.replace(token, '***').slice(0, 500)}`);
  }
  const json = await res.json();
  const posts = (json.data || []).map(normalizePost);
  posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return { source: 'api', posts: posts.slice(0, limit) };
}
