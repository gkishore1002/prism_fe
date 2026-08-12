import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'

interface CscFullReportModalProps {
  open: boolean
  onClose: () => void
  assessmentTitle?: string
}

export function CscFullReportModal({ open, onClose, assessmentTitle }: CscFullReportModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Full report at CSC"
      description={assessmentTitle}
      size="md"
      footer={
        <button type="button" onClick={onClose} className={`${btnClass.primary} text-sm px-4 py-2`}>
          Got it
        </button>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed">
        <p className="text-foreground">
          To view your full assessment report, please visit your CSC center in person with a parent
          or guardian. Our staff will share the detailed report with you there.
        </p>
        <p className="text-muted-foreground italic">
          விரிவான அறிக்கையைப் பார்க்க, பெற்றோர் அல்லது பாதுகாவலருடன் CSC மையத்தை நேரில்
          அணுகவும்.
        </p>
      </div>
    </AppModal>
  )
}
