const PLAYER_CONFIG = {
  Ant: {
    color: "#FF5252",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=926180051&single=true&output=csv",
  },
  Kiko: {
    color: "#448AFF",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=2032699527&single=true&output=csv",
  },
  Tac: {
    color: "#69F0AE",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=1993521443&single=true&output=csv",
  },
  June: {
    color: "#E040FB",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=984578577&single=true&output=csv",
  },
  Yeti: {
    color: "#FFAB40",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvvGCnIlBsRI9aTuGjbGAKar5aC8p2xJxoWYiIUiBSKioriD_g4V71izHRJi-ViUuRxD0rr-l5UzuT/pub?gid=2030076383&single=true&output=csv",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const playerName = params.get("name");

  if (!playerName || !PLAYER_CONFIG[playerName]) {
    document.getElementById("playerName").textContent = "Player Not Found";
    return;
  }

  const config = PLAYER_CONFIG[playerName];
  const nameTitle = document.getElementById("playerName");
  nameTitle.textContent = playerName;
  nameTitle.style.borderBottom = `4px solid ${config.color}`;

  const urlWithCache = `${config.url}&t=${Date.now()}`;

  Papa.parse(urlWithCache, {
    download: true,
    header: false,
    skipEmptyLines: true,
    complete: function (results) {
      processPlayerData(results.data);
    },
    error: function (err) {
      console.error("Error", err);
      nameTitle.textContent = "Error Loading Data";
    },
  });
});

function processPlayerData(rows) {
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (
      rows[i].includes("Map") &&
      rows[i].includes("Mode") &&
      rows[i].includes("Elim")
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return;

  // Map columns
  const header = rows[headerIdx];
  const col = {
    date: header.findIndex((c) => c.trim() === "Date"),
    map: header.findIndex((c) => c.trim() === "Map"),
    mode: header.findIndex((c) => c.trim() === "Mode"),
    elim: header.findIndex((c) => c.trim() === "Elim"),
    death: header.findIndex((c) => c.trim() === "Death"),
    wl: header.findIndex((c) => c.trim() === "W/L" || c.trim() === "Result"),
  };

  // Calculate Stats
  let totalElims = 0;
  let totalDeaths = 0;
  let wins = 0;
  let totalGames = 0;
  let currentStreak = 0;
  let history = [];

  const dataRows = rows.slice(headerIdx + 1);

  dataRows.forEach((row) => {
    if (!row[col.map] || !row[col.mode]) return; // Skip empty rows

    const elims = parseInt(row[col.elim]) || 0;
    const deaths = parseInt(row[col.death]) || 0;
    const result = row[col.wl] ? row[col.wl].trim().toUpperCase() : "-";

    totalElims += elims;
    totalDeaths += deaths;
    totalGames++;

    if (result === "W") {
      wins++;
      currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
    } else if (result === "L") {
      currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
    }

    // Add to history list
    history.push({
      date: row[col.date],
      map: row[col.map],
      mode: row[col.mode],
      kd: deaths > 0 ? (elims / deaths).toFixed(2) : elims,
      result: result,
    });
  });

  // Update UI Elements
  const kd = totalDeaths > 0 ? (totalElims / totalDeaths).toFixed(2) : "0.00";
  const winRate =
    totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) + "%" : "0%";

  animateValue("kdDisplay", 0, kd, 1000); // Cool animation
  document.getElementById("winDisplay").textContent = winRate;
  document.getElementById("gamesDisplay").textContent = totalGames;

  // Format Streak
  const streakEl = document.getElementById("streakDisplay");
  if (currentStreak > 0) {
    streakEl.textContent = `+${currentStreak} W`;
    streakEl.style.color = "#4caf50";
  } else {
    streakEl.textContent = `${currentStreak} L`;
    streakEl.style.color = "#ff5252";
  }

  renderHistoryTable(history.reverse()); // Show newest first
}

function renderHistoryTable(matches) {
  const tbody = document.getElementById("matchHistoryBody");
  tbody.innerHTML = "";

  matches.forEach((match) => {
    const tr = document.createElement("tr");

    const resultColor =
      match.result === "W"
        ? "#4caf50"
        : match.result === "L"
          ? "#ff5252"
          : "#fff";
    const kdColor = parseFloat(match.kd) >= 1.0 ? "#4caf50" : "#ff5252";

    tr.innerHTML = `
            <td>${match.date}</td>
            <td>${match.map}</td>
            <td>${match.mode}</td>
            <td style="color:${kdColor}; font-weight:bold;">${match.kd}</td>
            <td style="color:${resultColor}; font-weight:bold;">${match.result}</td>
        `;
    tbody.appendChild(tr);
  });
}

// Helper for number animation
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = (progress * (end - start) + start).toFixed(2);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
