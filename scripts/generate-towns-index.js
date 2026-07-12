// Generate towns/index.html: the all-70-towns directory with a type-to-filter
// box, the clickable county map, and a letter-grouped alphabetical grid.
// Rerun whenever bergen-towns.json or the map changes: npm run generate:towns-index

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSiteNav, renderSiteFooter, renderMobileMenuScript } from './lib/render/site-nav.js';
import { TRACKING_HEAD, FONTS_HEAD } from './lib/render/head-common.js';
import { TYLER_AGENT } from './lib/render/agent-entity.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const towns = JSON.parse(readFileSync(resolve(ROOT, 'data/bergen-towns.json'), 'utf8'))
  .slice().sort((a, b) => a.name.localeCompare(b.name));
const mapSvg = readFileSync(resolve(ROOT, 'assets/bergen-county-map.svg'), 'utf8');

const groups = new Map();
for (const t of towns) {
  const letter = t.name[0].toUpperCase();
  if (!groups.has(letter)) groups.set(letter, []);
  groups.get(letter).push(t);
}

const grid = [...groups.entries()].map(([letter, list]) => `
  <div class="letter-group" data-letter="${letter}">
    <h2 class="letter-head">${letter}</h2>
    <div class="letter-towns">
${list.map(t => `      <a class="town-link" href="/${t.pageSlug}/" data-name="${t.name.toLowerCase()}">${t.name}${t.hasGuide ? ' <span class="guide-badge">Guide</span>' : ''}</a>`).join('\n')}
    </div>
  </div>`).join('\n');

const schema = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [TYLER_AGENT, {
    '@type': 'CollectionPage',
    name: 'All 70 Bergen County Towns: Monthly Market Reports',
    url: 'https://mrsellers.homes/towns/',
    author: { '@id': TYLER_AGENT['@id'] }
  }]
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All 70 Bergen County Towns | Market Reports | Tyler Sellers</title>
<meta name="description" content="Every Bergen County town on one page: click the map or browse A to Z. Monthly market reports with real closed sales for all 70 towns, by Tyler Sellers.">
<link rel="canonical" href="https://mrsellers.homes/towns/">
<script type="application/ld+json">${schema}</script>
${FONTS_HEAD}
<link rel="stylesheet" href="/css/blog.css">
<link rel="icon" href="/favicon.png">
${TRACKING_HEAD}
<style>
.towns-main { max-width: 1000px; margin: 0 auto; padding: 40px 20px 72px; }
.towns-head h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(32px, 6vw, 46px); font-weight: 600; line-height: 1.1; }
.towns-head p { margin-top: 10px; color: #555; max-width: 60ch; }
.town-filter { margin-top: 24px; width: 100%; max-width: 420px; padding: 13px 16px; font-size: 16px; border: 1px solid #d8d3cb; border-radius: 6px; background: #fff; font-family: 'DM Sans', sans-serif; }
.town-filter:focus { outline: 2px solid #E2001A; outline-offset: -1px; }
.towns-layout { display: grid; gap: 36px; margin-top: 32px; }
@media (min-width: 900px) { .towns-layout { grid-template-columns: 5fr 4fr; align-items: start; } .map-wrap { position: sticky; top: 20px; order: 2; } }
.map-wrap svg { width: 100%; height: auto; }
.map-hint { font-size: 12px; color: #767676; text-align: center; margin-top: 6px; }
.letter-group { margin-bottom: 22px; }
.letter-head { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: #E2001A; border-bottom: 1px solid #e6e2dc; padding-bottom: 4px; margin-bottom: 10px; }
.letter-towns { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 6px; }
.town-link { display: block; padding: 9px 12px; text-decoration: none; color: #1a1a1a; background: #fff; border: 1px solid #e6e2dc; border-radius: 6px; font-size: 15px; }
.town-link:hover { border-color: #E2001A; color: #E2001A; }
.guide-badge { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #E2001A; border: 1px solid #E2001A; border-radius: 3px; padding: 1px 5px; margin-left: 6px; vertical-align: 1px; }
.no-results { display: none; color: #555; padding: 18px 0; }
@media (max-width: 899px) { .map-wrap details { border: 1px solid #e6e2dc; border-radius: 8px; background: #fff; padding: 10px 14px; } .map-wrap summary { cursor: pointer; font-weight: 500; } }
</style>
</head>
<body class="blog-page">
${renderSiteNav()}
<main class="towns-main">
  <div class="towns-head">
    <h1>Every Bergen County town.\nOne map.</h1>
    <p>All 70 towns, each with a monthly market report built from real closed sales. Click your town on the map, or type it below.</p>
    <input class="town-filter" type="text" placeholder="Type your town..." aria-label="Filter towns" oninput="filterTownLinks(this.value)">
  </div>
  <div class="towns-layout">
    <div class="map-wrap">
      <details open class="map-details"><summary>Bergen County map</summary>
${mapSvg}
      </details>
      <p class="map-hint">Tap a town to open its market report</p>
    </div>
    <div class="grid-wrap">
${grid}
      <p class="no-results">No town by that name in Bergen County. Check the spelling, or ask Tyler.</p>
    </div>
  </div>
</main>
${renderSiteFooter()}
${renderMobileMenuScript()}
<script>
function filterTownLinks(q) {
  q = q.trim().toLowerCase();
  var any = false;
  document.querySelectorAll('.letter-group').forEach(function (g) {
    var vis = 0;
    g.querySelectorAll('.town-link').forEach(function (a) {
      var show = !q || a.getAttribute('data-name').indexOf(q) !== -1;
      a.style.display = show ? '' : 'none';
      if (show) vis++;
    });
    g.style.display = vis ? '' : 'none';
    any = any || vis > 0;
  });
  document.querySelector('.no-results').style.display = any ? 'none' : 'block';
}
</script>
</body>
</html>
`;

mkdirSync(resolve(ROOT, 'towns'), { recursive: true });
writeFileSync(resolve(ROOT, 'towns/index.html'), html.replace('Every Bergen County town.\\nOne map.', 'Every Bergen County town.<br>One map.'));
console.log(`towns/index.html written: ${towns.length} towns, ${groups.size} letter groups.`);
