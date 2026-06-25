import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GroupStandingsGrid } from './GroupStandingsGrid'
import { RightSidebar } from './RightSidebar'

export function MainGrid() {
  const leftRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState<number | null>(null)

  useEffect(() => {
    const node = leftRef.current
    if (!node) return

    const sync = () => setPanelHeight(node.getBoundingClientRect().height)

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(node)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  return (
    <div
      className="main-grid"
      style={
        panelHeight != null
          ? ({ '--standings-panel-h': `${panelHeight}px` } as CSSProperties)
          : undefined
      }
    >
      <div ref={leftRef} className="main-grid-left">
        <GroupStandingsGrid />
      </div>
      <RightSidebar />
    </div>
  )
}
