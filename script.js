let DATA_URL;

const linksByMonth = {
  "2025-07": "https://script.google.com/macros/s/AKfycbyINWFJ32BoDYI6yrO7X1xY-rgYpPe5z71f5ad-cGOTPwPSUNd8EoIww6ubTMMkAF9X/exec",
  "2025-08": "https://script.google.com/macros/s/AKfycbxTh13rYdaQwoy8n6DuDPwv6SmLgpE3weilAvnmUhbR5Ct1-7qYAWz_jfAQsO57ut0/exec"
};

const monthSelector = document.getElementById("monthSelector");
for (const month in linksByMonth) {
  const option = document.createElement("option");
  option.value = month;
  option.textContent = new Date(month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
  monthSelector.appendChild(option);
}

monthSelector.addEventListener("change", async () => {
  DATA_URL = linksByMonth[monthSelector.value];
  document.getElementById('loading').style.display = 'block';
  document.getElementById('transactionsTable').style.display = 'none';
  await init();
});

monthSelector.value = "2025-07";
DATA_URL = linksByMonth[monthSelector.value];

let chartInstance;
let globalSummary = {};
let globalTransactions = [];

const toggleIncome = document.getElementById("toggleIncome");
const categoryFilterTable = document.getElementById("categoryFilterTable");
const categoryTotalDiv = document.getElementById("categoryTotal");
const pieTotalDiv = document.getElementById("pieTotal");
const toggleDarkModeBtn = document.getElementById("toggleDarkModeBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

async function fetchData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Failed to fetch data");
    return await res.json();
  } catch (err) {
    alert("Error: " + err.message);
    return null;
  }
}

function renderPieChart(includeIncome = false) {
  const labels = [];
  const values = [];
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#FF7043',
    '#7E57C2', '#26A69A', '#FFB300', '#8D6E63', '#789262'
  ];
  const bgColors = [];
  let colorIndex = 0;
  let totalAmount = 0;

  for (let [category, value] of Object.entries(globalSummary)) {
    const cat = category.trim().toLowerCase();
    if (!includeIncome && cat === 'income') continue;
    labels.push(category);
    values.push(value);
    totalAmount += parseFloat(value);
    bgColors.push(colors[colorIndex++ % colors.length]);
  }

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('categoryChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors
      }]
    },
    options: {
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      responsive: true,
      plugins: {
        legend: { position: 'right' },
        title: {
          display: true,
          text: 'Spending by Category',
          font: { size: 18 }
        }
      }
    }
  });

  if (includeIncome) {
    const income = parseFloat(globalSummary['Income'] || 0);
    const expenses = Object.entries(globalSummary)
      .filter(([cat]) => cat.trim().toLowerCase() !== 'income')
      .reduce((sum, [, val]) => sum + parseFloat(val), 0);
    const net = income - expenses;
    pieTotalDiv.innerHTML = `Balance (Income - Expenses): Rs. ${net.toLocaleString()}`;
  } else {
    pieTotalDiv.innerHTML = `Total Expenses: Rs. ${totalAmount.toLocaleString()}`;
  }
}

function populateCategoryFilters(categories) {
  categoryFilterTable.innerHTML = `<option value="all">All</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilterTable.appendChild(opt);
  });
}

function populateTransactionsTable(transactions) {
  const tbody = document.querySelector('#transactionsTable tbody');
  tbody.innerHTML = "";

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No transactions available</td></tr>`;
    return;
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  transactions.forEach(tx => {
    const tr = document.createElement('tr');
    const amount = parseFloat(tx.amount);
    const cat = tx.category.trim().toLowerCase();
    const isIncome = cat === 'income';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';
    tr.setAttribute("data-category", tx.category);
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.name}</td>
      <td>${tx.category}</td>
      <td class="${amountClass}">Rs. ${amount.toLocaleString()}</td>
      <td>${tx.note || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterTable(category) {
  const rows = document.querySelectorAll('#transactionsTable tbody tr');

  rows.forEach(row => {
    row.style.display = (category === "all" || row.getAttribute("data-category") === category)
      ? ""
      : "none";
  });

  if (category.toLowerCase() === "income") {
    const total = globalSummary[category] || 0;
    categoryTotalDiv.innerHTML = `Total Income: Rs. ${parseFloat(total).toLocaleString()}`;
  } else if (category === "all") {
    categoryTotalDiv.innerHTML = "";
  } else {
    const total = globalSummary[category] || 0;
    categoryTotalDiv.innerHTML = `Total: Rs. ${parseFloat(total).toLocaleString()}`;
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    toggleDarkModeBtn.textContent = '☀️';
    toggleDarkModeBtn.title = 'Switch to Light Mode';
  } else {
    toggleDarkModeBtn.textContent = '🌙';
    toggleDarkModeBtn.title = 'Switch to Dark Mode';
  }
}

function exportTableToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Finance Dashboard Transactions", 14, 20);

  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Amount', dataKey: 'amount' },
    { header: 'Note', dataKey: 'note' }
  ];

  const rows = [];
  document.querySelectorAll('#transactionsTable tbody tr').forEach(tr => {
    if (tr.style.display !== 'none') {
      const tds = tr.querySelectorAll('td');
      rows.push({
        date: tds[0].textContent,
        name: tds[1].textContent,
        category: tds[2].textContent,
        amount: tds[3].textContent,
        note: tds[4].textContent
      });
    }
  });

  if (rows.length === 0) {
    alert("No transactions to export!");
    return;
  }

  doc.autoTable({
    columns: columns,
    body: rows,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  doc.save('Finance_Dashboard_Transactions.pdf');
}

async function init() {
  const data = await fetchData();
  if (!data) return;

  document.getElementById('loading').style.display = 'none';
  document.getElementById('transactionsTable').style.display = 'table';

  globalSummary = data.summary;
  globalTransactions = data.transactions;

  const categories = Object.keys(globalSummary);
  populateCategoryFilters(categories);

  renderPieChart(toggleIncome.checked);
  populateTransactionsTable(globalTransactions);
}

toggleIncome.addEventListener("change", () => {
  renderPieChart(toggleIncome.checked);
});

categoryFilterTable.addEventListener("change", () => {
  filterTable(categoryFilterTable.value);
});

toggleDarkModeBtn.addEventListener("click", toggleDarkMode);
exportPdfBtn.addEventListener("click", exportTableToPDF);

init();
