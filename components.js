// components.js — pure rendering functions for the dashboard.

function renderSummaryCards(container, cards) {
  container.innerHTML = cards.map((card) => `
    <article class="card">
      <div class="label">${card.label}</div>
      <div class="value">${card.value}</div>
      <div class="detail">${card.detail}</div>
    </article>
  `).join("");
}

function renderStandingsTable(table, teams, sortKey, sortDirection) {
  const columns = [
    { key: "rank", label: "#" },
    { key: "name", label: "Team" },
    { key: "owner", label: "Manager" },
    { key: "wins", label: "W-L-T" },
    { key: "winPct", label: "Win %" },
    { key: "pointsFor", label: "PF" },
    { key: "pointsAgainst", label: "PA" },
    { key: "pointDifferential", label: "Diff" },
    { key: "averageScore", label: "Avg" },
    { key: "consistency", label: "Consistency" }
  ];

  table.querySelector("thead").innerHTML = `
    <tr>
      ${columns.map((column) => `
        <th data-sort="${column.key}" class="${sortKey === column.key ? "active" : ""}">
          ${column.label}${sortKey === column.key ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
        </th>
      `).join("")}
    </tr>
  `;

  const sorted = [...teams].sort((a, b) => {
    if (sortKey === "rank") return a.rank - b.rank;
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (typeof valueA === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
  });

  table.querySelector("tbody").innerHTML = sorted.map((team, index) => `
    <tr>
      <td class="rank">${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.owner}</td>
      <td>${team.wins}-${team.losses}-${team.ties}</td>
      <td>${(team.winPct * 100).toFixed(1)}%</td>
      <td>${team.pointsFor.toFixed(1)}</td>
      <td>${team.pointsAgainst.toFixed(1)}</td>
      <td class="${team.pointDifferential >= 0 ? "pos" : "neg"}">
        ${team.pointDifferential >= 0 ? "+" : ""}${team.pointDifferential.toFixed(1)}
      </td>
      <td>${team.averageScore.toFixed(1)}</td>
      <td>±${team.consistency.toFixed(1)}</td>
    </tr>
  `).join("");
}

function renderTrendChart(container, teams) {
  const allScores = teams.flatMap((team) => team.weeklyScores || []);
  const maxScore = Math.max(...allScores, 1);

  container.innerHTML = teams.map((team, index) => {
    const average = team.averageScore;
    const width = Math.max(2, (average / maxScore) * 100);
    const hue = (index * 57) % 360;
    return `
      <div class="chart-row">
        <div class="chart-label">${team.name}</div>
        <div class="bar-track">
          <div class="bar" style="width:${width}%; background:hsl(${hue} 70% 55%);"></div>
          <div class="bar-value">${average.toFixed(1)}</div>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("trend-legend").innerHTML = teams.map((team, index) => {
    const hue = (index * 57) % 360;
    return `<span class="legend-item"><span class="legend-dot" style="background:hsl(${hue} 70% 55%)"></span>${team.name}</span>`;
  }).join("");
}

function renderMatchups(container, league, teamsById) {
  const latestWeek = Math.max(...league.matchups.map((matchup) => matchup.week), 0);
  const recent = league.matchups.filter((matchup) => matchup.week === latestWeek);

  container.innerHTML = recent.length ? recent.map((matchup) => {
    const home = teamsById[matchup.home];
    const away = teamsById[matchup.away];
    const homeWon = matchup.homeScore > matchup.awayScore;

    return `
      <article class="matchup">
        <div class="matchup-week">Week ${matchup.week}</div>
        <div class="matchup-row ${homeWon ? "winner" : ""}">
          <span>${home.name}</span><span>${matchup.homeScore.toFixed(1)}</span>
        </div>
        <div class="matchup-row ${homeWon ? "" : "winner"}">
          <span>${away.name}</span><span>${matchup.awayScore.toFixed(1)}</span>
        </div>
      </article>
    `;
  }).join("") : `<p class="muted">No matchup data available.</p>`;
}
