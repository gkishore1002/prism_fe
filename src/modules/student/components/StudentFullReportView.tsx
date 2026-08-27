import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ReportLoader } from '@/components/ui/PrismLoader'
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
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { studentInsightBullets } from '@/lib/analyticsInsights'
import { cn } from '@/lib/cn'

interface StudentFullReportViewProps {
  periodLabel: string
}

function PdfSection({
  number,
  title,
  children,
  className,
  id,
}: {
  number: string
  title: string
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section className={cn('mt-8', className)} id={id}>
      <div className="flex items-baseline gap-3 border-b border-ink/20 pb-1.5 mb-4">
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{number}</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink font-display">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function PdfMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-border px-3 py-2.5 text-center flex-1 min-w-0 bg-card">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
      <p className="text-lg font-bold text-ink font-mono tabular-nums mt-0.5 leading-none">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export function StudentFullReportView({ periodLabel }: StudentFullReportViewProps) {
  useAnalyticsPage('studentReports')
  const {
    loading,
    studentProfile,
    studentReport,
    monthlyReports,
    studentHealth,
    learningGaps,
    recoveryPlan,
    readiness,
    topicBreakdown,
    improvementTrend,
    recentAssessments,
  } = useAnalytics()

  if (loading) {
    return <ReportLoader label="Building monthly progress report…" />
  }

  if (!studentReport || !studentProfile) {
    return <p className="text-sm text-muted-foreground p-4">Report data unavailable.</p>
  }

  const report = studentReport
  const periodEntry = monthlyReports.find((r) => r.period === periodLabel)
  const recoveryDone = recoveryPlan.filter((s) => s.completed).length
  const recoveryPct = recoveryPlan.length
    ? Math.round((recoveryDone / recoveryPlan.length) * 100)
    : 0

  const topicChartData = topicBreakdown.slice(0, 6).map((t) => ({
    name: t.topic.length > 14 ? `${t.topic.slice(0, 12)}…` : t.topic,
    mastery: t.currentMastery ?? t.mastery,
    predicted: t.predictedScore ?? t.mastery,
    fill: (t.predictedScore ?? t.mastery) >= 75 ? '#0CBF6E' : (t.predictedScore ?? t.mastery) >= 55 ? '#F7B731' : '#FF6B6B',
  }))

  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="report-paper-canvas print:py-0">
      <article className="report-paper mx-auto w-full max-w-[210mm] bg-card border border-border rounded-lg shadow-sm overflow-hidden print:shadow-none print:max-w-none print:rounded-none">
        <header className="px-6 sm:px-10 pt-8 pb-6 border-b-2 border-ink bg-gradient-to-br from-accent/10 via-card to-secondary/30">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-accent font-semibold">
                Prism Academic Intelligence
              </p>
              <h1 className="font-display text-2xl sm:text-[26px] font-bold text-ink mt-2 leading-tight">
                Monthly Progress Report
              </h1>
              <p className="text-sm text-muted-foreground mt-2">{periodLabel}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Report ID</p>
              <p className="text-xs font-mono text-ink mt-0.5">
                LN-{periodLabel.replace(/\s/g, '').slice(0, 3).toUpperCase()}-2026
              </p>
              <p className="text-[9px] text-muted-foreground mt-3">Generated {generatedOn}</p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Student</p>
              <p className="font-semibold text-ink">{studentProfile.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {studentProfile.board} · Grade {studentProfile.grade}
              </p>
              <p className="text-muted-foreground text-xs">{studentProfile.batch}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
              <p className="font-semibold text-ink capitalize">{report.status}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Avg accuracy {report.avgAccuracy}% · {report.criticalGaps} critical gap
                {report.criticalGaps !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 sm:px-10 py-8 text-[11px] leading-relaxed text-foreground">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink mb-3 font-display" id="executive">
              Executive summary
            </p>
            <div className="flex flex-wrap gap-0">
              <PdfMetric label="Health score" value={`${periodEntry?.health ?? report.health}`} sub="/ 100" />
              <PdfMetric
                label="Readiness"
                value={`${periodEntry?.readiness ?? report.readiness}%`}
                sub="Exam ready"
              />
              <PdfMetric
                label="Improvement"
                value={`+${periodEntry?.improvement ?? report.improvement}%`}
                sub="This month"
              />
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground italic border-l-2 border-accent pl-3">
              {report.insight}
            </p>
            <Link to="/student/reports/overall" className="text-[10px] text-accent hover:underline mt-2 inline-block">
              View full overall performance report →
            </Link>
          </div>

          <PdfSection number="01" title="Diagnosis & prescription">
            <AnalyticsInsightsCard
              title="Key insights"
              bullets={studentInsightBullets(studentHealth, learningGaps, readiness)}
            />
          </PdfSection>

          <PdfSection number="02" title="Recovery plan progress">
            {recoveryPlan.length > 0 ? (
              <>
                <p className="font-semibold text-ink">Personalized recovery steps</p>
                <p className="text-muted-foreground mt-1">
                  {recoveryDone} of {recoveryPlan.length} steps completed this period
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${recoveryPct}%` }} />
                  </div>
                  <span className="tabular-nums font-semibold text-ink text-xs shrink-0 font-mono">
                    {recoveryPct}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No recovery steps recorded for this period.</p>
            )}
          </PdfSection>

          <div className="grid sm:grid-cols-2 gap-8 mt-8 print:break-inside-avoid">
            <PdfSection number="03" title="Learning gaps" className="mt-0">
              {learningGaps.length === 0 ? (
                <p className="text-muted-foreground">No gaps recorded.</p>
              ) : (
                <table className="w-full border border-border rounded-md overflow-hidden text-[10px]">
                  <thead>
                    <tr className="bg-secondary/60">
                      <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground">
                        Topic
                      </th>
                      <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-14">
                        Sev.
                      </th>
                      <th className="text-right py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-12">
                        Lift
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {learningGaps.map((gap) => (
                      <tr key={gap.id} className="border-b border-border last:border-0 align-top">
                        <td className="py-2 px-2">
                          <p className="font-semibold text-ink">{gap.topicName}</p>
                          <p className="text-muted-foreground mt-0.5">{gap.rootCause}</p>
                        </td>
                        <td className="py-2 px-2 capitalize">{gap.severity}</td>
                        <td className="py-2 px-2 text-right tabular-nums font-mono">+{gap.impactOnScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </PdfSection>

            <PdfSection number="04" title="Recovery roadmap" className="mt-0">
              {recoveryPlan.length === 0 ? (
                <p className="text-muted-foreground">No recovery steps.</p>
              ) : (
                <ol className="space-y-2 list-none">
                  {recoveryPlan.map((step, i) => (
                    <li
                      key={step.id}
                      className={cn(
                        'flex gap-2 border-l-2 pl-3',
                        step.completed ? 'border-leaf/40 opacity-70' : 'border-accent',
                      )}
                    >
                      <span className="font-bold text-ink tabular-nums shrink-0 w-4 font-mono">{i + 1}.</span>
                      <div className={cn(step.completed && 'line-through')}>
                        <p className="font-semibold text-ink">{step.action}</p>
                        <p className="text-muted-foreground">
                          {step.topicName} · {step.estimatedHours}h · +{step.expectedGain}%
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </PdfSection>
          </div>

          <PdfSection number="05" title="Exam readiness & topic mastery" id="readiness">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  Subject readiness
                </p>
                {readiness.map((r) => (
                  <div key={r.subjectId} className="mb-2.5">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="font-semibold">{r.subjectName}</span>
                      <span className="tabular-nums font-mono">
                        {r.currentReadiness}% → {r.projectedReadiness}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-ink rounded-full" style={{ width: `${r.currentReadiness}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">
                      Confidence {r.confidenceLevel}
                      {r.examDate ? ` · exam ${r.examDate}` : ''}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                {topicBreakdown.length > 0 && (
                  <>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                      Topic predictive readiness
                    </p>
                    <table className="w-full border border-border rounded-md overflow-hidden text-[10px] mb-3">
                      <thead>
                        <tr className="bg-secondary/60">
                          <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground">
                            Topic
                          </th>
                          <th className="text-right py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-14">
                            Now
                          </th>
                          <th className="text-right py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-16">
                            Likely
                          </th>
                          <th className="text-right py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-14">
                            Conf.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topicBreakdown.slice(0, 6).map((t) => (
                          <tr key={t.topicId ?? t.topic} className="border-b border-border last:border-0">
                            <td className="py-1.5 px-2">
                              <p className="font-semibold text-ink">{t.topic}</p>
                              <p className="text-muted-foreground">{t.subject}</p>
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums font-mono">
                              {t.currentMastery ?? t.mastery}%
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums font-mono font-semibold">
                              {t.predictedScore ?? t.mastery}%
                              {typeof t.delta === 'number' && t.delta !== 0 && (
                                <span className={cn('ml-1', t.delta > 0 ? 'text-leaf' : 'text-rose')}>
                                  {t.delta > 0 ? '+' : ''}
                                  {t.delta}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right capitalize text-muted-foreground">
                              {t.confidence ?? 'low'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {topicChartData.length > 0 && (
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topicChartData} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
                            <XAxis type="number" domain={[0, 100]} fontSize={8} tick={{ fill: '#94A3B8' }} />
                            <YAxis type="category" dataKey="name" width={72} fontSize={8} tick={{ fill: '#64748B' }} />
                            <Bar dataKey="mastery" barSize={8} name="Mastery">
                              {topicChartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Bar>
                            <Bar dataKey="predicted" barSize={8} fill="#C5A059" name="Predicted" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
                <div className="grid grid-cols-2 gap-3 mt-2 text-[10px]">
                  <div>
                    <p className="font-bold text-leaf uppercase text-[9px] mb-1">Strong</p>
                    {report.strongTopics.map((t) => (
                      <p key={t} className="text-muted-foreground">{t}</p>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-rose uppercase text-[9px] mb-1">Weak</p>
                    {report.weakTopics.map((t) => (
                      <p key={t} className="text-muted-foreground">{t}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PdfSection>

          <PdfSection number="06" title="Performance trend">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                {improvementTrend.length > 0 ? (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={improvementTrend}>
                        <CartesianGrid stroke="#EEEDEA" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" fontSize={8} tick={{ fill: '#94A3B8' }} />
                        <YAxis domain={[0, 100]} fontSize={8} tick={{ fill: '#94A3B8' }} width={28} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#C5A059"
                          strokeWidth={2}
                          dot={{ r: 2, fill: '#E8D5A3', stroke: '#C5A059' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No trend data.</p>
                )}
              </div>
              <AnalyticsInsightsCard
                title="Readiness outlook"
                bullets={[
                  ...readiness.map((row) => {
                    const by = row.examDate ? ` by ${row.examDate}` : ' if tested soon'
                    return `${row.subjectName}: ${row.currentReadiness}% → ${row.projectedReadiness}%${by} (${row.confidenceLevel} confidence).`
                  }),
                  ...topicBreakdown.slice(0, 3).map((t) => {
                    const pred = t.predictedScore ?? t.mastery
                    const now = t.currentMastery ?? t.mastery
                    const drivers = (t.drivers ?? []).slice(0, 2).join(', ')
                    return `${t.topic}: ${now}% mastery → ${pred}% predicted${drivers ? ` · ${drivers}` : ''}.`
                  }),
                ]}
              />
            </div>
          </PdfSection>

          <PdfSection number="07" title="Recent assessments">
            {recentAssessments.length === 0 ? (
              <p className="text-muted-foreground">No recent assessments.</p>
            ) : (
              <table className="w-full border border-border rounded-md overflow-hidden text-[10px]">
                <thead>
                  <tr className="bg-secondary/60">
                    <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground">
                      Assessment
                    </th>
                    <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-20">
                      Date
                    </th>
                    <th className="text-left py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-20">
                      Subject
                    </th>
                    <th className="text-right py-1.5 px-2 border-b border-border font-semibold text-muted-foreground w-14">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssessments.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 align-top">
                      <td className="py-2 px-2">
                        <p className="font-semibold text-ink">{a.title}</p>
                        <p className="text-muted-foreground mt-0.5">{a.insight}</p>
                      </td>
                      <td className="py-2 px-2">{a.date}</td>
                      <td className="py-2 px-2">{a.subjectName}</td>
                      <td className="py-2 px-2 text-right font-bold tabular-nums font-mono">{a.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PdfSection>
        </div>

        <footer className="px-6 sm:px-10 py-5 border-t border-border bg-secondary/30 text-[9px] text-muted-foreground flex justify-between items-end">
          <div>
            <p className="font-semibold text-ink">Prism · Confidential</p>
            <p className="mt-0.5">Generated from assessment data.</p>
          </div>
          <p className="tabular-nums font-mono">Page 1 of 1</p>
        </footer>
      </article>
    </div>
  )
}

export function monthToSlug(month: string) {
  return month.toLowerCase().replace(/\s+/g, '-')
}

export function findMonthBySlug(slug: string, reports: { period: string }[]) {
  return reports.find((r) => monthToSlug(r.period) === slug)
}