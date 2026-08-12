export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | null | undefined

/** Single reassignment theme — status via badge label & icon, not separate color palettes. */
export const accessRequestTheme = {
  section: 'border-border bg-secondary/20',
  card: 'border-border bg-card/95 shadow-sm',
  cardActive: 'border-accent/25 bg-accent/[0.04] shadow-sm',
  icon: 'bg-accent/12 text-accent',
  border: 'border-border',
  badge: 'bg-secondary/70 text-foreground border border-border',
  badgeEmphasis: 'bg-accent/10 text-accent border border-accent/25',
  tab: 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80',
  tabActive: 'bg-accent/10 text-accent border border-accent/25',
  approveBtn: 'bg-accent text-accent-foreground hover:opacity-90 border-0',
  rejectBtn: 'border-border text-muted-foreground hover:bg-secondary/80',
  dot: 'bg-accent',
} as const

export function labelForAccessRequestStatus(status: AccessRequestStatus): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'pending') return 'Awaiting tutor'
  return 'Deadline missed'
}

export function descriptionForAccessRequestStatus(status: AccessRequestStatus): string {
  if (status === 'approved') return 'You may attend within the extension window.'
  if (status === 'rejected') return 'Request was declined. Contact your tutor or CSC center.'
  if (status === 'pending') return 'Your tutor is reviewing this request.'
  return 'The exam window has ended. Request reassignment to attend.'
}

export function formatAccessRequestDate(iso?: string | null): string {
  if (!iso) return '—'
  const parsed = new Date(iso.length <= 10 ? `${iso.slice(0, 10)}T12:00:00` : iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AccessRequestStatusBadge({
  status,
  emphasis = false,
  className = '',
}: {
  status: AccessRequestStatus
  emphasis?: boolean
  className?: string
}) {
  const badgeClass = emphasis ? accessRequestTheme.badgeEmphasis : accessRequestTheme.badge
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${badgeClass} ${className}`}
    >
      {labelForAccessRequestStatus(status)}
    </span>
  )
}

export function AccessRequestLegend() {
  const items = ['Pending review', 'Approved', 'Rejected / missed']
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${accessRequestTheme.badge}`}
        >
          <span className={`w-2 h-2 rounded-full ${accessRequestTheme.dot}`} />
          {label}
        </span>
      ))}
    </div>
  )
}

export type AccessRequestTone = 'neutral' | 'emphasis'

export function toneForAccessRequestStatus(status: AccessRequestStatus): AccessRequestTone {
  return status === 'pending' ? 'emphasis' : 'neutral'
}

export const accessRequestToneStyles: Record<
  AccessRequestTone | 'success' | 'warning' | 'danger',
  {
    section: string
    card: string
    badge: string
    icon: string
    border: string
    approveBtn: string
    rejectBtn: string
  }
> = {
  neutral: {
    section: accessRequestTheme.section,
    card: accessRequestTheme.card,
    badge: accessRequestTheme.badge,
    icon: accessRequestTheme.icon,
    border: accessRequestTheme.border,
    approveBtn: accessRequestTheme.approveBtn,
    rejectBtn: accessRequestTheme.rejectBtn,
  },
  emphasis: {
    section: accessRequestTheme.section,
    card: accessRequestTheme.cardActive,
    badge: accessRequestTheme.badgeEmphasis,
    icon: accessRequestTheme.icon,
    border: accessRequestTheme.border,
    approveBtn: accessRequestTheme.approveBtn,
    rejectBtn: accessRequestTheme.rejectBtn,
  },
  success: {
    section: accessRequestTheme.section,
    card: accessRequestTheme.card,
    badge: accessRequestTheme.badge,
    icon: accessRequestTheme.icon,
    border: accessRequestTheme.border,
    approveBtn: accessRequestTheme.approveBtn,
    rejectBtn: accessRequestTheme.rejectBtn,
  },
  warning: {
    section: accessRequestTheme.section,
    card: accessRequestTheme.cardActive,
    badge: accessRequestTheme.badgeEmphasis,
    icon: accessRequestTheme.icon,
    border: accessRequestTheme.border,
    approveBtn: accessRequestTheme.approveBtn,
    rejectBtn: accessRequestTheme.rejectBtn,
  },
  danger: {
    section: accessRequestTheme.section,
    card: accessRequestTheme.card,
    badge: accessRequestTheme.badge,
    icon: accessRequestTheme.icon,
    border: accessRequestTheme.border,
    approveBtn: accessRequestTheme.approveBtn,
    rejectBtn: accessRequestTheme.rejectBtn,
  },
}
