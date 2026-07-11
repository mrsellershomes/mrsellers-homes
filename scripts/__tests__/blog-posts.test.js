import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePost } from '../lib/blog-posts.js';

const RAW = `---
title: Test Post
description: A test.
date: 2026-07-15
updated: 2026-07-16
tags: selling, macro
source_url: https://example.com/a
source_name: HousingWire
faq: Q one? | A one. ; Q two? | A two.
---
First paragraph.

## Subhead
- bullet`;

test('parsePost extracts frontmatter and body', () => {
  const p = parsePost(RAW, 'test-post.md');
  assert.equal(p.slug, 'test-post');
  assert.equal(p.title, 'Test Post');
  assert.equal(p.date, '2026-07-15');
  assert.equal(p.updated, '2026-07-16');
  assert.deepEqual(p.tags, ['selling', 'macro']);
  assert.equal(p.sourceName, 'HousingWire');
  assert.equal(p.sourceUrl, 'https://example.com/a');
  assert.equal(p.faq.length, 2);
  assert.equal(p.faq[0].q, 'Q one?');
  assert.equal(p.faq[1].a, 'A two.');
  assert.match(p.body, /^First paragraph\./);
});

test('parsePost defaults: updated=date, empty tags/faq, null source', () => {
  const p = parsePost('---\ntitle: T\ndescription: D\ndate: 2026-07-01\n---\nbody', 'x.md');
  assert.equal(p.updated, '2026-07-01');
  assert.deepEqual(p.tags, []);
  assert.deepEqual(p.faq, []);
  assert.equal(p.sourceUrl, null);
});

test('parsePost throws on missing required fields', () => {
  assert.throws(() => parsePost('---\ntitle: x\ndate: 2026-07-01\n---\nbody', 'x.md'), /description/);
  assert.throws(() => parsePost('no fences', 'x.md'), /frontmatter/);
});
