import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import {
  ArrowRight,
  Users,
  BookMarked,
  MapPin,
  Layers,
  Network,
  BarChart3,
  Database,
  ClipboardList,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'

const COLORS = ['#4F46E5', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B']

export function AdminDashboardPage() {
  useAnalyticsPage('adminDashboard')
  const {
    loading,
    overview,
    teachers,
    hardestTopics,
    monthlyTrend,
    subjectHealth,
    classInsights,
    atRisk,
  } = useAnalytics()

  if (loading) {
    return <PageLoader />
  }

  if (!overview) {
    return (
      <>
        <PageHeader title="Institute overview" sub="No institution data available yet." />
        <AppCard><p className="text-sm text-muted-foreground">Connect to the API to load analytics.</p></AppCard>
      </>
    )
  }

  const inst = overview

  return (
    <>
      <PageHeader
        eyebrow={`Institution Intelligence · ${inst.institution.name}`}
        title="Institute overview"
        sub="Prove results, retain parents, differentiate on admissions — broken down by board and grade."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat
          label="Total students"
          value={inst.totalStudents.toLocaleString()}
          hint={`${inst.byBoard.length} boards`}
        />
        <AppStat
          label="Avg. improvement"
          value={`+${inst.avgImprovement}%`}
          tone="leaf"
          hint="Year-to-date"
        />
        <AppStat
          label="Engagement score"
          value={inst.parentNps}
          tone="accent"
          hint="Derived from readiness"
        />
        <AppStat label="Retention index" value={`${inst.retention}%`} hint="From improving cohort" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Students by board
          </div>
          <div className="font-display text-2xl mt-1">Composition</div>
          {inst.byBoard.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inst.byBoard}
                      dataKey="count"
                      nameKey="board"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {inst.byBoard.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-sm mt-2">
                {inst.byBoard.map((b, i) => (
                  <div key={b.board} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="flex-1">{b.board}</span>
                    <span className="font-mono-data text-muted-foreground">{b.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">No board breakdown yet.</p>
          )}
        </AppCard>

        <AppCard className="md:col-span-2">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Hardest topics across institution
            </div>
            <div className="font-display text-2xl mt-1">Where the curriculum is breaking</div>
          </div>
          {hardestTopics.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hardestTopics} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} />
                  <YAxis type="category" dataKey="topic" fontSize={11} width={180} />
                  <Tooltip />
                  <Bar dataKey="correct" fill="#c45c5c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No topic data yet.</p>
          )}
        </AppCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            Institution trend
          </div>
          {monthlyTrend.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3575c4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trend data yet.</p>
          )}
          <Link to="/admin/reports/analytics" className="text-xs text-accent hover:underline mt-2 inline-block">
            View full trends →
          </Link>
        </AppCard>

        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
            Subject health
          </div>
          {subjectHealth.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subject data yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {subjectHealth.slice(0, 6).map((s) => (
                <div key={s.subject} className="rounded-lg bg-secondary/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground truncate">{s.subject}</p>
                  <p className="font-mono-data text-lg">{s.health}%</p>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>

      {(classInsights.length > 0 || atRisk.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {classInsights.length > 0 && (
            <AppCard className="accent-indigo border-indigo-200/60 bg-indigo-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-display font-semibold">Batch insights</h3>
              </div>
              <div className="space-y-2">
                {classInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg bg-white/70 border border-indigo-100">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
          {atRisk.length > 0 && (
            <AppCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose" />
                  <h3 className="font-display font-semibold">At-risk students</h3>
                </div>
                <Link to="/admin/reports" className="text-xs text-accent hover:underline">
                  View reports
                </Link>
              </div>
              <div className="space-y-2">
                {atRisk.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex justify-between p-2 rounded-lg bg-secondary/40 text-sm">
                    <span>{s.name}</span>
                    <span className="font-mono-data text-rose">{s.risk}</span>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard className="md:col-span-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Teacher impact · top 4
          </div>
          <div className="font-display text-2xl mt-1 mb-4">Effectiveness</div>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teacher data yet.</p>
          ) : (
            <div className="space-y-3">
              {teachers.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center font-display shrink-0">
                    {t.name.split(' ').pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.subject} · {t.students} students
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono-data text-lg text-leaf">+{t.growth}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      growth
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono-data text-lg">{t.improved}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      improved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>

        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Quick links
          </div>
          <div className="mt-3 space-y-1">
            {[
              { to: '/admin/centers', icon: MapPin, label: 'Multi-center reports' },
              { to: '/admin/boards', icon: Layers, label: 'Board-wise reports' },
              { to: '/admin/reports', icon: BarChart3, label: 'Learning Genome reports' },
              { to: '/admin/curriculum', icon: Network, label: 'Curriculum setup' },
              { to: '/admin/students', icon: Users, label: 'Student management' },
              { to: '/admin/question-bank', icon: Database, label: 'Question bank' },
              { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
              { to: '/admin/teachers', icon: Users, label: 'Teacher analytics' },
              { to: '/admin/curriculum', icon: BookMarked, label: 'Syllabus completion' },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-2.5 -mx-2 rounded-md hover:bg-secondary"
              >
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-sm flex-1">{label}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </AppCard>
      </div>
    </>
  )
}