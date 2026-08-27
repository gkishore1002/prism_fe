import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'
import { createAccessRequest } from '@/lib/api/assessmentsApi'
import { accessRequestTheme } from '@/lib/accessRequestTheme'

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

  useEffect(() => {
    if (open) return
    setReason('')
    setError(null)
    setSubmitting(false)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createAccessRequest(assessmentId, reason.trim())
      onClose()
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      setSubmitting(false)
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Request reassignment"
      description={assessmentTitle}
      size="md"
      panelClassName={`border-2 ${accessRequestTheme.section}`}
    >
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
            <button type="button" onClick={onClose} className={`${btnClass.secondary} text-sm px-4 py-2`}>
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
    </AppModal>
  )
}
