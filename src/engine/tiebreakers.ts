import type { GroupMatchResult, TeamStanding } from './types'

export function compareTeams(
  a: TeamStanding,
  b: TeamStanding,
  allTeams: TeamStanding[],
  matchResults: GroupMatchResult[] = [],
): number {
  if (a.points !== b.points) return b.points - a.points

  const tied = allTeams.filter(
    (t) => t.points === a.points && (t.teamId === a.teamId || t.teamId === b.teamId || t.points === a.points),
  )
  const uniqueTied = [...new Map(tied.map((t) => [t.teamId, t])).values()]
  const subset = uniqueTied.length >= 2 ? uniqueTied : [a, b]

  const step1 = compareHeadToHead(subset, matchResults)
  const idxA = step1.findIndex((t) => t.teamId === a.teamId)
  const idxB = step1.findIndex((t) => t.teamId === b.teamId)
  if (idxA !== idxB) return idxA - idxB

  if (a.gd !== b.gd) return b.gd - a.gd
  if (a.gf !== b.gf) return b.gf - a.gf
  if (a.fairPlayPoints !== b.fairPlayPoints) return b.fairPlayPoints - a.fairPlayPoints
  return a.fifaRank - b.fifaRank
}

function compareHeadToHead(
  teams: TeamStanding[],
  matchResults: GroupMatchResult[],
): TeamStanding[] {
  if (teams.length <= 1) return teams

  const ids = new Set(teams.map((t) => t.teamId))
  const h2hMatches = matchResults.filter(
    (m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId),
  )

  const stats = new Map(
    teams.map((t) => [
      t.teamId,
      { team: t, pts: 0, gd: 0, gf: 0 },
    ]),
  )

  for (const m of h2hMatches) {
    const home = stats.get(m.homeTeamId)!
    const away = stats.get(m.awayTeamId)!
    home.gf += m.homeGoals
    home.gd += m.homeGoals - m.awayGoals
    away.gf += m.awayGoals
    away.gd += m.awayGoals - m.homeGoals
    if (m.homeGoals > m.awayGoals) home.pts += 3
    else if (m.homeGoals < m.awayGoals) away.pts += 3
    else {
      home.pts += 1
      away.pts += 1
    }
  }

  return [...stats.values()]
    .sort((x, y) => {
      if (x.pts !== y.pts) return y.pts - x.pts
      if (x.gd !== y.gd) return y.gd - x.gd
      return y.gf - x.gf
    })
    .map((s) => s.team)
}

export function rankGroupTeams(
  teams: TeamStanding[],
  matchResults: GroupMatchResult[] = [],
  manualOrder?: string[],
): TeamStanding[] {
  if (manualOrder?.length === teams.length) {
    const byId = new Map(teams.map((t) => [t.teamId, t]))
    return manualOrder.map((id) => byId.get(id)!).filter(Boolean)
  }
  return [...teams].sort((a, b) => compareTeams(a, b, teams, matchResults))
}

export type TeamRank = 1 | 2 | 3 | 4

/** 将已锁定的球队固定在指定顺位，其余球队按自动排名填充空位 */
export function applyTeamRankLocks(
  autoRanked: TeamStanding[],
  lockedRanks: Partial<Record<string, TeamRank>>,
): TeamStanding[] {
  const locks = new Map<TeamRank, TeamStanding>()
  for (const team of autoRanked) {
    const rank = lockedRanks[team.teamId]
    if (rank) locks.set(rank, team)
  }
  if (locks.size === 0) return autoRanked

  const lockedIds = new Set([...locks.values()].map((t) => t.teamId))
  const unlocked = autoRanked.filter((t) => !lockedIds.has(t.teamId))
  const result: TeamStanding[] = new Array(autoRanked.length)
  for (const [rank, team] of locks) {
    result[rank - 1] = team
  }
  let ui = 0
  for (let i = 0; i < autoRanked.length; i++) {
    if (!result[i]) result[i] = unlocked[ui++]
  }
  return result
}

export function compareThirdPlace(a: TeamStanding, b: TeamStanding): number {
  if (a.points !== b.points) return b.points - a.points
  if (a.gd !== b.gd) return b.gd - a.gd
  if (a.gf !== b.gf) return b.gf - a.gf
  if (a.fairPlayPoints !== b.fairPlayPoints) return b.fairPlayPoints - a.fairPlayPoints
  return a.fifaRank - b.fifaRank
}

export function rankThirdPlaceTeams(
  thirdPlaceTeams: TeamStanding[],
  manualOrder?: string[] | null,
): TeamStanding[] {
  if (manualOrder?.length === thirdPlaceTeams.length) {
    const byId = new Map(thirdPlaceTeams.map((t) => [t.teamId, t]))
    return manualOrder.map((id) => byId.get(id)!).filter(Boolean)
  }
  return [...thirdPlaceTeams].sort(compareThirdPlace)
}
