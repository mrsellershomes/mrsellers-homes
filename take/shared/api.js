// mrsellers-homes/take/shared/api.js
// Tiny shared helpers used by every scene script.
// VERSION: 2026-04-25-fast-poll-1

export async function fetchState() {
  // Cache-bust with a timestamp param so no proxy/CDN/CEF can serve stale.
  const r = await fetch(`/api/topic?t=${Date.now()}`, { cache: "no-store" });
  if (!r.ok) throw new Error("fetch failed");
  return r.json();
}

// Format an episode number as "EP. 012" (3-digit pad), or null if no number.
export function formatEpisode(n) {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) return null;
  return `EP. ${String(n).padStart(3, "0")}`;
}

// Update an EP element from state. If the number is missing, hide the element.
export function applyEpisode(el, state) {
  if (!el) return;
  const label = formatEpisode(state && state.episodeNumber);
  if (label === null) {
    el.style.display = "none";
    el.textContent = "";
  } else {
    el.style.display = "";
    el.textContent = label;
  }
}
