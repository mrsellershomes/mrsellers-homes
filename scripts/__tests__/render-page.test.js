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
import { renderTownPage } from '../lib/render/page.js';

test('renderMeta includes town-specific title without em-dash separators', () => {
  const html = renderMeta({
    townName: 'Fort Lee',
    townSlug: 'fort-lee',
    monthYear: 'May 2026',
    metaDescription: 'Fort Lee market summary for May 2026.',
    canonicalUrl: 'https://mrsellers.homes/fort-lee-real-estate/'
  });
  assert.ok(html.includes('Fort Lee Real Estate Market Report for May 2026'));
  // No em-dash in title or any meta content
  assert.ok(!html.includes('&mdash;'));
  assert.ok(!html.includes('—'));
  assert.ok(html.includes('rel="canonical" href="https://mrsellers.homes/fort-lee-real-estate/"'));
  assert.ok(html.includes('"@type":"RealEstateAgent"'));
  assert.ok(html.includes('"@type":"Article"'));
});

test('renderHero includes town name, silhouette ref, and consolidated subhead', () => {
  const html = renderHero({ townName: 'Fort Lee', townSlug: 'fort-lee', monthYear: 'May 2026' });
  assert.ok(html.includes('<h1>Fort Lee Real Estate</h1>'));
  assert.ok(html.includes('Local Market Report for the Last Six Months Ending May 2026'));
  assert.ok(html.includes('/assets/silhouettes/fort-lee.svg'));
  assert.ok(html.includes('aria-label'));
});

test('renderStatTiles formats currency and percentages', () => {
  const html = renderStatTiles({
    medianSalePrice: 890000,
    medianSalePriceYoy: -0.02,
    averageSalePrice: 1100000,
    averageSalePriceYoy: 0.04,
    homesSold: 47,
    homesSoldYoy: -0.06,
    saleToList: 0.992,
    saleToListYoy: 0,
    medianDom: 32,
    medianDomYoy: 0.14
  });
  assert.ok(html.includes('$890,000'));
  assert.ok(html.includes('$1,100,000'));
  assert.ok(html.includes('99.2%'));
  assert.ok(html.includes('Median Days on Market'));
  assert.ok(html.includes('aria-label'));
  assert.ok(html.includes('trend-down') && html.includes('trend-up') && html.includes('trend-flat'));
});

