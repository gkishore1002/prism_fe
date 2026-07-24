import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { useAuth } from '@/hooks/useAuth'
import { authTheme } from '@/modules/auth/lib/authTheme'
import { LoginHeroPanel } from '@/modules/auth/components/LoginHeroPanel'
import { CscLogo } from '@/modules/auth/components/CscLogo'
import type { UserRole } from '@/types'

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  student: GraduationCap,
  tutor: Users,
  admin: Shield,
}

const roleAccents: Record<UserRole, string> = {
  student: 'accent-blue',
  tutor: 'accent-yellow',
  admin: 'accent-indigo',
}

const roleIconBg: Record<UserRole, string> = {
  student: 'bg-blue-100 text-blue-600',
  tutor: 'bg-yellow-100 text-yellow-700',
  admin: 'bg-indigo-100 text-indigo-600',
}

const loginCardClass =
  'glass-card border border-border rounded-[14px] p-6 sm:p-8 ios-shadow-lg'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, selectRole, pendingRoleSelection, cancelRoleSelection } = useAuth()

  const [email, setEmail] = useState('demo@prism.app')
  const [password, setPassword] = useState('demo123')
  const [institutionCode, setInstitutionCode] = useState('BRIGHTPATH')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = await login(email, password, institutionCode)
      if (path) navigate(path, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePickRole = async (role: UserRole) => {
    setLoading(true)
    try {
      const path = await selectRole(role)
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
          footer="BrightPath Academy"
        />

        <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-5 sm:p-8`}>
          <div className={`w-full max-w-[420px] ${loginCardClass}`}>
            <div className="flex justify-center mb-6 lg:hidden">
              <CscLogo size="sm" variant="onLight" />
            </div>

            <div className="hidden lg:block mb-6 pb-5 border-b border-secondary">
              <p className="text-[10px] font-display font-semibold uppercase tracking-[0.22em] text-blue-700">
                Computer Software College
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Centre · Prism Software</p>
            </div>

            <h2 className="text-xl font-display font-bold text-foreground text-center lg:text-left">
              Select your role
            </h2>
            <p className="text-[12px] text-muted-foreground text-center lg:text-left mt-1 mb-6 truncate" title={pendingRoleSelection.email}>
              {pendingRoleSelection.email}
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingRoleSelection.roles.map((r) => {
                const Icon = roleIcons[r.role]
                return (
                  <button
                    key={r.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePickRole(r.role)}
                    className={`w-full text-left ${authTheme.roleCard} p-4 ${roleAccents[r.role]} disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${roleIconBg[r.role]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-foreground text-[14px]">{r.label}</p>
                        <p className="text-[12px] text-muted-foreground font-sans">{r.description}</p>
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
    )
  }

  return (
    <div className="min-h-screen flex">
      <LoginHeroPanel
        headline="Transform assessments into academic intelligence"
        subtitle="Diagnose learning gaps, predict exam readiness, and guide every learner toward measurable improvement."
        footer="Board → Grade → Subject → Chapter → Topic → Question"
      />

      <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-5 sm:p-8`}>
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center lg:hidden">
            <CscLogo size="md" variant="onLight" />
          </div>

          <div className={loginCardClass}>
            <div className="hidden lg:flex items-start gap-4 mb-6 pb-6 border-b border-secondary">
              <div className="w-11 h-11 rounded-[16px] gradient-brand-icon flex items-center justify-center shrink-0 ios-shadow-sm">
                <span className="font-display font-black text-[13px] text-ink tracking-tight">CSC</span>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-ink leading-snug">
                  Computer Software College
                </p>
                <p className="text-[12px] font-display font-semibold text-foreground mt-1">
                  Centre · <span className="text-gradient">Prism</span> Software
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Academic Intelligence Platform</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-muted-foreground lg:hidden">
                Computer Software College
              </p>
              <h2 className="mt-1 lg:mt-0 text-xl sm:text-[22px] font-display font-bold text-foreground leading-tight">
                Sign in to <span className="text-gradient">Prism</span>
              </h2>
              <p className="mt-2 text-[12px] text-muted-foreground font-sans leading-relaxed">
                Use your institution credentials. Demo password:{' '}
                <span className="font-mono-data text-foreground">demo123</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="institution" className="mb-1.5 block text-xs font-display font-semibold text-foreground">
                  Institution code
                </label>
                <input
                  id="institution"
                  type="text"
                  required
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                  className={authTheme.input}
                  placeholder="BRIGHTPATH"
                />
                <p className="mt-1 text-[10px] text-muted-foreground font-sans">
                  Your institute&apos;s login code — not a center/branch ID. After login, add more centers under Admin → Centers.
                </p>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-display font-semibold text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authTheme.input}
                  placeholder="demo@prism.app"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-display font-semibold text-foreground">
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
                    className={`${authTheme.input} pr-11`}
                    placeholder="demo123"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:bg-secondary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="action" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <InlineLoader size="xs" aria-label="Signing in" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in to Prism'
                )}
              </Button>
            </form>

            <p className="mt-5 pt-4 border-t border-secondary text-[11px] text-muted-foreground text-center font-sans leading-relaxed">
              Try <span className="font-mono-data text-foreground">arjun@brightpath.edu</span>
              {' '}or <span className="font-mono-data text-foreground">demo@prism.app</span>
            </p>
          </div>

          <p className="mt-5 text-center text-[10px] text-muted-foreground/60 font-display uppercase tracking-[0.18em] hidden lg:block">
            Computer Software College · Centre Prism Software
          </p>
        </div>
      </div>
    </div>
  )
}