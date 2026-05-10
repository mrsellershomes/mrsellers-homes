// The page composer. Pulls every section renderer together into a single
// HTML string for one town page. Conditional rendering happens here:
//   - sub10 placeholder replaces stat tiles + data table + property breakdown
//   - about-town, schools, videos-blogs each render-or-hide based on data
// Tracking codes (Google Analytics, MS Clarity) match index.html / about.html.

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
import { renderSiteNav, renderSiteFooter, renderMobileMenuScript } from './site-nav.js';

const TRACKING_HEAD = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-5VC5MDECPH"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-5VC5MDECPH');</script>
<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w1n2wmq26w");</script>`;

const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">`;

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
  // we replace the stat tiles + data table with the sub-10 placeholder.
  // We KEEP the AI commentary card and the property breakdown - both still
  // matter to the visitor. A condo-heavy town like Fort Lee in a thin SF
  // month should still feel like a substantive page that interprets the
  // data, not a dead end.
  const dataSection = sub10
    ? `${renderSub10Placeholder({ townName, threeMonthBlend: sub10 })}
${renderWhatThisMeans({ aiParagraph, fallback: aiParagraphFallback })}
${renderPropertyBreakdown({ townName, monthYear, ...(propertyTypes || {}) })}`
    : `${renderStatTiles(townData || {})}
${renderWhatThisMeans({ aiParagraph, fallback: aiParagraphFallback })}
${renderDataTable(townData || {})}
${renderPropertyBreakdown({ townName, monthYear, ...(propertyTypes || {}) })}`;

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
${mobileMenu}
<script src="/js/fub-submit.js"></script>
</body>
</html>`;
}
