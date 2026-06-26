import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { monthlyTrend, subjectHealthDistribution } from '@/data/mock'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Institution Analytics</h2>
        <p className="text-sm text-zinc-500">Deep intelligence across assessments, health, and improvement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health vs. Assessment Volume</CardTitle>
          <CardDescription>Correlation between assessment frequency and academic health</CardDescription>
        </CardHeader>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis yAxisId="health" domain={[60, 80]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis yAxisId="assessments" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
              <Legend />
              <Line yAxisId="health" type="monotone" dataKey="health" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Health %" />
              <Line yAxisId="assessments" type="monotone" dataKey="assessments" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Assessments" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjectHealthDistribution.map((s) => (
          <Card key={s.subject} padding="sm">
            <p className="text-xs text-zinc-500">{s.subject}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{s.health}%</p>
            <p className="text-xs text-zinc-400 mt-1">{s.students} students tracked</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
