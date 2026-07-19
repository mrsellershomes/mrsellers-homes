// Generate all 70 Bergen County town real estate report pages from one
// NJMLS data run. Loops the production pipeline (CSV -> normalize ->
// 6-month rolling aggregate -> render) over every town in bergen-towns.json,
// calls the AI explainer for the "What this means right now" paragraph,
// and writes each page to <slug>-real-estate/index.html.
//
// Usage:
//   node scripts/generate-town-pages.js                 # full run, all 70 towns, AI on
//   node scripts/generate-town-pages.js --dry-run       # no writes, no API calls
//   node scripts/generate-town-pages.js --no-ai         # template fallback paragraphs
//   node scripts/generate-town-pages.js --only=fort-lee,leonia
//   node scripts/generate-town-pages.js --calibrate     # 3 sample towns for voice review
//   node scripts/generate-town-pages.js --force-regen   # ignore AI-paragraph cache
//
// Reads .env from the project root for ANTHROPIC_API_KEY without requiring
// dotenv as a dep (one-line parse).

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderTownPage } from './lib/render/page.js';
import { readAllCsvs, dedupeByMls, monthYearLabel, buildPeriodLabel } from './lib/njmls-csv.js';
import { aggregateTownData } from './lib/town-data.js';
import { generateAiParagraph } from './lib/ai-explainer.js';
import { buildSitemap } from './lib/sitemap.js';
import { loadPosts } from './lib/blog-posts.js';

// Calibration set: three towns that exercise distinct property-type profiles
// so Tyler can judge whether the voice holds across the variety of Bergen
// markets before we bill the API for all 70.
//   - fort-lee: co-op heavy, dense urban, thin SF, lots of curated buildings
//   - tenafly:  classic high-end Bergen single-family town, no co-ops
//   - hackensack: dense, diverse stock, meaningful multi-family activity
const CALIBRATION_SLUGS = ['fort-lee', 'tenafly', 'hackensack'];

