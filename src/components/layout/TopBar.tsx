import { Bell, Search, Sparkles, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

interface TopBarProps {
  title: string
  subtitle?: string
  collapsed: boolean
}

export function TopBar({ title, subtitle, collapsed }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const firstName = user.name.split(' ')[0]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-surface border-b border-surface-200 z-20',
        'flex items-center justify-between px-7 transition-all duration-200',
        collapsed ? 'left-[68px]' : 'left-[260px]',
      )}
    >
      <div>
        <h1 className="text-lg font-display font-semibold text-text-primary">
          {title}
          {firstName && (
            <span className="text-yellow-600"> · {firstName}</span>
          )}
        </h1>
        {subtitle && <p className="text-[12px] text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-[10px] px-3.5 py-2.5 w-[280px] focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-400/12 transition-all">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none flex-1 font-sans"
          />
          <kbd className="text-[10px] text-text-faint bg-surface border border-surface-200 rounded px-1.5 font-mono-data">⌘K</kbd>
        </div>

        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-1.5 h-[38px] px-3 rounded-[10px] border border-surface-200 text-text-secondary hover:bg-surface-50 transition-colors text-[11px] font-display font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>

        <button className="relative w-[38px] h-[38px] flex items-center justify-center rounded-[10px] border border-surface-200 text-text-secondary hover:bg-surface-50 transition-colors">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ai-pulse" />
        </button>

        <button className="relative w-[38px] h-[38px] flex items-center justify-center rounded-[10px] border border-surface-200 text-text-secondary hover:bg-surface-50 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}
