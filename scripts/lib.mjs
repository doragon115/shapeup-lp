// 共有ヘルパー。依存ゼロ（Node標準のみ）。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function loadJson(relPath, fallback = null) {
  const p = resolve(ROOT, relPath);
  if (!existsSync(p)) return fallback;
  return JSON.parse(await readFile(p, 'utf8'));
}

export async function saveJson(relPath, data) {
  const p = resolve(ROOT, relPath);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function writeText(relPath, text) {
  const p = resolve(ROOT, relPath);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, text, 'utf8');
}

export function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 投稿識別子（URLに使う）。IGのmedia idをそのまま使うと安定してユニーク。
export function slugFor(post) {
  return String(post.id).replace(/[^A-Za-z0-9_-]/g, '');
}

// caption から機械的でない要約を作る（title/summaryが無い投稿の保険）。
// 1文目〜2文目を採り、ハッシュタグ・余分な空白を除去して整える。
export function deriveSummary(caption = '', max = 120) {
  const cleaned = caption
    .replace(/#[^\s#]+/g, '')   // ハッシュタグ除去
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = cleaned.split(/(?<=[。！？!?])/).filter(Boolean);
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max && out) break;
    out += s;
  }
  out = out || cleaned;
  return out.length > max ? out.slice(0, max - 1) + '…' : out;
}

export function deriveTitle(caption = '', max = 40) {
  const first = deriveSummary(caption, max);
  return first.replace(/[。！？!?]$/, '');
}

// 生のAPI/モック投稿を、サイト生成で使う正規化オブジェクトへ変換。
export function normalizePost(raw) {
  const caption = raw.caption || '';
  const title = (raw.title && raw.title.trim()) || deriveTitle(caption);
  const summary = (raw.summary && raw.summary.trim()) || deriveSummary(caption);
  return {
    id: String(raw.id),
    slug: slugFor(raw),
    permalink: raw.permalink,
    timestamp: raw.timestamp,
    mediaType: raw.media_type || 'IMAGE',
    image: raw.thumbnail_url || raw.media_url || '',
    caption,
    title,
    summary,
  };
}

export function formatDateJa(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
}

// sitemap の lastmod / feed 用（W3C / RFC）。
export function toW3CDate(iso) {
  return new Date(iso).toISOString();
}

// 投稿配列の内容が「本当に変わったか」を判定するための正規化ハッシュ。
// 表示に効くフィールドだけを対象にする（取得順の揺れは無視）。
export function contentSignature(posts) {
  const norm = posts
    .map((p) => ({ id: p.id, timestamp: p.timestamp, title: p.title, summary: p.summary, image: p.image, permalink: p.permalink }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  return JSON.stringify(norm);
}
