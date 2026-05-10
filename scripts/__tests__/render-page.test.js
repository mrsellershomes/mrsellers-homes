import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMeta } from '../lib/render/meta.js';
import { renderHero } from '../lib/render/hero.js';

test('renderMeta includes town-specific title', () => {
  const html = renderMeta({
    townName: 'Fort Lee',
    townSlug: 'fort-lee',
    monthYear: 'May 2026',
    metaDescription: 'Fort Lee market summary for May 2026.',
    canonicalUrl: 'https://mrsellers.homes/fort-lee-real-estate/'
  });
  assert.ok(html.includes('Fort Lee Real Estate Market Report &mdash; May 2026'));
  assert.ok(html.includes('rel="canonical" href="https://mrsellers.homes/fort-lee-real-estate/"'));
  assert.ok(html.includes('"@type":"RealEstateAgent"'));
  assert.ok(html.includes('"@type":"Article"'));
});

test('renderHero includes town name and silhouette ref', () => {
  const html = renderHero({ townName: 'Fort Lee', townSlug: 'fort-lee', monthYear: 'May 2026' });
  assert.ok(html.includes('<h1>Fort Lee Real Estate</h1>'));
  assert.ok(html.includes('Local market report'));
  assert.ok(html.includes('May 2026'));
  assert.ok(html.includes('/assets/silhouettes/fort-lee.svg'));
  assert.ok(html.includes('aria-label'));
});

test('renderMeta escapes HTML in description', () => {
  const html = renderMeta({
    townName: 'Test',
    townSlug: 'test',
    monthYear: 'May 2026',
    metaDescription: 'A & B "C" <script>',
    canonicalUrl: 'https://mrsellers.homes/test-real-estate/'
  });
  assert.ok(html.includes('A &amp; B &quot;C&quot; &lt;script&gt;'));
});
