// Renders the 5 headline stat tiles for a town page.
// Each tile shows the metric value, a "?" tooltip with plain-English help,
// and a YoY change with directional arrow.

const TOOLTIPS = {
  medianSalePrice: 'Half of homes sold for more than this, half for less. The middle price.',
  medianPpsf: 'How much buyers paid per square foot, typically. Useful for comparing different-sized homes.',
  homesSold: 'How many homes actually closed last month. Small numbers (under 10) get noisy.',
  saleToList: "Average ratio of sale price to asking price. 100% means sellers got asking. Below = buyers had room. Above = bidding wars.",
  monthsOfSupply: "How long it would take to sell every listing if nothing new came on. Under 4 = seller's market. 4 to 6 = balanced. Over 6 = buyer's market."
};

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString();
}

function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(digits) + '%';
}

function fmtNum(n, digits = 1) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}

function arrow(yoy) {
  if (yoy == null || isNaN(yoy)) return '<span class="trend-flat">flat YoY</span>';
  if (Math.abs(yoy) < 0.005) return '<span class="trend-flat">flat YoY</span>';
  if (yoy > 0) return `<span class="trend-up">&uarr; ${(yoy * 100).toFixed(0)}% YoY</span>`;
  return `<span class="trend-down">&darr; ${Math.abs(yoy * 100).toFixed(0)}% YoY</span>`;
}

function tile(label, valueHtml, trendHtml, tooltip, key) {
  return `<div class="stat-tile" data-tile="${key}">
  <div class="stat-tile-header">
    <span class="stat-tile-label">${label}</span>
    <button type="button" class="stat-tile-info" aria-label="${tooltip}" title="${tooltip}">?</button>
  </div>
  <div class="stat-tile-value">${valueHtml}</div>
  <div class="stat-tile-trend">${trendHtml}</div>
</div>`;
}

export function renderStatTiles(d) {
  return `<section class="stat-tiles" aria-label="Headline market metrics">
${tile('Median Sale Price', fmtCurrency(d.medianSalePrice), arrow(d.medianSalePriceYoy), TOOLTIPS.medianSalePrice, 'price')}
${tile('Median $/sqft', fmtCurrency(d.medianPpsf), arrow(d.medianPpsfYoy), TOOLTIPS.medianPpsf, 'ppsf')}
${tile('# of Sales', d.homesSold == null ? '—' : String(d.homesSold), arrow(d.homesSoldYoy), TOOLTIPS.homesSold, 'sales')}
${tile('Sale-to-List', fmtPct(d.saleToList), arrow(d.saleToListYoy), TOOLTIPS.saleToList, 'stl')}
${tile('Months of Supply', fmtNum(d.monthsOfSupply), arrow(d.monthsOfSupplyYoy), TOOLTIPS.monthsOfSupply, 'mos')}
</section>`;
}
