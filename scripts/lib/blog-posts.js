// Loads blog posts from content/blog/*.md. Frontmatter is a strict
// key: value block between --- fences; body is everything after, rendered
// with the shared markdown subset parser at page-build time.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = ['title', 'description', 'date'];

export function parsePost(raw, filename) {
  const m = String(raw).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${filename}: missing frontmatter fences`);
  const fm = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i === -1) throw new Error(`${filename}: bad frontmatter line "${line}"`);
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of REQUIRED) {
    if (!fm[k]) throw new Error(`${filename}: missing required frontmatter "${k}"`);
  }
  const faq = (fm.faq || '')
    .split(';').map(s => s.trim()).filter(Boolean)
    .map(pair => {
      const [q, a] = pair.split('|').map(s => s.trim());
      if (!q || !a) throw new Error(`${filename}: bad faq pair "${pair}"`);
      return { q, a };
    });
  return {
    slug: filename.replace(/\.md$/, ''),
    title: fm.title,
    description: fm.description,
    date: fm.date,
    updated: fm.updated || fm.date,
    tags: (fm.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    sourceUrl: fm.source_url || null,
    sourceName: fm.source_name || null,
    faq,
    body: m[2].trim()
  };
}

export function loadPosts(dir) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => parsePost(readFileSync(join(dir, f), 'utf8'), f))
    .sort((a, b) => b.date.localeCompare(a.date));
}
