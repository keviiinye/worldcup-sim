import type { GroupLetter, GroupMatchResult, TeamStanding } from './types'
import { teamNameZh } from '../data/teamNamesZh'
import { rankGroupTeams } from './tiebreakers'
import {
  computePointsRange,
  computeRankProbabilities,
  getRemainingFixtures,
  type RankProbabilities,
} from './groupSimulation'
import { computeAutoLockedRanks } from './rankLock'
import { buildGroupMatchdays, type MatchdaySchedule } from './groupMatchdays'
import { buildGroupOutlook } from './groupOutlook'

export type MatchRecord = {
  homeTeamId: string
  awayTeamId: string
  homeCode: string
  awayCode: string
  homeFlag?: string
  awayFlag?: string
  homeGoals: number
  awayGoals: number
  scoreLabel: string
}

export type RemainingFixture = {
  homeTeamId: string
  awayTeamId: string
  homeCode: string
  awayCode: string
  homeFlag?: string
  awayFlag?: string
  homeName: string
  awayName: string
}

export type TeamAnalysis = {
  teamId: string
  code: string
  name: string
  flag?: string
  currentRank: 1 | 2 | 3 | 4
  points: number
  gd: number
  played: number
  pointsMin: number
  pointsMax: number
  rankProb: RankProbabilities
  top2Pct: number
  thirdPct: number
  outPct: number
  isRankLocked: boolean
  lockedRank?: 1 | 2 | 3 | 4
  fifaRank: number
}

export type GroupAnalysis = {
  group: GroupLetter
  scenarioCount: number
  playedMatches: MatchRecord[]
  remainingFixtures: RemainingFixture[]
  matchdays: MatchdaySchedule[]
  teams: TeamAnalysis[]
  insights: string[]
  outlook: string[]
}

function teamById(teams: TeamStanding[]): Map<string, TeamStanding> {
  return new Map(teams.map((t) => [t.teamId, t]))
}

function formatScore(h: number, a: number): string {
  return `${h}–${a}`
}

function teamLabel(t: TeamAnalysis): string {
  return teamNameZh(t.teamId, t.name)
}

function buildInsights(
  group: GroupLetter,
  teams: TeamAnalysis[],
  remaining: RemainingFixture[],
  scenarioCount: number,
): string[] {
  const insights: string[] = []

  const lockedTop2 = teams.filter((t) => t.isRankLocked && t.lockedRank! <= 2)
  const lockedOut = teams.filter((t) => t.isRankLocked && t.lockedRank === 4)
  const lockedThird = teams.filter((t) => t.isRankLocked && t.lockedRank === 3)

  if (lockedTop2.length > 0) {
    insights.push(
      `${lockedTop2.map(teamLabel).join('、')} 已锁定小组前二，末轮结果不影响其出线顺位。`,
    )
  }
  if (lockedOut.length > 0) {
    insights.push(
      `${lockedOut.map(teamLabel).join('、')} 已确定小组垫底，无缘出线。`,
    )
  }
  if (lockedThird.length > 0) {
    insights.push(
      `${lockedThird.map(teamLabel).join('、')} 锁定第三名，需关注最佳第三名榜单能否进入前八。`,
    )
  }

  const fightingTop2 = teams.filter((t) => !t.isRankLocked && t.top2Pct > 0 && t.top2Pct < 1)
  if (fightingTop2.length >= 2 && remaining.length === 1) {
    const f = remaining[0]
    insights.push(
      `末轮 ${teamNameZh(f.homeTeamId, f.homeName)} vs ${teamNameZh(f.awayTeamId, f.awayName)} 为直接对话，结果将大幅改写前二归属。`,
    )
  } else if (fightingTop2.length >= 2) {
    insights.push(
      `${fightingTop2.map((t) => `${teamLabel(t)}(${Math.round(t.top2Pct * 100)}%)`).join('、')} 仍在争夺出线名额。`,
    )
  }

  const thirdRace = teams.filter((t) => t.thirdPct >= 0.25 && !t.isRankLocked)
  if (thirdRace.length >= 2) {
    insights.push(
      `第三名竞争：${thirdRace.map((t) => `${teamLabel(t)} ${Math.round(t.thirdPct * 100)}%`).join(' · ')}。`,
    )
  }

  const tossUp = teams.filter(
    (t) => !t.isRankLocked && Math.max(...Object.values(t.rankProb)) < 0.6,
  )
  if (tossUp.length > 0 && insights.length < 4) {
    insights.push(
      `${tossUp.map(teamLabel).join('、')} 顺位仍高度不确定，建议结合末轮对阵手动模拟。`,
    )
  }

  if (insights.length === 0) {
    insights.push(
      scenarioCount > 1
        ? `${group} 组剩余 ${remaining.length} 场、共 ${scenarioCount} 种等权赛果组合，下方概率供参考。`
        : `${group} 组小组赛已全部结束。`,
    )
  }

  return insights.slice(0, 5)
}

