// mrsellers-homes/take/shared/ticker.js

export function createTicker(el, opts) {
  const {
    evergreen,
    fetchState,
    intervalMs = 7000,
    pollMs = 1500,
    now = () => Date.now(),
  } = opts;

  const tagEl = el.querySelector(".tag");
  const textEl = el.querySelector(".text");

  let rotationIdx = 0;
  // Most-recent state from the API (or null if never fetched).
  let latestState = null;
  let rotationTimer = null;
  let pollTimer = null;
  // Tracks the last rendered display so we only paint when something changes.
  let lastRendered = { text: null, tag: null };

  function paint(text, tag) {
    if (lastRendered.text === text && lastRendered.tag === tag) return;
    lastRendered = { text, tag };
    textEl.textContent = text;
    tagEl.textContent = tag;
  }

  // Public showLine bypasses the diff (used by callers to force a paint).
  function showLine(text, tag) {
    lastRendered = { text, tag };
    textEl.textContent = text;
    tagEl.textContent = tag;
  }

  function activeOverride(state) {
    if (!state || !state.tickerOverride) return null;
    const o = state.tickerOverride;
    if (typeof o.text !== "string" || o.text.length === 0) return null;
    if (typeof o.expiresAt !== "number" || o.expiresAt <= now()) return null;
    return o;
  }

  function activeTopic(state) {
    if (!state) return null;
    const topics = Array.isArray(state.topics) ? state.topics : null;
    const idx = state.currentTopicIndex;
    if (
      topics &&
      topics.length > 0 &&
      typeof idx === "number" &&
      Number.isInteger(idx) &&
      idx >= 0 &&
      idx < topics.length
    ) {
      return { text: topics[idx], tag: `TOPIC ${idx + 1}/${topics.length}` };
    }
    return null;
  }

  function currentMode() {
    if (activeOverride(latestState)) return "OVERRIDE";
    if (activeTopic(latestState)) return "TOPIC";
    return "NO BS";
  }

  function renderCurrent() {
    const override = activeOverride(latestState);
    if (override) {
      paint(override.text, "NO BS");
      return;
    }
    const topic = activeTopic(latestState);
    if (topic) {
      paint(topic.text, topic.tag);
      return;
    }
    paint(evergreen[rotationIdx % evergreen.length], "NO BS");
  }

  function startRotation() {
    renderCurrent();
    if (rotationTimer) clearInterval(rotationTimer);
    rotationTimer = setInterval(() => {
      // Override and topic modes are static; only evergreen rotates.
      if (activeOverride(latestState) || activeTopic(latestState)) {
        // Still call renderCurrent so an expired override falls back immediately.
        renderCurrent();
        return;
      }
      rotationIdx = (rotationIdx + 1) % evergreen.length;
      renderCurrent();
    }, intervalMs);
  }

  function stopRotation() {
    if (rotationTimer) clearInterval(rotationTimer);
    rotationTimer = null;
  }

  async function poll() {
    try {
      latestState = await fetchState();
      renderCurrent();
    } catch {
      // Ignore fetch errors — keep showing whatever is visible.
    }
  }

  function startPolling() {
    poll();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, pollMs);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  return {
    showLine,
    startRotation,
    stopRotation,
    startPolling,
    stopPolling,
    currentMode,
    poll,
  };
}
