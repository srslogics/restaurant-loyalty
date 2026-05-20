const qrForm = document.querySelector("#qrForm");
const qrCardsGrid = document.querySelector("#qrCardsGrid");
const printCardsBtn = document.querySelector("#printCardsBtn");
const generateAllBtn = document.querySelector("#generateAllBtn");
const venueSelect = document.querySelector("#qrVenue");
const tablePrefixInput = document.querySelector("#tablePrefix");
const tableCountInput = document.querySelector("#tableCount");
const qrStatus = document.querySelector("#qrStatus");
const fallbackVenues = window.YamazakiFeedbackVenues || [];

function setStatus(message) {
  if (qrStatus) {
    qrStatus.textContent = message;
  }
}

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
  if (!target) {
    return false;
  }

  if (!hasQRCodeLibrary()) {
    target.innerHTML = `<div class="qr-fallback-text">QR library unavailable</div>`;
    return false;
  }

  try {
    new QRCode(target, {
      text: url,
      width: 128,
      height: 128,
      colorDark: "#223126",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    return true;
  } catch (_error) {
    target.innerHTML = `<div class="qr-fallback-text">QR could not render here. Use the link below on the hosted page.</div>`;
    return false;
  }
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
  if (!packGrid) {
    throw new Error("QR card layout could not initialize.");
  }

  for (let index = 1; index <= tableCount; index += 1) {
    const tableCode = `${tablePrefix}${String(index).padStart(2, "0")}`;
    const card = document.createElement("article");
    card.className = "qr-card";
    const qrTargetId = `${venue.slug}-qr-${index}`;
    const url = `${basePath}?venue=${encodeURIComponent(venue.slug)}&table=${encodeURIComponent(tableCode)}`;

    card.innerHTML = `
      <div class="qr-card-glow"></div>
      <div class="qr-card-top">
        <span class="mini-kicker">Guest Experience</span>
        <strong>${tableCode}</strong>
      </div>
      <div class="qr-card-brand">
        <div class="qr-card-mark">Y</div>
        <p>${venue.name}</p>
        <span>Hospitality feedback</span>
      </div>
      <div class="qr-target" id="${qrTargetId}"></div>
      <div class="qr-card-message">
        <strong>Scan to share your experience</strong>
        <span>Takes less than 20 seconds</span>
      </div>
      <div class="qr-card-tip">Your feedback helps us refine service, ambience, and every detail of your visit.</div>
      <div class="qr-card-footer">
        <span>Thank you for dining with us</span>
      </div>
    `;

    packGrid.appendChild(card);
    const qrTarget = card.querySelector(`#${CSS.escape(qrTargetId)}`);
    const rendered = renderQrNode(qrTarget, url);
    if (!rendered && qrTarget) {
      qrTarget.insertAdjacentHTML(
        "beforeend",
        `<div class="qr-fallback-link"><a href="${url}" target="_blank" rel="noreferrer">Open feedback link</a></div>`,
      );
    }
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
  try {
    renderCardSet(venue, makeBasePath(), tablePrefixInput.value, tableCountInput.value);
    setStatus(`Generated ${tableCountInput.value} table cards for ${venue.name}.`);
  } catch (error) {
    setStatus(`Could not generate cards here. ${error.message || "Try the hosted page."}`);
  }
}

async function renderAllVenueCards() {
  const venues = await getAvailableVenues();
  const basePath = makeBasePath();
  qrCardsGrid.innerHTML = "";

  let renderedCount = 0;
  venues.forEach((venue) => {
    try {
      renderCardSet(venue, basePath, venue.tablePrefix, venue.defaultTableCount);
      renderedCount += 1;
    } catch (_error) {
      // Keep rendering the rest so one failure does not kill the whole page.
    }
  });

  if (renderedCount === venues.length) {
    setStatus(`Generated QR packs for all ${venues.length} ventures.`);
  } else if (renderedCount > 0) {
    setStatus(`Generated ${renderedCount} of ${venues.length} venture packs. Some QR blocks could not render in this browser context.`);
  } else {
    setStatus("Could not generate QR cards in this local preview. Please use the hosted Render URL.");
  }
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
  try {
    const venues = await getAvailableVenues();
    updateVenueSelect(venues);
    await renderAllVenueCards();
  } catch (error) {
    setStatus(`Could not initialize the QR page. ${error.message || "Try the hosted Render URL."}`);
  }
})();
