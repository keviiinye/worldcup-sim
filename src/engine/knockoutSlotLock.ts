import { getRemainingFixtures } from './groupSimulation'
import type { GroupMatchResult, TeamStanding, ThirdPlaceEntry } from './types'
import { GROUP_LETTERS } from './types'
import type { TeamRank } from './tiebreakers'

/** 12 组小组赛是否均已踢完（48 场） */
export function areAllGroupStagesComplete(
  standings: TeamStanding[],
  matchResults: GroupMatchResult[],
): boolean {
  for (const group of GROUP_LETTERS) {
    const groupTeams = standings.filter((t) => t.group === group)
    if (groupTeams.length === 0) continue
    const remaining = getRemainingFixtures(
      groupTeams.map((t) => t.teamId),
      matchResults,
    )
    if (remaining.length > 0) return false
  }
  return true
}

export type KnockoutSlotLockContext = {
  standings: TeamStanding[]
  matchResults: GroupMatchResult[]
  thirdPlace: ThirdPlaceEntry[]
}

/** 淘汰赛 32 强槽位是否已确定（与小组内数学锁定不同） */
export function isKnockoutSlotLocked(
  teamId: string,
  isThirdPlace: boolean,
  autoLockedTeamRanks: Partial<Record<string, TeamRank>>,
  context: KnockoutSlotLockContext,
): boolean {
  if (isThirdPlace) {
    if (!areAllGroupStagesComplete(context.standings, context.matchResults)) {
      return false
    }
    const entry = context.thirdPlace.find((t) => t.teamId === teamId)
    return entry?.qualified === true
  }
  return autoLockedTeamRanks[teamId] != null
}

export function knockoutSlotLockHint(
  isThirdPlace: boolean,
  isLocked: boolean,
): string {
  if (isLocked) return '淘汰赛落位已确定'
  if (isThirdPlace) {
    return '淘汰赛落位尚未确定（最佳第三名需等全部小组结束并排序）'
  }
  return '淘汰赛落位尚未确定'
}
