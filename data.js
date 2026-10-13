// data.js — league data model, sample data, and derived analytics.

const SAMPLE_LEAGUE = {
  name: "Sample Fantasy League",
  season: 2026,
  currentWeek: 6,
  teams: [
    { id: 1, name: "Gridiron Gurus", owner: "Alex", weeklyScores: [118.4, 132.1, 96.7, 141.2, 108.9, 125.6], wins: 4, losses: 2, ties: 0 },
    { id: 2, name: "End Zone Empire", owner: "Jordan", weeklyScores: [124.8, 109.3, 133.5, 88.4, 127.1, 116.2], wins: 4, losses: 2, ties: 0 },
    { id: 3, name: "Turf Titans", owner: "Sam", weeklyScores: [102.6, 121.8, 115.4, 134.9, 99.8, 108.3], wins: 3, losses: 3, ties: 0 },
    { id: 4, name: "Red Zone Rebels", owner: "Taylor", weeklyScores: [135.2, 94.6, 128.7, 112.5, 119.4, 103.1], wins: 3, losses: 3, ties: 0 },
    { id: 5, name: "Fourth & Goal", owner: "Casey", weeklyScores: [91.3, 116.9, 107.2, 126.8, 131.5, 122.4], wins: 3, losses: 3, ties: 0 },
    { id: 6, name: "Blitz Brigade", owner: "Riley", weeklyScores: [110.7, 103.4, 121.6, 95.2, 114.8, 118.9], wins: 2, losses: 4, ties: 0 }
  ],
  matchups: [
    { week: 6, home: 1, away: 2, homeScore: 125.6, awayScore: 116.2 },
    { week: 6, home: 3, away: 4, homeScore: 108.3, awayScore: 103.1 },
    { week: 6, home: 5, away: 6, homeScore: 122.4, awayScore: 118.9 }
  ]
};

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values) {
  return values.length ? sum(values) / values.length : 0;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  const variance = sum(values.map((value) => (value - average) ** 2)) / (values.length - 1);
  return Math.sqrt(variance);
}

function buildTeamAnalytics(league) {
  return league.teams.map((team) => {
    const scores = team.weeklyScores || [];
    const pointsFor = sum(scores);
    const games = team.wins + team.losses + team.ties;
    const pointsAgainst = league.matchups
      .filter((m) => m.home === team.id || m.away === team.id)
      .reduce((total, m) => total + (m.home === team.id ? m.awayScore : m.homeScore), 0);

    return {
      ...team,
      games,
      pointsFor,
      pointsAgainst,
      averageScore: games ? pointsFor / games : 0,
      consistency: standardDeviation(scores),
      winPct: games ? (team.wins + team.ties * 0.5) / games : 0,
      pointDifferential: pointsFor - pointsAgainst
    };
  }).sort((a, b) => b.winPct - a.winPct || b.pointsFor - a.pointsFor);
}

function getLeagueSummary(teams, league) {
  const leader = teams[0];
  const highestScore = teams.reduce((best, team) =>
    team.averageScore > best.averageScore ? team : best, teams[0]);
  const mostConsistent = teams.reduce((best, team) =>
    team.consistency < best.consistency ? team : best, teams[0]);
  const leagueAverage = mean(teams.flatMap((team) => team.weeklyScores || []));

  return [
    { label: "League", value: league.name, detail: `${league.season} • Week ${league.currentWeek}` },
    { label: "First place", value: leader.name, detail: `${leader.wins}-${leader.losses}-${leader.ties} • ${leader.pointsFor.toFixed(1)} PF` },
    { label: "Highest scoring", value: highestScore.name, detail: `${highestScore.averageScore.toFixed(1)} points/game` },
    { label: "Most consistent", value: mostConsistent.name, detail: `±${mostConsistent.consistency.toFixed(1)} weekly std. dev.` },
    { label: "League scoring", value: leagueAverage.toFixed(1), detail: "Average weekly team score" }
  ];
}

// Normalizes a minimal ESPN-style API response into this dashboard’s model.
function normalizeEspnLeague(espnLeague) {
  const teams = (espnLeague.teams || []).map((team) => ({
    id: team.id,
    name: team.name || `Team ${team.id}`,
    owner: team.owners && team.owners[0] ? team.owners[0].displayName || "Unknown" : "Unknown",
    wins: team.record?.overall?.wins ?? 0,
    losses: team.record?.overall?.losses ?? 0,
    ties: team.record?.overall?.ties ?? 0,
    pointsFor: team.points ?? 0,
    pointsAgainst: team.pointsAgainst ?? 0,
    weeklyScores: (team.schedule || []).map((event) =>
      event.home.teamId === team.id ? event.home.totalPoints : event.away.totalPoints
    ).filter((score) => typeof score === "number")
  }));

  return {
    name: espnLeague.settings?.name || "ESPN Fantasy League",
    season: espnLeague.seasonId || new Date().getFullYear(),
    currentWeek: espnLeague.status?.currentMatchupPeriod || 1,
    teams,
    matchups: []
  };
}
