import { Link, useParams } from 'react-router-dom'
import { Clock, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { fetchAssessment } from '@/lib/api/assessmentsApi'
import { attendancePercentage } from '@/lib/api/mappers'
import type { TutorAssessmentSchedule } from '@/types'
import type { AssessmentAttendanceRecord } from '@/types'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { cn } from '@/lib/cn'

function exportAssessmentResultsCsv(
  assessmentTitle: string,
  records: AssessmentAttendanceRecord[],
) {
  const headers = ['Student ID', 'Student Name', 'Status', 'Score', 'Max Score', 'Percentage', 'Time (min)', 'Submitted At']
  const rows = records.map((r) => [
    r.studentId,
    r.studentName,
    r.status,
    r.score ?? '',
    r.maxScore ?? '',
    attendancePercentage(r) ?? '',
    r.timeSpentMin ?? '',
    r.submittedAt ?? '',
  ])
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prism-assessment-${assessmentTitle.replace(/\s+/g, '-').toLowerCase() || 'results'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const statusStyle = {
  attended: 'bg-leaf/15 text-leaf',
  absent: 'bg-rose/10 text-rose',
  pending: 'bg-secondary text-muted-foreground',
}

interface AssessmentAttendancePageProps {
  portal: 'admin' | 'tutor'
}

export function AssessmentAttendancePage({ portal }: AssessmentAttendancePageProps) {
  useAnalyticsPage('tutorNames')
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const { getAttendance } = useAssessments()
  const { tutorNames } = useAnalytics()
  const [assessment, setAssessment] = useState<TutorAssessmentSchedule | null>(null)
  const [records, setRecords] = useState<AssessmentAttendanceRecord[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const backPath = `/${portal}/assessments`

  useEffect(() => {
    if (!assessmentId) {
      setNotFound(true)
      setPageLoading(false)
      return
    }

    let cancelled = false
    setPageLoading(true)
    setNotFound(false)

    void (async () => {
      try {
        const [resolved, attendance] = await Promise.all([
          fetchAssessment(assessmentId),
          getAttendance(assessmentId),
        ])
        if (cancelled) return
        setAssessment(resolved)
        setRecords(attendance)
      } catch {
        if (!cancelled) {
          setNotFound(true)
          setAssessment(null)
          setRecords([])
        }
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [assessmentId, getAttendance])

  const attended = useMemo(
    () => records.filter((r) => r.status === 'attended'),
    [records],
  )
  const absent = useMemo(
    () => records.filter((r) => r.status === 'absent'),
    [records],
  )
  const pending = useMemo(
    () => records.filter((r) => r.status === 'pending'),
    [records],
  )
  const classAvg = useMemo(() => {
    const percentages = attended
      .map((r) => attendancePercentage(r))
      .filter((p): p is number => p != null)
    if (percentages.length === 0) return null
    return Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length)
  }, [attended])

  if (pageLoading) {
    return (
      <PageHeader
        title="Loading results…"
        actions={
          <Link to={backPath} className="text-sm text-accent hover:underline">
            Back to tests
          </Link>
        }
      />
    )
  }

  if (notFound || !assessment) {
    return (
      <PageHeader
        title="Assessment not found"
        actions={
          <Link to={backPath} className="text-sm text-accent hover:underline">
            Back to tests
          </Link>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Results & attendance"
        title={assessment.title}
        sub={`Created by ${tutorNames[assessment.createdByTutorId ?? ''] ?? 'Tutor'} · ${assessment.board} · ${assessment.grade} · ${assessment.batchName}`}
        actions={
          <div className="page-actions">
            <button
              type="button"
              onClick={() => exportAssessmentResultsCsv(assessment.title, records)}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 text-sm border border-border px-4 py-2.5 rounded-md hover:bg-secondary disabled:opacity-50 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <Link
              to={backPath}
              className="inline-flex items-center justify-center text-sm border border-border px-4 py-2.5 rounded-md hover:bg-secondary min-h-[44px]"
            >
              All tests
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <AppStat label="Invited" value={records.length} />
        <AppStat label="Attended" value={attended.length} tone="leaf" />
        <AppStat label="Absent" value={absent.length} tone="rose" />
        <AppStat label="Pending" value={pending.length} hint="Not yet submitted" />
        <AppStat
          label="Class avg"
          value={classAvg ?? assessment.classAvg ?? '—'}
          unit={classAvg != null || assessment.classAvg != null ? '%' : undefined}
          tone="accent"
        />
      </div>

      <AppCard className="p-0 overflow-hidden">
        <ResponsiveTable minWidth={560}>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Student</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Score</th>
              <th className="text-right px-5 py-3">Time</th>
              <th className="text-right px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.studentId} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{r.studentName}</td>
                <td className="px-5 py-4">
                  <span className={cn('text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full', statusStyle[r.status])}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono-data">
                  {r.score != null && r.maxScore ? (
                    <>
                      {r.score}/{r.maxScore}
                      <span className="text-muted-foreground text-xs ml-1">
                        ({attendancePercentage(r)}%)
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-4 text-right font-mono-data text-muted-foreground">
                  {r.timeSpentMin != null ? (
                    <span className="inline-flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {r.timeSpentMin}m
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                  {r.submittedAt ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </ResponsiveTable>
      </AppCard>
    </>
  )
}

export function AdminAssessmentAttendancePage() {
  return <AssessmentAttendancePage portal="admin" />
}

export function TutorAssessmentAttendancePage() {
  return <AssessmentAttendancePage portal="tutor" />
}