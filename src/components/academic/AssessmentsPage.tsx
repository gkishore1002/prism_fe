import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Shuffle,
  Radio,
  CheckCircle2,
  Trash2,
  ClipboardList,
  Info,
} from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AssessmentBuilder } from '@/components/academic/AssessmentBuilder'
import { AccessRequestsPanel } from '@/components/academic/AccessRequestsPanel'
import { ActionMenu, ActionMenuItem, ActionMenuLink } from '@/components/ui/ActionMenu'
import { Pagination } from '@/components/ui/Pagination'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { useAuth } from '@/hooks/useAuth'
import { centerLabelsForIds } from '@/lib/centerLabel'
import { DEFAULT_PAGE_LIMIT, pageCount, paginateItems } from '@/lib/pagination'
import type { InstitutionCenter, TutorAssessmentSchedule } from '@/types'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import { formatSubjects } from '@/lib/formatSubjects'
import { useAcademicYears } from '@/hooks/useAcademicYears'

const statusStyles: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground',
  scheduled: 'bg-accent/15 text-accent',
  live: 'bg-leaf/15 text-leaf',
  completed: 'bg-secondary text-foreground',
}

function centerLabel(ids: string[], centers: InstitutionCenter[]) {
  return centerLabelsForIds(ids, centers)
}

