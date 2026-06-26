import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { getInstitutionName } from '@/modules/auth/lib/authApi'
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

const loginCardClass =
  'bg-surface rounded-[16px] border border-surface-200/80 p-6 sm:p-8 shadow-[0_4px_6px_rgba(22,58,102,0.04),0_20px_48px_rgba(22,58,102,0.12)]'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, selectRole, pendingRoleSelection, cancelRoleSelection } = useAuth()

  const [email, setEmail] = useState('demo@learnova.app')
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

  const handlePickRole = (role: UserRole) => {
    setLoading(true)
    try {
      const path = selectRole(role)
      navigate(path, { replace: true })
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
          footer={getInstitutionName()}
        />

        <div className={`flex-1 ${authTheme.lightPanel} flex items-center justify-center p-5 sm:p-8`}>
          <div className={`w-full max-w-[420px] ${loginCardClass}`}>
            <div className="flex justify-center mb-6 lg:hidden">
              <CscLogo size="sm" variant="onLight" />
            </div>

            <div className="hidden lg:block mb-6 pb-5 border-b border-surface-100">
              <p className="text-[10px] font-display font-semibold uppercase tracking-[0.22em] text-blue-700">
                Computer Software College
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Centre · Learnova Software</p>
            </div>

            <h2 className="text-xl font-display font-bold text-text-primary text-center lg:text-left">
              Select your role
            </h2>
            <p className="text-[12px] text-text-secondary text-center lg:text-left mt-1 mb-6 truncate" title={pendingRoleSelection.email}>
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
                    className={`w-full text-left ${authTheme.roleCard} p-4 ${roleAccents[r.role]} disabled:opacity-50 shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-text-primary text-[14px]">{r.label}</p>
                        <p className="text-[12px] text-text-secondary font-sans">{r.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted ml-auto shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={cancelRoleSelection}
              className="mt-5 w-full text-xs font-display font-medium text-text-muted hover:text-text-secondary"
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
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <CscLogo size="md" variant="onLight" />
          </div>

          <div className={loginCardClass}>
            {/* Desktop institutional header inside card */}
            <div className="hidden lg:flex items-start gap-4 mb-6 pb-6 border-b border-surface-100">
              <div className="w-11 h-11 rounded-xl gradient-brand-icon flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(212,160,8,0.35)]">
                <span className="font-display font-black text-[13px] text-blue-900 tracking-tight">CSC</span>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-blue-800 leading-snug">
                  Computer Software College
                </p>
                <p className="text-[12px] font-display font-semibold text-text-primary mt-1">
                  Centre · <span className="text-gradient">Learnova</span> Software
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 font-sans">Academic Intelligence Platform</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-text-muted lg:hidden">
                Computer Software College
              </p>
              <h2 className="mt-1 lg:mt-0 text-xl sm:text-[22px] font-display font-bold text-text-primary leading-tight">
                Sign in to <span className="text-gradient">Learnova</span>
              </h2>
              <p className="mt-2 text-[12px] text-text-secondary font-sans leading-relaxed">
                Use your institution credentials. Demo password:{' '}
                <span className="font-mono-data text-text-primary">demo123</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="institution" className="mb-1.5 block text-xs font-display font-semibold text-text-primary">
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
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-display font-semibold text-text-primary">
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
                  placeholder="demo@learnova.app"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-display font-semibold text-text-primary">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:bg-surface-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="action" size="lg" className="w-full shadow-[0_4px_14px_rgba(212,160,8,0.35)]" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to Learnova'}
              </Button>
            </form>

            <p className="mt-5 pt-4 border-t border-surface-100 text-[11px] text-text-muted text-center font-sans leading-relaxed">
              Try <span className="font-mono-data text-text-secondary">arjun@brightpath.edu</span>
              {' '}or <span className="font-mono-data text-text-secondary">demo@learnova.app</span>
            </p>
          </div>

          <p className="mt-5 text-center text-[10px] text-text-faint font-display uppercase tracking-[0.18em] hidden lg:block">
            Computer Software College · Centre Learnova Software
          </p>
        </div>
      </div>
    </div>
  )
}
