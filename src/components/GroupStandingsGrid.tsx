import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { GroupLetter, TeamStanding } from '../engine/types'
import type { TeamRank } from '../engine/tiebreakers'
import { useBracketStore } from '../store/bracketStore'

function mergeOrderWithLocks(
  proposedOrder: string[],
  autoLockedTeamRanks: Partial<Record<string, TeamRank>>,
): string[] {
  const locks = new Map<number, string>()
  for (const id of proposedOrder) {
    const rank = autoLockedTeamRanks[id]
    if (rank) locks.set(rank, id)
  }
  if (locks.size === 0) return proposedOrder

  const lockedIds = new Set(locks.values())
  const unlocked = proposedOrder.filter((id) => !lockedIds.has(id))
  const result: string[] = new Array(proposedOrder.length)
  for (const [rank, id] of locks) {
    result[rank - 1] = id
  }
  let ui = 0
  for (let i = 0; i < proposedOrder.length; i++) {
    if (!result[i]) result[i] = unlocked[ui++]
  }
  return result
}

import { selectGroupForAnalysis } from './RightSidebar'

function DragGrip() {
  return (
    <svg className="drag-grip" viewBox="0 0 6 10" aria-hidden="true">
      <circle cx="1.5" cy="2" r="1" fill="currentColor" />
      <circle cx="4.5" cy="2" r="1" fill="currentColor" />
      <circle cx="1.5" cy="5" r="1" fill="currentColor" />
      <circle cx="4.5" cy="5" r="1" fill="currentColor" />
      <circle cx="1.5" cy="8" r="1" fill="currentColor" />
      <circle cx="4.5" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

function SortableTeamRow({
  team,
  rank,
  isRankLocked,
}: {
  team: TeamStanding
  rank: TeamRank
  isRankLocked: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: team.teamId, disabled: isRankLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`team-row ${isRankLocked ? 'rank-locked' : 'rank-open'}`}
      title={isRankLocked ? `${team.name} · 顺位已锁定` : `${team.name} · 拖拽调整排名`}
      {...attributes}
      {...(isRankLocked ? {} : listeners)}
    >
      <span className="col-rank" aria-label={isRankLocked ? `第 ${rank} 名，顺位已锁定` : `第 ${rank} 名，可拖动`}>
        <span className="rank-status-mark">
          {isRankLocked ? (
            <span className="rank-lock-mark" aria-hidden="true">🔒</span>
          ) : (
            <span className="drag-handle" aria-hidden="true">
              <DragGrip />
            </span>
          )}
        </span>
        <span className="rank-num">{rank}</span>
      </span>
      <span className="col-team">
        <span className="flag">{team.flag ?? '🏳️'}</span>
        <span className="code">{team.code}</span>
      </span>
      <span className="col-pts">{team.points}</span>
      <span className="col-gd">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
    </div>
  )
}

function GroupCard({ group }: { group: GroupLetter }) {
  const bracket = useBracketStore((s) => s.bracket)
  const autoLockedTeamRanks = useBracketStore((s) => s.autoLockedTeamRanks)
  const selectedGroup = useBracketStore((s) => s.selectedGroup)
  const reorderGroup = useBracketStore((s) => s.reorderGroup)
  const setSelectedGroup = useBracketStore((s) => s.setSelectedGroup)

  const groupData = bracket.groups.find((g) => g.group === group)!
  const teamIds = groupData.teams.map((t) => t.teamId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = teamIds.indexOf(String(active.id))
    const newIndex = teamIds.indexOf(String(over.id))
    const next = [...teamIds]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    reorderGroup(group, mergeOrderWithLocks(next, autoLockedTeamRanks))
  }

  return (
    <div className={`group-card ${selectedGroup === group ? 'selected' : ''}`}>
      <div
        className="group-header group-select-trigger"
        role="button"
        tabIndex={0}
        onClick={() => selectGroupForAnalysis(group, selectedGroup, setSelectedGroup)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            selectGroupForAnalysis(group, selectedGroup, setSelectedGroup)
          }
        }}
        title={`查看 ${group} 组晋级分析`}
      >
        <h3>Group {group}</h3>
      </div>
      <div className="group-table">
        <div className="group-table-head">
          <span className="col-rank">#</span>
          <span className="col-team">队</span>
          <span className="col-pts">分</span>
          <span className="col-gd">净</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
            {groupData.teams.map((team, i) => {
              const rank = (i + 1) as TeamRank
              return (
                <SortableTeamRow
                  key={team.teamId}
                  team={team}
                  rank={rank}
                  isRankLocked={autoLockedTeamRanks[team.teamId] === rank}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

export function GroupStandingsGrid() {
  const groups = useBracketStore((s) => s.bracket.groups)

  return (
    <section className="panel group-panel">
      <h2>小组积分榜 (A–L)</h2>
      <p className="hint">点击组名查看晋级分析 · 拖动整行模拟排名 · 🔒 顺位已锁定</p>
      <div className="group-grid">
        {groups.map((g) => (
          <GroupCard key={g.group} group={g.group} />
        ))}
      </div>
    </section>
  )
}
