// Renders the blog index at /blog/ — a card list of every post, newest first.
import { renderSiteNav, renderSiteFooter, renderMobileMenuScript } from './site-nav.js';
import { TRACKING_HEAD, FONTS_HEAD, escapeAttr } from './head-common.js';
import { TYLER_AGENT } from './agent-entity.js';
import { escapeHtml } from './markdown.js';

const SITE_ORIGIN = 'https://mrsellers.homes';

function displayDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function renderBlogIndex(posts) {
  const canonicalUrl = `${SITE_ORIGIN}/blog/`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      TYLER_AGENT,
      {
        '@type': 'Blog',
        name: "The Sellers' Take",
        url: canonicalUrl,
        author: { '@id': TYLER_AGENT['@id'] }
      }
    ]
  };
  const cards = posts.map(p => `    <a class="post-card" href="/blog/${p.slug}/">
      <p class="post-card-date">${displayDate(p.date)}</p>
      <h2>${escapeHtml(p.title)}</h2>
      <p class="post-card-desc">${escapeHtml(p.description)}</p>
      <span class="post-card-arrow">Read &rarr;</span>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Sellers&rsquo; Take Blog | Tyler Sellers</title>
<meta name="description" content="NJ selling mechanics, Bergen County market reads, and what the economy actually means for your house. By Tyler Sellers.">
<link rel="canonical" href="${escapeAttr(canonicalUrl)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
${FONTS_HEAD}
<link rel="stylesheet" href="/css/blog.css">
<link rel="icon" href="/favicon.png">
${TRACKING_HEAD}
</head>
<body class="blog-page">
${renderSiteNav()}
<main class="blog-main">
  <header class="blog-header">
    <h1>The Sellers&rsquo; Take</h1>
    <p>The economy, translated to Bergen County real estate. No hype, no scare headlines. Just what the numbers actually mean if you own (or want to own) a home here.</p>
  </header>
  <section class="post-cards" aria-label="All posts">
${cards}
  </section>
</main>
${renderSiteFooter()}
${renderMobileMenuScript()}
</body>
</html>`;
}
