import { create } from 'zustand'
import { buildFullBracket } from '../engine/buildFullBracket'
import { computeAutoLockedRanks } from '../engine/rankLock'
import type { BracketResult, GroupLetter, TeamStanding } from '../engine/types'
import {
  buildSnapshotStandings,
  SNAPSHOT_AS_OF,
  SNAPSHOT_MATCH_RESULTS,
} from '../data/wc2026Snapshot'
import type { GroupMatchResult } from '../engine/types'
import type { TeamRank } from '../engine/tiebreakers'
import {
  applySimulationToStandings,
  deleteScheme as deleteSchemeFromStorage,
  hasManualSimulation,
  loadActiveSimulation,
  loadSchemesState,
  persistActiveSchemeSimulation,
  renameScheme as renameSchemeInStorage,
  setActiveSchemeId,
  snapshotFromStore,
  upsertScheme,
  type SavedScheme,
  type SavedSimulation,
} from './simulationPersistence'

type BracketStore = {
  standings: TeamStanding[]
  matchResults: GroupMatchResult[]
  bracket: BracketResult
  autoLockedTeamRanks: Partial<Record<string, TeamRank>>
  winners: Record<number, string>
  lockedGroups: Set<GroupLetter>
  groupOrder: Partial<Record<GroupLetter, string[]>>
  thirdPlaceOrder: string[] | null
  thirdPlaceLocked: boolean
  lastUpdated: Date | null
  dataSource: 'manual' | 'snapshot' | 'initial'
  selectedGroup: GroupLetter | null
  schemes: SavedScheme[]
  activeSchemeId: string | null

  setStandings: (
    standings: TeamStanding[],
    source?: 'manual' | 'snapshot' | 'initial',
    matchResults?: GroupMatchResult[],
  ) => void
  reorderGroup: (group: GroupLetter, teamIds: string[]) => void
  reorderThirdPlace: (teamIds: string[]) => void
  unlockGroup: (group: GroupLetter) => void
  unlockThirdPlace: () => void
  resetToDefault: () => void
  saveCurrentScheme: (name?: string) => void
  saveSchemeAs: (name: string) => void
  loadScheme: (id: string) => void
  renameScheme: (id: string, name: string) => void
  deleteScheme: (id: string) => void
  pickWinner: (matchNo: number, teamId: string) => void
  clearKnockout: () => void
  recompute: () => void
  setSelectedGroup: (group: GroupLetter | null) => void
}

function deriveBracketState(
  state: Pick<
    BracketStore,
    | 'standings'
    | 'matchResults'
    | 'groupOrder'
    | 'thirdPlaceOrder'
    | 'thirdPlaceLocked'
    | 'winners'
  >,
): Pick<BracketStore, 'bracket' | 'autoLockedTeamRanks'> {
  const autoLockedTeamRanks = computeAutoLockedRanks(
    state.standings,
    state.matchResults,
  )
  const bracket = buildFullBracket(state.standings, {
    matchResults: state.matchResults,
    groupOrder: state.groupOrder,
    thirdPlaceOrder: state.thirdPlaceLocked ? state.thirdPlaceOrder : null,
    winners: state.winners,
  })
  return { bracket, autoLockedTeamRanks }
}

function resolveDataSource(simulation: SavedSimulation): 'manual' | 'snapshot' {
  return hasManualSimulation(simulation) ? 'manual' : 'snapshot'
}

function stateFromSimulation(simulation: SavedSimulation) {
  const matchResults = SNAPSHOT_MATCH_RESULTS
  const applied = applySimulationToStandings(buildSnapshotStandings(), simulation)
  const base = {
    standings: applied.standings,
    matchResults,
    winners: applied.winners,
    lockedGroups: applied.lockedGroups,
    groupOrder: applied.groupOrder,
    thirdPlaceOrder: applied.thirdPlaceOrder,
    thirdPlaceLocked: applied.thirdPlaceLocked,
    lastUpdated: new Date(SNAPSHOT_AS_OF),
    dataSource: resolveDataSource(simulation),
  }
  return { ...base, ...deriveBracketState(base) }
}

