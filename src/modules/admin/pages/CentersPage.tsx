import { useState } from 'react'
import { Sparkles, MapPin } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { ownerCenters, aiCenterInsights } from '@/data/ownerMock'

const flagTone = {
  leaf: 'text-leaf border-leaf/40 bg-leaf/5',
  amber: 'text-accent border-accent/40 bg-accent/5',
  rose: 'text-rose border-rose/40 bg-rose/5',
} as const

export function AdminCentersPage() {
  const [selected, setSelected] = useState(ownerCenters[0].id)
  const center = ownerCenters.find((c) => c.id === selected)!
  const radarData = [
    { metric: 'Avg score', value: center.avg },
    { metric: 'Retention', value: center.retention },
    { metric: 'NPS', value: center.nps + 40 },
    { metric: 'Growth', value: center.growth * 5 },
    { metric: 'Syllabus', value: 70 + (center.avg - 65) },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Network · 5 centers"
        title="Multi-center performance"
        sub="Compare every center on the same scorecard. Drill in to see where each one wins or struggles."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Total centers" value={ownerCenters.length} />
        <AppStat
          label="Network students"
          value={ownerCenters.reduce((a, c) => a + c.students, 0).toLocaleString()}
          tone="accent"
        />
        <AppStat
          label="Network avg"
          value={Math.round(ownerCenters.reduce((a, c) => a + c.avg, 0) / ownerCenters.length)}
          unit="%"
          tone="leaf"
        />
        <AppStat label="Best center" value="Andheri" hint="78% avg · 93% retention" />
      </div>

      <AppCard className="mb-6">
        <div className="font-display text-2xl mb-4">Center comparison · average score</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ownerCenters}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="avg" fill="var(--color-ink)" name="Avg score" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retention" fill="var(--color-leaf)" name="Retention" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nps" fill="var(--color-accent)" name="NPS" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppCard>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
            Select a center
          </div>
          <div className="space-y-1.5">
            {ownerCenters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-2 transition ${
                  selected === c.id ? 'bg-ink text-paper' : 'hover:bg-secondary'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{c.city}</span>
                <span className="font-mono-data text-xs opacity-70">{c.students}</span>
              </button>
            ))}
          </div>
        </AppCard>

        <AppCard className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display text-2xl">{center.name}</div>
            <span className="text-xs text-muted-foreground">5-metric scorecard</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={11} />
                <PolarRadiusAxis fontSize={10} angle={90} domain={[0, 100]} />
                <Radar
                  dataKey="value"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent mb-4">
          <Sparkles className="w-3.5 h-3.5" /> AI Center insights · auto-generated weekly
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {aiCenterInsights.map((c) => (
            <div key={c.center} className={`border rounded-md p-4 ${flagTone[c.flag]}`}>
              <div className="font-medium">{c.center}</div>
              <div className="text-sm mt-1 text-foreground/80">{c.insight}</div>
            </div>
          ))}
        </div>
      </AppCard>
    </>
  )
}
