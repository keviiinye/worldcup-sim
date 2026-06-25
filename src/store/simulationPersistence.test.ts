import { describe, it, expect, beforeEach } from 'vitest'
import {
  upsertScheme,
  renameScheme,
  deleteScheme,
  loadSchemesState,
  hasManualSimulation,
  clearAllSchemes,
} from './simulationPersistence'

const sampleSim = {
  lockedGroups: ['A' as const],
  groupOrder: { A: ['mex', 'kor', 'cze', 'rsa'] },
  thirdPlaceOrder: null,
  thirdPlaceLocked: false,
  winners: {},
}

function installLocalStorageMock() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
    configurable: true,
  })
}

describe('simulationPersistence schemes', () => {
  beforeEach(() => {
    installLocalStorageMock()
    clearAllSchemes()
  })

  it('creates and renames schemes', () => {
    upsertScheme('预测 A', sampleSim, null)
    const { schemes } = loadSchemesState()
    expect(schemes).toHaveLength(1)
    expect(schemes[0].name).toBe('预测 A')

    renameScheme(schemes[0].id, '预测 A 修订')
    const renamed = loadSchemesState().schemes[0]
    expect(renamed.name).toBe('预测 A 修订')
  })

  it('deletes a scheme', () => {
    const { activeSchemeId } = upsertScheme('临时', sampleSim, null)
    deleteScheme(activeSchemeId)
    expect(loadSchemesState().schemes).toHaveLength(0)
  })

  it('detects manual simulation', () => {
    expect(hasManualSimulation(sampleSim)).toBe(true)
    expect(
      hasManualSimulation({
        lockedGroups: [],
        groupOrder: {},
        thirdPlaceOrder: null,
        thirdPlaceLocked: false,
        winners: {},
      }),
    ).toBe(false)
  })
})
