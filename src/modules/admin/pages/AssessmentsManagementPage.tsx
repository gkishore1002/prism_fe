import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { institutionCenters, tutorNameById, getAttendanceForAssessment } from '@/data/mock'
import { useAssessments } from '@/hooks/useAssessments'

function centerLabel(ids: string[]) {
  if (ids.length === 0 || ids.length === institutionCenters.length) return 'All branches'
  return ids
    .map((id) => institutionCenters.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(', ')
}

export function AdminAssessmentsManagementPage() {
  const { assessments } = useAssessments()

  const rows = assessments
    .filter((a) => a.status !== 'draft')
    .map((a) => {
      const attendance = getAttendanceForAssessment(a.id, a.assignedStudentIds)
      const attended = attendance.filter((r) => r.status === 'attended').length
      const absent = attendance.filter((r) => r.status === 'absent').length
      const pending = attendance.filter((r) => r.status === 'pending').length
      return { assessment: a, attendance, attended, absent, pending }
    })

  const totalAttended = rows.reduce((n, r) => n + r.attended, 0)
  const totalAbsent = rows.reduce((n, r) => n + r.absent, 0)

  return (
    <>
      <PageHeader
        eyebrow="Owner · Test oversight"
        title="Assessments & attendance"
        sub="View-only. Tutors create assessments and question papers — you monitor who was invited, who attended, and class outcomes."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Tutor tests" value={rows.length} hint="Institute-wide" />
        <AppStat label="Students attended" value={totalAttended} tone="leaf" />
        <AppStat label="Absent" value={totalAbsent} tone="rose" />
        <AppStat label="Live / upcoming" value={rows.filter((r) => r.assessment.status !== 'completed').length} tone="accent" />
      </div>

      <AppCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Assessment</th>
              <th className="text-left px-5 py-3">Tutor</th>
              <th className="text-left px-5 py-3">Batch · Board</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-right px-5 py-3">Invited</th>
              <th className="text-right px-5 py-3">Attended</th>
              <th className="text-right px-5 py-3">Absent</th>
              <th className="text-right px-5 py-3">Class avg</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ assessment: a, attended, absent, pending }) => (
              <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                <td className="px-5 py-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {a.subject} · {a.mode} · {a.status}
                  </p>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {tutorNameById[a.createdByTutorId ?? 'tut-1'] ?? 'Tutor'}
                </td>
                <td className="px-5 py-4 text-muted-foreground text-xs">
                  {a.batchName}
                  <br />
                  {a.board} · {a.grade}
                  <br />
                  {centerLabel(a.centerIds)}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{a.scheduledAt}</td>
                <td className="px-5 py-4 text-right font-mono-data">{a.assignedStudentIds.length}</td>
                <td className="px-5 py-4 text-right font-mono-data text-leaf">{attended}</td>
                <td className="px-5 py-4 text-right font-mono-data text-rose">{absent}</td>
                <td className="px-5 py-4 text-right font-mono-data">
                  {a.classAvg != null ? `${a.classAvg}%` : pending > 0 ? '—' : '—'}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/admin/assessments/${a.id}/attendance`}
                    className="text-xs text-accent hover:underline"
                  >
                    Who attended
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>

      <AppCard className="mt-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p>
            Assessments, question papers, and question uploads are created by tutors only. Owners manage
            students, view attendance, and institute-wide outcomes from this console.
          </p>
        </div>
      </AppCard>
    </>
  )
}
