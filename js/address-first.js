// Two-step address-first seller lead form. Step 1: address only (feels like
// asking a question, not filling a form). Step 2: contact + TCPA consent.
// No network call until step 2 submits. Auto-wires <form class="af-form">.
(function () {
  'use strict';
  var WORKER_URL = 'https://forms-worker.tyler-681.workers.dev/lead';

  function revealStep2(form) {
    var s2 = form.querySelector('.af-step2');
    if (s2) s2.classList.remove('hidden');
    var addr = form.querySelector('input[name=address]');
    if (addr) addr.readOnly = true;
    var btn = form.querySelector('.af-step1-btn');
    if (btn) btn.classList.add('hidden');
    var name = form.querySelector('input[name=name]');
    if (name) name.focus();
  }

  function payloadFrom(form) {
    var get = function (n) {
      var el = form.querySelector('[name=' + n + ']');
      return el ? el.value.trim() : '';
    };
    var phone = get('phone');
    var consentEl = form.querySelector('input[name=smsConsent]');
    var p = {
      name: get('name'),
      email: get('email'),
      address: get('address'),
      message: get('message'),
      source: form.getAttribute('data-af-source') || 'MrSellers.homes | Address-first',
      tags: ['Address-First Lead'],
      intent: 'Seller'
    };
    if (phone) { p.phone = phone; p.smsConsent = !!(consentEl && consentEl.checked); }
    return p;
  }

  function wire(form) {
    var step2Visible = false;
    var phone = form.querySelector('input[name=phone]');
    var consentWrap = form.querySelector('.af-consent');
    if (phone && consentWrap) {
      phone.addEventListener('input', function () {
        consentWrap.classList.toggle('hidden', !phone.value.trim());
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      if (!step2Visible) {
        if (!form.querySelector('input[name=address]').value.trim()) {
          if (status) status.textContent = 'Enter your home address to get started.';
          return;
        }
        step2Visible = true;
        revealStep2(form);
        return;
      }
      var p = payloadFrom(form);
      if (!p.name || !p.email) {
        if (status) status.textContent = 'Name and email so Tyler can answer you.';
        return;
      }
      if (status) status.textContent = 'Sending...';
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      }).then(function (r) {
        if (!r.ok) throw new Error('worker ' + r.status);
        form.innerHTML = '<p class="af-thanks">Got it. Tyler will get back to you personally within one business day.</p>';
      }).catch(function () {
        if (status) status.textContent = 'Something hiccuped. Text Tyler directly: (201) 308-0525.';
      });
    });
  }

  document.querySelectorAll('form.af-form').forEach(wire);
})();
