import type { NavItem } from '@/types'

export const adminNav: NavItem[] = [
  { label: 'Institution', href: '/admin', icon: 'Building2' },
  { label: 'Centers', href: '/admin/centers', icon: 'MapPin' },
  { label: 'Students', href: '/admin/students', icon: 'Users' },
  { label: 'Test Attendance', href: '/admin/assessments', icon: 'ClipboardList' },
  { label: 'Tutor Content', href: '/admin/question-bank', icon: 'Database' },
  { label: 'Boards', href: '/admin/boards', icon: 'Layers' },
  { label: 'Subject Reports', href: '/admin/reports', icon: 'BarChart3' },
  { label: 'Curriculum Setup', href: '/admin/setup', icon: 'Network' },
  { label: 'Teachers', href: '/admin/teachers', icon: 'BookOpen' },
  { label: 'Syllabus', href: '/admin/syllabus', icon: 'BookMarked' },
  { label: 'AI Intelligence', href: '/admin/intelligence', icon: 'Target' },
]

export const adminMeta = {
  portalLabel: 'Institute Console',
  defaultTitle: 'Institute overview',
  defaultSubtitle: 'Organization-wide academic intelligence',
}
