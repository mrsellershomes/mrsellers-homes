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
        .map(s => `      <li>${s.name}</li>`)
        .join('\n');
      return `    <div class="school-group">
      <h3>${BAND_LABELS[k]}</h3>
      <ul>
${items}
      </ul>
    </div>`;
    })
    .join('\n');

  const summary = summarySentence && summarySentence.trim()
    ? `  <p class="schools-summary">${summarySentence}</p>\n`
    : '';

  return `<section class="schools-section" aria-label="Public schools in ${townName}">
  <h2>Public schools in ${townName}</h2>
${summary}  <div class="school-groups">
${sections}
  </div>
</section>`;
}
