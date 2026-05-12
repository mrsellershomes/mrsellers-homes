// Renders per-property-type cards beneath the headline stat tiles.
// Layout philosophy: each card should read like a small market brief, not
// a spreadsheet row. The median sale price is the visual hero; everything
// else supports it. Range and average are pulled inline with the headline
// so the eye reads "median, context, secondary metrics, chart."

import { renderPriceDistribution } from './price-distribution.js';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return '$' + Math.round(n).toLocaleString();
}

function fmtCurrencyShort(n) {
  // Compact for inline contexts: $1.1M, $750K, $4.2M
  if (n == null || isNaN(n)) return 'N/A';
  if (n >= 1000000) {
    const m = n / 1000000;
    return '$' + (m === Math.floor(m) ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (n >= 1000) {
    return '$' + Math.round(n / 1000) + 'K';
  }
  return '$' + Math.round(n);
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return (n * 100).toFixed(digits) + '%';
}

function fmtDays(n) {
  if (n == null || isNaN(n)) return 'N/A';
  const d = Math.round(n);
  return d + (d === 1 ? ' day' : ' days');
}

function card(typeLabel, townName, periodLabel, d, opts = {}) {
  const includeHistogram = opts.includeHistogram !== false;
  const note = opts.note || '';

  const histogram = (includeHistogram && d.salePrices && d.salePrices.length >= 3)
    ? renderPriceDistribution({
        prices: d.salePrices,
        townName,
        propertyTypeLabel: typeLabel,
        variant: 'compact'
      })
    : '';

  const noteHtml = note ? `<p class="property-card-note">${note}</p>` : '';

  // Headline-context line: average and range pulled inline as supporting
  // detail under the dominant median number. Short-form currency keeps it
  // compact.
  const headlineContext = `Average ${fmtCurrencyShort(d.averageSalePrice)} &middot; Range ${fmtCurrencyShort(d.lowestSale)} to ${fmtCurrencyShort(d.highestSale)}`;

  return `<article class="property-card">
  <header class="property-card-head">
    <h3>${typeLabel}</h3>
    <p class="property-card-meta">${periodLabel} &middot; ${d.homesSold ?? 0} ${d.homesSold === 1 ? 'closing' : 'closings'}</p>
  </header>
  <div class="property-card-headline">
    <p class="property-card-headline-label">Median sale price</p>
    <p class="property-card-headline-value">${fmtCurrency(d.medianSalePrice)}</p>
    <p class="property-card-headline-context">${headlineContext}</p>
  </div>
  <dl class="property-card-metrics">
    <div class="property-metric">
      <dt>Sale-to-list</dt>
      <dd>${fmtPct(d.saleToList)}</dd>
    </div>
    <div class="property-metric">
      <dt>Sold over list</dt>
      <dd>${fmtPct(d.percentOverAsking, 0)}</dd>
    </div>
    <div class="property-metric">
      <dt>Fastest sale</dt>
      <dd>${fmtDays(d.fastestSaleDays)}</dd>
    </div>
  </dl>
  ${noteHtml}
  ${histogram}
</article>`;
}

const CONDO_TOWNHOUSE_NOTE = 'Includes apartment-style condos, fee-simple townhouses, and new-construction side-by-side duplexes (which agents sometimes list as either type).';
const COOP_NOTE = 'Co-ops are share ownership rather than fee-simple, with board approval and stricter financing requirements. Lower prices, but a different product than condos.';

// Build an Oxford-comma list of building names.
function listJoin(items) {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

// Append a "Notable buildings include..." sentence to the base note when
// Tyler has curated a list in towns-content.json under
// notableBuildings.coop or notableBuildings.condoTownhouse.
function buildNote(baseNote, townName, buildings, label) {
  if (!buildings || buildings.length === 0) return baseNote;
  const buildingsSentence = `Notable ${townName} ${label} include ${listJoin(buildings)}.`;
  return baseNote ? `${baseNote} ${buildingsSentence}` : buildingsSentence;
}

export function renderPropertyBreakdown({ townName, monthYear, singleFamily, multiFamily, condoTownhouse, coop, notableBuildings = {} }) {
  const cards = [];
  if (singleFamily) {
    cards.push(card('Single-Family', townName, monthYear, singleFamily, { includeHistogram: false }));
  }
  if (multiFamily) {
    cards.push(card('Multi-Family (2-4 unit)', townName, monthYear, multiFamily));
  }
  if (condoTownhouse) {
    const note = buildNote(CONDO_TOWNHOUSE_NOTE, townName, notableBuildings.condoTownhouse, 'condo and townhouse buildings');
    cards.push(card('Condo & Townhouse', townName, monthYear, condoTownhouse, { note }));
  }
  if (coop) {
    const note = buildNote(COOP_NOTE, townName, notableBuildings.coop, 'co-op buildings');
    cards.push(card('Co-op', townName, monthYear, coop, { note }));
  }
  if (cards.length === 0) return '';

  return `<section class="property-breakdown" aria-label="${townName} market by property type">
  <header class="property-breakdown-head">
    <h2>What else is moving in ${townName}</h2>
    <p class="property-breakdown-sub">Each property type tells its own story. The Single-Family card sets the headline above; these break down the rest of the market.</p>
  </header>
  <div class="property-cards">${cards.join('')}</div>
</section>`;
}
