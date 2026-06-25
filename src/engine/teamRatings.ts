import type { TeamStanding } from './types'

export type TeamRatingProfile = {
  attack: number
  defense: number
  overall: number
}

const SCORE_MIN = 40
const SCORE_MAX = 95

/** FIFA 实力 + 小组赛表现 → 连续分 */
function attackScore(team: TeamStanding): number {
  const strength = 130 / (team.fifaRank + 10)
  if (team.played === 0) return strength
  const form = team.gf / team.played
  return strength * 0.55 + form * 0.45
}

function defenseScore(team: TeamStanding): number {
  const strength = 130 / (team.fifaRank + 10)
  if (team.played === 0) return strength
  const form = Math.max(0, 2.4 - team.ga / team.played)
  return strength * 0.55 + form * 0.45
}

function normalizeToRating(
  scores: Array<{ teamId: string; score: number }>,
): Map<string, number> {
  const values = scores.map((s) => s.score)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = SCORE_MAX - SCORE_MIN
  const result = new Map<string, number>()

  for (const { teamId, score } of scores) {
    if (max - min < 1e-6) {
      result.set(teamId, Math.round((SCORE_MIN + SCORE_MAX) / 2))
      continue
    }
    const ratio = (score - min) / (max - min)
    result.set(teamId, Math.round(SCORE_MIN + span * ratio))
  }

  return result
}

/** 全部参赛队攻/防/综合分（40–95，全局归一化） */
export function computeTournamentTeamRatings(
  teams: TeamStanding[],
): Map<string, TeamRatingProfile> {
  const attackById = normalizeToRating(
    teams.map((t) => ({ teamId: t.teamId, score: attackScore(t) })),
  )
  const defenseById = normalizeToRating(
    teams.map((t) => ({ teamId: t.teamId, score: defenseScore(t) })),
  )

  return new Map(
    teams.map((t) => {
      const attack = attackById.get(t.teamId)!
      const defense = defenseById.get(t.teamId)!
      return [
        t.teamId,
        {
          attack,
          defense,
          overall: Math.round(attack * 0.5 + defense * 0.5),
        },
      ]
    }),
  )
}
