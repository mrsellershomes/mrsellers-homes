// Full data table - the supplementary "all the metrics" view shown inside a
// collapsible <details> below the stat tiles. Shows the single-family rolling
// stats; the property breakdown cards above already cover the other types.
//
// The data table intentionally does NOT include MoM or YoY columns. We only
// have 6 months of NJMLS data accumulated; MoM would need 7 months of history
// (to compare the prior 6-month-window against the current one) and YoY would
// need 18 months. Adding empty MoM/YoY columns full of N/A would clutter the
// table for no signal. Once the site has been running for 12+ months and we
// have a deep enough archive, we can reintroduce the comparison columns.

const ROWS = [
  { key: 'medianSalePrice', label: 'Median sale price', fmt: 'currency' },
  { key: 'averageSalePrice', label: 'Average sale price', fmt: 'currency' },
  { key: 'medianListPrice', label: 'Median last list price', fmt: 'currency' },
  { key: 'homesSold', label: 'Single-family closings (last 6 months)', fmt: 'integer' },
  { key: 'medianDom', label: 'Median days on market', fmt: 'days' },
  { key: 'fastestSaleDays', label: 'Fastest sale (days on market)', fmt: 'days' },
  { key: 'saleToList', label: 'Median sale-to-list ratio', fmt: 'percent' },
  { key: 'soldAboveList', label: 'Share of sales that went above list', fmt: 'percent' },
  { key: 'lowestSale', label: 'Lowest single-family sale', fmt: 'currency' },
  { key: 'highestSale', label: 'Highest single-family sale', fmt: 'currency' }
];

function format(value, fmt) {
  if (value == null || isNaN(value)) return 'N/A';
  if (fmt === 'currency') return '$' + Math.round(value).toLocaleString();
  if (fmt === 'integer') return Math.round(value).toLocaleString();
  if (fmt === 'days') {
    const n = Math.round(value);
    return n + (n === 1 ? ' day' : ' days');
  }
  if (fmt === 'percent') return (value * 100).toFixed(1) + '%';
  return String(value);
}

export function renderDataTable(d) {
  // Filter out rows where the value is missing - cleaner than showing N/A
  // when the metric simply does not apply (e.g., very small towns).
  const present = ROWS.filter(r => d[r.key] != null && !isNaN(d[r.key]));
  if (present.length === 0) return '';

  const rows = present.map(r => `    <tr>
      <th scope="row">${r.label}</th>
      <td>${format(d[r.key], r.fmt)}</td>
    </tr>`).join('\n');

  return `<section class="data-table-section" aria-label="Full single-family market data">
  <details class="data-table-details" open>
    <summary><span class="data-table-summary-text">See all single-family metrics for the last 6 months</span></summary>
    <table class="data-table">
      <thead>
        <tr>
          <th scope="col">Metric</th>
          <th scope="col">Last 6 months</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </details>
</section>`;
}
