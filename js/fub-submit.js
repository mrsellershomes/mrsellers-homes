// Shared lead-form submission script for town real estate pages.
// Auto-discovers any <form class="lead-form"> on the page and wires up:
//   - phone-number formatting on inputs of type="tel"
//   - basic name/email validation
//   - submit handler that POSTs to the forms-worker Cloudflare Worker
//     (which writes to Airtable as the source of truth and mirrors to FUB
//     during transition)
//   - success/error feedback in a sibling .form-status element
//
// Source and tags are unique per town and per buyer/seller variant - they come
// from data-fub-source / data-fub-tags attributes rendered into each town page
// by scripts/lib/render/ctas.js. The attribute names kept "fub-" prefix for
// compatibility; behavior now routes through the Worker.

(function () {
  'use strict';

  var WORKER_URL = 'https://forms-worker.tyler-681.workers.dev/lead';

  // Tags that indicate intent — extracted out of the data-fub-tags list and
  // sent as the explicit `intent` field on the /lead payload.
  var INTENT_MAP = {
    'buyer': 'Buyer',
    'seller': 'Seller',
    'buyer/seller': 'Buyer/Seller'
  };

  function formatPhone(input) {
    var digits = input.value.replace(/\D/g, '');
    // Strip leading "1" (country code), capped at 10 digits.
    if (digits.length >= 4 && digits.charAt(0) === '1') {
      digits = digits.substring(1);
    }
    digits = digits.substring(0, 10);
    var formatted = '';
    if (digits.length === 0) formatted = '';
    else if (digits.length <= 3) formatted = '(' + digits;
    else if (digits.length <= 6) formatted = '(' + digits.substring(0, 3) + ') ' + digits.substring(3);
    else formatted = '(' + digits.substring(0, 3) + ') ' + digits.substring(3, 6) + '-' + digits.substring(6);
    input.value = formatted;
  }

  function readFormData(form) {
    var data = {};
    var inputs = form.querySelectorAll('input, textarea, select');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (!el.name) continue;
      data[el.name] = el.value.trim();
    }
    return data;
  }

  function buildPayload(form, data) {
    var source = form.getAttribute('data-fub-source') || 'MrSellers.homes Lead Form';
    var tagsRaw = form.getAttribute('data-fub-tags') || '';
    var rawList = tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean);

    var intent;
    var tags = [];
    for (var i = 0; i < rawList.length; i++) {
      var lower = rawList[i].toLowerCase();
      if (!intent && INTENT_MAP[lower]) {
        intent = INTENT_MAP[lower];
      } else {
        tags.push(rawList[i]);
      }
    }

    var context = {};
    if (data.address) context['Property'] = data.address;

    var payload = { name: data.name || '', email: data.email || '', source: source };
    if (data.phone) payload.phone = data.phone;
    if (intent) payload.intent = intent;
    if (tags.length > 0) payload.tags = tags;
    if (Object.keys(context).length > 0) payload.context = context;
    if (data.message) payload.message = data.message;

    return payload;
  }

  function setStatus(form, kind, text) {
    var status = form.querySelector('.form-status');
    if (!status) return;
    status.textContent = text;
    status.setAttribute('data-status', kind);
  }

  function validate(form, data) {
    var errors = [];
    if (!data.name) errors.push('Please enter your name.');
    if (!data.email || !data.email.includes('@')) errors.push('Please enter a valid email address.');
    return errors;
  }

  function trackGoogleAnalytics(source) {
    if (typeof gtag === 'function') {
      gtag('event', 'lead_form_submit', { source: source });
    }
  }

  function attachForm(form) {
    // Phone formatting
    var phoneInputs = form.querySelectorAll('input[type="tel"]');
    for (var i = 0; i < phoneInputs.length; i++) {
      phoneInputs[i].addEventListener('input', function (e) { formatPhone(e.target); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = readFormData(form);
      var errors = validate(form, data);
      if (errors.length > 0) {
        setStatus(form, 'error', errors.join(' '));
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
      setStatus(form, 'sending', 'Sending...');

      var payload = buildPayload(form, data);
      // Fire-and-forget: show success immediately. Worker handles Airtable + FUB.
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function (err) {
        if (window.console && console.error) console.error('Worker submit failed:', err);
      });
      setStatus(form, 'success', "Got it. Tyler will read this and reply personally - usually within a few hours.");
      trackGoogleAnalytics(payload.source);
      form.reset();
      if (btn) { btn.textContent = originalLabel; btn.disabled = false; }
    });
  }

  function init() {
    var forms = document.querySelectorAll('form.lead-form');
    for (var i = 0; i < forms.length; i++) attachForm(forms[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
