# Shared CTA Blocks (phase-2 design system)

Two reusable lead-capture patterns. Copy the markup exactly; both are auto-wired by their scripts on page load. Source-string convention: `MrSellers.homes | <Page> | <Variant>`.

## 1. Address-first seller form (`js/address-first.js`)

Two steps in one `<form>`: step 1 shows only the address field (no network call on submit; it reveals step 2). Step 2 collects name/email/optional phone. The TCPA consent block stays hidden until the phone field has a value. Script wires any `form.af-form`.

```html
<form class="af-form" data-af-source="MrSellers.homes | Homepage | Seller (address-first)">
  <div class="flex flex-col sm:flex-row gap-3">
    <input type="text" name="address" placeholder="Enter your home address" autocomplete="street-address"
           class="flex-1 border border-neutral-300 bg-white rounded-md px-4 py-4 text-base focus:outline-brand">
    <button type="submit" class="af-step1-btn bg-brand text-white font-medium rounded-md px-7 py-4 text-base hover:bg-[#c30016]">What&rsquo;s it worth?</button>
  </div>
  <div class="af-step2 hidden mt-4 grid gap-3 text-left">
    <input type="text" name="name" placeholder="Name" autocomplete="name" required class="border border-neutral-300 bg-white rounded-md px-4 py-3">
    <input type="email" name="email" placeholder="Email" autocomplete="email" required class="border border-neutral-300 bg-white rounded-md px-4 py-3">
    <input type="tel" name="phone" placeholder="Phone (optional, for a faster answer)" autocomplete="tel" class="border border-neutral-300 bg-white rounded-md px-4 py-3">
    <!-- TCR-approved consent language. Copied VERBATIM from go.html. Never paraphrase. -->
    <label class="af-consent hidden flex items-start gap-2 text-[11px] leading-snug text-neutral-600 bg-white border border-rule rounded p-3 cursor-pointer">
      <input type="checkbox" name="smsConsent" value="yes" class="mt-0.5 shrink-0 accent-[#E2001A]">
      <span><strong class="block text-ink text-xs font-semibold mb-0.5">Text me real estate info from Mr. Sellers Homes.</strong>Recurring messages from Mr. Sellers Homes (Tyler Sellers, RE/MAX Signature Homes): showing confirmations, property updates, follow-ups. Frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. See <a href="/privacy" class="text-brand underline">Privacy Policy</a>.</span>
    </label>
    <button type="submit" class="bg-brand text-white font-medium rounded-md px-7 py-3.5 hover:bg-[#c30016]">Send it to Tyler</button>
  </div>
  <p class="form-status text-sm text-neutral-500 mt-2" role="status" aria-live="polite"></p>
</form>
```

Payload on step-2 submit: `{name, email, address, message?, phone?, smsConsent?, source, tags:['Address-First Lead'], intent:'Seller'}` → POST `https://forms-worker.tyler-681.workers.dev/lead`.

## 2. Conversation form (`js/fub-submit.js`, existing)

Standard `form.lead-form` with `data-fub-source` / `data-fub-tags`; the shared script handles validation, phone formatting, intent extraction from tags, POST, and `.form-status` feedback. Use for buyer asks (no phone field = no consent block needed).

```html
<form class="lead-form" data-fub-source="MrSellers.homes | Buy Page | Buyer" data-fub-tags="Buy Page Lead,Intent: Buyer" novalidate>
  <label class="form-row"><span class="form-label">Name</span><input type="text" name="name" autocomplete="name" required></label>
  <label class="form-row"><span class="form-label">Email</span><input type="email" name="email" autocomplete="email" required></label>
  <label class="form-row"><span class="form-label">What&rsquo;s the question you keep coming back to?</span><textarea name="message" rows="3"></textarea></label>
  <button type="submit" class="btn-red">Send</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>
```

Rules for both: red button is the only red element in the block; status messages in porch voice; no em dashes.
