import { useEffect, useRef, useState } from 'react'
import { SNAPSHOT_AS_OF } from '../data/wc2026Snapshot'
import { useBracketStore } from '../store/bracketStore'

type PanelMode = 'save' | 'saveAs' | 'rename' | null

export function DataSourceBar() {
  const resetToDefault = useBracketStore((s) => s.resetToDefault)
  const saveCurrentScheme = useBracketStore((s) => s.saveCurrentScheme)
  const saveSchemeAs = useBracketStore((s) => s.saveSchemeAs)
  const loadScheme = useBracketStore((s) => s.loadScheme)
  const renameScheme = useBracketStore((s) => s.renameScheme)
  const deleteScheme = useBracketStore((s) => s.deleteScheme)
  const schemes = useBracketStore((s) => s.schemes)
  const activeSchemeId = useBracketStore((s) => s.activeSchemeId)
  const dataSource = useBracketStore((s) => s.dataSource)
  const winners = useBracketStore((s) => s.winners)

  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>(null)
  const [nameDraft, setNameDraft] = useState('')

  const activeScheme = schemes.find((s) => s.id === activeSchemeId)
  const knockoutPicks = Object.keys(winners).length
  const isSimulating = dataSource === 'manual' || knockoutPicks > 0

  const triggerLabel = activeScheme?.name ?? (isSimulating ? '未保存模拟' : '默认排名')

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setPanelMode(null)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setPanelMode(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function closeMenu() {
    setOpen(false)
    setPanelMode(null)
  }

  function openPanel(mode: PanelMode) {
    if (mode === 'saveAs') {
      setNameDraft(activeScheme ? `${activeScheme.name} 副本` : `方案 ${schemes.length + 1}`)
    } else if (mode === 'save') {
      setNameDraft(`方案 ${schemes.length + 1}`)
    } else if (mode === 'rename' && activeScheme) {
      setNameDraft(activeScheme.name)
    }
    setPanelMode(mode)
  }

  function handleLoad(id: string | null) {
    if (id) loadScheme(id)
    else resetToDefault()
    closeMenu()
  }

  function handleQuickSave() {
    if (activeSchemeId) {
      saveCurrentScheme()
      closeMenu()
      return
    }
    openPanel('save')
  }

  function commitNameAction() {
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    if (panelMode === 'save') saveSchemeAs(trimmed)
    else if (panelMode === 'saveAs') saveSchemeAs(trimmed)
    else if (panelMode === 'rename' && activeSchemeId) renameScheme(activeSchemeId, trimmed)
    closeMenu()
  }

  function handleDelete() {
    if (!activeSchemeId || !activeScheme) return
    if (!window.confirm(`删除方案「${activeScheme.name}」？`)) return
    deleteScheme(activeSchemeId)
    closeMenu()
  }

  return (
    <header className="data-bar">
      <div className="data-status">
        <span className="status-dot snapshot" />
        <span>赛果快照 · {SNAPSHOT_AS_OF}</span>
        {isSimulating && !activeScheme && (
          <span className="source-tag muted-tag">有未保存改动</span>
        )}
      </div>

      <div className="data-actions">
        <div className="scheme-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`scheme-menu-trigger secondary ${open ? 'open' : ''}`}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => {
              setOpen((v) => !v)
              setPanelMode(null)
            }}
          >
            <span className="scheme-menu-trigger-label">方案</span>
            <span className="scheme-menu-trigger-value">{triggerLabel}</span>
            <span className="scheme-menu-chevron" aria-hidden="true" />
          </button>

          {open && (
            <div className="scheme-menu" role="menu">
              <p className="scheme-menu-heading">读取方案</p>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={!activeSchemeId}
                className={`scheme-menu-item ${!activeSchemeId ? 'active' : ''}`}
                onClick={() => handleLoad(null)}
              >
                默认（快照排名）
              </button>
              {schemes.length === 0 ? (
                <p className="scheme-menu-empty">暂无已存方案</p>
              ) : (
                schemes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={s.id === activeSchemeId}
                    className={`scheme-menu-item ${s.id === activeSchemeId ? 'active' : ''}`}
                    onClick={() => handleLoad(s.id)}
                  >
                    {s.name}
                  </button>
                ))
              )}

              <div className="scheme-menu-divider" />

              <p className="scheme-menu-heading">保存与管理</p>

              {panelMode ? (
                <div className="scheme-menu-form">
                  <input
                    className="scheme-menu-input"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="方案名称"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNameAction()
                    }}
                    autoFocus
                  />
                  <div className="scheme-menu-form-actions">
                    <button type="button" className="secondary" onClick={() => setPanelMode(null)}>
                      取消
                    </button>
                    <button type="button" onClick={commitNameAction}>
                      确定
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="scheme-menu-item action"
                    disabled={!isSimulating}
                    onClick={handleQuickSave}
                  >
                    {activeSchemeId ? '更新当前方案' : '保存为新方案…'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="scheme-menu-item action"
                    disabled={!isSimulating}
                    onClick={() => openPanel('saveAs')}
                  >
                    另存为…
                  </button>
                  {activeScheme && (
                    <button
                      type="button"
                      role="menuitem"
                      className="scheme-menu-item action"
                      onClick={() => openPanel('rename')}
                    >
                      重命名…
                    </button>
                  )}
                  {activeScheme && (
                    <button
                      type="button"
                      role="menuitem"
                      className="scheme-menu-item action danger"
                      onClick={handleDelete}
                    >
                      删除当前方案
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="scheme-menu-item action"
                    disabled={!isSimulating && !activeSchemeId}
                    onClick={() => {
                      resetToDefault()
                      closeMenu()
                    }}
                  >
                    恢复默认排名
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
