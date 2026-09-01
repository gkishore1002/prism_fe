import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { useAuth } from '@/hooks/useAuth'
import { authTheme } from '@/modules/auth/lib/authTheme'
import {
  fetchLoginOrganizations,
  roleOptionKey,
  type LoginOrganization,
  type RoleOption,
} from '@/modules/auth/lib/authApi'
import { LoginHeroPanel } from '@/modules/auth/components/LoginHeroPanel'
import { PrismLogoFullMotion } from '@/components/brand/PrismLogo'
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
  student: 'bg-sky-100 text-sky-600',
  tutor: 'bg-indigo-100 text-indigo-600',
  admin: 'bg-violet-100 text-violet-600',
  super_user: 'bg-violet-100 text-violet-600',
}

const DEFAULT_DEMO_ORG_CODE = 'DEMO001'
const LAST_ORG_KEY = 'prism_last_org_code'

const loginCardClass =
  'glass-card border border-border rounded-xl p-5 sm:p-6 ios-shadow-lg'

const loginFormMaxWidth = 'max-w-[360px]'

function pickDefaultOrgCode(orgs: LoginOrganization[], stored: string): string {
  if (stored && orgs.some((o) => o.code === stored)) return stored
  const demo = orgs.find((o) => o.code === DEFAULT_DEMO_ORG_CODE)
  if (demo) return demo.code
  return orgs[0]?.code ?? ''
}

function orgOptionLabel(org: LoginOrganization): string {
  return `${org.name} (${org.code})`
}

function StackRackCredit({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-sans ${className}`}
    >
      <span>powered by stackrack</span>
      <img
        src="/brand/stackrack-logo.png"
        alt=""
        width={14}
        height={14}
        className="h-3.5 w-3.5 object-contain"
      />
    </p>
  )
}

function LoginFormBrandHeader() {
  return (
    <div className="mb-4 pb-4 border-b border-secondary flex justify-center overflow-visible">
      <PrismLogoFullMotion maxWidth={148} />
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, selectRole, pendingRoleSelection, cancelRoleSelection } = useAuth()

  const [organizations, setOrganizations] = useState<LoginOrganization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState('')
  const [selectedOrgCode, setSelectedOrgCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchLoginOrganizations()
      .then((orgs) => {
        if (cancelled) return
        setOrgsError('')
        setOrganizations(orgs)
        const stored = sessionStorage.getItem(LAST_ORG_KEY) ?? ''
        setSelectedOrgCode(pickDefaultOrgCode(orgs, stored))
      })
      .catch((err) => {
        if (cancelled) return
        setOrganizations([])
        setOrgsError(
          err instanceof Error
            ? err.message
            : 'Could not load organizations from the API. Check the frontend API URL and CORS.',
        )
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedOrgCode) {
      setError('Select an organization to continue.')
      return
    }
    setLoading(true)
    try {
      sessionStorage.setItem(LAST_ORG_KEY, selectedOrgCode)
      const path = await login(email, password, selectedOrgCode)
      if (path) navigate(path, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePickRole = async (option: RoleOption) => {
    setError('')
    setLoading(true)
    try {
      const path = await selectRole(option)
      navigate(path, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role selection failed')
    } finally {
      setLoading(false)
    }
  }

  if (pendingRoleSelection) {
    return (
      <div className="min-h-screen flex">
        <LoginHeroPanel
          headline="Choose your portal"
          subtitle="Your account has access to multiple roles. Select how you're working today."
          footer={selectedOrg?.name ?? 'Prism Software'}
        />

        <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-4 sm:p-6`}>
          <div className={`w-full ${loginFormMaxWidth}`}>
            <div className={loginCardClass}>
              <LoginFormBrandHeader />

            <h2 className="text-lg font-display font-bold text-foreground text-center">
              Select your role
            </h2>
            <p
              className="text-[11px] text-muted-foreground text-center mt-1 mb-4 truncate"
              title={pendingRoleSelection.email}
            >
              {pendingRoleSelection.email}
            </p>

            {error && (
              <div
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingRoleSelection.roles.map((r) => {
                const Icon = roleIcons[r.role]
                const optionKey = roleOptionKey(r)
                return (
                  <button
                    key={optionKey}
                    type="button"
                    disabled={loading}
                    onClick={() => void handlePickRole(r)}
                    className={`w-full text-left ${authTheme.roleCard} p-3 ${roleAccents[r.role]} disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${roleIconBg[r.role]}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-foreground text-[14px]">{r.label}</p>
                        <p className="text-[12px] text-muted-foreground font-sans line-clamp-2">
                          {r.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={cancelRoleSelection}
              className="mt-5 w-full text-xs font-display font-medium text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <LoginHeroPanel
        headline="Transform assessments into academic intelligence"
        subtitle="Diagnose learning gaps, predict exam readiness, and guide every learner toward measurable improvement."
        footer="Board → Grade → Subject → Chapter → Topic → Question"
      />

      <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-4 sm:p-6`}>
        <div className={`w-full ${loginFormMaxWidth}`}>
          <div className={loginCardClass}>
            <LoginFormBrandHeader />

            <div className="mb-4 text-center">
              <h2 className="text-lg font-display font-bold text-foreground">Sign in</h2>
              <p className="mt-1 text-[11px] text-muted-foreground font-sans">
                Organization, email, and password
              </p>
            </div>

            {error && (
              <div
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                role="alert"
              >
                {error}
              </div>
            )}

            {orgsLoading ? (
              <div className="py-5 flex justify-center">
                <InlineLoader size="sm" aria-label="Loading organizations" />
              </div>
            ) : organizations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">
                {orgsError
                  ? `Could not load organizations. ${orgsError}`
                  : 'No organizations found for this API. Complete first-run setup, then refresh.'}
              </p>
            ) : (
              <form className="space-y-3" onSubmit={handleSignIn}>
                <div>
                  <label
                    htmlFor="organization"
                    className="mb-1 block text-[11px] font-display font-semibold text-foreground"
                  >
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
                    <p className="mt-1 text-[10px] text-muted-foreground font-sans">
                      Code: <span className="font-mono-data text-foreground">{selectedOrg.code}</span>
                      {selectedOrg.code === 'SYSTEM'
                        ? ' · platform'
                        : selectedOrg.code === DEFAULT_DEMO_ORG_CODE
                          ? ' · demo'
                          : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-[11px] font-display font-semibold text-foreground">
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
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-[11px] font-display font-semibold text-foreground"
                  >
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
                </div>

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
              </form>
            )}

            <StackRackCredit className="mt-4 pt-3 border-t border-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
