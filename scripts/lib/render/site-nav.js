// Renders the global site navigation - matches the nav block from
// index.html, about.html, etc. so town pages feel like part of the site.

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
  return `<footer class="footer">
    <div class="footer-logo">Mr. Sellers Homes</div>
    <div><span class="footer-red">tyler@mrsellers.homes</span> &middot; Bergen County, NJ &middot; RE/MAX Licensed Agent</div>
    <div>&copy; 2026 Tyler Sellers</div>
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
  </script>`;
}
