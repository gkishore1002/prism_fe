import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dna, Users } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { AppSelect } from '@/components/ui/AppSelect'
import { PrismLoader } from '@/components/ui/PrismLoader'
import {
  cohortReportApiAvailable,
  fetchCohortReport,
  mapCohortReportToDataset,
} from '@/lib/api/cohortReportApi'
import { LgHero } from '@/modules/reports/learningGenome/LearningGenomeShell'
import { useCurriculum } from '@/hooks/useCurriculum'
import { buildCohortInsights } from '@/modules/tutor/lib/learningGenomeInsights'
import type { ConceptNotMastered } from '@/modules/tutor/lib/learningGenomeConcepts'
import {
  CLUSTER_META,
  EMPTY_GENOME_DATASET,
  rankedStudentNames,
  SUBJECT_FULL,
} from '@/modules/tutor/lib/learningGenomeData'
import type { LearningGenomeDataset } from '@/modules/tutor/lib/learningGenomeTypes'
import { TrendMark } from './GenomeCharts'
import { GenomeStudentCard } from './GenomeStudentCard'
import { StudentGenomeDetail } from './StudentGenomeDetail'
import '@/modules/tutor/styles/learningGenome.css'

interface LearningGenomeCohortReportProps {
  data?: LearningGenomeDataset
  /** Class insights: cohort sections + leaderboard + genome grid (no clusters). */
  variant?: 'class-insights' | 'full'
  /** When set, genome cards and leaderboard rows link to individual student reports. */
  studentReportPathPrefix?: string
  /** Link to the student reports tab (shown below genome grid in class insights). */
  allStudentReportsHref?: string
  /** Optional initial batch for live API data. */
  initialBatchId?: string
}

