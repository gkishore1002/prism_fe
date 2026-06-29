import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Users,
  Database,
  BarChart3,
  FileText,
  ScrollText,
  ClipboardList,
  Upload,
  Bell,
  Search,
  Building2,
  BookMarked,
  Target,
  Library,
  MapPin,
  Layers,
  Network,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Calendar,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { moduleRegistry, type ModuleId } from '@/lib/modules'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { APP_NAME } from '@/lib/constants'
import { getSidebarProfile } from '@/lib/roleProfile'
import { cn } from '@/lib/cn'
import type { NavItem } from '@/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  Users,
  AlertTriangle,
  Database,
  ScrollText,
  ClipboardList,
  Upload,
  Building2,
  MapPin,
  Layers,
  Network,
  BookMarked,
  Target,
  FileText,
  Bell,
  Calendar,
}

function detectModule(pathname: string): ModuleId {
  if (pathname.startsWith('/tutor')) return 'tutor'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'student'
}

interface AppShellProps {
  module?: ModuleId
}

export function AppShell({ module }: AppShellProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { unreadCount } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const moduleId = module ?? detectModule(pathname)
  const config = moduleRegistry[moduleId]
  const profile = getSidebarProfile(moduleId, user)
  const nav = config.nav
  const homePath = `/${moduleId}`
  const unread = unreadCount(moduleId)

  const sidebarContent = (
    <>
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map((item) => (
          <NavLinkItem
            key={item.href}
            item={item}
            moduleId={moduleId}
            pathname={pathname}
            onNavigate={() => setSidebarOpen(false)}
          />
        ))}
      </nav>

      <div className="shrink-0 px-3 py-3 border-t border-border bg-card/30">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent grid place-items-center font-display font-semibold text-sm shrink-0">
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-accent font-medium">
              {profile.roleLabel}
            </div>
            <div className="text-sm font-medium truncate">{profile.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{profile.subtitle}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="h-dvh overflow-hidden text-foreground flex flex-col app-page-bg">
      <div className="flex shrink-0 h-14 z-20">
        <Link
          to={homePath}
          className="w-auto md:w-64 shrink-0 h-14 flex items-center gap-2 px-4 sm:px-6 border-r border-b border-border bg-card/75 hover:bg-card/90 backdrop-blur-sm transition-colors"
        >
          <div className="w-8 h-8 rounded-md bg-ink text-paper grid place-items-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="font-display text-lg leading-none truncate">
              {APP_NAME}<span className="text-accent">+</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 truncate">
              Academic Intel.
            </div>
          </div>
        </Link>

        <header className="flex-1 min-w-0 h-14 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 border-b border-border/70 bg-card/80 shadow-[0_2px_12px_rgba(184,134,11,0.06)] backdrop-blur-md relative">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-secondary p-2 text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <Library className="w-3.5 h-3.5 shrink-0 text-accent/80" />
            <span className="uppercase tracking-widest font-display truncate">Academic Year 2025–26</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/80 bg-card/70 text-xs text-muted-foreground w-72 shadow-sm backdrop-blur-sm">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search students, topics, questions…</span>
              <kbd className="ml-auto text-[10px] px-1 py-0.5 bg-secondary rounded font-mono-data shadow-sm">⌘K</kbd>
            </div>
            <button
              type="button"
              onClick={() => navigate(`${homePath}/notifications`)}
              className="relative btn btn-ghost p-2 text-muted-foreground"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose text-white text-[10px] font-bold grid place-items-center shadow-card">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </header>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <aside className="hidden lg:flex w-64 shrink-0 h-full border-r border-border bg-card/55 backdrop-blur-sm flex-col overflow-hidden">
          {sidebarContent}
        </aside>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            />
            <aside className="relative w-[min(100%,280px)] h-full border-r border-border bg-card flex flex-col overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="font-display text-sm">Menu</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-md hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sidebarContent}
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto scrollbar-thin">
          <PageBackBar moduleId={moduleId} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function PageBackBar({ moduleId }: { moduleId: ModuleId }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const back = resolveBackNavigation(moduleId, pathname)

  if (!back) return null

  return (
    <button
      type="button"
      onClick={() => navigate(back.href)}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 -mt-2 transition-colors group print:hidden"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card group-hover:bg-secondary transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </span>
      <span>{back.label}</span>
    </button>
  )
}

function resolveBackNavigation(
  moduleId: ModuleId,
  pathname: string,
): { href: string; label: string } | null {
  const home = `/${moduleId}`
  if (pathname === home) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== moduleId || segments.length < 2) return null

  const section = segments[1]

  if (segments.length >= 3) {
    if (section === 'reports') {
      return { href: `${home}/reports`, label: 'Back to reports' }
    }
    if (section === 'question-bank' && segments[2] === 'papers') {
      return { href: `${home}/question-bank`, label: 'Back to question bank' }
    }
    if (section === 'assessments' && segments[2] !== undefined) {
      return { href: `${home}/assessments`, label: 'Back to assessments' }
    }
    if (section === 'students' && segments[2] !== undefined) {
      return { href: `${home}/students`, label: 'Back to students' }
    }
  }

  return { href: home, label: 'Back to dashboard' }
}

function NavLinkItem({
  item,
  moduleId,
  pathname,
  onNavigate,
}: {
  item: NavItem
  moduleId: ModuleId
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = iconMap[item.icon]
  const base = `/${moduleId}`
  const active =
    pathname === item.href ||
    (item.href !== base && pathname.startsWith(item.href))

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
        active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span className="font-mono-data text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
    </Link>
  )
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 mb-6 sm:mb-8 border-b border-border">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground">{title}</h1>
        {sub && <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-lg p-4 sm:p-5 shadow-card', className)}>
      {children}
    </div>
  )
}

export function AppStat({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  unit?: string
  hint?: string
  tone?: 'default' | 'accent' | 'leaf' | 'rose'
}) {
  const toneColor =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'leaf'
        ? 'text-leaf'
        : tone === 'rose'
          ? 'text-rose'
          : 'text-foreground'

  return (
    <AppCard>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn('mt-3 font-mono-data text-3xl', toneColor)}>
        {value}
        {unit && <span className="text-base text-muted-foreground ml-1 font-sans">{unit}</span>}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </AppCard>
  )
}
