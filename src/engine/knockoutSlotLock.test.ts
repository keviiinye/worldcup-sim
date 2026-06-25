import { describe, expect, it } from 'vitest'
import { buildFullBracket } from './buildFullBracket'
import { computeAutoLockedRanks } from './rankLock'
import { areAllGroupStagesComplete, isKnockoutSlotLocked } from './knockoutSlotLock'
import { SNAPSHOT_MATCH_RESULTS, buildSnapshotStandings } from '../data/wc2026Snapshot'

describe('knockoutSlotLock', () => {
  const standings = buildSnapshotStandings()
  const autoLocked = computeAutoLockedRanks(standings, SNAPSHOT_MATCH_RESULTS)
  const bracket = buildFullBracket(standings, { matchResults: SNAPSHOT_MATCH_RESULTS })
  const ctx = {
    standings,
    matchResults: SNAPSHOT_MATCH_RESULTS,
    thirdPlace: bracket.thirdPlace,
  }

  it('detects incomplete group stage in snapshot', () => {
    expect(areAllGroupStagesComplete(standings, SNAPSHOT_MATCH_RESULTS)).toBe(false)
  })

  it('locks fixed slots for mathematically locked top-two teams', () => {
    expect(isKnockoutSlotLocked('mex', false, autoLocked, ctx)).toBe(true)
    expect(isKnockoutSlotLocked('usa', false, autoLocked, ctx)).toBe(true)
  })

  it('does not lock third-place teams while other groups remain', () => {
    expect(isKnockoutSlotLocked('kor', true, autoLocked, ctx)).toBe(false)
    expect(isKnockoutSlotLocked('bih', true, autoLocked, ctx)).toBe(false)
    expect(isKnockoutSlotLocked('sco', true, autoLocked, ctx)).toBe(false)
    expect(autoLocked.kor).toBe(3)
  })
})
