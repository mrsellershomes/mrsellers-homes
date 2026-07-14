// Shared markdown subset parser. Used by about-town and what-this-means
// renderers so AI-generated and Tyler-authored content can use the same
// minimal structure (paragraphs, bullet lists, bold inline, optional h3
// subheadings).
//
// Supported markdown:
//   ## Subheading        -> <h3>
//   - bullet item        -> <li> wrapped in <ul>
//   **bold inline**      -> <strong>
//   *italic inline*      -> <em>
//   | a | b | pipe rows  -> <table> (first row = header; |---| separator row skipped)
//   blank line           -> paragraph break
//   plain line           -> <p>

export function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export function inline(s) {
  return escapeHtml(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (m, text, href) =>
      `<a href="${href.replace(/"/g, '&quot;')}">${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
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
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (cells.every(c => /^:?-{3,}:?$/.test(c))) continue; // separator row
      if (!buffer || buffer.type !== 'table') {
        flush();
        buffer = { type: 'table', header: cells, rows: [] };
      } else {
        buffer.rows.push(cells);
      }
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
    if (b.type === 'table') {
      const head = b.header.map(c => `<th>${inline(c)}</th>`).join('');
      const rows = b.rows.map(r => `${indent}    <tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('\n');
      return `${indent}<div class="table-wrap">\n${indent}  <table>\n${indent}    <thead><tr>${head}</tr></thead>\n${indent}    <tbody>\n${rows}\n${indent}    </tbody>\n${indent}  </table>\n${indent}</div>`;
    }
    return '';
  }).join('\n');
}
