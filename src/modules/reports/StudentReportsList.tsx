import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { FileText } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { useCurriculum } from '@/hooks/useCurriculum'

interface StudentReportsListProps {
  reportPathPrefix: string
}

export function StudentReportsList({ reportPathPrefix }: StudentReportsListProps) {
  const { students, loading, ensureLoaded } = useCurriculum()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void ensureLoaded().finally(() => setReady(true))
  }, [ensureLoaded])

  if (!ready || loading) {
    return <PageLoader label="Loading students…" />
  }

  if (students.length === 0) {
    return (
      <AppCard>
        <p className="text-sm text-muted-foreground">
          No students yet. Add students under Students or Curriculum Setup.
        </p>
      </AppCard>
    )
  }

  return (
    <AppCard className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="text-left px-5 py-3">Student</th>
            <th className="text-left px-5 py-3">Batch · Board</th>
            <th className="text-left px-5 py-3">Health</th>
            <th className="text-right px-5 py-3">Readiness</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t border-border hover:bg-secondary/20">
              <td className="px-5 py-4 font-medium">{s.name}</td>
              <td className="px-5 py-4 text-muted-foreground text-xs">
                {s.batch ?? '—'}
                <br />
                {s.board} · {s.grade}
              </td>
              <td className="px-5 py-4">
                <HealthBadge status={s.status} score={s.health} />
              </td>
              <td className="px-5 py-4 text-right font-mono-data">{s.readiness}%</td>
              <td className="px-5 py-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <Link
                    to={`${reportPathPrefix}/${s.id}/reports`}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View reports
                  </Link>
                  <Link
                    to={`${reportPathPrefix}/${s.id}/report`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    Learning genome
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppCard>
  )
}