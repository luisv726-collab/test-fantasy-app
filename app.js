// app.js — application state, event handling, and initialization.

const state = {
  league: structuredClone(SAMPLE_LEAGUE),
  sortKey: "rank",
  sortDirection: "asc"
};

const elements = {
  seasonSelect: document.getElementById("season-select"),
  summary: document.getElementById("summary-cards"),
  standingsTable: document.getElementById("standings-table"),
  trendChart: document.getElementById("trend-chart"),
  matchups: document.getElementById("matchups"),
  jsonFile: document.getElementById("json-file"),
  loadJson: document.getElementById("load-json"),
  importStatus: document.getElementById("import-status"),
  reloadSample: document.getElementById("reload-sample")
};

function getTeamsById(league) {
  return Object.fromEntries(league.teams.map((team) => [team.id, team]));
}

function render() {
  const teams = buildTeamAnalytics(state.league);
  teams.forEach((team, index) => { team.rank = index + 1; });
  const teamsById = getTeamsById(state.league);

  renderSummaryCards(elements.summary, getLeagueSummary(teams, state.league));
  renderStandingsTable(elements.standingsTable, teams, state.sortKey, state.sortDirection);
  renderTrendChart(elements.trendChart, teams);
  renderMatchups(elements.matchups, state.league, teamsById);

  elements.seasonSelect.innerHTML = `<option>${state.league.season}</option>`;
}

function handleSort(event) {
  const key = event.target.closest("th")?.dataset.sort;
  if (!key) return;

  if (state.sortKey === key) {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  } else {
    state.sortKey = key;
    state.sortDirection = key === "name" || key === "owner" ? "asc" : "desc";
  }
  render();
}

function loadJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.league = parsed.teams ? parsed : normalizeEspnLeague(parsed);
      state.sortKey = "rank";
      state.sortDirection = "asc";
      elements.importStatus.textContent = `Loaded ${state.league.teams.length} teams from ${file.name}.`;
      render();
    } catch (error) {
      elements.importStatus.textContent = `Could not parse JSON: ${error.message}`;
    }
  };
  reader.readAsText(file);
}

elements.standingsTable.addEventListener("click", handleSort);
elements.loadJson.addEventListener("click", () => {
  if (elements.jsonFile.files[0]) loadJsonFile(elements.jsonFile.files[0]);
});
elements.reloadSample.addEventListener("click", () => {
  state.league = structuredClone(SAMPLE_LEAGUE);
  elements.importStatus.textContent = "Sample league restored.";
  render();
});

render();
