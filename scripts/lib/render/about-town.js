// Renders the "About [Town]" section with Tyler's locally relevant text.
// Returns empty string when no aboutText exists - section is hidden entirely
// rather than showing a "coming soon" placeholder.

export function renderAboutTown({ townName, aboutText }) {
  if (!aboutText || aboutText.trim() === '') return '';
  // Split on blank lines into paragraphs
  const paragraphs = aboutText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join('\n  ');
  return `<section class="about-town" aria-label="About ${townName}">
  <h2>About ${townName}</h2>
  ${paragraphs}
</section>`;
}
