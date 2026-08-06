import { toSlug } from './slug.js';

// NJMLS agents sometimes use a different spelling than the official Bergen
// County municipal name. These aliases map the NJMLS-side string to the
// canonical bergen-towns.json name. Slug-based matching (below) handles
// pure hyphen-vs-space differences automatically (e.g., "Wood Ridge" in
// NJMLS vs "Wood-Ridge" official); this map covers cases where the names
// genuinely differ.
const TOWN_ALIASES = {
  'Township of Washington': 'Washington Township'
};

// Aggregates raw NJMLS sale records into per-town, per-property-type stats
// over the full window of data loaded (designed for a 6-month rolling window).
//
// Output shape per town slug:
//   {
//     townData: <SF stats> (only if SF >= MIN_SF_HEADLINE; else {} so the
//               stat-tiles renderer falls back to N/A and sub10 takes over),
//     propertyTypes: {
//       singleFamily: <stats> | null,
//       multiFamily: <stats> | null,
//       condo:       <stats> | null
//     },
//     sub10: <stats> | null   // populated when SF count < MIN_SF_HEADLINE
//   }
//
// Stats object:
//   medianSalePrice, averageSalePrice, homesSold, saleToList,
//   lowestSale, highestSale, percentOverAsking, fastestSaleDays, medianDom

// Per-type thresholds, applied to 6-month rolling totals. A property type
// must have at least this many closings over the window to render its card
// or drive the page headline. Spec: "maximum coverage - any property type
// with at least one sale every couple of months gets a card." Visitors can
// see the underlying sale count on each card and judge sample reliability
// for themselves.
const MIN_SF_HEADLINE = 3;            // SF below this -> sub-threshold placeholder
const MIN_SECONDARY_TYPE = 3;         // MF/Condo+TH/Co-op below this -> card hidden

// Data-quality filter: rows where the sold-to-list ratio is outside this
// band are excluded from analysis. These are almost always NJMLS data entry
// errors where the trailing "000" got dropped from the sold price (e.g., a
// $140K listing recorded as a $136 sale). Matches Redfin's published
// methodology of excluding sale-to-list outliers from their metrics.
// In a 3,239-row 6-month Bergen dataset, 3 rows hit this filter.
const MIN_RATIO = 0.3;
const MAX_RATIO = 3.0;

function isPlausibleSale(r) {
  // A row with no list price gets a pass - cannot verify - but the row's
  // sold price still needs to be at least $1,000 to be a real transaction.
  if (r.soldPrice == null || r.soldPrice < 1000) return false;
  if (r.listPrice == null || r.listPrice <= 0) return r.soldPrice >= 1000;
  const ratio = r.soldPrice / r.listPrice;
  return ratio >= MIN_RATIO && ratio <= MAX_RATIO;
}

