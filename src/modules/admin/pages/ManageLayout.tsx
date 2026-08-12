import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { pageUnfold } from '@/lib/motion'
import { cn } from '@/lib/cn'

export function AdminManageLayout() {
  const { pathname } = useLocation()
  const { organizationScoped } = useAdminPortalContext()

  const tabs: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
    { to: '/admin/manage/students', label: 'Students', icon: Users },
    { to: '/admin/manage/staff', label: 'Staff', icon: Users },
  ]
  if (organizationScoped) {
    tabs.push({ to: '/admin/manage/centers', label: 'Branches', icon: MapPin })
  }

  return (
    <motion.div
      variants={pageUnfold}
      initial="hidden"
      animate="visible"
      style={{ transformOrigin: 'top center' }}
    >
      <PageHeader
        title="Manage"
        sub={
          organizationScoped
            ? 'Students, staff, and branches — live data from your organization.'
            : 'Students and staff for your assigned branches — live data from the database.'
        }
      />

      <nav className="flex flex-wrap gap-2 mb-6 ln-tabs-bar" aria-label="Manage sections">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-[#F0EBE3] hover:text-foreground',
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageUnfold}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
          style={{ transformOrigin: 'top center' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
