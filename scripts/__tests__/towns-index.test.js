import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('towns index contract', () => {
  const s = readFileSync('towns/index.html', 'utf8');
  const links = s.match(/href="\/[a-z-]+-real-estate\/"/g) || [];
  assert.ok(new Set(links).size >= 70, `expected 70+ distinct town links, got ${new Set(links).size}`);
  assert.match(s, /rel="canonical" href="https:\/\/mrsellers\.homes\/towns\/"/);
  assert.match(s, /town-shape/);
  assert.match(s, /G-5VC5MDECPH/);
  assert.match(s, /RE\/MAX Signature Homes/);
  assert.doesNotMatch(s, /—|&mdash;/);
});

test('towns index carries the shared map preview card', () => {
  const s = readFileSync('towns/index.html', 'utf8');
  // Every slot county-map.js writes into must exist, or the preview silently no-ops.
  for (const id of ['countyMap', 'mapTownName', 'msMedian', 'msMedianL', 'msSold',
                    'msSoldL', 'msPct', 'msPctL', 'mapPeriod', 'mapCta']) {
    assert.match(s, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.match(s, /src="\/js\/county-map\.js"/);
  assert.match(s, /class="hint-hover"/);
  assert.match(s, /class="hint-touch hidden"/);
  // The SVG is inlined here, so the module must NOT try to fetch one.
  assert.doesNotMatch(s, /data-map-src/);
  // Idle CTA points at this page's own A-Z grid.
  assert.match(s, /id="mapCta" href="#townsGrid"/);
  assert.match(s, /id="townsGrid"/);
});

test('homepage and towns page share one map implementation', () => {
  const home = readFileSync('index.html', 'utf8');
  assert.match(home, /src="\/js\/county-map\.js"/);
  assert.match(home, /id="countyMap" data-map-src="\/assets\/bergen-county-map\.svg"/);
  // The old inline copy must be gone: two copies is what caused the WebKit bug.
  assert.doesNotMatch(home, /window\.__showTownOnMap = showTown/);
});

test('shared map module sizes the svg the way WebKit needs', () => {
  const js = readFileSync('js/county-map.js', 'utf8');
  assert.match(js, /svg\.style\.width = '100%'/);
  assert.match(js, /svg\.style\.height = 'auto'/);
  // width:auto + height:100% is the exact pair that renders 0x0 on iOS.
  assert.doesNotMatch(js, /style\.width = 'auto'/);
  assert.doesNotMatch(js, /style\.height = '100%'/);
});

test('county map svg has 70 clickable towns', () => {
  const svg = readFileSync('assets/bergen-county-map.svg', 'utf8');
  const anchors = svg.match(/<a href="\/[a-z-]+-real-estate\/"/g) || [];
  assert.equal(new Set(anchors).size, 70);
});
