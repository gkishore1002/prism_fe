import { useState } from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'
import { createAccessRequest } from '@/lib/api/assessmentsApi'
import { AccessRequestStatusBadge, accessRequestTheme } from '@/lib/accessRequestTheme'

interface RequestReassignmentModalProps {
  open: boolean
  onClose: () => void
  assessmentId: string
  assessmentTitle: string
  onSubmitted?: () => void
}

export function RequestReassignmentModal({
  open,
  onClose,
  assessmentId,
  assessmentTitle,
  onSubmitted,
}: RequestReassignmentModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createAccessRequest(assessmentId, reason.trim())
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    onClose()
    setDone(false)
    setReason('')
    setError(null)
  }

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Request reassignment"
      description={assessmentTitle}
      size="md"
      panelClassName={done ? undefined : `border-2 ${accessRequestTheme.section}`}
    >
      {done ? (
        <div className={`space-y-4 rounded-xl border p-4 ${accessRequestTheme.card}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${accessRequestTheme.icon}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <AccessRequestStatusBadge status="pending" emphasis className="mb-2" />
              <p className="text-sm font-semibold text-foreground">Request submitted</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your tutor will review this request. You will see an &quot;Awaiting tutor&quot; badge until it
                is approved or rejected.
              </p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className={`${btnClass.primary} text-sm px-4 py-2 ${accessRequestTheme.approveBtn}`}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className={`rounded-xl border p-3 flex items-start gap-3 ${accessRequestTheme.cardActive}`}>
            <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${accessRequestTheme.icon}`}>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              The exam window has ended. Explain why you need to attend late — your tutor will approve or
              reject the request.
            </p>
          </div>
          <label className="block">
            <span className="text-xs text-muted-foreground">Reason</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y"
              placeholder="e.g. Was unwell during the scheduled week…"
            />
          </label>
          {error && <p className="text-xs text-rose">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={handleClose} className={`${btnClass.secondary} text-sm px-4 py-2`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${btnClass.primary} text-sm px-4 py-2 ${accessRequestTheme.approveBtn}`}
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      )}
    </AppModal>
  )
}
