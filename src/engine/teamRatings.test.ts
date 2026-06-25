import { describe, expect, it } from 'vitest'
import { buildSnapshotStandings } from '../data/wc2026Snapshot'
import { computeTournamentTeamRatings } from './teamRatings'

describe('computeTournamentTeamRatings', () => {
  const standings = buildSnapshotStandings()

  it('returns attack, defense and overall scores in 40–95 range', () => {
    const ratings = computeTournamentTeamRatings(standings)
    for (const r of ratings.values()) {
      expect(r.attack).toBeGreaterThanOrEqual(40)
      expect(r.attack).toBeLessThanOrEqual(95)
      expect(r.defense).toBeGreaterThanOrEqual(40)
      expect(r.defense).toBeLessThanOrEqual(95)
      expect(r.overall).toBe(Math.round(r.attack * 0.5 + r.defense * 0.5))
    }
  })

  it('spreads scores across the full tournament pool', () => {
    const ratings = computeTournamentTeamRatings(standings)
    const attack = [...ratings.values()].map((r) => r.attack)
    expect(new Set(attack).size).toBeGreaterThanOrEqual(10)
    expect(Math.max(...attack) - Math.min(...attack)).toBeGreaterThanOrEqual(30)
  })

  it('rates elite teams above minnows', () => {
    const ratings = computeTournamentTeamRatings(standings)
    expect(ratings.get('esp')!.overall).toBeGreaterThan(ratings.get('nzl')!.overall)
  })

  it('rewards strong group-stage defense', () => {
    const ratings = computeTournamentTeamRatings(standings)
    expect(ratings.get('mex')!.defense).toBeGreaterThan(ratings.get('cze')!.defense)
  })
})