function defaultSnapshotState() {
  const matchResults = SNAPSHOT_MATCH_RESULTS
  const base = {
    standings: buildSnapshotStandings(),
    matchResults,
    winners: {},
    lockedGroups: new Set<GroupLetter>(),
    groupOrder: {},
    thirdPlaceOrder: null,
    thirdPlaceLocked: false,
    lastUpdated: new Date(SNAPSHOT_AS_OF),
    dataSource: 'snapshot' as const,
  }
  return { ...base, ...deriveBracketState(base) }
}

function buildInitialState(): Omit<
  BracketStore,
  | 'setStandings'
  | 'reorderGroup'
  | 'reorderThirdPlace'
  | 'unlockGroup'
  | 'unlockThirdPlace'
  | 'resetToDefault'
  | 'saveCurrentScheme'
  | 'saveSchemeAs'
  | 'loadScheme'
  | 'renameScheme'
  | 'deleteScheme'
  | 'pickWinner'
  | 'clearKnockout'
  | 'recompute'
  | 'setSelectedGroup'
> {
  const { schemes, activeSchemeId } = loadSchemesState()
  const { simulation } = loadActiveSimulation()

  if (simulation && activeSchemeId) {
    return {
      ...stateFromSimulation(simulation),
      schemes,
      activeSchemeId,
      selectedGroup: null,
    }
  }

  return {
    ...defaultSnapshotState(),
    schemes,
    activeSchemeId: null,
    selectedGroup: null,
  }
}

function maybeAutoPersist(
  state: Pick<
    BracketStore,
    | 'lockedGroups'
    | 'groupOrder'
    | 'thirdPlaceOrder'
    | 'thirdPlaceLocked'
    | 'winners'
    | 'activeSchemeId'
  >,
): SavedScheme[] | undefined {
  if (!state.activeSchemeId) return undefined
  return persistActiveSchemeSimulation(
    state.activeSchemeId,
    snapshotFromStore(state),
  )
}

