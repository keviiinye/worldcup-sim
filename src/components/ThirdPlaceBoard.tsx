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
import { Fragment } from 'react'
import {
  isThirdPlaceStatsLocked,
  mergeThirdPlaceOrderWithLocks,
} from '../engine/thirdPlaceLock'
import type { ThirdPlaceEntry } from '../engine/types'
import { useBracketStore } from '../store/bracketStore'

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

function SortableThirdRow({ entry }: { entry: ThirdPlaceEntry }) {
  const statsLocked = isThirdPlaceStatsLocked(entry)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.teamId, disabled: statsLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const rowTitle = statsLocked
    ? `${entry.name} · 小组战绩已锁定 · 相对顺位不可越界`
    : `${entry.name} · 末轮未结束 · 拖拽模拟排名`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`third-row ${entry.qualified ? 'third-row--advancing' : 'third-row--out'} ${statsLocked ? 'third-row--stats-locked' : 'third-row--open'}`}
      title={rowTitle}
      {...attributes}
      {...(statsLocked ? {} : listeners)}
    >
      <span className="third-col-leading" aria-label={`第 ${entry.rankAmongThird} 名`}>
        <span className="rank-status-mark">
          {statsLocked ? (
            <span className="rank-lock-mark" aria-hidden="true">🔒</span>
          ) : (
            <span className="drag-handle" aria-hidden="true">
              <DragGrip />
            </span>
          )}
        </span>
        <span className="rank-num">{entry.rankAmongThird}</span>
      </span>
      <span className="third-col-group">{entry.group}</span>
      <span className="third-col-team">
        <span className="flag">{entry.flag ?? '🏳️'}</span>
        <span className="name">{entry.name}</span>
      </span>
      <span className="third-col-pts">{entry.points}</span>
      <span className="third-col-gd">{entry.gd >= 0 ? `+${entry.gd}` : entry.gd}</span>
      <span className={`third-status ${entry.qualified ? 'advancing' : 'out'}`}>
        {entry.qualified ? '晋级' : '出局'}
      </span>
    </div>
  )
}

export function ThirdPlaceBoardContent() {
  const thirdPlace = useBracketStore((s) => s.bracket.thirdPlace)
  const reorderThirdPlace = useBracketStore((s) => s.reorderThirdPlace)
  const annexOption = useBracketStore((s) => s.bracket.annexOption)
  const advancing = useBracketStore((s) => s.bracket.advancingThirdGroups)

  const teamIds = thirdPlace.map((t) => t.teamId)

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
    reorderThirdPlace(mergeThirdPlaceOrderWithLocks(next, thirdPlace))
  }

  return (
    <div className="third-board-inner">
      <p className="hint third-board-hint">
        Annex C #{annexOption} · 出线组: {advancing.join(', ')} · 🔒 末轮已踢完
      </p>
      <div className="third-table">
        <div className="third-table-head">
          <span className="third-col-leading" aria-hidden="true" />
          <span className="third-col-group">小组</span>
          <span className="third-col-team">球队</span>
          <span className="third-col-pts">积分</span>
          <span className="third-col-gd">净胜球</span>
          <span className="third-col-status">晋级情况</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
            {thirdPlace.map((entry) => (
              <Fragment key={entry.teamId}>
                {entry.rankAmongThird === 9 && (
                  <div className="third-cut-line" aria-hidden="true">
                    <span>晋级线 · 前 8 出线</span>
                  </div>
                )}
                <SortableThirdRow entry={entry} />
              </Fragment>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

/** @deprecated 使用 RightSidebar */
export function ThirdPlaceBoard() {
  return (
    <section className="panel third-panel">
      <ThirdPlaceBoardContent />
    </section>
  )
}
