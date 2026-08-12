import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { StudentGenomeDetail } from '@/modules/tutor/components/learningGenome/StudentGenomeDetail'
import {
  cohortReportApiAvailable,
  fetchStudentGenome,
  mapApiGenomeProfile,
} from '@/lib/api/cohortReportApi'
import { useCurriculum } from '@/hooks/useCurriculum'
import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
import { deriveRiskLevel } from '@/modules/tutor/lib/learningGenomeData'
import { formatGenomeQuickFacts } from '@/lib/reportFormatters'
import { translateRisk, translateTrendValue } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgFooter,
  LgHero,
  LgReportLayout,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import '@/modules/tutor/styles/learningGenome.css'

interface StudentGenomeReportPageProps {
  reportsBackHref: string
  reportsBackLabel: string
}

function GenomeReportView({
  displayName,
  profile,
  totalStudents,
  batchLabel,
  windowMeta,
  risk,
  narrative,
  narrativeTa,
  narrativeSource,
  reportsBackHref,
  reportsBackLabel,
}: {
  displayName: string
  profile: GenomeStudentProfile
  totalStudents: number
  batchLabel?: string
  windowMeta: { window: string; latest: string; subjectCount: number } | null
  risk: string
  narrative: string | null
  narrativeTa: string | null
  narrativeSource?: 'vertex' | 'rule-based'
  reportsBackHref: string
  reportsBackLabel: string
}) {
  const { L, language } = useReportLabels()

  return (
    <>
      <LgHero
        reportKind={L.reportKindEngine}
        title={displayName}
        quickFacts={formatGenomeQuickFacts(
          profile.rank,
          totalStudents,
          profile.attendance_pct,
          translateRisk(risk, language),
          language,
        )}
        detailLines={[
          windowMeta
            ? `${L.assessmentWindow}: ${windowMeta.window}`
            : batchLabel
              ? `${L.batch}: ${batchLabel}`
              : `${L.assessmentWindow}: —`,
          profile.latest_assessment
            ? `${L.thisAssessment}: ${profile.latest_assessment.title} · ${L.conducted} ${profile.latest_assessment.date}`
            : windowMeta
              ? `${L.thisAssessment}: ${L.scoredWindow} · ${windowMeta.latest} · ${windowMeta.subjectCount} ${L.subjectCount}`
              : L.awaitingMarks,
        ]}
        stats={[
          { value: `${profile.overall}%`, label: L.overallScore },
          { value: translateTrendValue(profile.consistency, language), label: L.consistency },
          { value: translateTrendValue(profile.trend, language), label: L.learningTrend },
          { value: `${profile.predicted}%`, label: L.predictedNext },
          { value: `${profile.confidence}%`, label: L.confidenceScore },
          { value: `${profile.growth_potential}%`, label: L.growthPotential },
        ]}
        statsPlacement="below"
        showSeal
        backHref={reportsBackHref}
        backLabel={reportsBackLabel}
      />

      <div id="profile">
        <StudentGenomeDetail
          name={displayName}
          profile={profile}
          totalStudents={totalStudents}
          batchLabel={batchLabel}
          narrative={narrative}
          narrativeTa={narrativeTa}
          narrativeSource={narrativeSource}
          embedded
          hideHeader
          hideKpis
        />
      </div>

      <LgFooter
        windowLabel={windowMeta?.window}
        cohortNote={`${totalStudents} ${L.studentsInCohort}`}
      />
    </>
  )
}