export const useBracketStore = create<BracketStore>((set, get) => ({
  ...buildInitialState(),

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  setStandings: (standings, source = 'snapshot', matchResults = SNAPSHOT_MATCH_RESULTS) => {
    set((s) => {
      const byId = new Map(standings.map((t) => [t.teamId, t]))
      let merged = [...standings]

      for (const group of s.lockedGroups) {
        const order = s.groupOrder[group]
        if (!order) continue
        const reordered = order
          .map((id) => byId.get(id))
          .filter(Boolean) as TeamStanding[]
        merged = merged.filter((t) => t.group !== group).concat(reordered)
      }

      const next = {
        ...s,
        standings: merged,
        matchResults,
        winners: {},
        lastUpdated: new Date(SNAPSHOT_AS_OF),
        dataSource: source,
      }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  reorderGroup: (group, teamIds) => {
    set((s) => {
      const lockedGroups = new Set(s.lockedGroups)
      lockedGroups.add(group)
      const groupOrder = { ...s.groupOrder, [group]: teamIds }
      const byId = new Map(s.standings.map((t) => [t.teamId, t]))
      const reordered = teamIds.map((id) => byId.get(id)!).filter(Boolean)
      const standings = s.standings
        .filter((t) => t.group !== group)
        .concat(reordered)
      const draft = {
        ...s,
        lockedGroups,
        groupOrder,
        standings,
        winners: {},
        dataSource: 'manual' as const,
      }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  reorderThirdPlace: (teamIds) => {
    set((s) => {
      const draft = {
        ...s,
        thirdPlaceOrder: teamIds,
        thirdPlaceLocked: true,
        winners: {},
        dataSource: 'manual' as const,
      }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  unlockGroup: (group) => {
    set((s) => {
      const lockedGroups = new Set(s.lockedGroups)
      lockedGroups.delete(group)
      const groupOrder = { ...s.groupOrder }
      delete groupOrder[group]
      const simulation = snapshotFromStore({
        ...s,
        lockedGroups,
        groupOrder,
        winners: {},
      })
      const applied = applySimulationToStandings(buildSnapshotStandings(), simulation)
      const draft = {
        ...s,
        standings: applied.standings,
        lockedGroups: applied.lockedGroups,
        groupOrder: applied.groupOrder,
        winners: {},
        dataSource: resolveDataSource(simulation),
      }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  unlockThirdPlace: () => {
    set((s) => {
      const draft = {
        ...s,
        thirdPlaceOrder: null,
        thirdPlaceLocked: false,
        winners: {},
        dataSource: hasManualSimulation(
          snapshotFromStore({
            ...s,
            thirdPlaceOrder: null,
            thirdPlaceLocked: false,
            winners: {},
          }),
        )
          ? ('manual' as const)
          : ('snapshot' as const),
      }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  resetToDefault: () => {
    setActiveSchemeId(null)
    set({
      ...defaultSnapshotState(),
      schemes: get().schemes,
      activeSchemeId: null,
      selectedGroup: null,
    })
  },

  saveCurrentScheme: (name) => {
    const s = get()
    const simulation = snapshotFromStore(s)
    const existing = s.schemes.find((x) => x.id === s.activeSchemeId)
    const schemeName = name ?? existing?.name ?? `方案 ${s.schemes.length + 1}`
    const { schemes, activeSchemeId } = upsertScheme(
      schemeName,
      simulation,
      name ? null : s.activeSchemeId,
    )
    setActiveSchemeId(activeSchemeId)
    set({ schemes, activeSchemeId })
  },

  saveSchemeAs: (name) => {
    const simulation = snapshotFromStore(get())
    const { schemes, activeSchemeId } = upsertScheme(name, simulation, null)
    setActiveSchemeId(activeSchemeId)
    set({ schemes, activeSchemeId })
  },

  loadScheme: (id) => {
    const scheme = get().schemes.find((s) => s.id === id)
    if (!scheme) return
    setActiveSchemeId(id)
    set({
      ...stateFromSimulation(scheme.simulation),
      schemes: get().schemes,
      activeSchemeId: id,
      selectedGroup: null,
    })
  },

  renameScheme: (id, name) => {
    const schemes = renameSchemeInStorage(id, name)
    set({ schemes })
  },

  deleteScheme: (id) => {
    const { schemes, activeSchemeId } = deleteSchemeFromStorage(id)
    if (get().activeSchemeId === id) {
      set({
        ...defaultSnapshotState(),
        schemes,
        activeSchemeId,
        selectedGroup: null,
      })
    } else {
      set({ schemes, activeSchemeId })
    }
  },

  pickWinner: (matchNo, teamId) => {
    set((s) => {
      const winners = { ...s.winners, [matchNo]: teamId }
      const downstream = getDownstreamMatches(matchNo)
      for (const m of downstream) {
        delete winners[m]
      }
      const draft = { ...s, winners, dataSource: 'manual' as const }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  clearKnockout: () => {
    set((s) => {
      const draft = {
        ...s,
        winners: {},
        dataSource: hasManualSimulation(snapshotFromStore({ ...s, winners: {} }))
          ? ('manual' as const)
          : ('snapshot' as const),
      }
      const schemes = maybeAutoPersist(draft) ?? s.schemes
      const next = { ...draft, schemes }
      return { ...next, ...deriveBracketState(next) }
    })
  },

  recompute: () => {
    set((s) => ({ ...deriveBracketState(s) }))
  },
}))

const DOWNSTREAM: Record<number, number[]> = {
  73: [90, 97, 101, 103, 104],
  74: [89, 97, 101, 103, 104],
  75: [90, 97, 101, 103, 104],
  76: [91, 99, 102, 103, 104],
  77: [89, 97, 101, 103, 104],
  78: [91, 99, 102, 103, 104],
  79: [92, 99, 102, 103, 104],
  80: [92, 99, 102, 103, 104],
  81: [94, 98, 101, 103, 104],
  82: [94, 98, 101, 103, 104],
  83: [93, 98, 101, 103, 104],
  84: [93, 98, 101, 103, 104],
  85: [96, 100, 102, 103, 104],
  86: [95, 100, 102, 103, 104],
  87: [96, 100, 102, 103, 104],
  88: [95, 100, 102, 103, 104],
  89: [97, 101, 103, 104],
  90: [97, 101, 103, 104],
  91: [99, 102, 103, 104],
  92: [99, 102, 103, 104],
  93: [98, 101, 103, 104],
  94: [98, 101, 103, 104],
  95: [100, 102, 103, 104],
  96: [100, 102, 103, 104],
  97: [101, 103, 104],
  98: [101, 103, 104],
  99: [102, 103, 104],
  100: [102, 103, 104],
  101: [103, 104],
  102: [103, 104],
}

function getDownstreamMatches(matchNo: number): number[] {
  return DOWNSTREAM[matchNo] ?? []
}
