import type { NavItem } from '@/types'

export const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: 'LayoutDashboard' },
  { label: 'Assessments', href: '/student/assessments', icon: 'ClipboardList' },
  { label: 'Reports', href: '/student/reports', icon: 'FileText' },
]

export const studentMeta = {
  portalLabel: 'Student Portal',
  defaultTitle: 'Dashboard',
  defaultSubtitle: 'Your learning overview at a glance',
}
