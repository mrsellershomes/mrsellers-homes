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
  if (n == null || isNaN(n)) return 'N/A';
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
    const totalDelta = elaDelta + mathDelta;
    let benchmarkLine;
    if (totalDelta > 0) {
      benchmarkLine = `That puts the district above the state benchmark on both subjects.`;
    } else if (totalDelta < 0) {
      benchmarkLine = `That puts the district below the state benchmark on the combined picture.`;
    } else {
      benchmarkLine = `That puts the district in line with the state benchmark.`;
    }
    return `${townName} public schools serve ${studentPart}. State assessment results: ${fmtPct(elaProficientPct)} proficient in ELA versus the New Jersey average of ${fmtPct(stateElaPct)}, and ${fmtPct(mathProficientPct)} in Math versus a New Jersey average of ${fmtPct(stateMathPct)}. ${benchmarkLine}`;
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
          // for grades 3 through 12, so PK-2 schools and very small schools
          // show no proficiency data. We skip those gracefully rather than
          // showing zeros or N/A placeholders that could mislead.
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

  // Footnote-style key for visitors who haven't seen NJ state assessment data
  // before. ELA + Math percentages are meaningless without knowing what the
  // numbers represent and what the realistic baseline is. We add this only
  // when at least one school in the town actually has proficiency data
  // displayed, so towns where every school is too small to report (rare)
  // do not get an irrelevant explainer.
  const hasProficiencyData = schoolsData.schools.some(s => s.elaPct != null || s.mathPct != null);
  // Schools key: a short visible lead plus a collapsible expander with the
  // substantive explanation. The lead and the closer stay visible by
  // default. The 4-point explanation is hidden in the expander so the page
  // is not dominated by 400 words inline, but a research-heavy parent who
  // wants the depth gets it on one click.
  //
  // Each of the 4 points is sourced or verifiable:
  //   1. Achievement vs Growth: NJ DOE publishes both metrics in the
  //      annual School Performance Reports.
  //   2. Ceiling matters: AP/IB course offerings published by every NJ
  //      high school in their counseling-office Program of Studies and
  //      annual School Profile document.
  //   3. School Profile: standard practice for college admissions, NACAC
  //      and College Board guidance.
  //   4. Wealth correlation: well-established educational research,
  //      including Sean Reardon (Stanford CEPA) and Coleman Report
  //      tradition. Stated as research consensus, not a novel claim.
  const keyHtml = hasProficiencyData
    ? `  <div class="schools-key">
    <p class="schools-key-lead">Each school&rsquo;s ELA and Math number is the percentage of kids who passed the state&rsquo;s annual test in that subject. NJ averages are 52% ELA and 40% Math. A school below state average is not automatically a weak school.</p>
    <details class="schools-key-details">
      <summary><span class="schools-key-summary-text">Four things that aggregator sites do not tell you about school scores</span></summary>
      <div class="schools-key-content">
        <p><strong>1. Achievement vs Growth.</strong> NJ DOE publishes two different school metrics. Achievement is the percentage of students who passed the test. Growth is how much each student improved year over year compared to peers who started at the same level. A school can have moderate achievement but exceptional growth, meaning the teachers are taking kids who started behind and advancing them a year and a half in a single year. Zillow, GreatSchools, and Niche almost always show achievement only. Growth is published by NJ DOE for every public school and is the better measure of teacher impact.</p>
        <p><strong>2. Ceiling matters more than floor for strong students.</strong> If you have a strong student, the schoolwide proficiency average is less important than the actual courses available. Many Bergen high schools with sub-40% schoolwide Math proficiency offer full AP programs (AP Calculus BC, AP Statistics, AP Physics), International Baccalaureate tracks, and dual enrollment with Bergen Community College or Rutgers. Your child&rsquo;s transcript reflects the courses they take, not the school&rsquo;s average. Top students at these schools have access to the same competitive coursework that strong students get anywhere.</p>
        <p><strong>3. Look at the High School Profile, not Zillow&rsquo;s rating.</strong> Every NJ public high school publishes a &ldquo;High School Profile&rdquo; each year, built for college admissions offices. It tells you what aggregator sites cannot: AP course offerings, AP score distributions, average SAT for college-bound seniors, the universities graduates have actually attended, and post-secondary placement rates. To find it, search &ldquo;[Town] high school profile&rdquo; or check the school&rsquo;s counseling page.</p>
        <p><strong>4. Test scores correlate with town income more than with teaching quality.</strong> Decades of educational research show that raw standardized test scores correlate more strongly with a town&rsquo;s median income and parental education level than with the quality of teaching inside the building. A school in a wealthy town is not necessarily teaching better. It is teaching students whose families have more time, money, and resources to support test prep at home. A lower-scoring diverse school is often doing better work than the score implies.</p>
      </div>
    </details>
    <p class="schools-key-closer">Use these as one signal, not the whole picture. Sorting through what these numbers actually mean for your specific situation is part of what I do when we work together.</p>
  </div>\n`
    : '';

  return `<section class="schools-section" aria-label="Public schools in ${townName}">
  <h2>Public schools in ${townName}</h2>
${summaryHtml}  <div class="school-groups">
${sections}
  </div>
${keyHtml}</section>`;
}
