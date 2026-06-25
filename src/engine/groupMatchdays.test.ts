import { describe, it, expect } from 'vitest'
import { buildGroupMatchdays } from './groupMatchdays'
import { buildSnapshotStandings, SNAPSHOT_MATCH_RESULTS } from '../data/wc2026Snapshot'

describe('buildGroupMatchdays', () => {
  const standings = buildSnapshotStandings()

  it('returns 3 matchdays with 2 fixtures each', () => {
    const teams = standings.filter((t) => t.group === 'A')
    const days = buildGroupMatchdays('A', teams, SNAPSHOT_MATCH_RESULTS)
    expect(days).toHaveLength(3)
    expect(days.every((d) => d.matches.length === 2)).toBe(true)
  })

  it('marks first two days played and third upcoming for group A', () => {
    const teams = standings.filter((t) => t.group === 'A')
    const days = buildGroupMatchdays('A', teams, SNAPSHOT_MATCH_RESULTS)
    expect(days[0].matches.every((m) => m.status === 'played')).toBe(true)
    expect(days[1].matches.every((m) => m.status === 'played')).toBe(true)
    expect(days[2].matches.every((m) => m.status === 'upcoming')).toBe(true)
  })

  it('uses actual home/away from results', () => {
    const teams = standings.filter((t) => t.group === 'A')
    const days = buildGroupMatchdays('A', teams, SNAPSHOT_MATCH_RESULTS)
    const mexKor = days[1].matches.find((m) => m.homeCode === 'MEX' && m.awayCode === 'KOR')
    expect(mexKor?.scoreLabel).toBe('1–0')
  })
})
