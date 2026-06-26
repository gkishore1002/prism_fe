import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Clock, MapPin, Users, FileText } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AssessmentBuilder } from '@/components/academic/AssessmentBuilder'
import { institutionCenters, studentMasterProfiles } from '@/data/mock'
import { useAssessments } from '@/hooks/useAssessments'
import type { TutorAssessmentSchedule } from '@/types'

const statusStyles: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground',
  scheduled: 'bg-accent/15 text-accent',
  live: 'bg-leaf/15 text-leaf',
  completed: 'bg-secondary text-foreground',
}

function centerLabel(ids: string[]) {
  if (ids.length === 0 || ids.length === institutionCenters.length) return 'All branches'
  return ids
    .map((id) => institutionCenters.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(', ')
}

function studentNames(ids: string[]) {
  return ids
    .map((id) => studentMasterProfiles.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(', ')
}

interface AssessmentsPageProps {
  role?: 'tutor' | 'admin'
}

export function AssessmentsPage({ role = 'tutor' }: AssessmentsPageProps) {
  const { assessments, addAssessment } = useAssessments()
  const [builderOpen, setBuilderOpen] = useState(false)

  const scheduled = assessments.filter((a) => a.status === 'scheduled' || a.status === 'live')
  const completed = assessments.filter((a) => a.status === 'completed')
  const avgClassScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.classAvg ?? 0), 0) / completed.length)
      : 0

  function handleSave(draft: Partial<TutorAssessmentSchedule>) {
    const newAssessment: TutorAssessmentSchedule = {
      id: `ta-${Date.now()}`,
      title: draft.title ?? 'New assessment',
      board: draft.board ?? 'CBSE',
      grade: draft.grade ?? 'Grade 8',
      subject: draft.subject ?? 'Mathematics',
      scope: draft.scope ?? 'topic',
      mode: draft.mode ?? 'assessment',
      batchName: draft.batchName ?? 'Batch A',
      questionCount: draft.questionCount ?? 0,
      durationMinutes: draft.durationMinutes ?? 45,
      scheduledAt: draft.scheduledAt ?? new Date().toISOString().slice(0, 10),
      status: 'scheduled',
      centerIds: draft.centerIds ?? [],
      selectedQuestionIds: draft.selectedQuestionIds ?? [],
      assignedStudentIds: draft.assignedStudentIds ?? [],
      createdByTutorId: draft.createdByTutorId ?? 'tut-1',
      questionPaperId: draft.questionPaperId,
      paperCoverage: draft.paperCoverage,
      selectedTopics: draft.selectedTopics,
      topic: draft.topic,
    }
    addAssessment(newAssessment)
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment engine · Module 1"
        title="Assessments"
        sub={
          role === 'tutor'
            ? 'Create board-wise exams from your question papers, assign students, set duration, and choose branches.'
            : 'View tutor-created assessments.'
        }
        actions={
          role === 'tutor' ? (
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

      {role === 'tutor' && (
        <AssessmentBuilder
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          onSave={handleSave}
          questionBankPath="/tutor/question-bank"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="This Month" value={assessments.length} hint="Assessments created" />
        <AppStat label="Avg Class Score" value={avgClassScore} unit="%" tone="leaf" />
        <AppStat label="Upcoming" value={scheduled.length} hint="Scheduled or live" tone="accent" />
      </div>

      <AppCard className="mb-6">
        <h3 className="font-display text-lg text-foreground mb-4">Upcoming & live</h3>
        <div className="space-y-3">
          {scheduled.map((assessment) => (
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
                  {centerLabel(assessment.centerIds)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {assessment.assignedStudentIds.length} students invited
                  {assessment.assignedStudentIds.length > 0 && (
                    <span className="text-foreground/70">
                      — {studentNames(assessment.assignedStudentIds)}
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
                {role === 'tutor' && (
                  <Link
                    to={`/tutor/assessments/${assessment.id}/paper`}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Question paper
                  </Link>
                )}
                {role === 'tutor' && (
                  <button type="button" className="text-accent hover:underline">
                    Edit
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
                    {centerLabel(assessment.centerIds)}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{assessment.scheduledAt}</td>
                  <td className="py-3 font-mono-data">{assessment.classAvg}%</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      {role === 'tutor' && (
                        <Link
                          to={`/tutor/assessments/${assessment.id}/paper`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <FileText className="w-3 h-3" />
                          Question paper
                        </Link>
                      )}
                      <button type="button" className="text-xs text-muted-foreground hover:underline text-left">
                        Class report
                      </button>
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
