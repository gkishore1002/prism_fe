import { NavLink, Outlet } from 'react-router-dom'
import { AlertTriangle, BarChart3, BookOpen, LineChart, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { cn } from '@/lib/cn'

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
    <>
      <PageHeader
        eyebrow="Learning Genome"
        title="Reports"
        sub="Built from in-app assessment results plus marks you enter manually or upload on the Marks page."
      />

      <nav className="flex flex-wrap gap-2 mb-6 ln-tabs-bar" aria-label="Report sections">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-sm font-medium transition-all duration-[280ms] ios-press',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </>
  )
}
