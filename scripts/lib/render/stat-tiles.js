// Renders the headline 5-tile strip for the town page. Stats are computed
// over the last 6 months for single-family residential only (per Tyler's
// SF-led positioning). The section is wrapped with an explicit
// "Single-Family Homes" header so a new visitor immediately knows what
// property type the numbers describe.
//
// Each tile has a "?" button that opens a click-toggled tooltip with a
// plain-English explanation. The toggle logic lives in the inline
// mobileMenuScript so no extra JS file is needed.

const TOOLTIPS = {
  medianSalePrice: "Half of homes sold for more than this, half for less. The middle price across the last 6 months.",
  averageSalePrice: "The mathematical average across the last 6 months. When this is much higher than the median, a few high-end sales are pulling it up.",
  homesSold: "How many single-family homes closed in the last 6 months.",
  saleToList: "Median ratio of sale price to last list price across the last 6 months. 100% means sellers got asking on average. Below means buyers had room. Above means bidding wars.",
  medianDom: "Median number of days a single-family home sat on the market before going under contract, across the last 6 months. Lower means a faster market."
};

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return (n * 100).toFixed(digits) + '%';
}

function fmtNum(n, digits = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return Number(n).toFixed(digits);
}

function arrow(yoy) {
  // No YoY trend is shown until we have at least 12 months of accumulated data.
  // Returning empty string suppresses the trend line entirely so the tile shows
  // just the current value without a misleading "flat YoY" caption.
  if (yoy == null || isNaN(yoy)) return '';
  if (Math.abs(yoy) < 0.005) return '<span class="trend-flat">flat YoY</span>';
  if (yoy > 0) return `<span class="trend-up">&uarr; ${(yoy * 100).toFixed(0)}% YoY</span>`;
  return `<span class="trend-down">&darr; ${Math.abs(yoy * 100).toFixed(0)}% YoY</span>`;
}

function tile(label, valueHtml, trendHtml, tooltip, key) {
  // Only render the trend row when there is actual trend content. Empty
  // trend HTML would leave phantom whitespace at the bottom of each tile.
  const trendBlock = trendHtml
    ? `<div class="stat-tile-trend">${trendHtml}</div>`
    : '';
  return `<div class="stat-tile" data-tile="${key}">
  <div class="stat-tile-header">
    <span class="stat-tile-label">${label}</span>
    <span class="stat-tile-info-wrapper">
      <button type="button" class="stat-tile-info" aria-label="Explain ${label}" data-tooltip-trigger>?</button>
      <span class="stat-tile-tooltip" role="tooltip" hidden>${tooltip}</span>
    </span>
  </div>
  <div class="stat-tile-value">${valueHtml}</div>
  ${trendBlock}
</div>`;
}

export function renderStatTiles(d) {
  const tiles = `<div class="stat-tiles" role="list">
${tile('Median Sale Price', fmtCurrency(d.medianSalePrice), arrow(d.medianSalePriceYoy), TOOLTIPS.medianSalePrice, 'price')}
${tile('Average Sale Price', fmtCurrency(d.averageSalePrice), arrow(d.averageSalePriceYoy), TOOLTIPS.averageSalePrice, 'avg')}
${tile('# of Sales', d.homesSold == null ? 'N/A' : String(d.homesSold), arrow(d.homesSoldYoy), TOOLTIPS.homesSold, 'sales')}
${tile('Sale-to-List', fmtPct(d.saleToList), arrow(d.saleToListYoy), TOOLTIPS.saleToList, 'stl')}
${tile('Median Days on Market', d.medianDom == null ? 'N/A' : String(Math.round(d.medianDom)), arrow(d.medianDomYoy), TOOLTIPS.medianDom, 'dom')}
</div>`;
  return `<section class="stat-tiles-section" aria-label="Single-family headline metrics">
  <header class="stat-tiles-header">
    <h2>Single-Family Homes</h2>
  </header>
${tiles}
</section>`;
}
