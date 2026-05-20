// Renders the global site navigation. Matches the nav block from
// index.html, about.html, and similar pages so town pages feel like part
// of the same site.

export function renderSiteNav() {
  return `<nav class="nav">
    <a href="/" class="nav-logo">
      Mr. Sellers Homes
      <span>Bergen County, NJ &middot; RE/MAX</span>
    </a>
    <div class="nav-links">
      <a href="/#sell">Sell your home</a>
      <a href="/#buy">Buy in Bergen County</a>
      <a href="/#towns">Town directory</a>
      <a href="/#content">Guides &amp; walkthroughs</a>
      <a href="/about">About Tyler</a>
    </div>
    <a href="/#sell" class="nav-cta">Get your home&rsquo;s value</a>
    <button class="hamburger" id="hamburger" onclick="toggleMenu()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <a href="/#sell" onclick="closeMenu()">Sell your home</a>
    <a href="/#buy" onclick="closeMenu()">Buy in Bergen County</a>
    <a href="/#towns" onclick="closeMenu()">Town directory</a>
    <a href="/#content" onclick="closeMenu()">Guides &amp; walkthroughs</a>
    <a href="/about" onclick="closeMenu()">About Tyler</a>
    <a href="/#sell" class="mobile-cta" onclick="closeMenu()">Get your home&rsquo;s value</a>
  </div>

  <div class="red-bar">
    <div class="red-bar-item"><span class="red-bar-dot"></span>Bergen County specialist &middot; all 70 municipalities</div>
    <div class="red-bar-item"><span class="red-bar-dot"></span>Licensed since 2019</div>
    <div class="red-bar-item"><span class="red-bar-dot"></span>RE/MAX licensed agent</div>
    <div class="red-bar-item"><span class="red-bar-dot"></span>tyler@mrsellers.homes</div>
  </div>`;
}

export function renderSiteFooter() {
  // Compliance footer — NJAC 11:5-6.1 requires broker name prominence + brokerage
  // phone at predominant size. Self-contained inline styles so it renders
  // identically on every page regardless of host CSS.
  return `<footer class="compliance-footer" style="background:#111;color:rgba(255,255,255,0.7);padding:40px 24px;font-family:'Inter','DM Sans',sans-serif;font-size:13px;line-height:1.7;border-top:1px solid rgba(255,255,255,0.08);">
    <div style="max-width:920px;margin:0 auto;display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between;align-items:flex-start;">
      <div style="flex:1 1 260px;min-width:240px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:600;color:#fff;letter-spacing:0.01em;margin-bottom:8px;">RE/MAX Signature Homes</div>
        <div style="color:rgba(255,255,255,0.65);margin-bottom:4px;">189 Homans Ave, Suite C</div>
        <div style="color:rgba(255,255,255,0.65);margin-bottom:10px;">Closter, NJ 07624</div>
        <div><a href="tel:+12016609933" style="color:#fff;text-decoration:none;font-weight:500;font-size:15px;">(201) 660-9933</a></div>
      </div>
      <div style="flex:1 1 260px;min-width:240px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:rgba(255,255,255,0.85);">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" aria-label="Equal Housing Opportunity" style="flex-shrink:0;">
            <path d="M 50 15 L 90 50 L 78 50 L 78 85 L 22 85 L 22 50 L 10 50 Z"/>
            <text x="50" y="73" text-anchor="middle" font-family="Inter,sans-serif" font-size="32" font-weight="700" fill="currentColor" stroke="none">=</text>
          </svg>
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Equal Housing Opportunity</span>
        </div>
        <div style="color:rgba(255,255,255,0.65);margin-bottom:4px;">Tyler Sellers, Sales Associate</div>
        <div style="color:rgba(255,255,255,0.65);margin-bottom:12px;">NJ Real Estate License #1973328</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.55;margin-bottom:14px;">mrsellers.homes is the website of Tyler Sellers, Sales Associate at RE/MAX Signature Homes. Each office is independently owned and operated.</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);">
          <a href="/" style="color:inherit;text-decoration:none;margin-right:14px;">Home</a>
          <a href="/about" style="color:inherit;text-decoration:none;margin-right:14px;">About</a>
          <a href="/privacy" style="color:inherit;text-decoration:none;">Privacy</a>
        </div>
      </div>
    </div>
  </footer>`;
}

