// Renders the full 13-row data table inside a <details> element so it's
// collapsed by default on mobile, expanded by default on desktop (via CSS).

// Metrics derivable from the NJMLS sold-export CSV. Inventory, pending sales,
// new listings, months of supply, and price drops were all dropped because
// they require active-listings data which the monthly export does not include.
// $/sqft was dropped because NJMLS does not auto-populate building square
// footage for residential listings (NJ home rule, 70+ municipal assessor systems).
const ROWS = [
  { key: 'medianSalePrice', label: 'Median Sale Price', fmt: 'currency' },
  { key: 'averageSalePrice', label: 'Average Sale Price', fmt: 'currency' },
  { key: 'medianListPrice', label: 'Median Last List Price', fmt: 'currency' },
  { key: 'homesSold', label: 'Homes Sold', fmt: 'integer' },
  { key: 'medianDom', label: 'Median Days on Market', fmt: 'integer' },
  { key: 'saleToList', label: 'Median Sale-to-List Ratio', fmt: 'percent' },
  { key: 'soldAboveList', label: '% Sold Above Last List', fmt: 'percent' }
];

function format(value, fmt) {
  if (value == null || isNaN(value)) return '—';
  if (fmt === 'currency') return '$' + Math.round(value).toLocaleString();
  if (fmt === 'integer') return Math.round(value).toLocaleString();
  if (fmt === 'decimal') return Number(value).toFixed(1);
  if (fmt === 'percent') return (value * 100).toFixed(1) + '%';
  return String(value);
}

function deltaCell(value, fmt) {
  if (value == null || isNaN(value)) return '<span class="trend-flat">—</span>';
  if (Math.abs(value) < 0.005) return '<span class="trend-flat">flat</span>';
  const isUp = value > 0;
  const cls = isUp ? 'trend-up' : 'trend-down';
  const arrow = isUp ? '&uarr;' : '&darr;';
  const abs = Math.abs(value);
  // Percent metrics get displayed as percentage-point deltas;
  // everything else as percentage change.
  if (fmt === 'percent') return `<span class="${cls}">${arrow} ${(abs * 100).toFixed(0)} pts</span>`;
  return `<span class="${cls}">${arrow} ${(abs * 100).toFixed(0)}%</span>`;
}

export function renderDataTable(d) {
  const rows = ROWS.map(r => `    <tr>
      <th scope="row">${r.label}</th>
      <td class="data-cell-current">${format(d[r.key], r.fmt)}</td>
      <td class="data-cell-mom">${deltaCell(d[`${r.key}Mom`], r.fmt)}</td>
      <td class="data-cell-yoy">${deltaCell(d[`${r.key}Yoy`], r.fmt)}</td>
    </tr>`).join('\n');
  return `<section class="data-table-section" aria-label="Full market data table">
  <details class="data-table-details" open>
    <summary><span class="data-table-summary-text">See the full data table</span></summary>
    <table class="data-table">
      <thead>
        <tr>
          <th scope="col">Metric</th>
          <th scope="col">This Month</th>
          <th scope="col">MoM</th>
          <th scope="col">YoY</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </details>
</section>`;
}
