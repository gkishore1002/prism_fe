import { useState } from 'react'
import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'
import { logReportCollection } from '@/lib/api/cscApi'
import { todayIsoDate } from '@/lib/academicScope'
import { useInstitutionPolicies } from '@/hooks/useInstitutionPolicies'
import type { ReportCollectionLog } from '@/types'

interface ReportCollectionModalProps {
  open: boolean
  studentId: string
  studentName: string
  onClose: () => void
  onSaved?: (log: ReportCollectionLog) => void
}

export function ReportCollectionModal({
  open,
  studentId,
  studentName,
  onClose,
  onSaved,
}: ReportCollectionModalProps) {
  const [collectedAt, setCollectedAt] = useState(todayIsoDate())
  const [guardianName, setGuardianName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { policies } = useInstitutionPolicies()
  const inactivityDays = policies?.csc.inactivityThresholdDays ?? 90

  function handleClose() {
    if (saving) return
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const log = await logReportCollection(studentId, {
        reportKind: 'monthly',
        reportRef: 'student-reports-hub',
        collectedAt,
        guardianName: guardianName.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onSaved?.(log)
      setGuardianName('')
      setNotes('')
      setCollectedAt(todayIsoDate())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log collection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Parent / guardian collection"
      description={`Record when a parent or guardian collected ${studentName}'s report at the CSC center. This resets the ${inactivityDays}-day inactivity timer.`}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Collection date</span>
          <input
            type="date"
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Guardian name (optional)</span>
          <input
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            placeholder="Parent or guardian"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Notes (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
          />
        </label>
        {error && <p className="text-xs text-rose">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnClass.secondary} onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`${btnClass.primary} text-sm px-4 py-2`}>
            {saving ? 'Saving…' : 'Mark as collected'}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
