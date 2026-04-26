// mrsellers-homes/take/shared/api.js
// Tiny shared helpers used by every scene script.

export async function fetchState() {
  const r = await fetch("/api/topic", { cache: "no-store" });
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
