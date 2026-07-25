// IndexNow 通知。新規・更新されたURLだけを Bing等へ通知する。
// APIキーは環境変数 INDEXNOW_KEY から読む（コードに書かない）。
// モード:
//   - config.indexnow.enabled === false もしくはキー未設定 → dry-run（送信せずログのみ）
export async function submitIndexNow({ config, urls }) {
  const key = process.env[config.indexnow.keyEnvVar];
  const enabled = config.indexnow.enabled && key;
  const base = new URL(config.site.baseUrl);

  if (!urls.length) {
    return { sent: false, reason: 'no-changed-urls', urls: [] };
  }
  if (!enabled) {
    return { sent: false, reason: key ? 'disabled-in-config' : 'no-key', urls };
  }

  const payload = {
    host: base.host,
    key,
    keyLocation: `${base.origin}/${key}.txt`,
    urlList: urls,
  };

  const results = [];
  for (const endpoint of config.indexnow.endpoints) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    results.push({ endpoint, status: res.status });
  }
  return { sent: true, urls, results };
}
