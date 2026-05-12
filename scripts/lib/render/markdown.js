// Shared markdown subset parser. Used by about-town and what-this-means
// renderers so AI-generated and Tyler-authored content can use the same
// minimal structure (paragraphs, bullet lists, bold inline, optional h3
// subheadings).
//
// Supported markdown:
//   ## Subheading        -> <h3>
//   - bullet item        -> <li> wrapped in <ul>
//   **bold inline**      -> <strong>
//   blank line           -> paragraph break
//   plain line           -> <p>

export function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export function inline(s) {
  return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function parseMarkdownSubset(text) {
  const lines = String(text).split('\n');
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

export function renderBlocks(blocks, indent = '  ') {
  return blocks.map(b => {
    if (b.type === 'h3') return `${indent}<h3>${inline(b.content)}</h3>`;
    if (b.type === 'p') return `${indent}<p>${inline(b.content)}</p>`;
    if (b.type === 'ul') {
      const items = b.items.map(i => `${indent}  <li>${inline(i)}</li>`).join('\n');
      return `${indent}<ul>\n${items}\n${indent}</ul>`;
    }
    return '';
  }).join('\n');
}
