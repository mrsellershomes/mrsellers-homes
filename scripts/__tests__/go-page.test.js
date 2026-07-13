import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('go page: brand tokens applied, flows untouched', () => {
  const s = readFileSync('go.html', 'utf8');
  assert.match(s, /#E2001A/i);
  assert.match(s, /Playfair Display/);
  assert.match(s, /DM Sans/);
  assert.match(s, /pm-sms-consent/);
  assert.match(s, /b-sms-consent/);
  assert.match(s, /utm/i);
  assert.doesNotMatch(s, /Fraunces/);
});
