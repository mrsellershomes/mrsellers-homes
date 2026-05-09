import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE_URL = 'https://maps.nj.gov/arcgis/rest/services/Framework/Government_Boundaries/MapServer/2/query?where=COUNTY%3D%27BERGEN%27&outFields=NAME,MUN,MUN_TYPE&returnGeometry=true&outSR=4326&f=geojson';
const CACHE_PATH = resolve('scripts/.cache/bergen-municipalities.geojson');
const OUT_DIR = resolve('assets/silhouettes');
const VIEWBOX_W = 400;
const VIEWBOX_H = 400;
const PADDING = 8;
const BRAND_RED = '#FF1200';
const COUNTY_GRAY = '#E5E5E5';
const STROKE_WHITE = '#FFFFFF';

mkdirSync(resolve('scripts/.cache'), { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

async function loadGeoJSON() {
  if (existsSync(CACHE_PATH)) {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  }
  console.log('Fetching Bergen County municipal boundaries from NJ MapServer...');
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.features || json.features.length === 0) {
    throw new Error('GeoJSON returned no features');
  }
  writeFileSync(CACHE_PATH, JSON.stringify(json));
  console.log(`Cached ${json.features.length} features to ${CACHE_PATH}`);
  return json;
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
  // Compute aspect-preserving scale and offset so the county fits in the viewbox with padding
  const xRange = bounds.maxX - bounds.minX;
  const yRange = bounds.maxY - bounds.minY;
  const drawW = VIEWBOX_W - 2 * PADDING;
  const drawH = VIEWBOX_H - 2 * PADDING;
  const scale = Math.min(drawW / xRange, drawH / yRange);
  const offsetX = PADDING + (drawW - xRange * scale) / 2;
  const offsetY = PADDING + (drawH - yRange * scale) / 2;
  const x = offsetX + (lng - bounds.minX) * scale;
  // Flip Y axis (SVG Y grows downward, geographic Y grows upward)
  const y = offsetY + (bounds.maxY - lat) * scale;
  return [x, y];
}

// Simplify a sequence of projected points by dropping any point closer than
// MIN_PIXEL_GAP from its predecessor. At a 400x400 viewbox this is ~0.5px,
// invisible to the eye but cuts vertex count ~95%.
const MIN_PIXEL_GAP = 1.5;
function simplifyPoints(pts) {
  if (pts.length === 0) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = out[out.length - 1];
    const [x, y] = pts[i];
    if (Math.hypot(x - px, y - py) >= MIN_PIXEL_GAP) out.push([x, y]);
  }
  // Always keep the closing point if the ring has at least 3 points
  if (out.length < pts.length && pts.length >= 3) {
    const last = pts[pts.length - 1];
    const [lx, ly] = out[out.length - 1];
    if (Math.hypot(last[0] - lx, last[1] - ly) > 0.01) out.push(last);
  }
  return out;
}

function ringToPath(ring, bounds) {
  const projected = ring.map(([lng, lat]) => project(lng, lat, bounds));
  const pts = simplifyPoints(projected);
  if (pts.length < 3) return ''; // skip degenerate rings after simplification
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
}

function polygonToPath(rings, bounds) {
  return rings.map(r => ringToPath(r, bounds)).join(' ');
}

function featureToPath(feature, bounds) {
  const g = feature.geometry;
  if (g.type === 'Polygon') return polygonToPath(g.coordinates, bounds);
  if (g.type === 'MultiPolygon') return g.coordinates.map(p => polygonToPath(p, bounds)).join(' ');
  throw new Error(`Unsupported geometry: ${g.type}`);
}

function buildSvg(highlightFeature, allFeatures, bounds) {
  const otherPaths = allFeatures
    .filter(f => f !== highlightFeature)
    .map(f => featureToPath(f, bounds))
    .map(p => `<path d="${p}" fill="${COUNTY_GRAY}" stroke="${STROKE_WHITE}" stroke-width="0.5"/>`)
    .join('');
  const highlightPath = featureToPath(highlightFeature, bounds);
  const ariaName = highlightFeature.properties.NAME || highlightFeature.properties.MUN;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" role="img" aria-label="Bergen County silhouette with ${ariaName} highlighted">${otherPaths}<path d="${highlightPath}" fill="${BRAND_RED}" stroke="${STROKE_WHITE}" stroke-width="0.5"/></svg>`;
}

// Strip type suffix from "Fort Lee Borough" -> "Fort Lee"
function cleanName(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/\s+(Borough|Township|Town|City|Village)\s*$/i, '')
    .trim();
}

const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));
const geo = await loadGeoJSON();
const bounds = getBounds(geo.features);

console.log(`Computed bounds: lng [${bounds.minX.toFixed(4)}, ${bounds.maxX.toFixed(4)}], lat [${bounds.minY.toFixed(4)}, ${bounds.maxY.toFixed(4)}]`);

let count = 0;
const unmatched = [];

for (const town of towns) {
  const townClean = cleanName(town.name).toLowerCase();
  // Try matching cleaned-name on both sides (handles "Washington Township" in bergen-towns
  // vs "Washington Township" in GeoJSON which both clean to "washington")
  let feature = geo.features.find(f => cleanName(f.properties.NAME).toLowerCase() === townClean);
  // Disambiguation: if multiple matches, prefer the one whose raw NAME equals the raw town name
  const all = geo.features.filter(f => cleanName(f.properties.NAME).toLowerCase() === townClean);
  if (all.length > 1) {
    feature = all.find(f => f.properties.NAME === town.name) || all[0];
  }
  if (!feature) {
    unmatched.push(town.name);
    continue;
  }
  const svg = buildSvg(feature, geo.features, bounds);
  writeFileSync(resolve(OUT_DIR, `${town.slug}.svg`), svg);
  count++;
}

console.log(`Generated ${count}/${towns.length} silhouette SVGs`);
if (unmatched.length > 0) {
  console.warn('Unmatched towns:');
  for (const name of unmatched) console.warn(`  - ${name}`);
}
