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

test('sticky text pill contract (replaced bar + contact sheet)', () => {
  const s = html();
  assert.match(s, /id="textPill"/);
  // sms link hits the Quo line with a pre-typed first line (?& works on iOS and Android)
  assert.match(s, /sms:\+12013080525\?&body=Hi%20Tyler/);
  assert.match(s, /tel:\+12013080525/);                    // hero call action stays
  assert.match(s, /addEventListener\('scroll', check/);    // deferred reveal wired
  // the old bar and sheet must be fully gone, not just hidden
  assert.doesNotMatch(s, /id="stickyCta"|id="contactSheet"|id="sheetBackdrop"|openSheet/);
  // hero + footer af-forms still carry the verbatim consent language
  const consentCount = (s.match(/Text me real estate info from Mr\. Sellers Homes\./g) || []).length;
  assert.ok(consentCount >= 2, 'consent block on remaining af-forms');
});
