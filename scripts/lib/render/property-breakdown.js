// Renders per-property-type cards. Each card shows 8 metrics computed
// over the 6-month rolling window:
//   1. Median sale price
//   2. Average sale price
//   3. Sold (last 6 months) - the count
//   4. Median sale-to-list ratio
//   5. Lowest sale (bolded - range info)
//   6. Highest sale (bolded - range info)
//   7. % of sales over asking
//   8. Fastest sale (lowest DOM)

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return (n * 100).toFixed(digits) + '%';
}

function fmtDays(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return Math.round(n) + (Math.round(n) === 1 ? ' day' : ' days');
}

function card(typeLabel, townName, periodLabel, d) {
  return `<article class="property-card">
  <h3>${typeLabel} in ${townName}</h3>
  <p class="property-card-period">${periodLabel}</p>
  <ul class="property-card-stats">
    <li><span class="property-card-stat-label">Median sale price</span><span class="property-card-stat-value">${fmtCurrency(d.medianSalePrice)}</span></li>
    <li><span class="property-card-stat-label">Average sale price</span><span class="property-card-stat-value">${fmtCurrency(d.averageSalePrice)}</span></li>
    <li><span class="property-card-stat-label">Sold (last 6 months)</span><span class="property-card-stat-value">${d.homesSold ?? 'N/A'}</span></li>
    <li><span class="property-card-stat-label">Median sale-to-list</span><span class="property-card-stat-value">${fmtPct(d.saleToList)}</span></li>
    <li class="property-card-stat-highlight"><span class="property-card-stat-label">Lowest sale</span><span class="property-card-stat-value">${fmtCurrency(d.lowestSale)}</span></li>
    <li class="property-card-stat-highlight"><span class="property-card-stat-label">Highest sale</span><span class="property-card-stat-value">${fmtCurrency(d.highestSale)}</span></li>
    <li><span class="property-card-stat-label">% sold over asking</span><span class="property-card-stat-value">${fmtPct(d.percentOverAsking, 0)}</span></li>
    <li><span class="property-card-stat-label">Fastest sale</span><span class="property-card-stat-value">${fmtDays(d.fastestSaleDays)}</span></li>
  </ul>
</article>`;
}

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
