import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AccessRequestsPanel } from '@/components/academic/AccessRequestsPanel'
import { Pagination } from '@/components/ui/Pagination'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { centerLabelsForIds } from '@/lib/centerLabel'
import { DEFAULT_PAGE_LIMIT, pageCount, paginateItems } from '@/lib/pagination'
import type { InstitutionCenter, TutorAssessmentSchedule } from '@/types'

function centerLabel(ids: string[], centers: InstitutionCenter[]) {
  return centerLabelsForIds(ids, centers)
}

export function AdminAssessmentsManagementPage() {
  useAnalyticsPage('tutorNames')
  const { assessments, loading, error, ensureLoaded } = useAssessments()
  const { tutorNames } = useAnalytics()
  const { centers } = useCenters()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const rows = useMemo(
    () => assessments.filter((a) => a.status !== 'draft'),
    [assessments],
  )
  const totalInvited = rows.reduce((n, a) => n + a.assignedStudentIds.length, 0)
  const pages = pageCount(rows.length, limit)
  const pageRows = useMemo(() => paginateItems(rows, page, limit), [rows, page, limit])

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

  return (
    <>
      <PageHeader
        eyebrow="Owner · Test oversight"
        title="Assessments & results"
        sub="Monitor tests institute-wide and review late-exam reassignment requests."
      />

      <div className="mb-8">
        <AccessRequestsPanel scope="admin" />
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Tutor tests" value={rows.length} hint="Institute-wide" />
        <AppStat label="Students invited" value={totalInvited} tone="leaf" />
        <AppStat label="Live / upcoming" value={rows.filter((a) => a.status !== 'completed').length} tone="accent" />
        <AppStat label="Completed" value={rows.filter((a) => a.status === 'completed').length} />
      </div>

      <AppCard className="p-0 overflow-hidden">
        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">Loading assessments…</p>
        ) : error ? (
          <p className="text-sm text-rose p-5">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No assessments yet.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Assessment</th>
                  <th className="text-left px-5 py-3">Tutor</th>
                  <th className="text-left px-5 py-3">Batch · Board</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Invited</th>
                  <th className="text-right px-5 py-3">Class avg</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((a: TutorAssessmentSchedule) => (
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-5 py-4">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {a.subject} · {a.mode} · {a.status}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {tutorNames[a.createdByTutorId ?? ''] ?? 'Tutor'}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      {a.batchName}
                      <br />
                      {a.board} · {a.grade}
                      <br />
                      {centerLabel(a.centerIds, centers)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{a.scheduledAt}</td>
                    <td className="px-5 py-4 text-right font-mono-data">{a.assignedStudentIds.length}</td>
                    <td className="px-5 py-4 text-right font-mono-data">
                      {a.classAvg != null ? `${a.classAvg}%` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/assessments/${a.id}/attendance`}
                        className="text-xs text-accent hover:underline"
                      >
                        View results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 pb-4">
              <Pagination
                page={page}
                pages={pages}
                total={rows.length}
                limit={limit}
                itemLabel="assessments"
                onPageChange={setPage}
                onLimitChange={(next) => {
                  setLimit(next)
                  setPage(1)
                }}
              />
            </div>
          </>
        )}
      </AppCard>

      <AppCard className="mt-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p>
            Assessments, question papers, and question uploads are created by tutors only. Owners manage
            students, view attendance, and institute-wide outcomes from this console. Open an assessment to
            see attendance and per-student results.
          </p>
        </div>
      </AppCard>
    </>
  )
}
