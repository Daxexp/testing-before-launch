// Define monthly URLs
const MULTI_MONTH_URLS = {
  july: "https://script.google.com/macros/s/AKfycbyINWFJ32BoDYI6yrO7X1xY-rgYpPe5z71f5ad-cGOTPwPSUNd8EoIww6ubTMMkAF9X/exec",
  august: "https://script.google.com/macros/s/YOUR_AUGUST_URL/exec",
  september: "https://script.google.com/macros/s/YOUR_SEPTEMBER_URL/exec"
};

// Add month selector to the DOM
const selectorContainer = document.createElement("div");
selectorContainer.id = "monthSelectorContainer";
selectorContainer.innerHTML = `
  <label for="monthSelector">Select Month:</label>
  <select id="monthSelector">
    <option value="july">July 2025</option>
    <option value="august">August 2025</option>
    <option value="september">September 2025</option>
  </select>
`;
document.body.insertBefore(selectorContainer, document.getElementById("charts"));

// Override or hook into the original init() function
let originalInit = window.init || (() => {});
window.init = async function (monthKey = "july") {
  const url = MULTI_MONTH_URLS[monthKey] || MULTI_MONTH_URLS["july"];
  const res = await fetch(url);
  const data = await res.json();

  if (!data) return;

  // Fake expected global structure from original script.js
  window.globalSummary = data.summary;
  window.globalTransactions = data.transactions;

  // Hide loading, show table
  document.getElementById("loading").style.display = "none";
  document.getElementById("transactionsTable").style.display = "table";

  // Call original update/render functions
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
};

// Re-call init() when month is changed
document.getElementById("monthSelector").addEventListener("change", (e) => {
  const selectedMonth = e.target.value;
  document.getElementById("loading").style.display = "block";
  document.getElementById("transactionsTable").style.display = "none";
  window.init(selectedMonth);
});

// Call the new init on load
window.addEventListener("DOMContentLoaded", () => {
  init("july");
});
