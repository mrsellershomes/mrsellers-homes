// Renders the town-page-specific footer block that appears just inside the
// closing of the page (above the global site footer). Includes last-updated
// month, data attribution, and link to the towns index.

export function renderFooter({ monthYear, townsIndexUrl = '/towns/' }) {
  return `<footer class="town-footer">
  <p class="town-footer-update">Last updated: ${monthYear}</p>
  <p class="town-footer-data">Market data: <a href="https://www.redfin.com/news/data-center/" target="_blank" rel="noopener">Redfin Data Center</a> &middot; School data: NJ Department of Education</p>
  <p class="town-footer-towns"><a href="${townsIndexUrl}">View all 70 Bergen County towns &rarr;</a></p>
</footer>`;
}
