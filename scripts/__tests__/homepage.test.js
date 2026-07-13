import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = () => readFileSync('index.html', 'utf8');

test('homepage keeps load-bearing anchors', () => {
  for (const id of ['sell', 'buy', 'towns', 'content']) {
    assert.match(html(), new RegExp(`id="${id}"`), `missing #${id}`);
  }
});

test('homepage keeps tracking, compliance, blog markers, JSON-LD', () => {
  const s = html();
  assert.match(s, /G-5VC5MDECPH/);
  assert.match(s, /clarity/);
  assert.match(s, /RE\/MAX Signature Homes/);
  assert.match(s, /blog-latest:start/);
  assert.match(s, /"@type":\s*"RealEstateAgent"/);
  assert.match(s, /css\/site\.css/);
  assert.doesNotMatch(s, /cdn\.tailwindcss\.com/);
});

test('homepage hero copy is the locked v9 copy, no em dashes', () => {
  const s = html();
  assert.match(s, /Sell your home in today&rsquo;s market\?/);
  assert.match(s, /Or wait it out\?/);
  assert.match(s, /been inside(<br[^>]*>)?(&nbsp;| )the houses yours will be compared(&nbsp;| )to/);
  assert.match(s, /Want to run the math on your own house\?/);
  assert.doesNotMatch(s, /—|&mdash;/);
});

test('homepage forms are address-first with distinct sources', () => {
  const s = html();
  assert.match(s, /Homepage \| Seller \(address-first\)/);
  assert.match(s, /Homepage \| Seller \(footer\)/);
  assert.match(s, /address-first\.js/);
  assert.match(s, /smsConsent/);
  assert.match(s, /Teterboro/);
  assert.match(s, /-real-estate\//);  // town links built client-side from names
});

test('sticky bar deferred + contact sheet contract', () => {
  const s = html();
  assert.match(s, /id="stickyCta"[^>]*hidden/);           // hidden by default
  assert.match(s, /id="contactSheet"/);
  assert.match(s, /Homepage \| Seller \(sticky sheet\)/); // sheet form source-tagged
  assert.match(s, /addEventListener\('scroll', check/);    // deferred reveal wired
  assert.match(s, /sms:\+12013080525/);                   // text action
  assert.match(s, /tel:\+12013080525/);                   // call action
  // sheet form carries the verbatim consent language
  const consentCount = (s.match(/Text me real estate info from Mr\. Sellers Homes\./g) || []).length;
  assert.ok(consentCount >= 3, 'consent block on all af-forms incl. sheet');
});
