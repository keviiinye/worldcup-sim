import { compareThirdPlace } from './tiebreakers'
import type { TeamStanding } from './types'

/** 小组末轮已结束，积分/净胜球等战绩数据不再变化 */
export function isThirdPlaceStatsLocked(team: TeamStanding): boolean {
  return team.played >= 3
}

/** 拖拽后校正：已锁定战绩的第三名之间须保持 tiebreak 固定相对顺序 */
export function mergeThirdPlaceOrderWithLocks(
  proposedOrder: string[],
  teams: TeamStanding[],
): string[] {
  const byId = new Map(teams.map((t) => [t.teamId, t]))
  const lockedSorted = proposedOrder
    .filter((id) => {
      const team = byId.get(id)
      return team && isThirdPlaceStatsLocked(team)
    })
    .sort((a, b) => compareThirdPlace(byId.get(a)!, byId.get(b)!))

  if (lockedSorted.length <= 1) return proposedOrder

  const order = [...proposedOrder]
  for (let i = 0; i < lockedSorted.length; i++) {
    for (let j = i + 1; j < lockedSorted.length; j++) {
      const better = lockedSorted[i]
      const worse = lockedSorted[j]
      const betterIdx = order.indexOf(better)
      const worseIdx = order.indexOf(worse)
      if (betterIdx > worseIdx) {
        order.splice(betterIdx, 1)
        order.splice(worseIdx, 0, better)
      }
    }
  }
  return order
}
