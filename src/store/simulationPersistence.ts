import type { GroupLetter, TeamStanding } from '../engine/types'

const LEGACY_KEY = 'wc2026-bracket-simulation'
const STORAGE_KEY = 'wc2026-bracket-schemes'

export type SavedSimulation = {
  lockedGroups: GroupLetter[]
  groupOrder: Partial<Record<GroupLetter, string[]>>
  thirdPlaceOrder: string[] | null
  thirdPlaceLocked: boolean
  winners: Record<number, string>
}

export type SavedScheme = {
  id: string
  name: string
  updatedAt: number
  simulation: SavedSimulation
}

type SchemesFile = {
  version: 2
  activeSchemeId: string | null
  schemes: SavedScheme[]
}

function newId(): string {
  return `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function defaultName(index: number): string {
  return `方案 ${index}`
}

function migrateLegacy(): SchemesFile | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const simulation = JSON.parse(raw) as SavedSimulation
    if (!hasManualSimulation(simulation)) {
      localStorage.removeItem(LEGACY_KEY)
      return null
    }
    const id = newId()
    const file: SchemesFile = {
      version: 2,
      activeSchemeId: id,
      schemes: [{ id, name: '方案 1', updatedAt: Date.now(), simulation }],
    }
    localStorage.removeItem(LEGACY_KEY)
    writeSchemesFile(file)
    return file
  } catch {
    return null
  }
}

function readSchemesFile(): SchemesFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const migrated = migrateLegacy()
      return migrated ?? { version: 2, activeSchemeId: null, schemes: [] }
    }
    const parsed = JSON.parse(raw) as SchemesFile
    if (!parsed.schemes) return { version: 2, activeSchemeId: null, schemes: [] }
    return parsed
  } catch {
    return { version: 2, activeSchemeId: null, schemes: [] }
  }
}

function writeSchemesFile(file: SchemesFile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  } catch {
    // ignore
  }
}

export function loadSchemesState(): Pick<SchemesFile, 'activeSchemeId' | 'schemes'> {
  const file = readSchemesFile()
  return { activeSchemeId: file.activeSchemeId, schemes: file.schemes }
}

export function loadActiveSimulation(): {
  simulation: SavedSimulation | null
  activeSchemeId: string | null
} {
  const file = readSchemesFile()
  if (!file.activeSchemeId) return { simulation: null, activeSchemeId: null }
  const scheme = file.schemes.find((s) => s.id === file.activeSchemeId)
  return {
    simulation: scheme?.simulation ?? null,
    activeSchemeId: file.activeSchemeId,
  }
}

export function persistActiveSchemeSimulation(
  activeSchemeId: string | null,
  simulation: SavedSimulation,
): SavedScheme[] {
  if (!activeSchemeId) return readSchemesFile().schemes

  const file = readSchemesFile()
  const schemes = file.schemes.map((s) =>
    s.id === activeSchemeId ? { ...s, simulation, updatedAt: Date.now() } : s,
  )
  writeSchemesFile({ ...file, activeSchemeId, schemes })
  return schemes
}

export function upsertScheme(
  name: string,
  simulation: SavedSimulation,
  existingId?: string | null,
): { schemes: SavedScheme[]; activeSchemeId: string } {
  const file = readSchemesFile()
  const trimmed = name.trim() || defaultName(file.schemes.length + 1)
  const now = Date.now()

  if (existingId) {
    const schemes = file.schemes.map((s) =>
      s.id === existingId ? { ...s, name: trimmed, simulation, updatedAt: now } : s,
    )
    writeSchemesFile({ version: 2, activeSchemeId: existingId, schemes })
    return { schemes, activeSchemeId: existingId }
  }

  const id = newId()
  const scheme: SavedScheme = { id, name: trimmed, updatedAt: now, simulation }
  const schemes = [...file.schemes, scheme]
  writeSchemesFile({ version: 2, activeSchemeId: id, schemes })
  return { schemes, activeSchemeId: id }
}

export function renameScheme(id: string, name: string): SavedScheme[] {
  const file = readSchemesFile()
  const trimmed = name.trim()
  if (!trimmed) return file.schemes

  const schemes = file.schemes.map((s) =>
    s.id === id ? { ...s, name: trimmed, updatedAt: Date.now() } : s,
  )
  writeSchemesFile({ ...file, schemes })
  return schemes
}

export function deleteScheme(id: string): { schemes: SavedScheme[]; activeSchemeId: string | null } {
  const file = readSchemesFile()
  const schemes = file.schemes.filter((s) => s.id !== id)
  const activeSchemeId = file.activeSchemeId === id ? null : file.activeSchemeId
  writeSchemesFile({ version: 2, activeSchemeId, schemes })
  return { schemes, activeSchemeId }
}

export function setActiveSchemeId(activeSchemeId: string | null): void {
  const file = readSchemesFile()
  writeSchemesFile({ ...file, activeSchemeId })
}

export function clearAllSchemes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }
}

export function hasManualSimulation(state: SavedSimulation): boolean {
  return (
    state.lockedGroups.length > 0 ||
    state.thirdPlaceLocked ||
    Object.keys(state.winners).length > 0
  )
}

export function snapshotFromStore(state: {
  lockedGroups: Set<GroupLetter>
  groupOrder: Partial<Record<GroupLetter, string[]>>
  thirdPlaceOrder: string[] | null
  thirdPlaceLocked: boolean
  winners: Record<number, string>
}): SavedSimulation {
  return {
    lockedGroups: [...state.lockedGroups],
    groupOrder: state.groupOrder,
    thirdPlaceOrder: state.thirdPlaceOrder,
    thirdPlaceLocked: state.thirdPlaceLocked,
    winners: state.winners,
  }
}

export function applySimulationToStandings(
  snapshotStandings: TeamStanding[],
  simulation: SavedSimulation,
) {
  const lockedGroups = new Set(simulation.lockedGroups)
  const byId = new Map(snapshotStandings.map((t) => [t.teamId, t]))
  let standings = [...snapshotStandings]

  for (const group of lockedGroups) {
    const order = simulation.groupOrder[group]
    if (!order) continue
    const reordered = order.map((id) => byId.get(id)).filter(Boolean) as TeamStanding[]
    standings = standings.filter((t) => t.group !== group).concat(reordered)
  }

  return {
    standings,
    lockedGroups,
    groupOrder: simulation.groupOrder,
    thirdPlaceOrder: simulation.thirdPlaceOrder,
    thirdPlaceLocked: simulation.thirdPlaceLocked,
    winners: simulation.winners,
  }
}
