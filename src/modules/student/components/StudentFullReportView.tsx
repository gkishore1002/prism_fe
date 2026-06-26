import type { ReactNode } from 'react'
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
import {
  getStudentWiseReport,
  studentProfile,
  monthlyReports,
  learningGaps,
  recoveryPlan,
  readinessPredictions,
  topicBreakdown,
  improvementTrend,
  aiDiagnosis,
  recentAssessments,
} from '@/data/mock'
import {
  parentComparative,
  parentBoardCoverage,
  parentSchoolExamReadiness,
  parentExplanation,
} from '@/data/parentMock'
import { useAuth } from '@/hooks/useAuth'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import { cn } from '@/lib/cn'

interface StudentFullReportViewProps {
  periodLabel: string
}

function PdfSection({
  number,
  title,
  children,
  className,
}: {
  number: string
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-8', className)}>
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
  const { user } = useAuth()
  const { getPlansForStudent } = useStudyPlans()
  const report = getStudentWiseReport(user.id) ?? getStudentWiseReport('stu-1')!
  const periodEntry = monthlyReports.find((r) => r.month === periodLabel)
  const activePlan = getPlansForStudent(user.id)[0]
  const planDone = activePlan?.days.filter((d) => d.done).length ?? 0
  const planPct = activePlan
    ? Math.round((planDone / activePlan.days.length) * 100)
    : 0

  const topicChartData = topicBreakdown.slice(0, 6).map((t) => ({
    name: t.topic.length > 14 ? `${t.topic.slice(0, 12)}…` : t.topic,
    mastery: t.score,
    fill: t.score >= 75 ? '#059669' : t.score >= 55 ? '#e8b820' : '#e11d48',
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
                Learnova Academic Intelligence
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
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink mb-3 font-display">
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
              <PdfMetric label="Peer band" value={parentComparative.band} sub={parentComparative.bandLabel} />
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground italic border-l-2 border-accent pl-3">
              {report.insight}
            </p>
          </div>

          <PdfSection number="01" title="AI diagnosis & prescription">
            <table className="w-full text-left border-collapse mb-4">
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 text-muted-foreground w-28 align-top font-semibold">Primary gap</td>
                  <td className="py-2 font-semibold text-ink">{aiDiagnosis.topic}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 text-muted-foreground align-top font-semibold">Finding</td>
                  <td className="py-2">{aiDiagnosis.finding}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 text-muted-foreground align-top font-semibold">Root cause</td>
                  <td className="py-2">{aiDiagnosis.cause}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground align-top font-semibold">Prescription</td>
                  <td className="py-2">
                    {aiDiagnosis.recommendation}
                    <span className="block text-leaf font-semibold mt-1 tabular-nums font-mono">
                      Expected lift: +{aiDiagnosis.expectedLift}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-secondary/50 border border-border rounded-md p-3">
              <p className="font-semibold text-ink text-xs">{parentExplanation.headline}</p>
              <p className="mt-1">{parentExplanation.body}</p>
              <ul className="mt-2 space-y-0.5 list-disc list-inside text-muted-foreground">
                {parentExplanation.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </PdfSection>

          <PdfSection number="02" title="Study plan progress">
            {activePlan ? (
              <>
                <p className="font-semibold text-ink">{activePlan.title}</p>
                <p className="text-muted-foreground mt-1">
                  {activePlan.subject} · Target {activePlan.baselineScore}% → {activePlan.targetScore}%
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${planPct}%` }} />
                  </div>
                  <span className="tabular-nums font-semibold text-ink text-xs shrink-0 font-mono">
                    {planDone}/{activePlan.days.length} days ({planPct}%)
                  </span>
                </div>
                <table className="w-full mt-4 border border-border rounded-md overflow-hidden text-[10px]">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border">
                      <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground w-12">Day</th>
                      <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground">Focus</th>
                      <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground w-16">Type</th>
                      <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground w-12">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePlan.days.map((d) => (
                      <tr key={d.id} className="border-b border-border last:border-0">
                        <td className="py-1.5 px-2 tabular-nums font-mono">{d.day}</td>
                        <td className="py-1.5 px-2">{d.focus}</td>
                        <td className="py-1.5 px-2">{d.type}</td>
                        <td className="py-1.5 px-2 text-right">{d.done ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-muted-foreground">No active study plan assigned for this period.</p>
            )}
          </PdfSection>

          <div className="grid sm:grid-cols-2 gap-8 mt-8 print:break-inside-avoid">
            <PdfSection number="03" title="Learning gaps" className="mt-0">
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
                        <p className="mt-0.5">{gap.recommendedAction}</p>
                      </td>
                      <td className="py-2 px-2 capitalize">{gap.severity}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-mono">+{gap.impactOnScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PdfSection>

            <PdfSection number="04" title="Recovery roadmap" className="mt-0">
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
            </PdfSection>
          </div>

          <PdfSection number="05" title="Exam readiness & topic mastery">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  Subject readiness
                </p>
                {readinessPredictions.map((r) => (
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
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {parentSchoolExamReadiness.map((exam) => (
                    <div
                      key={exam.subject}
                      className={cn(
                        'border rounded-md p-2 text-center',
                        exam.risk ? 'border-rose/30 bg-rose/5' : 'border-leaf/30 bg-leaf/5',
                      )}
                    >
                      <p className="text-[9px] text-muted-foreground">{exam.subject}</p>
                      <p className="font-bold text-ink tabular-nums font-mono">{exam.readiness}%</p>
                      {exam.risk && <p className="text-[9px] text-rose font-semibold">At risk</p>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  Topic scores
                </p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicChartData} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} fontSize={8} tick={{ fill: '#6e8499' }} />
                      <YAxis type="category" dataKey="name" width={72} fontSize={8} tick={{ fill: '#466080' }} />
                      <Bar dataKey="mastery" barSize={10}>
                        {topicChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2 text-[10px]">
                  <div>
                    <p className="font-bold text-leaf uppercase text-[9px] mb-1">Strong</p>
                    {report.strongTopics.map((t) => (
                      <p key={t} className="text-muted-foreground">
                        {t}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-rose uppercase text-[9px] mb-1">Weak</p>
                    {report.weakTopics.map((t) => (
                      <p key={t} className="text-muted-foreground">
                        {t}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PdfSection>

          <PdfSection number="06" title="Performance trend & peer comparison">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={improvementTrend}>
                      <CartesianGrid stroke="#e8e4dc" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={8} tick={{ fill: '#6e8499' }} />
                      <YAxis domain={[0, 100]} fontSize={8} tick={{ fill: '#6e8499' }} width={28} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#163a66"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#e8b820', stroke: '#163a66' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="border border-border rounded-md p-3 bg-secondary/40">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Peer comparison
                </p>
                <p className="text-xl font-bold text-ink font-display mt-1">{parentComparative.band}</p>
                <p className="text-[10px] text-muted-foreground">{parentComparative.bandLabel}</p>
                <table className="w-full mt-3 text-[10px]">
                  <tbody>
                    <tr>
                      <td className="text-muted-foreground py-0.5">Your average</td>
                      <td className="text-right font-bold tabular-nums font-mono">
                        {parentComparative.studentAverage}%
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground py-0.5">Institute avg.</td>
                      <td className="text-right font-bold tabular-nums font-mono">
                        {parentComparative.instituteAverage}%
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground py-0.5">Syllabus covered</td>
                      <td className="text-right font-bold tabular-nums font-mono">
                        {parentBoardCoverage.topicsCovered}%
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground py-0.5">Syllabus mastered</td>
                      <td className="text-right font-bold tabular-nums font-mono">
                        {parentBoardCoverage.topicsMastered}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </PdfSection>

          <PdfSection number="07" title="Recent assessments">
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
                      {a.weakTopics.length > 0 && (
                        <p className="text-rose mt-0.5">Weak: {a.weakTopics.join(', ')}</p>
                      )}
                    </td>
                    <td className="py-2 px-2">{a.date}</td>
                    <td className="py-2 px-2">{a.subjectName}</td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums font-mono">{a.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PdfSection>
        </div>

        <footer className="px-6 sm:px-10 py-5 border-t border-border bg-secondary/30 text-[9px] text-muted-foreground flex justify-between items-end">
          <div>
            <p className="font-semibold text-ink">Learnova · Confidential</p>
            <p className="mt-0.5">Generated from assessment data and AI analysis.</p>
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

export function findMonthBySlug(slug: string) {
  return monthlyReports.find((r) => monthToSlug(r.month) === slug)
}