export function StudentGenomeReportPage({
  reportsBackHref,
  reportsBackLabel,
}: StudentGenomeReportPageProps) {
  const { studentId } = useParams<{ studentId: string }>()
  const { students } = useCurriculum()
  const curriculumStudent = students.find((s) => s.id === studentId)

  const [profile, setProfile] = useState<GenomeStudentProfile | null>(null)
  const [displayName, setDisplayName] = useState('Student')
  const [batchLabel, setBatchLabel] = useState<string | undefined>()
  const [totalStudents, setTotalStudents] = useState(1)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeTa, setNarrativeTa] = useState<string | null>(null)
  const [narrativeSource, setNarrativeSource] = useState<'vertex' | 'rule-based' | undefined>()
  const [source, setSource] = useState<'live' | 'empty' | 'unavailable'>('empty')
  const [loading, setLoading] = useState(Boolean(studentId && cohortReportApiAvailable()))
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return

    const fallbackName = curriculumStudent?.name ?? 'Student'

    if (!cohortReportApiAvailable()) {
      setDisplayName(fallbackName)
      setProfile(null)
      setSource('unavailable')
      setMessage(
        'Student genome reports require a connection to the Prism API. Set VITE_API_BASE_URL and ensure the backend is running.',
      )
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setMessage(null)
    void fetchStudentGenome(studentId)
      .then((data) => {
        if (cancelled) return
        setDisplayName(data.name)
        setTotalStudents(data.totalStudents)
        setBatchLabel(data.batchLabel ?? undefined)
        if (!data.profile) {
          setProfile(null)
          setSource('empty')
          setMessage(
            data.message ??
              'No assessment results or saved marks yet for this student. Run assessments or enter marks first.',
          )
          return
        }
        setProfile(mapApiGenomeProfile(data.profile))
        setNarrative(data.narrative ?? null)
        setNarrativeTa(data.narrativeTa ?? null)
        setNarrativeSource(data.narrativeSource)
        setSource('live')
      })
      .catch(() => {
        if (cancelled) return
        setProfile(null)
        setSource('empty')
        setDisplayName(fallbackName)
        setMessage('Could not load this student genome report from the API.')
        setBatchLabel(
          curriculumStudent
            ? `${curriculumStudent.batch ?? '—'} · ${curriculumStudent.board} · ${curriculumStudent.grade}`
            : undefined,
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentId, curriculumStudent, students])

  const windowMeta = useMemo(() => {
    if (!profile?.daily_curve.length) return null
    const dates = [...new Set(profile.daily_curve.map((d) => d.date))]
    const first = dates[0]
    const last = dates[dates.length - 1]
    return {
      window: first === last ? first : `${first} – ${last}`,
      latest: last,
      subjectCount: new Set(profile.daily_curve.map((d) => d.subject)).size,
    }
  }, [profile])

  if (!studentId) {
    return (
      <LgReportLayout backHref={reportsBackHref} backLabel={reportsBackLabel}>
        <LgHero
          reportKind="AI Academic Profiling Engine"
          title="Student not found"
          backHref={reportsBackHref}
          backLabel={reportsBackLabel}
          showSeal
        />
      </LgReportLayout>
    )
  }

  if (loading) {
    return <ReportLoader label="Loading genome profile…" />
  }

  if (source === 'unavailable' || !profile || source === 'empty') {
    return (
      <LgReportLayout backHref={reportsBackHref} backLabel={reportsBackLabel}>
        <LgHero
          reportKind="AI Academic Profiling Engine"
          title={displayName}
          description={message ?? 'Reports are built from assessment submissions and saved marks.'}
          backHref={reportsBackHref}
          backLabel={reportsBackLabel}
          showSeal
        />
      </LgReportLayout>
    )
  }

  const risk = deriveRiskLevel(profile, {}, displayName)

  return (
    <LgReportLayout
      bilingual
      printTitle={`${displayName} — Learning Genome`}
      backHref={reportsBackHref}
      backLabel={reportsBackLabel}
      navLinks={(L) => [
        { href: '#assessment-wise', label: L.navAssessment },
        { href: '#trend-map', label: L.navTrend },
        { href: '#history', label: L.navHistory },
        { href: '#narrative', label: L.navSummary },
      ]}
    >
      <GenomeReportView
        displayName={displayName}
        profile={profile}
        totalStudents={totalStudents}
        batchLabel={batchLabel}
        windowMeta={windowMeta}
        risk={risk}
        narrative={narrative}
        narrativeTa={narrativeTa}
        narrativeSource={narrativeSource}
        reportsBackHref={reportsBackHref}
        reportsBackLabel={reportsBackLabel}
      />
    </LgReportLayout>
  )
}
