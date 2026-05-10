// Renders the per-property-type breakdown cards (single-family, multi-family,
// condo). Each type only renders if data is provided; section returns empty
// string if no types qualify.

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return (n * 100).toFixed(digits) + '%';
}

function card(typeLabel, townName, monthYear, d) {
  return `<article class="property-card">
  <h3>${typeLabel} in ${townName}</h3>
  <p class="property-card-period">${monthYear}</p>
  <ul class="property-card-stats">
    <li><span class="property-card-stat-label">Median sale price</span><span class="property-card-stat-value">${fmtCurrency(d.medianSalePrice)}</span></li>
    <li><span class="property-card-stat-label">Average sale price</span><span class="property-card-stat-value">${fmtCurrency(d.averageSalePrice)}</span></li>
    <li><span class="property-card-stat-label">Sold this month</span><span class="property-card-stat-value">${d.homesSold ?? 'N/A'}</span></li>
    <li><span class="property-card-stat-label">Median sale-to-list</span><span class="property-card-stat-value">${fmtPct(d.saleToList)}</span></li>
  </ul>
</article>`;
}

// Compose a heading that's honest about what's actually in the section.
// "By property type" implies more content when only one card renders. A
// research-heavy visitor reading "By property type" expects multiple
// types, and silence on the others reads as missing data rather than as
// an intentional design choice.
function headingFor(types) {
  if (types.length === 0) return null;
  if (types.length === 3) return 'By property type';
  if (types.length === 2) return `${types.join(' and ')} activity`;
  return `${types[0]} activity`;
}

export function renderPropertyBreakdown({ townName, monthYear, singleFamily, multiFamily, condo }) {
  const cards = [];
  const labels = [];
  if (singleFamily) {
    cards.push(card('Single-Family', townName, monthYear, singleFamily));
    labels.push('Single-family');
  }
  if (multiFamily) {
    cards.push(card('Multi-Family (2-4 unit)', townName, monthYear, multiFamily));
    labels.push('Multi-family');
  }
  if (condo) {
    cards.push(card('Condo / Co-op', townName, monthYear, condo));
    labels.push('Condo and co-op');
  }
  if (cards.length === 0) return '';
  const heading = headingFor(labels);
  return `<section class="property-breakdown" aria-label="${heading} in ${townName}">
  <h2>${heading} in ${townName}</h2>
  <div class="property-cards">${cards.join('')}</div>
</section>`;
}
