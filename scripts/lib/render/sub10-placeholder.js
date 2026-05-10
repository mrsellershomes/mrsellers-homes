// Renders the headline data section when single-family volume in a town is
// too thin for a meaningful median (under 10 closings in the latest month).
// The CTA forms at the bottom of the page handle lead capture; this section
// stays focused on data context.

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return (n * 100).toFixed(digits) + '%';
}

export function renderSub10Placeholder({ townName, threeMonthBlend }) {
  const blend = threeMonthBlend || {};
  const count = blend.homesSold ?? null;
  // Plain-English number
  const countWord = count === 1 ? 'one' : count === 0 ? 'zero' : count == null ? 'fewer than 10' : String(count);

  return `<section class="sub10-placeholder" aria-label="Single-family activity for ${townName}">
  <p class="sub10-eyebrow">Single-family in ${townName}, April 2026</p>
  <h2>Only ${countWord} ${count === 1 ? 'home' : 'homes'} closed last month.</h2>
  <p class="sub10-context">In ${townName}, single-family closings happen sporadically. One month is not a trend, and a single luxury sale would swing any median calculation. Rather than show data that would misrepresent the market, here is what the single-family activity actually was.</p>
  <ul class="three-month-blend" aria-label="Single-family activity">
    <li><span class="blend-label">Single-family closings</span><span class="blend-value">${count ?? 'N/A'}</span></li>
    <li><span class="blend-label">Median sale price</span><span class="blend-value">${fmtCurrency(blend.medianSalePrice)}</span></li>
    <li><span class="blend-label">Sale-to-list ratio</span><span class="blend-value">${blend.saleToList != null ? fmtPct(blend.saleToList) + (blend.saleToList > 1 ? ' (sold over asking)' : blend.saleToList < 1 ? ' (sold under asking)' : ' (sold at asking)') : 'N/A'}</span></li>
  </ul>
</section>`;
}
