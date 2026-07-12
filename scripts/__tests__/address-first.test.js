import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('address-first.js contract', () => {
  const js = readFileSync('js/address-first.js', 'utf8');
  assert.match(js, /forms-worker\.tyler-681\.workers\.dev\/lead/);
  assert.match(js, /smsConsent/);
  assert.match(js, /af-form/);
  assert.match(js, /intent: 'Seller'/);
  assert.match(js, /revealStep2/);
});
