import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Pencil, X, Check } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
import {
  fetchInstitutionPolicies,
  updateInstitutionPolicies,
} from '@/lib/api/institutionPoliciesApi'
import { useCenters } from '@/hooks/useCenters'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { AcademicYearsSettingsCard } from '@/modules/admin/components/AcademicYearsSettingsCard'
import type { AssessmentPolicy, CscPolicy, InstitutionPolicies } from '@/types'

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

function ViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{value}</span>
    </div>
  )
}

function EditNumber({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block py-2.5 border-b border-border last:border-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full max-w-[8rem] border border-border rounded-md px-3 py-2 text-sm bg-background"
      />
    </label>
  )
}

function EditToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0 cursor-pointer">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 shrink-0"
      />
    </label>
  )
}

function policiesEqual(a: InstitutionPolicies, b: InstitutionPolicies) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function AdminSettingsPage() {
  const { organization, isPlatformSuperUser, canManageTenant } = useCenters()
  const { organizationScoped } = useAdminPortalContext()
  const [saved, setSaved] = useState<InstitutionPolicies | null>(null)
  const [draft, setDraft] = useState<InstitutionPolicies | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const dirty = useMemo(
    () => saved != null && draft != null && !policiesEqual(saved, draft),
    [saved, draft],
  )

  useEffect(() => {
    void fetchInstitutionPolicies()
      .then((data) => {
        setSaved(data)
        setDraft(data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load settings'))
      .finally(() => setLoading(false))
  }, [])

  function startEdit() {
    if (saved) {
      setDraft(structuredClone(saved))
      setEditing(true)
      setError(null)
      setSuccess(null)
    }
  }

  function cancelEdit() {
    if (saved) setDraft(structuredClone(saved))
    setEditing(false)
    setError(null)
  }

  function patchAssessment(patch: Partial<AssessmentPolicy>) {
    setDraft((prev) =>
      prev ? { ...prev, assessment: { ...prev.assessment, ...patch } } : prev,
    )
  }

  function patchCsc(patch: Partial<CscPolicy>) {
    setDraft((prev) => (prev ? { ...prev, csc: { ...prev.csc, ...patch } } : prev))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateInstitutionPolicies({
        assessment: draft.assessment,
        csc: draft.csc,
      })
      setSaved(updated)
      setDraft(structuredClone(updated))
      setEditing(false)
      setSuccess('Settings saved. New rules apply to the next reassignment review and CSC check.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const view = editing ? draft : saved
  const a = view?.assessment
  const c = view?.csc

  if (!organizationScoped || !canManageTenant) {
    return <Navigate to="/admin" replace />
  }

  return (
    <>
      <PageHeader
        title="Settings"
        sub="Academic years, late exam requests, and CSC visits at your institution"
        actions={
          !loading && saved && !editing ? (
            <button
              type="button"
              onClick={startEdit}
              className={`${btnClass.secondary} text-sm px-4 py-2 inline-flex items-center gap-2`}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}
      {success && !editing && (
        <div className="mb-4 rounded-lg border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm text-foreground">
          {success}
        </div>
      )}

      {canManageTenant && organization && (
        <AppCard className="mb-6">
          <h3 className="font-display font-semibold text-foreground mb-1">Organization</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isPlatformSuperUser
              ? 'Platform super user view — internal identifiers for this tenant.'
              : 'Organization owner only — internal identifiers for this deployment.'}
          </p>
          <ViewRow label="Organization name" value={organization.name} />
          {organization.code && (
            <ViewRow
              label="Organization code"
              value={
                <span className="font-mono text-xs tracking-wide">{organization.code}</span>
              }
            />
          )}
        </AppCard>
      )}

      <AcademicYearsSettingsCard />

      {loading || !view || !a || !c ? (
        <AppCard className="text-sm text-muted-foreground py-10 text-center">Loading settings…</AppCard>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <AppCard>
              <h3 className="font-display font-semibold text-foreground mb-1">Late exam requests</h3>
              <p className="text-xs text-muted-foreground mb-4">
                When a student misses a deadline and asks to attend later.
              </p>

              {editing ? (
                <div>
                  <EditNumber
                    label="Default extra days when approved"
                    hint="How long the student may attend after approval"
                    value={a.defaultExtensionDays}
                    min={1}
                    max={a.maxExtensionDays}
                    onChange={(v) => patchAssessment({ defaultExtensionDays: v })}
                  />
                  <EditNumber
                    label="Maximum extra days"
                    value={a.maxExtensionDays}
                    min={a.defaultExtensionDays}
                    max={30}
                    onChange={(v) => patchAssessment({ maxExtensionDays: v })}
                  />
                  <EditToggle
                    label="Tutors can approve requests"
                    checked={a.allowTutorExtension}
                    onChange={(v) => patchAssessment({ allowTutorExtension: v })}
                  />
                  <EditToggle
                    label="Admins can approve above the maximum"
                    checked={a.allowAdminOverride}
                    onChange={(v) => patchAssessment({ allowAdminOverride: v })}
                  />
                  <EditToggle
                    label="Require a reason when rejecting"
                    checked={a.requireRejectionReason}
                    onChange={(v) => patchAssessment({ requireRejectionReason: v })}
                  />
                  <EditToggle
                    label="Allow a second request for the same exam"
                    hint="When off, one request per exam only"
                    checked={a.allowMultipleRequests}
                    onChange={(v) => patchAssessment({ allowMultipleRequests: v })}
                  />
                </div>
              ) : (
                <div>
                  <ViewRow
                    label="Default extra time when approved"
                    value={`${a.defaultExtensionDays} days`}
                  />
                  <ViewRow label="Maximum extra time" value={`${a.maxExtensionDays} days`} />
                  <ViewRow label="Tutors can approve" value={yesNo(a.allowTutorExtension)} />
                  <ViewRow label="Admins can exceed maximum" value={yesNo(a.allowAdminOverride)} />
                  <ViewRow
                    label="Rejection needs a reason"
                    value={yesNo(a.requireRejectionReason)}
                  />
                  <ViewRow
                    label="Multiple requests per exam"
                    value={yesNo(a.allowMultipleRequests)}
                  />
                </div>
              )}
            </AppCard>

            <AppCard>
              <h3 className="font-display font-semibold text-foreground mb-1">CSC visits</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Guardian report collection at your branch — reminders and account disable.
              </p>

              {editing ? (
                <div>
                  <EditNumber
                    label="Disable account after (days without visit)"
                    value={c.inactivityThresholdDays}
                    min={30}
                    max={365}
                    onChange={(v) => patchCsc({ inactivityThresholdDays: v })}
                  />
                  <EditNumber
                    label="Show urgent warning when this many days left"
                    value={c.warningThresholdDays}
                    min={7}
                    max={c.inactivityThresholdDays}
                    onChange={(v) => patchCsc({ warningThresholdDays: v })}
                  />
                  <EditToggle
                    label="Remind at 30 days remaining"
                    checked={c.reminder30Days}
                    onChange={(v) => patchCsc({ reminder30Days: v })}
                  />
                  <EditToggle
                    label="Remind at 14 days remaining"
                    checked={c.reminder14Days}
                    onChange={(v) => patchCsc({ reminder14Days: v })}
                  />
                  <EditToggle
                    label="Remind at 7 days remaining"
                    checked={c.reminder7Days}
                    onChange={(v) => patchCsc({ reminder7Days: v })}
                  />
                  <EditToggle
                    label="Automatically disable inactive accounts"
                    checked={c.autoDisable}
                    onChange={(v) => patchCsc({ autoDisable: v })}
                  />
                  <EditToggle
                    label="Reactivate when report is collected"
                    checked={c.autoReactivateOnCollection}
                    onChange={(v) => patchCsc({ autoReactivateOnCollection: v })}
                  />
                </div>
              ) : (
                <div>
                  <ViewRow
                    label="Disable after no visit for"
                    value={`${c.inactivityThresholdDays} days`}
                  />
                  <ViewRow
                    label="Urgent warning when"
                    value={`${c.warningThresholdDays} days left`}
                  />
                  <ViewRow
                    label="Reminders (30 / 14 / 7 days)"
                    value={[c.reminder30Days && '30', c.reminder14Days && '14', c.reminder7Days && '7']
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  />
                  <ViewRow label="Auto-disable accounts" value={yesNo(c.autoDisable)} />
                  <ViewRow
                    label="Reactivate on collection"
                    value={yesNo(c.autoReactivateOnCollection)}
                  />
                </div>
              )}
            </AppCard>
          </div>

          {editing && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving || !dirty}
                onClick={() => void handleSave()}
                className={`${btnClass.primary} text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50`}
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={cancelEdit}
                className={`${btnClass.secondary} text-sm px-4 py-2 inline-flex items-center gap-2`}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              {!dirty && (
                <span className="text-xs text-muted-foreground">No changes to save</span>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
