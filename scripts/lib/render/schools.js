// Renders the public schools section: AI-generated town-level summary sentence
// plus a grouped list of public schools by band (Elementary / Middle / High).
// Returns empty string when no schools exist for the town (e.g. Rockleigh).

const BAND_LABELS = {
  Elementary: 'Elementary (PK-4)',
  Middle: 'Middle (5-8)',
  High: 'High (9-12)',
  Combined: 'Combined / K-12',
  Other: 'Other'
};

const BAND_ORDER = ['Elementary', 'Middle', 'High', 'Combined', 'Other'];

function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return Math.round(n) + '%';
}

// Builds a numerically specific summary sentence directly from the data so
// research-heavy visitors see concrete comparisons against state averages,
// not vague "above average" hand-waving.
function buildSpecificSummary(townName, schoolsData) {
  if (!schoolsData) return '';
  const { studentCount, schoolCount, elaProficientPct, mathProficientPct, stateElaPct, stateMathPct } = schoolsData;
  if (schoolCount === 0) return '';

  const studentPart = studentCount && studentCount > 0
    ? `${studentCount.toLocaleString()} students across ${schoolCount} ${schoolCount === 1 ? 'school' : 'schools'}`
    : `${schoolCount} ${schoolCount === 1 ? 'school' : 'schools'}`;

  if (elaProficientPct != null && mathProficientPct != null && stateElaPct != null && stateMathPct != null) {
    const elaDelta = elaProficientPct - stateElaPct;
    const mathDelta = mathProficientPct - stateMathPct;
    const direction = (elaDelta + mathDelta) > 0 ? 'above' : (elaDelta + mathDelta) < 0 ? 'below' : 'in line with';
    return `${townName} public schools serve ${studentPart}. State assessment results: ${fmtPct(elaProficientPct)} proficient in ELA versus the New Jersey average of ${fmtPct(stateElaPct)}, and ${fmtPct(mathProficientPct)} in Math versus a New Jersey average of ${fmtPct(stateMathPct)} &mdash; ${direction} the state benchmark.`;
  }
  return `${townName} public schools serve ${studentPart}.`;
}

function gradeBandShort(grades) {
  // "KG-04" -> "K-4", "PK-05" -> "PK-5", "05-08" -> "5-8", "09-12" -> "9-12"
  if (!grades) return '';
  return String(grades)
    .replace(/^KG/, 'K')          // KG-04 -> K-04
    .replace(/^0(\d)/, '$1')      // 05-08 -> 5-08 (only at start)
    .replace(/-0(\d)/g, '-$1');   // K-04 -> K-4, 5-08 -> 5-8
}

export function renderSchools({ townName, schoolsData, summarySentence }) {
  if (!schoolsData || !schoolsData.schools || schoolsData.schoolCount === 0) return '';
  const groups = {};
  for (const s of schoolsData.schools) {
    const band = s.band in BAND_LABELS ? s.band : 'Other';
    (groups[band] ||= []).push(s);
  }
  const sections = BAND_ORDER
    .filter(k => groups[k] && groups[k].length > 0)
    .map(k => {
      const items = groups[k]
        .map(s => {
          // Build a meta line: grade range, enrollment, then proficiency
          // numbers when available. NJSLA assessments are only administered
          // grades 3-12, so PK-2 schools and very small schools show no
          // proficiency data - we skip those gracefully rather than
          // showing zeros or em-dashes that could mislead.
          const meta = [];
          const gb = gradeBandShort(s.grades);
          if (gb) meta.push(gb);
          if (s.enrollment && s.enrollment > 0) meta.push(`${s.enrollment.toLocaleString()} students`);
          if (s.elaPct != null) meta.push(`ELA ${Math.round(s.elaPct)}%`);
          if (s.mathPct != null) meta.push(`Math ${Math.round(s.mathPct)}%`);
          const metaText = meta.length > 0 ? ` <span class="school-meta">${meta.join(' &middot; ')}</span>` : '';
          return `      <li><span class="school-name">${s.name}</span>${metaText}</li>`;
        })
        .join('\n');
      return `    <div class="school-group">
      <h3>${BAND_LABELS[k]}</h3>
      <ul>
${items}
      </ul>
    </div>`;
    })
    .join('\n');

  // Use the explicit summarySentence if provided, otherwise compute a
  // specific one from the raw data.
  const summary = (summarySentence && summarySentence.trim())
    || buildSpecificSummary(townName, schoolsData);
  const summaryHtml = summary ? `  <p class="schools-summary">${summary}</p>\n` : '';

  return `<section class="schools-section" aria-label="Public schools in ${townName}">
  <h2>Public schools in ${townName}</h2>
${summaryHtml}  <div class="school-groups">
${sections}
  </div>
</section>`;
}
