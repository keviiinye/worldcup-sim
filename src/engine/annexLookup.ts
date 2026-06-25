import annexData from '../data/annex-c.json'
import type { GroupLetter } from './types'

type AnnexEntry = {
  option: number
  slots: Record<string, GroupLetter>
}

const lookup = annexData.lookup as Record<string, AnnexEntry>

export function lookupAnnexC(advancingGroups: GroupLetter[]): AnnexEntry {
  const key = [...advancingGroups].sort().join('')
  const entry = lookup[key]
  if (!entry) {
    throw new Error(`Annex C lookup failed for groups: ${key}`)
  }
  return entry
}

export function getAllAnnexKeys(): string[] {
  return Object.keys(lookup)
}

export function getAnnexRowCount(): number {
  return annexData.rows.length
}

export { annexData }