export function renderMobileMenuScript() {
  return `<script>
    function toggleMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
    }
    function closeMenu() {
      document.getElementById('mobileMenu').classList.remove('open');
    }

    // Silhouette lightbox: click the small map in the hero to open a
    // full-screen view of the same SVG. Click anywhere (including on the
    // map) to dismiss. Esc key also closes for keyboard users.
    (function () {
      var trigger = document.querySelector('[data-silhouette-trigger]');
      var modal = document.getElementById('silhouetteModal');
      if (!trigger || !modal) return;

      function openModal() {
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('silhouette-modal-open');
      }
      function closeModal() {
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('silhouette-modal-open');
      }

      trigger.addEventListener('click', openModal);
      modal.addEventListener('click', closeModal);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
      });
    })();

    // Stat-tile tooltips: each "?" button toggles a small popover with a
    // plain-English explanation. Click anywhere else, or press Esc, to close.
    (function () {
      var triggers = document.querySelectorAll('[data-tooltip-trigger]');
      if (triggers.length === 0) return;

      function closeAll() {
        document.querySelectorAll('.stat-tile-tooltip').forEach(function (t) {
          t.setAttribute('hidden', '');
        });
      }

      triggers.forEach(function (trigger) {
        trigger.addEventListener('click', function (e) {
          e.stopPropagation();
          var wrapper = trigger.parentNode;
          var tooltip = wrapper.querySelector('.stat-tile-tooltip');
          if (!tooltip) return;
          var wasHidden = tooltip.hasAttribute('hidden');
          closeAll();
          if (wasHidden) tooltip.removeAttribute('hidden');
        });
      });

      document.addEventListener('click', function (e) {
        // If the click is inside a tooltip itself, leave it open. Otherwise close.
        if (e.target.closest && e.target.closest('.stat-tile-tooltip')) return;
        if (e.target.matches && e.target.matches('[data-tooltip-trigger]')) return;
        closeAll();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAll();
      });
    })();

    // Histogram bar tooltips: hovering anywhere over a price bucket's
    // vertical column (the invisible full-height hit area) shows a small
    // floating tooltip near the cursor with the range and count. Works
    // across all charts on the page via a single global mousemove handler.
    (function () {
      var tooltip = document.querySelector('.chart-tooltip');
      if (!tooltip) return;
      var primaryEl = tooltip.querySelector('.chart-tooltip-primary');
      var secondaryEl = tooltip.querySelector('.chart-tooltip-secondary');
      var currentBar = null;

      function showFor(bar, x, y) {
        var primary = bar.getAttribute('data-tooltip-primary') || '';
        var secondary = bar.getAttribute('data-tooltip-secondary') || '';
        primaryEl.textContent = primary;
        secondaryEl.textContent = secondary;
        tooltip.removeAttribute('hidden');
        // Center horizontally on cursor, float just above so the cursor
        // does not cover the tooltip text. Falls back to below the cursor
        // only when there is no room above.
        var pad = 10;
        var ttW = tooltip.offsetWidth || 160;
        var ttH = tooltip.offsetHeight || 38;
        var left = x - (ttW / 2);
        var top = y - ttH - pad;
        // Clamp horizontally to viewport
        if (left < 8) left = 8;
        if (left + ttW > window.innerWidth - 8) left = window.innerWidth - ttW - 8;
        // If no room above, place below cursor instead
        if (top < 8) top = y + pad;
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      }

      function hide() {
        tooltip.setAttribute('hidden', '');
        currentBar = null;
      }

      document.addEventListener('mousemove', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;
        var bar = target.closest('.price-bar');
        if (bar) {
          currentBar = bar;
          showFor(bar, e.clientX, e.clientY);
        } else if (currentBar) {
          hide();
        }
      });

      document.addEventListener('mouseleave', hide);
    })();
  </script>`;
}
