// Renders the "Compare to nearby towns" strip placed under the hero, so a
// research-heavy visitor comparing Bergen towns can hop sideways without
// having to scroll all the way down to the towns index.
//
// neighbors is an array of { name, slug } objects representing geographically
// adjacent towns. Sourced from data/bergen-towns.json's neighbors field.

export function renderNeighbors({ townName, neighbors }) {
  if (!neighbors || neighbors.length === 0) return '';
  const links = neighbors
    .map(n => `<a href="/${n.slug}-real-estate/">${n.name}</a>`)
    .join(' &middot; ');
  return `<nav class="neighbors-strip" aria-label="Nearby Bergen County towns">
  <span class="neighbors-label">Comparing ${townName}? Also see</span>
  <span class="neighbors-links">${links}</span>
</nav>`;
}
