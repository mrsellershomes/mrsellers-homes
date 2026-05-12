// Renders the "About [Town]" section with Tyler's locally relevant text.
// Returns empty string when no aboutText exists. The section is hidden
// entirely rather than showing a "coming soon" placeholder.
//
// Supports a tiny subset of markdown via the shared parser in markdown.js
// so Tyler's brain-dump content can have natural structure without
// writing HTML.

import { parseMarkdownSubset, renderBlocks } from './markdown.js';

export function renderAboutTown({ townName, aboutText }) {
  if (!aboutText || aboutText.trim() === '') return '';
  const blocks = parseMarkdownSubset(aboutText);
  if (blocks.length === 0) return '';
  const body = renderBlocks(blocks);
  return `<section class="about-town" aria-label="About ${townName}">
  <h2>About ${townName}</h2>
${body}
</section>`;
}
