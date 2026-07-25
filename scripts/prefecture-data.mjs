import { loadJson } from './lib.mjs';

export async function loadPrefectures() {
  const rows = await loadJson('data/prefectures.json', []);
  const errors = validatePrefectures(rows);
  if (errors.length) {
    throw new Error(`都道府県データが不正です:\n${errors.join('\n')}`);
  }
  return rows;
}

export function validatePrefectures(rows) {
  const errors = [];
  if (!Array.isArray(rows) || rows.length !== 47) {
    errors.push(`件数は47件必須です: ${rows?.length ?? 0}`);
  }

  const slugs = new Set();
  const messages = new Set();
  for (const row of rows || []) {
    const label = row?.name || '名称なし';
    if (!row?.name || !row?.slug || !row?.region || !row?.lead || !row?.localMessage) {
      errors.push(`必須項目不足: ${label}`);
    }
    if (!Array.isArray(row?.proteinExamples) || row.proteinExamples.length < 3) {
      errors.push(`たんぱく質例不足: ${label}`);
    }
    if (slugs.has(row?.slug)) errors.push(`slug重複: ${row?.slug}`);
    if (messages.has(row?.localMessage)) errors.push(`地域メッセージ重複: ${label}`);
    slugs.add(row?.slug);
    messages.add(row?.localMessage);

    if (!Array.isArray(row?.localFacts) || row.localFacts.length < 3) {
      errors.push(`地域情報不足: ${label}`);
    }
    for (const fact of row?.localFacts || []) {
      if (!fact?.text || !fact?.sourceName || !String(fact?.sourceUrl || '').startsWith('https://')) {
        errors.push(`出典不足: ${label}`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fact?.checkedAt || '')) {
        errors.push(`確認日不正: ${label}`);
      }
    }
  }
  return errors;
}
