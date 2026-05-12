// Renders the "About [Town]" section with Tyler's locally relevant text.
// Returns empty string when no aboutText exists. The section is hidden
// entirely rather than showing a "coming soon" placeholder.
//
// Supports a tiny subset of markdown so Tyler's brain-dump content can
// have natural structure without writing HTML:
//   ## Subheading        -> <h3>
//   - bullet item        -> <li> wrapped in <ul>
//   **bold inline**      -> <strong>
//   blank line           -> paragraph break
//   plain line           -> <p>

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function inline(s) {
  // Apply **bold** transformation after HTML-escaping the rest.
  return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function parseAbout(text) {
  const lines = text.split('\n');
  const blocks = [];
  let buffer = null;

  function flush() {
    if (buffer) { blocks.push(buffer); buffer = null; }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'h3', content: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('- ')) {
      if (!buffer || buffer.type !== 'ul') {
        flush();
        buffer = { type: 'ul', items: [] };
      }
      buffer.items.push(line.slice(2).trim());
      continue;
    }
    // Regular paragraph: append to existing paragraph buffer or start new
    if (!buffer || buffer.type !== 'p') {
      flush();
      buffer = { type: 'p', content: line };
    } else {
      buffer.content += ' ' + line;
    }
  }
  flush();
  return blocks;
}

function renderBlocks(blocks) {
  return blocks.map(b => {
    if (b.type === 'h3') return `  <h3>${inline(b.content)}</h3>`;
    if (b.type === 'p') return `  <p>${inline(b.content)}</p>`;
    if (b.type === 'ul') {
      const items = b.items.map(i => `    <li>${inline(i)}</li>`).join('\n');
      return `  <ul>\n${items}\n  </ul>`;
    }
    return '';
  }).join('\n');
}

export function renderAboutTown({ townName, aboutText }) {
  if (!aboutText || aboutText.trim() === '') return '';
  const blocks = parseAbout(aboutText);
  if (blocks.length === 0) return '';
  const body = renderBlocks(blocks);
  return `<section class="about-town" aria-label="About ${townName}">
  <h2>About ${townName}</h2>
${body}
</section>`;
}
