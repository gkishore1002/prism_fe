import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { StudentGenomeDetail } from '@/modules/tutor/components/learningGenome/StudentGenomeDetail'
import {
  cohortReportApiAvailable,
  fetchStudentGenome,
  mapApiGenomeProfile,
} from '@/lib/api/cohortReportApi'
import { useCurriculum } from '@/hooks/useCurriculum'
import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
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

  if (!studentId) {
    return (
      <LgReportLayout>
        <LgHero reportKind="Learning Genome" title="Student not found" backHref={reportsBackHref} backLabel={reportsBackLabel} />
      </LgReportLayout>
    )
  }

  if (loading) {
    return <PageLoader label="Loading genome profile…" />
  }

  if (source === 'unavailable' || !profile || source === 'empty') {
    return (
      <LgReportLayout>
        <LgHero
          reportKind="Learning Genome"
          title={displayName}
          description={message ?? 'Reports are built from assessment submissions and saved marks.'}
          backHref={reportsBackHref}
          backLabel={reportsBackLabel}
        />
      </LgReportLayout>
    )
  }

  return (
    <LgReportLayout>
      <LgHero
        reportKind="Learning Genome report"
        title={displayName}
        description="Subject affinity, performance curve, and live AI narrative."
        meta={[
          { label: 'Rank', value: `#${profile.rank} of ${totalStudents}` },
          { label: 'Batch', value: batchLabel ?? '—' },
          { label: 'Attendance', value: `${profile.attendance_pct}%` },
        ]}
        stats={[
          { value: profile.overall, unit: '%', label: 'Overall score' },
          { value: profile.consistency, label: 'Consistency' },
          { value: profile.trend, label: 'Trend' },
          { value: profile.predicted, unit: '%', label: 'Predicted next' },
        ]}
        backHref={reportsBackHref}
        backLabel={reportsBackLabel}
      />

      <StudentGenomeDetail
        name={displayName}
        profile={profile}
        totalStudents={totalStudents}
        batchLabel={batchLabel}
        narrative={narrative}
        narrativeSource={narrativeSource}
        embedded
        hideHeader
      />

      <LgFooter />
    </LgReportLayout>
  )
}
