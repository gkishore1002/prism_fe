import { Link } from 'react-router-dom'
import { Play, Flame, ArrowRight, Sparkles } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import {
  studentProfile,
  studentSubjects,
  topicBreakdown,
  improvementTrend,
  aiDiagnosis,
  learningGaps,
} from '@/data/mock'
import { getGreeting } from '../lib/utils'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export function StudentTodayPage() {
  const focus = learningGaps[0]

  return (
    <>
      <PageHeader
        eyebrow={`${studentProfile.board} · Grade ${studentProfile.grade} · ${studentProfile.batch}`}
        title={`${getGreeting()}, ${studentProfile.name.split(' ')[0]}.`}
        sub="Your academic overview — health, focus topics, and what to study next."
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="w-4 h-4 text-accent" />
            <span className="font-mono-data text-foreground">{studentProfile.streak}</span>
            <span>day streak</span>
          </div>
        }
      />

      <div className="bg-ink text-paper rounded-lg p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3 font-display font-semibold">
              Today&apos;s Focus
            </div>
            <h2 className="font-display text-4xl font-bold">
              {focus?.topicName ?? 'Linear Equations'}
            </h2>
            <p className="text-paper/70 mt-2 font-sans text-[14px]">
              10 word-problem sets · 20 minutes · expected lift +{focus?.impactOnScore ?? 12}%
            </p>
          </div>
          <Link
            to="/student/assessments"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 shrink-0"
          >
            <Play className="w-4 h-4" /> Start practice
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Academic Health" value={studentProfile.healthScore} unit="/100" hint="Above average" tone="accent" />
        <AppStat label="Improvement (6m)" value={`+${studentProfile.improvement}%`} hint="Trend ↑" tone="leaf" />
        <AppStat label="Readiness — Quarterly" value={`${studentProfile.readiness}%`} hint="On track" />
        <AppStat label="Weak topics" value={3} hint="Linear Eq. · Circles · Geography" tone="rose" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
                Improvement trend
              </div>
              <div className="font-display text-2xl mt-1 font-bold text-foreground">From 35% → 78%</div>
            </div>
            <Link to="/student/reports" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
              View reports <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={improvementTrend}>
                <CartesianGrid stroke="#d8e2ef" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#6e8499" fontSize={11} />
                <YAxis stroke="#6e8499" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #d8e2ef', borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#e8b820" strokeWidth={2.5} dot={{ r: 4, fill: '#e8b820' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <div className="text-[11px] uppercase tracking-widest text-text-muted font-display font-semibold">
              AI Diagnosis
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">{aiDiagnosis.topic}</div>
          <p className="text-sm mt-2 text-muted-foreground font-sans">{aiDiagnosis.finding}</p>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-display">Likely cause</div>
            <p className="text-sm text-muted-foreground font-sans">{aiDiagnosis.cause}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-display">Prescription</div>
            <p className="text-sm text-muted-foreground font-sans">{aiDiagnosis.recommendation}</p>
            <div className="text-xs text-leaf mt-2 font-mono-data font-semibold">
              Expected lift +{aiDiagnosis.expectedLift}%
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-baseline justify-between mb-6">
          <div className="font-display text-2xl font-bold text-foreground">Subjects</div>
          <div className="text-xs text-muted-foreground">CBSE Grade 8 curriculum</div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          {studentSubjects.map((s) => (
            <div key={s.name}>
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-medium text-foreground">{s.name}</div>
                <div className="font-mono-data text-lg font-semibold">
                  {s.score}<span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-ink rounded-full" style={{ width: `${s.score}%` }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground font-sans">
                Weak:{' '}
                {topicBreakdown
                  .filter((t) => t.subject === s.name && t.status === 'weak')
                  .map((t) => t.topic)
                  .join(', ') || '—'}
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    </>
  )
}
