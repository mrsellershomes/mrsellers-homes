// One-time test generator: builds /fort-lee-real-estate/index.html using
// the REAL 6-month-rolling pipeline (data/njmls/*/*.csv -> normalize ->
// aggregate -> render). This is the production data path for Fort Lee
// specifically so Tyler can review production-quality output before we
// generate all 70 town pages in Phase 2.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTownPage } from '../lib/render/page.js';
import { readAllCsvs, dedupeByMls, monthYearLabel, buildPeriodLabel } from '../lib/njmls-csv.js';
import { aggregateTownData } from '../lib/town-data.js';

const schools = JSON.parse(readFileSync(resolve('data/bergen-schools.json'), 'utf8'));
const content = JSON.parse(readFileSync(resolve('data/towns-content.json'), 'utf8'));
const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));

console.log('Reading all NJMLS CSVs from data/njmls/...');
const { rows: rawRows, monthFolders } = readAllCsvs(resolve('data/njmls'));
const rows = dedupeByMls(rawRows);
console.log(`Loaded ${rawRows.length} raw rows, ${rows.length} after MLS-# dedupe`);
console.log(`Window: ${buildPeriodLabel(monthFolders)} (${monthFolders.length} months)`);

const latestMonth = monthFolders[monthFolders.length - 1];
const monthYear = monthYearLabel(latestMonth);
const periodLabel = `the last ${monthFolders.length} months ending ${monthYear}`;

console.log('Aggregating per-town stats...');
const aggregate = aggregateTownData(rows, towns);

const fortLee = aggregate['fort-lee'];
if (!fortLee) {
  console.error('No Fort Lee data computed - check that NJMLS exports include Fort Lee rows.');
  process.exit(1);
}

console.log('Fort Lee:');
console.log('  Single-family closings (6 mo):', fortLee.propertyTypes.singleFamily?.homesSold ?? (fortLee.sub10?.homesSold ?? 0));
console.log('  Condo closings (6 mo):       ', fortLee.propertyTypes.condo?.homesSold ?? 0);
console.log('  Multi-family closings (6 mo):', fortLee.propertyTypes.multiFamily?.homesSold ?? 0);
console.log('  Sub-10 triggered?            ', !!fortLee.sub10);

const town = towns.find(t => t.slug === 'fort-lee');

// Tyler-voice "What this means" paragraph. In production, this is what the
// Claude API generates monthly from the aggregated stats. For now it is
// hand-drafted from the actual computed numbers so Tyler can see what the
// AI section should feel like at full quality.
const sf = fortLee.propertyTypes.singleFamily;
const condo = fortLee.propertyTypes.condo;
const sfCount = sf?.homesSold ?? fortLee.sub10?.homesSold ?? 0;
const condoCount = condo?.homesSold ?? 0;

let aiParagraph;
if (sf && condo) {
  aiParagraph = `Over the last 6 months in Fort Lee, ${condoCount} condo and co-op closings dominated the activity versus ${sfCount} single-family closings. That ratio is typical for Fort Lee, where the housing stock is heavily weighted toward Hudson River-view buildings like Plaza Towers, Mediterranean Towers, Atrium Palace, and Hudson Lights. The condo market is the everyday market here. Single-family inventory is sparse, and when an SF home does come up it tends to draw competitive offers, but the volume is too thin for a typical buyer to count on month-to-month availability.`;
} else if (condo && !sf) {
  aiParagraph = `Over the last 6 months in Fort Lee, ${condoCount} condo and co-op closings carried the market. Single-family activity was too thin over this window to feature as a headline stat, which is typical for Fort Lee: the housing stock is heavily weighted toward Hudson River-view buildings like Plaza Towers, Mediterranean Towers, Atrium Palace, and Hudson Lights. The condo and co-op market is the everyday market here.`;
} else {
  aiParagraph = '';
}

// Geographic neighbors for the comparison strip.
const neighbors = [
  { name: 'Cliffside Park', slug: 'cliffside-park' },
  { name: 'Edgewater', slug: 'edgewater' },
  { name: 'Englewood Cliffs', slug: 'englewood-cliffs' },
  { name: 'Leonia', slug: 'leonia' },
  { name: 'Palisades Park', slug: 'palisades-park' }
];

const ctx = {
  townName: town.name,
  townSlug: town.slug,
  monthYear,
  periodLabel,
  canonicalUrl: `https://mrsellers.homes/${town.pageSlug}/`,
  metaDescription: `${town.name} NJ real estate market for the last 6 months: condo, single-family, and multi-family activity with school data and an honest read from a Bergen County agent.`,
  ogImageUrl: `https://mrsellers.homes/assets/og/${town.slug}.png`,
  townData: fortLee.townData,
  propertyTypes: fortLee.propertyTypes,
  aiParagraph,
  aiParagraphFallback: false,
  schoolsData: schools[town.slug] || { schools: [], schoolCount: 0 },
  schoolsSummary: '',
  content: content[town.slug] || { videos: [], blogs: [], aboutText: '' },
  sub10: fortLee.sub10,
  neighbors
};

const html = renderTownPage(ctx);
mkdirSync(resolve('fort-lee-real-estate'), { recursive: true });
writeFileSync(resolve('fort-lee-real-estate/index.html'), html);
console.log(`Wrote fort-lee-real-estate/index.html (${html.length} bytes)`);
