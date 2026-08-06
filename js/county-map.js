/* Interactive Bergen County map, shared by the homepage and /towns/.
 *
 * Hover (mouse) or tap (touch) a town to preview its real NJMLS stats in the
 * card around the map. Data comes from assets/town-stats.json, regenerated with
 * every monthly data run.
 *
 * Two pages, one implementation on purpose: the homepage and /towns/ used to
 * carry separate copies, and they drifted -- the homepage sized its map in a way
 * that collapsed to 0x0 in WebKit (invisible on every iPhone) while /towns/ was
 * fine. Keep this the only copy.
 *
 * Configured entirely from markup, so this file has no per-page branching:
 *   #countyMap[data-map-src]         fetch and inject this SVG (homepage).
 *                                    Omit when the SVG is already inline (/towns/).
 *   #countyMap[data-map-max-height]  optional max-height for the injected SVG.
 *
 * Idle state is snapshotted from the DOM at init, so each page declares its own
 * defaults in markup rather than here.
 *
 * Fails soft at every step: no stats leaves the idle card, no SVG leaves whatever
 * static fallback the page already rendered.
 */
(function () {
  var holder = document.getElementById('countyMap');
  if (!holder) return;

  var SLOTS = ['mapTownName', 'msMedian', 'msMedianL', 'msSold', 'msSoldL', 'msPct', 'msPctL'];
  var RED = '#E2001A';
  var stats = null;

  function el(id) { return document.getElementById(id); }
  function setText(id, v) { var n = el(id); if (n) n.textContent = v; }

  // Snapshot the page's own idle state before anything changes it.
  var idle = {};
  SLOTS.forEach(function (id) { var n = el(id); if (n) idle[id] = n.textContent; });
  var ctaEl = el('mapCta');
  var idleCta = ctaEl ? { href: ctaEl.getAttribute('href'), text: ctaEl.textContent } : null;

  function fmtMoney(n) {
    if (!n) return '–';
    return n >= 1e6 ? '$' + (n / 1e6).toFixed(2).replace(/0$/, '') + 'M' : '$' + Math.round(n / 1000) + 'K';
  }

  function showTown(href) {
    var t = stats && stats[href.replace(/\//g, '')];
    if (!t) return;
    setText('mapTownName', t.name);
    setText('msMedian', fmtMoney(t.median)); setText('msMedianL', 'median sale price');
    setText('msSold', t.sold != null ? t.sold : '–'); setText('msSoldL', 'homes sold');
    setText('msPct', t.pctList != null ? (t.pctList * 100).toFixed(1) + '%' : '–'); setText('msPctL', 'of list price');
    if (ctaEl) { ctaEl.href = href; ctaEl.textContent = t.name + ' market report →'; }
  }

  function reset() {
    SLOTS.forEach(function (id) { if (idle[id] != null) setText(id, idle[id]); });
    if (ctaEl && idleCta) { ctaEl.href = idleCta.href; ctaEl.textContent = idleCta.text; }
  }

  // The homepage search box previews a town on suggestion hover.
  window.__showTownOnMap = showTown;

  if (window.fetch) {
    fetch('/assets/town-stats.json').then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (j) {
      if (!j) return;
      stats = j.towns;
      var per = el('mapPeriod');
      if (per && j.period) per.textContent = 'Closed NJMLS sales, ' + j.period + '.';
    }).catch(function () { /* idle card remains */ });
  }

  function isTouchUI() {
    return window.__forceTouchUI || (window.matchMedia && window.matchMedia('(hover: none)').matches);
  }

  function wire() {
    var svg = holder.querySelector('svg');
    if (!svg) return;

    // The SVG has a viewBox but no intrinsic width/height. width:auto against a
    // parent with no definite height resolves to 0x0 in WebKit -- a blank map on
    // iPhone and in the Instagram in-app browser. Size it like an <img>.
    svg.style.width = '100%';
    svg.style.height = 'auto';
    var cap = holder.getAttribute('data-map-max-height');
    if (cap) svg.style.maxHeight = cap;

    if (isTouchUI()) {
      var hoverHint = document.querySelector('.hint-hover');
      var touchHint = document.querySelector('.hint-touch');
      if (hoverHint) hoverHint.classList.add('hidden');
      if (touchHint) touchHint.classList.remove('hidden');
    }

    var selected = null;
    Array.prototype.forEach.call(holder.querySelectorAll('a'), function (a) {
      var href = a.getAttribute('href');
      if (!href) return;

      // Mouse: hover previews, leaving resets unless a town is stuck. Click falls
      // through to the town page as a normal link.
      a.addEventListener('mouseenter', function () { if (!isTouchUI()) showTown(href); });
      a.addEventListener('mouseleave', function () { if (!isTouchUI() && !selected) reset(); });

      // Touch: first tap previews and sticks, the CTA below commits.
      a.addEventListener('click', function (e) {
        if (!isTouchUI()) return;
        e.preventDefault();
        if (selected) selected.style.fill = '';
        var shape = a.querySelector('.town-shape');
        if (shape) { shape.style.fill = RED; selected = shape; }
        showTown(href);
      });
    });
  }

  var src = holder.getAttribute('data-map-src');
  if (!src) { wire(); return; }              // SVG already inline (/towns/)
  if (!window.fetch) return;                 // static fallback stays
  fetch(src).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.text();
  }).then(function (markup) {
    holder.innerHTML = markup;
    wire();
  }).catch(function () { /* static <img> remains */ });
})();
