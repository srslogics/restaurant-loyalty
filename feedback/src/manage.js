const feedbackList = document.querySelector("#feedbackList");
const emptyState = document.querySelector("#emptyState");
const totalResponses = document.querySelector("#totalResponses");
const avgOverall = document.querySelector("#avgOverall");
const lowScoreCount = document.querySelector("#lowScoreCount");
const topTable = document.querySelector("#topTable");
const venueFilter = document.querySelector("#venueFilter");
const ratingFilter = document.querySelector("#ratingFilter");
const exportCsvBtn = document.querySelector("#exportCsvBtn");
const statusNote = document.querySelector("#statusNote");

let allEntries = [];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function populateVenueFilter() {
  const venues = await window.YamazakiFeedbackApi.getVenues();
  const currentValue = venueFilter.value || "all";
  venueFilter.innerHTML = `<option value="all">All ventures</option>${venues
    .map((venue) => `<option value="${escapeHtml(venue.slug)}">${escapeHtml(venue.name)}</option>`)
    .join("")}`;
  venueFilter.value = venues.some((venue) => venue.slug === currentValue) ? currentValue : "all";
}

function getTopTable(entries) {
  const counts = {};
  entries.forEach((entry) => {
    counts[`${entry.venue}-${entry.table}`] = (counts[`${entry.venue}-${entry.table}`] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
}

function renderStats(entries) {
  totalResponses.textContent = String(entries.length);
  avgOverall.textContent = entries.length
    ? (entries.reduce((sum, entry) => sum + entry.overallScore, 0) / entries.length).toFixed(1)
    : "0.0";
  lowScoreCount.textContent = String(entries.filter((entry) => entry.overallScore <= 2).length);
  topTable.textContent = getTopTable(entries);
}

function renderEntries() {
  renderStats(allEntries);

  feedbackList.innerHTML = allEntries
    .map((entry) => {
      const date = new Date(entry.createdAt);
      const metrics = entry.metrics || {};
      const highlights = (entry.highlights || []).length
        ? entry.highlights.map(escapeHtml).join(", ")
        : "None selected";

      return `
        <article class="feedback-card">
          <div class="feedback-head">
            <div>
              <strong>${escapeHtml(entry.venue)}</strong>
              <p>${escapeHtml(entry.table)} • ${escapeHtml(entry.referenceId)}</p>
            </div>
            <span class="feedback-score">${entry.overallScore}/5</span>
          </div>
          <div class="feedback-body">
            <div class="feedback-meta">
              <span>Visit type: ${escapeHtml(entry.visitType)}</span>
              <span>${date.toLocaleString()}</span>
            </div>
            <div class="feedback-metrics">
              <span>Food: ${metrics.food || "-"}</span>
              <span>Service: ${metrics.service || "-"}</span>
              <span>Ambience: ${metrics.ambience || "-"}</span>
              <span>Cleanliness: ${metrics.cleanliness || "-"}</span>
            </div>
            <p><strong>Highlights:</strong> ${highlights}</p>
            <p><strong>Comments:</strong> ${escapeHtml(entry.comments || "No comment")}</p>
            <p><strong>Guest:</strong> ${escapeHtml(entry.guestName || "Anonymous")}${entry.guestPhone ? ` • ${escapeHtml(entry.guestPhone)}` : ""}</p>
          </div>
        </article>
      `;
    })
    .join("");

  emptyState.hidden = allEntries.length !== 0;
}

function exportCsv() {
  if (!allEntries.length) {
    return;
  }

  const rows = [
    [
      "referenceId",
      "venueSlug",
      "venue",
      "table",
      "overallScore",
      "visitType",
      "food",
      "service",
      "ambience",
      "cleanliness",
      "highlights",
      "comments",
      "guestName",
      "guestPhone",
      "createdAt",
    ],
    ...allEntries.map((entry) => [
      entry.referenceId,
      entry.venueSlug || "",
      entry.venue,
      entry.table,
      entry.overallScore,
      entry.visitType,
      entry.metrics?.food || "",
      entry.metrics?.service || "",
      entry.metrics?.ambience || "",
      entry.metrics?.cleanliness || "",
      (entry.highlights || []).join(" | "),
      entry.comments || "",
      entry.guestName || "",
      entry.guestPhone || "",
      entry.createdAt,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "yamazaki-feedback.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function refreshEntries() {
  try {
    statusNote.textContent = "Loading live responses...";
    allEntries = await window.YamazakiFeedbackApi.listFeedback({
      venue: venueFilter.value,
      rating: ratingFilter.value,
    });
    renderEntries();
    statusNote.textContent = `Live database connected. Showing ${allEntries.length} responses.`;
  } catch (error) {
    allEntries = [];
    renderEntries();
    statusNote.textContent = error.message || "Could not load live feedback.";
  }
}

venueFilter?.addEventListener("change", refreshEntries);
ratingFilter?.addEventListener("change", refreshEntries);
exportCsvBtn?.addEventListener("click", exportCsv);

(async function init() {
  await populateVenueFilter();
  await refreshEntries();
})();
