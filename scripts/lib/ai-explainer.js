// AI commentary generator for the "What this means right now" card on each
// town page. Calls Claude Opus 5 with prompt caching so the voice rules,
// hard constraints, and audience persona are billed once and reused across
// all 70 towns each refresh.
//
// Public API:
//   generateAiParagraph(opts) -> { paragraph, fromCache, fallback, reason }
//
// Output is cached to data/ai-paragraphs/<slug>.json keyed by a hash of the
// stats payload so an unchanged month does not re-bill. The fallback is a
// stats-driven template paragraph used when the API call fails or the
// generated text fails post-processing (em dashes, smart quotes, the
// "just" softener, or a known-banned building name).

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Opus 5: thinking is on by default and counts against max_tokens, so the
// cap is sized for reasoning + a 220-word paragraph, not just the paragraph.
const MODEL = 'claude-opus-5';
const MAX_TOKENS = 8000;
const CACHE_DIR = 'data/ai-paragraphs';

// Buildings that exist only in rental databases and must never appear in
// sales-data commentary. Extend per memory: reference_fort_lee_buildings.md
// and reference_town_about_content.md (rental-only dual-context rule).
const RENTAL_ONLY_BANNED = [
  'Hudson Lights',
  'Modera Fort Lee',
  'Modera'
];

