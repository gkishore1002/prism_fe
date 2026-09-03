import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { ReportLoader } from '@/components/ui/PrismLoader'
import {
  cohortReportApiAvailable,
  fetchCohortReport,
  mapCohortReportToDataset,
} from '@/lib/api/cohortReportApi'
import { LgHero, LgReportLayout } from '@/modules/reports/learningGenome/LearningGenomeShell'
import { useCurriculum } from '@/hooks/useCurriculum'
import { buildCohortInsights } from '@/modules/tutor/lib/learningGenomeInsights'
import type { ConceptNotMastered } from '@/modules/tutor/lib/learningGenomeConcepts'
import {
  CLUSTER_META,
  EMPTY_GENOME_DATASET,
  cohortSubjectMeasures,
  deriveRiskLevel,
  rankedStudentNames,
  SUBJECT_FULL,
} from '@/modules/tutor/lib/learningGenomeData'
import type { LearningGenomeDataset } from '@/modules/tutor/lib/learningGenomeTypes'
import { TrendMark } from './GenomeCharts'
import { GenomeStudentCard } from './GenomeStudentCard'
import { StudentGenomeDetail } from './StudentGenomeDetail'
import { KnowledgeChapterTopicBars } from '@/modules/reports/learningGenome/KnowledgeDistribution'
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

function ClassInsightsEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-[#f9f5eb] px-6 py-14 text-center">
      <p className="font-display text-xl text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function LearningGenomeCohortReport({
  data: dataProp,
  variant = 'full',
  studentReportPathPrefix,
  allStudentReportsHref,
  initialBatchId,
}: LearningGenomeCohortReportProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { students: curriculumStudents, batches, loading: curriculumLoading, ensureLoaded } =
    useCurriculum()
  const [activeCluster, setActiveCluster] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const urlBatch = searchParams.get('batch') || ''
  const [batchId, setBatchId] = useState(initialBatchId || urlBatch)
  const [liveData, setLiveData] = useState<LearningGenomeDataset | null>(null)
  const [concepts, setConcepts] = useState<ConceptNotMastered[]>([])
  const [topicMastery, setTopicMastery] = useState<ConceptNotMastered[]>([])
  const [knowledgeSummary, setKnowledgeSummary] = useState('')
  const [studentIdByName, setStudentIdByName] = useState<Map<string, string>>(new Map())
  const [dataSource, setDataSource] = useState<string>('empty')
  const [reportMeta, setReportMeta] = useState<{
    assessmentResultCount?: number
    savedMarksCount?: number
    batchStudentCount?: number
    scoredStudentCount?: number
    batchName?: string | null
  }>({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [batchesReady, setBatchesReady] = useState(batches.length > 0)

  useEffect(() => {
    void ensureLoaded().finally(() => setBatchesReady(true))
  }, [ensureLoaded])

  function selectBatch(nextId: string) {
    setBatchId(nextId)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextId) next.set('batch', nextId)
        else next.delete('batch')
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    if (!batches.length) return
    const valid = (id?: string) => Boolean(id && batches.some((b) => b.id === id))
    const next = valid(urlBatch)
      ? urlBatch
      : valid(initialBatchId)
        ? initialBatchId!
        : valid(batchId)
          ? batchId
          : batches[0].id
    if (next !== batchId) setBatchId(next)
  }, [batches, urlBatch, initialBatchId, batchId])

  useEffect(() => {
    if (dataProp) {
      setLoading(false)
      setBatchesReady(true)
      return
    }
    if (!cohortReportApiAvailable()) {
      setLoading(false)
      setLoadError('Connect to the Prism API to load class insights from your institution data.')
      return
    }
    if (!batchesReady) return
    if (!batchId) {
      setLoading(false)
      setLiveData(null)
      setDataSource('empty')
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void fetchCohortReport(batchId)
      .then((report) => {
        if (cancelled) return
        setLiveData(mapCohortReportToDataset(report))
        setConcepts(report.conceptsNotMastered)
        setTopicMastery(report.topicMastery ?? report.conceptsNotMastered ?? [])
        setKnowledgeSummary(report.knowledgeSummary ?? '')
        setDataSource(report.dataSource)
        setReportMeta({
          assessmentResultCount: report.meta.assessmentResultCount,
          savedMarksCount: report.meta.savedMarksCount,
          batchStudentCount: report.meta.batchStudentCount,
          scoredStudentCount: report.meta.scoredStudentCount,
          batchName: report.batchName,
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
        setDataSource('empty')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [batchId, dataProp, batchesReady])

  const data = dataProp ?? liveData ?? EMPTY_GENOME_DATASET
  const apiUnavailable = !dataProp && !cohortReportApiAvailable()

  const isClassInsights = variant === 'class-insights'

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
    if (!activeCluster) return names
    const clusterNames = data.clusters[activeCluster] ?? []
    return clusterNames
      .slice()
      .sort((a, b) => students[a].rank - students[b].rank)
  }, [activeCluster, data.clusters, names, students])

  const highRiskCount = useMemo(
    () =>
      names.filter(
        (n) => deriveRiskLevel(students[n], data.clusters, n) === 'High',
      ).length,
    [names, students, data.clusters],
  )
  const improvingCount = useMemo(
    () => names.filter((n) => students[n].trend === 'Improving').length,
    [names, students],
  )
  const topScore = useMemo(
    () => (names.length ? Math.max(...names.map((n) => students[n].overall)) : 0),
    [names, students],
  )

  const windowLabel = meta.window_label ?? 'Current term'
  const subjectsLabel = meta.subjects_label ?? 'All curriculum subjects'
  const topicRows = topicMastery.length > 0 ? topicMastery : concepts
  const topicConcepts = topicRows.filter((t) => t.masteryPct < 55)
  const subjectMeasures = useMemo(() => cohortSubjectMeasures(data), [data])

  const batchOptions = useMemo(
    () => [
      ...(batches.length === 0 ? [{ value: '', label: 'Select batch…' }] : []),
      ...batches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.board} · ${b.grade}`,
      })),
    ],
    [batches],
  )

  const waitingForBatches = !dataProp && (!batchesReady || curriculumLoading)
  const hasReportData = dataSource === 'live' && names.length > 0
  const selectedBatch = batches.find((b) => b.id === batchId)
  const batchLabel = selectedBatch
    ? `${selectedBatch.name} · ${selectedBatch.board} · ${selectedBatch.grade}`
    : reportMeta.batchName || 'this batch'

  const batchToolbar =
    !dataProp && cohortReportApiAvailable() ? (
      <div className="mb-4 rounded-xl border border-border bg-[#efe7d3]/60 px-4 py-3 sm:px-6 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <AppDropdown
              label="Batch"
              value={batchId}
              onChange={selectBatch}
              options={batchOptions}
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            {hasReportData ? (
              <>
                Reports from <strong>{reportMeta.assessmentResultCount ?? 0}</strong> assessment
                result{reportMeta.assessmentResultCount === 1 ? '' : 's'} and{' '}
                <strong>{reportMeta.savedMarksCount ?? 0}</strong> saved mark
                {reportMeta.savedMarksCount === 1 ? '' : 's'} ·{' '}
                {reportMeta.scoredStudentCount ?? 0} of {reportMeta.batchStudentCount ?? 0}{' '}
                students scored
              </>
            ) : (
              <>Class insights are shown for one batch at a time.</>
            )}
          </p>
        </div>
        {loadError ? <p className="mt-2 text-xs text-rose-700">{loadError}</p> : null}
      </div>
    ) : null

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

  if (waitingForBatches || (!batchId && batches.length > 0)) {
    return (
      <>
        {batchToolbar}
        <ReportLoader label={batchId ? 'Loading class insights for this batch…' : 'Loading batches…'} />
      </>
    )
  }

  if (!dataProp && batches.length === 0) {
    return (
      <>
        {batchToolbar}
        <ClassInsightsEmpty
          title="No data available"
          description="No batches found. Create a batch and add students, then enter marks or run assessments to generate class insights."
        />
      </>
    )
  }

  if (loading) {
    return (
      <>
        {batchToolbar}
        <ReportLoader label="Loading class insights for this batch…" />
      </>
    )
  }

  if (!hasReportData) {
    const studentCount = reportMeta.batchStudentCount ?? 0
    return (
      <>
        {batchToolbar}
        <ClassInsightsEmpty
          title="No data available"
          description={
            loadError
              ? loadError
              : studentCount > 0
                ? `${batchLabel} has ${studentCount} student${studentCount === 1 ? '' : 's'}, but there are no assessment results or saved marks yet. Enter marks or run an assessment to generate class insights.`
                : `No assessment results or saved marks for ${batchLabel} yet. Choose another batch, or enter marks to generate class insights.`
          }
        />
      </>
    )
  }

  return (
    <LgReportLayout
      printTitle={`${APP_NAME} Learning Genome — ${windowLabel}`}
      showExport={false}
      navLinks={[
        { href: '#cohort', label: 'Cohort Pulse' },
        { href: '#clusters', label: 'Clusters' },
        { href: '#leaderboard', label: 'Leaderboard' },
        { href: '#genome', label: 'Learning Genomes' },
        { href: '#knowledge-layer', label: 'Knowledge Layer ★' },
      ]}
    >
      {batchToolbar}

      <LgHero
        reportKind="AI Academic Profiling Engine"
        title={
          <>
            Every mark tells a story.
          </>
        }
        titleEmphasis="This is the one the mark sheet never showed you."
        description={`A diagnostic run through ${APP_NAME}'s profiling layer — turning raw scores into subject affinity, learning velocity, recovery ability, risk signals and individual Learning Genomes for every student in the class.`}
        meta={[
          { label: 'Assessment Window', value: windowLabel },
          { label: 'Cohort Size', value: `${meta.total_students} Students` },
          { label: 'Subjects Tracked', value: subjectsLabel },
        ]}
        stats={[
          { value: meta.class_avg, unit: '%', label: 'Class avg' },
          { value: topScore, unit: '%', label: 'Top score' },
          { value: improvingCount, label: 'Improving' },
          { value: highRiskCount, label: 'High risk' },
        ]}
        statsPlacement="inside"
      />

      <section className="lg-section" id="cohort">
        <div className="lg-eyebrow">Level 3 · AI Teacher Insight</div>
        <h2 className="lg-section-title">Cohort Pulse</h2>
        <p className="lg-section-desc">
          Patterns no gradebook surfaces on its own — generated automatically from your assessment
          sequence.
        </p>
        <div className="lg-insight-feed">
          <div className="lg-insight-head">
            <div className="t">Today&apos;s AI Insight</div>
            <div className="d">GENERATED RECENTLY</div>
          </div>
          {insights.length === 0 ? (
            <div className="lg-insight-empty">
              Save marks or complete assessments to generate cohort insights.
            </div>
          ) : (
            insights.map((row, idx) => (
              <div key={idx} className="lg-insight-row">
                <span className={`lg-tag lg-tag-${row.tag === 'pattern' ? 'risk' : row.tag}`}>
                  {row.tag === 'up' ? 'positive' : row.tag === 'pattern' ? 'risk' : row.tag}
                </span>
                <p dangerouslySetInnerHTML={{ __html: row.html }} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="lg-section" id="clusters">
        <div className="lg-eyebrow">Level 4 · Cohort Segmentation</div>
        <h2 className="lg-section-title">Clusters, not just rank</h2>
        <p className="lg-section-desc">
          The class re-grouped by learning behaviour rather than raw position — click a cluster to
          filter the leaderboard below.
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

      <section className="lg-section" id="leaderboard">
        <div className="lg-eyebrow">Level 1+2 · Ranked View</div>
        <h2 className="lg-section-title">Class Leaderboard</h2>
        <p className="lg-section-desc">
          Overall score is only the entry point — trend and risk sit right beside it.
          {activeCluster && <span className="lg-filter-note"> — filtered: {activeCluster}</span>}
        </p>
        <div className="lg-board-wrap">
          <table className="lg-board">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Overall</th>
                <th style={{ width: 180 }}>Score</th>
                <th>Strongest</th>
                <th>Weakest</th>
                <th>Trend</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredNames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[color:var(--lg-text-muted)]">
                    No students in this batch yet.
                  </td>
                </tr>
              ) : (
                filteredNames.map((name) => {
                  const s = students[name]
                  const risk = deriveRiskLevel(s, data.clusters, name)
                  const riskClass =
                    risk === 'High'
                      ? 'lg-badge-high'
                      : risk === 'Medium'
                        ? 'lg-badge-medium'
                        : 'lg-badge-low'
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
                      <td>
                        <span className={`lg-badge ${riskClass}`}>{risk}</span>
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
        <div className="lg-eyebrow">Level 2 · Individual Profiling</div>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="lg-section-title">Learning Genome — {meta.total_students} Students</h2>
            <p className="lg-section-desc mb-0">
              A five-point subject fingerprint for every learner — daily curve, recovery score,
              confidence, and a plain-language narrative live on each student report.
            </p>
          </div>
          {isClassInsights && allStudentReportsHref && (
            <Link to={allStudentReportsHref} className="lg-back-link print:hidden" style={{ color: 'var(--lg-ink)', borderColor: 'var(--lg-line)', background: '#fff' }}>
              All student reports
            </Link>
          )}
        </div>
        <div className="lg-genome-grid">
          {names.map((name) => {
            const s = students[name]
            return (
              <GenomeStudentCard
                key={name}
                rank={s.rank}
                name={name}
                overall={s.overall}
                subjAvg={s.subj_avg}
                riskLevel={deriveRiskLevel(s, data.clusters, name)}
              />
            )
          })}
        </div>
      </section>

      <section className="lg-section lg-kl-section" id="knowledge-layer">
        <div className="lg-eyebrow">Level 2 · Subject & topic measures</div>
        <h2 className="lg-section-title">The Knowledge Layer</h2>
        <p className="lg-section-desc">
          Same tests. One extra field per question — Subject → Lesson → Topic — and the engine
          stops reporting marks and starts reporting learning.
        </p>

        <div className="lg-kl-banner">
          <b>Summary.</b> {knowledgeSummary || 'Topic measures appear after assessments with tagged questions.'}
        </div>

        <KnowledgeChapterTopicBars
          items={topicRows}
          emptyNote="Chapter and topic scores appear after tagged question attempts."
        />

        <div className="lg-kl-grid lg-kl-grid-pair" style={{ marginTop: '0.85rem' }}>
          <div className="lg-kl-card">
            <h4>Subject mastery</h4>
            {subjectMeasures.length === 0 ? (
              <p className="lg-kl-note">Subject measures appear after assessments or marks.</p>
            ) : (
              subjectMeasures.map((row) => (
                <div key={row.code} className="lg-kl-bar-row">
                  <span className="n">{row.name}</span>
                  <div className="lg-kl-bar-track">
                    <div
                      className="lg-kl-bar-fill"
                      style={{
                        width: `${row.mastery}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                  <span className="lg-kl-bar-val">{row.mastery}%</span>
                </div>
              ))
            )}
          </div>

          <div className="lg-kl-card">
            <h4>Error heatmap — most-missed topics</h4>
            {topicConcepts.length === 0 ? (
              <p className="lg-kl-note">
                {topicRows.length > 0
                  ? 'No topics are below 55% mastery.'
                  : 'Topic errors appear after tagged question attempts.'}
              </p>
            ) : (
              <ul className="lg-kl-error-list">
                {topicConcepts.slice(0, 6).map((item) => (
                  <li key={`${item.subject}-${item.chapter}-${item.concept}`}>
                    {item.chapter ? `${item.chapter} · ${item.concept}` : item.concept}
                    <span className="pct">{item.masteryPct}% mastery</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {knowledgeSummary && <div className="lg-kl-narrative">{knowledgeSummary}</div>}

        <div style={{ marginTop: 22, position: 'relative', zIndex: 1 }}>
          <h4
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--lg-gold-bright)',
              marginBottom: 8,
            }}
          >
            Cluster Evolution — Behaviour, Not Just Rank
          </h4>
          <div className="lg-kl-chips">
            {Object.keys(CLUSTER_META).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="lg-footer">
        <div>
          Generated by <b>{APP_NAME}</b> — Learning Genome Engine. Feature layer: rule-based
          analytics + regression, no LLM guesswork.
        </div>
        <div>
          Report window {windowLabel} · {meta.total_students} students · {subjectsLabel}
        </div>
      </footer>

      {selectedStudent && (
        <div
          className="lg-overlay print:hidden"
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
    </LgReportLayout>
  )
}