function parseArgs(argv) {
  const flags = { dryRun: false, noAi: false, only: null, calibrate: false, forceRegen: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--no-ai') flags.noAi = true;
    else if (arg === '--calibrate') flags.calibrate = true;
    else if (arg === '--force-regen') flags.forceRegen = true;
    else if (arg.startsWith('--only=')) {
      flags.only = arg.slice('--only='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/generate-town-pages.js [flags]
  --dry-run           No writes, no API calls. Prints planned actions.
  --no-ai             Use template fallback paragraphs (no API calls).
  --only=slug1,slug2  Generate only the listed slugs.
  --calibrate         Generate only the calibration set: ${CALIBRATION_SLUGS.join(', ')}.
  --force-regen       Ignore the AI-paragraph cache and re-bill the API.
  --help, -h          Show this help.`);
      process.exit(0);
    } else {
      console.warn(`Ignored unknown flag: ${arg}`);
    }
  }
  if (flags.calibrate && flags.only) {
    console.warn('--calibrate and --only both set; using --calibrate set.');
    flags.only = null;
  }
  if (flags.calibrate) flags.only = CALIBRATION_SLUGS;
  return flags;
}

// Minimal .env loader. Reads KEY=VALUE lines, ignores comments and blanks,
// does not overwrite values already set in process.env. Avoids pulling in
// dotenv when we only need three lines of behavior.
function loadDotEnv() {
  const path = resolve('.env');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  const flags = parseArgs(process.argv);
  loadDotEnv();

  const schools = JSON.parse(readFileSync(resolve('data/bergen-schools.json'), 'utf8'));
  const content = JSON.parse(readFileSync(resolve('data/towns-content.json'), 'utf8'));
  const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));

  console.log('Reading all NJMLS CSVs from data/njmls/...');
  const { rows: rawRows, monthFolders } = readAllCsvs(resolve('data/njmls'));
  const rows = dedupeByMls(rawRows);
  const latestMonth = monthFolders[monthFolders.length - 1];
  const monthYear = monthYearLabel(latestMonth);
  const periodLabel = `the last ${monthFolders.length} months ending ${monthYear}`;
  console.log(`Loaded ${rawRows.length} raw rows, ${rows.length} after MLS dedupe`);
  console.log(`Window: ${buildPeriodLabel(monthFolders)} (${monthFolders.length} months)`);

  console.log('Aggregating per-town stats...');
  const aggregate = aggregateTownData(rows, towns);

  const selected = flags.only
    ? towns.filter(t => flags.only.includes(t.slug))
    : towns;
  if (flags.only && selected.length !== flags.only.length) {
    const found = selected.map(s => s.slug);
    const missing = flags.only.filter(s => !found.includes(s));
    console.warn(`Slugs not in bergen-towns.json: ${missing.join(', ')}`);
  }

  console.log(`\nGenerating ${selected.length} town page(s)...`);
  if (flags.dryRun) console.log('(dry-run mode: no files will be written, no API calls)');
  if (flags.noAi) console.log('(no-ai mode: template fallback paragraphs)');
  if (flags.forceRegen) console.log('(force-regen mode: ignoring AI-paragraph cache)');

  const townStats = {};
  const summary = {
    written: 0,
    aiFromApi: 0,
    aiFromCache: 0,
    aiFallback: 0,
    sub10: 0,
    skipped: 0,
    errors: []
  };

  for (const town of selected) {
    const townAgg = aggregate[town.slug];
    if (!townAgg) {
      console.warn(`  SKIP ${town.slug}: no aggregate data`);
      summary.skipped++;
      continue;
    }

    const townContent = content[town.slug] || { videos: [], blogs: [], aboutText: '' };
    const notableBuildings = townContent.notableBuildings || {};

    let aiResult;
    if (flags.dryRun) {
      aiResult = { paragraph: '(dry-run placeholder)', fromCache: false, fallback: true, reason: 'dry-run' };
    } else {
      try {
        aiResult = await generateAiParagraph({
          townName: town.name,
          slug: town.slug,
          periodLabel,
          monthYear,
          aggregate: townAgg,
          notableBuildings,
          aboutText: townContent.aboutText || '',
          noAi: flags.noAi,
          forceRegenerate: flags.forceRegen
        });
      } catch (err) {
        console.error(`  ERROR generating AI for ${town.slug}: ${err.message}`);
        summary.errors.push({ slug: town.slug, error: err.message });
        continue;
      }
    }

    if (aiResult.fromCache) summary.aiFromCache++;
    else if (aiResult.fallback) summary.aiFallback++;
    else summary.aiFromApi++;
    if (townAgg.sub10) summary.sub10++;
    // Feed the homepage's live map: sanctioned stats only (median, count, % of list)
    townStats[town.pageSlug] = {
      name: town.name,
      median: townAgg.townData ? townAgg.townData.medianSalePrice : null,
      sold: townAgg.townData ? townAgg.townData.homesSold : null,
      pctList: townAgg.townData ? townAgg.townData.saleToList : null
    };

    const ctx = {
      townName: town.name,
      townSlug: town.slug,
      monthYear,
      periodLabel,
      canonicalUrl: `https://mrsellers.homes/${town.pageSlug}/`,
      metaDescription: `${town.name} NJ real estate market for ${periodLabel}: single-family, multi-family, condo and co-op activity with school data and an honest read from a Bergen County agent.`,
      ogImageUrl: `https://mrsellers.homes/assets/og/${town.slug}.png`,
      townData: townAgg.townData,
      propertyTypes: townAgg.propertyTypes,
      aiParagraph: aiResult.paragraph,
      aiParagraphFallback: aiResult.fallback,
      schoolsData: schools[town.slug] || { schools: [], schoolCount: 0 },
      schoolsSummary: '',
      content: townContent,
      sub10: townAgg.sub10,
      // Curated geographic neighbors per town are not yet stored. The
      // renderer hides the strip cleanly when the array is empty; we wire
      // curated neighbors in a follow-up pass without blocking generation.
      neighbors: []
    };

    const html = renderTownPage(ctx);
    const outDir = resolve(`${town.pageSlug}`);
    const outPath = resolve(outDir, 'index.html');

    if (!flags.dryRun) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outPath, html);
      summary.written++;
    }

    const tag = aiResult.fromCache ? 'cached'
      : aiResult.fallback ? `fallback (${aiResult.reason || 'unspecified'})`
      : 'api';
    const sub10Note = townAgg.sub10 ? ' [sub10]' : '';
    console.log(`  ${flags.dryRun ? 'WOULD WRITE' : 'wrote'} ${town.pageSlug}/index.html  ai=${tag}${sub10Note}`);
  }

  // Sitemap refresh: only rewrite when generating the full set, so a
  // targeted --only run does not drop URLs from the sitemap.
  const isFullRun = !flags.only && !flags.calibrate;
  if (isFullRun && !flags.dryRun) {
    let posts = [];
    try { posts = loadPosts(resolve('content/blog')); } catch { /* no blog content yet */ }
    const xml = buildSitemap(towns, posts);
    writeFileSync(resolve('sitemap.xml'), xml);
    writeFileSync(resolve('assets/town-stats.json'), JSON.stringify({ period: periodLabel, towns: townStats }));
    console.log(`Wrote assets/town-stats.json (${Object.keys(townStats).length} towns)`);
    console.log(`Wrote sitemap.xml (${towns.length} town URLs + ${4} static pages)`);
  } else if (isFullRun && flags.dryRun) {
    console.log('Would write sitemap.xml (dry-run)');
  }

  console.log('\n--- Summary ---');
  console.log(`Towns processed:        ${selected.length}`);
  if (!flags.dryRun) console.log(`HTML files written:     ${summary.written}`);
  console.log(`AI paragraphs (api):    ${summary.aiFromApi}`);
  console.log(`AI paragraphs (cache):  ${summary.aiFromCache}`);
  console.log(`AI paragraphs (fallback): ${summary.aiFallback}`);
  console.log(`Sub-threshold SF towns: ${summary.sub10}`);
  console.log(`Skipped:                ${summary.skipped}`);
  if (summary.errors.length) {
    console.log(`Errors:                 ${summary.errors.length}`);
    for (const e of summary.errors) console.log(`  - ${e.slug}: ${e.error}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
