// Renders the optional Tyler video and blog section. Each part is
// conditional; if both are empty, the whole section is hidden. New content
// is added by editing data/towns-content.json. No rebuild structure
// changes are needed.

function titleCase(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function renderVideosBlogs({ townName, videos = [], blogs = [] }) {
  if ((!videos || videos.length === 0) && (!blogs || blogs.length === 0)) return '';

  const videoEmbeds = (videos || []).map(id => `  <div class="video-embed">
    <iframe
      src="https://www.youtube.com/embed/${id}"
      title="Tyler Sellers town guide for ${townName}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"></iframe>
  </div>`).join('\n');

  const blogCards = (blogs || []).map(slug => `    <a class="blog-card" href="/blog/${slug}/">
      <h3>${titleCase(slug)}</h3>
      <span class="blog-card-arrow">&rarr;</span>
    </a>`).join('\n');

  const blogSection = blogCards
    ? `  <div class="blog-cards">
${blogCards}
  </div>`
    : '';

  const heading = videoEmbeds
    ? `  <h2>${townName} town guide</h2>
  <p class="videos-blogs-intro">A deeper read on what living in ${townName} actually feels like. Tyler walks through the commute, the schools, the neighborhoods, and what living here actually costs in 2026.</p>`
    : `  <h2>From the ${townName} blog</h2>`;

  return `<section class="videos-blogs" aria-label="Tyler's content for ${townName}">
${heading}
${videoEmbeds}
${blogSection}
</section>`;
}
