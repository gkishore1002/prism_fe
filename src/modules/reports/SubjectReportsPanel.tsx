import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, FileText, Target, Users } from 'lucide-react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AppCard, AppStat } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import {
  subjectReportInsightBullets,
  subjectStudentInsightBullets,
  subjectTopicInsightBullets,
} from '@/lib/analyticsInsights'
import { gradesMatch } from '@/lib/academicScope'
import { getHealthStatus } from '@/lib/constants'
import { useCurriculum } from '@/hooks/useCurriculum'
import { analyticsApi } from '@/lib/api/analyticsApi'
import { cn } from '@/lib/cn'

type SubjectStudent = {
  id: string
  name: string
  grade: string
  health: number
  readiness: number
  batch: string
  topics: { name: string; mastery: number }[]
}

type TopicRow = { name: string; mastery: number }

type SortKey = 'health' | 'readiness' | 'name' | 'topic'

interface SubjectReportsPanelProps {
  studentReportPathPrefix: string
}

function masteryTone(mastery: number): string {
  if (mastery >= 70) return 'bg-leaf'
  if (mastery >= 55) return 'bg-accent'
  return 'bg-rose'
}

function MasteryBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 rounded-full bg-secondary overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', masteryTone(value))}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function topicScore(student: SubjectStudent, topic: string | null): number | null {
  if (!topic) return null
  return student.topics.find((t) => t.name === topic)?.mastery ?? null
}

