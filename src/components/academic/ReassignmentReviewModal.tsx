import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppModal } from '@/components/ui/AppModal'
import { PageLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import {
  fetchAccessRequestReviewContext,
  reviewAccessRequest,
} from '@/lib/api/assessmentsApi'
import { useNotifications } from '@/hooks/useNotifications'
import { AccessRequestStatusBadge, formatAccessRequestDate } from '@/lib/accessRequestTheme'
import type { AccessRequestReviewContext, AssessmentAccessRequest } from '@/types'

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-1">
        {title}
      </h4>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

interface ReassignmentReviewModalProps {
  open: boolean
  request: AssessmentAccessRequest | null
  scope: 'tutor' | 'admin'
  onClose: () => void
  onReviewed?: () => void
}

export function ReassignmentReviewModal({
  open,
  request,
  scope,
  onClose,
  onReviewed,
}: ReassignmentReviewModalProps) {
  const { refresh: refreshNotifications } = useNotifications()
  const [ctx, setCtx] = useState<AccessRequestReviewContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [extensionDays, setExtensionDays] = useState(3)
  const [rejectNotes, setRejectNotes] = useState('')

  useEffect(() => {
    if (!open || !request?.id) {
      setCtx(null)
      setError(null)
      setRejectNotes('')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchAccessRequestReviewContext(request.id)
      .then((data) => {
        if (cancelled) return
        setCtx(data)
        setExtensionDays(data.policies.defaultExtensionDays)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load review context')
          setCtx(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, request?.id])

  async function submit(status: 'approved' | 'rejected') {
    if (!request) return
    setBusy(true)
    setError(null)
    try {
      await reviewAccessRequest(request.id, {
        status,
        extensionDays: status === 'approved' ? extensionDays : undefined,
        reviewNotes: status === 'rejected' ? rejectNotes.trim() : undefined,
      })
      void refreshNotifications()
      onReviewed?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setBusy(false)
    }
  }

  const canApprove =
    scope === 'admin' || ctx?.policies.allowTutorExtension !== false

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Request review"
      description={request ? `${request.studentName} · ${request.assessmentTitle}` : undefined}
      size="xl"
      footer={
        ctx ? (
          ctx.request.status === 'pending' ? (
            <div className="flex flex-wrap gap-2 justify-end w-full">
              <button type="button" onClick={onClose} className={`${btnClass.secondary} text-sm px-4 py-2`}>
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit('rejected')}
                className={`${btnClass.secondary} text-sm px-4 py-2 ${busy ? 'opacity-60' : ''}`}
              >
                Reject
              </button>
              {canApprove && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit('approved')}
                  className={`${btnClass.primary} text-sm px-4 py-2 ${busy ? 'opacity-60' : ''}`}
                >
                  Approve
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-end w-full">
              <button type="button" onClick={onClose} className={`${btnClass.secondary} text-sm px-4 py-2`}>
                Close
              </button>
            </div>
          )
        ) : undefined
      }
    >
      {loading && <PageLoader label="Loading request details…" minHeight={false} className="py-8" />}
      {error && !loading && (
        <p className="text-sm text-rose py-4">{error}</p>
      )}
      {ctx && !loading && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <AccessRequestStatusBadge status={ctx.request.status as 'pending'} emphasis />
            <Link
              to={`/${scope}/students/${ctx.student.id}/report`}
              className="text-xs text-accent hover:underline"
              onClick={onClose}
            >
              Open student report →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/15 p-4">
            <DetailRow label="Student" value={ctx.requestDetails.studentName} />
            <DetailRow label="Assessment" value={ctx.requestDetails.assessmentTitle} />
            <DetailRow label="Deadline" value={ctx.requestDetails.deadlineFormatted ?? '—'} />
            <DetailRow
              label="Days overdue"
              value={ctx.requestDetails.daysOverdue ?? '—'}
            />
            <DetailRow
              label="Previous attempts"
              value={ctx.requestDetails.previousAttemptsOnAssessment}
            />
            <DetailRow
              label="Requested on"
              value={formatAccessRequestDate(ctx.requestDetails.requestedOn)}
            />
            <DetailRow
              label="Prior requests (this exam)"
              value={ctx.requestDetails.previousRequestsOnAssessment}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ReviewSection title="Student performance">
              <div className="space-y-1.5 text-sm">
                <DetailRow
                  label="Average"
                  value={ctx.studentPerformance.averagePct != null ? `${ctx.studentPerformance.averagePct}%` : '—'}
                />
                <DetailRow
                  label="Previous attempts"
                  value={ctx.studentPerformance.previousAttempts}
                />
                <DetailRow
                  label="Attendance"
                  value={
                    ctx.studentPerformance.attendancePct != null
                      ? `${ctx.studentPerformance.attendancePct}%`
                      : '—'
                  }
                />
              </div>
            </ReviewSection>

            <ReviewSection title="Assessment">
              <div className="space-y-1.5 text-sm">
                <DetailRow label="Deadline" value={ctx.assessment.deadlineFormatted ?? '—'} />
                <DetailRow label="Today" value={ctx.assessment.todayFormatted ?? '—'} />
                <DetailRow label="Days overdue" value={ctx.assessment.daysOverdue ?? '—'} />
              </div>
            </ReviewSection>
          </div>

          <ReviewSection title="Student reason">
            <p className="text-sm text-foreground rounded-lg border border-border bg-card/80 p-3 whitespace-pre-wrap">
              {ctx.request.reason || 'No reason provided.'}
            </p>
          </ReviewSection>

          <ReviewSection title="Previous reassignment requests">
            <div className="text-sm space-y-2">
              <p className="text-foreground">
                <span className="font-semibold">{ctx.previousRequests.total}</span> requests ·{' '}
                <span className="text-muted-foreground">{ctx.previousRequests.approved} approved · </span>
                <span className="text-muted-foreground">{ctx.previousRequests.rejected} rejected</span>
              </p>
              {ctx.previousRequests.items.length > 0 && (
                <ul className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                  {ctx.previousRequests.items.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
                    >
                      <span className="text-foreground truncate">{item.assessmentTitle}</span>
                      <span className="text-muted-foreground capitalize shrink-0">{item.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ReviewSection>

          {request?.status === 'pending' && canApprove && ctx.request.status === 'pending' && (
            <ReviewSection title="Extension (if approved)">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-muted-foreground">
                  Days
                  <input
                    type="number"
                    min={1}
                    max={ctx.policies.maxExtensionDays}
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(Number(e.target.value))}
                    className="ml-2 w-16 border border-border rounded-md px-2 py-1 text-sm bg-background"
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  Default {ctx.policies.defaultExtensionDays}d · max {ctx.policies.maxExtensionDays}d
                  {scope === 'admin' && ctx.policies.allowAdminOverride ? ' (admin override allowed)' : ''}
                </span>
              </div>
            </ReviewSection>
          )}

          {request?.status === 'pending' && ctx.policies.requireRejectionReason && (
            <ReviewSection title="Rejection reason (required if rejecting)">
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y"
                placeholder="Explain why the request is declined…"
              />
            </ReviewSection>
          )}
        </div>
      )}
    </AppModal>
  )
}