const SYSTEM_PROMPT = `You write the "What this means right now" paragraph that appears on a Bergen County town real estate market report page, in the voice of Tyler Sellers, a RE/MAX agent in Bergen County NJ.

# OUTPUT FORMAT (strict)

A single flowing paragraph of prose. No bullet lists, no subheadings, no blank lines, no line breaks inside the paragraph. The output renders as one <p> element on the page.

Length: 120 to 220 words. Tight, concise, no filler. A single-tier town (only single-family activity) can be 80 to 130 words. A multi-tier town with three or four property types runs 150 to 220 words. Stop when you have said the useful thing.

Do not pad with phrases like "each serving a different buyer need" or "this is where the market gets interesting" or "the story here is." Cut filler aggressively.

# FORBIDDEN CHARACTERS AND PATTERNS (automatic rejection)
- No em dash, en dash, or "--" double hyphen as an em-dash substitute.
- No smart quotes or ellipsis character.
- No "just" as a softener.
- When you would reach for an em dash, use a period or a comma instead.

# MONEY FORMATTING (strict)
- Full dollar values with the $ sign and commas. Write "$620,000" not "620k" or "$620K".
- "$1.1 million" or "comfortably over a million at $1,112,500", not "$1.1M" or "1.1 million".
- For values that round awkwardly (like $1,365,000), use the full number with commas, not "$1.365 million".
- For ranges: "$750,000 to over $4.1 million".

# OTHER FORMATTING RULES
- Write "days on market" fully. Do not abbreviate to DOM.
- Write "sale-to-list ratio" fully on first use; "ratio" is fine after.
- When listing buildings, name exactly 3 representative examples per tier from the curated list. Never list more than 3 even if more are available.

# GEOGRAPHY (strict)

All 70 towns covered by this site are in **Bergen County, New Jersey**. Never reference Hudson County, Essex County, Passaic County, or any other county.

The **Hudson River** forms Bergen County's eastern border. Waterfront Bergen towns (Edgewater, Cliffside Park, Fort Lee, etc.) sit on the **Hudson River**, NOT in Hudson County. Use "Hudson River waterfront" or "Bergen County waterfront" when describing this geography. Never write "Hudson County waterfront." This is a common error that destroys credibility with local readers.

# MARKET TEMPERATURE (read the data, do not hedge)

When sale-to-list ratio, percent above asking, and median days on market all point the same direction, name the market accurately. Do not hedge a clearly hot market as "reasonably competitive" or "balanced" when the data says otherwise. Use these thresholds to classify the single-family tier (or the dominant tier for towns with little single-family activity):

**Strong seller's market**: percent above asking > 50% AND median days on market < 20 AND sale-to-list ratio at or above 1.02.
Use language like: "a real seller's market," "many multiple offer situations," "sellers are dictating terms." Pick one or two of these phrasings, do not stack them all in one paragraph.

**Competitive but balanced**: percent above asking between 30% and 50%, sale-to-list ratio between 0.98 and 1.02, median days on market between 20 and 60.
Use language like: "competitive but not frenzied," "well-priced homes are moving." Do not call a balanced market hot.

Say "competition" plainly when that is the buyer reality. Never soften it with euphemisms like "company," "interest," or "attention." "Buyers should expect competition on the good ones" is the register.

**Buyer-friendly**: percent above asking under 30% AND sale-to-list ratio under 0.97 AND median days on market over 45.
Use language like: "buyers may find leverage," "sellers need to price competitively," "the best homes will still draw some competition for buyers."

If signals are mixed (e.g., 65% above asking but 35-day median days on market), default to the more conservative "competitive but balanced" framing. Do not over-claim either direction.

# VOICE PATTERNS (what distinguishes Tyler's read from a generic market report)

1. Frame seller behavior charitably and accurately. Sellers are not necessarily "overasking" if homes are eventually getting their price. Prefer phrasing like "sellers are okay with waiting for the right buyer rather than pricing competitively to sell extremely fast" over "sellers are overasking."

2. Describe the supply situation factually. Use words like "sparse" not "stubborn." Avoid judgmental adjectives about a property type or its sellers.

3. Name real drawbacks of property types non-obvious to outsiders. Co-ops carry board approval, financing restrictions, and resale friction. The phrasing to use: "they come with [drawbacks], which not every buyer is aware of going in." Tell the reader to look into it rather than scaring them away.

4. Direct address with natural contractions. "You're," "you'll," "isn't," "doesn't." Speak to the reader, not about them.

5. Tier the market by property type when the data has real variety. Use transitional phrasing like "by contrast" between tiers to keep the prose flowing. Walk through each meaningful tier with: the volume + median price, what the category actually contains (especially when there is a non-obvious composition rule), 3 representative building names, and a real drawback when applicable.

6. Surface non-obvious local market truths the reader would not learn from numbers alone. Example: in Fort Lee, the condo category includes new-construction side-by-side duplexes built on torn-down single-family lots, not just high-rise units. This kind of structural reality is worth one tight sentence when it applies.

7. Use named buildings from the curated lists in the user prompt ONLY. Never invent. Match buildings to the right ownership type (co-op buildings under the co-op tier, condo/townhouse buildings under that tier).

8. Confident statements over data meta-commentary. Do not explain MLS classification quirks to the customer except when the classification itself reveals something useful about the local market (as with Fort Lee duplexes in condo category).

9. Plain English over jargon, except where the technical term conveys meaning the visitor genuinely needs (share ownership, board approval, sale-to-list).

10. Close with the decision the reader is facing. The closing pattern: "If you're comparing tiers, the deciding factor isn't market heat. It's whether you want the [single-family descriptor], the [condo descriptor], or the [co-op descriptor]." Use accurate descriptors of what each tier genuinely offers, not value judgments. "Lower price point of a co-op" not "affordability of a co-op." "Low-maintenance lifestyle of a condo" not "liquidity of a condo." "Space and grounds of a single-family" stays.

# GOLD-STANDARD EXAMPLE (Fort Lee, locked-in Tyler voice)

The single-family market in Fort Lee is sparse, with a small share of homes being detached single-family. The median is comfortably over a million at $1,112,500, and sellers are okay with waiting for the right buyer rather than pricing competitively to sell extremely fast. Condos and townhouses, by contrast, are the real volume of the Fort Lee market with 134 sales over six months at a median of $620,000. This category includes new-construction side-by-side duplexes built on torn-down single-family lots, not just high-rise units. Buildings like the Buckingham, The Palisades, and Mediterranean South are moving units consistently. Co-ops sit at the entry point with 98 sales at a median of $250,000. Horizon House, The Plaza, and Mediterranean Towers North and West are buildings to know, and they come with board approval, financing restrictions, and resale friction that not every buyer is aware of going in. If you're comparing tiers, the deciding factor isn't market heat. It's whether you want the space and grounds of a single-family, the low-maintenance lifestyle of a condo, or the lower price point of a co-op.

# WHAT TO LEARN FROM THE EXAMPLE
- Single flowing paragraph, no breaks
- "Sparse" describes supply factually without judging anyone
- Seller behavior framed charitably ("okay with waiting" not "overasking")
- One non-obvious local truth surfaced in a single sentence (the duplex-in-condo-category fact)
- Exactly 3 buildings per tier
- Co-op drawback line uses the specific "not every buyer is aware of going in" pattern
- Closing sentence describes what buyers actually pick each tier for (space, low maintenance, lower price), not value judgments

# HARD CONSTRAINTS ON FACTUAL CLAIMS

1. Building names: use ONLY names from the curated lists in the user prompt. Never invent, combine, or generalize.
2. Rental-only buildings are forbidden (Hudson Lights, Modera Fort Lee, equivalent).
3. Match buildings to the right ownership tier (co-op buildings under co-op tier only).
4. Do not fabricate statistics. Use only the aggregated stats and monthly trend data in the user prompt.
5. No year-over-year claims. The data covers one 6-month window; never compare to "last year" or invent multi-year history.
7. Do not speculate about what an outlier sale was (teardown, land, estate sale, mobile home). If the range is unusually wide, note the wide range and anchor the reader on the median (e.g. "the median is the number to anchor on"). Never write the stilted construction "the median is the better guide than the range."
6. No sales-talk language ("now is a great time to buy", "the market is on fire").

# SEASONALITY AND TREND (this is the critical-thinking layer)

Bergen County has a well-known seasonal arc, and prices and volume follow slightly different clocks. Medians build through spring, peak in early-to-mid summer, then typically drift down through fall and winter. Closing VOLUME peaks in early-to-mid summer, tapers only modestly through fall, holds up into December on the year-end push, then bottoms in deep winter (January and February are the thinnest closing months). Do not claim volume "eases through fall" as if fall were the trough; the trough is deep winter. You may state this general pattern as market context. It is the ONE piece of outside knowledge you are allowed.

The user prompt includes a month-by-month series for this town (sold count and median per month, single-family and condo/townhouse). Use it to take a position on where THIS town sits relative to that seasonal arc. Every town-specific trend claim must be grounded in those monthly numbers.

Rules for reading the monthly series:
1. Classify the town's recent months honestly: tracking the seasonal pattern (recent medians softening as expected), showing resilience (holding flat where a dip would be normal), or bucking the trend (recent months still climbing). Say which one it is in plain language. Do not claim all three.
2. Small samples are noise, not signal. A month with fewer than 5 closings cannot support a trend claim on its own. If most months are thin, say the sample is too small to read a monthly trend and fall back to the 6-month picture.
3. A falling median on RISING volume often means the mix shifted toward smaller or entry-level homes, not that values dropped. When volume and median move in opposite directions, say so instead of calling it a price decline.
4. Frame the forward look conditionally and modestly: "if this town follows the usual seasonal pattern, expect X" is fine; a confident price prediction is not.
5. One or two sentences of seasonal read is the right dose. This is seasoning, not the meal. The tiered property-type walkthrough remains the core of the paragraph.

# HOUSING STOCK (use it to explain the price)

Each property type's stats include medianBedrooms, medianFullBaths, and topStyles (the most common Style values with counts). Use one clause to characterize what the typical house actually is when it helps a reader understand the price level, e.g. "mostly three-bedroom capes and colonials with one or two baths" or "the typical sale here is a four-bedroom colonial." Rules:
1. Translate MLS style codes to plain English: "Cape Cod" -> capes, "Colonial" -> colonials, "BiLvl" -> bi-levels, "Split" -> split-levels, "Contemp" -> contemporaries, "TWNHS" -> townhouses, "2 Fam"/"3 Fam" -> two-families/three-families.
2. Only name styles that actually dominate (a style with 2 sales out of 40 is not "mostly").
3. This is one clause, not a paragraph. Skip it entirely for thin markets where the sample cannot support a generalization.

# TONE: MATTER-OF-FACT

Write like an agent reading the numbers to a smart client, not like a report generator. Short declarative sentences. Name what the data shows and what it does not show. No throat-clearing, no "it's worth noting," no "interestingly." If a number is unremarkable, do not dress it up. Where the honest read is "flat and unremarkable," say that; a boring market stated plainly is more credible than a dramatized one.

# AUDIENCE

The reader is not a casual browser. They have been researching, possibly for weeks, months, or years. They are weighing a real move and looking for someone who will engage substantively with the thinking they have already done.

# OUTPUT

Return ONLY the paragraph text as a single block of prose with no line breaks inside it. No preamble, no quotes around it.`;

