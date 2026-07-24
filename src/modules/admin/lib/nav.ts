import type { NavItem } from '@/types'

export const adminNav: NavItem[] = [
  { label: 'Institution', href: '/admin', icon: 'Building2' },
  { label: 'Centers', href: '/admin/centers', icon: 'MapPin' },
  { label: 'Students', href: '/admin/students', icon: 'Users' },
  { label: 'Test Results', href: '/admin/assessments', icon: 'ClipboardList' },
  { label: 'Tutor Content', href: '/admin/question-bank', icon: 'Database' },
  { label: 'Boards', href: '/admin/boards', icon: 'Layers' },
  { label: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
  { label: 'Curriculum Setup', href: '/admin/curriculum', icon: 'Network' },
  { label: 'Teachers', href: '/admin/teachers', icon: 'BookOpen' },
]

export const adminMeta = {
  portalLabel: 'Institute Console',
  defaultTitle: 'Institute overview',
  defaultSubtitle: 'Organization-wide academic intelligence',
}
