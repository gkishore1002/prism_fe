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
  Settings,
  Shield,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moduleRegistry, type ModuleId } from '@/lib/modules'
import { useAuth } from '@/hooks/useAuth'
import { isPlatformContext } from '@/modules/auth/lib/orgContext'
import { useCenters } from '@/hooks/useCenters'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { RoleSwitcher } from '@/components/layout/RoleSwitcher'
import { BranchSwitcher } from '@/components/layout/BranchSwitcher'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'
import { StudentPendingAssessmentReminder } from '@/components/student/StudentPendingAssessmentReminder'
import { PrismLogo } from '@/components/brand/PrismLogo'
import { getSidebarProfile } from '@/lib/roleProfile'
import { adminNavForPortal } from '@/modules/admin/lib/nav'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { studentProfileSubtitle } from '@/modules/student/lib/studentProfile'
import { drawerOverlay, fadeUp, slideFromLeft, springSoft } from '@/lib/motion'
import { cn } from '@/lib/cn'
import type { NavItem, UserRole } from '@/types'

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
  Settings,
  Shield,
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
  const { logout, user, role, adminPortal } = useAuth()
  const { isPlatformSuperUser, canManageTenant } = useCenters()
  const { branchScoped, portalLabel } = useAdminPortalContext()
  const { studentProfile, overview, load } = useAnalytics()
  const [shellLoading, setShellLoading] = useState(false)
  const { ensureLoaded: ensureNotificationsLoaded } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const moduleId = module ?? detectModule(pathname)

  useEffect(() => {
    if (moduleId === 'student') {
      setShellLoading(true)
      void load('shellStudent').finally(() => setShellLoading(false))
      void ensureNotificationsLoaded()
    } else if (moduleId === 'admin') {
      if (role !== 'super_user') {
        setShellLoading(true)
        void load('shellInstitution').finally(() => setShellLoading(false))
      }
      void ensureNotificationsLoaded()
    } else if (moduleId === 'tutor') {
      void ensureNotificationsLoaded()
    }
  }, [moduleId, load, ensureNotificationsLoaded, role, pathname])

  const config = moduleRegistry[moduleId]
  const platformMode = role === 'super_user'
  const platformOverview = role === 'super_user' && isPlatformContext() && !pathname.includes('/platform/organizations/')
  const sidebarSubtitle =
    moduleId === 'student' && studentProfile
      ? studentProfileSubtitle(studentProfile)
      : moduleId === 'student' && shellLoading
        ? 'Loading profile…'
        : moduleId === 'admin' && platformMode
          ? platformOverview
            ? 'Platform console'
            : 'Organization registry'
          : moduleId === 'admin' && overview?.institution.name
          ? overview.institution.name
          : undefined
  const profile = getSidebarProfile(moduleId, user, {
    subtitle: sidebarSubtitle,
    isPlatformSuperUserInContext: isPlatformSuperUser || platformMode,
    adminPortal,
    canManageTenant,
  })
  const nav =
    moduleId === 'admin' && role === 'super_user'
      ? [
          { label: 'Organizations', href: '/admin/platform', icon: 'Building2' },
          { label: 'Add organization', href: '/admin/platform/onboard', icon: 'Upload' },
          { label: 'Platform admins', href: '/admin/platform/admins', icon: 'Shield' },
        ]
      : moduleId === 'admin'
        ? adminNavForPortal(config.nav, branchScoped)
        : config.nav
  const homePath = moduleId === 'admin' && role === 'super_user' ? '/admin/platform' : `/${moduleId}`

  const sidebarNav = (
    <>
      <nav
        className="flex-1 min-h-0 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin"
        aria-label="Primary"
      >
        {!collapsed && (
          <p className="px-3 mb-2 nav-section-label">
            {moduleId === 'admin' && role !== 'super_user' ? portalLabel : 'Workspace'}
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
      </nav>

      <div className="shrink-0 px-2 py-3 border-t border-border space-y-2">
        <RoleSwitcher collapsed={collapsed} />
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl">
            <div className="w-9 h-9 rounded-full sidebar-avatar grid place-items-center font-semibold text-sm shrink-0">
              {profile.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-gold-500 font-medium">
                {profile.roleLabel}
              </div>
              <div className="text-sm font-medium truncate text-white">{profile.name}</div>
              <div className="text-[11px] text-navy-200 truncate">{profile.subtitle}</div>
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
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:bg-navy-700/60 hover:text-white transition-colors',
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
    <div className="relative h-dvh overflow-hidden text-foreground flex flex-col bg-background topo-texture safe-top">
      {/* Unified top row: sidebar brand + navbar */}
      <div className="shrink-0 h-14 flex items-stretch border-b border-border bg-card z-ln-sticky">
        <div
          className={cn(
            'hidden lg:flex items-center shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-navy-900 px-2 transition-[width] duration-200 ease-out',
            collapsed ? 'w-[72px] justify-center' : 'w-[260px] justify-end',
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="btn btn-ghost size-9 text-navy-200 hover:text-white hover:bg-navy-700/60 shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-[18px] h-[18px]" />
          </button>
        </div>

        <header className="flex-1 min-w-0 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 bg-card">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-secondary p-2 text-muted-foreground shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <PrismLogo
            size="sm"
            showWordmark
            showTagline={false}
            href={homePath}
            className="min-w-0"
          />

          <div className="ml-auto flex items-center gap-1.5">
            {(moduleId === 'admin' || moduleId === 'tutor') && (
              <>
                {role === 'super_user' && <OrgSwitcher />}
                {((moduleId === 'admin' && role !== 'super_user') || moduleId === 'tutor') && (
                  <BranchSwitcher />
                )}
              </>
            )}
            <NotificationBell moduleId={moduleId} />
          </div>
        </header>
      </div>

      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <aside
          className={cn(
            'hidden lg:flex shrink-0 h-full flex-col overflow-hidden csc-sidebar transition-[width] duration-200 ease-out',
            collapsed ? 'w-[72px]' : 'w-[260px]',
          )}
        >
          {sidebarNav}
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="lg:hidden fixed inset-0 z-ln-drawer flex"
              variants={drawerOverlay}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button
                type="button"
                className="absolute inset-0 bg-ink/40"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              />
              <motion.aside
                className="relative w-[min(100%,300px)] h-full csc-sidebar flex flex-col overflow-hidden shadow-lg"
                variants={slideFromLeft}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center justify-between gap-2 h-14 px-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                  <PrismLogo size="sm" showWordmark href={homePath} />
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground shrink-0"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{sidebarNav}</div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto scrollbar-thin safe-bottom">
          <PageBackBar moduleId={moduleId} />
          <Outlet />
        </main>
      </div>

      {moduleId === 'student' && <StudentPendingAssessmentReminder />}
    </div>
  )
}

function PageBackBar({ moduleId }: { moduleId: ModuleId }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { role } = useAuth()
  const back = resolveBackNavigation(moduleId, pathname, role)

  if (!back) return null

  return (
    <button
      type="button"
      onClick={() => navigate(back.href)}
      className="hidden md:inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground mb-6 -mt-1 transition-colors group print:hidden"
    >
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card group-hover:border-accent/30 group-hover:bg-secondary transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </span>
      <span>{back.label}</span>
    </button>
  )
}

function resolveBackNavigation(
  moduleId: ModuleId,
  pathname: string,
  role: UserRole | null,
): { href: string; label: string } | null {
  const home = `/${moduleId}`
  if (pathname === home) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== moduleId || segments.length < 2) return null

  const section = segments[1]

  if (section === 'platform') {
    if (segments[2] === 'organizations' && segments[3]) {
      return { href: `${home}/platform`, label: 'Organizations' }
    }
    return null
  }

  if (role === 'super_user') return null

  // Manage hub (students / staff / branches) → dashboard; center detail → branches list
  if (section === 'manage') {
    if (segments[2] === 'centers' && segments[3]) {
      return { href: `${home}/manage/centers`, label: 'Back to branches' }
    }
    return { href: home, label: 'Back to dashboard' }
  }

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
    // Student report deep-links opened from Manage → Students
    if (section === 'students') {
      return { href: `${home}/manage/students`, label: 'Back to students' }
    }
  }

  return { href: home, label: 'Back to dashboard' }
}

function isNavItemActive(item: NavItem, pathname: string, moduleId: ModuleId): boolean {
  if (pathname === item.href) return true

  // Platform console root — only highlight for org list + org detail, not sibling tabs.
  if (item.href === '/admin/platform') {
    return pathname.startsWith('/admin/platform/organizations/')
  }

  const base = `/${moduleId}`
  if (item.href === base) return false

  return pathname.startsWith(`${item.href}/`)
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
  const active = isNavItemActive(item, pathname, moduleId)

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
        <Icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-gold-500')} />
      )}
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge != null && (
        <span className="font-mono-data text-[10px] bg-gold-500/20 text-gold-600 px-2 py-0.5 rounded-full">
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
    <motion.div
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-6 mb-6 border-b border-border"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-navy-500 font-sans font-semibold mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[28px] sm:text-[34px] font-semibold text-ink tracking-tight leading-[1.15]">
          {title}
        </h1>
        {sub && (
          <p className="text-muted-foreground mt-2.5 max-w-2xl text-[15px] leading-relaxed font-sans">{sub}</p>
        )}
      </div>
      {actions && <div className="page-actions shrink-0">{actions}</div>}
    </motion.div>
  )
}

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn('glass-card p-4 sm:p-5', className)}
      whileHover={{ y: -2 }}
      transition={springSoft}
    >
      {children}
    </motion.div>
  )
}

export function AppStat({
  label,
  value,
  unit,
  hint,
  tone = 'default',
  compact = false,
}: {
  label: string
  value: string | number
  unit?: string
  hint?: string
  tone?: 'default' | 'accent' | 'leaf' | 'rose'
  compact?: boolean
}) {
  const toneColor =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'leaf'
        ? 'text-leaf'
        : tone === 'rose'
          ? 'text-rose'
          : 'text-foreground'

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex min-w-[4.75rem] flex-col rounded-md border border-border/80 bg-background/80 px-2.5 py-1.5',
          'hover:border-accent/25 transition-colors',
        )}
      >
        <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium leading-none truncate">
          {label}
        </div>
        <div className={cn('mt-1 font-display text-base leading-none font-semibold tabular-nums', toneColor)}>
          {value}
          {unit && <span className="text-[10px] text-muted-foreground ml-0.5 font-sans font-normal">{unit}</span>}
        </div>
        {hint && (
          <div className="text-[9px] text-muted-foreground/80 mt-0.5 leading-none truncate">{hint}</div>
        )}
      </div>
    )
  }

  return (
    <AppCard className="hover:border-accent/30 transition-colors">
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
