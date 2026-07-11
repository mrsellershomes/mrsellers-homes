import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBlogPost } from '../lib/render/blog-post.js';
import { renderBlogIndex } from '../lib/render/blog-index.js';

const POST = {
  slug: 'test-post',
  title: 'Test Post Title',
  description: 'A meta description.',
  date: '2026-07-15',
  updated: '2026-07-16',
  tags: ['selling'],
  sourceUrl: 'https://example.com/article',
  sourceName: 'HousingWire',
  faq: [{ q: 'Is this a test?', a: 'Yes.' }],
  body: 'First paragraph with **bold**.\n\n## Subhead\n- one\n- two'
};

const BARE = { ...POST, slug: 'bare', title: 'Bare', sourceUrl: null, sourceName: null, faq: [] };

test('renderBlogPost: head, canonical, structured data', () => {
  const html = renderBlogPost(POST);
  assert.match(html, /<title>Test Post Title \| Tyler Sellers<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/mrsellers\.homes\/blog\/test-post\/"/);
  assert.match(html, /"@type":\s*"BlogPosting"/);
  assert.match(html, /"@type":\s*"FAQPage"/);
  assert.match(html, /"@type":\s*"RealEstateAgent"/);
  assert.match(html, /"datePublished":\s*"2026-07-15"/);
  assert.match(html, /"dateModified":\s*"2026-07-16"/);
});

test('renderBlogPost: tracking, footer compliance, source credit, body', () => {
  const html = renderBlogPost(POST);
  assert.match(html, /G-5VC5MDECPH/);
  assert.match(html, /clarity/);
  assert.match(html, /RE\/MAX Signature Homes/);
  assert.match(html, /href="https:\/\/example\.com\/article"[^>]*rel="nofollow noopener"/);
  assert.match(html, /HousingWire/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<h3>Subhead<\/h3>/);
  assert.match(html, /css\/blog\.css/);
});

test('renderBlogPost: no FAQPage or source block when absent', () => {
  const html = renderBlogPost(BARE);
  assert.doesNotMatch(html, /FAQPage/);
  assert.doesNotMatch(html, /post-source/);
});

test('renderBlogIndex lists posts with links', () => {
  const html = renderBlogIndex([POST, BARE]);
  assert.match(html, /href="\/blog\/test-post\/"/);
  assert.match(html, /href="\/blog\/bare\/"/);
  assert.match(html, /The Sellers&rsquo; Take/);
  assert.match(html, /G-5VC5MDECPH/);
  assert.match(html, /RE\/MAX Signature Homes/);
});
