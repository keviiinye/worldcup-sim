import type { TeamStanding } from '../engine/types'
import { GROUP_LETTERS, type GroupLetter } from '../engine/types'
import { GROUP_DRAW } from '../data/draw'
import {
  buildSnapshotStandings,
  SNAPSHOT_AS_OF,
  SNAPSHOT_MATCH_RESULTS,
} from '../data/wc2026Snapshot'
import fifaRanks from '../data/fifa-rankings.json'
import type { GroupMatchResult } from '../engine/types'

type ApiFootballStanding = {
  rank: number
  team: { id: number; name: string; logo: string }
  points: number
  goalsDiff: number
  group: string
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
  }
}

type ApiFootballResponse = {
  response: Array<{
    league: {
      standings: ApiFootballStanding[][]
    }
  }>
}

const GROUP_MAP = new Map<string, GroupLetter>(
  GROUP_LETTERS.map((g) => [`Group ${g}`, g]),
)

const NAME_TO_ID = new Map<string, string>()
for (const teams of Object.values(GROUP_DRAW)) {
  for (const t of teams) {
    NAME_TO_ID.set(t.name.toLowerCase(), t.teamId)
  }
}
NAME_TO_ID.set('czech republic', 'cze')
NAME_TO_ID.set('czechia', 'cze')
NAME_TO_ID.set('south korea', 'kor')
NAME_TO_ID.set('korea republic', 'kor')
NAME_TO_ID.set('cote d\'ivoire', 'civ')
NAME_TO_ID.set('côte d\'ivoire', 'civ')
NAME_TO_ID.set('ivory coast', 'civ')
NAME_TO_ID.set('dr congo', 'cod')
NAME_TO_ID.set('congo dr', 'cod')
NAME_TO_ID.set('democratic republic of the congo', 'cod')
NAME_TO_ID.set('usa', 'usa')
NAME_TO_ID.set('united states', 'usa')
NAME_TO_ID.set('türkiye', 'tur')
NAME_TO_ID.set('turkey', 'tur')
NAME_TO_ID.set('cabo verde', 'cpv')
NAME_TO_ID.set('cape verde', 'cpv')
NAME_TO_ID.set('curacao', 'cuw')
NAME_TO_ID.set('curaçao', 'cuw')
NAME_TO_ID.set('iran', 'irn')
NAME_TO_ID.set('ir iran', 'irn')

function resolveTeamId(name: string): string {
  const key = name.toLowerCase()
  return NAME_TO_ID.get(key) ?? key.replace(/\s+/g, '-').slice(0, 12)
}

export async function fetchLiveStandings(): Promise<TeamStanding[]> {
  const res = await fetch('/api/football/standings?league=1&season=2026')
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  const data = (await res.json()) as ApiFootballResponse
  const groups = data.response[0]?.league?.standings ?? []

  const standings: TeamStanding[] = []
  for (const groupTable of groups) {
    for (const row of groupTable) {
      const group = GROUP_MAP.get(row.group)
      if (!group) continue
      const teamId = resolveTeamId(row.team.name)
      const drawTeam = GROUP_DRAW[group].find((t) => t.teamId === teamId)
      standings.push({
        teamId,
        name: drawTeam?.name ?? row.team.name,
        code: drawTeam?.code ?? row.team.name.slice(0, 3).toUpperCase(),
        flag: drawTeam?.flag,
        group,
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        gf: row.all.goals.for,
        ga: row.all.goals.against,
        gd: row.goalsDiff,
        points: row.points,
        fairPlayPoints: 0,
        fifaRank: (fifaRanks as Record<string, number>)[teamId] ?? 999,
      })
    }
  }

  if (standings.length === 0) {
    throw new Error('No standings returned from API')
  }
  return standings
}

export function getPollIntervalMs(): number {
  return 60_000
}

export type StandingsPayload = {
  standings: TeamStanding[]
  matchResults: GroupMatchResult[]
  source: 'live' | 'snapshot'
}

export function getSnapshotStandings(): StandingsPayload {
  return {
    standings: buildSnapshotStandings(),
    matchResults: SNAPSHOT_MATCH_RESULTS,
    source: 'snapshot',
  }
}

export async function fetchStandingsWithFallback(): Promise<StandingsPayload> {
  try {
    const standings = await fetchLiveStandings()
    return { standings, matchResults: [], source: 'live' }
  } catch {
    return getSnapshotStandings()
  }
}

export { SNAPSHOT_AS_OF }
