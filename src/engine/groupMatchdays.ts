import { GROUP_DRAW } from '../data/draw'
import type { GroupLetter, GroupMatchResult, TeamStanding } from './types'
import { fixtureKey } from './groupSimulation'

export type ScheduleSlot = {
  homeTeamId: string
  awayTeamId: string
  homeCode: string
  awayCode: string
  homeFlag?: string
  awayFlag?: string
  status: 'played' | 'upcoming'
  homeGoals?: number
  awayGoals?: number
  scoreLabel?: string
}

export type MatchdaySchedule = {
  matchday: 1 | 2 | 3
  matches: ScheduleSlot[]
}

/** FIFA 标准 4 队小组三轮对阵（按抽签顺位 1–4） */
function getMatchdayFixtures(teamIds: string[]): Array<Array<{ homeTeamId: string; awayTeamId: string }>> {
  const [t1, t2, t3, t4] = teamIds
  return [
    [
      { homeTeamId: t1, awayTeamId: t2 },
      { homeTeamId: t3, awayTeamId: t4 },
    ],
    [
      { homeTeamId: t1, awayTeamId: t3 },
      { homeTeamId: t2, awayTeamId: t4 },
    ],
    [
      { homeTeamId: t1, awayTeamId: t4 },
      { homeTeamId: t2, awayTeamId: t3 },
    ],
  ]
}

function findGroupResult(
  results: GroupMatchResult[],
  a: string,
  b: string,
): GroupMatchResult | undefined {
  const key = fixtureKey(a, b)
  return results.find((m) => fixtureKey(m.homeTeamId, m.awayTeamId) === key)
}

function formatScore(h: number, a: number): string {
  return `${h}–${a}`
}

export function buildGroupMatchdays(
  group: GroupLetter,
  groupTeams: TeamStanding[],
  matchResults: GroupMatchResult[],
): MatchdaySchedule[] {
  const drawOrder = GROUP_DRAW[group].map((t) => t.teamId)
  const byId = new Map(groupTeams.map((t) => [t.teamId, t]))
  const groupResults = matchResults.filter((m) => {
    const ids = new Set(drawOrder)
    return ids.has(m.homeTeamId) && ids.has(m.awayTeamId)
  })

  return getMatchdayFixtures(drawOrder).map((fixtures, i) => ({
    matchday: (i + 1) as 1 | 2 | 3,
    matches: fixtures.map((f) => {
      const result = findGroupResult(groupResults, f.homeTeamId, f.awayTeamId)
      const home = byId.get(result?.homeTeamId ?? f.homeTeamId)!
      const away = byId.get(result?.awayTeamId ?? f.awayTeamId)!
      if (result) {
        return {
          homeTeamId: result.homeTeamId,
          awayTeamId: result.awayTeamId,
          homeCode: home.code,
          awayCode: away.code,
          homeFlag: home.flag,
          awayFlag: away.flag,
          status: 'played' as const,
          homeGoals: result.homeGoals,
          awayGoals: result.awayGoals,
          scoreLabel: formatScore(result.homeGoals, result.awayGoals),
        }
      }
      return {
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        homeCode: home.code,
        awayCode: away.code,
        homeFlag: home.flag,
        awayFlag: away.flag,
        status: 'upcoming' as const,
      }
    }),
  }))
}
