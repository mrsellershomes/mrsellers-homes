// Renders the AI-generated commentary card sitting between the stat tiles
// and the full data table. Returns empty string when no paragraph exists.

export function renderWhatThisMeans({ aiParagraph, fallback = false }) {
  if (!aiParagraph || aiParagraph.trim() === '') return '';
  const fallbackClass = fallback ? ' fallback' : '';
  return `<section class="what-this-means${fallbackClass}" aria-label="Tyler's read on this market right now">
  <p class="what-this-means-eyebrow">What this means right now</p>
  <p class="what-this-means-body">${aiParagraph}</p>
</section>`;
}
