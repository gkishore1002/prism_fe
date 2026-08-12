import type { NavItem } from '@/types'

/** Visible only in Organization Admin portal — not Branch Admin. */
export const ORG_ADMIN_ONLY_HREFS = new Set(['/admin/centers', '/admin/settings'])

export function adminNavForPortal(nav: NavItem[], branchScopedPortal: boolean): NavItem[] {
  if (!branchScopedPortal) return nav
  return nav.filter((item) => !ORG_ADMIN_ONLY_HREFS.has(item.href))
}

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Branches', href: '/admin/centers', icon: 'MapPin' },
  { label: 'Students', href: '/admin/students', icon: 'Users' },
  { label: 'Assessments', href: '/admin/assessments', icon: 'ClipboardList' },
  { label: 'Question Bank', href: '/admin/question-bank', icon: 'Database' },
  { label: 'Staff', href: '/admin/staff', icon: 'Users' },
  { label: 'Boards', href: '/admin/boards', icon: 'Layers' },
  { label: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
  { label: 'Curriculum Setup', href: '/admin/curriculum', icon: 'Network' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
]

export const adminMeta = {
  organizationPortalLabel: 'Organization Console',
  branchPortalLabel: 'Branch Console',
  portalLabel: 'Organization Console',
  defaultTitle: 'Dashboard',
  organizationDefaultSubtitle: 'Organization-wide metrics and analytics across all branches',
  branchDefaultSubtitle: 'Operations and insights for your assigned branches',
  defaultSubtitle: 'Organization-wide metrics and analytics',
}
