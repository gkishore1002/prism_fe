import { Download } from 'lucide-react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { studentProfile, improvementTrend } from '@/data/mock'

export function TutorMeetingReportPage() {
  const student = {
    ...studentProfile,
    school: 'Vidya Mandir Public School',
  }

  return (
    <>
      <PageHeader
        eyebrow="Parent–Tutor Meeting"
        title="Meeting report"
        sub="One-click PDF that saves prep time. Everything a parent needs in 30 seconds."
        actions={
          <button
            type="button"
            className="btn btn-primary gap-2 px-4 py-2 text-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        }
      />

      <AppCard className="max-w-3xl mx-auto p-12">
        <div className="border-b border-ink pb-4 mb-6">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Parent–Tutor Meeting Report · 25 June 2026
          </div>
          <div className="font-display text-4xl mt-2">{student.name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {student.board} · Grade {student.grade} · {student.batch} · {student.school}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Current score
            </div>
            <div className="font-mono-data text-3xl mt-1">78%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Health
            </div>
            <div className="font-mono-data text-3xl mt-1">
              {student.healthScore}
              <span className="text-base text-muted-foreground">/100</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Improvement
            </div>
            <div className="font-mono-data text-3xl text-leaf mt-1">+{student.improvement}%</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            6-month trend
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={improvementTrend}>
                <CartesianGrid stroke="oklch(0.88 0.018 85)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={10} stroke="oklch(0.48 0.02 250)" />
                <YAxis fontSize={10} stroke="oklch(0.48 0.02 250)" domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="oklch(0.20 0.025 250)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-leaf mb-2">Strengths</div>
            <ul className="text-sm space-y-1">
              <li>· Algebra (85)</li>
              <li>· Sound (81)</li>
              <li>· English (88)</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-rose mb-2">Weak areas</div>
            <ul className="text-sm space-y-1">
              <li>· Geometry (40)</li>
              <li>· Mensuration (35)</li>
              <li>· Ratio (55)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ink pt-4">
          <div className="text-[10px] uppercase tracking-widest text-accent mb-2">
            Tutor recommendation
          </div>
          <p className="text-sm leading-relaxed">
            Focus next 21 days on Geometry and Mensuration with diagram-based practice (15
            questions/day). Re-test on day 14 expected to lift readiness from 75% → 82%. Recommend a
            parent check-in on consistency of daily practice — Arjun has missed 3 sessions this
            week.
          </p>
          <div className="mt-6 text-xs text-muted-foreground">— Mrs. Priya Nair · Math · CBSE 8</div>
        </div>
      </AppCard>
    </>
  )
}
