import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('compiled site.css exists and contains brand tokens', () => {
  assert.ok(existsSync('css/site.css'), 'run: npm run build:css');
  const css = readFileSync('css/site.css', 'utf8');
  assert.match(css, /\.bg-brand/);
  assert.match(css, /#E2001A|#e2001a/i);
  assert.match(css, /Playfair Display/);
});
