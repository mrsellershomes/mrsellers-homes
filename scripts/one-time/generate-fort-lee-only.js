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

// Show RAW counts so we never mislead about whether sales exist. The
// "card rendered?" flag tells us if the card cleared the >=6 threshold.
console.log('Fort Lee raw counts (6 mo):');
const rc = fortLee.rawCounts;
const pt = fortLee.propertyTypes;
const fmt = (count, type) => {
  const rendered = pt[type] ? 'card renders' : 'below threshold, card hidden';
  return `${String(count).padStart(4)} (${rendered})`;
};
console.log(`  Single-family       : ${fmt(rc.singleFamily, 'singleFamily')}`);
console.log(`  Multi-family        : ${fmt(rc.multiFamily, 'multiFamily')}`);
console.log(`  Condo + Townhouse   : ${fmt(rc.condoTownhouse, 'condoTownhouse')}`);
console.log(`  Co-op               : ${fmt(rc.coop, 'coop')}`);
console.log(`  Sub-threshold SF?   : ${fortLee.sub10 ? 'YES (headline replaced with placeholder)' : 'NO'}`);

const town = towns.find(t => t.slug === 'fort-lee');

// Tyler-voice "What this means" paragraph. In production, this is what the
// Claude API generates monthly from the aggregated stats. For now it is
// hand-drafted from the actual computed numbers so Tyler can see what the
// AI section should feel like at full quality.
const sf = fortLee.propertyTypes.singleFamily;
const ct = fortLee.propertyTypes.condoTownhouse;
const co = fortLee.propertyTypes.coop;
const mf = fortLee.propertyTypes.multiFamily;
const sfCount = sf?.homesSold ?? fortLee.sub10?.homesSold ?? 0;
const ctCount = ct?.homesSold ?? 0;
const coCount = co?.homesSold ?? 0;
const mfCount = mf?.homesSold ?? 0;

// Hand-drafted Tyler-voice paragraph for Fort Lee. In production the AI
// generator writes this monthly from the aggregated stats; for tonight's
// preview we hand-draft to show what the AI section should feel like at
// full quality once we wire up Claude Haiku in Phase 3.
const aiParagraph = `Over the last 6 months in Fort Lee, the market breaks into four distinct lanes. Co-ops carried the biggest entry-level volume (${coCount} closings at a median around $250K), driven by older buildings like Horizon House and The Plaza. Condos and townhouses combined were the largest attached-housing market (${ctCount} closings) with a wide price range from mid-$200K units up to luxury closings past $2M in buildings like Atrium Palace. Single-family is rare but exists (${sfCount} closings), with a median over $1M and homes that tend to draw strong offers when they come up. Multi-family had ${mfCount} closings, real activity but lower volume than the rest. If you are reading this and trying to figure out which lane fits you, that is the kind of conversation worth having directly.`;

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
