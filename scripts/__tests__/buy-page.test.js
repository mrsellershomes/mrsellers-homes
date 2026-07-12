import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('buy page contract', () => {
  const s = readFileSync('buy/index.html', 'utf8');
  assert.match(s, /Get answers before you get pressured/);
  assert.match(s, /"@type":\s*"FAQPage"/);
  assert.match(s, /Buy Page \| Buyer/);
  assert.match(s, /Buy Page \| Buyer \(footer\)/);
  assert.match(s, /G-5VC5MDECPH/);
  assert.match(s, /RE\/MAX Signature Homes/);
  assert.match(s, /rel="canonical" href="https:\/\/mrsellers\.homes\/buy\/"/);
  assert.match(s, /css\/site\.css/);
  assert.doesNotMatch(s, /—|&mdash;/);
});