function normalizeStudentName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function LearningGenomeCohortReport({
  data: dataProp,
  variant = 'full',
  studentReportPathPrefix,
  allStudentReportsHref,
  initialBatchId,
}: LearningGenomeCohortReportProps) {
  const navigate = useNavigate()
  const { students: curriculumStudents, batches, ensureLoaded } = useCurriculum()
  const [activeCluster, setActiveCluster] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [batchId, setBatchId] = useState(initialBatchId ?? '')
  const [liveData, setLiveData] = useState<LearningGenomeDataset | null>(null)
  const [concepts, setConcepts] = useState<ConceptNotMastered[]>([])
  const [studentIdByName, setStudentIdByName] = useState<Map<string, string>>(new Map())
  const [dataSource, setDataSource] = useState<string>('empty')
  const [reportMeta, setReportMeta] = useState<{
    assessmentResultCount?: number
    savedMarksCount?: number
    batchStudentCount?: number
    scoredStudentCount?: number
  }>({})
  const [loading, setLoading] = useState(cohortReportApiAvailable())
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  useEffect(() => {
    if (!batchId && batches.length > 0) {
      setBatchId(batches[0].id)
    }
  }, [batchId, batches])

  useEffect(() => {
    if (dataProp) {
      setLoading(false)
      return
    }
    if (!cohortReportApiAvailable()) {
      setLoading(false)
      setLoadError('Connect to the Prism API to load class insights from your institution data.')
      return
    }
    if (!batchId) return

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void fetchCohortReport(batchId)
      .then((report) => {
        if (cancelled) return
        setLiveData(mapCohortReportToDataset(report))
        setConcepts(report.conceptsNotMastered)
        setDataSource(report.dataSource)
        setReportMeta({
          assessmentResultCount: report.meta.assessmentResultCount,
          savedMarksCount: report.meta.savedMarksCount,
          batchStudentCount: report.meta.batchStudentCount,
          scoredStudentCount: report.meta.scoredStudentCount,
        })
        const idMap = new Map<string, string>()
        for (const [name, profile] of Object.entries(report.students)) {
          if (profile.studentId) idMap.set(normalizeStudentName(name), profile.studentId)
        }
        setStudentIdByName(idMap)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load class insights.')
        setLiveData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [batchId, dataProp])

  const data = dataProp ?? liveData ?? EMPTY_GENOME_DATASET
  const apiUnavailable = !dataProp && !cohortReportApiAvailable()

  const isClassInsights = variant === 'class-insights'
  const showClusters = variant === 'full'

  const names = useMemo(() => rankedStudentNames(data), [data])
  const insights = useMemo(() => buildCohortInsights(data), [data])
  const students = data.students
  const meta = data.meta

  const curriculumIdByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const student of curriculumStudents) {
      map.set(normalizeStudentName(student.name), student.id)
    }
    return map
  }, [curriculumStudents])

  function resolveStudentReportHref(name: string): string | undefined {
    if (!studentReportPathPrefix) return undefined
    const fromReport = studentIdByName.get(normalizeStudentName(name))
    const fromCurriculum = curriculumIdByName.get(normalizeStudentName(name))
    const id = fromReport ?? fromCurriculum
    return id ? `${studentReportPathPrefix}/${id}/report` : undefined
  }

  function openStudentProfile(name: string) {
    const href = resolveStudentReportHref(name)
    if (href) {
      navigate(href)
      return
    }
    setSelectedStudent(name)
  }

  const filteredNames = useMemo(() => {
    if (!activeCluster || isClassInsights) return names
    const clusterNames = data.clusters[activeCluster] ?? []
    return clusterNames
      .slice()
      .sort((a, b) => students[a].rank - students[b].rank)
  }, [activeCluster, data.clusters, isClassInsights, names, students])

  const totalMarks = meta.total_marks ?? 0
  const subjectsCount = meta.subjects_count ?? 0
  const windowLabel = meta.window_label ?? 'Current term'
  const subjectsLabel = meta.subjects_label ?? 'All curriculum subjects'

  function formatMarks(n: number): string {
    if (n >= 1000) return `${Math.round(n / 1000)}k`
    return String(n)
  }

  const batchOptions = useMemo(
    () => [
      { value: '', label: 'Select batch…' },
      ...batches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.board} · ${b.grade}`,
      })),
    ],
    [batches],
  )

  if (apiUnavailable) {
    return (
      <div className="rounded-xl border border-border bg-secondary/20 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {loadError ??
            'Class insights require a connection to the Prism API. Set VITE_API_BASE_URL and ensure the backend is running.'}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <PrismLoader
        layout="card"
        label="Loading class insights from your institution data…"
      />
    )
  }

  return (
    <div className="lg-report rounded-xl overflow-hidden border border-border sm:-mx-2 lg:-mx-4">
      {!dataProp && cohortReportApiAvailable() && (
        <div className="border-b border-border bg-secondary/20 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-64">
              <AppSelect
                label="Batch"
                value={batchId}
                onChange={setBatchId}
                options={batchOptions}
              />
            </div>
            <p className="pb-2 text-xs text-muted-foreground">
              {dataSource === 'live' ? (
                <>
                  Reports from <strong>{reportMeta.assessmentResultCount ?? 0}</strong> assessment
                  result{reportMeta.assessmentResultCount === 1 ? '' : 's'} and{' '}
                  <strong>{reportMeta.savedMarksCount ?? 0}</strong> saved mark
                  {reportMeta.savedMarksCount === 1 ? '' : 's'} ·{' '}
                  {reportMeta.scoredStudentCount ?? 0} of {reportMeta.batchStudentCount ?? 0}{' '}
                  students scored
                </>
              ) : (
                <>No assessment results or saved marks yet for this batch. Enter marks or run assessments first.</>
              )}
            </p>
          </div>
          {loadError && (
            <p className="mt-2 text-xs text-rose">{loadError}</p>
          )}
        </div>
      )}
      <LgHero
        reportKind={isClassInsights ? 'Class insights' : 'Learning Genome'}
        title={isClassInsights ? 'Cohort performance overview' : 'Every mark tells a deeper story'}
        description={
          isClassInsights
            ? `${meta.total_students} students with scores · ${subjectsLabel}. Built from assessments and saved marks.`
            : `Class view via ${APP_NAME} Learning Genome — from assessments and saved marks.`
        }
        meta={[
          { label: 'Window', value: windowLabel },
          { label: 'Students', value: String(meta.total_students) },
          { label: 'Subjects', value: subjectsLabel },
        ]}
        stats={[
          { value: meta.class_avg, unit: '%', label: 'Class average' },
          { value: formatMarks(totalMarks), label: 'Total marks' },
          { value: subjectsCount, label: 'Subjects analyzed' },
          { value: meta.total_students, label: 'Students' },
        ]}
      />

      <section className="lg-section" id="cohort">
        <div className="lg-eyebrow">AI Teacher Insight</div>
        <h2 className="lg-section-title">Cohort Pulse</h2>
        <p className="lg-section-desc">
          Quick snapshots of performance trends and highlights across the entire class.
        </p>
        <div className="lg-insight-feed">
          <div className="lg-insight-head">
            <div className="lg-serif text-[17px] text-[var(--lg-gold-bright)]">Today&apos;s AI Insight</div>
            <div className="lg-mono text-[11px] text-[rgba(246,241,228,0.5)]">GENERATED RECENTLY</div>
          </div>
          {insights.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Save marks or complete assessments to generate cohort insights.
            </div>
          ) : (
            insights.map((row, idx) => (
              <div key={idx} className="lg-insight-row">
                <span className={`lg-tag lg-tag-${row.tag}`}>
                  {row.tag === 'up' ? 'positive' : row.tag}
                </span>
                <p dangerouslySetInnerHTML={{ __html: row.html }} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="lg-section" id="concepts">
        <div className="lg-eyebrow">Gap Analysis</div>
        <h2 className="lg-section-title">Concepts not mastered</h2>
        <p className="lg-section-desc">
          Foundational concepts where class performance from assessments and saved marks is below
          target.
        </p>
        <div className="lg-concept-grid">
          {concepts.map((item) => (
            <div key={`${item.subject}-${item.concept}`} className="lg-concept-card">
              <div className="lg-concept-title">{item.concept}</div>
              <div className="lg-concept-subject">{item.subject}</div>
              <div className="lg-concept-bar-track">
                <div
                  className="lg-concept-bar-fill"
                  style={{ width: `${item.masteryPct}%` }}
                />
              </div>
              <div className="lg-concept-pct">{item.masteryPct}% class mastery</div>
            </div>
          ))}
        </div>
      </section>

      {showClusters && (
        <section className="lg-section" id="clusters">
          <div className="lg-eyebrow">Cohort Segmentation</div>
          <h2 className="lg-section-title">Clusters, not just rank</h2>
          <p className="lg-section-desc">
            The class re-grouped by learning behaviour — click a cluster to filter the leaderboard.
          </p>
          <div className="lg-cluster-grid">
            {Object.entries(data.clusters).map(([label, members]) => {
              const clusterMeta = CLUSTER_META[label] ?? { color: '#999', desc: '' }
              const active = activeCluster === label
              return (
                <button
                  key={label}
                  type="button"
                  className="lg-cluster-card"
                  style={active ? { outline: `2px solid ${clusterMeta.color}` } : undefined}
                  onClick={() => setActiveCluster(active ? null : label)}
                >
                  <div className="bar" style={{ background: clusterMeta.color }} />
                  <div className="n" style={{ color: clusterMeta.color }}>
                    {members.length}
                  </div>
                  <div className="lbl">{label}</div>
                  <div className="desc">{clusterMeta.desc}</div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="lg-section" id="leaderboard">
        <div className="lg-eyebrow">Ranked View</div>
        <h2 className="lg-section-title">Class Leaderboard</h2>
        <p className="lg-section-desc">
          Rankings from in-app assessment results and marks entered or uploaded on the Marks page.
          {showClusters && activeCluster && (
            <span className="lg-filter-note"> — filtered: {activeCluster}</span>
          )}
          {isClassInsights && studentReportPathPrefix && (
            <span className="block mt-1 text-xs text-muted-foreground">
              Click a row to open that student&apos;s Learning Genome profile.
            </span>
          )}
        </p>
        <div className="lg-board-wrap">
          <table className="lg-board">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Avg Score</th>
                <th style={{ width: 180 }}>Score</th>
                <th>Strongest</th>
                <th>Weakest</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredNames.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No students in this batch yet.
                  </td>
                </tr>
              ) : (
                filteredNames.map((name) => {
                  const s = students[name]
                  return (
                    <tr key={name} onClick={() => openStudentProfile(name)}>
                      <td className="lg-rank-cell">#{s.rank}</td>
                      <td className="lg-name-cell">{name}</td>
                      <td className="lg-mono">{s.overall}%</td>
                      <td>
                        <div className="lg-mini-bar-track">
                          <div className="lg-mini-bar-fill" style={{ width: `${s.overall}%` }} />
                        </div>
                      </td>
                      <td>{SUBJECT_FULL[s.strongest]}</td>
                      <td>{SUBJECT_FULL[s.weakest]}</td>
                      <td>
                        <TrendMark trend={s.trend} velocity={s.velocity} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lg-section" id="genome">
        {isClassInsights ? (
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Dna className="h-5 w-5 text-accent" />
                <p className="text-[11px] font-display font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Individual profiling
                </p>
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                Learning Genome — {meta.total_students} students
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                A five-point subject fingerprint for every learner. Open any card for the full
                profile.
              </p>
            </div>
            {allStudentReportsHref && (
              <Link
                to={allStudentReportsHref}
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/60"
              >
                <Users className="h-3.5 w-3.5 text-accent" />
                All student reports
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="lg-eyebrow">Individual Profiling</div>
            <h2 className="lg-section-title">Learning Genome — {meta.total_students} Students</h2>
            <p className="lg-section-desc">
              A five-point subject fingerprint for every learner. Click any card for the full
              profile.
            </p>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {names.map((name) => {
            const s = students[name]
            const href = isClassInsights ? resolveStudentReportHref(name) : undefined
            return (
              <GenomeStudentCard
                key={name}
                rank={s.rank}
                name={name}
                overall={s.overall}
                subjAvg={s.subj_avg}
                href={href}
                onClick={href ? undefined : () => setSelectedStudent(name)}
              />
            )
          })}
        </div>
      </section>

      {variant === 'full' && (
        <footer className="lg-footer">
          <div>
            Generated by <b>{APP_NAME}</b> — Learning Genome Engine.
          </div>
          <div>
            Report window {meta.window_label ?? 'current term'} · {meta.total_students} students
          </div>
        </footer>
      )}

      {selectedStudent && (
        <div
          className="lg-overlay"
          role="dialog"
          aria-modal
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudent(null)
          }}
        >
          <StudentGenomeDetail
            name={selectedStudent}
            profile={students[selectedStudent]}
            totalStudents={meta.total_students}
            onClose={() => setSelectedStudent(null)}
          />
        </div>
      )}
    </div>
  )
}