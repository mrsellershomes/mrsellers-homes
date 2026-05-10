import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMeta } from '../lib/render/meta.js';
import { renderHero } from '../lib/render/hero.js';
import { renderStatTiles } from '../lib/render/stat-tiles.js';
import { renderWhatThisMeans } from '../lib/render/what-this-means.js';
import { renderDataTable } from '../lib/render/data-table.js';
import { renderPropertyBreakdown } from '../lib/render/property-breakdown.js';
import { renderAboutTown } from '../lib/render/about-town.js';
import { renderSchools } from '../lib/render/schools.js';
import { renderVideosBlogs } from '../lib/render/videos-blogs.js';
import { renderCtas } from '../lib/render/ctas.js';
import { renderFooter } from '../lib/render/footer.js';
import { renderSub10Placeholder } from '../lib/render/sub10-placeholder.js';

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

test('renderPropertyBreakdown shows only provided types', () => {
  const html = renderPropertyBreakdown({
    townName: 'Fort Lee',
    monthYear: 'May 2026',
    singleFamily: { medianSalePrice: 1400000, medianPpsf: 542, homesSold: 12 },
    multiFamily: null,
    condo: { medianSalePrice: 600000, medianPpsf: 450, homesSold: 25 }
  });
  assert.ok(html.includes('Single-Family in Fort Lee'));
  assert.ok(html.includes('Condo / Co-op in Fort Lee'));
  assert.ok(!html.includes('Multi-Family'));
});

test('renderPropertyBreakdown returns empty when no types', () => {
  assert.equal(renderPropertyBreakdown({ townName: 'Fort Lee', monthYear: 'May 2026' }), '');
});

test('renderAboutTown returns empty when no text', () => {
  assert.equal(renderAboutTown({ townName: 'Fort Lee', aboutText: '' }), '');
  assert.equal(renderAboutTown({ townName: 'Fort Lee', aboutText: '   ' }), '');
});

test('renderAboutTown splits on blank lines into paragraphs', () => {
  const html = renderAboutTown({
    townName: 'Fort Lee',
    aboutText: 'Paragraph one.\n\nParagraph two.'
  });
  assert.ok(html.includes('<p>Paragraph one.</p>'));
  assert.ok(html.includes('<p>Paragraph two.</p>'));
});

test('renderSchools returns empty when no schools', () => {
  assert.equal(renderSchools({ townName: 'Rockleigh', schoolsData: { schools: [], schoolCount: 0 } }), '');
});

test('renderSchools groups schools by band', () => {
  const html = renderSchools({
    townName: 'Fort Lee',
    schoolsData: {
      schoolCount: 3,
      schools: [
        { name: 'School No. 1', band: 'Elementary' },
        { name: 'Lewis F. Cole Middle School', band: 'Middle' },
        { name: 'Fort Lee High School', band: 'High' }
      ]
    },
    summarySentence: 'Test summary.'
  });
  assert.ok(html.includes('Elementary (PK-4)'));
  assert.ok(html.includes('Middle (5-8)'));
  assert.ok(html.includes('High (9-12)'));
  assert.ok(html.includes('Test summary.'));
});

test('renderVideosBlogs returns empty when no content', () => {
  assert.equal(renderVideosBlogs({ townName: 'Fort Lee' }), '');
  assert.equal(renderVideosBlogs({ townName: 'Fort Lee', videos: [], blogs: [] }), '');
});

test('renderVideosBlogs embeds YouTube iframe', () => {
  const html = renderVideosBlogs({ townName: 'Fort Lee', videos: ['hgECvV24r9A'] });
  assert.ok(html.includes('https://www.youtube.com/embed/hgECvV24r9A'));
  assert.ok(html.includes('Fort Lee town guide'));
});

test('renderCtas wires correct FUB sources and tags', () => {
  const html = renderCtas({ townName: 'Fort Lee' });
  // Source uses real em-dash (matches existing project_crm.md FUB source convention)
  assert.ok(html.includes('data-fub-source="MrSellers.homes — Fort Lee Real Estate Page (Buyer)"'));
  assert.ok(html.includes('data-fub-source="MrSellers.homes — Fort Lee Real Estate Page (Seller)"'));
  assert.ok(html.includes('data-fub-tags="Market Page Lead,Town: Fort Lee,Intent: Buyer"'));
  assert.ok(html.includes('data-fub-tags="Market Page Lead,Town: Fort Lee,Intent: Seller"'));
  assert.ok(html.includes('Been thinking about buying in Fort Lee?'));
  assert.ok(html.includes('Been thinking about selling your home in Fort Lee?'));
  assert.ok(html.includes('Honest feedback on the moves you'));
});

test('renderCtas renders two forms with class lead-form', () => {
  const html = renderCtas({ townName: 'Fort Lee' });
  const matches = (html.match(/class="lead-form"/g) || []).length;
  assert.equal(matches, 2);
});

test('renderFooter shows month and towns link', () => {
  const html = renderFooter({ monthYear: 'May 2026' });
  assert.ok(html.includes('Last updated: May 2026'));
  assert.ok(html.includes('href="/towns/"'));
  assert.ok(html.includes('Redfin Data Center'));
});

test('renderSub10Placeholder uses 3-month blend', () => {
  const html = renderSub10Placeholder({
    townName: 'Teterboro',
    threeMonthBlend: { medianSalePrice: 500000, homesSold: 4, saleToList: 0.95 }
  });
  assert.ok(html.includes('Teterboro had fewer than 10'));
  assert.ok(html.includes('$500,000'));
  assert.ok(html.includes('95.0%'));
  assert.ok(html.includes('Low-Volume Town'));
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
