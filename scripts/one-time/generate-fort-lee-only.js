// One-time test generator: builds /fort-lee-real-estate/index.html using
// REAL April 2026 NJMLS Custom Export data (computed from the 4 CSVs in
// data/njmls/2026-04/) so Tyler can see the page as a research-heavy
// visitor would.
//
// Fort Lee April 2026 reality:
//   Single-Family: 1 sale ($1.34M, 24 DOM, 101.2% sale-to-list)
//   Condo/Coop/Townhouse: 45 sales ($455K median, $591K avg, 98.2% S2L, 34 DOM)
//   2-4 Family: 0 sales

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTownPage } from '../lib/render/page.js';

const schools = JSON.parse(readFileSync(resolve('data/bergen-schools.json'), 'utf8'));
const content = JSON.parse(readFileSync(resolve('data/towns-content.json'), 'utf8'));

const ctx = {
  townName: 'Fort Lee',
  townSlug: 'fort-lee',
  monthYear: 'April 2026',
  canonicalUrl: 'https://mrsellers.homes/fort-lee-real-estate/',
  metaDescription: 'Fort Lee NJ real estate market for April 2026: condo and co-op activity, single-family context, school data, and an honest read from a Bergen County agent.',
  ogImageUrl: 'https://mrsellers.homes/assets/og/fort-lee.png',

  townData: {},

  propertyTypes: {
    singleFamily: null,
    multiFamily: null,
    condo: {
      medianSalePrice: 455000,
      averageSalePrice: 590886,
      homesSold: 45,
      saleToList: 0.982
    }
  },

  // Tyler-voice paragraph specific to Fort Lee April 2026. In production the
  // AI generator writes this monthly; for tonight's preview it's hand-drafted
  // so Tyler can see what the AI section should feel like at full quality.
  aiParagraph: `April in Fort Lee was almost entirely a condo and co-op story. There were 45 condo closings versus a single SF closing. That ratio is not unusual here. Fort Lee&rsquo;s housing stock skews heavily to Hudson River-view condo buildings like Plaza Towers, Mediterranean Towers, Atrium Palace, Hudson Lights, and the older Towers complexes, so a typical month sees most of the volume on the condo side. Condos closed at a median of $455K with sellers getting 98.2% of asking on average. That is a balanced market where buyers are paying close to list but are not chasing aggressively. The one SF closing went above asking at 101.2% sale-to-list, which fits the broader pattern: when an SF home does come up in Fort Lee, the small inventory drives competitive offers, but the months where one comes up at all are the exception.`,
  aiParagraphFallback: false,

  schoolsData: schools['fort-lee'] || { schools: [], schoolCount: 0 },
  // Pass empty so the schools renderer auto-builds a numerically specific
  // summary from the raw data (69% ELA / 72% Math vs state 52% / 40%).
  schoolsSummary: '',
  content: content['fort-lee'] || { videos: [], blogs: [], aboutText: '' },

  sub10: {
    medianSalePrice: 1340000,
    homesSold: 1,
    saleToList: 1.012
  },

  // Geographically adjacent Fort Lee neighbors. In production this comes
  // from a `neighbors` field in data/bergen-towns.json.
  neighbors: [
    { name: 'Cliffside Park', slug: 'cliffside-park' },
    { name: 'Edgewater', slug: 'edgewater' },
    { name: 'Englewood Cliffs', slug: 'englewood-cliffs' },
    { name: 'Leonia', slug: 'leonia' },
    { name: 'Palisades Park', slug: 'palisades-park' }
  ]
};

const html = renderTownPage(ctx);
mkdirSync(resolve('fort-lee-real-estate'), { recursive: true });
writeFileSync(resolve('fort-lee-real-estate/index.html'), html);
console.log('Wrote fort-lee-real-estate/index.html (' + html.length + ' bytes)');
console.log('SF: 1 sale (sub-10 triggered)');
console.log('Condo: 45 sales (card renders)');
console.log('MF: 0 sales (card suppressed)');
console.log('Neighbors strip: 5 nearby towns');
console.log('AI commentary card: rendered with Fort Lee April voice paragraph');
