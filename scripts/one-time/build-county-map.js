// Build ONE clickable Bergen County SVG map: every municipality is an <a>
// wrapping its boundary path, linking to /<pageSlug>/. Reuses the cached
// NJ MapServer GeoJSON and the projection approach from build-silhouettes.js.
//
// Usage: node scripts/one-time/build-county-map.js
// Output: assets/bergen-county-map.svg

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CACHE_PATH = resolve('scripts/.cache/bergen-municipalities.geojson');
const OUT_PATH = resolve('assets/bergen-county-map.svg');
const VIEWBOX_W = 700;
const VIEWBOX_H = 860;
const PADDING = 10;
const MIN_PIXEL_GAP = 1.2;

const geo = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));

function cleanName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/\s+(Borough|Township|Town|City|Village)\s*$/i, '').trim();
}

const bySlugName = new Map(towns.map(t => [t.name.toLowerCase(), t]));
// NJ data name quirks -> bergen-towns.json names
const ALIASES = new Map([
  ['east rutherford', 'east rutherford'],
  ['ho-ho-kus', 'ho-ho-kus'],
  ['hohokus', 'ho-ho-kus'],
  ['washington', 'washington township']
]);

function townFor(feature) {
  const clean = cleanName(feature.properties.NAME || feature.properties.MUN).toLowerCase();
  const aliased = ALIASES.get(clean) || clean;
  return bySlugName.get(aliased) || null;
}

function getBounds(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const coords = f.geometry.coordinates.flat(Infinity);
    for (let i = 0; i < coords.length; i += 2) {
      const x = coords[i], y = coords[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function project(lng, lat, bounds) {
  const xRange = bounds.maxX - bounds.minX;
  const yRange = bounds.maxY - bounds.minY;
  const drawW = VIEWBOX_W - 2 * PADDING;
  const drawH = VIEWBOX_H - 2 * PADDING;
  const scale = Math.min(drawW / xRange, drawH / yRange);
  const offsetX = PADDING + (drawW - xRange * scale) / 2;
  const offsetY = PADDING + (drawH - yRange * scale) / 2;
  return [offsetX + (lng - bounds.minX) * scale, offsetY + (bounds.maxY - lat) * scale];
}

function simplifyPoints(pts) {
  if (pts.length === 0) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = out[out.length - 1];
    const [x, y] = pts[i];
    if (Math.hypot(x - px, y - py) >= MIN_PIXEL_GAP) out.push([x, y]);
  }
  if (out.length < pts.length && pts.length >= 3) {
    const last = pts[pts.length - 1];
    const [lx, ly] = out[out.length - 1];
    if (Math.hypot(last[0] - lx, last[1] - ly) > 0.01) out.push(last);
  }
  return out;
}

function ringToPath(ring, bounds) {
  const pts = simplifyPoints(ring.map(([lng, lat]) => project(lng, lat, bounds)));
  if (pts.length < 3) return '';
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
}

function featureToPath(feature, bounds) {
  const g = feature.geometry;
  const poly = rings => rings.map(r => ringToPath(r, bounds)).join(' ');
  if (g.type === 'Polygon') return poly(g.coordinates);
  if (g.type === 'MultiPolygon') return g.coordinates.map(poly).join(' ');
  throw new Error(`Unsupported geometry: ${g.type}`);
}

const bounds = getBounds(geo.features);
let matched = 0;
const shapes = geo.features.map(f => {
  const town = townFor(f);
  const d = featureToPath(f, bounds);
  if (!town) {
    console.warn(`No town match for feature: ${f.properties.NAME}`);
    return `<path d="${d}" class="town-shape town-shape-unlinked"/>`;
  }
  matched++;
  return `<a href="/${town.pageSlug}/" aria-label="${town.name} real estate market report"><path d="${d}" class="town-shape"><title>${town.name}</title></path></a>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" role="img" aria-label="Clickable map of all 70 Bergen County towns">
<style>
.town-shape { fill: #ddd3be; stroke: #ffffff; stroke-width: 1.2; transition: fill 0.2s ease; cursor: pointer; }
a:hover .town-shape, a:focus .town-shape { fill: #E2001A; }
</style>
${shapes}
</svg>
`;
writeFileSync(OUT_PATH, svg);
console.log(`Wrote ${OUT_PATH}: ${matched}/70 towns linked, ${geo.features.length} features.`);
