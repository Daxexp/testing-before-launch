// === Define your URLs in order: July 2025, August 2025, etc. ===
const monthDataLinks = [
  "https://script.google.com/macros/s/AKfycbyINWFJ32BoDYI6yrO7X1xY-rgYpPe5z71f5ad-cGOTPwPSUNd8EoIww6ubTMMkAF9X/exec",
  "https://script.google.com/macros/s/AKfycbxTh13rYdaQwoy8n6DuDPwv6SmLgpE3weilAvnmUhbR5Ct1-7qYAWz_jfAQsO57ut0/exec",
  "https://script.google.com/macros/s/YOUR_SEPTEMBER_2025_URL/exec"
];

// === Generate month labels starting from July 2025 ===
const monthLabels = (() => {
  const start = new Date(2025, 6); // July = month 6 (0-based)
  return monthDataLinks.map((_, i) => {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
})();

// === Create and inject the month selector ===
const selectorContainer = document.createElement("div");
selectorContainer.id = "monthSelectorContainer";
selectorContainer.style.margin = "1rem";
selectorContainer.innerHTML = `
  <label for="monthSelector" style="font-weight:bold; margin-right: 0.5rem;">Select Month:</label>
  <select id="monthSelector">
    ${monthLabels.map((label, i) => `<option value="${i}">${label}</option>`).join("")}
  </select>
`;
document.addEventListener("DOMContentLoaded", () => {
  document.body.insertBefore(selectorContainer, document.getElementById("charts"));
});

// === Override init to load selected month's URL ===
const originalInit = window.init || (() => {});
window.init = async function (index = 0) {
  const url = monthDataLinks[index] || monthDataLinks[0];

  try {
    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("loading").style.display = "none";
    document.getElementById("transactionsTable").style.display = "table";

    window.globalSummary = data.summary;
    window.globalTransactions = data.transactions;

    const categories = Object.keys(globalSummary);
    if (typeof populateCategoryFilters === "function") {
      populateCategoryFilters(categories);
    }

    if (typeof renderPieChart === "function") {
      renderPieChart(toggleIncome.checked);
    }

    if (typeof populateTransactionsTable === "function") {
      populateTransactionsTable(globalTransactions);
    }
  } catch (err) {
    alert("Failed to load data for selected month.");
  }
};

// === Hook up dropdown to trigger init ===
document.addEventListener("DOMContentLoaded", () => {
  const monthSelector = document.getElementById("monthSelector");
  monthSelector.addEventListener("change", (e) => {
    const index = parseInt(e.target.value);
    document.getElementById("loading").style.display = "block";
    document.getElementById("transactionsTable").style.display = "none";
    window.init(index);
  });

  // Load default (July 2025)
  init(0);
});
