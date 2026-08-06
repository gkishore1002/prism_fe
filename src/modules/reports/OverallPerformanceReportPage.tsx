import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { PageLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import { studentInsightBullets } from '@/lib/analyticsInsights'
import type { OverallPerformanceReport } from '@/types'
import {
  LgBoardTable,
  LgFooter,
  LgHero,
  LgInsightFeed,
  LgKpiRow,
  LgNarrative,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'

interface OverallPerformanceReportPageProps {
  studentId?: string
  backHref: string
  backLabel: string
}

export function OverallPerformanceReportPage({
  studentId,
  backHref,
  backLabel,
}: OverallPerformanceReportPageProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<OverallPerformanceReport | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void analyticsApi
      .overallReport(studentId)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch(() => {
        if (!cancelled) setReport(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading) {
    return <PageLoader label="Building overall performance report…" />
  }

  if (!report) {
    return (
      <LgReportLayout>
        <LgHero
          reportKind="Overall performance"
          title="Report unavailable"
          backHref={backHref}
          backLabel={backLabel}
        />
      </LgReportLayout>
    )
  }

  const recoveryDone = report.recoveryPlan.filter((s) => s.completed).length
  const topicChartData = report.topicBreakdown.slice(0, 6).map((t) => ({
    name: t.topic.length > 14 ? `${t.topic.slice(0, 12)}…` : t.topic,
    mastery: t.mastery,
    fill: t.mastery >= 75 ? '#10B981' : t.mastery >= 55 ? '#F59E0B' : '#EF4444',
  }))
  const healthForBullets = {
    overall: report.health,
    status: report.status,
    trend: report.improving ? 1 : -1,
    subjects: report.subjectHealth.map((s) => ({
      subjectId: s.name.toLowerCase().replace(/\s/g, '-'),
      subjectName: s.name,
      health: s.health,
      status: s.status as 'excellent' | 'good' | 'fair' | 'weak',
      trend: 0,
    })),
  }
  const insightBullets = studentInsightBullets(
    healthForBullets,
    report.learningGaps,
    report.readinessPredictions,
  )

  return (
    <LgReportLayout>
      <LgHero
        reportKind="Overall performance report"
        title={report.studentName}
        description={`${report.board} · ${report.grade} · ${report.batch}. All metrics up to date — trends, gaps, and readiness.`}
        meta={[
          { label: 'Report type', value: 'Overall performance' },
          { label: 'Health status', value: report.status },
          { label: 'Critical gaps', value: String(report.criticalGaps) },
        ]}
        stats={[
          { value: report.health, unit: '/100', label: 'Health score' },
          { value: report.readiness, unit: '%', label: 'Readiness' },
          { value: `+${report.improvement}`, unit: '%', label: 'Improvement' },
          { value: report.avgAccuracy, unit: '%', label: 'Avg accuracy' },
        ]}
        backHref={backHref}
        backLabel={backLabel}
      />

      <LgSection
        eyebrow="Executive summary"
        title="AI narrative"
        description={
          report.summarySource === 'vertex'
            ? 'Live summary generated from your full academic record — refreshes each view.'
            : 'Summary based on your latest academic metrics.'
        }
      >
        <LgNarrative
          note={
            report.summarySource === 'vertex' ? 'Live AI · not stored in database' : undefined
          }
        >
          {report.summary}
        </LgNarrative>
      </LgSection>

      <LgSection
        eyebrow="Key signals"
        title="Insight feed"
        description="Patterns surfaced from health, gaps, and readiness data."
      >
        <LgInsightFeed
          title="Today's insights"
          dateLabel="OVERALL PROFILE"
          rows={insightBullets.slice(0, 4).map((text, i) => ({
            tag: i === 0 ? 'Priority' : i === 1 ? 'Strength' : 'Watch',
            tagClass: i === 0 ? 'lg-tag-risk' : i === 1 ? 'lg-tag-up' : 'lg-tag-watch',
            content: text,
          }))}
        />
      </LgSection>

      <LgSection eyebrow="Subject health" title="Performance by subject" description="Health score across enrolled subjects.">
        <LgKpiRow
          items={report.subjectHealth.map((s) => ({
            value: `${s.health}%`,
            label: s.name,
          }))}
        />
      </LgSection>

      <LgSection eyebrow="Trends" title="Improvement & topic mastery">
        <div className="grid lg:grid-cols-2 gap-3">
          <div className="lg-chart-panel">
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[var(--lg-amber)] mb-2">
              Improvement trend
            </h4>
            {report.improvementTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={report.improvementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,26,21,0.12)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5b5748' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5b5748' }} />
                  <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--lg-slate)]">Trend appears after more assessments.</p>
            )}
          </div>
          <div className="lg-chart-panel">
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[var(--lg-amber)] mb-2">
              Topic mastery
            </h4>
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={topicChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,26,21,0.12)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5b5748' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5b5748' }} />
                  <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                    {topicChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--lg-slate)]">Topic breakdown appears after assessments.</p>
            )}
          </div>
        </div>
      </LgSection>

      {report.monthlyReports.length > 0 && (
        <LgSection eyebrow="History" title="Monthly snapshots">
          <LgBoardTable
            headers={['Period', 'Health', 'Readiness', 'Improvement']}
            rows={report.monthlyReports.map((m) => [
              m.period,
              `${m.health}/100`,
              `${m.readiness}%`,
              `+${m.improvement}%`,
            ])}
          />
        </LgSection>
      )}

      {report.recentAssessments.length > 0 && (
        <LgSection eyebrow="Assessments" title="Recent test results">
          <LgBoardTable
            headers={['Assessment', 'Date', 'Subject', 'Score']}
            rows={report.recentAssessments.map((a) => [
              a.title,
              a.date,
              a.subjectName,
              <span key={a.id} className="lg-mono font-semibold">{a.accuracy}%</span>,
            ])}
          />
        </LgSection>
      )}

      {report.recoveryPlan.length > 0 && (
        <LgSection eyebrow="Recovery" title="Personalized recovery plan">
          <LgNarrative>
            {recoveryDone} of {report.recoveryPlan.length} recovery steps completed (
            {Math.round((recoveryDone / report.recoveryPlan.length) * 100)}%).
          </LgNarrative>
        </LgSection>
      )}

      <LgFooter />
    </LgReportLayout>
  )
}