export function analyzeGroup(
  group: GroupLetter,
  standings: TeamStanding[],
  matchResults: GroupMatchResult[],
): GroupAnalysis {
  const groupTeams = standings.filter((t) => t.group === group)
  const ids = new Set(groupTeams.map((t) => t.teamId))
  const groupMatchResults = matchResults.filter(
    (m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId),
  )
  const byId = teamById(groupTeams)
  const autoLocked = computeAutoLockedRanks(standings, matchResults)

  const currentRanked = rankGroupTeams(groupTeams, groupMatchResults)
  const rankById = new Map(currentRanked.map((t, i) => [t.teamId, (i + 1) as 1 | 2 | 3 | 4]))

  const remainingRaw = getRemainingFixtures(
    groupTeams.map((t) => t.teamId),
    groupMatchResults,
  )
  const { probabilities, scenarioCount } = computeRankProbabilities(
    groupTeams,
    groupMatchResults,
  )

  const playedMatches: MatchRecord[] = groupMatchResults.map((m) => {
    const home = byId.get(m.homeTeamId)!
    const away = byId.get(m.awayTeamId)!
    return {
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeCode: home.code,
      awayCode: away.code,
      homeFlag: home.flag,
      awayFlag: away.flag,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      scoreLabel: formatScore(m.homeGoals, m.awayGoals),
    }
  })

  const remainingFixtures: RemainingFixture[] = remainingRaw.map((f) => {
    const home = byId.get(f.homeTeamId)!
    const away = byId.get(f.awayTeamId)!
    return {
      homeTeamId: f.homeTeamId,
      awayTeamId: f.awayTeamId,
      homeCode: home.code,
      awayCode: away.code,
      homeFlag: home.flag,
      awayFlag: away.flag,
      homeName: home.name,
      awayName: away.name,
    }
  })

  const teams: TeamAnalysis[] = groupTeams.map((t) => {
    const prob = probabilities[t.teamId]
    const { min, max } = computePointsRange(t, remainingRaw)
    const lockedRank = autoLocked[t.teamId]
    return {
      teamId: t.teamId,
      code: t.code,
      name: t.name,
      flag: t.flag,
      currentRank: rankById.get(t.teamId)!,
      points: t.points,
      gd: t.gd,
      played: t.played,
      pointsMin: min,
      pointsMax: max,
      rankProb: prob,
      top2Pct: prob[1] + prob[2],
      thirdPct: prob[3],
      outPct: prob[4],
      isRankLocked: lockedRank !== undefined,
      lockedRank,
      fifaRank: t.fifaRank,
    }
  })

  teams.sort((a, b) => a.currentRank - b.currentRank)

  const insights = buildInsights(group, teams, remainingFixtures, scenarioCount)
  const matchdays = buildGroupMatchdays(group, groupTeams, matchResults)
  const outlook = buildGroupOutlook(group, teams, matchdays)

  return {
    group,
    scenarioCount,
    playedMatches,
    remainingFixtures,
    matchdays,
    teams,
    insights,
    outlook,
  }
}