function statsHash(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtPct(ratio) {
  if (ratio == null || isNaN(ratio)) return null;
  return `${Math.round(ratio * 100)}%`;
}

// Stats-driven template paragraph used when the API call fails or the
// generated paragraph fails post-processing. Factual and generic, will not
// hallucinate building names.
function templateParagraph({ townName, periodLabel, aggregate }) {
  const { propertyTypes, sub10, rawCounts } = aggregate;
  const sf = propertyTypes?.singleFamily;
  const ct = propertyTypes?.condoTownhouse;
  const co = propertyTypes?.coop;
  const mf = propertyTypes?.multiFamily;

  const sentences = [];

  if (sf) {
    const median = fmtMoney(sf.medianSalePrice);
    const ratio = fmtPct(sf.saleToList);
    const dom = sf.medianDom != null ? `${Math.round(sf.medianDom)} days` : null;
    let s = `Over ${periodLabel}, ${townName} had ${sf.homesSold} single-family closings`;
    if (median) s += ` at a median around ${median}`;
    if (ratio && dom) s += `. Homes sold at ${ratio} of list on a median of ${dom} on market`;
    else if (ratio) s += `, with the typical sale landing at ${ratio} of list`;
    else if (dom) s += `, with a median of ${dom} on market`;
    sentences.push(s + '.');
  } else if (sub10 && sub10.homesSold > 0) {
    sentences.push(`Single-family is thin in ${townName} over ${periodLabel} with ${sub10.homesSold} closings, so the headline numbers carry small-sample noise.`);
  }

  const others = [];
  if (mf) others.push(`${mf.homesSold} multi-family closings around ${fmtMoney(mf.medianSalePrice)}`);
  if (ct) others.push(`${ct.homesSold} condo and townhouse closings around ${fmtMoney(ct.medianSalePrice)}`);
  if (co) others.push(`${co.homesSold} co-op closings around ${fmtMoney(co.medianSalePrice)}`);

  if (others.length > 0) {
    sentences.push(`Beyond single-family, the period saw ${others.join(', ')}.`);
  }

  if (rawCounts && (rawCounts.coop > 0 || rawCounts.condoTownhouse > 0)) {
    sentences.push(`Each property type runs on its own clock and the median price across types should not be compared head-to-head.`);
  }

  sentences.push(`If you are weighing a move here and want a read that goes deeper than the public stats, that is the kind of conversation worth having directly.`);

  return sentences.join(' ');
}

// Post-process check. Returns { ok, reason } where ok=false means we should
// fall back to the template paragraph.
// Context-aware retry instruction. Tells the model the specific failure
// so it can fix the exact problem rather than guessing what tripped the
// validator. Without this, retries often re-trigger the same rule.
function buildRetryInstruction(reason) {
  let specific = '';
  if (/em or en dash|double hyphen/i.test(reason)) {
    specific = 'You used an em dash, en dash, or "--" double hyphen. Rewrite using periods or commas instead. Plain ASCII only.';
  } else if (/just/i.test(reason)) {
    specific = `You used the word "just" as a softener (e.g., "just over 1.0", "just a small market", "just shy of"). Rewrite without "just" in any softening context. Phrases like "slightly over 1.0", "narrowly below", or simply restructuring the sentence work. The only allowed usage is "not just X" meaning "not only X".`;
  } else if (/rental-only building/i.test(reason)) {
    const m = reason.match(/"([^"]+)"/);
    const building = m ? m[1] : 'a rental-only building';
    specific = `You referenced "${building}", which is a rental-only building with no NJMLS sales activity. Rewrite without referencing any rental-only buildings. Use only buildings from the curated lists in the original user prompt, or no buildings at all if no relevant list is curated.`;
  } else if (/smart quote|ellipsis/i.test(reason)) {
    specific = 'You used a smart quote or ellipsis character. Rewrite using straight ASCII quotes and three periods if you need an ellipsis (preferably just rephrase to avoid ellipsis entirely).';
  } else {
    specific = 'Rewrite the paragraph correcting the issue above. Plain ASCII only.';
  }
  return `Your previous draft was rejected by the automated voice check. Problem: ${reason}.

${specific}

Same town, same stats, same approximate length. Return only the rewritten paragraph as a single block of prose with no line breaks inside it.`;
}

