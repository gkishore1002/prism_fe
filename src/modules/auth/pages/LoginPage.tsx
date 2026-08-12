import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { authTheme } from '@/modules/auth/lib/authTheme'
import { fetchLoginOrganizations, roleOptionKey, type LoginOrganization, type RoleOption } from '@/modules/auth/lib/authApi'
import { LoginHeroPanel } from '@/modules/auth/components/LoginHeroPanel'
import { PrismBrandLockup } from '@/components/brand/PrismLogo'
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '@/lib/motion'
import type { UserRole } from '@/types'

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  student: GraduationCap,
  tutor: Users,
  admin: Shield,
  super_user: Shield,
}

const roleAccents: Record<UserRole, string> = {
  student: 'accent-blue',
  tutor: 'accent-yellow',
  admin: 'accent-indigo',
  super_user: 'accent-indigo',
}

const roleIconBg: Record<UserRole, string> = {
  student: 'bg-blue-100 text-accent',
  tutor: 'bg-yellow-100 text-amber',
  admin: 'bg-emerald-50 text-emerald-600',
  super_user: 'bg-emerald-50 text-emerald-600',
}

const DEFAULT_DEMO_ORG_CODE = 'DEMO001'

function pickDefaultOrgCode(orgs: LoginOrganization[], stored: string): string {
  if (stored && orgs.some((o) => o.code === stored)) return stored
  const demo = orgs.find((o) => o.code === DEFAULT_DEMO_ORG_CODE)
  if (demo) return demo.code
  return orgs[0]?.code ?? ''
}

function orgOptionLabel(org: LoginOrganization): string {
  return `${org.name} (${org.code})`
}

const loginCardClass = 'rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card'

const LAST_ORG_KEY = 'prism_last_org_code'

function LoginFormPanel({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen`}>
      <motion.div
        className="w-full max-w-[340px]"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-5 flex justify-center lg:hidden">
          <PrismBrandLockup variant="light" />
        </motion.div>

        <motion.div variants={scaleIn} className={loginCardClass}>
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, selectRole, pendingRoleSelection, cancelRoleSelection } = useAuth()
  const { showToast } = useToast()

  const [organizations, setOrganizations] = useState<LoginOrganization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [selectedOrgCode, setSelectedOrgCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchLoginOrganizations()
      .then((orgs) => {
        if (cancelled) return
        setOrganizations(orgs)
        const stored = sessionStorage.getItem(LAST_ORG_KEY) ?? ''
        setSelectedOrgCode(pickDefaultOrgCode(orgs, stored))
      })
      .catch(() => {
        if (!cancelled) setOrganizations([])
      })
      .finally(() => {
        if (!cancelled) setOrgsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.code === selectedOrgCode) ?? null,
    [organizations, selectedOrgCode],
  )

  function showLoginError(message: string, title = 'Sign in failed') {
    showToast({
      title,
      message,
      variant: 'urgent',
      placement: 'center',
      actionLabel: 'OK',
    })
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgCode) {
      showLoginError('Select an organization to continue.', 'Organization required')
      return
    }
    setLoading(true)
    try {
      sessionStorage.setItem(LAST_ORG_KEY, selectedOrgCode)
      const path = await login(email, password, selectedOrgCode)
      if (path) navigate(path, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      const title =
        message.toLowerCase().includes('disabled') || message.toLowerCase().includes('csc')
          ? 'Account disabled'
          : 'Sign in failed'
      showLoginError(message, title)
    } finally {
      setLoading(false)
    }
  }

  const handlePickRole = async (option: RoleOption) => {
    setLoading(true)
    try {
      const path = await selectRole(option)
      navigate(path, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Role selection failed'
      const title =
        message.toLowerCase().includes('disabled') || message.toLowerCase().includes('csc')
          ? 'Account disabled'
          : 'Could not continue'
      showLoginError(message, title)
    } finally {
      setLoading(false)
    }
  }

  if (pendingRoleSelection) {
    return (
      <div className="min-h-screen flex bg-background">
        <LoginHeroPanel
          headline="Choose your portal"
          subtitle="Your account has access to multiple roles. Select how you're working today."
        />

        <LoginFormPanel title="Select your role" subtitle={pendingRoleSelection.email}>
          <motion.div
            className="space-y-2 max-h-72 overflow-y-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {pendingRoleSelection.roles.map((r) => {
              const Icon = roleIcons[r.role]
              const optionKey = `${r.role}-${r.adminPortal ?? 'default'}`
              return (
                <motion.button
                  key={optionKey}
                  type="button"
                  disabled={loading}
                  variants={staggerItem}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void handlePickRole(r)}
                  className={`w-full text-left ${authTheme.roleCard} p-3 ${roleAccents[r.role]} disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${roleIconBg[r.role]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm">{r.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

          <button
            type="button"
            onClick={cancelRoleSelection}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        </LoginFormPanel>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <LoginHeroPanel
        headline="Transform assessments into academic intelligence"
        subtitle="Diagnose learning gaps, predict exam readiness, and guide every learner toward measurable improvement."
        footer="Board → Grade → Subject → Chapter → Topic → Question"
      />

      <LoginFormPanel
        title="Sign in"
        subtitle="Select your organization, then sign in with phone@gmail.com and password."
      >
        {orgsLoading ? (
          <div className="py-6 flex justify-center">
            <InlineLoader size="sm" aria-label="Loading organizations" />
          </div>
        ) : organizations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No organizations available yet. Restart the backend with demo seed enabled (SEED_DEMO=true).
          </p>
        ) : (
          <motion.form
            className="space-y-3"
            onSubmit={handleSignIn}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <label htmlFor="organization" className="mb-1 block text-xs font-medium text-foreground">
                Organization
              </label>
              <select
                id="organization"
                required
                value={selectedOrgCode}
                onChange={(e) => setSelectedOrgCode(e.target.value)}
                className={authTheme.inputCompact}
              >
                <option value="" disabled>
                  Select organization
                </option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.code}>
                    {orgOptionLabel(org)}
                  </option>
                ))}
              </select>
              {selectedOrg && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Code: <span className="font-medium text-foreground">{selectedOrg.code}</span>
                  {selectedOrg.code === 'SYSTEM'
                    ? ' · platform'
                    : selectedOrg.code === DEFAULT_DEMO_ORG_CODE
                      ? ' · demo'
                      : ''}
                </p>
              )}
            </motion.div>

            <motion.div variants={staggerItem}>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authTheme.inputCompact}
                placeholder="9876543210@gmail.com"
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authTheme.inputCompact} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:bg-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" variant="primary" size="md" className="w-full mt-1" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <InlineLoader size="xs" aria-label="Signing in" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </motion.div>
          </motion.form>
        )}
      </LoginFormPanel>
    </div>
  )
}