test('renderStatTiles renders N/A placeholder for missing values, never an em-dash', () => {
  const html = renderStatTiles({});
  // Should NOT contain any em-dashes anywhere (per the no-em-dash rule)
  assert.ok(!html.includes('—'));
  assert.ok(!html.includes('&mdash;'));
  // Five tiles, each with a missing value, should render N/A
  const naCount = (html.match(/N\/A/g) || []).length;
  assert.ok(naCount >= 5, `expected at least 5 N/A placeholders, got ${naCount}`);
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

test('renderDataTable shows the metrics that have data and skips the rest', () => {
  const html = renderDataTable({
    medianSalePrice: 890000,
    averageSalePrice: 1100000,
    medianListPrice: 925000,
    homesSold: 47,
    medianDom: 32,
    fastestSaleDays: 4,
    saleToList: 0.992,
    soldAboveList: 0.30,
    lowestSale: 550000,
    highestSale: 3200000
  });
  assert.ok(html.includes('Median sale price'));
  assert.ok(html.includes('Average sale price'));
  assert.ok(html.includes('Median last list price'));
  assert.ok(html.includes('Single-family closings (last 6 months)'));
  assert.ok(html.includes('Median days on market'));
  assert.ok(html.includes('Fastest sale (days on market)'));
  assert.ok(html.includes('Median sale-to-list ratio'));
  assert.ok(html.includes('Share of sales that went above list'));
  assert.ok(html.includes('Lowest single-family sale'));
  assert.ok(html.includes('Highest single-family sale'));
});

test('renderDataTable formats percent values with one decimal place', () => {
  const html = renderDataTable({ saleToList: 0.992 });
  assert.ok(html.includes('99.2%'));
});

test('renderDataTable returns empty when no metrics have data', () => {
  assert.equal(renderDataTable({}), '');
});

test('renderPropertyBreakdown shows only provided types', () => {
  const html = renderPropertyBreakdown({
    townName: 'Fort Lee',
    monthYear: 'May 2026',
    singleFamily: { medianSalePrice: 1400000, homesSold: 12 },
    multiFamily: null,
    condoTownhouse: { medianSalePrice: 600000, homesSold: 25 },
    coop: { medianSalePrice: 250000, homesSold: 30 }
  });
  // Each type renders its own card; type label appears in the h3.
  assert.ok(html.includes('<h3>Single-Family</h3>'));
  assert.ok(html.includes('<h3>Condo &amp; Townhouse</h3>') || html.includes('<h3>Condo & Townhouse</h3>'));
  assert.ok(html.includes('<h3>Co-op</h3>'));
  assert.ok(!html.includes('Multi-Family'));
  // Town name appears in section header / aria-label
  assert.ok(html.includes('Fort Lee'));
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

test('renderCtas wires correct FUB sources (vertical-bar separator) and tags', () => {
  const html = renderCtas({ townName: 'Fort Lee' });
  // FUB source identifiers use a vertical-bar separator instead of an em-dash
  // per the no-em-dashes rule. The bar is unambiguous and pure ASCII.
  assert.ok(html.includes('data-fub-source="MrSellers.homes | Fort Lee Real Estate Page | Buyer"'));
  assert.ok(html.includes('data-fub-source="MrSellers.homes | Fort Lee Real Estate Page | Seller"'));
  assert.ok(html.includes('data-fub-tags="Market Page Lead,Town: Fort Lee,Intent: Buyer"'));
  assert.ok(html.includes('data-fub-tags="Market Page Lead,Town: Fort Lee,Intent: Seller"'));
  assert.ok(html.includes('Been thinking about buying in Fort Lee?'));
  assert.ok(html.includes('Been thinking about selling your home in Fort Lee?'));
  assert.ok(html.includes('Honest feedback on the moves you'));
  // No em-dashes anywhere in the rendered CTAs
  assert.ok(!html.includes('—'));
  assert.ok(!html.includes('&mdash;'));
});

test('renderCtas renders two forms with class lead-form', () => {
  const html = renderCtas({ townName: 'Fort Lee' });
  const matches = (html.match(/class="lead-form"/g) || []).length;
  assert.equal(matches, 2);
});

test('renderFooter shows month, NJ MLS attribution, methodology note, and towns link', () => {
  const html = renderFooter({ monthYear: 'April 2026' });
  assert.ok(html.includes('Last updated: April 2026'));
  assert.ok(html.includes('href="/towns/"'));
  // NJ MLS is the authoritative source - Redfin must NOT appear
  assert.ok(html.includes('NJ MLS'));
  assert.ok(!html.includes('Redfin'));
  // Honest absence of $/sqft is a feature
  assert.ok(html.includes('square footage'));
  // Future-update guidance
  assert.ok(html.includes('Next update'));
});

test('renderSub10Placeholder shows the actual SF activity', () => {
  const html = renderSub10Placeholder({
    townName: 'Teterboro',
    threeMonthBlend: { medianSalePrice: 500000, homesSold: 4, saleToList: 0.95 },
    periodLabel: 'the last 6 months ending April 2026'
  });
  assert.ok(html.includes('Teterboro'));
  // Count appears in the heading text "4 single-family homes" and in the list
  assert.ok(html.includes('4 single-family homes') || html.includes('>4<'));
  assert.ok(html.includes('$500,000'));
  assert.ok(html.includes('95.0%'));
  // Inline form was removed - CTAs at bottom handle lead capture
  assert.ok(!html.includes('class="lead-form'));
});

test('renderTownPage produces valid HTML with all sections', () => {
  const html = renderTownPage({
    townName: 'Fort Lee', townSlug: 'fort-lee', monthYear: 'May 2026',
    canonicalUrl: 'https://mrsellers.homes/fort-lee-real-estate/',
    metaDescription: 'Fort Lee market summary.',
    ogImageUrl: 'https://mrsellers.homes/assets/og/fort-lee.png',
    townData: {
      medianSalePrice: 890000,
      medianPpsf: 487,
      homesSold: 47,
      saleToList: 0.992,
      monthsOfSupply: 5.0
    },
    propertyTypes: { singleFamily: { medianSalePrice: 1400000, medianPpsf: 542, homesSold: 12 } },
    aiParagraph: 'Fort Lee is sitting in a balanced spot right now.',
    aiParagraphFallback: false,
    schoolsData: { schools: [], schoolCount: 0 },
    schoolsSummary: '',
    content: { videos: [], blogs: [], aboutText: '' },
    sub10: null
  });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(html.includes('Fort Lee Real Estate'));
  assert.ok(html.includes('$890,000'));
  assert.ok(html.includes('What this means right now'));
  assert.ok(html.includes('class="town-ctas"'));
  assert.ok(html.includes('/css/town-page.css'));
  assert.ok(html.includes('/js/fub-submit.js'));
  // Schema.org markup present
  assert.ok(html.includes('"@type":"RealEstateAgent"'));
});

test('renderTownPage swaps stat tiles for sub10 placeholder when SF is thin', () => {
  const html = renderTownPage({
    townName: 'Teterboro', townSlug: 'teterboro', monthYear: 'May 2026',
    canonicalUrl: 'https://mrsellers.homes/teterboro-real-estate/',
    metaDescription: 'Teterboro market summary.',
    townData: {},
    propertyTypes: {},
    aiParagraph: 'Test commentary on Teterboro April activity.',
    schoolsData: { schools: [], schoolCount: 0 },
    content: {},
    sub10: { medianSalePrice: 500000, homesSold: 4, saleToList: 0.95 }
  });
  // Sub-10 placeholder section renders
  assert.ok(html.includes('class="sub10-placeholder"'));
  assert.ok(html.includes('Teterboro'));
  // Stat tiles + data table are suppressed in sub-10 mode
  assert.ok(!html.includes('class="stat-tiles"'));
  assert.ok(!html.includes('class="data-table-section"'));
  // BUT What This Means card stays visible - the visitor gets Tyler's
  // interpretation regardless of headline volume.
  assert.ok(html.includes('class="what-this-means'));
  assert.ok(html.includes('Test commentary on Teterboro April activity.'));
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
