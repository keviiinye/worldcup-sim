import { describe, expect, it } from 'vitest'
import { computeAutoLockedRanks } from './rankLock'
import { SNAPSHOT_MATCH_RESULTS, buildSnapshotStandings } from '../data/wc2026Snapshot'
import type { GroupMatchResult, TeamStanding } from './types'

function makeTeam(
  overrides: Partial<TeamStanding> & Pick<TeamStanding, 'teamId' | 'group'>,
): TeamStanding {
  return {
    name: overrides.teamId,
    code: overrides.teamId.toUpperCase(),
    played: 0,
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

describe('computeAutoLockedRanks', () => {
  it('locks all teams when every group match is played', () => {
    const teams = [
      makeTeam({ teamId: 'a', group: 'A', points: 9, gd: 4, gf: 5, played: 3 }),
      makeTeam({ teamId: 'b', group: 'A', points: 6, gd: 1, gf: 4, played: 3 }),
      makeTeam({ teamId: 'c', group: 'A', points: 3, gd: -1, gf: 2, played: 3 }),
      makeTeam({ teamId: 'd', group: 'A', points: 0, gd: -4, gf: 1, played: 3 }),
    ]
    const results: GroupMatchResult[] = [
      { homeTeamId: 'a', awayTeamId: 'd', homeGoals: 2, awayGoals: 0 },
      { homeTeamId: 'b', awayTeamId: 'c', homeGoals: 2, awayGoals: 1 },
      { homeTeamId: 'c', awayTeamId: 'd', homeGoals: 1, awayGoals: 1 },
      { homeTeamId: 'a', awayTeamId: 'b', homeGoals: 1, awayGoals: 0 },
      { homeTeamId: 'a', awayTeamId: 'c', homeGoals: 2, awayGoals: 0 },
      { homeTeamId: 'b', awayTeamId: 'd', homeGoals: 2, awayGoals: 1 },
    ]
    const locked = computeAutoLockedRanks(teams, results)
    expect(locked).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('locks eliminated team before final matchday', () => {
    const standings = buildSnapshotStandings()
    const locked = computeAutoLockedRanks(standings, SNAPSHOT_MATCH_RESULTS)
    expect(locked.tun).toBe(4)
    expect(locked.hai).toBe(4)
    expect(locked.jor).toBe(4)
  })

  it('does not lock Spain at first in Group H after two rounds', () => {
    const standings = buildSnapshotStandings()
    const locked = computeAutoLockedRanks(standings, SNAPSHOT_MATCH_RESULTS)
    expect(locked.esp).toBeUndefined()
  })
})
