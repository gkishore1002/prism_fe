import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { syllabusCompletion } from '@/data/ownerMock'

function Cell({ value }: { value: number }) {
  const color =
    value >= 85
      ? 'bg-leaf/15 text-leaf'
      : value >= 70
        ? 'bg-accent/15 text-accent'
        : 'bg-rose/10 text-rose'
  return (
    <div className={`px-3 py-2 rounded-md ${color} text-center`}>
      <div className="font-mono-data text-lg">{value}%</div>
    </div>
  )
}

export function AdminSyllabusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Syllabus Completion Tracker"
        title="Coverage by batch"
        sub="Monitor curriculum coverage by subject and grade. The thing parents ask first."
      />
      <AppCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Grade</th>
              <th className="text-center px-5 py-3">Physics</th>
              <th className="text-center px-5 py-3">Chemistry</th>
              <th className="text-center px-5 py-3">Biology</th>
              <th className="text-center px-5 py-3">Mathematics</th>
            </tr>
          </thead>
          <tbody>
            {syllabusCompletion.map((row) => (
              <tr key={row.grade} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{row.grade}</td>
                <td className="px-3 py-3">
                  <Cell value={row.physics} />
                </td>
                <td className="px-3 py-3">
                  <Cell value={row.chem} />
                </td>
                <td className="px-3 py-3">
                  <Cell value={row.bio} />
                </td>
                <td className="px-3 py-3">
                  <Cell value={row.math} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>
    </>
  )
}
