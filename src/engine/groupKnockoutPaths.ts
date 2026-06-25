import { lookupAnnexC } from './annexLookup'
import { R32_TEMPLATE } from './buildR32Bracket'
import { TOP_R32_ORDER } from './knockoutStructure'
import type { GroupLetter, ThirdPlaceEntry } from './types'

export type GroupRankKnockoutPath = {
  rank: 1 | 2 | 3 | 4
  status: 'r32' | 'third-race' | 'eliminated'
  matchNo?: number
  side?: 'home' | 'away'
  slotLabel?: string
  opponentLabel?: string
  opponentDesc: string
  summary: string
  bracketHalf?: 'top' | 'bottom'
  thirdRankAmong?: number
}

function describeFixedSlot(label: string): string {
  const rank = label.slice(0, -1)
  const group = label.slice(-1)
  if (rank === '3') return `${group}组第三名`
  return `${group}组第${rank}名`
}

function bracketHalf(matchNo: number): 'top' | 'bottom' {
  return (TOP_R32_ORDER as readonly number[]).includes(matchNo) ? 'top' : 'bottom'
}

function halfLabel(half: 'top' | 'bottom'): string {
  return half === 'top' ? '上半区' : '下半区'
}

export type FixedRankPath = {
  matchNo: number
  side: 'home' | 'away'
  opponentLabel: string
  opponentDesc: string
  bracketHalf: 'top' | 'bottom'
}

export function getFixedRankPath(group: GroupLetter, rank: 1 | 2): FixedRankPath | null {
  const slot = findFixedSlot(`${rank}${group}`)
  if (!slot) return null
  return {
    ...slot,
    bracketHalf: bracketHalf(slot.matchNo),
  }
}

function sideLabel(side: 'home' | 'away'): string {
  return side === 'home' ? '主场' : '客场'
}

function findFixedSlot(slotLabel: string) {
  for (const tmpl of R32_TEMPLATE) {
    if (tmpl.home === slotLabel) {
      const opponentLabel = tmpl.away
      const opponentDesc =
        opponentLabel === '3rd' ? '最佳第三名' : describeFixedSlot(opponentLabel)
      return {
        matchNo: tmpl.matchNo,
        side: 'home' as const,
        opponentLabel,
        opponentDesc,
      }
    }
    if (tmpl.away === slotLabel) {
      const opponentLabel = tmpl.home
      const opponentDesc =
        opponentLabel === '3rd' ? '最佳第三名' : describeFixedSlot(opponentLabel)
      return {
        matchNo: tmpl.matchNo,
        side: 'away' as const,
        opponentLabel,
        opponentDesc,
      }
    }
  }
  return null
}

function findThirdSlot(group: GroupLetter, annexSlots: Record<string, GroupLetter>) {
  for (const tmpl of R32_TEMPLATE) {
    if (!tmpl.thirdSlot) continue
    if (annexSlots[tmpl.thirdSlot] !== group) continue
    const side = tmpl.home === '3rd' ? ('home' as const) : ('away' as const)
    const opponentLabel = side === 'home' ? tmpl.away : tmpl.home
    return {
      matchNo: tmpl.matchNo,
      side,
      opponentLabel,
      opponentDesc: describeFixedSlot(opponentLabel),
    }
  }
  return null
}

export function getGroupKnockoutPaths(
  group: GroupLetter,
  advancingThirdGroups: GroupLetter[],
  thirdPlace: ThirdPlaceEntry[],
): GroupRankKnockoutPath[] {
  const annex = lookupAnnexC(advancingThirdGroups)
  const thirdEntry = thirdPlace.find((t) => t.group === group)
  const paths: GroupRankKnockoutPath[] = []

  const r1 = findFixedSlot(`1${group}`)
  if (r1) {
    const half = bracketHalf(r1.matchNo)
    paths.push({
      rank: 1,
      status: 'r32',
      slotLabel: `1${group}`,
      bracketHalf: half,
      ...r1,
      summary: `M${r1.matchNo} ${sideLabel(r1.side)} vs ${r1.opponentDesc} · ${halfLabel(half)}`,
    })
  }

  const r2 = findFixedSlot(`2${group}`)
  if (r2) {
    const half = bracketHalf(r2.matchNo)
    paths.push({
      rank: 2,
      status: 'r32',
      slotLabel: `2${group}`,
      bracketHalf: half,
      ...r2,
      summary: `M${r2.matchNo} ${sideLabel(r2.side)} vs ${r2.opponentDesc} · ${halfLabel(half)}`,
    })
  }

  if (thirdEntry?.qualified) {
    const r3 = findThirdSlot(group, annex.slots)
    if (r3) {
      const half = bracketHalf(r3.matchNo)
      paths.push({
        rank: 3,
        status: 'r32',
        slotLabel: `3${group}`,
        bracketHalf: half,
        ...r3,
        summary: `M${r3.matchNo} ${sideLabel(r3.side)} vs ${r3.opponentDesc} · ${halfLabel(half)}`,
      })
    }
  } else {
    const rankAmong = thirdEntry?.rankAmongThird
    paths.push({
      rank: 3,
      status: 'third-race',
      thirdRankAmong: rankAmong,
      opponentDesc: '',
      summary:
        rankAmong != null
          ? `争夺最佳第三名 · 第三名榜第 ${rankAmong} 位（未进前八则淘汰）`
          : '争夺最佳第三名 · 需进入第三名榜前八',
    })
  }

  paths.push({
    rank: 4,
    status: 'eliminated',
    opponentDesc: '',
    summary: '小组第四 · 淘汰',
  })

  return paths
}

export function getSlotHighlightRank(
  participantLabel: string | undefined,
  selectedGroup: GroupLetter | null,
): 1 | 2 | 3 | null {
  if (!selectedGroup || !participantLabel) return null
  const match = participantLabel.match(/^([123])([A-L])$/)
  if (!match) return null
  const [, rank, group] = match
  if (group !== selectedGroup) return null
  return Number(rank) as 1 | 2 | 3
}
