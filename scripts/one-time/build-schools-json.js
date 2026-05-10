// Builds data/bergen-schools.json from NJ DOE School Performance Reports xlsx.
// Source: https://www.nj.gov/education/sprreports/download/DataFiles/2023-2024/Database_SchoolDetail.xlsx
// Cached at: scripts/.cache/nj-doe-2023-24-school-detail.xlsx
//
// Strategy:
//   1. Header and Contact sheet → school name, district, gradespan, city
//   2. EnrollmentTrendsbyGrade sheet → total student count per school
//   3. ELAParticipationPerformance + MathParticipationPerformance (Schoolwide row) → proficiency
//   4. Match school city to bergen-towns.json town name
//   5. Aggregate per town
//
// Run: ANTHROPIC_API_KEY not needed for this task (we add AI summaries in a later step)

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const XLSX_PATH = resolve('scripts/.cache/nj-doe-2023-24-school-detail.xlsx');
const DATA_YEAR = '2023-2024';

// We delegate the xlsx parsing to a small Python helper because Node lacks a
// good streaming xlsx reader for files this big (80 MB). The Python helper
// emits JSON to stdout which we then process in Node.

const PY_HELPER_PATH = resolve('scripts/one-time/_extract-nj-doe.py');
const cachePyOut = resolve('scripts/.cache/nj-doe-bergen-extracted.json');

let extracted;
try {
  extracted = JSON.parse(readFileSync(cachePyOut, 'utf8'));
  console.log('Using cached extraction');
} catch {
  console.log('Running Python xlsx extractor (this takes ~30-60s)...');
  const result = execSync(`python3 ${JSON.stringify(PY_HELPER_PATH)} ${JSON.stringify(XLSX_PATH)}`, {
    maxBuffer: 100 * 1024 * 1024
  }).toString('utf8');
  extracted = JSON.parse(result);
  writeFileSync(cachePyOut, JSON.stringify(extracted));
  console.log(`Cached to ${cachePyOut}`);
}

console.log(`Bergen schools in directory: ${extracted.directory.length}`);
console.log(`State ELA avg: ${extracted.state.ela?.toFixed(1)}%`);
console.log(`State Math avg: ${extracted.state.math?.toFixed(1)}%`);

const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));

function gradeBand(span) {
  if (!span) return 'Other';
  // Span format examples: "PK-04", "KG-04", "05-08", "09-12", "PK-12"
  const m = String(span).toUpperCase().match(/^(PK|KG|\d{2})-(PK|KG|\d{2})$/);
  if (!m) return 'Other';
  const toNum = v => v === 'PK' ? -1 : v === 'KG' ? 0 : parseInt(v, 10);
  const lo = toNum(m[1]);
  const hi = toNum(m[2]);
  // Elementary: any subset of PK through 4
  if (hi <= 4) return 'Elementary';
  // High school: 9-12 only
  if (lo >= 9) return 'High';
  // Middle school: contained within 5-8
  if (lo >= 5 && hi <= 8) return 'Middle';
  // Spans multiple bands (e.g. PK-08, KG-12)
  return 'Combined';
}

// Normalize a place-name string for fuzzy matching: lowercase, collapse whitespace,
// treat hyphens as word separators.
function normPlace(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Aliases: normalized NJ-DOE-side string -> the canonical bergen-towns name.
// NJ DOE writes some town names in inverted "Township Of X" form.
const CITY_ALIASES = {
  'township of washington': 'Washington Township',
};

// Map: normalized city/alias -> town
const cityToTown = new Map();
for (const t of towns) {
  cityToTown.set(normPlace(t.name), t);
}
for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
  const town = cityToTown.get(normPlace(canonical));
  if (town) cityToTown.set(alias, town);
}

// Bergen district names sometimes use combined district that doesn't match a single town
// (e.g., "Northern Valley Regional High School District" serves multiple towns).
// We bucket schools by their CITY field (which is the actual physical town location of
// the school building), not by district name.

const out = {};
for (const t of towns) {
  out[t.slug] = {
    schools: [],
    schoolCount: 0,
    studentCount: 0,
    elaProficientPct: null,
    mathProficientPct: null,
    stateElaPct: extracted.state.ela ? Math.round(extracted.state.ela * 10) / 10 : null,
    stateMathPct: extracted.state.math ? Math.round(extracted.state.math * 10) / 10 : null,
    dataYear: extracted.data_year
  };
}

let unmatched = new Set();
for (const s of extracted.directory) {
  const cityRaw = s.CITY || '';
  const town = cityToTown.get(normPlace(cityRaw));
  if (!town) {
    if (cityRaw) unmatched.add(cityRaw);
    continue;
  }
  // SchoolCode is district-internal, not statewide unique. The Python extractor
  // built a compound "{DistrictCode}-{SchoolCode}" key (SCHOOL_KEY) that we use
  // here for all per-school lookups - otherwise enrollment/proficiency from
  // unrelated Bergen districts overwrites the value we want.
  const key = s.SCHOOL_KEY;
  const enrollment = extracted.enrollment[key] ?? 0;
  const ela = extracted.ela[key];
  const math = extracted.math[key];

  out[town.slug].schools.push({
    name: s.SCHOOL_NAME,
    district: s.DISTRICT_NAME,
    grades: s.GRADESPAN,
    band: gradeBand(s.GRADESPAN),
    enrollment,
    elaPct: typeof ela === 'number' ? ela : null,
    mathPct: typeof math === 'number' ? math : null
  });
  out[town.slug].schoolCount++;
  out[town.slug].studentCount += enrollment;
}

// Compute weighted average proficiency per town, weighted by enrollment
for (const slug of Object.keys(out)) {
  const town = out[slug];
  const elaSchools = town.schools.filter(s => s.elaPct != null && s.enrollment > 0);
  const mathSchools = town.schools.filter(s => s.mathPct != null && s.enrollment > 0);
  if (elaSchools.length > 0) {
    const totalE = elaSchools.reduce((a, s) => a + s.enrollment, 0);
    const wAvgE = elaSchools.reduce((a, s) => a + s.elaPct * s.enrollment, 0) / totalE;
    town.elaProficientPct = Math.round(wAvgE * 10) / 10;
  }
  if (mathSchools.length > 0) {
    const totalM = mathSchools.reduce((a, s) => a + s.enrollment, 0);
    const wAvgM = mathSchools.reduce((a, s) => a + s.mathPct * s.enrollment, 0) / totalM;
    town.mathProficientPct = Math.round(wAvgM * 10) / 10;
  }
  // Sort schools: Elementary -> Middle -> High -> Combined -> Other, then alphabetical
  const order = { Elementary: 0, Middle: 1, High: 2, Combined: 3, Other: 4 };
  town.schools.sort((a, b) => (order[a.band] - order[b.band]) || a.name.localeCompare(b.name));
}

writeFileSync(resolve('data/bergen-schools.json'), JSON.stringify(out, null, 2) + '\n');

const withSchools = Object.values(out).filter(t => t.schoolCount > 0);
console.log(`Wrote bergen-schools.json — ${Object.keys(out).length} towns, ${withSchools.length} with at least one school`);
console.log(`Total schools matched to towns: ${withSchools.reduce((a, t) => a + t.schoolCount, 0)}`);
if (unmatched.size > 0) {
  console.warn(`Unmatched cities (school physical address not in our 70-town list): ${[...unmatched].join(', ')}`);
}
