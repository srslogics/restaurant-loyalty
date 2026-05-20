(function () {
  const STORAGE_KEY = "yamazaki_feedback_entries";

  function readFeedbackEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (_error) {
      return [];
    }
  }

  function writeFeedbackEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function saveFeedbackEntry(entry) {
    const entries = readFeedbackEntries();
    entries.unshift(entry);
    writeFeedbackEntries(entries);
    return entry;
  }

  function clearFeedbackEntries() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.YamazakiFeedbackStore = {
    STORAGE_KEY,
    readFeedbackEntries,
    writeFeedbackEntries,
    saveFeedbackEntry,
    clearFeedbackEntries,
  };
})();
