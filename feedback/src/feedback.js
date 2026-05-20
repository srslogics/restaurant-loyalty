const form = document.querySelector("#feedbackForm");
const formMessage = document.querySelector("#formMessage");
const successPanel = document.querySelector("#successPanel");
const referenceLine = document.querySelector("#referenceLine");
const newFeedbackBtn = document.querySelector("#newFeedbackBtn");
const tableBadge = document.querySelector("#tableBadge");
const venueLine = document.querySelector("#venueLine");
const contextLine = document.querySelector("#contextLine");
const venueCaption = document.querySelector("#venueCaption");
const submitButton = form?.querySelector('button[type="submit"]');

const query = new URLSearchParams(window.location.search);
const table = query.get("table") || "T01";
const venueSlugFromQuery = query.get("venue") || query.get("venueSlug") || "yamazaki";
let selectedVenue = null;

function setupSingleChoice(containerSelector, hiddenInputSelector) {
  const container = document.querySelector(containerSelector);
  const hiddenInput = document.querySelector(hiddenInputSelector);
  if (!container || !hiddenInput) {
    return;
  }

  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      container.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      hiddenInput.value = button.dataset.value;
    });
  });
}

function setupMetricRatings() {
  document.querySelectorAll(".metric-card").forEach((card) => {
    const input = card.querySelector('input[type="hidden"]');
    const buttons = card.querySelectorAll("button");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        input.value = button.dataset.value;
      });
    });
  });
}

function setupMultiChoice(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
    });
  });
}

function getSelectedMultiValues(containerSelector) {
  return Array.from(
    document.querySelectorAll(`${containerSelector} .choice-chip.active`),
  ).map((button) => button.dataset.value);
}

function buildReferenceId() {
  const now = new Date();
  return `YFB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function resetForm() {
  form.reset();
  form.hidden = false;
  successPanel.hidden = true;
  formMessage.textContent = "";
  document.querySelectorAll(".active").forEach((element) => {
    if (
      element.classList.contains("rating-chip") ||
      element.classList.contains("choice-chip") ||
      element.parentElement?.classList.contains("mini-rating")
    ) {
      element.classList.remove("active");
    }
  });
}

async function loadVenueContext() {
  const venues = await window.YamazakiFeedbackApi.getVenues();
  selectedVenue =
    venues.find((venue) => venue.slug === venueSlugFromQuery) ||
    venues.find((venue) => venue.name === venueSlugFromQuery) ||
    venues[0] || {
      slug: venueSlugFromQuery,
      name: "Yamazaki",
      tagline: "Your feedback helps us improve every guest experience.",
    };

  tableBadge.textContent = `Table ${table}`;
  venueLine.textContent = selectedVenue.name;
  contextLine.textContent = `Scanning from ${table} at ${selectedVenue.name}.`;
  if (venueCaption) {
    venueCaption.textContent =
      selectedVenue.tagline || "Your feedback helps us improve every guest experience.";
  }
}

setupSingleChoice("#overallRating", "#overallScore");
setupSingleChoice("#visitType", "#visitTypeValue");
setupMetricRatings();
setupMultiChoice("#highlights");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const overallScore = document.querySelector("#overallScore").value;
  if (!overallScore) {
    formMessage.textContent = "Please select your overall rating before submitting.";
    return;
  }

  const metrics = {};
  document.querySelectorAll(".metric-card").forEach((card) => {
    const metricName = card.dataset.metric;
    const value = card.querySelector('input[type="hidden"]').value;
    metrics[metricName] = Number(value || 0);
  });

  const entry = {
    venueSlug: selectedVenue?.slug || venueSlugFromQuery,
    venue: selectedVenue?.name || "Yamazaki",
    table,
    overallScore: Number(overallScore),
    visitType: document.querySelector("#visitTypeValue").value || "Not specified",
    highlights: getSelectedMultiValues("#highlights"),
    comments: document.querySelector("#comments").value.trim(),
    guestName: document.querySelector("#guestName").value.trim(),
    guestPhone: document.querySelector("#guestPhone").value.trim(),
    metrics,
  };

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    const response = await window.YamazakiFeedbackApi.submitFeedback(entry);
    form.hidden = true;
    successPanel.hidden = false;
    referenceLine.textContent = `Reference: ${response.referenceId || buildReferenceId()}`;
    formMessage.textContent = "";
  } catch (error) {
    formMessage.textContent = error.message || "Could not submit feedback right now.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Feedback";
    }
  }
});

newFeedbackBtn?.addEventListener("click", resetForm);
loadVenueContext();
