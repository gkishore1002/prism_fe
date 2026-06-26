import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Users,
  BookMarked,
  Target,
  MapPin,
  Layers,
  Network,
  BarChart3,
  Database,
  ClipboardList,
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
} from 'recharts'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { ownerInstitution, ownerTeachers, hardestTopics } from '@/data/ownerMock'
import { institution } from '@/data/mock'

const COLORS = ['#163a66', '#e8b820', '#3d8b5a']

export function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow={`Institution Intelligence · ${institution.name}`}
        title="Institute overview"
        sub="Prove results, retain parents, differentiate on admissions — broken down by board and grade."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat
          label="Total students"
          value={ownerInstitution.totalStudents.toLocaleString()}
          hint="Across 3 boards"
        />
        <AppStat
          label="Avg. improvement"
          value={`+${ownerInstitution.avgImprovement}%`}
          tone="leaf"
          hint="Year-to-date"
        />
        <AppStat
          label="Parent NPS"
          value={ownerInstitution.parentNPS}
          tone="accent"
          hint="↑ 8 vs last term"
        />
        <AppStat label="Retention" value={`${ownerInstitution.retention}%`} hint="Re-enrolment rate" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Students by board
          </div>
          <div className="font-display text-2xl mt-1">Composition</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ownerInstitution.byBoard}
                  dataKey="count"
                  nameKey="board"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {ownerInstitution.byBoard.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-sm mt-2">
            {ownerInstitution.byBoard.map((b, i) => (
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
        </AppCard>

        <AppCard className="md:col-span-2">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Hardest topics across institution
            </div>
            <div className="font-display text-2xl mt-1">Where the curriculum is breaking</div>
          </div>
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
        </AppCard>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard className="md:col-span-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Teacher impact · top 4
          </div>
          <div className="font-display text-2xl mt-1 mb-4">Effectiveness</div>
          <div className="space-y-3">
            {ownerTeachers.map((t) => (
              <div
                key={t.name}
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
        </AppCard>

        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Quick links
          </div>
          <div className="mt-3 space-y-1">
            {[
              { to: '/admin/centers', icon: MapPin, label: 'Multi-center reports' },
              { to: '/admin/boards', icon: Layers, label: 'Board-wise reports' },
              { to: '/admin/reports', icon: BarChart3, label: 'Subject drill-down' },
              { to: '/admin/setup', icon: Network, label: 'Curriculum setup' },
              { to: '/admin/students', icon: Users, label: 'Student management' },
              { to: '/admin/question-bank', icon: Database, label: 'Question bank' },
              { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
              { to: '/admin/teachers', icon: Users, label: 'Teacher analytics' },
              { to: '/admin/syllabus', icon: BookMarked, label: 'Syllabus completion' },
              { to: '/admin/intelligence', icon: Target, label: 'AI institution intel.' },
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
