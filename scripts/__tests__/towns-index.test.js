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

test('county map svg has 70 clickable towns', () => {
  const svg = readFileSync('assets/bergen-county-map.svg', 'utf8');
  const anchors = svg.match(/<a href="\/[a-z-]+-real-estate\/"/g) || [];
  assert.equal(new Set(anchors).size, 70);
});
