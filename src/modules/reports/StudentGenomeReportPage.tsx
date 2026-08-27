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
import type { ConceptNotMastered } from '@/modules/tutor/lib/learningGenomeConcepts'
import { deriveRiskLevel } from '@/modules/tutor/lib/learningGenomeData'
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
  const [topicMastery, setTopicMastery] = useState<ConceptNotMastered[]>([])
  const [knowledgeSummary, setKnowledgeSummary] = useState('')
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
        setTopicMastery(data.topicMastery ?? [])
        setKnowledgeSummary(data.knowledgeSummary ?? '')
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
      navLinks={[
        { href: '#profile', label: 'Profile' },
        { href: '#genome', label: 'Learning Genome' },
        { href: '#knowledge-layer', label: 'Knowledge Layer' },
        { href: '#report-lang-focus', label: 'Summary' },
      ]}
    >
      <div id="profile">
        <StudentGenomeDetail
          name={displayName}
          profile={{ ...profile, risk_level: risk }}
          totalStudents={totalStudents}
          batchLabel={batchLabel}
          narrative={narrative}
          narrativeTa={narrativeTa}
          narrativeSource={narrativeSource}
          topicMastery={topicMastery}
          knowledgeSummary={knowledgeSummary}
          embedded
          pageLayout
        />
      </div>
      <LgFooter
        windowLabel={windowMeta?.window}
        cohortNote={`${totalStudents} students in cohort`}
      />
    </LgReportLayout>
  )
}

