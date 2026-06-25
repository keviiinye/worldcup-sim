import { useMemo } from 'react'
import type { GroupAnalysis } from '../engine/groupAnalysis'
import { analyzeGroup } from '../engine/groupAnalysis'
import type { GroupLetter } from '../engine/types'
import { useBracketStore } from '../store/bracketStore'

function pct(n: number): string {
  if (n >= 0.995) return '100%'
  if (n <= 0.005) return '0%'
  return `${Math.round(n * 100)}%`
}

function RankBar({ probs }: { probs: Record<1 | 2 | 3 | 4, number> }) {
  const ranks: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]
  const colors = ['#ffd54f', '#81c784', '#64b5f6', '#e57373']
  const tip = ranks.map((r) => `#${r} ${pct(probs[r])}`).join(' · ')
  return (
    <div className="rank-bar" title={tip}>
      {ranks.map((r, i) =>
        probs[r] > 0 ? (
          <span
            key={r}
            className="rank-bar-seg"
            style={{ flex: probs[r], background: colors[i] }}
          />
        ) : null,
      )}
    </div>
  )
}

export function useGroupAnalysis(group: GroupLetter | null): GroupAnalysis | null {
  const standings = useBracketStore((s) => s.standings)
  const matchResults = useBracketStore((s) => s.matchResults)

  return useMemo(() => {
    if (!group) return null
    return analyzeGroup(group, standings, matchResults)
  }, [group, standings, matchResults])
}

export function GroupInsightsBody({ analysis }: { analysis: GroupAnalysis }) {
  return (
    <>
      <ul className="insight-list compact">
        {analysis.insights.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      {analysis.outlook.length > 0 && (
        <>
          <h5 className="analysis-subtitle">余赛展望</h5>
          <ul className="insight-list compact outlook-list">
            {analysis.outlook.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </>
      )}
      <p className="analysis-meta inline">{analysis.scenarioCount} 种等权赛果组合</p>
    </>
  )
}

function SchedMatch({ match }: { match: GroupAnalysis['matchdays'][0]['matches'][0] }) {
  return (
    <span className="sched-chip">
      <span className="sched-team home">
        <span className="sched-flag">{match.homeFlag ?? '🏳️'}</span>
        <span className="sched-code">{match.homeCode}</span>
      </span>
      <span className={`sched-score ${match.status === 'played' ? 'played' : ''}`}>
        {match.status === 'played' ? match.scoreLabel : 'vs'}
      </span>
      <span className="sched-team away">
        <span className="sched-flag">{match.awayFlag ?? '🏳️'}</span>
        <span className="sched-code">{match.awayCode}</span>
      </span>
    </span>
  )
}

export function GroupScheduleBody({ analysis }: { analysis: GroupAnalysis }) {
  return (
    <div className="schedule-by-day">
      {analysis.matchdays.map((day) => (
        <div key={day.matchday} className="schedule-row">
          <span className="sched-tag day">D{day.matchday}</span>
          <div className="sched-items">
            {day.matches.map((m, i) => (
              <SchedMatch key={i} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function GroupRatingsBody({ analysis }: { analysis: GroupAnalysis }) {
  return (
    <div className="ratings-table compact">
      <div className="ratings-head">
        <span className="ratings-col-team">球队</span>
        <span className="ratings-col-metric">攻</span>
        <span className="ratings-col-metric">防</span>
        <span className="ratings-col-metric overall">综合</span>
      </div>
      {analysis.teams.map((t) => (
        <div key={t.teamId} className="ratings-row">
          <span className="ratings-col-team" title={t.name}>
            {t.flag} {t.code}
          </span>
          <span className="ratings-col-metric">{t.attackRating}</span>
          <span className="ratings-col-metric">{t.defenseRating}</span>
          <span className="ratings-col-metric overall">{t.overallRating}</span>
        </div>
      ))}
    </div>
  )
}

export function GroupProbBody({ analysis }: { analysis: GroupAnalysis }) {
  return (
    <div className="prob-table compact">
      {analysis.teams.map((t) => (
        <div key={t.teamId} className={`prob-row ${t.isRankLocked ? 'locked' : ''}`}>
          <span className="prob-team" title={t.name}>
            {t.flag} {t.code}
            {t.isRankLocked && <span className="mini-lock">🔒</span>}
          </span>
          <span className="prob-pts" title={`末轮积分 ${t.pointsMin}–${t.pointsMax}`}>
            {t.points}
          </span>
          <span className="prob-top2">{pct(t.top2Pct)}</span>
          <RankBar probs={t.rankProb} />
        </div>
      ))}
    </div>
  )
}

export function GroupAnalysisBody({ analysis }: { analysis: GroupAnalysis }) {
  return (
    <div className="group-analysis-body">
      <section className="analysis-block">
        <h4 className="analysis-block-title">赛程</h4>
        <GroupScheduleBody analysis={analysis} />
      </section>
      <section className="analysis-block">
        <h4 className="analysis-block-title">形势摘要</h4>
        <GroupInsightsBody analysis={analysis} />
      </section>
      <section className="analysis-block">
        <h4 className="analysis-block-title">球队评级</h4>
        <GroupRatingsBody analysis={analysis} />
      </section>
      <section className="analysis-block">
        <h4 className="analysis-block-title">顺位概率</h4>
        <GroupProbBody analysis={analysis} />
      </section>
    </div>
  )
}
