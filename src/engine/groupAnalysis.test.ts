import { describe, it, expect } from 'vitest'
import { analyzeGroup } from './groupAnalysis'
import { buildSnapshotStandings, SNAPSHOT_MATCH_RESULTS } from '../data/wc2026Snapshot'

describe('analyzeGroup', () => {
  const standings = buildSnapshotStandings()

  it('returns all played matches for finished group A', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    expect(a.playedMatches).toHaveLength(6)
    expect(a.remainingFixtures).toHaveLength(0)
    expect(a.scenarioCount).toBe(1)
  })

  it('locks Mexico at rank 1 in group A', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    const mex = a.teams.find((t) => t.code === 'MEX')!
    expect(mex.isRankLocked).toBe(true)
    expect(mex.lockedRank).toBe(1)
    expect(mex.rankProb[1]).toBe(1)
  })

  it('probabilities sum to 1 per team', () => {
    const a = analyzeGroup('B', standings, SNAPSHOT_MATCH_RESULTS)
    for (const t of a.teams) {
      const sum = t.rankProb[1] + t.rankProb[2] + t.rankProb[3] + t.rankProb[4]
      expect(sum).toBeCloseTo(1, 5)
    }
  })

  it('generates insights for competitive groups', () => {
    const b = analyzeGroup('B', standings, SNAPSHOT_MATCH_RESULTS)
    expect(b.insights.length).toBeGreaterThan(0)
  })

  it('uses Chinese team names in insights', () => {
    const d = analyzeGroup('D', standings, SNAPSHOT_MATCH_RESULTS)
    expect(d.insights.some((line) => line.includes('美国'))).toBe(true)
    expect(d.insights.some((line) => line.includes('USA'))).toBe(false)
  })
})
