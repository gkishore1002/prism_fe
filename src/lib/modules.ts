import { studentNav, studentMeta } from '@/modules/student/lib/nav'
import { tutorNav, tutorMeta } from '@/modules/tutor/lib/nav'
import { adminNav, adminMeta } from '@/modules/admin/lib/nav'
import type { NavItem } from '@/types'

export type ModuleId = 'student' | 'tutor' | 'admin'

export interface ModuleConfig {
  id: ModuleId
  nav: NavItem[]
  portalLabel: string
  defaultTitle: string
  defaultSubtitle: string
}

export const moduleRegistry: Record<ModuleId, ModuleConfig> = {
  student: { id: 'student', nav: studentNav, ...studentMeta },
  tutor: { id: 'tutor', nav: tutorNav, ...tutorMeta },
  admin: { id: 'admin', nav: adminNav, ...adminMeta },
}
