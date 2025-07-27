// === Step 1: Define the ordered list of Google Script links ===
const monthDataLinks = [
  "https://script.google.com/macros/s/AKfycbyINWFJ32BoDYI6yrO7X1xY-rgYpPe5z71f5ad-cGOTPwPSUNd8EoIww6ubTMMkAF9X/exec", // July 2025
  "https://script.google.com/macros/s/AKfycbxTh13rYdaQwoy8n6DuDPwv6SmLgpE3weilAvnmUhbR5Ct1-7qYAWz_jfAQsO57ut0/exec", // August 2025
];

// === Step 2: Dynamically generate month labels ===
const monthLabels = (() => {
  const start = new Date(2025, 6); // July = 6 (0-based)
  return monthDataLinks.map((_, i) => {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
})();

// === Step 3: Prevent script.js from running its default init ===
// This temporarily blocks the default init() from running
window.init = () => {}; // dummy until we override it below

// === Step 4: Inject the dropdown AFTER DOM is ready ===
document.addEventListener("DOMContentLoaded", () => {
  const selectorContainer = document.createElement("div");
  selectorContainer.id = "monthSelectorContainer";
  selectorContainer.style.margin = "1rem";
  selectorContainer.innerHTML = `
    <label for="monthSelector" style="font-weight:bold; margin-right: 0.5rem;">Select Month:</label>
    <select id="monthSelector">
      ${monthLabels.map((label, i) => `<option value="${i}">${label}</option>`).join("")}
    </select>
  `;
  document.body.insertBefore(selectorContainer, document.getElementById("charts"));

  const monthSelector = document.getElementById("monthSelector");
  monthSelector.addEventListener("change", (e) => {
    const index = parseInt(e.target.value);
    loadDashboard(index);
  });

  // Load default (July)
  loadDashboard(0);
});

// === Step 5: Custom loader to replace original init() ===
function loadDashboard(index = 0) {
  const url = monthDataLinks[index];

  document.getElementById("loading").style.display = "block";
  document.getElementById("transactionsTable").style.display = "none";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data) throw new Error("No data");

      window.globalSummary = data.summary;
      window.globalTransactions = data.transactions;

      document.getElementById("loading").style.display = "none";
      document.getElementById("transactionsTable").style.display = "table";

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
    })
    .catch((err) => {
      console.error("Data load error:", err);
      alert("Failed to load data for selected month.");
    });
}
