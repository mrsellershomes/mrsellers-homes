// Renders one blog post page. Reuses the site-wide nav/footer/tracking and
// the shared markdown subset so posts feel native to the rest of the site.
import { parseMarkdownSubset, renderBlocks, inline, escapeHtml } from './markdown.js';
import { renderSiteNav, renderSiteFooter, renderMobileMenuScript } from './site-nav.js';
import { TRACKING_HEAD, FONTS_HEAD, escapeAttr } from './head-common.js';
import { TYLER_AGENT } from './agent-entity.js';

const SITE_ORIGIN = 'https://mrsellers.homes';

function buildSchema(post, canonicalUrl) {
  const graph = [
    TYLER_AGENT,
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      author: { '@id': TYLER_AGENT['@id'] },
      publisher: { '@id': TYLER_AGENT['@id'] },
      datePublished: post.date,
      dateModified: post.updated,
      mainEntityOfPage: canonicalUrl,
      keywords: post.tags.join(', ')
    }
  ];
  if (post.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function renderFaqSection(faq) {
  if (!faq.length) return '';
  const items = faq.map(({ q, a }) => `    <div class="post-faq-item">
      <h3>${inline(q)}</h3>
      <p>${inline(a)}</p>
    </div>`).join('\n');
  return `  <section class="post-faq" aria-label="Common questions">
    <h2>Common questions</h2>
${items}
  </section>`;
}

function renderCta(post) {
  const source = `MrSellers.homes | Blog | ${post.slug}`;
  const tags = `Blog Lead,Post: ${post.slug}`;
  return `  <section class="post-cta" aria-label="Get in touch">
    <h2>Thinking about a move in Bergen County?</h2>
    <p>If this post hit on something you&rsquo;ve been turning over, send me what&rsquo;s on your mind. You&rsquo;ll get an honest read back, not a pitch.</p>
    <form class="lead-form" data-fub-source="${escapeAttr(source)}" data-fub-tags="${escapeAttr(tags)}" novalidate>
      <label class="form-row"><span class="form-label">Name</span><input type="text" name="name" autocomplete="name" required></label>
      <label class="form-row"><span class="form-label">Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="form-row"><span class="form-label">What&rsquo;s on your mind?</span><textarea name="message" rows="3"></textarea></label>
      <button type="submit" class="btn-red">Send</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </section>`;
}

function displayDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function renderBlogPost(post) {
  const canonicalUrl = `${SITE_ORIGIN}/blog/${post.slug}/`;
  const schema = buildSchema(post, canonicalUrl);
  const body = renderBlocks(parseMarkdownSubset(post.body));
  const sourceBlock = post.sourceUrl
    ? `  <p class="post-source">Riffing on reporting from <a href="${escapeAttr(post.sourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(post.sourceName || 'the original article')}</a> &mdash; the Bergen County read is mine.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(post.title)} | Tyler Sellers</title>
<meta name="description" content="${escapeAttr(post.description)}">
<link rel="canonical" href="${escapeAttr(canonicalUrl)}">
<meta property="og:title" content="${escapeAttr(post.title)}">
<meta property="og:description" content="${escapeAttr(post.description)}">
<meta property="og:url" content="${escapeAttr(canonicalUrl)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
${FONTS_HEAD}
<link rel="stylesheet" href="/css/blog.css">
<link rel="icon" href="/favicon.png">
${TRACKING_HEAD}
</head>
<body class="blog-page">
${renderSiteNav()}
<main class="blog-main">
  <article class="post">
    <p class="post-eyebrow"><a href="/blog/">The Sellers&rsquo; Take</a></p>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="post-meta">By Tyler Sellers &middot; ${displayDate(post.date)}${post.updated !== post.date ? ` &middot; Updated ${displayDate(post.updated)}` : ''}</p>
${sourceBlock}
    <div class="post-body">
${body}
    </div>
${renderFaqSection(post.faq)}
${renderCta(post)}
  </article>
</main>
${renderSiteFooter()}
${renderMobileMenuScript()}
<script src="/js/fub-submit.js"></script>
</body>
</html>`;
}
