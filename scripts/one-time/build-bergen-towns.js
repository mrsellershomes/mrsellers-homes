import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MULTI_FAMILY_TOWNS = new Set([
  "Hackensack", "Garfield", "Lodi", "Wallington", "Rutherford",
  "Ridgefield", "Palisades Park", "North Arlington", "Lyndhurst",
  "Little Ferry", "Fort Lee", "Fairview", "Elmwood Park", "Dumont",
  "Cliffside Park", "Carlstadt", "Bergenfield"
]);

function toSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const indexHtml = readFileSync(resolve('index.html'), 'utf8');
const matches = [...indexHtml.matchAll(/\{name:"([^"]+)",guide:(true|false)(?:,guideUrl:"([^"]+)")?\}/g)];

if (matches.length !== 70) {
  console.error(`Expected 70 towns, found ${matches.length}`);
  process.exit(1);
}

const towns = matches.map(m => ({
  name: m[1],
  slug: toSlug(m[1]),
  pageSlug: `${toSlug(m[1])}-real-estate`,
  hasGuide: m[2] === 'true',
  youtubeUrl: m[3] || null,
  multiFamily: MULTI_FAMILY_TOWNS.has(m[1])
}));

// Sort alphabetically for determinism
towns.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(
  resolve('data/bergen-towns.json'),
  JSON.stringify(towns, null, 2) + '\n'
);

console.log(`Wrote ${towns.length} towns to data/bergen-towns.json`);
console.log(`Multi-family towns: ${towns.filter(t => t.multiFamily).length}`);
console.log(`Towns with YouTube guides: ${towns.filter(t => t.hasGuide).length}`);
