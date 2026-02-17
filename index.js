const sheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=0&single=true&output=csv";

const playerColors = {
  Ant: "#FF5252", // Red
  Kiko: "#448AFF", // Blue
  Tac: "#69F0AE", // Green
  June: "#E040FB", // Purple
  Yeti: "#FFAB40", // Orange
};

const RANKS = [
  { name: "Iridescent", min: 10000 },
  { name: "Crimson III", min: 9100 },
  { name: "Crimson II", min: 8300 },
  { name: "Crimson I", min: 7500 },
  { name: "Diamond III", min: 6800 },
  { name: "Diamond II", min: 6100 },
  { name: "Diamond I", min: 5400 },
  { name: "Platinum III", min: 4800 },
  { name: "Platinum II", min: 4200 },
  { name: "Platinum I", min: 3600 },
  { name: "Gold III", min: 3100 },
  { name: "Gold II", min: 2600 },
  { name: "Gold I", min: 2100 },
  { name: "Silver III", min: 1700 },
  { name: "Silver II", min: 1300 },
  { name: "Silver I", min: 900 },
  { name: "Bronze III", min: 600 },
  { name: "Bronze II", min: 300 },
  { name: "Bronze I", min: 0 },
];

document.addEventListener("DOMContentLoaded", () => {
  const urlWithCacheBuster = `${sheetUrl}&t=${Date.now()}`;

  Papa.parse(urlWithCacheBuster, {
    download: true,
    header: false,
    skipEmptyLines: true,
    complete: function (results) {
      processData(results.data);
    },
    error: function (error) {
      console.error("Error fetching data:", error);
    },
  });
});

function processData(rows) {
  let headerRowIndex = -1;
  let dateColIndex = -1;

  // Find the header row
  for (let i = 0; i < rows.length; i++) {
    const colIndex = rows[i].findIndex((cell) => cell && cell.trim() == "Date");
    if (colIndex !== -1) {
      headerRowIndex = i;
      dateColIndex = colIndex;
      break;
    }
  }

  if (headerRowIndex === -1) return;

  const rawHeaders = rows[headerRowIndex];
  const activeHeaders = rawHeaders
    .slice(dateColIndex)
    .filter((h) => h && h.trim() !== "");
  const rawDataRows = rows.slice(headerRowIndex + 1);

  // Filter valid data
  const validData = rawDataRows.filter((row) => {
    const dateCell = row[dateColIndex];
    const hasDate = dateCell && dateCell.trim() !== "";
    const hasScore = row
      .slice(dateColIndex + 1)
      .some((cell) => cell && cell.trim() !== "");
    return hasDate && hasScore;
  });

  const labels = validData.map((row) => row[dateColIndex].trim());
  const datasets = [];
  let currentStats = [];

  for (let i = 1; i < activeHeaders.length; i++) {
    const playerName = activeHeaders[i];
    const actualColIndex = dateColIndex + i;

    const dataPoints = validData.map((row) => {
      const val = row[actualColIndex];
      return val ? parseInt(val.replace(/,/g, "")) : null;
    });

    // Get the last known SR
    const lastSR = dataPoints.filter((val) => val !== null).pop();

    currentStats.push({
      name: playerName,
      sr: lastSR || 0,
      rank: getRankName(lastSR),
      color: playerColors[playerName] || "#fff",
    });

    datasets.push({
      label: playerName,
      data: dataPoints,
      borderColor: playerColors[playerName] || "white",
      backgroundColor: "transparent",
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
    });
  }

  renderLeaderboard(currentStats);
  renderChart(labels, datasets);
  renderTable(activeHeaders, validData, dateColIndex);
}

function renderLeaderboard(stats) {
  const container = document.getElementById("leaderboard");
  if (!container) return;
  container.innerHTML = "";

  stats.sort((a, b) => b.sr - a.sr);

  stats.forEach((player) => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.style.borderTopColor = player.color;

    card.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-rank">${player.rank}</div>
            <div class="player-sr" style="color: ${player.color}">${player.sr} SR</div>
        `;
    container.appendChild(card);
  });
}

function renderChart(labels, datasets) {
  const ctx = document.getElementById("rankChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "white" },
        },
        x: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "white" },
        },
      },
      plugins: {
        legend: { labels: { color: "white" } },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null) {
                label +=
                  context.parsed.y +
                  " SR (" +
                  getRankName(context.parsed.y) +
                  ")";
              }
              return label;
            },
          },
        },
      },
    },
  });
}

function renderTable(headers, data, dateOffset) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  headers.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    tableHead.appendChild(th);
  });

  [...data].reverse().forEach((row) => {
    const tr = document.createElement("tr");
    for (let i = 0; i < headers.length; i++) {
      const td = document.createElement("td");
      const cellData = row[dateOffset + i] || "-";
      td.textContent = cellData;
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  });
}

function getRankName(sr) {
  if (sr === null || isNaN(sr)) return "Unranked";
  const rank = RANKS.find((r) => sr >= r.min);
  return rank ? rank.name : "Bronze I";
}
