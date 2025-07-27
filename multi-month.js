// === Month Data Links in order ===
const monthDataLinks = [
  "https://script.google.com/macros/s/AKfycbyINWFJ32BoDYI6yrO7X1xY-rgYpPe5z71f5ad-cGOTPwPSUNd8EoIww6ubTMMkAF9X/exec", // July 2025
  "https://script.google.com/macros/s/AKfycbxTh13rYdaQwoy8n6DuDPwv6SmLgpE3weilAvnmUhbR5Ct1-7qYAWz_jfAQsO57ut0/exec", // August 2025
];

// === Month Labels based on order ===
const monthLabels = (() => {
  const start = new Date(2025, 6); // July (0-indexed)
  return monthDataLinks.map((_, i) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
})();

// === Hijack the default init BEFORE script.js runs ===
window.init = () => {}; // block the original init()

// === DOM Ready Setup ===
document.addEventListener("DOMContentLoaded", () => {
  // Inject selector
  const selector = document.createElement("div");
  selector.id = "monthSelectorContainer";
  selector.style.margin = "1rem";
  selector.innerHTML = `
    <label for="monthSelector" style="font-weight:bold; margin-right: 0.5rem;">Select Month:</label>
    <select id="monthSelector">
      ${monthLabels.map((label, i) => `<option value="${i}">${label}</option>`).join("")}
    </select>
  `;
  document.body.insertBefore(selector, document.getElementById("charts"));

  document.getElementById("monthSelector").addEventListener("change", (e) => {
    loadDashboard(parseInt(e.target.value));
  });

  // Load first month by default (July)
  loadDashboard(0);
});

// === Custom Dashboard Loader ===
function loadDashboard(index) {
  const url = monthDataLinks[index];

  document.getElementById("loading").style.display = "block";
  document.getElementById("transactionsTable").style.display = "none";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      window.globalSummary = data.summary;
      window.globalTransactions = data.transactions;

      document.getElementById("loading").style.display = "none";
      document.getElementById("transactionsTable").style.display = "table";

      if (typeof populateCategoryFilters === "function") {
        populateCategoryFilters(Object.keys(globalSummary));
      }
      if (typeof renderPieChart === "function") {
        renderPieChart(toggleIncome.checked);
      }
      if (typeof populateTransactionsTable === "function") {
        populateTransactionsTable(globalTransactions);
      }
    })
    .catch((err) => {
      alert("Failed to load data for selected month.");
      console.error(err);
    });
}
