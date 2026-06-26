import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { topicBreakdown, readinessBySubject, studentProfile } from '@/data/mock'
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

const barColors = {
  weak: '#f43f5e',
  ok: '#e8b820',
  strong: '#10b981',
}

export function StudentDiagnosticsPage() {
  const mathTopics = topicBreakdown.filter((t) => t.subject === 'Mathematics')

  return (
    <>
      <PageHeader
        eyebrow={`${studentProfile.board} · Grade ${studentProfile.grade}`}
        title="Diagnostics"
        sub="Move beyond marks. See actual learning gaps at topic level — anchored to your board curriculum."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Accuracy" value="74%" hint="↑ 6% vs last month" tone="leaf" />
        <AppStat label="Avg. speed" value="48s" hint="per question" />
        <AppStat label="Consistency" value="B+" hint="±9% deviation" />
        <AppStat label="Topics covered" value="48 / 64" unit="(75%)" tone="accent" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-text-muted font-display font-semibold">
            Mathematics — Topic breakdown
          </div>
          <div className="font-display text-2xl mt-1 mb-4 font-bold text-text-primary">Where the gap is</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mathTopics} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e2ef" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#6e8499" fontSize={11} />
                <YAxis type="category" dataKey="topic" stroke="#6e8499" fontSize={11} width={120} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #d8e2ef', borderRadius: 8 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {mathTopics.map((t) => (
                    <Cell key={t.topic} fill={barColors[t.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppCard>

        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-text-muted font-display font-semibold">
            Readiness — by subject
          </div>
          <div className="font-display text-2xl mt-1 mb-4 font-bold text-text-primary">Quarterly exam outlook</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={readinessBySubject}>
                <PolarGrid stroke="#d8e2ef" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6e8499', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="readiness" stroke="#3575c4" fill="#3575c4" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-text-muted font-display font-semibold">
              All topics
            </div>
            <div className="font-display text-2xl mt-1 font-bold text-text-primary">Strengths and gaps</div>
          </div>
          <div className="flex items-center gap-3 text-xs font-sans">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Strong
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> OK
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Weak
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {topicBreakdown.map((t) => (
            <div
              key={`${t.subject}-${t.topic}`}
              className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  t.status === 'weak' ? 'bg-rose-500' : t.status === 'strong' ? 'bg-emerald-500' : 'bg-yellow-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.topic}</div>
                <div className="text-xs text-text-muted">{t.subject}</div>
              </div>
              <div className="font-mono-data text-sm font-semibold">{t.score}%</div>
            </div>
          ))}
        </div>
      </AppCard>
    </>
  )
}
