import { lookupAnnexC } from './annexLookup'
import { rankGroupTeams, rankThirdPlaceTeams } from './tiebreakers'
import type {
  BracketSlot,
  GroupLetter,
  GroupMatchResult,
  GroupResult,
  GroupStageResult,
  R32Match,
  TeamStanding,
  ThirdPlaceEntry,
} from './types'
import { GROUP_LETTERS } from './types'

export const R32_TEMPLATE: Array<{
  matchNo: number
  home: string
  away: string
  thirdSlot?: string
}> = [
  { matchNo: 73, home: '2A', away: '2B' },
  { matchNo: 74, home: '1E', away: '3rd', thirdSlot: '1E' },
  { matchNo: 75, home: '1F', away: '2C' },
  { matchNo: 76, home: '1C', away: '2F' },
  { matchNo: 77, home: '1I', away: '3rd', thirdSlot: '1I' },
  { matchNo: 78, home: '2E', away: '2I' },
  { matchNo: 79, home: '1A', away: '3rd', thirdSlot: '1A' },
  { matchNo: 80, home: '1L', away: '3rd', thirdSlot: '1L' },
  { matchNo: 81, home: '1D', away: '3rd', thirdSlot: '1D' },
  { matchNo: 82, home: '1G', away: '3rd', thirdSlot: '1G' },
  { matchNo: 83, home: '2K', away: '2L' },
  { matchNo: 84, home: '1H', away: '2J' },
  { matchNo: 85, home: '1B', away: '3rd', thirdSlot: '1B' },
  { matchNo: 86, home: '1J', away: '2H' },
  { matchNo: 87, home: '1K', away: '3rd', thirdSlot: '1K' },
  { matchNo: 88, home: '2D', away: '2G' },
]

function parseSlotLabel(label: string): { group: GroupLetter; rank: number } {
  const group = label.slice(-1) as GroupLetter
  const rank = parseInt(label[0], 10)
  return { group, rank }
}

function resolveFixedSlot(
  label: string,
  groupMap: Map<GroupLetter, TeamStanding[]>,
): BracketSlot {
  const { group, rank } = parseSlotLabel(label)
  const team = groupMap.get(group)![rank - 1]
  return { kind: 'fixed', label, team }
}

function resolveThirdSlot(
  sourceGroup: GroupLetter,
  thirdByGroup: Map<GroupLetter, TeamStanding>,
): BracketSlot {
  const team = thirdByGroup.get(sourceGroup)!
  return {
    kind: 'third',
    label: `3${sourceGroup}`,
    team,
    sourceGroup,
  }
}

export function buildR32Bracket(
  standings: TeamStanding[],
  options: {
    matchResults?: GroupMatchResult[]
    groupOrder?: Partial<Record<GroupLetter, string[]>>
    thirdPlaceOrder?: string[] | null
  } = {},
): GroupStageResult {
  const byGroup = new Map<GroupLetter, TeamStanding[]>()
  for (const g of GROUP_LETTERS) {
    byGroup.set(
      g,
      standings.filter((t) => t.group === g),
    )
  }

  const groups: GroupResult[] = GROUP_LETTERS.map((group) => {
    const groupTeams = byGroup.get(group)!
    const teams = rankGroupTeams(
      groupTeams,
      options.matchResults ?? [],
      options.groupOrder?.[group],
    )

    return {
      group,
      teams: teams.map((team, i) => ({
        ...team,
        rank: (i + 1) as 1 | 2 | 3 | 4,
      })),
    }
  })

  const groupMap = new Map<GroupLetter, TeamStanding[]>(
    groups.map((g) => [g.group, g.teams]),
  )

  const thirdPlaceRaw = groups.map((g) => g.teams[2])
  const thirdRanked = rankThirdPlaceTeams(thirdPlaceRaw, options.thirdPlaceOrder)
  const advancing = thirdRanked.slice(0, 8)
  const advancingGroups = advancing.map((t) => t.group).sort() as GroupLetter[]

  const annex = lookupAnnexC(advancingGroups)
  const thirdByGroup = new Map<GroupLetter, TeamStanding>(
    thirdRanked.map((t) => [t.group, t]),
  )

  const thirdPlace: ThirdPlaceEntry[] = thirdRanked.map((team, i) => ({
    ...team,
    rankAmongThird: i + 1,
    qualified: i < 8,
  }))

  const matches: R32Match[] = R32_TEMPLATE.map((tmpl) => {
    const home =
      tmpl.home === '3rd'
        ? resolveThirdSlot(annex.slots[tmpl.thirdSlot!], thirdByGroup)
        : resolveFixedSlot(tmpl.home, groupMap)

    const away =
      tmpl.away === '3rd'
        ? resolveThirdSlot(annex.slots[tmpl.thirdSlot!], thirdByGroup)
        : resolveFixedSlot(tmpl.away, groupMap)

    return { matchNo: tmpl.matchNo, home, away }
  })

  return {
    groups,
    thirdPlace,
    annexOption: annex.option,
    advancingThirdGroups: advancingGroups,
    matches,
  }
}

export function validateNoSameGroupInR32(matches: R32Match[]): boolean {
  return matches.every((m) => {
    const homeGroup = m.home.team.group
    const awayGroup = m.away.team.group
    return homeGroup !== awayGroup
  })
}
