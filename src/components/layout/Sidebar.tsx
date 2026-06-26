import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  Target,
  Route,
  Users,
  Lightbulb,
  ScanSearch,
  Building2,
  BarChart3,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { APP_NAME } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { moduleRegistry } from '@/lib/modules'
import type { NavItem } from '@/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  Target,
  Route,
  Users,
  Lightbulb,
  ScanSearch,
  Building2,
  BarChart3,
  GitBranch,
  Settings,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  nav?: NavItem[]
  portalLabel?: string
}

export function Sidebar({ collapsed, onToggle, nav, portalLabel }: SidebarProps) {
  const { user, role } = useAuth()
  const config = moduleRegistry[role] ?? moduleRegistry.student
  const items = nav ?? config.nav ?? []
  const label = portalLabel ?? config.portalLabel

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen gradient-dark flex flex-col z-30 transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      <div className={cn('flex items-center h-16 px-5 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-9 h-9 rounded-[10px] gradient-brand-icon flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-[13px] text-blue-900">L+</span>
        </div>
        {!collapsed && (
          <div>
            <span className="font-display font-semibold text-[14px] text-white">{APP_NAME}</span>
            <p className="text-[10px] text-white/40 leading-none mt-0.5 uppercase tracking-[1.5px]">{label}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-display font-semibold uppercase tracking-[1.5px] text-white/25">
            Navigation
          </p>
        )}
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const basePath = `/${role}`
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === basePath}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13.5px] font-display font-medium transition-colors relative',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/55 hover:bg-white/5 hover:text-white/80',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-yellow-300')} />
                  )}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="font-mono-data text-[10px] font-medium bg-yellow-300/20 text-yellow-200 px-2 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-300 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-[8px] text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className={cn('p-4 border-t border-white/10', collapsed && 'flex justify-center')}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={user.name} size="sm" dark />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[12px] font-display font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 truncate capitalize">{role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
