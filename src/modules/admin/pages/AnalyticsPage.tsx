import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function AdminAnalyticsPage() {
  useAnalyticsPage('adminAnalytics')
  const { loading, monthlyTrend, subjectHealth } = useAnalytics()

  if (loading && monthlyTrend.length === 0 && subjectHealth.length === 0) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="Institution analytics"
        sub="Deep intelligence across assessments, health, and improvement"
      />

      <AppCard className="accent-blue mb-6">
        <h3 className="font-display text-[15px] font-semibold text-foreground">Monthly trend</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5 mb-4">Institution health score over time</p>
        {monthlyTrend.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e8c8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #ede4cc',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#1C2739" strokeWidth={2} dot={{ r: 4 }} name="Score %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No trend data yet.</p>
        )}
      </AppCard>

      {subjectHealth.length === 0 ? (
        <AppCard>
          <p className="text-sm text-muted-foreground">No subject health data yet.</p>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectHealth.map((s) => (
            <AppCard key={s.subject} className="accent-emerald">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.subject}</p>
              <p className="text-2xl font-mono-data font-semibold text-foreground mt-1">{s.health}%</p>
            </AppCard>
          ))}
        </div>
      )}
    </>
  )
}