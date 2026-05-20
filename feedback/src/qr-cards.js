const qrForm = document.querySelector("#qrForm");
const qrCardsGrid = document.querySelector("#qrCardsGrid");
const printCardsBtn = document.querySelector("#printCardsBtn");
const generateAllBtn = document.querySelector("#generateAllBtn");
const venueSelect = document.querySelector("#qrVenue");
const tablePrefixInput = document.querySelector("#tablePrefix");
const tableCountInput = document.querySelector("#tableCount");
const qrStatus = document.querySelector("#qrStatus");
const fallbackVenues = window.YamazakiFeedbackVenues || [];

function makeBasePath() {
  if (window.location.protocol === "file:") {
    return "./index.html";
  }

  if (window.location.origin && window.location.origin !== "null") {
    return `${window.location.origin}/feedback/index.html`;
  }

  return "/feedback/index.html";
}

async function getAvailableVenues() {
  try {
    const venues = await window.YamazakiFeedbackApi.getVenues();
    if (Array.isArray(venues) && venues.length) {
      return venues;
    }
  } catch (_error) {
    // Ignore and fall back to seeded venue list.
  }

  return fallbackVenues;
}

function updateVenueSelect(venues) {
  venueSelect.innerHTML = venues
    .map(
      (venue) =>
        `<option value="${venue.slug}" data-prefix="${venue.tablePrefix}" data-count="${venue.defaultTableCount}">${venue.name}</option>`,
    )
    .join("");

  const activeVenue = venues[0];
  if (activeVenue) {
    tablePrefixInput.value = activeVenue.tablePrefix;
    tableCountInput.value = activeVenue.defaultTableCount;
  }
}

function hasQRCodeLibrary() {
  return typeof window.QRCode === "function";
}

function renderQrNode(target, url) {
  if (!hasQRCodeLibrary()) {
    target.innerHTML = `<div class="qr-fallback-text">QR library unavailable</div>`;
    return;
  }

  new QRCode(target, {
    text: url,
    width: 128,
    height: 128,
    colorDark: "#223126",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

function renderCardSet(venue, basePath, prefixOverride, countOverride) {
  const tablePrefix = prefixOverride || venue.tablePrefix || "T";
  const tableCount = Number(countOverride || venue.defaultTableCount || 0);

  const section = document.createElement("section");
  section.className = "venue-pack";
  section.innerHTML = `
    <div class="venue-pack-head">
      <div>
        <p class="mini-kicker">QR Pack</p>
        <h3>${venue.name}</h3>
      </div>
      <span>${tableCount} tables</span>
    </div>
    <div class="qr-pack-grid"></div>
  `;
  const packGrid = section.querySelector(".qr-pack-grid");

  for (let index = 1; index <= tableCount; index += 1) {
    const tableCode = `${tablePrefix}${String(index).padStart(2, "0")}`;
    const card = document.createElement("article");
    card.className = "qr-card";
    const qrTargetId = `${venue.slug}-qr-${index}`;
    const url = `${basePath}?venue=${encodeURIComponent(venue.slug)}&table=${encodeURIComponent(tableCode)}`;

    card.innerHTML = `
      <div class="qr-card-top">
        <span class="mini-kicker">Yamazaki Feedback</span>
        <strong>${tableCode}</strong>
      </div>
      <div class="qr-target" id="${qrTargetId}"></div>
      <p>${venue.name}</p>
      <span>Scan to rate your experience</span>
      <div class="qr-card-tip">Takes less than 20 seconds. Low ratings can be followed up quickly by the venue team.</div>
      <code>${url}</code>
    `;

    packGrid.appendChild(card);
    renderQrNode(document.getElementById(qrTargetId), url);
  }

  qrCardsGrid.appendChild(section);
}

function renderCards(event) {
  if (event) {
    event.preventDefault();
  }

  const selectedOption = venueSelect.selectedOptions[0];
  if (!selectedOption) {
    return;
  }

  const venue = {
    slug: selectedOption.value,
    name: selectedOption.textContent,
    tablePrefix: selectedOption.dataset.prefix,
    defaultTableCount: Number(selectedOption.dataset.count || 0),
  };

  qrCardsGrid.innerHTML = "";
  renderCardSet(venue, makeBasePath(), tablePrefixInput.value, tableCountInput.value);
  qrStatus.textContent = `Generated ${tableCountInput.value} table cards for ${venue.name}.`;
}

async function renderAllVenueCards() {
  const venues = await getAvailableVenues();
  const basePath = makeBasePath();
  qrCardsGrid.innerHTML = "";

  venues.forEach((venue) => {
    renderCardSet(venue, basePath, venue.tablePrefix, venue.defaultTableCount);
  });

  qrStatus.textContent = `Generated QR packs for all ${venues.length} ventures.`;
}

venueSelect?.addEventListener("change", () => {
  const selectedOption = venueSelect.selectedOptions[0];
  tablePrefixInput.value = selectedOption?.dataset.prefix || "T";
  tableCountInput.value = selectedOption?.dataset.count || "12";
});

qrForm?.addEventListener("submit", renderCards);
printCardsBtn?.addEventListener("click", () => window.print());
generateAllBtn?.addEventListener("click", renderAllVenueCards);

(async function init() {
  const venues = await getAvailableVenues();
  updateVenueSelect(venues);
  await renderAllVenueCards();
})();
