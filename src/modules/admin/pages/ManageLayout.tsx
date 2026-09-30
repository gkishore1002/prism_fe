import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { SegmentedTabLink, SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { pageUnfold } from '@/lib/motion'

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

      <SegmentedTabs aria-label="Manage sections">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <SegmentedTabLink key={to} to={to} end={end} icon={<Icon className="w-3.5 h-3.5 shrink-0" />}>
            {label}
          </SegmentedTabLink>
        ))}
      </SegmentedTabs>

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
