import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSlug, toPageSlug, toUrlPath } from '../lib/slug.js';

test('toSlug handles simple town names', () => {
  assert.equal(toSlug('Fort Lee'), 'fort-lee');
  assert.equal(toSlug('Ridgewood'), 'ridgewood');
});

test('toSlug handles hyphenated towns', () => {
  assert.equal(toSlug('Wood-Ridge'), 'wood-ridge');
  assert.equal(toSlug('Ho-Ho-Kus'), 'ho-ho-kus');
});

test('toSlug strips apostrophes', () => {
  assert.equal(toSlug("Tylers Town"), 'tylers-town');
});

test('toPageSlug appends -real-estate', () => {
  assert.equal(toPageSlug('Fort Lee'), 'fort-lee-real-estate');
});

test('toUrlPath returns leading-slash trailing-slash path', () => {
  assert.equal(toUrlPath('Fort Lee'), '/fort-lee-real-estate/');
});
