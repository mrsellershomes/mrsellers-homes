import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildSitemap } from '../lib/sitemap.js';

const POST_MD = `---
title: Sample Post
description: Desc.
date: 2026-07-15
---
Hello world.`;

test('generate-blog writes post, index, and updates homepage module', () => {
  const dir = mkdtempSync(join(tmpdir(), 'blog-'));
  const contentDir = join(dir, 'content');
  mkdirSync(contentDir, { recursive: true });
  writeFileSync(join(contentDir, 'sample-post.md'), POST_MD);
  writeFileSync(join(dir, 'index.html'),
    '<html><body>\n<!-- blog-latest:start -->\nold\n<!-- blog-latest:end -->\n</body></html>');

  execFileSync('node', ['scripts/generate-blog.js',
    `--content-dir=${contentDir}`, `--out-dir=${dir}`, '--no-sitemap']);

  assert.ok(existsSync(join(dir, 'blog', 'sample-post', 'index.html')));
  const post = readFileSync(join(dir, 'blog', 'sample-post', 'index.html'), 'utf8');
  assert.match(post, /Sample Post/);
  const index = readFileSync(join(dir, 'blog', 'index.html'), 'utf8');
  assert.match(index, /href="\/blog\/sample-post\/"/);
  const home = readFileSync(join(dir, 'index.html'), 'utf8');
  assert.match(home, /blog-latest:start/);
  assert.match(home, /Sample Post/);
  assert.doesNotMatch(home, /\nold\n/);
});

test('buildSitemap includes blog urls when posts passed', () => {
  const xml = buildSitemap([{ pageSlug: 'tenafly-real-estate' }],
    [{ slug: 'sample-post', updated: '2026-07-16' }]);
  assert.match(xml, /<loc>https:\/\/mrsellers\.homes\/blog\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/mrsellers\.homes\/blog\/sample-post\/<\/loc>/);
  assert.match(xml, /2026-07-16/);
});
