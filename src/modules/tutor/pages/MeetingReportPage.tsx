import { useState } from 'react'
import { Download, Loader2, Printer, Share2 } from 'lucide-react'
import { PageLoader } from '@/components/ui/PrismLoader'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCurriculum } from '@/hooks/useCurriculum'
import {
  downloadReportPdf,
  shareReportPdf,
} from '@/modules/reports/learningGenome/printReport'

const MEETING_REPORT_ROOT_ID = 'meeting-report-print-root'

export function TutorMeetingReportPage({ embedded = false }: { embedded?: boolean }) {
  useAnalyticsPage('studentReports')
  const { loading, studentProfile, improvementTrend, studentReport } = useAnalytics()
  const { students } = useCurriculum()
  const [busy, setBusy] = useState(false)
  const student = studentProfile ?? (students[0] ? {
    name: students[0].name,
    board: students[0].board ?? 'CBSE',
    grade: students[0].grade,
    batch: students[0].batch ?? '—',
    healthScore: students[0].health,
    improvement: 0,
  } : null)

  if (loading) {
    return <PageLoader />
  }

  if (!student) {
    return (
      <>
        {!embedded && <PageHeader title="Meeting report" sub="No student data available." />}
        <AppCard><p className="text-sm text-muted-foreground">Select a student to generate a meeting report.</p></AppCard>
      </>
    )
  }

  const exportTitle = `Meeting report — ${student.name}`

  async function runExport(kind: 'print' | 'download' | 'share') {
    if (busy && kind !== 'print') return
    if (kind === 'print') {
      const prev = document.title
      document.title = exportTitle
      window.print()
      window.setTimeout(() => {
        document.title = prev
      }, 500)
      return
    }
    setBusy(true)
    try {
      if (kind === 'share') {
        await shareReportPdf({ title: exportTitle, rootId: MEETING_REPORT_ROOT_ID })
      } else {
        await downloadReportPdf({ title: exportTitle, rootId: MEETING_REPORT_ROOT_ID })
      }
    } finally {
      setBusy(false)
    }
  }

  const exportActions = (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => void runExport('print')}
        disabled={busy}
        className="btn btn-secondary gap-2 px-3 py-2 text-sm disabled:opacity-50"
      >
        <Printer className="w-4 h-4" /> Print
      </button>
      <button
        type="button"
        onClick={() => void runExport('share')}
        disabled={busy}
        className="btn btn-secondary gap-2 px-3 py-2 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        Share
      </button>
      <button
        type="button"
        onClick={() => void runExport('download')}
        disabled={busy}
        className="btn btn-primary gap-2 px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download PDF
      </button>
    </div>
  )

  return (
    <>
      {!embedded ? (
        <PageHeader
          eyebrow="Parent–Tutor Meeting"
          title="Meeting report"
          sub="One-click PDF that saves prep time. Everything a parent needs in 30 seconds."
          actions={exportActions}
        />
      ) : (
        <div className="flex justify-end mb-4">{exportActions}</div>
      )}

      <div id={MEETING_REPORT_ROOT_ID}>
      <AppCard className="max-w-3xl mx-auto p-12">
        <div className="border-b border-ink pb-4 mb-6">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Parent–Tutor Meeting Report · {new Date().toLocaleDateString('en-IN')}
          </div>
          <div className="font-display text-4xl mt-2">{student.name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {student.board} · Grade {student.grade} · {student.batch}
          </div>
        </div>

        <div className="metric-chip-grid gap-4 sm:gap-6 mb-8">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Current score
            </div>
            <div className="font-mono-data text-2xl sm:text-3xl mt-1">{studentReport?.avgAccuracy ?? '—'}%</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Health
            </div>
            <div className="font-mono-data text-2xl sm:text-3xl mt-1">
              {'healthScore' in student ? student.healthScore : studentReport?.health ?? '—'}
              <span className="text-base text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Improvement
            </div>
            <div className="font-mono-data text-3xl text-leaf mt-1">
              +{'improvement' in student ? student.improvement : studentReport?.improvement ?? 0}%
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            6-month trend
          </div>
          {improvementTrend.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={improvementTrend}>
                  <CartesianGrid stroke="oklch(0.88 0.018 85)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={10} stroke="oklch(0.48 0.02 250)" />
                  <YAxis fontSize={10} stroke="oklch(0.48 0.02 250)" domain={[0, 100]} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="oklch(0.20 0.025 250)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trend data yet.</p>
          )}
        </div>

        {studentReport && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-leaf mb-2">Strengths</div>
              <ul className="text-sm space-y-1">
                {studentReport.strongTopics.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-rose mb-2">Weak areas</div>
              <ul className="text-sm space-y-1">
                {studentReport.weakTopics.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-ink pt-4">
          <div className="text-[10px] uppercase tracking-widest text-accent mb-2">
            Tutor recommendation
          </div>
          <p className="text-sm leading-relaxed">
            {studentReport?.insight ?? 'Review recovery plan progress and schedule a follow-up assessment.'}
          </p>
        </div>
      </AppCard>
      </div>
    </>
  )
}
