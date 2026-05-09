import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const towns = JSON.parse(readFileSync(resolve('data/bergen-towns.json'), 'utf8'));

function youtubeIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : null;
}

const out = {};
for (const town of towns) {
  out[town.slug] = {
    videos: youtubeIdFromUrl(town.youtubeUrl) ? [youtubeIdFromUrl(town.youtubeUrl)] : [],
    blogs: [],
    aboutText: '',
    multiFamily: town.multiFamily
  };
}

writeFileSync(resolve('data/towns-content.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Seeded towns-content.json — ${Object.keys(out).length} towns`);
console.log(`Towns with video IDs: ${Object.values(out).filter(v => v.videos.length > 0).length}`);
