import { useState } from 'react'
import {
  Mail,
  MapPin,
  CalendarClock,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  StudentActivityTimeline,
  countPendingReassignments,
} from '@/components/academic/StudentActivityTimeline'
import {
  AccessRequestStatusBadge,
  accessRequestTheme,
} from '@/lib/accessRequestTheme'
import { isCscUrgent, formatCscInactivityLabel } from '@/lib/cscPolicy'
import { useInstitutionPolicies } from '@/hooks/useInstitutionPolicies'
import type { StudentMasterProfile, StudentTracking, StudentAccessRequest } from '@/types'

type ProfileTab = 'overview' | 'academic' | 'assessments' | 'csc' | 'activity'

interface StudentProfileViewProps {
  student: StudentMasterProfile
  tracking: StudentTracking | null
  trackingLoading?: boolean
  trackingError?: string | null
  batchLabel: string
  centerLabel: string
  scope: 'tutor' | 'admin'
  onReviewRequest?: (req: StudentAccessRequest) => void
}

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'academic', label: 'Academic' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'csc', label: 'CSC' },
  { id: 'activity', label: 'Activity' },
]

function StatCard({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: React.ReactNode
  emphasis?: boolean
}) {
  const toneClass = emphasis
    ? `${accessRequestTheme.cardActive} border`
    : 'border-border bg-secondary/20'

  return (
    <div className={`rounded-lg px-3 py-2.5 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  )
}

function formatDate(iso?: string | null): string {
  if (!iso) return 'Not recorded'
  const d = iso.slice(0, 10)
  const parsed = new Date(`${d}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function StudentProfileView({
  student,
  tracking,
  trackingLoading,
  trackingError,
  batchLabel,
  centerLabel,
  scope,
  onReviewRequest,
}: StudentProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>('overview')
  const { policies } = useInstitutionPolicies()

  const warningDays = policies?.csc.warningThresholdDays ?? 14
  const inactivityDays = policies?.csc.inactivityThresholdDays ?? 90

  const examCount = tracking?.examAttendances.length ?? 0
  const collectionCount = tracking?.reportCollections.length ?? 0
  const pendingReassignments = countPendingReassignments(tracking)
  const missedExams = tracking?.examAttendances.filter((e) => e.status === 'absent').length ?? 0
  const attendedExams = tracking?.examAttendances.filter((e) => e.status !== 'absent') ?? []
  const avgAccuracy =
    attendedExams.length > 0
      ? Math.round(attendedExams.reduce((n, e) => n + e.accuracyPct, 0) / attendedExams.length)
      : null

  const cscEmphasis = isCscUrgent(student.daysUntilCscDisable, warningDays)

  return (
    <div className="space-y-5">
      {pendingReassignments > 0 && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${accessRequestTheme.cardActive}`}>
          <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${accessRequestTheme.icon}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <AccessRequestStatusBadge status="pending" className="mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {pendingReassignments} reassignment request{pendingReassignments > 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review from the Activity tab or Assessments → Reassignment requests.
            </p>
          </div>
        </div>
      )}

      {student.disableReason === 'csc_inactivity' && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${accessRequestTheme.card}`}>
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Account disabled — {formatCscInactivityLabel(inactivityDays)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark report collected on the Student reports page to reactivate.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm rounded-t-md transition ${
              tab === t.id
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-secondary/15 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{student.name}</h2>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      student.status === 'active' ? accessRequestTheme.badge : accessRequestTheme.badgeEmphasis
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {student.board} · {student.grade}
                  {batchLabel !== '—' ? ` · ${batchLabel}` : ''}
                </p>
              </div>
              <p className="text-[11px] font-mono-data text-muted-foreground">{student.id}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <StatCard label="Exams attended" value={trackingLoading ? '…' : examCount} />
              <StatCard label="Exams missed" value={trackingLoading ? '…' : missedExams} emphasis={missedExams > 0} />
              <StatCard
                label="Reassign pending"
                value={trackingLoading ? '…' : pendingReassignments}
                emphasis={pendingReassignments > 0}
              />
              <StatCard label="Report collections" value={trackingLoading ? '…' : collectionCount} />
              <StatCard
                label="CSC countdown"
                value={
                  student.daysUntilCscDisable != null
                    ? `${student.daysUntilCscDisable} days left`
                    : 'No visit yet'
                }
                emphasis={cscEmphasis}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-start gap-2.5 py-1.5">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Branch</p>
                <p className="text-foreground">{centerLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 py-1.5">
              <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Academic year</p>
                <p className="text-foreground">{student.academicYear || '—'}</p>
              </div>
            </div>
            {student.email && (
              <div className="flex items-start gap-2.5 py-1.5">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="text-foreground break-all">{student.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'academic' && (
        <div className="space-y-4">
          <AppCardSection title="Enrollment">
            <InfoRow label="Board" value={student.board} />
            <InfoRow label="Grade" value={student.grade} />
            <InfoRow label="Batch" value={batchLabel} />
            {student.schoolName && <InfoRow label="School" value={student.schoolName} />}
          </AppCardSection>
          <AppCardSection title="Exam performance">
            {trackingLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : attendedExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed exams yet.</p>
            ) : (
              <>
                <InfoRow label="Exams taken" value={String(attendedExams.length)} />
                <InfoRow label="Average accuracy" value={avgAccuracy != null ? `${avgAccuracy}%` : '—'} />
              </>
            )}
          </AppCardSection>
        </div>
      )}

      {tab === 'assessments' && (
        <div className="space-y-3">
          {trackingLoading ? (
            <p className="text-sm text-muted-foreground">Loading assessments…</p>
          ) : !tracking?.examAttendances.length ? (
            <p className="text-sm text-muted-foreground">No assessment history yet.</p>
          ) : (
            tracking.examAttendances.map((exam) => (
              <div key={`${exam.assessmentId}-${exam.submittedAt}`} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.assessmentTitle}</p>
                    <p className="text-xs text-muted-foreground">{exam.subject}</p>
                  </div>
                  <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-secondary">{exam.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(exam.submittedAt)}
                  {exam.status !== 'absent' && ` · ${exam.accuracyPct}% · ${exam.score}/${exam.maxScore}`}
                </p>
              </div>
            ))
          )}
          {tracking?.accessRequests.length ? (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-2">Reassignment requests</h4>
              {tracking.accessRequests.map((req) => (
                <div key={req.id} className="text-sm py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{req.assessmentTitle}</span>
                    <AccessRequestStatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {tab === 'csc' && (
        <div className="space-y-4">
          <AppCardSection title="Visit status">
            <InfoRow label="Last CSC visit" value={formatDate(student.lastCscInteractionAt)} />
            <InfoRow
              label="Days until disable"
              value={
                student.daysUntilCscDisable != null
                  ? `${student.daysUntilCscDisable} days (threshold: ${inactivityDays})`
                  : 'Not started — no visit recorded yet'
              }
              urgent={cscEmphasis}
            />
            <InfoRow label="Urgent warning when" value={`${warningDays} days or fewer remaining`} />
            {tracking?.lastCollectedByName && (
              <InfoRow label="Last collected by" value={tracking.lastCollectedByName} />
            )}
          </AppCardSection>
          <AppCardSection title="Collection history">
            {trackingLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !tracking?.reportCollections.length ? (
              <p className="text-sm text-muted-foreground">No collections logged yet.</p>
            ) : (
              tracking.reportCollections.map((log) => (
                <div key={log.id} className="py-2 border-b border-border last:border-0 text-sm">
                  <p className="font-medium">{formatDate(log.collectedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    By {log.collectedByName}
                    {log.guardianName ? ` · Guardian: ${log.guardianName}` : ''}
                  </p>
                </div>
              ))
            )}
          </AppCardSection>
        </div>
      )}

      {tab === 'activity' && (
        <div>
          <p className="text-xs text-muted-foreground mb-4">
            Exams, reassignment requests, and CSC collections — newest first.
          </p>
          {trackingError ? (
            <p className="text-sm text-rose">{trackingError}</p>
          ) : (
            <StudentActivityTimeline
              tracking={tracking}
              loading={trackingLoading}
              canReview={scope === 'tutor' || scope === 'admin'}
              onReviewRequest={onReviewRequest}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AppCardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  urgent = false,
}: {
  label: string
  value: string
  urgent?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={urgent ? 'font-medium text-rose' : 'font-medium text-foreground'}>{value}</span>
    </div>
  )
}
