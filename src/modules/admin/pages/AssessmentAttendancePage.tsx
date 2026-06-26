import { Link, useParams } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { getAttendanceForAssessment, tutorNameById } from '@/data/mock'
import { useAssessments } from '@/hooks/useAssessments'
import { cn } from '@/lib/cn'

const statusStyle = {
  attended: 'bg-leaf/15 text-leaf',
  absent: 'bg-rose/10 text-rose',
  pending: 'bg-secondary text-muted-foreground',
}

export function AdminAssessmentAttendancePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const { assessments } = useAssessments()
  const assessment = assessments.find((a) => a.id === assessmentId)

  if (!assessment) {
    return (
      <PageHeader
        title="Assessment not found"
        actions={
          <Link to="/admin/assessments" className="text-sm text-accent hover:underline">
            Back to tests
          </Link>
        }
      />
    )
  }

  const records = getAttendanceForAssessment(assessment.id, assessment.assignedStudentIds)
  const attended = records.filter((r) => r.status === 'attended')
  const absent = records.filter((r) => r.status === 'absent')
  const pending = records.filter((r) => r.status === 'pending')

  return (
    <>
      <PageHeader
        eyebrow="Attendance register"
        title={assessment.title}
        sub={`Created by ${tutorNameById[assessment.createdByTutorId ?? 'tut-1'] ?? 'Tutor'} · ${assessment.board} · ${assessment.grade} · ${assessment.batchName}`}
        actions={
          <Link
            to="/admin/assessments"
            className="text-sm border border-border px-4 py-2 rounded-md hover:bg-secondary"
          >
            All tests
          </Link>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Invited" value={records.length} />
        <AppStat label="Attended" value={attended.length} tone="leaf" />
        <AppStat label="Absent" value={absent.length} tone="rose" />
        <AppStat label="Pending" value={pending.length} hint="Not yet submitted" />
      </div>

      <AppCard className="p-0 overflow-hidden">
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
                  {r.score != null ? `${r.score}%` : '—'}
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
      </AppCard>
    </>
  )
}
