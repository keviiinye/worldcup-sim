import { describe, expect, it } from 'vitest'
import { buildFullBracket } from './buildFullBracket'
import { buildR32Bracket, validateNoSameGroupInR32 } from './buildR32Bracket'
import type { GroupLetter, TeamStanding } from './types'
import { GROUP_LETTERS } from './types'

function makeTeam(
  overrides: Partial<TeamStanding> & Pick<TeamStanding, 'teamId' | 'group'>,
): TeamStanding {
  return {
    name: overrides.teamId,
    code: overrides.teamId.toUpperCase(),
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    fairPlayPoints: 0,
    fifaRank: 999,
    ...overrides,
  }
}

function makeFullStandings(): TeamStanding[] {
  const result: TeamStanding[] = []
  for (const group of GROUP_LETTERS) {
    const stats = [
      { teamId: `${group}1`, points: 6, gd: 2, gf: 4 },
      { teamId: `${group}2`, points: 4, gd: 0, gf: 2 },
      { teamId: `${group}3`, points: 2, gd: -1, gf: 1 },
      { teamId: `${group}4`, points: 0, gd: -1, gf: 0 },
    ]
    stats.forEach((s, i) => {
      result.push(makeTeam({ ...s, group, fifaRank: i + 1 }))
    })
  }
  return result
}

describe('Full knockout bracket', () => {
  it('builds all 32 knockout matches', () => {
    const bracket = buildFullBracket(makeFullStandings())
    expect(bracket.knockout).toHaveLength(32)
    expect(bracket.knockout.filter((m) => m.round === 'r32')).toHaveLength(16)
    expect(bracket.knockout.filter((m) => m.round === 'r16')).toHaveLength(8)
    expect(bracket.knockout.filter((m) => m.round === 'qf')).toHaveLength(4)
    expect(bracket.knockout.filter((m) => m.round === 'sf')).toHaveLength(2)
    expect(bracket.knockout.find((m) => m.matchNo === 104)?.round).toBe('final')
  })

  it('propagates winners through to final', () => {
    const standings = makeFullStandings()
    const r32 = buildR32Bracket(standings)
    const m73 = r32.matches.find((m) => m.matchNo === 73)!
    const winners: Record<number, string> = {
      73: m73.home.team.teamId,
      75: r32.matches.find((m) => m.matchNo === 75)!.home.team.teamId,
    }
    const bracket = buildFullBracket(standings, { winners })
    const m90 = bracket.knockout.find((m) => m.matchNo === 90)!
    expect(m90.home.type).toBe('team')
    if (m90.home.type === 'team') {
      expect(m90.home.team.teamId).toBe(m73.home.team.teamId)
    }
  })

  it('R32 has no same-group matchups', () => {
    const bracket = buildFullBracket(makeFullStandings())
    const r32 = bracket.knockout.filter((m) => m.round === 'r32')
    expect(
      validateNoSameGroupInR32(
        r32.map((m) => ({
          matchNo: m.matchNo,
          home: m.home.type === 'team'
            ? { kind: 'fixed' as const, label: m.home.label, team: m.home.team }
            : { kind: 'fixed' as const, label: '', team: makeTeam({ teamId: 'x', group: 'A' }) },
          away: m.away.type === 'team'
            ? { kind: 'fixed' as const, label: m.away.label, team: m.away.team }
            : { kind: 'fixed' as const, label: '', team: makeTeam({ teamId: 'y', group: 'B' }) },
        })),
      ),
    ).toBe(true)
  })
})
