import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, FileBarChart2, RefreshCw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { SegmentedTab, SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { useConfirmModal } from '@/components/ui/AppModal'
import {
  fetchMarksSessionStandings,
  fetchMarksSessions,
  type MarksActivitySessionApi,
  type MarksSessionStandings,
} from '@/lib/api/marksApi'
import { deleteStudent } from '@/lib/api/curriculumApi'
import { cn } from '@/lib/cn'

type ReportsSubTab = 'overall' | 'consolidated'

interface MarksAcademicReportsProps {
  batches: { id: string; name: string; board: string; grade: string }[]
  initialBatchId?: string
  scope?: 'tutor' | 'admin'
}

export function MarksAcademicReports({
  batches,
  initialBatchId = '',
  scope = 'tutor',
}: MarksAcademicReportsProps) {
  const { confirm } = useConfirmModal()
  const [subTab, setSubTab] = useState<ReportsSubTab>('consolidated')
  const [batchId, setBatchId] = useState(initialBatchId)
  const [sessions, setSessions] = useState<MarksActivitySessionApi[]>([])
  const [sessionId, setSessionId] = useState('')
  const [standings, setStandings] = useState<MarksSessionStandings | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null)

  const batchOptions = useMemo(
    () =>
      batches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.grade}`,
      })),
    [batches],
  )

  const sessionOptions = useMemo(
    () =>
      sessions.map((s) => ({
        value: s.sessionId,
        label: `${s.assessmentTitle} · ${s.status ?? 'published'}`,
      })),
    [sessions],
  )

  const loadSessions = useCallback(async (nextBatchId: string) => {
    if (!nextBatchId) {
      setSessions([])
      setSessionId('')
      setStandings(null)
      return
    }
    setLoadingSessions(true)
    setError(null)
    try {
      const rows = await fetchMarksSessions(nextBatchId)
      setSessions(rows)
      setSessionId((prev) => {
        if (prev && rows.some((r) => r.sessionId === prev)) return prev
        return rows[0]?.sessionId ?? ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam sessions.')
      setSessions([])
      setSessionId('')
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadStandings = useCallback(async (nextSessionId: string) => {
    if (!nextSessionId) {
      setStandings(null)
      return
    }
    setLoadingStandings(true)
    setError(null)
    try {
      setStandings(await fetchMarksSessionStandings(nextSessionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings.')
      setStandings(null)
    } finally {
      setLoadingStandings(false)
    }
  }, [])

  useEffect(() => {
    if (!batchId && batches[0]?.id) {
      setBatchId(batches[0].id)
      return
    }
    void loadSessions(batchId)
  }, [batchId, batches, loadSessions])

  useEffect(() => {
    void loadStandings(sessionId)
  }, [sessionId, loadStandings])

  async function handleDeleteStudent(studentId: string, studentName: string) {
    const ok = await confirm({
      title: 'Delete student permanently?',
      message: `Delete ${studentName} and all of their marks, enrollments, and reports? This cannot be undone.`,
      confirmLabel: 'Delete student',
      variant: 'danger',
    })
    if (!ok) return
    setBusyStudentId(studentId)
    setError(null)
    try {
      await deleteStudent(studentId)
      await loadStandings(sessionId)
      await loadSessions(batchId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Student delete failed.')
    } finally {
      setBusyStudentId(null)
    }
  }

  return (
    <AppCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <FileBarChart2 className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg text-foreground">Academic reports</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadSessions(batchId)
            void loadStandings(sessionId)
          }}
          className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-xs hover:bg-secondary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Rankings and totals from published mark sheets for the selected class.
      </p>

      <SegmentedTabs aria-label="Academic report views" className="mb-4">
        <SegmentedTab active={subTab === 'overall'} onClick={() => setSubTab('overall')}>
          Overall performance
        </SegmentedTab>
        <SegmentedTab
          active={subTab === 'consolidated'}
          onClick={() => setSubTab('consolidated')}
        >
          Consolidated exams
        </SegmentedTab>
      </SegmentedTabs>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-full sm:w-56">
          <AppDropdown
            label="Class"
            value={batchId || null}
            onChange={setBatchId}
            options={batchOptions}
            placeholder="Select class…"
          />
        </div>
        {subTab === 'consolidated' && (
          <div className="w-full sm:w-72">
            <AppDropdown
              label="Exam"
              value={sessionId || null}
              onChange={setSessionId}
              options={sessionOptions}
              placeholder={loadingSessions ? 'Loading…' : 'Select exam…'}
              disabled={!batchId || loadingSessions || sessionOptions.length === 0}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
          {error}
        </div>
      )}

      {subTab === 'overall' && (
        <div className="rounded-lg border border-border px-4 py-8 text-sm text-muted-foreground text-center">
          {batchId ? (
            <>
              Open a student&apos;s Learning Genome for class rank and exam history with per-exam
              ranks.{' '}
              <Link to={`/${scope}/students`} className="text-accent font-medium hover:underline">
                Go to students
              </Link>
            </>
          ) : (
            'Select a class to continue.'
          )}
        </div>
      )}

      {subTab === 'consolidated' && (
        <>
          {loadingSessions || loadingStandings ? (
            <div className="rounded-lg border border-border py-10 flex justify-center">
              <InlineLoader label="Loading consolidated rankings…" size="sm" />
            </div>
          ) : !sessionId || !standings ? (
            <div className="rounded-lg border border-border py-10 text-center text-sm text-muted-foreground">
              {batchId
                ? 'No published exams for this class yet. Publish marks from Manual entry or Upload.'
                : 'Select a class to view consolidated exams.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="text-left font-medium px-3 py-2">Student</th>
                    <th className="text-left font-medium px-3 py-2">Admission #</th>
                    <th className="text-right font-medium px-3 py-2">Total</th>
                    <th className="text-right font-medium px-3 py-2">%</th>
                    <th className="text-center font-medium px-3 py-2">Grade</th>
                    <th className="text-center font-medium px-3 py-2">Division</th>
                    <th className="text-center font-medium px-3 py-2">Rank</th>
                    <th className="text-center font-medium px-3 py-2">Result</th>
                    <th className="text-left font-medium px-3 py-2">Updated</th>
                    <th className="text-right font-medium px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.students.map((row) => (
                    <tr key={row.studentId} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-foreground">{row.studentName}</td>
                      <td className="px-3 py-2.5 font-mono-data text-xs text-muted-foreground">
                        {row.admissionNo || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-data">
                        {row.maxTotal > 0 ? `${row.total}/${row.maxTotal}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-data">
                        {row.maxTotal > 0 ? `${row.percentage}%` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">{row.grade || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">
                        {row.division || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-data font-semibold">
                        {row.rank != null ? `#${row.rank}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded text-[11px] font-medium',
                            row.result === 'Pass'
                              ? 'bg-leaf/15 text-leaf'
                              : 'bg-rose/15 text-rose',
                          )}
                        >
                          {row.result || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {row.updatedAt ? row.updatedAt.slice(0, 10) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/${scope}/students/${row.studentId}/report`}
                            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                            title="View report"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={busyStudentId === row.studentId}
                            onClick={() =>
                              void handleDeleteStudent(row.studentId, row.studentName)
                            }
                            className="p-1.5 rounded-md text-rose/80 hover:bg-rose/10 hover:text-rose disabled:opacity-40"
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppCard>
  )
}
