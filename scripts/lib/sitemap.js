// Build sitemap.xml for the live site. Lists the home page, the supporting
// static pages, and every town-real-estate page. Cloudflare/Google crawlers
// discover this via /robots.txt -> Sitemap directive.
//
// `lastmod` is set to today for every entry on each rebuild, which is the
// honest signal: when the regen runs (on a new monthly CSV or a content
// change), the pages did refresh.

const SITE_ORIGIN = 'https://mrsellers.homes';

// Static pages that live at the repo root and should be crawled.
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/about.html', priority: '0.7', changefreq: 'monthly' },
  { path: '/go.html', priority: '0.6', changefreq: 'monthly' },
  { path: '/glossary/', priority: '0.5', changefreq: 'yearly' }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function urlEntry({ path, priority, changefreq, lastmod }) {
  return `  <url>
    <loc>${SITE_ORIGIN}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Build the sitemap XML string for the full site.
 *
 * @param {Array<{slug:string, pageSlug:string}>} towns bergen-towns.json contents
 * @param {Array<{slug:string, updated:string}>} [posts] blog posts, newest first
 * @returns {string} XML document text
 */
export function buildSitemap(towns, posts = []) {
  const lastmod = todayISO();
  const staticEntries = STATIC_PAGES.map(p => urlEntry({ ...p, lastmod }));
  const blogEntries = posts.length
    ? [
        urlEntry({ path: '/blog/', priority: '0.7', changefreq: 'weekly', lastmod }),
        ...posts.map(p => urlEntry({
          path: `/blog/${p.slug}/`,
          priority: '0.6',
          changefreq: 'monthly',
          lastmod: p.updated
        }))
      ]
    : [];
  // Town pages are the bulk of the sitemap. Priority 0.8 each because they
  // are the SEO target. changefreq=monthly matches the data refresh cadence.
  const townEntries = towns.map(t => urlEntry({
    path: `/${t.pageSlug}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
${[...staticEntries, ...blogEntries, ...townEntries].join('\n')}
</urlset>
`;
}
