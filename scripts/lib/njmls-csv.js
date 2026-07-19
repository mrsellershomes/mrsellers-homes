// Reads NJMLS Custom Export CSVs from data/njmls/YYYY-MM/*.csv and produces
// a flat array of normalized sale records.
//
// Schema of the source CSVs (Custom CMA display):
//   "#","MLS #","St","Days On Market","Cat","Address","Town","Sold Price",
//   "Sold Date","List Price","Style","Unit SqFt","Lot Size Square Feet",
//   "Bedrooms","Full Baths","Half Baths"
//
// Cat values map to property type:
//   RES   -> single-family
//   CCT   -> condo (includes co-ops and townhouses per NJMLS combined category)
//   2to4  -> multi-family

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROPERTY_TYPE_BY_CAT = {
  'RES': 'single-family',
  'CCT': 'condo',
  '2to4': 'multi-family'
};

/**
 * Parse a single CSV line where every field is wrapped in double quotes
 * and separated by `","`. Currency fields contain commas inside the quotes,
 * so a naive split on `,` would not work; splitting on the `","` delimiter does.
 */
function parseLine(line) {
  let s = line;
  if (s.startsWith('"')) s = s.slice(1);
  if (s.endsWith('"')) s = s.slice(0, -1);
  return s.split('","');
}

function parseMoney(s) {
  if (!s || s === '') return null;
  const cleaned = String(s).replace(/[$,]/g, '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

function parseIntOrNull(s) {
  if (s == null || s === '') return null;
  const cleaned = String(s).replace(/,/g, '').trim();
  if (cleaned === '') return null;
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? null : n;
}

function parseDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
}

/**
 * Read one CSV file and return an array of normalized records.
 */
function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  const colIdx = name => headers.indexOf(name);
  const idx = {
    mls: colIdx('MLS #'),
    status: colIdx('St'),
    dom: colIdx('Days On Market'),
    cat: colIdx('Cat'),
    address: colIdx('Address'),
    town: colIdx('Town'),
    soldPrice: colIdx('Sold Price'),
    soldDate: colIdx('Sold Date'),
    listPrice: colIdx('List Price'),
    style: colIdx('Style'),
    bedrooms: colIdx('Bedrooms'),
    fullBaths: colIdx('Full Baths'),
    halfBaths: colIdx('Half Baths'),
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length < headers.length) continue;
    const cat = cells[idx.cat];
    rows.push({
      mls: cells[idx.mls],
      status: cells[idx.status],
      dom: parseIntOrNull(cells[idx.dom]),
      cat,
      propertyType: PROPERTY_TYPE_BY_CAT[cat] || 'other',
      address: cells[idx.address],
      town: cells[idx.town],
      style: cells[idx.style],
      soldPrice: parseMoney(cells[idx.soldPrice]),
      soldDate: parseDate(cells[idx.soldDate]),
      listPrice: parseMoney(cells[idx.listPrice]),
      bedrooms: parseIntOrNull(cells[idx.bedrooms]),
      fullBaths: parseIntOrNull(cells[idx.fullBaths]),
      halfBaths: parseIntOrNull(cells[idx.halfBaths]),
      _sourceFile: path,
    });
  }
  return rows;
}

/**
 * Walk every YYYY-MM/ subfolder of rootDir and aggregate all CSVs.
 * Returns { rows, monthFolders } where monthFolders is the sorted list
 * of YYYY-MM folder names found (used for labeling the page period).
 */
// The site's stats are a ROLLING 6-MONTH WINDOW by design: only the latest
// six YYYY-MM folders are read, no matter how many exist on disk. Older
// folders can stay as archive; they simply stop counting.
const WINDOW_MONTHS = 6;

export function readAllCsvs(rootDir, windowMonths = WINDOW_MONTHS) {
  const root = resolve(rootDir);
  const all = [];
  const allFolders = readdirSync(root)
    .filter(sub => /^\d{4}-\d{2}$/.test(sub) && statSync(join(root, sub)).isDirectory())
    .sort();
  const monthFolders = allFolders.slice(-windowMonths);
  if (allFolders.length > monthFolders.length) {
    console.log(`Rolling window: using ${monthFolders.length} of ${allFolders.length} month folders (${monthFolders[0]}..${monthFolders[monthFolders.length - 1]}).`);
  }
  for (const sub of monthFolders) {
    const subPath = join(root, sub);
    for (const f of readdirSync(subPath)) {
      if (!f.endsWith('.csv')) continue;
      all.push(...readCsv(join(subPath, f)));
    }
  }
  return { rows: all, monthFolders };
}

/**
 * Deduplicate by MLS # (a sale can appear in two date-split files if it
 * straddled the split date, though we set splits to be non-overlapping;
 * this is a safety net).
 */
export function dedupeByMls(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.mls) { out.push(r); continue; }
    if (seen.has(r.mls)) continue;
    seen.add(r.mls);
    out.push(r);
  }
  return out;
}

/**
 * Convert a YYYY-MM string to a human-readable month + year, e.g.
 * "2025-11" -> "November 2025".
 */
export function monthYearLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${y}`;
}

/**
 * Build a "Last N months ending {Month Year}" range label from the sorted
 * monthFolders array.
 */
export function buildPeriodLabel(monthFolders) {
  if (monthFolders.length === 0) return '';
  const last = monthFolders[monthFolders.length - 1];
  const first = monthFolders[0];
  if (monthFolders.length === 1) return monthYearLabel(last);
  return `${monthYearLabel(first)} through ${monthYearLabel(last)}`;
}
