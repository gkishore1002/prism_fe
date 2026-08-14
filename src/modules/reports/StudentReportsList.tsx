import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Search, FileText, ClipboardCheck, CheckCircle2 } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Pagination } from '@/components/ui/Pagination'
import { ReportCollectionModal } from '@/components/academic/ReportCollectionModal'
import { btnClass } from '@/components/ui/Button'
import { fetchStudentsPaginated } from '@/lib/api/studentsApi'
import { isApiEnabled } from '@/lib/apiClient'
import { isCscUrgent } from '@/lib/cscPolicy'
import { useInstitutionPolicies } from '@/hooks/useInstitutionPolicies'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'
import type { ReportCollectionLog, StudentSummary } from '@/types'

interface StudentReportsListProps {
  reportPathPrefix: string
}

function formatCollectionDate(iso?: string | null): string {
  if (!iso) return 'Not recorded'
  const d = iso.slice(0, 10)
  const parsed = new Date(`${d}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function GuardianCollectionCell({
  student,
  onMarkCollected,
  warningDays,
}: {
  student: StudentSummary
  onMarkCollected: () => void
  warningDays: number
}) {
  const collected = Boolean(student.lastCscInteractionAt)

  if (collected) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-leaf">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Collected · {formatCollectionDate(student.lastCscInteractionAt)}
        </span>
        {student.lastCollectedByName && (
          <p className="text-[11px] text-muted-foreground">
            Logged by {student.lastCollectedByName}
            {student.lastCollectionGuardianName ? ` · Guardian: ${student.lastCollectionGuardianName}` : ''}
          </p>
        )}
        {student.daysUntilCscDisable != null && (
          <p
            className={`text-[10px] uppercase tracking-wide ${
              isCscUrgent(student.daysUntilCscDisable, warningDays) ? 'text-rose' : 'text-muted-foreground'
            }`}
          >
            {student.daysUntilCscDisable}d until next CSC visit
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Not recorded yet</p>
      <button
        type="button"
        className={`${btnClass.secondary} text-xs px-2.5 py-1 inline-flex items-center gap-1`}
        onClick={onMarkCollected}
      >
        <ClipboardCheck className="w-3.5 h-3.5" />
        Mark collected
      </button>
    </div>
  )
}

export function StudentReportsList({ reportPathPrefix }: StudentReportsListProps) {
  const { policies } = useInstitutionPolicies()
  const warningDays = policies?.csc.warningThresholdDays ?? 14
  const inactivityDays = policies?.csc.inactivityThresholdDays ?? 90
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [collectionStudent, setCollectionStudent] = useState<StudentSummary | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await fetchStudentsPaginated({
        page,
        limit,
        search: debouncedSearch || undefined,
      })
      setStudents(data.items)
      setTotal(data.total)
      setPages(data.pages)
      if (data.items.length === 0 && data.total > 0 && page > 1) {
        setPage(data.pages)
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load students')
      setStudents([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  function handleCollectionSaved(log: ReportCollectionLog) {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === log.studentId
          ? {
              ...s,
              lastCscInteractionAt: log.collectedAt.slice(0, 10),
              daysUntilCscDisable: inactivityDays,
              lastCollectedByName: log.collectedByName,
              lastCollectionGuardianName: log.guardianName ?? undefined,
            }
          : s,
      ),
    )
  }

  if (loading && students.length === 0 && !fetchError) {
    return <PageLoader label="Loading students…" />
  }

  const showCollection = isApiEnabled()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-md bg-secondary/40 border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search students…"
          className="text-sm outline-none bg-transparent w-full"
        />
      </div>

      <AppCard className="p-0 overflow-hidden">
        {fetchError ? (
          <p className="text-sm text-rose px-5 py-4">{fetchError}</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-4">
            No students yet. Add students under Students or Curriculum Setup.
          </p>
        ) : (
          <div className={loading ? 'opacity-60 pointer-events-none' : undefined}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[920px]">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Batch · Board</th>
                    <th className="text-left px-5 py-3">Health</th>
                    <th className="text-right px-5 py-3">Readiness</th>
                    {showCollection && (
                      <th className="text-left px-5 py-3">Guardian collected</th>
                    )}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-5 py-4 font-medium">{s.name}</td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {s.batch ?? '—'}
                        <br />
                        {s.board} · {s.grade}
                      </td>
                      <td className="px-5 py-4">
                        <HealthBadge status={s.status} score={s.health} />
                      </td>
                      <td className="px-5 py-4 text-right font-mono-data">{s.readiness}%</td>
                      {showCollection && (
                        <td className="px-5 py-4">
                          <GuardianCollectionCell
                            student={s}
                            warningDays={warningDays}
                            onMarkCollected={() => setCollectionStudent(s)}
                          />
                        </td>
                      )}
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`${reportPathPrefix}/${s.id}/reports`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View reports
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="px-5 pb-4">
          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(next) => {
              setLimit(next)
              setPage(1)
            }}
          />
        </div>
      </AppCard>

      {collectionStudent && (
        <ReportCollectionModal
          open
          studentId={collectionStudent.id}
          studentName={collectionStudent.name}
          onClose={() => setCollectionStudent(null)}
          onSaved={(log) => {
            handleCollectionSaved(log)
            setCollectionStudent(null)
          }}
        />
      )}
    </div>
  )
}
