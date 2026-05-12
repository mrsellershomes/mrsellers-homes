// Renders a server-side SVG histogram showing the price distribution of
// sales over the 6-month rolling window. Answers the most common buyer
// research question: "How many homes typically come up in my price range?"
//
// Pure SVG, no JS, no chart library. Stays consistent with the static-site
// architecture and adds zero runtime cost. Print-friendly, accessible (each
// bar has a descriptive <title>), and indexable by LLMs that scrape the page.

// Round to a "nice" bucket width so labels are clean ($100K, $250K, $500K
// etc. instead of $137,500 etc.).
function niceRound(n) {
  if (n <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const normalized = n / magnitude;
  let nice;
  if (normalized < 1.5) nice = 1;
  else if (normalized < 3) nice = 2;
  else if (normalized < 7) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

// Compute bucket edges aligned to nice round numbers.
function computeBuckets(prices, targetBucketCount = 6) {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;
  if (range === 0) {
    return [{ lo: min, hi: min, count: prices.length, isLast: true }];
  }
  const width = niceRound(range / targetBucketCount);
  const niceMin = Math.floor(min / width) * width;
  const niceMax = Math.ceil((max + 0.0001) / width) * width;
  const buckets = [];
  for (let lo = niceMin; lo < niceMax; lo += width) {
    const hi = lo + width;
    buckets.push({ lo, hi, count: 0, isLast: false });
  }
  buckets[buckets.length - 1].isLast = true;
  for (const p of prices) {
    let placed = false;
    for (let i = 0; i < buckets.length - 1; i++) {
      if (p >= buckets[i].lo && p < buckets[i].hi) {
        buckets[i].count++;
        placed = true;
        break;
      }
    }
    if (!placed) buckets[buckets.length - 1].count++;
  }
  return buckets;
}

function fmtPrice(n) {
  // Format like "$750K" or "$1.2M"
  if (n >= 1000000) {
    const m = n / 1000000;
    return '$' + (m === Math.floor(m) ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (n >= 1000) {
    const k = Math.round(n / 1000);
    return '$' + k + 'K';
  }
  return '$' + n;
}

/**
 * Render an SVG histogram. The 'compact' variant is smaller and goes inside
 * a property card; the 'wide' variant is full-width below the stat tiles.
 */
export function renderPriceDistribution({ prices, townName, propertyTypeLabel, variant = 'wide' }) {
  if (!prices || prices.length < 3) return '';

  const buckets = computeBuckets(prices, variant === 'compact' ? 5 : 6);
  if (buckets.length === 0) return '';

  const isCompact = variant === 'compact';
  const W = isCompact ? 320 : 640;
  const H = isCompact ? 200 : 260;
  const padding = {
    top: 24,
    right: isCompact ? 8 : 16,
    bottom: isCompact ? 56 : 60,
    left: isCompact ? 8 : 16
  };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const barGap = 6;
  const barWidth = (chartW / buckets.length) - barGap;

  const totalSales = buckets.reduce((s, b) => s + b.count, 0);

  const bars = buckets.map((b, i) => {
    const x = padding.left + i * (barWidth + barGap) + (barGap / 2);
    const h = (b.count / maxCount) * chartH;
    const y = H - padding.bottom - h;
    const rangeLabel = b.isLast
      ? `${fmtPrice(b.lo)}+`
      : `${fmtPrice(b.lo)}-${fmtPrice(b.hi)}`;
    const saleNoun = b.count === 1 ? 'sale' : 'sales';
    const titleText = `${rangeLabel}: ${b.count} ${saleNoun}`;
    const tooltipPrimary = rangeLabel;
    const tooltipSecondary = `${b.count} ${saleNoun}`;
    return { x, y, w: barWidth, h, count: b.count, rangeLabel, titleText, tooltipPrimary, tooltipSecondary, lo: b.lo, hi: b.hi };
  });

  // Each bar group includes an invisible "hit area" rectangle spanning the
  // full chart height for the bucket so the entire vertical column triggers
  // the hover tooltip (not just the colored bar at the bottom). Bars with
  // very low counts would otherwise have a tiny hit target. The visible
  // colored rect renders on top with pointer-events: none so the hit area
  // captures all hover events.
  // Each bar group uses aria-label (not <title>) for accessibility. <title>
  // triggers the browser's slow native tooltip on hover which duplicated
  // our custom floating tooltip. aria-label provides the same info to
  // screen readers without the native tooltip side-effect.
  const chartTop = padding.top;
  const barEls = bars.map(bar => {
    const countLabelY = bar.h > 18 ? bar.y + 14 : bar.y - 6;
    const countLabelFill = bar.h > 18 ? '#FFFFFF' : '#111111';
    const dataAttrs = `data-tooltip-primary="${bar.tooltipPrimary}" data-tooltip-secondary="${bar.tooltipSecondary}"`;
    return `<g class="price-bar" role="img" aria-label="${bar.titleText}" ${dataAttrs}>
      <rect class="price-bar-hit" x="${bar.x.toFixed(1)}" y="${chartTop}" width="${bar.w.toFixed(1)}" height="${(H - padding.bottom - chartTop).toFixed(1)}" fill="transparent"></rect>
      <rect class="price-bar-fill" x="${bar.x.toFixed(1)}" y="${bar.y.toFixed(1)}" width="${bar.w.toFixed(1)}" height="${bar.h.toFixed(1)}" rx="2" fill="#E2001A"></rect>
      ${bar.count > 0 ? `<text class="price-bar-count" x="${(bar.x + bar.w / 2).toFixed(1)}" y="${countLabelY.toFixed(1)}" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="${isCompact ? 11 : 12}" font-weight="700" fill="${countLabelFill}">${bar.count}</text>` : ''}
    </g>`;
  }).join('');

  // X-axis labels: instead of cramming a label under every bar (which
  // overlaps when buckets are narrow), put 3 to 5 sparse tick labels along
  // the axis at the bucket boundaries: lower edge of first bucket, edges
  // of a few middle buckets, and upper edge of last bucket (with "+" suffix
  // since last bucket is open-ended).
  const axisY = H - padding.bottom + 0.5;
  const labelY = H - padding.bottom + (isCompact ? 14 : 18);
  const tickFontSize = isCompact ? 10 : 11;

  // Decide how many tick labels to show based on chart width.
  const desiredTicks = isCompact ? 3 : Math.min(5, buckets.length + 1);
  // Always include first and last edge. Sample intermediate edges evenly.
  const tickIndices = [0];
  if (desiredTicks > 2) {
    for (let i = 1; i < desiredTicks - 1; i++) {
      const fraction = i / (desiredTicks - 1);
      const bucketIdx = Math.round(fraction * (buckets.length - 1));
      if (!tickIndices.includes(bucketIdx)) tickIndices.push(bucketIdx);
    }
  }
  if (!tickIndices.includes(buckets.length - 1)) tickIndices.push(buckets.length - 1);

  const xLabels = tickIndices.map(idx => {
    const bucket = buckets[idx];
    const bar = bars[idx];
    const labelText = bucket.isLast
      ? `${fmtPrice(bucket.lo)}+`
      : fmtPrice(bucket.lo);
    const isLastTick = idx === buckets.length - 1;
    // First tick anchors start of first bar; last tick anchors end of last
    // bar with "+" suffix to signal "and above"; middle ticks anchor at
    // start of their bucket.
    const tickX = isLastTick && bucket.isLast
      ? bar.x + bar.w
      : bar.x;
    const anchor = idx === 0 ? 'start' : isLastTick ? 'end' : 'middle';
    return `<text x="${tickX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchor}" font-family="DM Sans, sans-serif" font-size="${tickFontSize}" font-weight="500" fill="#666666">${labelText}</text>`;
  }).join('');

  const axis = `<line x1="${padding.left}" y1="${axisY}" x2="${W - padding.right}" y2="${axisY}" stroke="#e0e0e0" stroke-width="1"></line>`;

  // Faint dashed horizontal line at the max-count height so the reader can
  // visually anchor the tallest bar(s) and gauge other bars relative to it.
  const maxLineY = H - padding.bottom - chartH;
  const maxLine = `<line x1="${padding.left}" y1="${maxLineY.toFixed(1)}" x2="${W - padding.right}" y2="${maxLineY.toFixed(1)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3 4"></line>
    <text x="${(W - padding.right + 2).toFixed(1)}" y="${(maxLineY + 4).toFixed(1)}" text-anchor="start" font-family="DM Sans, sans-serif" font-size="${tickFontSize}" font-weight="500" fill="#999999">${maxCount}</text>`;

  const ariaLabel = `Price distribution of ${totalSales} ${propertyTypeLabel.toLowerCase()} sales in ${townName} over the last 6 months`;

  // role="img" + aria-label provides screen-reader access without rendering
  // a native browser <title> tooltip on hover.
  // Render order: max-line first (behind bars), then bars on top, then
  // axis and labels last for full readability.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}" class="price-distribution-svg">
    ${maxLine}
    ${axis}
    ${barEls}
    ${xLabels}
  </svg>`;

  if (isCompact) {
    return `<div class="price-distribution price-distribution-compact">
      <p class="price-distribution-caption">Price distribution (${totalSales} sales)</p>
      ${svg}
    </div>`;
  }

  return `<section class="price-distribution price-distribution-wide" aria-label="${ariaLabel}">
    <header class="price-distribution-header">
      <h3>Where ${propertyTypeLabel.toLowerCase()} sales fall by price</h3>
      <p class="price-distribution-subhead">${totalSales} ${propertyTypeLabel.toLowerCase()} ${totalSales === 1 ? 'closing' : 'closings'} in ${townName} over the last 6 months, grouped by sale price. The number on each bar is the count in that price range.</p>
    </header>
    ${svg}
  </section>`;
}
