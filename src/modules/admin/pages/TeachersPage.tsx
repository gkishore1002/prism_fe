import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { ownerTeachers } from '@/data/ownerMock'

export function AdminTeachersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Teacher Impact Analytics"
        title="Teachers"
        sub="Effectiveness measured through student improvement, batch performance and readiness lift."
      />
      <AppCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Teacher</th>
              <th className="text-left px-5 py-3">Subject · Grade</th>
              <th className="text-right px-5 py-3">Students</th>
              <th className="text-right px-5 py-3">Improved %</th>
              <th className="text-right px-5 py-3">Avg growth</th>
              <th className="text-right px-5 py-3">Readiness lift</th>
            </tr>
          </thead>
          <tbody>
            {ownerTeachers.map((t) => (
              <tr key={t.name} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{t.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{t.subject}</td>
                <td className="px-5 py-4 text-right font-mono-data">{t.students}</td>
                <td className="px-5 py-4 text-right font-mono-data">{t.improved}%</td>
                <td className="px-5 py-4 text-right font-mono-data text-leaf">+{t.growth}%</td>
                <td className="px-5 py-4 text-right font-mono-data text-accent">+{t.readiness}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>
    </>
  )
}
