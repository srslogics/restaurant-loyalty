const rewardPreview = document.querySelector("#rewardPreview");
const rewardTabs = document.querySelectorAll(".reward-tab");
const activityList = document.querySelector("#activityList");
const rotateButton = document.querySelector("#rotateActivity");
const pills = document.querySelectorAll(".pill");
const customerRows = document.querySelectorAll(".customer-table .table-row[data-segment]");
const currentPage = document.body.dataset.page;

const activitySets = [
  [
    ["Dharampeth", "Riya Sharma redeemed a dessert reward"],
    ["Wardha Road", "4 new members enrolled during lunch rush"],
    ["Sadar", "Referral coupon converted on a family table"],
  ],
  [
    ["Manish Nagar", "VIP guest unlocked Gold tier after 8th visit"],
    ["Sitabuldi", "Birthday coupon sent to 37 members"],
    ["Civil Lines", "Owner alert: inactive guests up 6% this week"],
  ],
  [
    ["Wardha Road", "Double-points campaign lifted repeat spend by 14%"],
    ["Dharampeth", "Cashier recovered guest by phone lookup in 4 seconds"],
    ["Sadar", "Coupon redemptions peaking after 7 PM"],
  ],
];

const rewardContent = {
  birthday: {
    title: "Birthday Treat",
    body:
      "Automatically send a free dessert coupon 3 days before the guest's birthday and keep it valid for 7 days.",
    tags: ["All branches", "WhatsApp + SMS", "Auto-issued"],
  },
  weekday: {
    title: "Weekday Boost",
    body:
      "Offer double points every Tuesday and Wednesday to increase midweek footfall without discounting full menu pricing.",
    tags: ["Selected days", "Branch override", "Point multiplier"],
  },
  vip: {
    title: "VIP Gold Tier",
    body:
      "Upgrade guests after 8 visits or ₹15,000 spend, then unlock priority perks like welcome drinks and faster reward earning.",
    tags: ["Tier logic", "Spend + visits", "Premium perks"],
  },
};

let currentActivityIndex = 0;

function setActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === currentPage);
  });
}

function renderActivity(index) {
  if (!activityList) {
    return;
  }

  activityList.innerHTML = activitySets[index]
    .map(
      ([branch, text]) =>
        `<li><strong>${branch}</strong><span>${text}</span></li>`,
    )
    .join("");
}

function renderReward(key) {
  if (!rewardPreview) {
    return;
  }

  const reward = rewardContent[key];
  rewardPreview.innerHTML = `
    <p class="panel-label">Live reward configuration</p>
    <h3>${reward.title}</h3>
    <p>${reward.body}</p>
    <div class="reward-tags">
      ${reward.tags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
  `;
}

function filterCustomers(segment) {
  customerRows.forEach((row) => {
    const rowSegment = row.dataset.segment;
    row.hidden = !(segment === "all" || rowSegment === segment);
  });
}

rotateButton?.addEventListener("click", () => {
  currentActivityIndex = (currentActivityIndex + 1) % activitySets.length;
  renderActivity(currentActivityIndex);
});

rewardTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    rewardTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    renderReward(tab.dataset.reward);
  });
});

pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
    filterCustomers(pill.dataset.segment);
  });
});

setActiveNav();
renderActivity(currentActivityIndex);
renderReward("birthday");
filterCustomers("all");
