import { teamNameZh } from '../data/teamNamesZh'
import type { TeamAnalysis } from './groupAnalysis'
import type { MatchdaySchedule } from './groupMatchdays'
import { getFixedRankPath } from './groupKnockoutPaths'
import type { GroupLetter } from './types'

function label(team: TeamAnalysis): string {
  return teamNameZh(team.teamId, team.name)
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function canStillFinish(team: TeamAnalysis, rank: 1 | 2 | 3): boolean {
  if (team.isRankLocked) return team.lockedRank === rank
  return team.rankProb[rank] >= 0.08
}

function rankPathPhrase(group: GroupLetter, rank: 1 | 2): string | null {
  const path = getFixedRankPath(group, rank)
  if (!path) return null
  const side = path.side === 'home' ? '主场' : '客场'
  return `小组第 ${rank} 名 → M${path.matchNo} ${side}对${path.opponentDesc}（${path.bracketHalf === 'top' ? '上半区' : '下半区'}）`
}

function bracketManipNote(team: TeamAnalysis, group: GroupLetter): string | null {
  if (team.top2Pct < 0.78) return null
  if (!canStillFinish(team, 1) || !canStillFinish(team, 2)) return null

  const r1 = getFixedRankPath(group, 1)
  const r2 = getFixedRankPath(group, 2)
  if (!r1 || !r2) return null

  const p1 = rankPathPhrase(group, 1)!
  const p2 = rankPathPhrase(group, 2)!
  const halfNote =
    r1.bracketHalf !== r2.bracketHalf
      ? '头名与次名分处不同半区，'
      : '头名与次名在同一半区，'

  if (team.top2Pct >= 0.92 && team.rankProb[1] >= 0.2 && team.rankProb[2] >= 0.15) {
    return `${halfNote}出线后落位差异为：${p1}；${p2}。末轮存在按淘汰赛路线控分甚至留力的讨论，但故意失分可能跌入第三名争夺甚至出局。`
  }

  if (team.top2Pct >= 0.85) {
    return `若提前确保前二，需留意 ${p1} 与 ${p2} 的差异，末轮战意可能受淘汰赛对阵影响。`
  }

  return null
}

function describeTeamOutlook(
  team: TeamAnalysis,
  opponent: TeamAnalysis,
  group: GroupLetter,
  allTeams: TeamAnalysis[],
): string {
  const manip = bracketManipNote(team, group)
  const oppLabel = label(opponent)
  const isSixPointer =
    team.top2Pct > 0.15 &&
    team.top2Pct < 1 &&
    opponent.top2Pct > 0.15 &&
    opponent.top2Pct < 1 &&
    !team.isRankLocked &&
    !opponent.isRankLocked

  if (team.isRankLocked && team.lockedRank === 4) {
    return '已确定出局，更可能以搅局者姿态出战，结果对其它队落位影响大于自身前景，一般不存在故意输平的动机。'
  }

  if (team.isRankLocked && team.lockedRank === 1) {
    const r2 = rankPathPhrase(group, 2)
    return r2
      ? `头名已锁定，余赛预计轮换留力；已无丢分压力，除非认为次名落位（${r2}）明显更优，否则缺乏主动输球动机。`
      : '头名已锁定，余赛预计轮换留力，无主动输球动机。'
  }

  if (team.isRankLocked && team.lockedRank === 2) {
    return '次席已锁定，末轮战意主要取决于是否帮同组球队争夺第三名，自身一般无需全力争胜。'
  }

  if (team.isRankLocked && team.lockedRank === 3) {
    return '第三名已锁定，两场重点刷净胜球与积分，争取在最佳第三名榜单中提升排序。'
  }

  if (team.outPct >= 0.88) {
    return '出线希望渺茫，更可能为荣誉或搅局而战，对排名控分动机很弱。'
  }

  if (team.top2Pct >= 0.92 && team.rankProb[1] >= 0.75) {
    return manip
      ? `大概率夺头名，末轮或以控盘和避免伤病为主。${manip}`
      : '大概率夺头名，末轮或以控盘和避免伤病为主，缺乏主动输球动机。'
  }

  if (manip) {
    return manip
  }

  if (team.top2Pct < 0.22 && team.thirdPct >= 0.35) {
    return `前两档希望不大（出线 ${pct(team.top2Pct)}），更现实目标是第三名并冲击最佳第三名出线。平局可接受，但需避免大败伤及净胜球。`
  }

  if (team.top2Pct < 0.22 && team.thirdPct < 0.25) {
    return `出线概率仅 ${pct(team.top2Pct)}，预计每场必争三分，几乎不存在故意留力或挑选落位的空间。`
  }

  if (isSixPointer) {
    return `与 ${oppLabel} 的六分战，直接决定出线形势（本场前出线概率 ${pct(team.top2Pct)}），预计全力以赴，无放水空间。`
  }

  if (team.top2Pct >= 0.55 && team.top2Pct < 1) {
    const r1 = rankPathPhrase(group, 1)
    return r1
      ? `仍在争出线（概率 ${pct(team.top2Pct)}），预计正常抢分；若最终夺头名则 ${r1}。`
      : `仍在争出线（概率 ${pct(team.top2Pct)}），预计正常抢分。`
  }

  const leader = allTeams.find((t) => t.currentRank === 1)
  if (leader && team.teamId !== leader.teamId && team.points + 3 < leader.points && team.top2Pct < 0.5) {
    return `积分落后 ${label(leader)}，本场更像追赶战，必须抢分，无挑选淘汰赛路线余裕。`
  }

  return `出线概率 ${pct(team.top2Pct)}，预计按正常强度争胜，暂无明显的控分挑位动机。`
}

function buildMatchOutlookLines(
  matchday: MatchdaySchedule,
  teams: TeamAnalysis[],
  group: GroupLetter,
): string[] {
  const upcoming = matchday.matches.filter((m) => m.status === 'upcoming')
  if (upcoming.length === 0) return []

  const byId = new Map(teams.map((t) => [t.teamId, t]))
  const lines: string[] = []

  for (const m of upcoming) {
    const home = byId.get(m.homeTeamId)!
    const away = byId.get(m.awayTeamId)!
    lines.push(
      `D${matchday.matchday} · ${label(home)} vs ${label(away)}：${label(home)}——${describeTeamOutlook(home, away, group, teams)}；${label(away)}——${describeTeamOutlook(away, home, group, teams)}`,
    )
  }

  return lines
}

/** 从各队视角生成余赛展望（含淘汰赛落位与战意/控分分析） */
export function buildGroupOutlook(
  group: GroupLetter,
  teams: TeamAnalysis[],
  matchdays: MatchdaySchedule[],
): string[] {
  const upcomingDays = matchdays.filter((d) => d.matches.some((m) => m.status === 'upcoming'))
  if (upcomingDays.length === 0) {
    return ['小组赛已全部结束，无余赛展望。']
  }

  const lines: string[] = []

  for (const day of upcomingDays) {
    lines.push(...buildMatchOutlookLines(day, teams, group))
  }

  return lines
}