function validateParagraph(text) {
  if (!text || text.trim().length < 50) {
    return { ok: false, reason: 'too short' };
  }
  if (/[—–]/.test(text)) return { ok: false, reason: 'contains em or en dash' };
  if (/--/.test(text)) return { ok: false, reason: 'contains ASCII double hyphen used as em dash' };
  if (/[‘’“”…]/.test(text)) return { ok: false, reason: 'contains smart quote or ellipsis char' };
  // Reject "just" as a softener but allow "not just X" (which means "not only X").
  // We count total "just" occurrences and subtract the "not just" ones; any remainder is a softener.
  const allJust = (text.match(/\bjust\b/gi) || []).length;
  const notJust = (text.match(/\bnot\s+just\b/gi) || []).length;
  if (allJust - notJust > 0) return { ok: false, reason: 'contains "just" as a softener' };
  // Banned rental-only buildings: use word boundaries so "Modera" does not
  // false-positive on "moderate", and "Hudson Lights" still matches literally.
  for (const banned of RENTAL_ONLY_BANNED) {
    const re = new RegExp(`\\b${banned.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
    if (re.test(text)) {
      return { ok: false, reason: `references rental-only building "${banned}"` };
    }
  }
  return { ok: true };
}

function buildUserPrompt({ townName, periodLabel, monthYear, aggregate, notableBuildings, aboutText }) {
  const stats = {
    period: periodLabel,
    monthYear,
    propertyTypes: aggregate.propertyTypes,
    rawCounts: aggregate.rawCounts,
    sub10: aggregate.sub10,
    monthlyTrend: aggregate.monthlyTrend || []
  };
  const coopList = notableBuildings?.coop?.length
    ? notableBuildings.coop.join(', ')
    : 'none curated yet';
  const condoList = notableBuildings?.condoTownhouse?.length
    ? notableBuildings.condoTownhouse.join(', ')
    : 'none curated yet';
  const aboutSummary = aboutText
    ? aboutText.slice(0, 600) + (aboutText.length > 600 ? '...' : '')
    : 'none curated yet';

  return `Town: ${townName}
Period: ${periodLabel}

Aggregated stats:
${JSON.stringify(stats, null, 2)}

Curated content available:
- Notable co-op buildings: ${coopList}
- Notable condo and townhouse buildings: ${condoList}
- About town context: ${aboutSummary}

Write the "What this means right now" paragraph for ${townName} in Tyler's voice, following all rules in the system prompt. Match length to the variety of data: short for single-tier markets, longer for multi-tier markets. Use the monthlyTrend series in the stats to give the seasonal read required by the system prompt. Only reference building names from the curated lists above. Skip building names entirely if no relevant list is curated. Do not reference any rental-only buildings.`;
}

function loadCache(slug) {
  const path = resolve(CACHE_DIR, `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function saveCache(slug, entry) {
  const path = resolve(CACHE_DIR, `${slug}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(entry, null, 2));
}

/**
 * Generate the "What this means right now" paragraph for one town.
 *
 * @param {object} opts
 * @param {string} opts.townName
 * @param {string} opts.slug
 * @param {string} opts.periodLabel  e.g. "the last 6 months ending April 2026"
 * @param {string} opts.monthYear    e.g. "April 2026"
 * @param {object} opts.aggregate    one entry from aggregateTownData()
 * @param {object} [opts.notableBuildings]
 * @param {string} [opts.aboutText]
 * @param {Anthropic} [opts.client]  pre-built SDK client (for batching)
 * @param {boolean} [opts.forceRegenerate]
 * @param {boolean} [opts.noAi]      use template only, never call the API
 * @returns {Promise<{ paragraph, fromCache, fallback, reason }>}
 */
export async function generateAiParagraph(opts) {
  const {
    townName, slug, periodLabel, monthYear, aggregate,
    notableBuildings = {}, aboutText = '',
    client, forceRegenerate = false, noAi = false
  } = opts;

  const fingerprintPayload = {
    propertyTypes: aggregate.propertyTypes,
    rawCounts: aggregate.rawCounts,
    sub10: aggregate.sub10,
    monthlyTrend: aggregate.monthlyTrend || [],
    notableBuildings,
    periodLabel,
    monthYear,
    model: MODEL
  };
  const hash = statsHash(fingerprintPayload);

  if (!forceRegenerate) {
    const cached = loadCache(slug);
    if (cached && cached.hash === hash && cached.paragraph) {
      return {
        paragraph: cached.paragraph,
        fromCache: true,
        fallback: !!cached.fallback,
        reason: cached.reason || null
      };
    }
  }

  if (noAi) {
    const paragraph = templateParagraph({ townName, periodLabel, aggregate });
    const entry = { hash, paragraph, fallback: true, reason: 'noAi flag set', generatedAt: new Date().toISOString() };
    saveCache(slug, entry);
    return { paragraph, fromCache: false, fallback: true, reason: entry.reason };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const paragraph = templateParagraph({ townName, periodLabel, aggregate });
    const entry = { hash, paragraph, fallback: true, reason: 'ANTHROPIC_API_KEY missing', generatedAt: new Date().toISOString() };
    saveCache(slug, entry);
    return { paragraph, fromCache: false, fallback: true, reason: entry.reason };
  }

  const anthropic = client || new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt({
    townName, periodLabel, monthYear, aggregate, notableBuildings, aboutText
  });

  const callApi = async (messages) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages
    });
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();
    return { text, usage: response.usage };
  };

  try {
    const firstMessages = [{ role: 'user', content: userPrompt }];
    let { text: rawText, usage } = await callApi(firstMessages);
    let check = validateParagraph(rawText);
    let retried = false;
    let firstDraft = null;

    if (!check.ok) {
      firstDraft = rawText;
      retried = true;
      const retryMessages = [
        ...firstMessages,
        { role: 'assistant', content: rawText },
        {
          role: 'user',
          content: buildRetryInstruction(check.reason)
        }
      ];
      const retry = await callApi(retryMessages);
      rawText = retry.text;
      usage = retry.usage;
      check = validateParagraph(rawText);
    }

    if (!check.ok) {
      const paragraph = templateParagraph({ townName, periodLabel, aggregate });
      const entry = {
        hash, paragraph, fallback: true,
        reason: `post-validation rejected after retry: ${check.reason}`,
        firstDraft,
        rejectedDraft: rawText,
        retried,
        generatedAt: new Date().toISOString()
      };
      saveCache(slug, entry);
      return { paragraph, fromCache: false, fallback: true, reason: entry.reason };
    }

    const entry = {
      hash, paragraph: rawText, fallback: false, reason: null,
      retried, firstDraft,
      usage,
      generatedAt: new Date().toISOString()
    };
    saveCache(slug, entry);
    return { paragraph: rawText, fromCache: false, fallback: false, reason: null };

  } catch (err) {
    const paragraph = templateParagraph({ townName, periodLabel, aggregate });
    const entry = {
      hash, paragraph, fallback: true,
      reason: `API error: ${err.message || String(err)}`,
      generatedAt: new Date().toISOString()
    };
    saveCache(slug, entry);
    return { paragraph, fromCache: false, fallback: true, reason: entry.reason };
  }
}

export const _internals = { templateParagraph, validateParagraph, statsHash, SYSTEM_PROMPT };
