import { useEffect, useState } from 'react'
import type { GroupLetter } from '../engine/types'
import { useBracketStore } from '../store/bracketStore'
import { GroupAnalysisBody, useGroupAnalysis } from './GroupAnalysisPanel'
import { SideCard } from './SideCard'
import { ThirdPlaceBoardContent } from './ThirdPlaceBoard'

type CardId = 'analysis' | 'third'

export function RightSidebar() {
  const selectedGroup = useBracketStore((s) => s.selectedGroup)
  const setThirdPlacePanelOpen = useBracketStore((s) => s.setThirdPlacePanelOpen)
  const analysis = useGroupAnalysis(selectedGroup)

  const [openCard, setOpenCard] = useState<CardId>('third')

  useEffect(() => {
    setOpenCard(selectedGroup ? 'analysis' : 'third')
  }, [selectedGroup])

  useEffect(() => {
    setThirdPlacePanelOpen(openCard === 'third')
  }, [openCard, setThirdPlacePanelOpen])

  function selectCard(id: CardId) {
    setOpenCard(id)
  }

  const analysisTitle = selectedGroup ? `${selectedGroup} 组分析` : '小组分析'
  const groupBadge = selectedGroup ? `Group ${selectedGroup}` : undefined

  return (
    <aside className="sidebar-stack">
      <SideCard
        title={analysisTitle}
        badge={groupBadge}
        hint={selectedGroup ? undefined : '点击左侧小组'}
        accent="gold"
        open={openCard === 'analysis'}
        onToggle={() => selectCard('analysis')}
        disabled={!selectedGroup}
      >
        {analysis && <GroupAnalysisBody analysis={analysis} />}
      </SideCard>

      <SideCard
        title="第三名出线"
        badge="12→8"
        accent="muted"
        open={openCard === 'third'}
        onToggle={() => selectCard('third')}
      >
        <ThirdPlaceBoardContent />
      </SideCard>
    </aside>
  )
}

export function selectGroupForAnalysis(
  group: GroupLetter,
  current: GroupLetter | null,
  select: (g: GroupLetter | null) => void,
): void {
  select(current === group ? null : group)
}
