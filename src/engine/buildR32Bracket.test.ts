import { describe, expect, it } from 'vitest'
import { getAllAnnexKeys, getAnnexRowCount, lookupAnnexC } from './annexLookup'
import { buildR32Bracket, validateNoSameGroupInR32 } from './buildR32Bracket'
import { compareThirdPlace, applyTeamRankLocks, rankGroupTeams } from './tiebreakers'
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

function makeFullStandings(
  groupStats: Partial<Record<GroupLetter, Partial<TeamStanding>[]>>,
): TeamStanding[] {
  const result: TeamStanding[] = []
  for (const group of GROUP_LETTERS) {
    const stats = groupStats[group] ?? [
      { teamId: `${group}1`, points: 6, gd: 2, gf: 4 },
      { teamId: `${group}2`, points: 4, gd: 0, gf: 2 },
      { teamId: `${group}3`, points: 2, gd: -1, gf: 1 },
      { teamId: `${group}4`, points: 0, gd: -1, gf: 0 },
    ]
    stats.forEach((s, i) => {
      result.push(
        makeTeam({
          teamId: s.teamId ?? `${group}${i + 1}`,
          group,
          points: s.points ?? 0,
          gd: s.gd ?? 0,
          gf: s.gf ?? 0,
          ga: s.ga ?? 0,
          fairPlayPoints: s.fairPlayPoints ?? 0,
          fifaRank: s.fifaRank ?? i + 1,
        }),
      )
    })
  }
  return result
}

describe('Annex C lookup', () => {
  it('has exactly 495 rows', () => {
    expect(getAnnexRowCount()).toBe(495)
    expect(getAllAnnexKeys()).toHaveLength(495)
  })

  it('matches PDF row 1: EJIFHGLK', () => {
    const entry = lookupAnnexC(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
    expect(entry.option).toBe(1)
    expect(entry.slots).toEqual({
      '1A': 'E',
      '1B': 'J',
      '1D': 'I',
      '1E': 'F',
      '1G': 'H',
      '1I': 'G',
      '1K': 'L',
      '1L': 'K',
    })
  })

  it('covers all C(12,8) combinations uniquely', () => {
    const keys = getAllAnnexKeys()
    expect(new Set(keys).size).toBe(495)
    for (const key of keys) {
      expect(key).toHaveLength(8)
      expect(lookupAnnexC(key.split('') as GroupLetter[])).toBeTruthy()
    }
  })
})

describe('Third place ranking', () => {
  it('ranks by points then GD then GF', () => {
    const a = makeTeam({ teamId: 'a', group: 'A', points: 4, gd: 1, gf: 3 })
    const b = makeTeam({ teamId: 'b', group: 'B', points: 4, gd: 0, gf: 4 })
    expect(compareThirdPlace(a, b)).toBeLessThan(0)
  })
})

describe('Group ranking', () => {
  it('sorts by points descending', () => {
    const teams = [
      makeTeam({ teamId: 'a', group: 'A', points: 3 }),
      makeTeam({ teamId: 'b', group: 'A', points: 6 }),
    ]
    const ranked = rankGroupTeams(teams)
    expect(ranked[0].teamId).toBe('b')
  })

  it('keeps locked teams at fixed ranks', () => {
    const teams = [
      makeTeam({ teamId: 'a', group: 'A', points: 6, gd: 2 }),
      makeTeam({ teamId: 'b', group: 'A', points: 4, gd: 1 }),
      makeTeam({ teamId: 'c', group: 'A', points: 2, gd: -1 }),
      makeTeam({ teamId: 'd', group: 'A', points: 0, gd: -2 }),
    ]
    const auto = rankGroupTeams(teams)
    const locked = applyTeamRankLocks(auto, { c: 2 })
    expect(locked.map((t) => t.teamId)).toEqual(['a', 'c', 'b', 'd'])
  })
})

describe('R32 bracket builder', () => {
  it('produces 16 matches', () => {
    const bracket = buildR32Bracket(makeFullStandings({}))
    expect(bracket.matches).toHaveLength(16)
  })

  it('has no same-group matchups in R32', () => {
    const bracket = buildR32Bracket(makeFullStandings({}))
    expect(validateNoSameGroupInR32(bracket.matches)).toBe(true)
  })

  it('assigns annex option for known third-place combination', () => {
    const bracket = buildR32Bracket(makeFullStandings({}))
    expect(bracket.annexOption).toBeGreaterThanOrEqual(1)
    expect(bracket.annexOption).toBeLessThanOrEqual(495)
    expect(bracket.advancingThirdGroups).toHaveLength(8)
  })

  it('uses manual third place order when provided', () => {
    const standings = makeFullStandings({})
    const thirdIds = GROUP_LETTERS.map((g) => `${g}3`)
    const reversed = [...thirdIds].reverse()
    const bracket = buildR32Bracket(standings, { thirdPlaceOrder: reversed })
    expect(bracket.thirdPlace[0].teamId).toBe('L3')
  })
})
