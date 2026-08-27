import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Clock, MapPin, Users, FileText, Shuffle } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AssessmentBuilder } from '@/components/academic/AssessmentBuilder'
import { AccessRequestsPanel } from '@/components/academic/AccessRequestsPanel'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { useAuth } from '@/hooks/useAuth'
import { centerLabelsForIds } from '@/lib/centerLabel'
import type { InstitutionCenter, TutorAssessmentSchedule } from '@/types'
import { useConfirmModal } from '@/components/ui/AppModal'

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

interface AssessmentsPageProps {
  role?: 'tutor' | 'admin'
}

export function AssessmentsPage({ role = 'tutor' }: AssessmentsPageProps) {
  useAnalyticsPage(['tutorNames', 'adminStudents'])
  const canManage = role === 'tutor' || role === 'admin'
  const portalBase = `/${role}`
  const { assessments, addAssessment, removeAssessment, patchAssessment, ensureLoaded } = useAssessments()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])
  const { confirm } = useConfirmModal()
  const { user } = useAuth()
  const { studentMaster } = useAnalytics()
  const { centers } = useCenters()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  const liveNow = assessments.filter((a) => a.status === 'live')
  const scheduledOnly = assessments.filter((a) => a.status === 'scheduled')
  const upcomingAndLive = [...liveNow, ...scheduledOnly]
  const completed = assessments.filter((a) => a.status === 'completed')

  async function handleSave(draft: Partial<TutorAssessmentSchedule>) {
    const newAssessment: TutorAssessmentSchedule = {
      id: `ta-${Date.now()}`,
      title: draft.title ?? 'New assessment',
      board: draft.board ?? 'CBSE',
      grade: draft.grade ?? 'Grade 8',
      subject: draft.subject ?? 'Mathematics',
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
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
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
        <div className="space-y-3">
          {upcomingAndLive.length === 0 && (
            <p className="text-sm text-muted-foreground">No live or scheduled assessments.</p>
          )}
          {upcomingAndLive.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border border-border hover:border-accent/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{assessment.title}</p>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[assessment.status]}`}
                  >
                    {assessment.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {assessment.board} · {assessment.grade} · {assessment.subject} ·{' '}
                  {assessment.batchName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {assessment.scope} scope · {assessment.mode} mode ·{' '}
                  {assessment.questionCount} questions
                </p>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {centerLabel(assessment.centerIds, centers)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {assessment.assignedStudentIds.length} students invited
                  {assessment.assignedStudentIds.length > 0 && (
                    <span className="text-foreground/70">
                      — {studentNames(assessment.assignedStudentIds, studentMaster)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {assessment.scheduledAt}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {assessment.durationMinutes} min
                </span>
                {assessment.shuffleQuestions && (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Shuffle className="w-3.5 h-3.5" />
                    Shuffled
                  </span>
                )}
                {canManage && (
                  <Link
                    to={`${portalBase}/assessments/${assessment.id}/paper`}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Question paper
                  </Link>
                )}
                {canManage && assessment.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => void patchAssessment(assessment.id, { status: 'live' })}
                    className="text-leaf font-medium hover:underline"
                  >
                    Go live
                  </button>
                )}
                {canManage && assessment.status === 'live' && (
                  <button
                    type="button"
                    onClick={() => void patchAssessment(assessment.id, { status: 'completed' })}
                    className="text-muted-foreground hover:underline"
                  >
                    Mark completed
                  </button>
                )}
                {(role === 'tutor' || role === 'admin') && (
                  <Link
                    to={`${portalBase}/assessments/${assessment.id}/attendance`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Results
                  </Link>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      void confirm({
                        title: 'Delete assessment?',
                        message: `Delete "${assessment.title}"? Students will no longer see this assessment.`,
                        confirmLabel: 'Delete',
                        variant: 'danger',
                      }).then((ok) => {
                        if (ok) void removeAssessment(assessment.id)
                      })
                    }}
                    className="text-rose hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard>
        <h3 className="font-display text-lg text-foreground mb-4">Completed assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Assessment</th>
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Invited</th>
                <th className="pb-3 font-medium">Questions</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Branches</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Class avg</th>
                <th className="pb-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completed.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-secondary/30">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{assessment.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {assessment.mode} · {assessment.subject}
                    </p>
                  </td>
                  <td className="py-3 text-muted-foreground">{assessment.batchName}</td>
                  <td className="py-3 font-mono-data">{assessment.assignedStudentIds.length}</td>
                  <td className="py-3 font-mono-data">{assessment.questionCount}</td>
                  <td className="py-3 font-mono-data">{assessment.durationMinutes}m</td>
                  <td className="py-3 text-xs text-muted-foreground max-w-[120px]">
                    {centerLabel(assessment.centerIds, centers)}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{assessment.scheduledAt}</td>
                  <td className="py-3 font-mono-data">{assessment.classAvg}%</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      {canManage && (
                        <Link
                          to={`${portalBase}/assessments/${assessment.id}/paper`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <FileText className="w-3 h-3" />
                          Question paper
                        </Link>
                      )}
                      <Link
                        to={`${portalBase}/assessments/${assessment.id}/attendance`}
                        className="text-xs text-accent hover:underline text-left"
                      >
                        View results
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>
    </>
  )
}