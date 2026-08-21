import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'

const barColors: Record<string, string> = {
  weak: '#FF6B6B',
  ok: '#F7B731',
  strong: '#0CBF6E',
  fair: '#F7B731',
  good: '#1C2739',
}

export function StudentDiagnosticsPage() {
  useAnalyticsPage('studentDiagnostics')
  const { loading, topicBreakdown, readiness, studentProfile } = useAnalytics()
  const primarySubject = topicBreakdown[0]?.subject ?? 'Mathematics'
  const mathTopics = topicBreakdown
    .filter((t) => t.subject === primarySubject)
    .map((t) => ({ ...t, score: t.mastery }))
  const readinessBySubject = readiness.map((r) => ({
    subject: r.subjectName,
    readiness: r.currentReadiness,
  }))

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow={studentProfile ? `${studentProfile.board} · Grade ${studentProfile.grade}` : 'Diagnostics'}
        title="Diagnostics"
        sub="Move beyond marks. See actual learning gaps at topic level — anchored to your board curriculum."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Topics tracked" value={topicBreakdown.length} tone="accent" />
        <AppStat label="Weak topics" value={topicBreakdown.filter((t) => t.status === 'weak').length} tone="rose" />
        <AppStat label="Strong topics" value={topicBreakdown.filter((t) => t.status === 'strong').length} tone="leaf" />
        <AppStat label="Subjects" value={readiness.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
            {primarySubject} — Topic breakdown
          </div>
          <div className="font-display text-2xl mt-1 mb-4 font-bold text-foreground">Where the gap is</div>
          {mathTopics.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mathTopics} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEDEA" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                  <YAxis type="category" dataKey="topic" stroke="#94A3B8" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #EEEDEA', borderRadius: 10 }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {mathTopics.map((t) => (
                      <Cell key={t.topic} fill={barColors[t.status] ?? '#F7B731'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No topic breakdown yet.</p>
          )}
        </AppCard>

        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
            Readiness — by subject
          </div>
          <div className="font-display text-2xl mt-1 mb-4 font-bold text-foreground">Quarterly exam outlook</div>
          {readinessBySubject.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={readinessBySubject}>
                  <PolarGrid stroke="#EEEDEA" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="readiness" stroke="#1C2739" fill="#6B89AB" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No readiness data yet.</p>
          )}
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
              All topics
            </div>
            <div className="font-display text-2xl mt-1 font-bold text-foreground">Strengths and gaps</div>
          </div>
        </div>
        {topicBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topics to show yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {topicBreakdown.map((t) => (
              <div
                key={`${t.subject}-${t.topic}`}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === 'weak' ? 'bg-rose-500' : t.status === 'strong' ? 'bg-emerald-500' : 'bg-yellow-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.topic}</div>
                  <div className="text-xs text-muted-foreground">{t.subject}</div>
                </div>
                <div className="font-mono-data text-sm font-semibold">{t.mastery}%</div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </>
  )
}