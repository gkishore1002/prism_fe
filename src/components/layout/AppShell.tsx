import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  AlertTriangle,
  Users,
  Database,
  BarChart3,
  FileText,
  ScrollText,
  ClipboardList,
  ClipboardCheck,
  Upload,
  Building2,
  BookMarked,
  Target,
  MapPin,
  Layers,
  Network,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Calendar,
  LayoutDashboard,
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moduleRegistry, type ModuleId } from '@/lib/modules'
import { useAuth } from '@/hooks/useAuth'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { StudentPendingAssessmentReminder } from '@/components/student/StudentPendingAssessmentReminder'
import { PrismLogo } from '@/components/brand/PrismLogo'
import { getSidebarProfile } from '@/lib/roleProfile'
import { studentProfileSubtitle } from '@/modules/student/lib/studentProfile'
import { AmbientParticles } from '@/components/design/AmbientParticles'
import { CommandPalette } from '@/components/design/CommandPalette'
import { AiCopilotFab } from '@/components/design/AiCopilotFab'
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
  ClipboardCheck,
  Upload,
  Building2,
  MapPin,
  Layers,
  Network,
  BookMarked,
  Target,
  FileText,
  Calendar,
}

function detectModule(pathname: string): ModuleId {
  if (pathname.startsWith('/tutor')) return 'tutor'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'student'
}

function resolvePageBreadcrumb(moduleId: ModuleId, pathname: string): string {
  const home = `/${moduleId}`
  const nav = moduleRegistry[moduleId].nav
  const segments = pathname.split('/').filter(Boolean)

  if (pathname === home) {
    return nav.find((item) => item.href === home)?.label ?? 'Dashboard'
  }

  const section = segments[1]
  const sectionNav = nav.find(
    (item) => item.href === `${home}/${section}` || pathname.startsWith(item.href + '/'),
  )
  const sectionLabel = sectionNav?.label ?? section?.replace(/-/g, ' ') ?? 'Page'

  if (segments.length >= 3) {
    if (section === 'assessments' && segments[3] === 'take') return `${sectionLabel} · Exam`
    if (section === 'assessments' && segments[3] === 'paper') return `${sectionLabel} · Paper`
    if (section === 'assessments' && segments[3] === 'attendance') return `${sectionLabel} · Attendance`
    if (section === 'question-bank' && segments[2] === 'papers') return `${sectionLabel} · Paper`
    if (section === 'students' && segments[2] === 'report') return `${sectionLabel} · Report`
    if (section === 'reports' && segments[2]) return `${sectionLabel} · ${segments[2]}`
  }

  return sectionLabel
}

interface AppShellProps {
  module?: ModuleId
}

