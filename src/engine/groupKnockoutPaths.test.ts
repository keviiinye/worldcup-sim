import { describe, expect, it } from 'vitest'
import { lookupAnnexC } from './annexLookup'
import { R32_TEMPLATE } from './buildR32Bracket'
import { getGroupKnockoutPaths, getParticipantHighlightRank, getSlotHighlightRank } from './groupKnockoutPaths'
import type { GroupLetter, ThirdPlaceEntry } from './types'
import { GROUP_LETTERS } from './types'

function mockThirdPlace(): ThirdPlaceEntry[] {
  return GROUP_LETTERS.map((group, i) => ({
    teamId: `${group}3`,
    name: `${group} Third`,
    code: `${group}3`,
    group,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 3 - i * 0.1,
    fairPlayPoints: 0,
    fifaRank: i + 1,
    rankAmongThird: i + 1,
    qualified: i < 8,
  }))
}

describe('getGroupKnockoutPaths', () => {
  it('maps fixed first and second place slots', () => {
    const paths = getGroupKnockoutPaths('A', GROUP_LETTERS.slice(0, 8), mockThirdPlace())
    const r1 = paths.find((p) => p.rank === 1)!
    const r2 = paths.find((p) => p.rank === 2)!

    expect(r1.matchNo).toBe(79)
    expect(r1.side).toBe('home')
    expect(r1.opponentDesc).toBe('最佳第三名')
    expect(r1.bracketHalf).toBe('bottom')

    expect(r2.matchNo).toBe(73)
    expect(r2.side).toBe('home')
    expect(r2.opponentDesc).toBe('B组第2名')
    expect(r2.bracketHalf).toBe('top')
  })

  it('maps qualified third place via annex', () => {
    const thirdPlace = mockThirdPlace()
    const advancing = thirdPlace.filter((t) => t.qualified).map((t) => t.group)
    const annex = lookupAnnexC(advancing)
    const tmpl = R32_TEMPLATE.find(
      (t) => t.thirdSlot && annex.slots[t.thirdSlot] === 'A',
    )!
    const paths = getGroupKnockoutPaths('A', advancing, thirdPlace)
    const r3 = paths.find((p) => p.rank === 3)!

    expect(r3.status).toBe('r32')
    expect(r3.matchNo).toBe(tmpl.matchNo)
    expect(r3.side).toBe(tmpl.home === '3rd' ? 'home' : 'away')
  })

  it('describes unqualified third as third-race', () => {
    const thirdPlace = mockThirdPlace()
    const advancing = thirdPlace.filter((t) => t.qualified).map((t) => t.group)
    const paths = getGroupKnockoutPaths('L', advancing, thirdPlace)
    const r3 = paths.find((p) => p.rank === 3)!

    expect(r3.status).toBe('third-race')
    expect(r3.summary).toContain('第 12 位')
  })
})

describe('getSlotHighlightRank', () => {
  it('returns rank for matching group labels', () => {
    expect(getSlotHighlightRank('1A', 'A')).toBe(1)
    expect(getSlotHighlightRank('2B', 'B')).toBe(2)
    expect(getSlotHighlightRank('3C', 'C')).toBe(3)
    expect(getSlotHighlightRank('1A', 'B')).toBeNull()
    expect(getSlotHighlightRank(undefined, 'A')).toBeNull()
  })
})

describe('getParticipantHighlightRank', () => {
  it('highlights advancing third place from selected group', () => {
    expect(
      getParticipantHighlightRank(
        { label: '3rd', isThirdPlace: true, team: { group: 'A' } },
        'A',
      ),
    ).toBe(3)
    expect(
      getParticipantHighlightRank(
        { label: '3rd', isThirdPlace: true, team: { group: 'B' } },
        'A',
      ),
    ).toBeNull()
  })
})
