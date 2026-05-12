// Renders the AI-generated commentary card sitting between the stat tiles
// and the full data table. Returns empty string when no paragraph exists.
//
// The AI may produce a multi-paragraph response with bullet lists and
// bold inline. We parse that via the same markdown subset used by the
// about-town renderer so the visual structure carries through.

import { parseMarkdownSubset, renderBlocks } from './markdown.js';

export function renderWhatThisMeans({ aiParagraph, fallback = false }) {
  if (!aiParagraph || aiParagraph.trim() === '') return '';
  const fallbackClass = fallback ? ' fallback' : '';
  const blocks = parseMarkdownSubset(aiParagraph);
  const body = renderBlocks(blocks);
  return `<section class="what-this-means${fallbackClass}" aria-label="Tyler's read on this market right now">
  <p class="what-this-means-eyebrow">What this means right now</p>
  <div class="what-this-means-body">
${body}
  </div>
</section>`;
}
