# 38 Taylor Drive — Off-Market Property Page

**Date:** 2026-04-07
**URL:** mrsellers.homes/38taylor (file: `38taylor.html` in repo root)

## Purpose

A mobile-first property page for an off-market office exclusive listing. Tyler sends the link via TikTok DM to a prospect. She taps it, sees the property details and video walkthrough, and taps a sticky CTA to text Tyler about booking a showing.

## Property Details

- **Address:** 38 Taylor Drive, Closter, NJ 07624
- **Price:** $1,750,000
- **Bedrooms:** 4
- **Bathrooms:** 2 full, 1 half (2.5)
- **Interior:** 2,412 SF
- **Lot:** 14,810 SF
- **Key features:** All living spaces gut renovated. Finished basement original but in perfect condition.
- **Listing broker:** Eddie An, RE/MAX Signature Homes
- **Presented by:** Tyler Sellers, RE/MAX Select

## Page Structure

### Tech Stack
- Single HTML file (`38taylor.html`)
- Tailwind CSS via CDN (same as go.html)
- Google Fonts: Playfair Display + DM Sans (matching brand)
- No build step

### Section 1: Hero
- "Off-Market Exclusive" red badge/pill
- Full address as heading
- Price prominent
- Stat row with icons: 4 BD | 2.5 BA | 2,412 SF | 14,810 SF Lot
- Broker credit: "Listed by Eddie An — RE/MAX Signature Homes"
- Presenter credit: "Presented by Tyler Sellers, RE/MAX Select"

### Section 2: Video Walkthrough
- Heading: "Full Video Walkthrough"
- TikTok embed (video ID: 7624241793021791502)
- Embed code provided by TikTok, loaded via their embed.js script

### Section 3: Property Highlights
- Card-style highlights:
  - "Gut-renovated living spaces throughout"
  - "Finished basement in pristine condition"
  - "Nearly 1/3 acre lot (14,810 SF)"
  - "Closter, Bergen County — top-rated schools"

### Section 4: Sticky CTA
- Fixed to bottom of viewport
- Red button (#FF1200), full-width with padding
- Text: "Book a Private Showing"
- Action: `sms:+12013080525?body=Hi%20Tyler%2C%20I%27d%20like%20to%20book%20a%20private%20showing%20at%2038%20Taylor%20Dr%2C%20Closter.%20I%27m%20available%20`
- Button has enough bottom padding to clear any phone safe area

## Tracking

- **FUB Pixel:** WT-HHUBDZCX (fires on page load)
- **GA4:** G-5VC5MDECPH
  - Custom event: `sms_showing_click` on CTA tap
- **Microsoft Clarity:** w1n2wmq26w
  - Tag: `property_page`, `38taylor`

## Branding

- Primary red: #FF1200
- Hover red: #cc0e00
- Black text: #111111
- Gray text: #6b6b6b
- Background: #f5f5f5 for highlight cards
- Button corners: 2px border-radius (matching site style)
- Fonts: Playfair Display for headings, DM Sans for body

## Deployment

- Add `38taylor.html` to `mrsellers-homes/` repo
- Push to GitHub Pages
- Accessible at mrsellers.homes/38taylor
- No Cloudflare Worker needed (direct path)

## Out of Scope

- No form / no FUB event submission (SMS is the CTA, not a form)
- No photos (text + video only)
- No MLS data or disclaimers (off-market, not on MLS)
