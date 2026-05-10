// Shared Follow Up Boss form submission script for town real estate pages.
// Auto-discovers any <form class="lead-form"> on the page and wires up:
//   - phone-number formatting on inputs of type="tel"
//   - basic name/email validation
//   - submit handler that POSTs to FUB Events API with the source/tags
//     declared on the form via data-fub-source and data-fub-tags attributes
//   - success/error feedback in a sibling .form-status element
//
// FUB API key is the same one used across the rest of the site (stored
// client-side per existing deployment pattern). Source and tags are unique
// per town and per buyer/seller variant - they come from data-attributes
// rendered into each town page by scripts/lib/render/ctas.js.

(function () {
  'use strict';

  var FUB_API_KEY = 'fka_0E2H1dG5ch1zr3VepnlIt9Oczs5uXO3Fi8';
  var FUB_API_URL = 'https://api.followupboss.com/v1/events';

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
    var tags = tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean);

    var payload = {
      source: source,
      system: 'MrSellersHomes Website',
      type: 'Registration',
      person: { tags: tags }
    };

    if (data.name) {
      var parts = data.name.trim().split(/\s+/);
      payload.person.firstName = parts[0] || '';
      payload.person.lastName = parts.slice(1).join(' ') || '';
    }
    if (data.email) payload.person.emails = [{ value: data.email }];
    if (data.phone) payload.person.phones = [{ value: data.phone }];

    // Free-form context goes into the event message field. Anything beyond
    // name/email/phone is carried as a "message" so Tyler sees it in FUB.
    var contextLines = [];
    if (data.address) contextLines.push('Property address: ' + data.address);
    if (data.message) contextLines.push(data.message);
    if (contextLines.length > 0) payload.message = contextLines.join('\n\n');

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
      fetch(FUB_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(FUB_API_KEY + ':')
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('FUB returned ' + res.status);
        setStatus(form, 'success', "Got it. Tyler will read this and reply personally - usually within a few hours.");
        trackGoogleAnalytics(payload.source);
        // Reset form so user can submit a follow-up if they want.
        form.reset();
      }).catch(function (err) {
        setStatus(form, 'error', "Something glitched on our end. Email tyler@mrsellers.homes directly and I'll get back to you.");
        if (window.console && console.error) console.error('FUB submit failed:', err);
      }).then(function () {
        if (btn) { btn.textContent = originalLabel; btn.disabled = false; }
      });
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
