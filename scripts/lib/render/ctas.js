// Renders the two parallel CTAs at the bottom of every town page:
// a buyer card and a seller card. Both POST to FUB Events API via the
// shared /js/fub-submit.js script, which reads source/tags from the
// data-fub-source and data-fub-tags attributes on each form element.
//
// Voice and copy match the spec's "advisor energy, not salesman energy"
// direction: visitors who land here have already been thinking about a
// move for weeks or months and want substantive feedback, not a pitch.

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function renderCtas({ townName }) {
  const sourceBuyer = `MrSellers.homes — ${townName} Real Estate Page (Buyer)`;
  const sourceSeller = `MrSellers.homes — ${townName} Real Estate Page (Seller)`;
  const tagsBuyer = `Market Page Lead,Town: ${townName},Intent: Buyer`;
  const tagsSeller = `Market Page Lead,Town: ${townName},Intent: Seller`;

  return `<section class="town-ctas" aria-label="Get in touch about ${townName}">
  <div class="cta-card cta-buyer">
    <p class="cta-eyebrow">For buyers</p>
    <h2>Been thinking about buying in ${townName}?</h2>
    <p class="cta-body">Most people who land here have already been at this for a while. Running searches, watching the same houses come and go, turning the same questions over for weeks or months. If that&rsquo;s where you&rsquo;re at, send me what&rsquo;s been on your mind. I read these reports every month for the people I work with, and I&rsquo;ll send back what I actually think. Not a pitch, not a calendar invite. Honest feedback on the moves you&rsquo;ve been pondering.</p>
    <form class="lead-form" data-fub-source="${escapeAttr(sourceBuyer)}" data-fub-tags="${escapeAttr(tagsBuyer)}" novalidate>
      <label class="form-row"><span class="form-label">Name</span><input type="text" name="name" autocomplete="name" required></label>
      <label class="form-row"><span class="form-label">Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="form-row"><span class="form-label">Phone <span class="form-optional">(optional)</span></span><input type="tel" name="phone" autocomplete="tel"></label>
      <label class="form-row"><span class="form-label">What&rsquo;s been on your mind?</span><textarea name="message" rows="3" placeholder="The questions you&rsquo;ve been turning over."></textarea></label>
      <button type="submit" class="btn-red">Send</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
  <div class="cta-card cta-seller">
    <p class="cta-eyebrow">For sellers</p>
    <h2>Been thinking about selling your home in ${townName}?</h2>
    <p class="cta-body">If you&rsquo;ve been running the math, watching your block, and quietly wondering what your home would actually trade for in this market, that&rsquo;s the kind of question worth a real conversation. Not a generic home valuation form. Send the address and what&rsquo;s prompting the thought. You&rsquo;ll get an honest read from someone who&rsquo;s been in this market for years.</p>
    <form class="lead-form" data-fub-source="${escapeAttr(sourceSeller)}" data-fub-tags="${escapeAttr(tagsSeller)}" novalidate>
      <label class="form-row"><span class="form-label">Name</span><input type="text" name="name" autocomplete="name" required></label>
      <label class="form-row"><span class="form-label">Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="form-row"><span class="form-label">Address of home in ${townName}</span><input type="text" name="address" autocomplete="street-address" required></label>
      <label class="form-row"><span class="form-label">What&rsquo;s prompting the question?</span><textarea name="message" rows="3" placeholder="Timing, life change, just curious - whatever it is."></textarea></label>
      <button type="submit" class="btn-red">Send</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
}
