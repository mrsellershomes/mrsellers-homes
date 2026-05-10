// One-time test generator: builds /fort-lee-real-estate/index.html using
// hardcoded April 2026 Redfin data so Tyler can review the entire page
// design (hero, stats, AI paragraph slot, data table, property breakdown,
// schools, video, CTAs) before we wire up the full Redfin pipeline.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTownPage } from '../lib/render/page.js';

const schools = JSON.parse(readFileSync(resolve('data/bergen-schools.json'), 'utf8'));
const content = JSON.parse(readFileSync(resolve('data/towns-content.json'), 'utf8'));

// Hardcoded Fort Lee data from the actual Redfin city tracker for March 2026
// (the most recent month available at session time). All YoY/MoM are decimals
// in source format - multiply by 100 for percent display.
const ctx = {
  townName: 'Fort Lee',
  townSlug: 'fort-lee',
  monthYear: 'March 2026',
  canonicalUrl: 'https://mrsellers.homes/fort-lee-real-estate/',
  metaDescription: 'Fort Lee real estate market for March 2026: median sale price, sales volume, days on market, and what it means for buyers and sellers right now.',
  ogImageUrl: 'https://mrsellers.homes/assets/og/fort-lee.png',
  townData: {
    medianSalePrice: 390000, medianSalePriceMom: -0.0064, medianSalePriceYoy: -0.1024,
    medianListPrice: 450000, medianListPriceMom: 0.149, medianListPriceYoy: 0.0135,
    medianPpsf: 456, medianPpsfMom: -0.0242, medianPpsfYoy: 0.0209,
    homesSold: 47, homesSoldMom: 0.237, homesSoldYoy: -0.06,
    newListings: 80, newListingsMom: 0.818, newListingsYoy: 0.111,
    pendingSales: 52, pendingSalesMom: 0.106, pendingSalesYoy: -0.071,
    inventory: 233, inventoryMom: 0.079, inventoryYoy: 0.183,
    monthsOfSupply: 5.0, monthsOfSupplyMom: -0.7, monthsOfSupplyYoy: 1.1,
    medianDom: 122, medianDomMom: 1.0, medianDomYoy: 0.34,
    saleToList: 0.992, saleToListMom: 0.01, saleToListYoy: 0.0035,
    soldAboveList: 0.319, soldAboveListMom: 0.082, soldAboveListYoy: 0.099,
    priceDrops: 0.107, priceDropsMom: 0.024, priceDropsYoy: 0.021,
    offMarketInTwoWeeks: 0.404, offMarketInTwoWeeksMom: 0.085, offMarketInTwoWeeksYoy: 0.082
  },
  propertyTypes: {
    singleFamily: { medianSalePrice: 1400000, medianPpsf: 542, homesSold: 12 },
    multiFamily: { medianSalePrice: 950000, medianPpsf: 380, homesSold: 8 },
    condo: { medianSalePrice: 600000, medianPpsf: 450, homesSold: 25 }
  },
  aiParagraph: 'Fort Lee is sitting in a balanced spot right now. Median sale prices are off about 10% from last year, but homes are still trading right at asking on average. The town has about 5 months of inventory, enough that buyers do not have to write panicked offers anymore. Condos here are doing their own thing - see the breakdown below.',
  aiParagraphFallback: false,
  schoolsData: schools['fort-lee'] || { schools: [], schoolCount: 0 },
  schoolsSummary: 'Fort Lee public schools serve about 2,200 students across 6 schools, with state assessment results trending well above the New Jersey average in both math and reading.',
  content: content['fort-lee'] || { videos: [], blogs: [], aboutText: '' },
  sub10: null
};

const html = renderTownPage(ctx);
mkdirSync(resolve('fort-lee-real-estate'), { recursive: true });
writeFileSync(resolve('fort-lee-real-estate/index.html'), html);
console.log('Wrote fort-lee-real-estate/index.html (' + html.length + ' bytes)');
