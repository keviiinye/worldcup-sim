import { describe, expect, it } from 'vitest'
import { analyzeGroup } from './groupAnalysis'
import { buildGroupOutlook } from './groupOutlook'
import { buildSnapshotStandings, SNAPSHOT_MATCH_RESULTS } from '../data/wc2026Snapshot'

describe('buildGroupOutlook', () => {
  const standings = buildSnapshotStandings()

  it('covers remaining matchdays for group A', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    expect(a.outlook.length).toBeGreaterThan(0)
    expect(a.outlook.every((l) => l.startsWith('D3 ·'))).toBe(true)
    expect(a.outlook).toHaveLength(2)
  })

  it('mentions rotation for locked group winners', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    expect(a.outlook.some((l) => l.includes('墨西哥') && l.includes('轮换'))).toBe(true)
  })

  it('puts each remaining fixture on its own line', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    expect(a.outlook[0]).toMatch(/vs/)
    expect(a.outlook[1]).toMatch(/vs/)
    expect(a.outlook[0]).not.toEqual(a.outlook[1])
  })

  it('flags six-pointer dynamics in tight groups', () => {
    const b = analyzeGroup('B', standings, SNAPSHOT_MATCH_RESULTS)
    expect(
      b.outlook.some((l) => l.includes('六分战') || l.includes('出线概率') || l.includes('淘汰赛')),
    ).toBe(true)
  })

  it('returns finished message when no games left', () => {
    const a = analyzeGroup('A', standings, SNAPSHOT_MATCH_RESULTS)
    const finished = buildGroupOutlook(
      'A',
      a.teams,
      a.matchdays.map((d) => ({
        ...d,
        matches: d.matches.map((m) => ({ ...m, status: 'played' as const })),
      })),
    )
    expect(finished[0]).toContain('已全部结束')
  })
})
