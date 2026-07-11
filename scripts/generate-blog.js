// Generate the blog from content/blog/*.md: one page per post at
// blog/<slug>/index.html, the index at blog/index.html, the homepage
// "latest posts" module (between blog-latest markers in index.html), and
// a refreshed sitemap.xml.
//
// Rewriting index.html on every publish is deliberate: Cloudflare Pages'
// git integration only republishes when watched paths change, and root
// *.html is watched while blog/ (yet) is not. Touching index.html makes
// every blog publish self-deploying.
//
// Usage:
//   node scripts/generate-blog.js                # full run at repo root
//   node scripts/generate-blog.js --dry-run
//   node scripts/generate-blog.js --content-dir=DIR --out-dir=DIR  (tests)
//   node scripts/generate-blog.js --no-sitemap   (tests: skip sitemap regen)

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts } from './lib/blog-posts.js';
import { renderBlogPost } from './lib/render/blog-post.js';
import { renderBlogIndex } from './lib/render/blog-index.js';
import { buildSitemap } from './lib/sitemap.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function parseArgs(argv) {
  const flags = { dryRun: false, contentDir: join(ROOT, 'content/blog'), outDir: ROOT, sitemap: true };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--no-sitemap') flags.sitemap = false;
    else if (arg.startsWith('--content-dir=')) flags.contentDir = resolve(arg.slice(14));
    else if (arg.startsWith('--out-dir=')) flags.outDir = resolve(arg.slice(10));
    else console.warn(`Ignored unknown flag: ${arg}`);
  }
  return flags;
}

function updateHomepageModule(outDir, posts, dryRun) {
  const homePath = join(outDir, 'index.html');
  if (!existsSync(homePath)) {
    console.warn('index.html not found; skipping homepage module.');
    return;
  }
  const home = readFileSync(homePath, 'utf8');
  const START = '<!-- blog-latest:start -->';
  const END = '<!-- blog-latest:end -->';
  const s = home.indexOf(START);
  const e = home.indexOf(END);
  if (s === -1 || e === -1) {
    console.warn('blog-latest markers not found in index.html; skipping homepage module.');
    return;
  }
  const cards = posts.slice(0, 3).map(p => `  <a class="home-blog-card" href="/blog/${p.slug}/">
    <span class="home-blog-date">${p.date}</span>
    <span class="home-blog-title">${p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>
  </a>`).join('\n');
  const next = home.slice(0, s + START.length) + '\n' + cards + '\n' + home.slice(e);
  if (!dryRun) writeFileSync(homePath, next);
  console.log('index.html: blog-latest module updated.');
}

const flags = parseArgs(process.argv);
const posts = loadPosts(flags.contentDir);
console.log(`${posts.length} post(s) from ${flags.contentDir}${flags.dryRun ? ' (dry run)' : ''}`);

for (const post of posts) {
  const dir = join(flags.outDir, 'blog', post.slug);
  if (!flags.dryRun) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderBlogPost(post));
  }
  console.log(`blog/${post.slug}/index.html`);
}

if (!flags.dryRun) {
  mkdirSync(join(flags.outDir, 'blog'), { recursive: true });
  writeFileSync(join(flags.outDir, 'blog', 'index.html'), renderBlogIndex(posts));
}
console.log('blog/index.html');

updateHomepageModule(flags.outDir, posts, flags.dryRun);

if (flags.sitemap) {
  const towns = JSON.parse(readFileSync(join(ROOT, 'data', 'bergen-towns.json'), 'utf8'));
  if (!flags.dryRun) writeFileSync(join(flags.outDir, 'sitemap.xml'), buildSitemap(towns, posts));
  console.log('sitemap.xml regenerated (towns + blog).');
}
