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
import type { ThirdPlaceEntry } from '../engine/types'
import { useBracketStore } from '../store/bracketStore'

function SortableThirdRow({ entry }: { entry: ThirdPlaceEntry }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.teamId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`third-row ${entry.qualified ? 'qualified' : 'eliminated'}`}
      {...attributes}
      {...listeners}
    >
      <span className="rank">{entry.rankAmongThird}</span>
      <span className="flag">{entry.flag ?? '🏳️'}</span>
      <span className="name">{entry.name}</span>
      <span className="group-tag">3{entry.group}</span>
      <span className="stats">{entry.points}pts · {entry.gd >= 0 ? `+${entry.gd}` : entry.gd} GD</span>
      <span className="badge">{entry.qualified ? '出线' : '淘汰'}</span>
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
    reorderThirdPlace(next)
  }

  return (
    <div className="third-board-inner">
      <p className="hint">
        Annex C #{annexOption} · 出线: {advancing.join(', ')}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          {thirdPlace.map((entry) => (
            <SortableThirdRow key={entry.teamId} entry={entry} />
          ))}
        </SortableContext>
      </DndContext>
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
