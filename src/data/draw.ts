import type { GroupLetter, TeamStanding } from '../engine/types'

type DrawTeam = {
  teamId: string
  name: string
  code: string
  flag?: string
}

export const GROUP_DRAW: Record<GroupLetter, DrawTeam[]> = {
  A: [
    { teamId: 'mex', name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
    { teamId: 'rsa', name: 'South Africa', code: 'RSA', flag: '🇿🇦' },
    { teamId: 'kor', name: 'Korea Republic', code: 'KOR', flag: '🇰🇷' },
    { teamId: 'cze', name: 'Czechia', code: 'CZE', flag: '🇨🇿' },
  ],
  B: [
    { teamId: 'can', name: 'Canada', code: 'CAN', flag: '🇨🇦' },
    { teamId: 'bih', name: 'Bosnia and Herzegovina', code: 'BIH', flag: '🇧🇦' },
    { teamId: 'qat', name: 'Qatar', code: 'QAT', flag: '🇶🇦' },
    { teamId: 'sui', name: 'Switzerland', code: 'SUI', flag: '🇨🇭' },
  ],
  C: [
    { teamId: 'bra', name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
    { teamId: 'mar', name: 'Morocco', code: 'MAR', flag: '🇲🇦' },
    { teamId: 'hai', name: 'Haiti', code: 'HAI', flag: '🇭🇹' },
    { teamId: 'sco', name: 'Scotland', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  ],
  D: [
    { teamId: 'usa', name: 'USA', code: 'USA', flag: '🇺🇸' },
    { teamId: 'par', name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
    { teamId: 'aus', name: 'Australia', code: 'AUS', flag: '🇦🇺' },
    { teamId: 'tur', name: 'Türkiye', code: 'TUR', flag: '🇹🇷' },
  ],
  E: [
    { teamId: 'ger', name: 'Germany', code: 'GER', flag: '🇩🇪' },
    { teamId: 'cuw', name: 'Curaçao', code: 'CUW', flag: '🇨🇼' },
    { teamId: 'civ', name: "Côte d'Ivoire", code: 'CIV', flag: '🇨🇮' },
    { teamId: 'ecu', name: 'Ecuador', code: 'ECU', flag: '🇪🇨' },
  ],
  F: [
    { teamId: 'ned', name: 'Netherlands', code: 'NED', flag: '🇳🇱' },
    { teamId: 'jpn', name: 'Japan', code: 'JPN', flag: '🇯🇵' },
    { teamId: 'swe', name: 'Sweden', code: 'SWE', flag: '🇸🇪' },
    { teamId: 'tun', name: 'Tunisia', code: 'TUN', flag: '🇹🇳' },
  ],
  G: [
    { teamId: 'bel', name: 'Belgium', code: 'BEL', flag: '🇧🇪' },
    { teamId: 'egy', name: 'Egypt', code: 'EGY', flag: '🇪🇬' },
    { teamId: 'irn', name: 'IR Iran', code: 'IRN', flag: '🇮🇷' },
    { teamId: 'nzl', name: 'New Zealand', code: 'NZL', flag: '🇳🇿' },
  ],
  H: [
    { teamId: 'esp', name: 'Spain', code: 'ESP', flag: '🇪🇸' },
    { teamId: 'cpv', name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻' },
    { teamId: 'ksa', name: 'Saudi Arabia', code: 'KSA', flag: '🇸🇦' },
    { teamId: 'uru', name: 'Uruguay', code: 'URU', flag: '🇺🇾' },
  ],
  I: [
    { teamId: 'fra', name: 'France', code: 'FRA', flag: '🇫🇷' },
    { teamId: 'sen', name: 'Senegal', code: 'SEN', flag: '🇸🇳' },
    { teamId: 'irq', name: 'Iraq', code: 'IRQ', flag: '🇮🇶' },
    { teamId: 'nor', name: 'Norway', code: 'NOR', flag: '🇳🇴' },
  ],
  J: [
    { teamId: 'arg', name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
    { teamId: 'alg', name: 'Algeria', code: 'ALG', flag: '🇩🇿' },
    { teamId: 'aut', name: 'Austria', code: 'AUT', flag: '🇦🇹' },
    { teamId: 'jor', name: 'Jordan', code: 'JOR', flag: '🇯🇴' },
  ],
  K: [
    { teamId: 'por', name: 'Portugal', code: 'POR', flag: '🇵🇹' },
    { teamId: 'cod', name: 'Congo DR', code: 'COD', flag: '🇨🇩' },
    { teamId: 'uzb', name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿' },
    { teamId: 'col', name: 'Colombia', code: 'COL', flag: '🇨🇴' },
  ],
  L: [
    { teamId: 'eng', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { teamId: 'cro', name: 'Croatia', code: 'CRO', flag: '🇭🇷' },
    { teamId: 'gha', name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
    { teamId: 'pan', name: 'Panama', code: 'PAN', flag: '🇵🇦' },
  ],
}

export function createInitialStandings(
  fifaRanks: Record<string, number> = {},
): TeamStanding[] {
  const standings: TeamStanding[] = []
  for (const [group, teams] of Object.entries(GROUP_DRAW) as [GroupLetter, DrawTeam[]][]) {
    for (const team of teams) {
      standings.push({
        ...team,
        group,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        fairPlayPoints: 0,
        fifaRank: fifaRanks[team.teamId] ?? 999,
      })
    }
  }
  return standings
}
