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
  let currentTopic = null;
  let rotationTimer = null;
  let pollTimer = null;

  function showLine(text, tag) {
    textEl.textContent = text;
    tagEl.textContent = tag;
  }

  function currentMode() {
    return currentTopic ? "TODAY" : "NO BS";
  }

  function renderCurrent() {
    if (currentTopic) {
      showLine(currentTopic, "TODAY");
    } else {
      showLine(evergreen[rotationIdx % evergreen.length], "NO BS");
    }
  }

  function startRotation() {
    renderCurrent();
    if (rotationTimer) clearInterval(rotationTimer);
    rotationTimer = setInterval(() => {
      if (currentTopic) return; // don't rotate when showing today's topic
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
      const state = await fetchState();
      const next = state && typeof state.topic === "string" && state.topic.length > 0
        ? state.topic
        : null;
      if (next !== currentTopic) {
        currentTopic = next;
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
