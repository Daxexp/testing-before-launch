const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwBGhKRUumzGy08dzGVYZbkrUfdvHJvSSawS1bRgfndI7H9Tg3s_mceL1d-AcLhiwFs3w/exec";

const loader = document.getElementById("loaderWrapper");
const financeTable = document.getElementById("financeTable").getElementsByTagName("tbody")[0];
const categoryFilter = document.getElementById("categoryFilter");
const filteredTotal = document.getElementById("filteredTotal");
const expenseChart = document.getElementById("expenseChart").getContext("2d");
let originalData = [];
let chart;

function showLoader() {
  loader.style.display = "flex";
}

function hideLoader() {
  loader.style.display = "none";
}

async function fetchData() {
  showLoader();
  const response = await fetch(SHEET_URL);
  const data = await response.json();
  hideLoader();
  originalData = data;
  populateTable(data);
  populateFilterOptions(data);
  updateChart(data, document.getElementById("includeIncome").checked);
}

function populateTable(data) {
  financeTable.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    ["Date", "Category", "Amount", "Note"].forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key];
      tr.appendChild(td);
    });
    financeTable.appendChild(tr);
  });
}

function populateFilterOptions(data) {
  const categories = new Set(data.map((row) => row.Category));
  categoryFilter.innerHTML = `<option value="All">All</option>`;
  categories.forEach((category) => {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

function filterTable(category) {
  let filtered = originalData;
  if (category !== "All") {
    filtered = originalData.filter((row) => row.Category === category);
  }
  populateTable(filtered);

  const total = filtered.reduce((sum, row) => {
    const amount = parseFloat(row.Amount) || 0;
    return sum + amount;
  }, 0);

  filteredTotal.textContent = `Total: Rs. ${total.toFixed(2)}`;
}

function updateChart(data, includeIncome) {
  const filtered = includeIncome
    ? data
    : data.filter((row) => row.Category !== "Income");

  const totals = {};
  filtered.forEach((row) => {
    const amount = parseFloat(row.Amount);
    if (!isNaN(amount)) {
      totals[row.Category] = (totals[row.Category] || 0) + amount;
    }
  });

  const labels = Object.keys(totals);
  const amounts = Object.values(totals);

  if (chart) chart.destroy();

  chart = new Chart(expenseChart, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses",
          data: amounts,
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#cc65fe",
            "#ffce56",
            "#ffa07a",
            "#8a2be2",
          ],
        },
      ],
    },
  });
}

document.getElementById("includeIncome").addEventListener("change", () => {
  updateChart(originalData, document.getElementById("includeIncome").checked);
});

categoryFilter.addEventListener("change", () => {
  filterTable(categoryFilter.value);
});

document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

document.getElementById("exportButton").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;
  pdf.text("Finance Report", 10, y);
  y += 10;

  originalData.forEach((row) => {
    pdf.text(
      `${row.Date} - ${row.Category} - Rs. ${row.Amount} - ${row.Note}`,
      10,
      y
    );
    y += 10;
  });

  pdf.save("finance_report.pdf");
});

window.onload = fetchData;
