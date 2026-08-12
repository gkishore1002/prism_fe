import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { authTheme } from '@/modules/auth/lib/authTheme'
import { createPlatformOrganization } from '@/lib/api/platformApi'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'
import type { Institution } from '@/types'

const ORG_TYPES: Institution['type'][] = ['coaching', 'school', 'tuition', 'training']

export function PlatformOnboardPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState('')
  const [organizationCode, setOrganizationCode] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [password, setPassword] = useState('')
  const [orgType, setOrgType] = useState<Institution['type']>('coaching')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(ownerPhone)) {
      setError('Enter a valid 10-digit phone number for the organization owner.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const created = await createPlatformOrganization({
        organizationName: organizationName.trim(),
        organizationCode: organizationCode.trim().toUpperCase(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        password: password.trim() || undefined,
        type: orgType,
      })
      navigate(`/admin/platform/organizations/${created.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboard organization"
        sub="Creates the organization registry entry, tenant schema, and organization owner with phone-based login."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AppCard>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <form className="space-y-5" onSubmit={(e) => void handleCreate(e)}>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Organization</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization name</label>
                  <input
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className={authTheme.input}
                    placeholder="BrightPath Academy"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization code</label>
                  <input
                    required
                    value={organizationCode}
                    onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                    className={authTheme.input}
                    placeholder="DEMO002"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization type</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as Institution['type'])}
                    className={authTheme.input}
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Organization owner</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name</label>
                  <input
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={authTheme.input}
                  />
                </div>
                <div className="md:col-span-2">
                  <PhoneCredentialFields
                    phone={ownerPhone}
                    onPhoneChange={setOwnerPhone}
                    password={password}
                    onPasswordChange={setPassword}
                    idPrefix="platform-owner"
                  />
                </div>
                {isValidPhone(ownerPhone) && (
                  <p className="md:col-span-2 text-xs text-muted-foreground">
                    Owner login: {phoneToLoginEmail(ownerPhone)} · Password: {resolvePassword(ownerPhone, password)}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={creating || !isValidPhone(ownerPhone)}>
              {creating ? 'Creating…' : 'Create organization'}
            </Button>
          </form>
        </AppCard>

        <AppCard>
          <h3 className="text-sm font-semibold text-foreground mb-2">Phone login pattern</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every new user gets login email <span className="font-medium text-foreground">phone@gmail.com</span> and
            password equal to their phone number unless you set a custom password during creation.
          </p>
        </AppCard>
      </div>
    </div>
  )
}
