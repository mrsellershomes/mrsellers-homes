// Renders the town-page-specific footer block that appears just inside the
// closing of the page (above the global site footer). Includes last-updated
// month, data attribution, and link to the towns index.

// Compute "next update around the [N]th of [Month]". Tyler refreshes from
// NJMLS Custom Export on the 5th of each month (per the Calendar reminder),
// then the GitHub Action publishes within minutes.
function nextUpdateLabel(currentMonthYear) {
  // currentMonthYear like "April 2026" - we want next month's "5th of [next month]"
  const [monthName, year] = currentMonthYear.split(' ');
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const idx = months.indexOf(monthName);
  if (idx === -1) return 'Next update around the 5th of next month';
  // The data covers month N, the next refresh covers month N+1, which is
  // pulled from MLS on the 5th of month N+2.
  const refreshMonthIdx = (idx + 2) % 12;
  const refreshYear = idx + 2 > 11 ? Number(year) + 1 : Number(year);
  return `Next update around the 5th of ${months[refreshMonthIdx]} ${refreshYear}`;
}

export function renderFooter({ monthYear, townsIndexUrl = '/towns/' }) {
  return `<footer class="town-footer">
  <p class="town-footer-update">Last updated: ${monthYear} &middot; ${nextUpdateLabel(monthYear)}</p>
  <p class="town-footer-data">Sales data sourced directly from <abbr title="New Jersey Multiple Listing Service">NJ MLS</abbr> &middot; School data from the NJ Department of Education</p>
  <p class="town-footer-methodology">We don&rsquo;t show price per square foot. Bergen tax-record square footage is unreliable. Ask Tyler about a specific property and he&rsquo;ll verify the actual SqFt manually.</p>
  <p class="town-footer-towns"><a href="${townsIndexUrl}">View all 70 Bergen County towns &rarr;</a></p>
</footer>`;
}