function median(values) {
  const sorted = values.filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mean(values) {
  const valid = values.filter(v => v != null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function minOf(values) {
  const valid = values.filter(v => v != null && !isNaN(v));
  return valid.length === 0 ? null : Math.min(...valid);
}

function maxOf(values) {
  const valid = values.filter(v => v != null && !isNaN(v));
  return valid.length === 0 ? null : Math.max(...valid);
}

function saleToListMedian(rows) {
  const ratios = rows
    .filter(r => r.soldPrice != null && r.listPrice != null && r.listPrice > 0)
    .map(r => r.soldPrice / r.listPrice)
    // Defensive: exclude obvious outliers > 50% off list price either way
    // (matches Redfin's published methodology for the same metric).
    .filter(r => r >= 0.5 && r <= 1.5);
  return median(ratios);
}

function percentOverAsking(rows) {
  const valid = rows.filter(r =>
    r.soldPrice != null && r.listPrice != null && r.listPrice > 0
  );
  if (valid.length === 0) return null;
  const overCount = valid.filter(r => r.soldPrice > r.listPrice).length;
  return overCount / valid.length;
}

function fastestSaleDays(rows) {
  const doms = rows.map(r => r.dom).filter(d => d != null && d >= 0);
  return doms.length === 0 ? null : Math.min(...doms);
}

// Top 3 Style values by frequency (e.g. "Cape Cod", "Colonial", "2 Fam").
// Consumed only by the AI commentary prompt to characterize the housing stock.
function topStyles(rows) {
  const counts = new Map();
  for (const r of rows) {
    const s = (r.style || '').trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([style, count]) => ({ style, count }));
}

function buildStats(rows) {
  const pctOver = percentOverAsking(rows);
  return {
    medianSalePrice: median(rows.map(r => r.soldPrice)),
    averageSalePrice: mean(rows.map(r => r.soldPrice)),
    medianListPrice: median(rows.map(r => r.listPrice)),
    homesSold: rows.length,
    saleToList: saleToListMedian(rows),
    lowestSale: minOf(rows.map(r => r.soldPrice)),
    highestSale: maxOf(rows.map(r => r.soldPrice)),
    percentOverAsking: pctOver,
    soldAboveList: pctOver,
    fastestSaleDays: fastestSaleDays(rows),
    medianDom: median(rows.map(r => r.dom).filter(d => d != null && d >= 0)),
    // Housing-stock shape for the AI commentary: typical size and the
    // dominant styles help explain WHY the price level is what it is.
    medianBedrooms: median(rows.map(r => r.bedrooms)),
    medianFullBaths: median(rows.map(r => r.fullBaths)),
    topStyles: topStyles(rows),
    // Raw sold prices passed through so the price-distribution histogram
    // can bucket them for visualization. Not used by any other renderer.
    salePrices: rows.map(r => r.soldPrice).filter(p => p != null)
  };
}

/**
 * Group rows by town SLUG (not raw name), so NJMLS spellings that vary in
 * hyphen vs. space (e.g., "Wood Ridge" vs "Wood-Ridge") map to the same
 * bucket. Genuine name differences (e.g., "Township of Washington" vs
 * "Washington Township") are handled by the TOWN_ALIASES table above.
 * Filters out implausible sales (likely data entry errors) before grouping.
 */
function groupByTown(rows) {
  const m = new Map();
  let excluded = 0;
  for (const r of rows) {
    if (!r.town) continue;
    if (!isPlausibleSale(r)) {
      excluded++;
      continue;
    }
    const canonical = TOWN_ALIASES[r.town] || r.town;
    const key = toSlug(canonical);
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(r);
  }
  if (excluded > 0) {
    console.warn(`town-data: excluded ${excluded} row(s) with implausible sold-to-list ratios (likely NJMLS data entry errors).`);
  }
  return m;
}

/**
 * Within the NJMLS Condo Coop Townhouse category (Cat=CCT), the actual
 * Style field distinguishes apartment-style condos, fee-simple townhouses,
 * and co-ops. We combine Condo and Townhouse into one bucket because
 * agents inconsistently classify new-construction side-by-side duplexes
 * between the two labels in Bergen County. Co-op is reliably classified
 * by agents and represents a fundamentally different ownership structure
 * (board approval, share ownership), so it gets its own card.
 */
function classifyCCT(row) {
  const style = (row.style || '').trim();
  if (style === 'Co-op' || style === 'Coop' || style === 'CO-OP') return 'coop';
  return 'condo-townhouse'; // Condo, TWNHS, anything else within CCT
}

/**
 * Month-by-month series for the AI commentary prompt. Buckets a town's rows
 * by sold month (soldDate is "YYYY-MM-DD") and reports count + median per
 * property-type bucket. This is what lets the commentary reason about
 * within-window trend and seasonality per town instead of only seeing the
 * 6-month blend. Small-sample months are still reported (the model is told
 * to treat low counts as noise), so no threshold is applied here.
 */
function buildMonthlyTrend(sfRows, condoTownhouseRows) {
  const months = new Map();
  const add = (row, key) => {
    if (!row.soldDate) return;
    const month = row.soldDate.slice(0, 7);
    if (!months.has(month)) {
      months.set(month, { singleFamily: [], condoTownhouse: [] });
    }
    months.get(month)[key].push(row.soldPrice);
  };
  for (const r of sfRows) add(r, 'singleFamily');
  for (const r of condoTownhouseRows) add(r, 'condoTownhouse');

  return [...months.keys()].sort().map(month => {
    const b = months.get(month);
    return {
      month,
      singleFamily: { sold: b.singleFamily.length, medianSalePrice: median(b.singleFamily) },
      condoTownhouse: { sold: b.condoTownhouse.length, medianSalePrice: median(b.condoTownhouse) }
    };
  });
}

/**
 * Aggregate raw normalized rows into the per-town shape that the renderers
 * expect. `towns` is data/bergen-towns.json contents.
 */
export function aggregateTownData(rows, towns) {
  const byTown = groupByTown(rows);
  const result = {};

  for (const town of towns) {
    const townRows = byTown.get(town.slug) || [];
    const sfRows = townRows.filter(r => r.propertyType === 'single-family');
    const mfRows = townRows.filter(r => r.propertyType === 'multi-family');
    const cctRows = townRows.filter(r => r.propertyType === 'condo');
    const condoTownhouseRows = cctRows.filter(r => classifyCCT(r) === 'condo-townhouse');
    const coopRows = cctRows.filter(r => classifyCCT(r) === 'coop');

    const sfHasHeadline = sfRows.length >= MIN_SF_HEADLINE;

    result[town.slug] = {
      townName: town.name,
      slug: town.slug,
      townData: sfHasHeadline ? buildStats(sfRows) : {},
      propertyTypes: {
        singleFamily: sfHasHeadline ? buildStats(sfRows) : null,
        multiFamily: mfRows.length >= MIN_SECONDARY_TYPE ? buildStats(mfRows) : null,
        condoTownhouse: condoTownhouseRows.length >= MIN_SECONDARY_TYPE ? buildStats(condoTownhouseRows) : null,
        coop: coopRows.length >= MIN_SECONDARY_TYPE ? buildStats(coopRows) : null
      },
      // Raw counts always exposed for diagnostic/logging - so the script
      // never reports "0 sales" when sales exist but fall below threshold.
      rawCounts: {
        singleFamily: sfRows.length,
        multiFamily: mfRows.length,
        condoTownhouse: condoTownhouseRows.length,
        coop: coopRows.length
      },
      // When SF is thin, drive the sub-threshold placeholder with whatever
      // SF data we do have (even if it is 1-5 sales over 6 months).
      sub10: sfHasHeadline ? null : buildStats(sfRows),
      // Month-by-month series (all months in the window) consumed only by
      // the AI commentary prompt, never rendered directly.
      monthlyTrend: buildMonthlyTrend(sfRows, condoTownhouseRows)
    };
  }

  return result;
}

export const THRESHOLDS = {
  MIN_SF_HEADLINE,
  MIN_SECONDARY_TYPE
};
