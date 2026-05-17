const activityList = document.querySelector("#activityList");
const rotateButton = document.querySelector("#rotateActivity");
const previewButton = document.querySelector("#previewRewards");
const rewardTabs = document.querySelectorAll(".reward-tab");
const rewardPreview = document.querySelector("#rewardPreview");

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

function renderActivity(index) {
  const items = activitySets[index];
  activityList.innerHTML = items
    .map(
      ([branch, text]) =>
        `<li><strong>${branch}</strong><span>${text}</span></li>`,
    )
    .join("");
}

function renderReward(key) {
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

rotateButton?.addEventListener("click", () => {
  currentActivityIndex = (currentActivityIndex + 1) % activitySets.length;
  renderActivity(currentActivityIndex);
});

previewButton?.addEventListener("click", () => {
  const nextTab =
    Array.from(rewardTabs).find((tab) => !tab.classList.contains("active")) ||
    rewardTabs[0];
  nextTab.click();
  rewardPreview.scrollIntoView({ behavior: "smooth", block: "center" });
});

rewardTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    rewardTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    renderReward(tab.dataset.reward);
  });
});

renderActivity(currentActivityIndex);
renderReward("birthday");
