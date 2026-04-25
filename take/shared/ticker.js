// mrsellers-homes/take/shared/ticker.js

export function createTicker(el, opts) {
  const {
    evergreen,
    fetchState,
    intervalMs = 7000,
    pollMs = 5000,
  } = opts;

  const tagEl = el.querySelector(".tag");
  const textEl = el.querySelector(".text");

  let rotationIdx = 0;
  // Active topic-mode payload, or null when in evergreen mode.
  // { text: string, tag: string }
  let topicDisplay = null;
  let rotationTimer = null;
  let pollTimer = null;

  function showLine(text, tag) {
    textEl.textContent = text;
    tagEl.textContent = tag;
  }

  function currentMode() {
    return topicDisplay ? "TOPIC" : "NO BS";
  }

  function renderCurrent() {
    if (topicDisplay) {
      showLine(topicDisplay.text, topicDisplay.tag);
    } else {
      showLine(evergreen[rotationIdx % evergreen.length], "NO BS");
    }
  }

  function startRotation() {
    renderCurrent();
    if (rotationTimer) clearInterval(rotationTimer);
    rotationTimer = setInterval(() => {
      if (topicDisplay) return; // don't rotate when showing today's topic
      rotationIdx = (rotationIdx + 1) % evergreen.length;
      renderCurrent();
    }, intervalMs);
  }

  function stopRotation() {
    if (rotationTimer) clearInterval(rotationTimer);
    rotationTimer = null;
  }

  function deriveDisplay(state) {
    if (!state || typeof state !== "object") return null;
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
      return {
        text: topics[idx],
        tag: `TOPIC ${idx + 1}/${topics.length}`,
      };
    }
    return null;
  }

  async function poll() {
    try {
      const state = await fetchState();
      const next = deriveDisplay(state);
      const changed =
        (next === null) !== (topicDisplay === null) ||
        (next && topicDisplay && (next.text !== topicDisplay.text || next.tag !== topicDisplay.tag));
      if (changed) {
        topicDisplay = next;
        renderCurrent();
      }
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
