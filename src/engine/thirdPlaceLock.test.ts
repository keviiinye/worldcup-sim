import { describe, expect, it } from 'vitest'
import type { TeamStanding } from './types'
import { isThirdPlaceStatsLocked, mergeThirdPlaceOrderWithLocks } from './thirdPlaceLock'

function mockThird(id: string, points: number, gd: number, played = 3): TeamStanding {
  const group = id[0] as TeamStanding['group']
  return {
    teamId: id,
    name: id,
    code: id,
    group,
    played,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd,
    points,
    fairPlayPoints: 0,
    fifaRank: 1,
  }
}

describe('isThirdPlaceStatsLocked', () => {
  it('locks when group stage is complete', () => {
    expect(isThirdPlaceStatsLocked(mockThird('A3', 3, 0, 3))).toBe(true)
    expect(isThirdPlaceStatsLocked(mockThird('B3', 3, 0, 2))).toBe(false)
  })
})

describe('mergeThirdPlaceOrderWithLocks', () => {
  const teams = [
    mockThird('A3', 6, 2),
    mockThird('B3', 4, 1),
    mockThird('C3', 3, 0, 2),
    mockThird('D3', 5, 1, 2),
  ]

  it('preserves order when already valid', () => {
    const order = ['A3', 'D3', 'B3', 'C3']
    expect(mergeThirdPlaceOrderWithLocks(order, teams)).toEqual(order)
  })

  it('corrects inverted locked teams after drag', () => {
    const order = ['B3', 'A3', 'D3', 'C3']
    expect(mergeThirdPlaceOrderWithLocks(order, teams)).toEqual(['A3', 'B3', 'D3', 'C3'])
  })

  it('allows unlocked teams to move freely', () => {
    const order = ['C3', 'A3', 'B3', 'D3']
    expect(mergeThirdPlaceOrderWithLocks(order, teams)).toEqual(['C3', 'A3', 'B3', 'D3'])
  })
})
