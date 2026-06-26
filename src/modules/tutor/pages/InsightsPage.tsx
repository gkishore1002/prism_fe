import { Link } from 'react-router-dom'
import { Lightbulb, Users, BookOpen, AlertTriangle } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { TopicBarChart } from '@/components/charts/TopicBarChart'
import { classInsights, batchTopicWeakness, tutorStudents } from '@/data/mock'

const classTopicGaps = [
  { name: 'Geometry', mastery: 52, status: 'weak' },
  { name: 'Mensuration', mastery: 58, status: 'weak' },
  { name: 'Linear Equations', mastery: 42, status: 'weak' },
  { name: 'Probability', mastery: 64, status: 'fair' },
  { name: 'Circles', mastery: 71, status: 'good' },
  { name: 'Quadratic Eq.', mastery: 78, status: 'good' },
]

export function TutorInsightsPage() {
  const atRisk = tutorStudents.filter(
    (s) => s.status === 'weak' || s.status === 'critical' || s.criticalGaps > 0,
  )

  return (
    <>
      <PageHeader
        eyebrow="Batch intelligence · Module 7 & 8"
        title="Class Insights"
        sub="What to reteach next, at-risk detection, and class-wide gap analysis — scoped to board and grade."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Weak Topics" value={batchTopicWeakness.length} tone="accent" />
        <AppStat label="At-Risk Students" value={atRisk.length} tone="rose" />
        <AppStat label="Insights" value={classInsights.length} hint="AI-detected patterns" />
      </div>

      <AppCard className="mb-8">
        <h3 className="font-display text-lg text-foreground mb-1">Batch Intelligence</h3>
        <p className="text-sm text-muted-foreground mb-4">
          CBSE Grade 8 · Batch A — suggested next class actions
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Weak topic</th>
                <th className="pb-3 font-medium">Avg mastery</th>
                <th className="pb-3 font-medium">Suggested next class</th>
                <th className="pb-3 font-medium">Expected gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batchTopicWeakness.map((row) => (
                <tr key={row.topic} className="hover:bg-secondary/30">
                  <td className="py-3 font-mono-data text-muted-foreground">{row.rank}</td>
                  <td className="py-3 font-medium text-foreground">{row.topic}</td>
                  <td className="py-3 font-mono-data text-rose">{row.avgMastery}%</td>
                  <td className="py-3 text-muted-foreground">{row.suggestedNextClass}</td>
                  <td className="py-3 font-mono-data text-leaf">
                    {row.expectedGain ? `+${row.expectedGain}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AppCard>
          <h3 className="font-display text-lg text-foreground mb-4">Class topic mastery</h3>
          <TopicBarChart data={classTopicGaps} height={260} />
        </AppCard>

        <AppCard>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose" />
            <h3 className="font-display text-lg text-foreground">At-risk detection</h3>
          </div>
          <div className="space-y-3">
            {atRisk.map((student) => (
              <div
                key={student.id}
                className="p-3 rounded-md border border-border hover:border-rose/30 transition-colors"
              >
                <p className="font-medium text-foreground">{student.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.criticalGaps} critical gaps · readiness {student.readiness}% ·{' '}
                  {student.improving ? 'trend improving' : 'trend declining'}
                </p>
              </div>
            ))}
          </div>
          <Link to="/tutor/students" className="inline-block mt-4 text-xs text-accent hover:underline">
            View all students →
          </Link>
        </AppCard>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-lg text-foreground">AI-detected patterns</h3>
        {classInsights.map((insight) => (
          <AppCard key={insight.id}>
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg shrink-0 ${
                  insight.severity === 'high'
                    ? 'bg-rose/10 text-rose'
                    : insight.severity === 'medium'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      insight.severity === 'high'
                        ? 'bg-rose/15 text-rose'
                        : 'bg-accent/15 text-accent'
                    }`}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/50">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Affected</p>
                      <p className="text-sm font-mono-data">{insight.affectedStudents} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/50">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Topic</p>
                      <p className="text-sm font-medium">{insight.topicName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/50">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="text-sm font-medium">{insight.subjectName}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-leaf/10 border border-leaf/20 rounded-md p-3 mb-4">
                  <p className="text-xs font-medium text-leaf mb-1">Suggested intervention</p>
                  <p className="text-sm text-foreground">{insight.suggestedIntervention}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-md hover:opacity-90"
                  >
                    Schedule session
                  </button>
                  <Link
                    to="/tutor/assessments"
                    className="text-xs border border-border px-3 py-1.5 rounded-md hover:bg-secondary/60"
                  >
                    Create targeted test
                  </Link>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  )
}
