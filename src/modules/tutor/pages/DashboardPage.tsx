import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'

import {
  AlertTriangle,
  ArrowRight,
  Users,
  Database,
  Network,
  ClipboardList,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAssessments } from '@/hooks/useAssessments'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { TutorDashboardHeroConnected } from '@/modules/tutor/components/TutorDashboardHero'
import { cn } from '@/lib/cn'



export function TutorDashboardPage() {

  useAnalyticsPage('tutorDashboard')

  const { batches: tutorBatches, students: tutorStudents, getStudentsForBatch } = useCurriculum()

  const { questions, ensureLoaded: ensureQuestionPapersLoaded } = useQuestionPapers()

  const { topicWeakness, classInsights, atRisk } = useAnalytics()

  const { assessments, ensureLoaded: ensureAssessmentsLoaded } = useAssessments()

  useEffect(() => {
    void ensureAssessmentsLoaded()
    void ensureQuestionPapersLoaded()
  }, [ensureAssessmentsLoaded, ensureQuestionPapersLoaded])

  const { pageTitle, pageSubtitle, pageEyebrow, heroSummary, activeBatchId } = useTutorDashboard()

  const activeBatch = tutorBatches.find((b) => b.id === activeBatchId) ?? tutorBatches[0]

  const batchClassInsights = useMemo(
    () =>
      activeBatch
        ? classInsights.filter((insight) => insight.title.startsWith(`${activeBatch.name}:`))
        : classInsights,
    [activeBatch, classInsights],
  )

  const batchAtRisk = useMemo(() => {
    if (!activeBatch?.id) return atRisk
    const names = new Set(getStudentsForBatch(activeBatch.id).map((student) => student.name))
    return atRisk.filter((student) => names.has(student.name))
  }, [activeBatch?.id, atRisk, getStudentsForBatch])

  const recentStudents = tutorStudents.slice(0, 5)

  const activeAssessments = assessments.filter((a) => a.status === 'live' || a.status === 'scheduled')



  return (

    <>

      <PageHeader

        eyebrow={pageEyebrow}

        title={pageTitle}

        sub={pageSubtitle}

        actions={

          <div className="flex flex-wrap gap-2">

            <Link

              to="/tutor/assessments"

              className="btn btn-primary gap-2 px-4 py-2 text-sm font-medium"

            >

              <ClipboardList className="w-4 h-4" /> Assessment

            </Link>

            <Link

              to="/tutor/marks"

              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90"

            >

              Enter marks

            </Link>

          </div>

        }

      />



      <TutorDashboardHeroConnected />



      {/* Quick stats */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">

        <AppStat label="Students" value={tutorStudents.length} hint={activeBatch?.name} />

        <AppStat

          label="Class avg"

          value={activeBatch?.avgScore ?? heroSummary.avgScore}

          unit="%"

          tone="accent"

        />

        <AppStat label="Batches" value={tutorBatches.length} />

        <AppStat label="Assessments" value={activeAssessments.length} hint="Active" tone="leaf" />

        <AppStat label="Weak topics" value={topicWeakness.length} tone="rose" />

      </div>



      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

        {/* Topic mastery */}

        <AppCard className="xl:col-span-1">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">

              <TrendingUp className="w-5 h-5 text-ink" />

              <h3 className="font-display text-lg font-bold">Topic mastery</h3>

            </div>

            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline">

              Curriculum

            </Link>

          </div>

          <div className="space-y-2">

            {topicWeakness.map((topic) => (

              <div

                key={topic.topic}

                className="flex items-center gap-3 p-3 rounded-[14px] bg-secondary/40 border border-border"

              >

                <span className="font-mono-data text-xs font-bold text-muted-foreground w-5">

                  {topic.rank}

                </span>

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-semibold truncate">{topic.topic}</p>

                  <p className="text-[10px] text-muted-foreground truncate">{topic.suggestedNextClass}</p>

                </div>

                <span

                  className={`font-mono-data text-sm font-bold shrink-0 ${

                    topic.avgMastery < 60 ? 'text-rose' : 'text-accent'

                  }`}

                >

                  {topic.avgMastery}%

                </span>

              </div>

            ))}

          </div>

        </AppCard>



        {/* Students */}

        <AppCard className="xl:col-span-1">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">

              <Users className="w-5 h-5 text-ink" />

              <h3 className="font-display text-lg font-bold">Students</h3>

            </div>

            <Link to="/tutor/students" className="text-xs text-accent hover:underline">

              View all

            </Link>

          </div>

          <div className="space-y-1">

            {recentStudents.map((student) => (

              <div

                key={student.id}

                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors"

              >

                <Avatar name={student.name} size="sm" />

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-medium truncate">{student.name}</p>

                  <p className="text-xs text-muted-foreground">

                    {student.batch} · {student.readiness}% ready

                  </p>

                </div>

                <HealthBadge status={student.status} score={student.health} />

              </div>

            ))}

          </div>

        </AppCard>

      </div>



      {(batchClassInsights.length > 0 || batchAtRisk.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {batchClassInsights.length > 0 && (
            <AppCard className="accent-indigo border-indigo-200/60 bg-indigo-50/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-display text-lg font-bold">Class insights</h3>
                </div>
                <Link to="/tutor/reports/insights" className="text-xs text-accent hover:underline">
                  All reports
                </Link>
              </div>
              <div className="space-y-3">
                {batchClassInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-[14px] bg-white/70 border border-indigo-100">
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    <p className="text-xs text-indigo-700 mt-2">{insight.suggestedIntervention}</p>
                  </div>
                ))}
              </div>
            </AppCard>
          )}

          <AppCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose" />
                <h3 className="font-display text-lg font-bold">At-risk students</h3>
              </div>
              <Link to="/tutor/reports/at-risk" className="text-xs text-accent hover:underline">
                View all
              </Link>
            </div>
            {batchAtRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground">No at-risk students in this batch.</p>
            ) : (
              <div className="space-y-2">
                {batchAtRisk.slice(0, 4).map((student) => (
                  <div
                    key={student.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.reason}</p>
                    </div>
                    <span className="font-mono-data text-sm text-rose">{student.risk}</span>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </div>
      )}



      {/* Batches table */}

      <AppCard className="mb-8">

        <div className="flex items-center justify-between mb-4">

          <h3 className="font-display text-lg font-bold">My batches</h3>

          <Link to="/tutor/curriculum#batches" className="text-xs text-accent hover:underline">

            Manage batches

          </Link>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm min-w-[480px]">

            <thead>

              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b-2 border-ink/10">

                <th className="pb-3 font-semibold">Batch</th>

                <th className="pb-3 font-semibold">Board / Grade</th>

                <th className="pb-3 font-semibold">Subject</th>

                <th className="pb-3 font-semibold">Students</th>

                <th className="pb-3 font-semibold">Avg</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {tutorBatches.map((batch) => (

                <tr key={batch.id} className="hover:bg-accent/5">

                  <td className="py-3 font-semibold text-foreground">{batch.name}</td>

                  <td className="py-3 text-muted-foreground">

                    {batch.board} · {batch.grade}

                  </td>

                  <td className="py-3 text-muted-foreground">{batch.subject ?? '—'}</td>

                  <td className="py-3 font-mono-data font-semibold">{batch.studentIds.length}</td>

                  <td className="py-3 font-mono-data font-bold text-accent">{batch.avgScore ?? 0}%</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </AppCard>



      {/* Quick links */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {[

          {

            to: '/tutor/assessments',

            icon: ClipboardList,

            title: 'Assessments',

            desc: 'Create & schedule tests',

            color: 'border-ink/20 bg-ink/5',

            iconColor: 'text-ink',

          },

          {

            to: '/tutor/reports',

            icon: TrendingUp,

            title: 'Reports',

            desc: 'Class insights & student genomes',

            color: 'border-indigo-200 bg-indigo-50/40',

            iconColor: 'text-indigo-600',

          },

          {

            to: '/tutor/curriculum',

            icon: Network,

            title: 'Curriculum',

            desc: 'Boards, topics & batches',

            color: 'border-blue-200 bg-blue-50/50',

            iconColor: 'text-blue-800',

          },

          {

            to: '/tutor/question-bank',

            icon: Database,

            title: 'Question bank',

            desc: `${questions.length} questions`,

            color: 'border-leaf/30 bg-leaf/5',

            iconColor: 'text-leaf',

          },

        ].map((item) => (

          <AppCard key={item.to} className={cn('border-2', item.color)}>

            <Link to={item.to} className="block">

              <item.icon className={cn('w-6 h-6', item.iconColor)} />

              <div className="font-display text-lg font-bold mt-3">{item.title}</div>

              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>

              <span className="text-xs font-semibold text-accent inline-flex items-center gap-1 mt-3">

                Open <ArrowRight className="w-3 h-3" />

              </span>

            </Link>

          </AppCard>

        ))}

      </div>

    </>

  )

}
