import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { useToast } from '@/components/ui/Toast'
import { authTheme } from '@/modules/auth/lib/authTheme'
import { completeSetup, fetchSetupStatus } from '@/modules/auth/lib/setupApi'
import { PrismBrandLockup } from '@/components/brand/PrismLogo'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'

export function SetupPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [organizationName, setOrganizationName] = useState('')
  const [organizationCode, setOrganizationCode] = useState('')
  const [superAdminName, setSuperAdminName] = useState('')
  const [superAdminPhone, setSuperAdminPhone] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetchSetupStatus()
      .then((status) => {
        if (status.defaultOrganizationCode) {
          setOrganizationCode(status.defaultOrganizationCode)
        }
      })
      .catch(() => {
        setOrganizationCode('CSC')
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(superAdminPhone)) {
      showToast({
        title: 'Invalid phone number',
        message: 'Enter at least 10 digits for the organization owner phone.',
        variant: 'urgent',
      })
      return
    }

    setLoading(true)
    try {
      await completeSetup({
        organizationName,
        organizationCode,
        superAdminName,
        superAdminPhone,
        password: password.trim() || undefined,
      })
      const loginEmail = phoneToLoginEmail(superAdminPhone)
      const loginPassword = resolvePassword(superAdminPhone, password)
      showToast({
        title: 'Setup complete',
        message: `Sign in with ${loginEmail}, password ${loginPassword}, and organization code ${organizationCode.toUpperCase()}.`,
        variant: 'info',
      })
      navigate('/login', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed'
      showToast({ title: 'Setup failed', message, variant: 'urgent' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-lg rounded-xl border border-[#E8E0D4] bg-white p-6 sm:p-8 shadow-sm"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-6 flex flex-col items-center text-center gap-3">
          <PrismBrandLockup markSize={148} />
          <div>
            <h1 className="text-xl font-semibold text-foreground">First-run setup</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure this Prism deployment for your organization. This runs once per customer database.
            </p>
          </div>
        </div>

        <motion.form className="space-y-4" onSubmit={handleSubmit} variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem} className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building2 className="w-4 h-4" />
              Organization
            </div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization name</label>
            <input
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className={authTheme.input}
              placeholder="BrightPath Academy"
            />
            <label className="mb-1 mt-3 block text-xs font-medium text-muted-foreground">
              Organization code <span className="text-muted-foreground/80">(organization owner only)</span>
            </label>
            <input
              required
              value={organizationCode}
              onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
              className={authTheme.input}
              placeholder="Default from server"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Unique to this deployment. Pre-filled with the platform default — change it if your organization uses a different code. Never required at login.
            </p>
          </motion.div>

          <motion.div variants={staggerItem} className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Shield className="w-4 h-4" />
              Organization owner
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              The first admin for this organization — not the platform super user (use first-run platform seed for that).
            </p>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name</label>
            <input
              required
              value={superAdminName}
              onChange={(e) => setSuperAdminName(e.target.value)}
              className={authTheme.input}
              placeholder="Rajesh Kumar"
            />
            <div className="mt-3">
              <PhoneCredentialFields
                phone={superAdminPhone}
                onPhoneChange={setSuperAdminPhone}
                password={password}
                onPasswordChange={setPassword}
                idPrefix="setup-owner"
              />
            </div>
            {isValidPhone(superAdminPhone) && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Owner signs in with {phoneToLoginEmail(superAdminPhone)} and password{' '}
                {resolvePassword(superAdminPhone, password)}.
              </p>
            )}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <InlineLoader size="xs" aria-label="Setting up" />
                  Initializing…
                </span>
              ) : (
                'Complete setup'
              )}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
