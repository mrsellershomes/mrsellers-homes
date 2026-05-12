// Renders the top-of-page hero strip: silhouette + town name H1 + month label.
// The silhouette is wrapped in a button so it can be clicked to open the
// full-screen lightbox modal rendered alongside (see siteScripts in page.js
// for the click handler).

export function renderHero({ townName, townSlug, monthYear }) {
  const svgPath = `/assets/silhouettes/${townSlug}.svg`;
  return `<header class="town-hero">
  <button type="button" class="silhouette-trigger" aria-label="Enlarge Bergen County map highlighting ${townName}" data-silhouette-trigger>
    <img src="${svgPath}" alt="Bergen County silhouette with ${townName} highlighted" class="town-silhouette" loading="eager" width="120" height="120">
    <span class="silhouette-zoom-hint" aria-hidden="true">Click to enlarge</span>
  </button>
  <div class="town-hero-text">
    <h1>${townName} Real Estate</h1>
    <p class="town-hero-sub">Local market report for the last 6 months ending ${monthYear}</p>
    <p class="town-hero-attr">Updated monthly. Sales data from NJ MLS. School data from NJ DOE.</p>
  </div>
</header>

<div class="silhouette-modal" id="silhouetteModal" role="dialog" aria-modal="true" aria-label="Bergen County map highlighting ${townName}" aria-hidden="true" hidden>
  <img src="${svgPath}" alt="Bergen County silhouette with ${townName} highlighted, full size">
  <p class="silhouette-modal-caption">${townName}, Bergen County, NJ &middot; click anywhere to close</p>
</div>`;
}
