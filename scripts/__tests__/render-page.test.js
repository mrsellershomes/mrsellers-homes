import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMeta } from '../lib/render/meta.js';
import { renderHero } from '../lib/render/hero.js';
import { renderStatTiles } from '../lib/render/stat-tiles.js';
import { renderWhatThisMeans } from '../lib/render/what-this-means.js';
import { renderDataTable } from '../lib/render/data-table.js';

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

test('renderStatTiles formats currency and percentages', () => {
  const html = renderStatTiles({
    medianSalePrice: 890000,
    medianSalePriceYoy: -0.02,
    medianPpsf: 487,
    medianPpsfYoy: 0.04,
    homesSold: 47,
    homesSoldYoy: -0.06,
    saleToList: 0.992,
    saleToListYoy: 0,
    monthsOfSupply: 5.0,
    monthsOfSupplyYoy: 0.14
  });
  assert.ok(html.includes('$890,000'));
  assert.ok(html.includes('$487'));
  assert.ok(html.includes('99.2%'));
  assert.ok(html.includes('5.0'));
  assert.ok(html.includes('aria-label'));
  assert.ok(html.includes('trend-down') && html.includes('trend-up') && html.includes('trend-flat'));
});

test('renderStatTiles renders em-dash for missing values', () => {
  const html = renderStatTiles({});
  // 5 stat tiles, each with a missing value, should render em-dash placeholders
  const dashes = (html.match(/—/g) || []).length;
  assert.ok(dashes >= 5);
});

test('renderWhatThisMeans returns empty string with no paragraph', () => {
  assert.equal(renderWhatThisMeans({ aiParagraph: '' }), '');
  assert.equal(renderWhatThisMeans({ aiParagraph: '   ' }), '');
  assert.equal(renderWhatThisMeans({}), '');
});

test('renderWhatThisMeans includes fallback class when fallback=true', () => {
  const html = renderWhatThisMeans({ aiParagraph: 'Test paragraph.', fallback: true });
  assert.ok(html.includes('what-this-means fallback'));
  assert.ok(html.includes('Test paragraph.'));
});

test('renderDataTable includes all 13 metrics', () => {
  const html = renderDataTable({ medianSalePrice: 890000, homesSold: 47 });
  assert.ok(html.includes('Median Sale Price'));
  assert.ok(html.includes('Median List Price'));
  assert.ok(html.includes('Median $/sqft'));
  assert.ok(html.includes('Homes Sold'));
  assert.ok(html.includes('New Listings'));
  assert.ok(html.includes('Pending Sales'));
  assert.ok(html.includes('Inventory'));
  assert.ok(html.includes('Months of Supply'));
  assert.ok(html.includes('Median Days on Market'));
  assert.ok(html.includes('Sale-to-List Ratio'));
  assert.ok(html.includes('% Sold Above List'));
  assert.ok(html.includes('% with Price Drops'));
  assert.ok(html.includes('Off Market in 2 Weeks'));
});

test('renderDataTable formats percent metrics as point deltas', () => {
  const html = renderDataTable({ saleToList: 0.992, saleToListYoy: 0.04 });
  assert.ok(html.includes('99.2%'));
  assert.ok(html.includes('4 pts'));
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
