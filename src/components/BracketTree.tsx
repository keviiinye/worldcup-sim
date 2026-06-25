import type { KnockoutMatch, KnockoutParticipant, GroupLetter } from '../engine/types'
import type { TeamRank } from '../engine/tiebreakers'
import { getSlotHighlightRank } from '../engine/groupKnockoutPaths'
import {
  BOTTOM_QF_ORDER,
  BOTTOM_R16_ORDER,
  BOTTOM_R32_ORDER,
  ROUND_LABELS,
  TOP_QF_ORDER,
  TOP_R16_ORDER,
  TOP_R32_ORDER,
} from '../engine/knockoutStructure'
import { useBracketStore } from '../store/bracketStore'

function formatSlotLabel(label: string): string {
  const rank = label.slice(0, -1)
  const group = label.slice(-1)
  return `${group}${rank}`
}

function slotOriginTitle(label: string): string {
  const rank = label.slice(0, -1)
  const group = label.slice(-1)
  if (rank === '3') return `${group}组第三名`
  return `${group}组第${rank}名`
}

function ParticipantRow({
  participant,
  isWinner,
  onPick,
  showSlotOrigin,
  isRankLocked,
  highlightRank,
}: {
  participant: KnockoutParticipant
  matchNo: number
  isWinner: boolean
  onPick?: (teamId: string) => void
  showSlotOrigin?: boolean
  isRankLocked: boolean
  highlightRank?: 1 | 2 | 3 | null
}) {
  if (participant.type === 'empty') {
    return (
      <div className="bracket-team placeholder">
        <span className="team-code">TBD</span>
      </div>
    )
  }

  if (participant.type === 'team') {
    const { team } = participant
    const origin = showSlotOrigin ? participant.label : null
    return (
      <button
        type="button"
        className={`bracket-team ${isWinner ? 'winner' : ''} ${participant.isThirdPlace ? 'third' : ''} ${isRankLocked ? '' : 'rank-unlocked'} ${highlightRank ? `group-slot-highlight rank-${highlightRank}` : ''}`}
        onClick={() => onPick?.(team.teamId)}
        title={`${team.name}${origin ? ` · ${slotOriginTitle(origin)}` : ''}${isRankLocked ? ' · 顺位已锁定' : ' · 顺位尚未锁定'} · 点击选择胜者`}
      >
        <span className="flag">{team.flag ?? '🏳️'}</span>
        <span className="team-code">{team.code}</span>
        {origin && (
          <span className="slot-tag" title={slotOriginTitle(origin)}>
            {formatSlotLabel(origin)}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="bracket-team placeholder">
      <span className="team-code">{participant.label}</span>
    </div>
  )
}

function BracketMatch({
  match,
  onPick,
  autoLockedTeamRanks,
  selectedGroup,
}: {
  match: KnockoutMatch
  onPick: (matchNo: number, teamId: string) => void
  autoLockedTeamRanks: Partial<Record<string, TeamRank>>
  selectedGroup: GroupLetter | null
}) {
  const canPick =
    match.home.type === 'team' && match.away.type === 'team'
  const showSlotOrigin = match.round === 'r32'

  function isLocked(participant: KnockoutParticipant): boolean {
    if (participant.type !== 'team') return true
    return autoLockedTeamRanks[participant.team.teamId] != null
  }

  const homeHighlight =
    showSlotOrigin && match.home.type === 'team'
      ? getSlotHighlightRank(match.home.label, selectedGroup)
      : null
  const awayHighlight =
    showSlotOrigin && match.away.type === 'team'
      ? getSlotHighlightRank(match.away.label, selectedGroup)
      : null

  return (
    <div className={`bracket-match round-${match.round}`} data-bracket-match={match.matchNo}>
      <div className="match-meta">M{match.matchNo}</div>
      <ParticipantRow
        participant={match.home}
        matchNo={match.matchNo}
        isWinner={match.winnerId === (match.home.type === 'team' ? match.home.team.teamId : '')}
        onPick={canPick ? (id) => onPick(match.matchNo, id) : undefined}
        showSlotOrigin={showSlotOrigin}
        isRankLocked={isLocked(match.home)}
        highlightRank={homeHighlight}
      />
      <ParticipantRow
        participant={match.away}
        matchNo={match.matchNo}
        isWinner={match.winnerId === (match.away.type === 'team' ? match.away.team.teamId : '')}
        onPick={canPick ? (id) => onPick(match.matchNo, id) : undefined}
        showSlotOrigin={showSlotOrigin}
        isRankLocked={isLocked(match.away)}
        highlightRank={awayHighlight}
      />
    </div>
  )
}

function RoundColumn({
  label,
  matchNos,
  columnClass,
  knockout,
  onPick,
  autoLockedTeamRanks,
  selectedGroup,
}: {
  label: string
  matchNos: readonly number[]
  columnClass: 'col-r32' | 'col-r16' | 'col-qf'
  knockout: KnockoutMatch[]
  onPick: (matchNo: number, teamId: string) => void
  autoLockedTeamRanks: Partial<Record<string, TeamRank>>
  selectedGroup: GroupLetter | null
}) {
  const byNo = new Map(knockout.map((m) => [m.matchNo, m]))
  return (
    <div className={`bracket-round ${columnClass}`}>
      <div className="round-label">{label}</div>
      <div className="round-matches">
        {matchNos.map((no) => {
          const match = byNo.get(no)
          if (!match) return null
          return (
            <BracketMatch
              key={no}
              match={match}
              onPick={onPick}
              autoLockedTeamRanks={autoLockedTeamRanks}
              selectedGroup={selectedGroup}
            />
          )
        })}
      </div>
    </div>
  )
}

export function BracketTree() {
  const knockout = useBracketStore((s) => s.bracket.knockout)
  const champion = useBracketStore((s) => s.bracket.champion)
  const annexOption = useBracketStore((s) => s.bracket.annexOption)
  const autoLockedTeamRanks = useBracketStore((s) => s.autoLockedTeamRanks)
  const selectedGroup = useBracketStore((s) => s.selectedGroup)
  const pickWinner = useBracketStore((s) => s.pickWinner)
  const clearKnockout = useBracketStore((s) => s.clearKnockout)

  const matchProps = { autoLockedTeamRanks, selectedGroup }
  const knockoutOnlyProps = { autoLockedTeamRanks, selectedGroup: null as GroupLetter | null }

  const byNo = new Map(knockout.map((m) => [m.matchNo, m]))
  const sf1 = byNo.get(101)!
  const sf2 = byNo.get(102)!
  const final = byNo.get(104)!
  const third = byNo.get(103)!

  return (
    <section className="panel bracket-panel">
      <div className="bracket-header">
        <div>
          <h2>淘汰赛路线图</h2>
          <p className="hint">
            32 → 16 → 8 → 4 → 2 → 1 · Annex C #{annexOption} · 点击球队推进下一轮
            {selectedGroup && (
              <span className="group-focus-hint">
                {' '}
                · 高亮 {selectedGroup} 组 32 强落位（金/绿/蓝 = 第 1/2/3 名）
              </span>
            )}
            <span className="bracket-legend">
              <span className="legend-item rank-unlocked-sample">半透明 = 顺位尚未锁定</span>
            </span>
          </p>
        </div>
        <button type="button" className="secondary" onClick={clearKnockout}>
          重置淘汰赛
        </button>
      </div>

      <p className="bracket-scroll-hint">← 左右滑动查看完整对阵图 →</p>
      <div className="bracket-scroll-wrap">
        <div className="bracket-arena">
        <div className="bracket-half top">
          <RoundColumn label={ROUND_LABELS.r32} columnClass="col-r32" matchNos={TOP_R32_ORDER} knockout={knockout} onPick={pickWinner} {...matchProps} />
          <div className="bracket-connector" aria-hidden />
          <RoundColumn label={ROUND_LABELS.r16} columnClass="col-r16" matchNos={TOP_R16_ORDER} knockout={knockout} onPick={pickWinner} {...knockoutOnlyProps} />
          <div className="bracket-connector" aria-hidden />
          <RoundColumn label={ROUND_LABELS.qf} columnClass="col-qf" matchNos={TOP_QF_ORDER} knockout={knockout} onPick={pickWinner} {...knockoutOnlyProps} />
          <div className="bracket-connector" aria-hidden />
          <div className="bracket-round col-sf sf-round">
            <div className="round-label">{ROUND_LABELS.sf}</div>
            <div className="round-matches">
              <BracketMatch match={sf1} onPick={pickWinner} {...knockoutOnlyProps} />
            </div>
          </div>
        </div>

        <div className="bracket-center">
          <div className="bracket-round final-round">
            <div className="round-label">🏆 {ROUND_LABELS.final}</div>
            <div className="round-matches">
              <BracketMatch match={final} onPick={pickWinner} {...knockoutOnlyProps} />
            </div>
          </div>
          {champion && (
            <div className="champion-box">
              <span className="champion-label">冠军</span>
              <span className="flag">{champion.flag ?? '🏳️'}</span>
              <span className="champion-name">{champion.code}</span>
            </div>
          )}
          <div className="bracket-round third-round">
            <div className="round-label">{ROUND_LABELS.third}</div>
            <div className="round-matches">
              <BracketMatch match={third} onPick={pickWinner} {...knockoutOnlyProps} />
            </div>
          </div>
        </div>

        <div className="bracket-half bottom">
          <div className="bracket-round col-sf sf-round">
            <div className="round-label">{ROUND_LABELS.sf}</div>
            <div className="round-matches">
              <BracketMatch match={sf2} onPick={pickWinner} {...knockoutOnlyProps} />
            </div>
          </div>
          <div className="bracket-connector" aria-hidden />
          <RoundColumn label={ROUND_LABELS.qf} columnClass="col-qf" matchNos={BOTTOM_QF_ORDER} knockout={knockout} onPick={pickWinner} {...knockoutOnlyProps} />
          <div className="bracket-connector" aria-hidden />
          <RoundColumn label={ROUND_LABELS.r16} columnClass="col-r16" matchNos={BOTTOM_R16_ORDER} knockout={knockout} onPick={pickWinner} {...knockoutOnlyProps} />
          <div className="bracket-connector" aria-hidden />
          <RoundColumn label={ROUND_LABELS.r32} columnClass="col-r32" matchNos={BOTTOM_R32_ORDER} knockout={knockout} onPick={pickWinner} {...matchProps} />
        </div>
        </div>
      </div>
    </section>
  )
}
