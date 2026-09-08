import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
import { useAcademicYears } from '@/hooks/useAcademicYears'

function suggestNextYearName(currentName?: string | null): string {
  const match = (currentName || '').match(/^(\d{4})\s*[-–]\s*(\d{2}|\d{4})$/)
  if (!match) return '2026-27'
  const start = Number(match[1]) + 1
  const endRaw = match[2]
  const end =
    endRaw.length === 2
      ? String((Number(endRaw) + 1) % 100).padStart(2, '0')
      : String(Number(endRaw) + 1)
  return `${start}-${end}`
}

export function AcademicYearsSettingsCard() {
  const {
    years,
    activeYearId,
    activeYear,
    currentYear,
    setActiveYearId,
    createYear,
    setCurrentYear,
    loading,
  } = useAcademicYears()
  const [name, setName] = useState('')
  const [makeCurrent, setMakeCurrent] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const suggested = useMemo(
    () => suggestNextYearName(currentYear?.name ?? activeYear?.name),
    [currentYear?.name, activeYear?.name],
  )

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!/^\d{4}-\d{2}$/.test(trimmed) && !/^\d{4}-\d{4}$/.test(trimmed)) {
      setError('Use format 2026-27')
      return
    }
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await createYear({ name: trimmed, isCurrent: makeCurrent })
      setName('')
      setSuccess(
        makeCurrent
          ? `${trimmed} added and set as current.`
          : `${trimmed} added. Header filter switched to this year.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create academic year')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppCard className="mb-6">
      <h3 className="font-display font-semibold text-foreground mb-1">Academic years</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Add years and mark which is current. The navbar switcher only changes what you are
        viewing — it does not change the current year.
      </p>

      <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 mb-5">
        <label className="block">
          <span className="text-sm text-muted-foreground">New year</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={suggested}
            className="mt-1 w-full max-w-xs border border-border rounded-md px-3 py-2 text-sm bg-background"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={makeCurrent}
            onChange={(e) => setMakeCurrent(e.target.checked)}
            className="rounded border-border"
          />
          Set as current year
        </label>
        <div>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className={`${btnClass.primary} text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50`}
          >
            <Plus className="w-4 h-4" />
            {busy ? 'Saving…' : 'Add year'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm text-foreground">
          {success}
        </div>
      )}

      {loading && years.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading years…</p>
      ) : years.length === 0 ? (
        <p className="text-sm text-muted-foreground">No academic years yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {years.map((y) => (
            <li
              key={y.id}
              className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{y.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {y.isCurrent ? 'Current year' : 'Inactive'}
                  {activeYearId === y.id ? ' · viewing in header' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!y.isCurrent && (
                  <button
                    type="button"
                    disabled={busy}
                    className={`${btnClass.secondary} text-xs px-2.5 py-1 disabled:opacity-50`}
                    onClick={() => {
                      void (async () => {
                        setBusy(true)
                        setError(null)
                        setSuccess(null)
                        try {
                          await setCurrentYear(y.id)
                          setSuccess(`${y.name} is now the current year.`)
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : 'Could not set current year',
                          )
                        } finally {
                          setBusy(false)
                        }
                      })()
                    }}
                  >
                    Make current
                  </button>
                )}
                {activeYearId !== y.id && (
                  <button
                    type="button"
                    className={`${btnClass.secondary} text-xs px-2.5 py-1`}
                    onClick={() => setActiveYearId(y.id)}
                  >
                    View in header
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  )
}