export function SubjectReportsPanel({ studentReportPathPrefix }: SubjectReportsPanelProps) {
  const { curriculum, loading: curriculumLoading, ensureLoaded } = useCurriculum()
  const [subjectStudents, setSubjectStudents] = useState<SubjectStudent[]>([])
  const [subjectTopics, setSubjectTopics] = useState<TopicRow[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [board, setBoard] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('health')

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  useEffect(() => {
    if (curriculum.length > 0 && !board) {
      setBoard(curriculum[0].board)
      setGrade(curriculum[0].grades[0]?.grade ?? '')
      setSubject(curriculum[0].grades[0]?.subjects[0]?.name ?? '')
    }
  }, [curriculum, board])

  const boardData = curriculum.find((b) => b.board === board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === grade) ?? boardData?.grades[0]
  const curriculumTopics = gradeData?.subjects.find((s) => s.name === subject)?.topics ?? []

  useEffect(() => {
    if (!subject) return
    setDataLoading(true)
    setSelectedTopic(null)
    setSelectedStudentId(null)
    void Promise.all([
      analyticsApi.subjectStudents(subject).catch(() => [] as SubjectStudent[]),
      analyticsApi.subjectTopics(subject).catch(() => [] as TopicRow[]),
    ])
      .then(([students, topics]) => {
        setSubjectStudents(students)
        setSubjectTopics(topics)
      })
      .finally(() => setDataLoading(false))
  }, [subject])

  const topicRows = useMemo(() => {
    if (subjectTopics.length > 0) return [...subjectTopics].sort((a, b) => b.mastery - a.mastery)
    return curriculumTopics
      .map((t) => ({ name: t.name, mastery: t.mastery ?? 0 }))
      .sort((a, b) => b.mastery - a.mastery)
  }, [subjectTopics, curriculumTopics])

  const gradeFilteredStudents = useMemo(
    () => subjectStudents.filter((s) => !grade || gradesMatch(s.grade, grade)),
    [subjectStudents, grade],
  )

  const sortedStudents = useMemo(() => {
    const rows = [...gradeFilteredStudents]
    if (sortKey === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name))
    if (sortKey === 'readiness') return rows.sort((a, b) => b.readiness - a.readiness)
    if (sortKey === 'topic' && selectedTopic) {
      return rows.sort((a, b) => {
        const aScore = topicScore(a, selectedTopic) ?? -1
        const bScore = topicScore(b, selectedTopic) ?? -1
        return bScore - aScore
      })
    }
    return rows.sort((a, b) => b.health - a.health)
  }, [gradeFilteredStudents, sortKey, selectedTopic])

  const selectedStudent = selectedStudentId
    ? gradeFilteredStudents.find((s) => s.id === selectedStudentId)
    : undefined

  const classHealthAvg =
    gradeFilteredStudents.length > 0
      ? Math.round(
          gradeFilteredStudents.reduce((sum, s) => sum + s.health, 0) / gradeFilteredStudents.length,
        )
      : null

  const topicAverage =
    topicRows.length > 0
      ? Math.round(topicRows.reduce((sum, t) => sum + t.mastery, 0) / topicRows.length)
      : null

  const weakestTopic = topicRows.length > 0 ? [...topicRows].sort((a, b) => a.mastery - b.mastery)[0] : null
  const strongestTopic = topicRows[0]

  const insightBullets = useMemo(() => {
    if (selectedStudent) {
      return subjectStudentInsightBullets(selectedStudent, subject)
    }
    if (selectedTopic) {
      const topicMastery = topicRows.find((t) => t.name === selectedTopic)?.mastery ?? 0
      return subjectTopicInsightBullets(selectedTopic, sortedStudents, topicMastery)
    }
    return subjectReportInsightBullets(subject, sortedStudents)
  }, [selectedStudent, selectedTopic, subject, sortedStudents, topicRows])

  if (curriculumLoading && curriculum.length === 0) {
    return <PageLoader label="Loading curriculum…" />
  }

  if (!boardData || !gradeData) {
    return (
      <AppCard>
        <p className="text-sm text-muted-foreground">
          No curriculum data yet. Add boards, grades, and subjects under Curriculum Setup.
        </p>
      </AppCard>
    )
  }

  const boardOptions = curriculum.map((b) => ({ value: b.board, label: b.board }))
  const gradeOptions = boardData.grades.map((g) => ({ value: g.grade, label: g.grade }))
  const subjectOptions = gradeData.subjects.map((s) => ({ value: s.name, label: s.name }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">Subject performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare topic mastery across the class, then drill into individual students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-secondary shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          Print report
        </button>
      </div>

      <AppCard>
        <div className="grid sm:grid-cols-3 gap-4">
          <AppSelect
            label="Board"
            value={board}
            onChange={(value) => {
              const nextBoard = curriculum.find((b) => b.board === value)
              setBoard(value)
              setGrade(nextBoard?.grades[0]?.grade ?? '')
              setSubject(nextBoard?.grades[0]?.subjects[0]?.name ?? '')
            }}
            options={boardOptions}
          />
          <AppSelect
            label="Grade"
            value={grade}
            onChange={(value) => {
              const nextGrade = boardData.grades.find((g) => g.grade === value)
              setGrade(value)
              setSubject(nextGrade?.subjects[0]?.name ?? subject)
            }}
            options={gradeOptions}
          />
          <AppSelect
            label="Subject"
            value={subject}
            onChange={setSubject}
            options={subjectOptions}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
          Viewing <span className="text-foreground font-medium">{subject}</span> · {board} · {grade}
          {selectedTopic && (
            <>
              {' '}
              · topic <span className="text-accent font-medium">{selectedTopic}</span>
            </>
          )}
        </p>
      </AppCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppStat label="Students scored" value={gradeFilteredStudents.length} hint={subject} />
        <AppStat
          label="Class health"
          value={classHealthAvg ?? '—'}
          unit={classHealthAvg != null ? '%' : undefined}
          tone="leaf"
        />
        <AppStat
          label="Topic average"
          value={topicAverage ?? '—'}
          unit={topicAverage != null ? '%' : undefined}
          tone="accent"
        />
        <AppStat
          label="Needs focus"
          value={weakestTopic?.name ?? '—'}
          hint={weakestTopic ? `${weakestTopic.mastery}% mastery` : 'No topic data yet'}
          tone="rose"
        />
      </div>

      <AnalyticsInsightsCard title="Insights" bullets={insightBullets} />

      {dataLoading ? (
        <PageLoader label="Loading subject data…" />
      ) : (
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <AppCard className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-accent" />
              <div>
                <h3 className="font-display text-lg">Topics</h3>
                <p className="text-xs text-muted-foreground">Select a topic to filter the student list</p>
              </div>
            </div>

            {topicRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scored topic data for this subject yet.</p>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopic(null)
                    setSelectedStudentId(null)
                    setSortKey('health')
                  }}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                    selectedTopic === null
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:bg-secondary/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span>All topics</span>
                    <span className="font-mono-data text-xs text-muted-foreground">
                      avg {topicAverage ?? 0}%
                    </span>
                  </div>
                </button>

                {topicRows.map((topic) => (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic.name)
                      setSelectedStudentId(null)
                      setSortKey('topic')
                    }}
                    className={cn(
                      'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                      selectedTopic === topic.name
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-secondary/50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-medium truncate">{topic.name}</span>
                      <span className="font-mono-data text-xs shrink-0">{topic.mastery}%</span>
                    </div>
                    <MasteryBar value={topic.mastery} />
                  </button>
                ))}
              </div>
            )}

            {strongestTopic && (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                Strongest: {strongestTopic.name} ({strongestTopic.mastery}%)
              </p>
            )}
          </AppCard>

          <AppCard className="lg:col-span-3 p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="font-display text-lg">
                    {selectedTopic ? `${selectedTopic} · students` : 'All students'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''} with scores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <AppSelect
                  variant="compact"
                  value={sortKey}
                  onChange={(value) => setSortKey(value as SortKey)}
                  options={[
                    { value: 'health', label: 'Subject health' },
                    { value: 'readiness', label: 'Readiness' },
                    { value: 'name', label: 'Name' },
                    ...(selectedTopic ? [{ value: 'topic', label: 'Topic score' }] : []),
                  ]}
                  className="min-w-[10rem]"
                />
              </div>
            </div>

            {sortedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">
                No students with {subject} scores for {grade} yet.
              </p>
            ) : (
              <ResponsiveTable minWidth={640}>
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-5 py-3">Student</th>
                      <th className="text-left px-5 py-3">Batch</th>
                      {selectedTopic && <th className="text-right px-5 py-3">Topic</th>}
                      <th className="text-right px-5 py-3">Health</th>
                      <th className="text-right px-5 py-3">Readiness</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => {
                      const isSelected = selectedStudentId === student.id
                      const topicMastery = topicScore(student, selectedTopic)
                      return (
                        <tr
                          key={student.id}
                          className={cn(
                            'border-t border-border cursor-pointer transition-colors',
                            isSelected ? 'bg-accent/10' : 'hover:bg-secondary/30',
                          )}
                          onClick={() =>
                            setSelectedStudentId((current) =>
                              current === student.id ? null : student.id,
                            )
                          }
                        >
                          <td className="px-5 py-3.5 font-medium">{student.name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{student.batch}</td>
                          {selectedTopic && (
                            <td className="px-5 py-3.5 text-right font-mono-data">
                              {topicMastery != null ? `${topicMastery}%` : '—'}
                            </td>
                          )}
                          <td className="px-5 py-3.5 text-right">
                            <HealthBadge
                              status={getHealthStatus(student.health)}
                              score={student.health}
                              showLabel={false}
                            />
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono-data text-muted-foreground">
                            {student.readiness}%
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`${studentReportPathPrefix}/${student.id}/report`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-accent hover:underline"
                            >
                              Full report
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ResponsiveTable>
            )}

            {selectedStudent && (
              <div className="border-t border-border p-5 bg-secondary/20">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-accent">Student breakdown</p>
                    <h4 className="font-display text-xl mt-1">
                      {selectedStudent.name} · {subject}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedStudent.batch} · {selectedStudent.grade}
                    </p>
                  </div>
                  <Link
                    to={`${studentReportPathPrefix}/${selectedStudent.id}/report`}
                    className="text-xs text-accent hover:underline shrink-0"
                  >
                    Open genome report →
                  </Link>
                </div>

                {(selectedStudent.topics.length > 0 ? selectedStudent.topics : topicRows).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No topic-level scores for this student yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(selectedStudent.topics.length > 0
                      ? [...selectedStudent.topics].sort((a, b) => b.mastery - a.mastery)
                      : topicRows
                    ).map((topic) => (
                      <div key={topic.name}>
                        <div className="flex items-center justify-between gap-3 text-sm mb-1">
                          <span className="truncate">{topic.name}</span>
                          <span className="font-mono-data text-xs shrink-0">{topic.mastery}%</span>
                        </div>
                        <MasteryBar value={topic.mastery} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AppCard>
        </div>
      )}
    </div>
  )
}
