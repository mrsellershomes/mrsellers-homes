// Renders the <head> meta tags for a town real estate page: title, description,
// canonical, OpenGraph, Twitter card, and JSON-LD structured data.

import { TYLER_AGENT } from './agent-entity.js';

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function renderMeta({ townName, townSlug, monthYear, metaDescription, canonicalUrl, ogImageUrl }) {
  const title = `${townName} Real Estate Market Report for ${monthYear} | Tyler Sellers`;
  const headline = `${townName} Real Estate Market Report for ${monthYear}`;
  const today = new Date().toISOString().slice(0, 10);
  const ogImage = ogImageUrl || `https://mrsellers.homes/assets/og/${townSlug}.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      TYLER_AGENT,
      {
        '@type': 'Article',
        headline,
        author: { '@id': TYLER_AGENT['@id'] },
        publisher: { '@id': TYLER_AGENT['@id'] },
        datePublished: today,
        dateModified: today,
        mainEntityOfPage: canonicalUrl,
        about: { '@type': 'Place', name: `${townName}, NJ` }
      }
    ]
  };

  return `<title>${title}</title>
<meta name="description" content="${escapeAttr(metaDescription)}">
<link rel="canonical" href="${escapeAttr(canonicalUrl)}">
<meta property="og:title" content="${escapeAttr(headline)}">
<meta property="og:description" content="${escapeAttr(metaDescription)}">
<meta property="og:url" content="${escapeAttr(canonicalUrl)}">
<meta property="og:image" content="${escapeAttr(ogImage)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
