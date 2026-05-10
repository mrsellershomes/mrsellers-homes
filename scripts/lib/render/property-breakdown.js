// Renders the per-property-type breakdown cards (single-family, multi-family,
// condo). Each type only renders if data is provided; section returns empty
// string if no types qualify.

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString();
}

function card(typeLabel, townName, monthYear, d) {
  return `<article class="property-card">
  <h3>${typeLabel} in ${townName}</h3>
  <p class="property-card-period">${monthYear}</p>
  <ul class="property-card-stats">
    <li><span class="property-card-stat-label">Median sale price</span><span class="property-card-stat-value">${fmtCurrency(d.medianSalePrice)}</span></li>
    <li><span class="property-card-stat-label">Median $/sqft</span><span class="property-card-stat-value">${fmtCurrency(d.medianPpsf)}</span></li>
    <li><span class="property-card-stat-label">Sold this month</span><span class="property-card-stat-value">${d.homesSold ?? '—'}</span></li>
  </ul>
</article>`;
}

export function renderPropertyBreakdown({ townName, monthYear, singleFamily, multiFamily, condo }) {
  const cards = [];
  if (singleFamily) cards.push(card('Single-Family', townName, monthYear, singleFamily));
  if (multiFamily) cards.push(card('Multi-Family (2-4 unit)', townName, monthYear, multiFamily));
  if (condo) cards.push(card('Condo / Co-op', townName, monthYear, condo));
  if (cards.length === 0) return '';
  return `<section class="property-breakdown" aria-label="By property type">
  <h2>By property type</h2>
  <div class="property-cards">${cards.join('')}</div>
</section>`;
}
