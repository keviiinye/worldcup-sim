import type { GroupMatchResult, TeamStanding } from './types'
import { GROUP_LETTERS } from './types'
import { rankGroupTeams, type TeamRank } from './tiebreakers'
import { enumerateGroupOutcomes, getRemainingFixtures } from './groupSimulation'

function computeGroupAutoLocks(
  groupTeams: TeamStanding[],
  groupMatchResults: GroupMatchResult[],
): Partial<Record<string, TeamRank>> {
  if (groupTeams.length === 0) return {}

  const teamIds = groupTeams.map((t) => t.teamId)
  const currentRanked = rankGroupTeams(groupTeams, groupMatchResults)
  const currentRankById = new Map(
    currentRanked.map((t, i) => [t.teamId, (i + 1) as TeamRank]),
  )

  const remaining = getRemainingFixtures(teamIds, groupMatchResults)
  if (remaining.length === 0) {
    const allLocked: Partial<Record<string, TeamRank>> = {}
    for (const t of groupTeams) {
      allLocked[t.teamId] = currentRankById.get(t.teamId)!
    }
    return allLocked
  }

  const ranksByTeam = new Map<string, Set<TeamRank>>()
  for (const id of teamIds) ranksByTeam.set(id, new Set())

  for (const { ranked } of enumerateGroupOutcomes(groupTeams, groupMatchResults)) {
    ranked.forEach((t, i) => {
      ranksByTeam.get(t.teamId)!.add((i + 1) as TeamRank)
    })
  }

  const locked: Partial<Record<string, TeamRank>> = {}
  for (const t of groupTeams) {
    const possible = ranksByTeam.get(t.teamId)!
    const current = currentRankById.get(t.teamId)!
    if (possible.size === 1 && possible.has(current)) {
      locked[t.teamId] = current
    }
  }
  return locked
}

/** 根据已赛结果与剩余对阵，判断各队顺位是否已数学锁定 */
export function computeAutoLockedRanks(
  standings: TeamStanding[],
  matchResults: GroupMatchResult[],
): Partial<Record<string, TeamRank>> {
  const result: Partial<Record<string, TeamRank>> = {}
  for (const group of GROUP_LETTERS) {
    const groupTeams = standings.filter((t) => t.group === group)
    const ids = new Set(groupTeams.map((t) => t.teamId))
    const groupMatchResults = matchResults.filter(
      (m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId),
    )
    Object.assign(result, computeGroupAutoLocks(groupTeams, groupMatchResults))
  }
  return result
}
