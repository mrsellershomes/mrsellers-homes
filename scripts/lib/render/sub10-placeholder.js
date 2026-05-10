// Replaces stat tiles + data table + property breakdown when a town has
// fewer than 10 homes sold in the latest month. Shows a 3-month rolling
// blend instead, framed as honest acknowledgment that single-month data
// for low-volume towns is unreliable. Includes inline lead capture
// (a single soft contact form, not the dual buyer/seller cards).

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString();
}

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function renderSub10Placeholder({ townName, threeMonthBlend }) {
  const blend = threeMonthBlend || {};
  const source = `MrSellers.homes — ${townName} Real Estate Page (Low-Volume Inquiry)`;
  const tags = `Market Page Lead,Town: ${townName},Intent: Unknown,Low-Volume Town`;

  return `<section class="sub10-placeholder" aria-label="Low-volume month notice for ${townName}">
  <h2>${townName} had fewer than 10 homes close last month.</h2>
  <p>Small-sample numbers can mislead. A single luxury sale can swing medians wildly, and trends mean less when the count is low. Rather than show you a misleading data point, here is a quick look at the prior 3 months averaged together.</p>
  <ul class="three-month-blend" aria-label="3-month rolling averages">
    <li><span class="blend-label">Avg median sale price (last 3 mo)</span><span class="blend-value">${fmtCurrency(blend.medianSalePrice)}</span></li>
    <li><span class="blend-label">Total homes sold (last 3 mo)</span><span class="blend-value">${blend.homesSold ?? '—'}</span></li>
    <li><span class="blend-label">Avg sale-to-list (last 3 mo)</span><span class="blend-value">${blend.saleToList != null ? (blend.saleToList * 100).toFixed(1) + '%' : '—'}</span></li>
  </ul>
  <p>If you would like real context on a specific home or street in ${townName}, that is the kind of thing I can answer better than any data table. Send me the question.</p>
  <form class="lead-form sub10-form" data-fub-source="${escapeAttr(source)}" data-fub-tags="${escapeAttr(tags)}" novalidate>
    <label class="form-row"><span class="form-label">Name</span><input type="text" name="name" autocomplete="name" required></label>
    <label class="form-row"><span class="form-label">Email</span><input type="email" name="email" autocomplete="email" required></label>
    <label class="form-row"><span class="form-label">What&rsquo;s your question about ${townName}?</span><textarea name="message" rows="3" required></textarea></label>
    <button type="submit" class="btn-red">Send</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</section>`;
}
