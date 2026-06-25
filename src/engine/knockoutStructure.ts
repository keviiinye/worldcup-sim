/** FIFA 2026 knockout bracket structure (Article 12.6–12.11) */

export type KnockoutRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'

export type KnockoutMatchDef = {
  matchNo: number
  round: KnockoutRound
  home: number | 'TBD'
  away: number | 'TBD'
  label?: string
}

/** Top half converges to M101; bottom half to M102 */
export const TOP_R32_ORDER = [73, 75, 74, 77, 83, 84, 81, 82] as const
export const BOTTOM_R32_ORDER = [76, 78, 79, 80, 86, 88, 85, 87] as const
export const TOP_R16_ORDER = [90, 89, 93, 94] as const
export const BOTTOM_R16_ORDER = [91, 92, 95, 96] as const
export const TOP_QF_ORDER = [97, 98] as const
export const BOTTOM_QF_ORDER = [99, 100] as const

export const KNOCKOUT_MATCHES: KnockoutMatchDef[] = [
  // R32 — filled from group stage
  { matchNo: 73, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 74, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 75, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 76, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 77, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 78, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 79, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 80, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 81, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 82, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 83, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 84, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 85, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 86, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 87, round: 'r32', home: 'TBD', away: 'TBD' },
  { matchNo: 88, round: 'r32', home: 'TBD', away: 'TBD' },
  // R16
  { matchNo: 89, round: 'r16', home: 74, away: 77 },
  { matchNo: 90, round: 'r16', home: 73, away: 75 },
  { matchNo: 91, round: 'r16', home: 76, away: 78 },
  { matchNo: 92, round: 'r16', home: 79, away: 80 },
  { matchNo: 93, round: 'r16', home: 83, away: 84 },
  { matchNo: 94, round: 'r16', home: 81, away: 82 },
  { matchNo: 95, round: 'r16', home: 86, away: 88 },
  { matchNo: 96, round: 'r16', home: 85, away: 87 },
  // QF
  { matchNo: 97, round: 'qf', home: 89, away: 90 },
  { matchNo: 98, round: 'qf', home: 93, away: 94 },
  { matchNo: 99, round: 'qf', home: 91, away: 92 },
  { matchNo: 100, round: 'qf', home: 95, away: 96 },
  // SF
  { matchNo: 101, round: 'sf', home: 97, away: 98 },
  { matchNo: 102, round: 'sf', home: 99, away: 100 },
  // 3rd place & Final
  { matchNo: 103, round: 'third', home: 101, away: 102, label: '季军战' },
  { matchNo: 104, round: 'final', home: 101, away: 102, label: '决赛' },
]

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: '32强',
  r16: '16强',
  qf: '8强',
  sf: '4强',
  final: '决赛',
  third: '季军',
}

export function getMatchDef(matchNo: number): KnockoutMatchDef | undefined {
  return KNOCKOUT_MATCHES.find((m) => m.matchNo === matchNo)
}
