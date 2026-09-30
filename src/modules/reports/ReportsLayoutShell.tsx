import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, BarChart3, BookOpen, LineChart, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { SegmentedTabLink, SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { fadeUp } from '@/lib/motion'

interface ReportsLayoutShellProps {
  insightsTo: string
  studentsTo: string
  subjectsTo?: string
  analyticsTo?: string
  atRiskTo?: string
}

export function ReportsLayoutShell({
  insightsTo,
  studentsTo,
  subjectsTo,
  analyticsTo,
  atRiskTo,
}: ReportsLayoutShellProps) {
  const { pathname } = useLocation()
  const tabs: { to: string; label: string; icon: LucideIcon }[] = [
    { to: insightsTo, label: 'Class insights', icon: BarChart3 },
    { to: studentsTo, label: 'Student reports', icon: Users },
  ]
  if (subjectsTo) {
    tabs.push({ to: subjectsTo, label: 'Subject reports', icon: BookOpen })
  }
  if (analyticsTo) {
    tabs.push({ to: analyticsTo, label: 'Trends', icon: LineChart })
  }
  if (atRiskTo) {
    tabs.push({ to: atRiskTo, label: 'At-risk', icon: AlertTriangle })
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Prism Spectrum"
        title="Reports"
        sub="Built from in-app assessment results plus marks you enter manually or upload on the Marks page."
      />

      <SegmentedTabs aria-label="Report sections">
        {tabs.map(({ to, label, icon: Icon }) => (
          <SegmentedTabLink key={to} to={to} icon={<Icon className="w-3.5 h-3.5 shrink-0" />}>
            {label}
          </SegmentedTabLink>
        ))}
      </SegmentedTabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
