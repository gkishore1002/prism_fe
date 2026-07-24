import type { NavItem } from '@/types'

export const tutorNav: NavItem[] = [
  { label: 'Dashboard', href: '/tutor', icon: 'LayoutDashboard' },
  { label: 'Students', href: '/tutor/students', icon: 'Users' },
  { label: 'Assessments', href: '/tutor/assessments', icon: 'ClipboardList' },
  { label: 'Marks', href: '/tutor/marks', icon: 'ClipboardCheck' },
  { label: 'Reports', href: '/tutor/reports', icon: 'BarChart3' },
  { label: 'Question Bank', href: '/tutor/question-bank', icon: 'Database' },
  { label: 'Curriculum Setup', href: '/tutor/curriculum', icon: 'Network' },
]

export const tutorMeta = {
  portalLabel: 'Tutor Portal',
  defaultTitle: 'Tutor Copilot',
  defaultSubtitle: 'Know exactly what to teach next',
}
