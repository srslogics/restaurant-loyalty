(function () {
  async function parseJsonResponse(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }
    return payload;
  }

  async function getVenues() {
    try {
      const response = await fetch("/api/venues");
      return await parseJsonResponse(response);
    } catch (_error) {
      return window.YamazakiFeedbackVenues || [];
    }
  }

  async function submitFeedback(entry) {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });
    return parseJsonResponse(response);
  }

  async function listFeedback(params = {}) {
    const query = new URLSearchParams();
    if (params.venue && params.venue !== "all") {
      query.set("venue", params.venue);
    }
    if (params.rating && params.rating !== "all") {
      query.set("rating", params.rating);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(`/api/feedback${suffix}`);
    return parseJsonResponse(response);
  }

  async function getHealth() {
    const response = await fetch("/api/health");
    return parseJsonResponse(response);
  }

  window.YamazakiFeedbackApi = {
    getVenues,
    submitFeedback,
    listFeedback,
    getHealth,
  };
})();
