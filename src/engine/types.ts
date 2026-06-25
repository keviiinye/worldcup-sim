export type GroupLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'

export const GROUP_LETTERS: GroupLetter[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
]

export type TeamStanding = {
  teamId: string
  name: string
  code: string
  flag?: string
  group: GroupLetter
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  fairPlayPoints: number
  fifaRank: number
}

export type GroupMatchResult = {
  homeTeamId: string
  awayTeamId: string
  homeGoals: number
  awayGoals: number
}

export type RankedTeam = TeamStanding & {
  rank: 1 | 2 | 3 | 4
}

export type GroupResult = {
  group: GroupLetter
  teams: RankedTeam[]
}

export type ThirdPlaceEntry = TeamStanding & {
  rankAmongThird: number
  qualified: boolean
}

export type BracketSlot =
  | { kind: 'fixed'; label: string; team: TeamStanding }
  | { kind: 'third'; label: string; team: TeamStanding; sourceGroup: GroupLetter }

export type R32Match = {
  matchNo: number
  home: BracketSlot
  away: BracketSlot
}

export type KnockoutRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'

export type KnockoutParticipant =
  | { type: 'team'; team: TeamStanding; label: string; isThirdPlace: boolean }
  | { type: 'winner'; sourceMatch: number; label: string }
  | { type: 'loser'; sourceMatch: number; label: string }
  | { type: 'empty'; label: string }

export type KnockoutMatch = {
  matchNo: number
  round: KnockoutRound
  label?: string
  home: KnockoutParticipant
  away: KnockoutParticipant
  winnerId?: string
}

export type AnnexCLookup = {
  option: number
  slots: Record<string, GroupLetter>
}

export type GroupStageResult = {
  groups: GroupResult[]
  thirdPlace: ThirdPlaceEntry[]
  annexOption: number
  advancingThirdGroups: GroupLetter[]
  matches: R32Match[]
}

export type BracketResult = GroupStageResult & {
  knockout: KnockoutMatch[]
  champion: TeamStanding | null
}

export type ManualOverrides = {
  lockedGroups: Set<GroupLetter>
  groupOrder: Partial<Record<GroupLetter, string[]>>
  thirdPlaceOrder: string[] | null
  thirdPlaceLocked: boolean
}
