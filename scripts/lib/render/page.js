// The page composer. Pulls every section renderer together into a single
// HTML string for one town page. Conditional rendering happens here:
// the sub10 placeholder swaps in for stat tiles and data table when
// single-family volume is too thin; about-town, schools, and videos-blogs
// each render or hide based on whether their data exists.
// Tracking codes (Google Analytics, MS Clarity) match index.html and about.html.

import { renderMeta } from './meta.js';
import { renderHero } from './hero.js';
import { renderStatTiles } from './stat-tiles.js';
import { renderWhatThisMeans } from './what-this-means.js';
import { renderDataTable } from './data-table.js';
import { renderPropertyBreakdown } from './property-breakdown.js';
import { renderAboutTown } from './about-town.js';
import { renderSchools } from './schools.js';
import { renderVideosBlogs } from './videos-blogs.js';
import { renderCtas } from './ctas.js';
import { renderFooter } from './footer.js';
import { renderSub10Placeholder } from './sub10-placeholder.js';
import { renderNeighbors } from './neighbors.js';
import { renderPriceDistribution } from './price-distribution.js';
import { renderSiteNav, renderSiteFooter, renderMobileMenuScript } from './site-nav.js';

import { TRACKING_HEAD, FONTS_HEAD } from './head-common.js';

export function renderTownPage(ctx) {
  const {
    townName, townSlug, monthYear, canonicalUrl, metaDescription, ogImageUrl,
    townData, propertyTypes, aiParagraph, aiParagraphFallback,
    schoolsData, schoolsSummary, content, sub10, neighbors
  } = ctx;

  const meta = renderMeta({ townName, townSlug, monthYear, metaDescription, canonicalUrl, ogImageUrl });
  const nav = renderSiteNav();
  const hero = renderHero({ townName, townSlug, monthYear });
  const neighborsStrip = renderNeighbors({ townName, neighbors });

  // When SF volume is too thin for a meaningful headline (sub-10 trigger),
  // we replace the stat tiles and data table with the sub-10 placeholder.
  // We keep the AI commentary card and the property breakdown because both
  // still matter to the visitor. A condo-heavy town like Fort Lee in a
  // thin SF month should still feel like a substantive page that
  // interprets the data, not a dead end.
  const periodLabel = ctx.periodLabel || `the last 6 months ending ${monthYear}`;
  // Price distribution histogram for SF, placed between the stat tiles and
  // the AI commentary. Buyers see the headline numbers, then the visual
  // distribution, then Tyler's interpretation. Hidden in sub10 mode since
  // we do not have enough SF sample to build a meaningful histogram.
  const priceDist = !sub10 && townData?.salePrices?.length >= 3
    ? renderPriceDistribution({
        prices: townData.salePrices,
        townName,
        propertyTypeLabel: 'Single-family',
        variant: 'wide'
      })
    : '';

  const notableBuildings = content?.notableBuildings || {};
  const dataSection = sub10
    ? `${renderSub10Placeholder({ townName, threeMonthBlend: sub10, periodLabel })}
${renderWhatThisMeans({ aiParagraph, fallback: aiParagraphFallback })}
${renderPropertyBreakdown({ townName, monthYear: periodLabel, notableBuildings, ...(propertyTypes || {}) })}`
    : `${renderStatTiles(townData || {})}
${priceDist}
${renderWhatThisMeans({ aiParagraph, fallback: aiParagraphFallback })}
${renderDataTable(townData || {})}
${renderPropertyBreakdown({ townName, monthYear: periodLabel, notableBuildings, ...(propertyTypes || {}) })}`;

  const aboutTown = renderAboutTown({ townName, aboutText: content?.aboutText || '' });
  const schools = renderSchools({ townName, schoolsData, summarySentence: schoolsSummary });
  const videosBlogs = renderVideosBlogs({ townName, videos: content?.videos || [], blogs: content?.blogs || [] });
  const ctas = renderCtas({ townName });
  const townFooter = renderFooter({ monthYear });
  const siteFooter = renderSiteFooter();
  const mobileMenu = renderMobileMenuScript();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${meta}
${FONTS_HEAD}
<link rel="stylesheet" href="/css/town-page.css">
<link rel="icon" href="/favicon.png">
${TRACKING_HEAD}
</head>
<body class="town-page">
${nav}
<main class="town-page-main">
${hero}
${neighborsStrip}
${dataSection}
${aboutTown}
${schools}
${videosBlogs}
${ctas}
${townFooter}
</main>
${siteFooter}
<div class="chart-tooltip" role="tooltip" hidden>
  <span class="chart-tooltip-primary"></span>
  <span class="chart-tooltip-secondary"></span>
</div>
${mobileMenu}
<script src="/js/fub-submit.js"></script>
</body>
</html>`;
}
