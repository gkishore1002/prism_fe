import {
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
} from 'lucide-react'
import { btnClass } from '@/components/ui/Button'
import {
  AccessRequestStatusBadge,
  accessRequestTheme,
  formatAccessRequestDate,
} from '@/lib/accessRequestTheme'
import type {
  ReportCollectionLog,
  StudentExamAttendance,
  StudentAccessRequest,
  StudentTracking,
} from '@/types'

type TimelineEvent =
  | {
      id: string
      kind: 'exam'
      emphasis: boolean
      at: string
      sortKey: number
      exam: StudentExamAttendance
    }
  | {
      id: string
      kind: 'collection'
      emphasis: false
      at: string
      sortKey: number
      log: ReportCollectionLog
    }
  | {
      id: string
      kind: 'reassignment'
      emphasis: boolean
      at: string
      sortKey: number
      req: StudentAccessRequest
    }

const timelineTheme = {
  dot: accessRequestTheme.dot,
  ring: 'ring-accent/15',
  card: accessRequestTheme.card,
  cardActive: accessRequestTheme.cardActive,
  badge: accessRequestTheme.badge,
  badgeEmphasis: accessRequestTheme.badgeEmphasis,
  line: 'bg-border',
  iconBg: accessRequestTheme.icon,
}

function parseSortKey(iso: string): number {
  const raw = iso.length <= 10 ? `${iso.slice(0, 10)}T12:00:00` : iso
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

function formatEventDate(iso: string): string {
  const parsed = new Date(iso.length <= 10 ? `${iso.slice(0, 10)}T12:00:00` : iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatEventTime(iso: string): string | null {
  if (iso.length <= 10) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function reportKindLabel(kind: string): string {
  if (kind === 'assessment') return 'Assessment report'
  if (kind === 'overall') return 'Overall performance report'
  return 'Monthly report'
}

function buildEvents(tracking: StudentTracking): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...tracking.examAttendances.map((exam) => ({
      id: `exam-${exam.assessmentId}-${exam.submittedAt}`,
      kind: 'exam' as const,
      emphasis: exam.status === 'pending',
      at: exam.submittedAt,
      sortKey: parseSortKey(exam.submittedAt),
      exam,
    })),
    ...tracking.reportCollections.map((log) => ({
      id: `collection-${log.id}`,
      kind: 'collection' as const,
      emphasis: false as const,
      at: log.collectedAt,
      sortKey: parseSortKey(log.collectedAt),
      log,
    })),
    ...(tracking.accessRequests ?? []).map((req) => ({
      id: `reassign-${req.id}`,
      kind: 'reassignment' as const,
      emphasis: req.status === 'pending',
      at: req.reviewedAt ?? req.requestedAt,
      sortKey: parseSortKey(req.reviewedAt ?? req.requestedAt),
      req,
    })),
  ]
  return events.sort((a, b) => b.sortKey - a.sortKey)
}

function EventBadge({ label, emphasis }: { label: string; emphasis?: boolean }) {
  const badgeClass = emphasis ? timelineTheme.badgeEmphasis : timelineTheme.badge
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
    >
      {label}
    </span>
  )
}

interface TimelineNodeProps {
  event: TimelineEvent
  isLast: boolean
  canReview?: boolean
  onReviewRequest?: (req: StudentAccessRequest) => void
}

function TimelineNode({ event, isLast, canReview, onReviewRequest }: TimelineNodeProps) {
  const cardClass = event.emphasis ? timelineTheme.cardActive : timelineTheme.card
  const timeLabel = formatEventTime(event.at)

  let Icon = GraduationCap
  let eyebrow = 'Activity'
  let title = ''
  let badge = 'Record'

  if (event.kind === 'exam') {
    Icon = event.exam.status === 'absent' ? UserX : GraduationCap
    eyebrow =
      event.exam.status === 'absent'
        ? 'Exam missed'
        : event.exam.status === 'pending'
          ? 'Exam pending'
          : 'Exam completed'
    title = event.exam.assessmentTitle
    badge =
      event.exam.status === 'absent'
        ? 'Absent'
        : event.exam.status === 'pending'
          ? 'Pending'
          : 'Attended'
  } else if (event.kind === 'collection') {
    Icon = ClipboardCheck
    eyebrow = 'Report collected'
    title = reportKindLabel(event.log.reportKind)
    badge = 'CSC visit'
  } else {
    Icon =
      event.req.status === 'approved'
        ? CheckCircle2
        : event.req.status === 'rejected'
          ? XCircle
          : Clock
    eyebrow =
      event.req.status === 'approved'
        ? 'Reassignment approved'
        : event.req.status === 'rejected'
          ? 'Reassignment rejected'
          : 'Reassignment requested'
    title = event.req.assessmentTitle
    badge =
      event.req.status === 'approved'
        ? 'Approved'
        : event.req.status === 'rejected'
          ? 'Rejected'
          : 'Awaiting tutor'
  }

  return (
    <li className="relative pl-10 pb-8 last:pb-0">
      {!isLast && (
        <span className={`absolute left-[11px] top-7 bottom-0 w-px ${timelineTheme.line}`} aria-hidden />
      )}
      <span
        className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${timelineTheme.dot} ${timelineTheme.ring}`}
      >
        <Icon className="w-3 h-3 text-accent-foreground" strokeWidth={2.5} />
      </span>

      <div className={`rounded-lg border px-3.5 py-3 shadow-sm ${cardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
              {event.kind === 'reassignment' ? (
                <AccessRequestStatusBadge status={event.req.status} emphasis={event.emphasis} />
              ) : (
                <EventBadge label={badge} emphasis={event.emphasis} />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-foreground">{formatEventDate(event.at)}</p>
            {timeLabel && <p className="text-[10px] text-muted-foreground">{timeLabel}</p>}
          </div>
        </div>

        {event.kind === 'exam' && (
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {event.exam.subject && <span>{event.exam.subject}</span>}
            {event.exam.status === 'attended' && (
              <>
                <span>
                  Score{' '}
                  <span className="font-mono-data text-foreground">
                    {event.exam.score}/{event.exam.maxScore}
                  </span>
                </span>
                <span>
                  Accuracy{' '}
                  <span className="font-mono-data font-medium text-foreground">
                    {event.exam.accuracyPct}%
                  </span>
                </span>
              </>
            )}
            {event.exam.timeSpentMin > 0 && event.exam.status === 'attended' && (
              <span>{event.exam.timeSpentMin} min</span>
            )}
          </div>
        )}

        {event.kind === 'collection' && (
          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
            <p>
              Logged by{' '}
              <span className="text-foreground font-medium">{event.log.collectedByName}</span>
            </p>
            {event.log.guardianName && (
              <p>
                Guardian:{' '}
                <span className="text-foreground font-medium">{event.log.guardianName}</span>
              </p>
            )}
            {event.log.notes && (
              <p className="italic border-l-2 border-border pl-2 mt-1.5">{event.log.notes}</p>
            )}
          </div>
        )}

        {event.kind === 'reassignment' && (
          <div className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
            {event.req.reason && (
              <p className="border-l-2 border-border pl-2">
                <span className="font-medium text-foreground/80">Reason: </span>
                {event.req.reason}
              </p>
            )}
            {event.req.status === 'approved' && event.req.accessGrantedUntil && (
              <p>
                Access until{' '}
                <span className="text-foreground font-medium">
                  {formatAccessRequestDate(event.req.accessGrantedUntil)}
                </span>
              </p>
            )}
            {event.req.reviewedByName && event.req.status !== 'pending' && (
              <p>
                Reviewed by{' '}
                <span className="text-foreground font-medium">{event.req.reviewedByName}</span>
              </p>
            )}
            {event.req.reviewNotes && (
              <p className="italic">{event.req.reviewNotes}</p>
            )}
            {canReview && event.req.status === 'pending' && onReviewRequest && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onReviewRequest(event.req)}
                  className={`${btnClass.primary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5 ${accessRequestTheme.approveBtn}`}
                >
                  Review request
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function TimelineLegend() {
  const items = ['Exam attended', 'CSC collection', 'Reassignment', 'Pending review']
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.map((label) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${timelineTheme.badge}`}
        >
          <span className={`w-2 h-2 rounded-full ${timelineTheme.dot}`} />
          {label}
        </span>
      ))}
    </div>
  )
}

interface StudentActivityTimelineProps {
  tracking: StudentTracking | null
  loading?: boolean
  canReview?: boolean
  onReviewRequest?: (req: StudentAccessRequest) => void
}

export function StudentActivityTimeline({
  tracking,
  loading,
  canReview,
  onReviewRequest,
}: StudentActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading activity…
      </div>
    )
  }

  if (!tracking) {
    return null
  }

  const events = buildEvents(tracking)

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Exams, reassignment requests, and CSC collections appear here.
        </p>
      </div>
    )
  }

  return (
    <>
      <TimelineLegend />
      <ol className="relative m-0 list-none p-0">
        {events.map((event, index) => (
          <TimelineNode
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
            canReview={canReview}
            onReviewRequest={onReviewRequest}
          />
        ))}
      </ol>
    </>
  )
}

export function countPendingReassignments(tracking: StudentTracking | null | undefined): number {
  return tracking?.accessRequests?.filter((r) => r.status === 'pending').length ?? 0
}
