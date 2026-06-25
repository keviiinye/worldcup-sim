import { buildR32Bracket } from './buildR32Bracket'
import { getMatchDef, KNOCKOUT_MATCHES } from './knockoutStructure'
import type {
  BracketResult,
  BracketSlot,
  GroupLetter,
  GroupMatchResult,
  KnockoutMatch,
  KnockoutParticipant,
  TeamStanding,
} from './types'

export function buildFullBracket(
  standings: TeamStanding[],
  options: {
    matchResults?: GroupMatchResult[]
    groupOrder?: Partial<Record<GroupLetter, string[]>>
    thirdPlaceOrder?: string[] | null
    winners?: Record<number, string>
  } = {},
): BracketResult {
  const base = buildR32Bracket(standings, options)
  const winners = options.winners ?? {}

  const r32ByNo = new Map(base.matches.map((m) => [m.matchNo, m]))

  function slotToParticipant(slot: BracketSlot): KnockoutParticipant {
    return {
      type: 'team',
      team: slot.team,
      label: slot.label,
      isThirdPlace: slot.kind === 'third',
    }
  }

  function winnerParticipant(sourceMatch: number): KnockoutParticipant {
    const winnerId = winners[sourceMatch]
    if (!winnerId) {
      return { type: 'winner', sourceMatch, label: `W${sourceMatch}` }
    }
    const source = resolveMatchTeams(sourceMatch)
    const team = source.find((t) => t?.teamId === winnerId)
    if (team) {
      return { type: 'team', team, label: team.code, isThirdPlace: false }
    }
    return { type: 'winner', sourceMatch, label: `W${sourceMatch}` }
  }

  function loserParticipant(sourceMatch: number): KnockoutParticipant {
    const winnerId = winners[sourceMatch]
    if (!winnerId) {
      return { type: 'loser', sourceMatch, label: `L${sourceMatch}` }
    }
    const source = resolveMatchTeams(sourceMatch)
    const loser = source.find((t) => t && t.teamId !== winnerId)
    if (loser) {
      return { type: 'team', team: loser, label: loser.code, isThirdPlace: false }
    }
    return { type: 'loser', sourceMatch, label: `L${sourceMatch}` }
  }

  function resolveMatchTeams(matchNo: number): (TeamStanding | undefined)[] {
    const r32 = r32ByNo.get(matchNo)
    if (r32) return [r32.home.team, r32.away.team]

    const def = getMatchDef(matchNo)
    if (!def) return [undefined, undefined]

    const home =
      def.home === 'TBD'
        ? undefined
        : resolveParticipantTeam(def.home, winners)
    const away =
      def.away === 'TBD'
        ? undefined
        : resolveParticipantTeam(def.away, winners)

    return [home, away]
  }

  function resolveParticipantTeam(
    source: number,
    winMap: Record<number, string>,
  ): TeamStanding | undefined {
    const winnerId = winMap[source]
    if (!winnerId) return undefined
    const [a, b] = resolveMatchTeams(source)
    return a?.teamId === winnerId ? a : b?.teamId === winnerId ? b : undefined
  }

  function resolveSide(
    source: number | 'TBD',
    side: 'home' | 'away',
    matchNo: number,
  ): KnockoutParticipant {
    if (matchNo === 103) {
      const src = source as number
      return side === 'home' ? loserParticipant(src) : loserParticipant(src)
    }
    if (source === 'TBD') {
      const r32 = r32ByNo.get(matchNo)
      if (!r32) return { type: 'empty', label: 'TBD' }
      return slotToParticipant(side === 'home' ? r32.home : r32.away)
    }
    return winnerParticipant(source)
  }

  const knockout: KnockoutMatch[] = KNOCKOUT_MATCHES.map((def) => {
    const home = resolveSide(def.home, 'home', def.matchNo)
    const away = resolveSide(def.away, 'away', def.matchNo)
    const winnerId = winners[def.matchNo]
    return {
      matchNo: def.matchNo,
      round: def.round,
      label: def.label,
      home,
      away,
      winnerId,
    }
  })

  const champion =
    winners[104]
      ? resolveParticipantTeam(104, winners) ?? null
      : null

  return { ...base, knockout, champion }
}

export function getMatchTeamIds(
  matchNo: number,
  bracket: BracketResult,
): string[] {
  const match = bracket.knockout.find((m) => m.matchNo === matchNo)
  if (!match) return []
  const ids: string[] = []
  if (match.home.type === 'team') ids.push(match.home.team.teamId)
  if (match.away.type === 'team') ids.push(match.away.team.teamId)
  return ids
}