function studentNames(ids: string[], master: { id: string; name: string }[]) {
  return ids
    .map((id) => master.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(', ')
}

function sortNewestFirst(a: TutorAssessmentSchedule, b: TutorAssessmentSchedule) {
  const aKey = a.createdAt || a.scheduledAt || a.id
  const bKey = b.createdAt || b.scheduledAt || b.id
  return bKey.localeCompare(aKey)
}

interface AssessmentsPageProps {
  role?: 'tutor' | 'admin'
}

export function AssessmentsPage({ role = 'tutor' }: AssessmentsPageProps) {
  useAnalyticsPage(['tutorNames', 'adminStudents'])
  const canManage = role === 'tutor' || role === 'admin'
  const portalBase = `/${role}`
  const { assessments, addAssessment, removeAssessment, patchAssessment, refresh } = useAssessments()
  const { activeYearId } = useAcademicYears()

  useEffect(() => {
    void refresh()
  }, [refresh])
  const { confirm } = useConfirmModal()
  const { user } = useAuth()
  const { studentMaster } = useAnalytics()
  const { centers } = useCenters()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [infoAssessment, setInfoAssessment] = useState<TutorAssessmentSchedule | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [upcomingLimit, setUpcomingLimit] = useState(DEFAULT_PAGE_LIMIT)
  const [completedPage, setCompletedPage] = useState(1)
  const [completedLimit, setCompletedLimit] = useState(DEFAULT_PAGE_LIMIT)

  const liveNow = useMemo(
    () => assessments.filter((a) => a.status === 'live').sort(sortNewestFirst),
    [assessments],
  )
  const scheduledOnly = useMemo(
    () => assessments.filter((a) => a.status === 'scheduled').sort(sortNewestFirst),
    [assessments],
  )
  const upcomingAndLive = useMemo(
    () => [...liveNow, ...scheduledOnly],
    [liveNow, scheduledOnly],
  )
  const completed = useMemo(
    () => assessments.filter((a) => a.status === 'completed').sort(sortNewestFirst),
    [assessments],
  )

  const upcomingPages = pageCount(upcomingAndLive.length, upcomingLimit)
  const completedPages = pageCount(completed.length, completedLimit)
  const upcomingSlice = useMemo(
    () => paginateItems(upcomingAndLive, upcomingPage, upcomingLimit),
    [upcomingAndLive, upcomingPage, upcomingLimit],
  )
  const completedSlice = useMemo(
    () => paginateItems(completed, completedPage, completedLimit),
    [completed, completedPage, completedLimit],
  )

  useEffect(() => {
    if (upcomingPage > upcomingPages) setUpcomingPage(upcomingPages)
  }, [upcomingPage, upcomingPages])

  useEffect(() => {
    if (completedPage > completedPages) setCompletedPage(completedPages)
  }, [completedPage, completedPages])

  async function handleSave(draft: Partial<TutorAssessmentSchedule>) {
    if (!activeYearId) {
      setSaveMessage({ type: 'error', text: 'Select an academic year before scheduling an assessment.' })
      return
    }
    const newAssessment: TutorAssessmentSchedule = {
      id: `ta-${Date.now()}`,
      title: draft.title ?? 'New assessment',
      board: draft.board ?? 'CBSE',
      grade: draft.grade ?? 'Grade 8',
      subject: draft.subject ?? draft.subjects?.[0] ?? 'Mathematics',
      subjects: draft.subjects?.length
        ? draft.subjects
        : draft.subject
          ? [draft.subject]
          : ['Mathematics'],
      scope: draft.scope ?? 'topic',
      mode: draft.mode ?? 'assessment',
      batchName: draft.batchName ?? '',
      questionCount: draft.questionCount ?? 0,
      durationMinutes: draft.durationMinutes ?? 0,
      scheduledAt: draft.scheduledAt ?? '',
      availableUntil: draft.availableUntil ?? draft.scheduledAt ?? '',
      status: 'scheduled',
      centerIds: draft.centerIds ?? [],
      selectedQuestionIds: draft.selectedQuestionIds ?? [],
      assignedStudentIds: draft.assignedStudentIds ?? [],
      createdByTutorId: draft.createdByTutorId ?? user.id,
      questionPaperId: draft.questionPaperId,
      paperCoverage: draft.paperCoverage,
      selectedTopics: draft.selectedTopics,
      shuffleQuestions: draft.shuffleQuestions ?? false,
      topic: draft.topic,
      createdAt: new Date().toISOString(),
      academicYearId: activeYearId,
    }
    try {
      await addAssessment(newAssessment)
      setSaveMessage({ type: 'success', text: `Assessment “${newAssessment.title}” scheduled.` })
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to create assessment',
      })
      throw e
    }
  }

  function confirmDelete(assessment: TutorAssessmentSchedule) {
    void confirm({
      title: 'Delete assessment?',
      message: `Delete "${assessment.title}"? Students will no longer see this assessment.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    }).then((ok) => {
      if (ok) void removeAssessment(assessment.id)
    })
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment engine · Module 1"
        title="Assessments"
        sub={
          canManage
            ? 'Create board-wise exams from your question papers, assign students, set duration, and choose branches.'
            : 'View assessments.'
        }
        actions={
          canManage ? (
            <button
              type="button"
              onClick={() => setBuilderOpen(true)}
              className="btn btn-action"
            >
              <Plus className="w-4 h-4" /> Create assessment
            </button>
          ) : undefined
        }
      />

      {canManage && (
        <div className="mb-8">
          <AccessRequestsPanel scope={role} />
        </div>
      )}

      {canManage && (
        <AssessmentBuilder
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          onSave={handleSave}
          questionBankPath={`${portalBase}/question-bank`}
        />
      )}

      {saveMessage && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-sm ${
            saveMessage.type === 'success'
              ? 'border-leaf/30 bg-leaf/10 text-foreground'
              : 'border-rose/30 bg-rose/10 text-rose'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Live now" value={liveNow.length} hint="Students can start" tone="accent" />
        <AppStat label="Scheduled" value={scheduledOnly.length} hint="Waiting to go live" />
        <AppStat label="Completed" value={completed.length} hint="Sessions ended" />
      </div>

      <AppCard className="mb-6">
        <h3 className="font-display text-lg text-foreground mb-4">Upcoming & live</h3>
        <div className="space-y-2">
          {upcomingAndLive.length === 0 && (
            <p className="text-sm text-muted-foreground">No live or scheduled assessments.</p>
          )}
          {upcomingSlice.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 py-3 rounded-md border border-border hover:border-accent/30 transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">{assessment.title}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${statusStyles[assessment.status]}`}
                    >
                      {assessment.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {formatSubjects(assessment.subjects, assessment.subject)}
                    {assessment.batchName ? ` · ${assessment.batchName}` : ''}
                    {assessment.scheduledAt ? ` · ${assessment.scheduledAt}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoAssessment(assessment)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
                  aria-label={`About ${assessment.title}`}
                  title="About this assessment"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {assessment.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => void patchAssessment(assessment.id, { status: 'live' })}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium bg-leaf text-white hover:opacity-90"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Go live
                    </button>
                  )}
                  {assessment.status === 'live' && (
                    <button
                      type="button"
                      onClick={() => void patchAssessment(assessment.id, { status: 'completed' })}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium border border-border bg-card hover:bg-secondary/70"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark completed
                    </button>
                  )}
                  <ActionMenu label={`Actions for ${assessment.title}`}>
                    <ActionMenuLink to={`${portalBase}/assessments/${assessment.id}/paper`}>
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      Question paper
                    </ActionMenuLink>
                    <ActionMenuLink to={`${portalBase}/assessments/${assessment.id}/attendance`}>
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      Results
                    </ActionMenuLink>
                    <ActionMenuItem className="text-rose" onSelect={() => confirmDelete(assessment)}>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </ActionMenuItem>
                  </ActionMenu>
                </div>
              )}
            </div>
          ))}
        </div>
        <Pagination
          page={upcomingPage}
          pages={upcomingPages}
          total={upcomingAndLive.length}
          limit={upcomingLimit}
          itemLabel="assessments"
          onPageChange={setUpcomingPage}
          onLimitChange={(next) => {
            setUpcomingLimit(next)
            setUpcomingPage(1)
          }}
        />
      </AppCard>

      <AppCard>
        <h3 className="font-display text-lg text-foreground mb-4">Completed assessments</h3>
        <div className="space-y-2">
          {completed.length === 0 && (
            <p className="text-sm text-muted-foreground">No completed assessments yet.</p>
          )}
          {completedSlice.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 py-3 rounded-md border border-border hover:border-accent/30 transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">{assessment.title}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${statusStyles.completed}`}
                    >
                      completed
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {formatSubjects(assessment.subjects, assessment.subject)}
                    {assessment.batchName ? ` · ${assessment.batchName}` : ''}
                    {assessment.classAvg != null ? ` · avg ${assessment.classAvg}%` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoAssessment(assessment)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
                  aria-label={`About ${assessment.title}`}
                  title="About this assessment"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`${portalBase}/assessments/${assessment.id}/attendance`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium border border-border hover:bg-secondary/70"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  View results
                </Link>
                {canManage && (
                  <ActionMenu label={`Actions for ${assessment.title}`}>
                    <ActionMenuLink to={`${portalBase}/assessments/${assessment.id}/paper`}>
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      Question paper
                    </ActionMenuLink>
                    <ActionMenuItem className="text-rose" onSelect={() => confirmDelete(assessment)}>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </ActionMenuItem>
                  </ActionMenu>
                )}
              </div>
            </div>
          ))}
        </div>
        <Pagination
          page={completedPage}
          pages={completedPages}
          total={completed.length}
          limit={completedLimit}
          itemLabel="assessments"
          onPageChange={setCompletedPage}
          onLimitChange={(next) => {
            setCompletedLimit(next)
            setCompletedPage(1)
          }}
        />
      </AppCard>

      <AppModal
        open={Boolean(infoAssessment)}
        onClose={() => setInfoAssessment(null)}
        title={infoAssessment?.title ?? 'Assessment details'}
        description={
          infoAssessment
            ? `${infoAssessment.board} · ${infoAssessment.grade} · ${formatSubjects(infoAssessment.subjects, infoAssessment.subject)}`
            : undefined
        }
        size="md"
      >
        {infoAssessment && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[infoAssessment.status]}`}
                >
                  {infoAssessment.status}
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Batch</dt>
              <dd className="text-foreground text-right">{infoAssessment.batchName || '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Scope & mode</dt>
              <dd className="text-foreground text-right capitalize">
                {infoAssessment.scope} · {infoAssessment.mode}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Scheduled
              </dt>
              <dd className="text-foreground text-right">{infoAssessment.scheduledAt || '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Duration
              </dt>
              <dd className="text-foreground text-right">{infoAssessment.durationMinutes} min</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Questions</dt>
              <dd className="text-foreground text-right font-mono-data">
                {infoAssessment.questionCount}
                {infoAssessment.shuffleQuestions ? ' · shuffled' : ''}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Branches
              </dt>
              <dd className="text-foreground text-right max-w-[60%]">
                {centerLabel(infoAssessment.centerIds, centers)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Students
              </dt>
              <dd className="text-foreground text-right max-w-[60%]">
                {infoAssessment.assignedStudentIds.length} invited
                {infoAssessment.assignedStudentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {studentNames(infoAssessment.assignedStudentIds, studentMaster)}
                  </p>
                )}
              </dd>
            </div>
            {infoAssessment.classAvg != null && (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Class average</dt>
                <dd className="text-foreground text-right font-mono-data">{infoAssessment.classAvg}%</dd>
              </div>
            )}
            {infoAssessment.shuffleQuestions && (
              <div className="flex items-center gap-1.5 text-xs text-accent pt-1">
                <Shuffle className="w-3.5 h-3.5" />
                Question and option order is shuffled per student
              </div>
            )}
          </dl>
        )}
      </AppModal>
    </>
  )
}
