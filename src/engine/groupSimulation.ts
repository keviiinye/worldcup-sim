import type { GroupMatchResult, TeamStanding } from './types'
import { rankGroupTeams, type TeamRank } from './tiebreakers'

export type Fixture = { homeTeamId: string; awayTeamId: string }

export const SCORE_OUTCOMES: Array<{ homeGoals: number; awayGoals: number }> = [
  { homeGoals: 1, awayGoals: 0 },
  { homeGoals: 0, awayGoals: 0 },
  { homeGoals: 0, awayGoals: 1 },
]

export function fixtureKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

export function getGroupFixtures(teamIds: string[]): Fixture[] {
  const fixtures: Fixture[] = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      fixtures.push({ homeTeamId: teamIds[i], awayTeamId: teamIds[j] })
    }
  }
  return fixtures
}

export function getRemainingFixtures(
  teamIds: string[],
  matchResults: GroupMatchResult[],
): Fixture[] {
  const teamSet = new Set(teamIds)
  const played = new Set<string>()
  for (const m of matchResults) {
    if (teamSet.has(m.homeTeamId) && teamSet.has(m.awayTeamId)) {
      played.add(fixtureKey(m.homeTeamId, m.awayTeamId))
    }
  }
  return getGroupFixtures(teamIds).filter(
    (f) => !played.has(fixtureKey(f.homeTeamId, f.awayTeamId)),
  )
}

export function applyMatchToStats(
  teams: Map<string, TeamStanding>,
  m: GroupMatchResult,
): void {
  const home = teams.get(m.homeTeamId)!
  const away = teams.get(m.awayTeamId)!
  home.played += 1
  away.played += 1
  home.gf += m.homeGoals
  home.ga += m.awayGoals
  away.gf += m.awayGoals
  away.ga += m.homeGoals
  home.gd = home.gf - home.ga
  away.gd = away.gf - away.ga
  if (m.homeGoals > m.awayGoals) {
    home.won += 1
    home.points += 3
    away.lost += 1
  } else if (m.homeGoals < m.awayGoals) {
    away.won += 1
    away.points += 3
    home.lost += 1
  } else {
    home.drawn += 1
    away.drawn += 1
    home.points += 1
    away.points += 1
  }
}

export function cloneTeamForSimulation(team: TeamStanding): TeamStanding {
  return {
    ...team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }
}

export function enumerateOutcomeAssignments(
  remaining: Fixture[],
  index: number,
  current: GroupMatchResult[],
  callback: (results: GroupMatchResult[]) => void,
): void {
  if (index >= remaining.length) {
    callback(current)
    return
  }
  const f = remaining[index]
  for (const score of SCORE_OUTCOMES) {
    enumerateOutcomeAssignments(
      remaining,
      index + 1,
      [
        ...current,
        {
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          homeGoals: score.homeGoals,
          awayGoals: score.awayGoals,
        },
      ],
      callback,
    )
  }
}

export type SimulatedOutcome = {
  remainingResults: GroupMatchResult[]
  ranked: TeamStanding[]
}

/** 枚举剩余场次所有等权结果（胜 1-0 / 平 0-0 / 负 0-1） */
export function enumerateGroupOutcomes(
  groupTeams: TeamStanding[],
  groupMatchResults: GroupMatchResult[],
): SimulatedOutcome[] {
  const teamIds = groupTeams.map((t) => t.teamId)
  const remaining = getRemainingFixtures(teamIds, groupMatchResults)
  const outcomes: SimulatedOutcome[] = []

  if (remaining.length === 0) {
    const ranked = rankGroupTeams(groupTeams, groupMatchResults)
    outcomes.push({ remainingResults: [], ranked })
    return outcomes
  }

  enumerateOutcomeAssignments(remaining, 0, [], (simulatedRemaining) => {
    const stats = new Map(groupTeams.map((t) => [t.teamId, cloneTeamForSimulation(t)]))
    for (const m of groupMatchResults) applyMatchToStats(stats, m)
    for (const m of simulatedRemaining) applyMatchToStats(stats, m)
    const allResults = [...groupMatchResults, ...simulatedRemaining]
    outcomes.push({
      remainingResults: simulatedRemaining,
      ranked: rankGroupTeams([...stats.values()], allResults),
    })
  })

  return outcomes
}

export function computePointsRange(
  team: TeamStanding,
  remainingFixtures: Fixture[],
): { min: number; max: number } {
  let min = team.points
  let max = team.points
  for (const f of remainingFixtures) {
    if (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId) {
      min += 0
      max += 3
    }
  }
  return { min, max }
}

export type RankProbabilities = Record<TeamRank, number>

export function computeRankProbabilities(
  groupTeams: TeamStanding[],
  groupMatchResults: GroupMatchResult[],
): { probabilities: Record<string, RankProbabilities>; scenarioCount: number } {
  const outcomes = enumerateGroupOutcomes(groupTeams, groupMatchResults)
  const total = outcomes.length
  const counts = new Map<string, Record<TeamRank, number>>()

  for (const t of groupTeams) {
    counts.set(t.teamId, { 1: 0, 2: 0, 3: 0, 4: 0 })
  }

  for (const { ranked } of outcomes) {
    ranked.forEach((t, i) => {
      const rank = (i + 1) as TeamRank
      counts.get(t.teamId)![rank] += 1
    })
  }

  const probabilities: Record<string, RankProbabilities> = {}
  for (const t of groupTeams) {
    const c = counts.get(t.teamId)!
    probabilities[t.teamId] = {
      1: c[1] / total,
      2: c[2] / total,
      3: c[3] / total,
      4: c[4] / total,
    }
  }

  return { probabilities, scenarioCount: total }
}
