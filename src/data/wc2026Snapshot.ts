import type { GroupMatchResult, TeamStanding } from '../engine/types'
import { createInitialStandings } from './draw'
import fifaRanks from './fifa-rankings.json'

/** 数据来源：Wikipedia / FIFA / ESPN，截至 2026-06-25 22:00 北京时间（A/B/C 组第三轮结束） */
export const SNAPSHOT_TIMEZONE = 'Asia/Shanghai'
export const SNAPSHOT_AS_OF = '2026-06-25T22:00:00+08:00'

export function formatSnapshotAsOf(iso = SNAPSHOT_AS_OF): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const stamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: SNAPSHOT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)

  return `${stamp} 北京时间 (UTC+8)`
}

type TeamStats = {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

export const SNAPSHOT_STATS: Record<string, TeamStats> = {
  // Group A
  mex: { played: 3, won: 3, drawn: 0, lost: 0, gf: 6, ga: 0, points: 9 },
  rsa: { played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, points: 4 },
  kor: { played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 3, points: 3 },
  cze: { played: 3, won: 0, drawn: 1, lost: 2, gf: 2, ga: 6, points: 1 },
  // Group B
  sui: { played: 3, won: 2, drawn: 1, lost: 0, gf: 7, ga: 3, points: 7 },
  can: { played: 3, won: 1, drawn: 1, lost: 1, gf: 7, ga: 3, points: 4 },
  bih: { played: 3, won: 1, drawn: 1, lost: 1, gf: 5, ga: 6, points: 4 },
  qat: { played: 3, won: 0, drawn: 1, lost: 2, gf: 2, ga: 10, points: 1 },
  // Group C
  bra: { played: 3, won: 2, drawn: 1, lost: 0, gf: 7, ga: 1, points: 7 },
  mar: { played: 3, won: 2, drawn: 1, lost: 0, gf: 6, ga: 3, points: 7 },
  sco: { played: 3, won: 1, drawn: 0, lost: 2, gf: 1, ga: 4, points: 3 },
  hai: { played: 3, won: 0, drawn: 0, lost: 3, gf: 2, ga: 8, points: 0 },
  // Group D
  usa: { played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, points: 6 },
  aus: { played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, points: 3 },
  par: { played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 4, points: 3 },
  tur: { played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 3, points: 0 },
  // Group E
  ger: { played: 2, won: 2, drawn: 0, lost: 0, gf: 9, ga: 2, points: 6 },
  civ: { played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, points: 3 },
  ecu: { played: 2, won: 0, drawn: 1, lost: 1, gf: 0, ga: 1, points: 1 },
  cuw: { played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 7, points: 1 },
  // Group F
  ned: { played: 2, won: 1, drawn: 1, lost: 0, gf: 7, ga: 3, points: 4 },
  jpn: { played: 2, won: 1, drawn: 1, lost: 0, gf: 6, ga: 2, points: 4 },
  swe: { played: 2, won: 1, drawn: 0, lost: 1, gf: 6, ga: 6, points: 3 },
  tun: { played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 9, points: 0 },
  // Group G
  egy: { played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, points: 4 },
  irn: { played: 2, won: 0, drawn: 2, lost: 0, gf: 2, ga: 2, points: 2 },
  bel: { played: 2, won: 0, drawn: 2, lost: 0, gf: 1, ga: 1, points: 2 },
  nzl: { played: 2, won: 0, drawn: 1, lost: 1, gf: 3, ga: 5, points: 1 },
  // Group H
  esp: { played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 0, points: 4 },
  uru: { played: 2, won: 0, drawn: 2, lost: 0, gf: 3, ga: 3, points: 2 },
  cpv: { played: 2, won: 0, drawn: 2, lost: 0, gf: 2, ga: 2, points: 2 },
  ksa: { played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 5, points: 1 },
  // Group I
  fra: { played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, points: 6 },
  nor: { played: 2, won: 2, drawn: 0, lost: 0, gf: 7, ga: 3, points: 6 },
  sen: { played: 2, won: 0, drawn: 0, lost: 2, gf: 3, ga: 6, points: 0 },
  irq: { played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 7, points: 0 },
  // Group J
  arg: { played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 0, points: 6 },
  aut: { played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 3, points: 3 },
  alg: { played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 4, points: 3 },
  jor: { played: 2, won: 0, drawn: 0, lost: 2, gf: 2, ga: 5, points: 0 },
  // Group K
  col: { played: 2, won: 2, drawn: 0, lost: 0, gf: 4, ga: 1, points: 6 },
  por: { played: 2, won: 1, drawn: 1, lost: 0, gf: 6, ga: 1, points: 4 },
  cod: { played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 2, points: 1 },
  uzb: { played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 8, points: 0 },
  // Group L
  eng: { played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, points: 4 },
  gha: { played: 2, won: 1, drawn: 1, lost: 0, gf: 1, ga: 0, points: 4 },
  cro: { played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 4, points: 3 },
  pan: { played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 2, points: 0 },
}

export const SNAPSHOT_MATCH_RESULTS: GroupMatchResult[] = [
  // A
  { homeTeamId: 'mex', awayTeamId: 'rsa', homeGoals: 2, awayGoals: 0 },
  { homeTeamId: 'kor', awayTeamId: 'cze', homeGoals: 2, awayGoals: 1 },
  { homeTeamId: 'cze', awayTeamId: 'rsa', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'mex', awayTeamId: 'kor', homeGoals: 1, awayGoals: 0 },
  // B
  { homeTeamId: 'can', awayTeamId: 'bih', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'qat', awayTeamId: 'sui', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'sui', awayTeamId: 'bih', homeGoals: 4, awayGoals: 1 },
  { homeTeamId: 'can', awayTeamId: 'qat', homeGoals: 6, awayGoals: 0 },
  // C
  { homeTeamId: 'bra', awayTeamId: 'mar', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'hai', awayTeamId: 'sco', homeGoals: 0, awayGoals: 1 },
  { homeTeamId: 'sco', awayTeamId: 'mar', homeGoals: 0, awayGoals: 1 },
  { homeTeamId: 'bra', awayTeamId: 'hai', homeGoals: 3, awayGoals: 0 },
  // D
  { homeTeamId: 'usa', awayTeamId: 'par', homeGoals: 4, awayGoals: 1 },
  { homeTeamId: 'aus', awayTeamId: 'tur', homeGoals: 2, awayGoals: 0 },
  { homeTeamId: 'usa', awayTeamId: 'aus', homeGoals: 2, awayGoals: 0 },
  { homeTeamId: 'tur', awayTeamId: 'par', homeGoals: 0, awayGoals: 1 },
  // E
  { homeTeamId: 'ger', awayTeamId: 'cuw', homeGoals: 7, awayGoals: 1 },
  { homeTeamId: 'civ', awayTeamId: 'ecu', homeGoals: 1, awayGoals: 0 },
  { homeTeamId: 'ger', awayTeamId: 'civ', homeGoals: 2, awayGoals: 1 },
  { homeTeamId: 'ecu', awayTeamId: 'cuw', homeGoals: 0, awayGoals: 0 },
  // F
  { homeTeamId: 'ned', awayTeamId: 'jpn', homeGoals: 2, awayGoals: 2 },
  { homeTeamId: 'swe', awayTeamId: 'tun', homeGoals: 5, awayGoals: 1 },
  { homeTeamId: 'ned', awayTeamId: 'swe', homeGoals: 5, awayGoals: 1 },
  { homeTeamId: 'tun', awayTeamId: 'jpn', homeGoals: 0, awayGoals: 4 },
  // G
  { homeTeamId: 'bel', awayTeamId: 'egy', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'irn', awayTeamId: 'nzl', homeGoals: 2, awayGoals: 2 },
  { homeTeamId: 'bel', awayTeamId: 'irn', homeGoals: 0, awayGoals: 0 },
  { homeTeamId: 'nzl', awayTeamId: 'egy', homeGoals: 1, awayGoals: 3 },
  // H
  { homeTeamId: 'esp', awayTeamId: 'cpv', homeGoals: 0, awayGoals: 0 },
  { homeTeamId: 'ksa', awayTeamId: 'uru', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'esp', awayTeamId: 'ksa', homeGoals: 4, awayGoals: 0 },
  { homeTeamId: 'uru', awayTeamId: 'cpv', homeGoals: 2, awayGoals: 2 },
  // I
  { homeTeamId: 'fra', awayTeamId: 'sen', homeGoals: 3, awayGoals: 1 },
  { homeTeamId: 'irq', awayTeamId: 'nor', homeGoals: 1, awayGoals: 4 },
  { homeTeamId: 'fra', awayTeamId: 'irq', homeGoals: 3, awayGoals: 0 },
  { homeTeamId: 'nor', awayTeamId: 'sen', homeGoals: 3, awayGoals: 2 },
  // J
  { homeTeamId: 'arg', awayTeamId: 'alg', homeGoals: 3, awayGoals: 0 },
  { homeTeamId: 'aut', awayTeamId: 'jor', homeGoals: 3, awayGoals: 1 },
  { homeTeamId: 'arg', awayTeamId: 'aut', homeGoals: 2, awayGoals: 0 },
  { homeTeamId: 'jor', awayTeamId: 'alg', homeGoals: 1, awayGoals: 2 },
  // K
  { homeTeamId: 'por', awayTeamId: 'cod', homeGoals: 1, awayGoals: 1 },
  { homeTeamId: 'uzb', awayTeamId: 'col', homeGoals: 1, awayGoals: 3 },
  { homeTeamId: 'por', awayTeamId: 'uzb', homeGoals: 5, awayGoals: 0 },
  { homeTeamId: 'col', awayTeamId: 'cod', homeGoals: 1, awayGoals: 0 },
  // L
  { homeTeamId: 'eng', awayTeamId: 'cro', homeGoals: 4, awayGoals: 2 },
  { homeTeamId: 'gha', awayTeamId: 'pan', homeGoals: 1, awayGoals: 0 },
  { homeTeamId: 'eng', awayTeamId: 'gha', homeGoals: 0, awayGoals: 0 },
  { homeTeamId: 'pan', awayTeamId: 'cro', homeGoals: 0, awayGoals: 1 },
  // A — MD3
  { homeTeamId: 'mex', awayTeamId: 'cze', homeGoals: 3, awayGoals: 0 },
  { homeTeamId: 'rsa', awayTeamId: 'kor', homeGoals: 1, awayGoals: 0 },
  // B — MD3
  { homeTeamId: 'can', awayTeamId: 'sui', homeGoals: 1, awayGoals: 2 },
  { homeTeamId: 'bih', awayTeamId: 'qat', homeGoals: 3, awayGoals: 1 },
  // C — MD3
  { homeTeamId: 'bra', awayTeamId: 'sco', homeGoals: 3, awayGoals: 0 },
  { homeTeamId: 'mar', awayTeamId: 'hai', homeGoals: 4, awayGoals: 2 },
]

export function buildSnapshotStandings(): TeamStanding[] {
  const base = createInitialStandings(fifaRanks as Record<string, number>)
  return base.map((team) => {
    const stats = SNAPSHOT_STATS[team.teamId]
    if (!stats) return team
    return {
      ...team,
      played: stats.played,
      won: stats.won,
      drawn: stats.drawn,
      lost: stats.lost,
      gf: stats.gf,
      ga: stats.ga,
      gd: stats.gf - stats.ga,
      points: stats.points,
    }
  })
}
