import { LogOut, Flame } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { studentNav } from '../lib/nav'
import { cn } from '@/lib/cn'

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/student': { title: 'Home', subtitle: 'Your focus for today' },
  '/student/health': { title: 'Health', subtitle: 'How each subject is doing' },
  '/student/plan': { title: 'My Plan', subtitle: 'Gaps to fix and steps to take' },
  '/student/assessments': { title: 'Assessments', subtitle: 'Results explained simply' },
}

interface StudentTopBarProps {
  collapsed: boolean
}

export function StudentTopBar({ collapsed }: StudentTopBarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const meta = routeTitles[pathname] ?? routeTitles['/student']
  const pendingPlan = studentNav.find((n) => n.href === '/student/plan')?.badge

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-20 flex items-center justify-between px-6 transition-all duration-200',
        'bg-white/80 backdrop-blur-md border-b border-surface-200/80',
        collapsed ? 'left-[68px]' : 'left-[260px]',
      )}
    >
      <div>
        <h1 className="text-[17px] font-display font-semibold text-text-primary">{meta.title}</h1>
        <p className="text-[11px] text-text-muted font-sans">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700">
          <Flame className="w-3.5 h-3.5" />
          <span className="text-[11px] font-display font-semibold">5 day streak</span>
        </div>

        {pendingPlan && (
          <span className="hidden sm:inline font-mono-data text-[10px] font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
            {pendingPlan} steps left
          </span>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-text-muted hover:bg-surface-50 hover:text-text-secondary transition-colors text-[11px] font-display font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
