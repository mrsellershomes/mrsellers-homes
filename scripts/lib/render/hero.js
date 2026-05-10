// Renders the top-of-page hero strip: silhouette + town name H1 + month label.

export function renderHero({ townName, townSlug, monthYear }) {
  return `<header class="town-hero">
  <img src="/assets/silhouettes/${townSlug}.svg" alt="Bergen County silhouette with ${townName} highlighted" class="town-silhouette" loading="eager" width="120" height="120" aria-label="Bergen County map highlighting ${townName}">
  <div class="town-hero-text">
    <p class="town-hero-eyebrow">Local market report</p>
    <h1>${townName} Real Estate</h1>
    <p class="town-hero-sub">${monthYear}</p>
    <p class="town-hero-attr">Updated monthly &middot; Sales data direct from NJ MLS &middot; Schools data from NJ DOE</p>
  </div>
</header>`;
}