export function AppShell({ module }: AppShellProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { studentProfile, overview, load } = useAnalytics()
  const [shellLoading, setShellLoading] = useState(false)
  const { ensureLoaded: ensureNotificationsLoaded } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const moduleId = module ?? detectModule(pathname)

  useEffect(() => {
    if (moduleId === 'student') {
      setShellLoading(true)
      void load('shellStudent').finally(() => setShellLoading(false))
      void ensureNotificationsLoaded()
    } else if (moduleId === 'admin') {
      setShellLoading(true)
      void load('shellInstitution').finally(() => setShellLoading(false))
      void ensureNotificationsLoaded()
    } else if (moduleId === 'tutor') {
      void ensureNotificationsLoaded()
    }
  }, [moduleId, load, ensureNotificationsLoaded])

  useEffect(() => {
    function onOpen() {
      setCmdOpen(true)
    }
    document.addEventListener('prism:open-command', onOpen)
    return () => document.removeEventListener('prism:open-command', onOpen)
  }, [])

  const config = moduleRegistry[moduleId]
  const sidebarSubtitle =
    moduleId === 'student' && studentProfile
      ? studentProfileSubtitle(studentProfile)
      : moduleId === 'student' && shellLoading
        ? 'Loading profile…'
        : moduleId === 'admin' && overview?.institution.name
          ? overview.institution.name
          : undefined
  const profile = getSidebarProfile(moduleId, user, { subtitle: sidebarSubtitle })
  const nav = config.nav
  const homePath = `/${moduleId}`
  const pageBreadcrumb = resolvePageBreadcrumb(moduleId, pathname)

  const sidebarInner = (
    <>
      <div className={cn('shrink-0 border-b border-border', collapsed ? 'px-3 py-4' : 'px-4 py-4')}>
        <PrismLogo
          size="sm"
          showWordmark={!collapsed}
          showTagline={false}
          href={homePath}
        />
      </div>

      <nav
        className="flex-1 min-h-0 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin"
        aria-label="Primary"
      >
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
            Workspace
          </p>
        )}
        {nav.map((item) => (
          <NavLinkItem
            key={item.href}
            item={item}
            moduleId={moduleId}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={() => setSidebarOpen(false)}
          />
        ))}
        {!collapsed && (
          <>
            <p className="px-3 mt-5 mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
              Intelligence
            </p>
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false)
                setCmdOpen(true)
              }}
              className="ios-nav-pill ios-nav-pill-inactive w-full"
            >
              <Sparkles className="w-[18px] h-[18px] shrink-0 text-accent" />
              <span className="flex-1 text-left">AI Assistant</span>
            </button>
          </>
        )}
      </nav>

      <div className="shrink-0 px-2 py-3 border-t border-border space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent grid place-items-center font-semibold text-sm shrink-0">
              {profile.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-accent font-medium">
                {profile.roleLabel}
              </div>
              <div className="text-sm font-medium truncate text-foreground">{profile.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{profile.subtitle}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors',
            collapsed && 'justify-center',
          )}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="relative h-dvh overflow-hidden text-foreground flex app-page-bg safe-top">
      <AmbientParticles />

      <aside
        className={cn(
          'hidden lg:flex shrink-0 h-full glass-sidebar flex-col overflow-hidden relative z-[1] transition-[width] duration-300 ease-out',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {sidebarInner}
      </aside>

      <div className="relative z-[1] flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
        <header className="shrink-0 h-14 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 glass-nav z-ln-sticky">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-secondary p-2 text-muted-foreground shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:inline-flex btn btn-ghost p-2 text-muted-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <nav
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0"
            aria-label="Breadcrumb"
          >
            <span className="truncate">{config.portalLabel}</span>
            <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
            <span className="text-foreground capitalize truncate">{pageBreadcrumb}</span>
          </nav>

          <div className="min-w-0 flex-1 md:hidden">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
              {config.portalLabel}
            </div>
            <div className="text-sm font-medium text-foreground truncate capitalize">
              {pageBreadcrumb}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-border bg-secondary text-muted-foreground text-xs hover:text-foreground hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              aria-label="Open search"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-2 text-[10px] border border-border rounded-md px-1.5 py-0.5">⌘K</kbd>
            </button>
            <NotificationBell moduleId={moduleId} />
          </div>
        </header>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="lg:hidden fixed inset-0 z-ln-drawer flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="absolute inset-0 glass-overlay"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              />
              <motion.aside
                className="relative w-[min(100%,300px)] h-full glass-sheet rounded-none flex flex-col overflow-hidden"
                initial={{ x: -24, opacity: 0.8 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
                  <PrismLogo size="sm" showWordmark href={homePath} />
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-muted-foreground shrink-0"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{sidebarInner}</div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto scrollbar-thin page-enter safe-bottom">
          <PageBackBar moduleId={moduleId} />
          <Outlet />
        </main>
      </div>

      <CommandPalette moduleId={moduleId} open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <AiCopilotFab />
      {moduleId === 'student' && <StudentPendingAssessmentReminder />}
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
      className="hidden md:inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground mb-6 -mt-1 transition-colors group print:hidden"
    >
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
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
    if (section === 'students' && segments[2] === 'report') {
      return { href: `${home}/reports/students`, label: 'Back to student reports' }
    }
  }

  return { href: home, label: 'Back to dashboard' }
}

function NavLinkItem({
  item,
  moduleId,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  moduleId: ModuleId
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const Icon = iconMap[item.icon]
  const base = `/${moduleId}`
  const active =
    pathname === item.href || (item.href !== base && pathname.startsWith(item.href))

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'ios-nav-pill',
        active ? 'ios-nav-pill-active' : 'ios-nav-pill-inactive',
        collapsed && 'justify-center px-0',
      )}
    >
      {Icon && (
        <Icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-accent')} />
      )}
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge != null && (
        <span className="font-mono-data text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-6 mb-6 border-b border-border">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[26px] sm:text-[32px] font-semibold text-foreground tracking-tight leading-[1.15]">
          {title}
        </h1>
        {sub && (
          <p className="text-muted-foreground mt-2.5 max-w-2xl text-[15px] leading-relaxed">{sub}</p>
        )}
      </div>
      {actions && <div className="page-actions shrink-0">{actions}</div>}
    </div>
  )
}

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('glass-card p-4 sm:p-5', className)}>
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
    <AppCard className="hover:border-indigo-200 transition-colors">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
        {label}
      </div>
      <div className={cn('mt-3 font-display text-[28px] leading-none tracking-tight font-semibold', toneColor)}>
        {value}
        {unit && <span className="text-base text-muted-foreground ml-1 font-sans font-normal">{unit}</span>}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </AppCard>
  )
}
