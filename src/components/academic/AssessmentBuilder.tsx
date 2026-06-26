import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { X, Clock, MapPin, CheckSquare, Square, Users, Search } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { AssessmentPaperPreview } from '@/components/academic/AssessmentPaperPreview'
import { institutionCenters, tutorStudents } from '@/data/mock'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { questionsForPaper, totalMarksForQuestions, topicCounts } from '@/lib/questionPaperUtils'
import type { TutorAssessmentSchedule } from '@/types'
import { cn } from '@/lib/cn'
import { gradesMatch, boardsMatch, scopeLabel } from '@/lib/academicScope'

interface AssessmentBuilderProps {
  open: boolean
  onClose: () => void
  onSave?: (draft: Partial<TutorAssessmentSchedule>) => void
  questionBankPath?: string
}

export function AssessmentBuilder({ open, onClose, onSave, questionBankPath = '/tutor/question-bank' }: AssessmentBuilderProps) {
  const { getPapersForScope, getPaper, questions } = useQuestionPapers()
  const { curriculum, getBatchesForScope } = useCurriculum()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [board, setBoard] = useState('CBSE')
  const [grade, setGrade] = useState('Grade 8')
  const [subject, setSubject] = useState('Mathematics')
  const [mode, setMode] = useState<'practice' | 'assessment'>('assessment')
  const [batchName, setBatchName] = useState('Batch A')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const [paperCoverage, setPaperCoverage] = useState<'full' | 'selected_topics'>('full')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [allCenters, setAllCenters] = useState(true)
  const [assignedStudents, setAssignedStudents] = useState<string[]>([])
  const [topicSearch, setTopicSearch] = useState('')

  const boardData = curriculum.find((b) => b.board === board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === grade) ?? boardData?.grades[0]
  const scopedBatches = getBatchesForScope(board, grade)
  const scopedPapers = getPapersForScope(board, grade, subject)
  const selectedPaper = selectedPaperId ? getPaper(selectedPaperId) : undefined

  const boardOptions = useMemo(
    () => curriculum.map((b) => ({ value: b.board, label: b.board })),
    [curriculum],
  )

  const gradeOptions = useMemo(
    () => boardData?.grades.map((g) => ({ value: g.grade, label: g.grade })) ?? [],
    [boardData],
  )

  const subjectOptions = useMemo(
    () => gradeData?.subjects.map((s) => ({ value: s.name, label: s.name })) ?? [],
    [gradeData],
  )

  const batchOptions = useMemo(
    () => scopedBatches.map((b) => ({ value: b.name, label: b.name })),
    [scopedBatches],
  )

  const paperOptions = useMemo(
    () =>
      scopedPapers.map((paper) => {
        const counts = topicCounts(paper, questions)
        return {
          value: paper.id,
          label: paper.name,
          description: `${paper.questionIds.length} questions · ${paper.totalMarks} marks · ${counts.map((c) => c.topic).join(', ')}`,
        }
      }),
    [scopedPapers, questions],
  )

  const modeOptions = useMemo(
    () => [
      { value: 'practice', label: 'Practice', description: 'Flash-card style with immediate feedback' },
      {
        value: 'assessment',
        label: 'Assessment',
        description: 'Timed exam, one question per screen',
      },
    ],
    [],
  )

  const coverageOptions = useMemo(
    () => [
      {
        value: 'full',
        label: 'Full question paper',
        description: selectedPaper
          ? `All ${selectedPaper.questionIds.length} questions across every topic`
          : 'Use every question in the selected paper',
      },
      {
        value: 'selected_topics',
        label: 'Topic-wise',
        description: 'Pick topics — their questions appear in the paper',
      },
    ],
    [selectedPaper],
  )

  const paperTopicCounts = selectedPaper ? topicCounts(selectedPaper, questions) : []

  const filteredTopicCounts = useMemo(() => {
    const q = topicSearch.trim().toLowerCase()
    if (!q) return paperTopicCounts
    return paperTopicCounts.filter((t) => t.topic.toLowerCase().includes(q))
  }, [paperTopicCounts, topicSearch])

  const selectedQuestionEntries = useMemo(() => {
    if (!selectedPaper) return []
    if (paperCoverage === 'full') {
      return questionsForPaper(selectedPaper, questions)
    }
    return questionsForPaper(selectedPaper, questions, selectedTopics)
  }, [selectedPaper, questions, selectedTopics, paperCoverage])

  const selectedQuestions = selectedQuestionEntries.map((q) => q.id)
  const selectedTotalMarks = totalMarksForQuestions(selectedQuestionEntries)

  useEffect(() => {
    setSelectedPaperId(null)
    setPaperCoverage('full')
    setSelectedTopics([])
    setTopicSearch('')
  }, [board, grade, subject])

  useEffect(() => {
    if (scopedBatches.length > 0 && !scopedBatches.some((b) => b.name === batchName)) {
      setBatchName(scopedBatches[0].name)
    }
  }, [scopedBatches, batchName])

  const batchStudents = tutorStudents.filter(
    (s) =>
      s.batch === batchName &&
      boardsMatch(s.board ?? 'CBSE', board) &&
      gradesMatch(s.grade, grade),
  )

  if (!open) return null

  function selectPaper(paperId: string) {
    const paper = scopedPapers.find((p) => p.id === paperId)
    if (!paper) return
    setSelectedPaperId(paperId)
    setPaperCoverage('full')
    setSelectedTopics([...paper.topics])
    if (!title.trim()) setTitle(paper.name)
  }

  function onBoardChange(next: string) {
    const data = curriculum.find((b) => b.board === next)
    if (!data) return
    setBoard(next)
    setGrade(data.grades[0]?.grade ?? grade)
    setSubject(data.grades[0]?.subjects[0]?.name ?? subject)
  }

  function onGradeChange(next: string) {
    const data = boardData?.grades.find((g) => g.grade === next)
    if (!data) return
    setGrade(next)
    setSubject(data.subjects[0]?.name ?? subject)
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    )
  }

  function selectCoverage(coverage: 'full' | 'selected_topics') {
    if (!selectedPaper) return
    setPaperCoverage(coverage)
    if (coverage === 'full') {
      setSelectedTopics([...selectedPaper.topics])
    } else {
      setSelectedTopics([])
      setTopicSearch('')
    }
  }

  function toggleCenter(id: string) {
    setAllCenters(false)
    setSelectedCenters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  function handleAllCenters(checked: boolean) {
    setAllCenters(checked)
    if (checked) setSelectedCenters([])
  }

  function toggleStudent(id: string) {
    setAssignedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  function selectAllBatchStudents() {
    setAssignedStudents(batchStudents.map((s) => s.id))
  }

  function selectAllTopics() {
    if (!selectedPaper) return
    const allTopicNames = selectedPaper.topics
    setSelectedTopics(
      selectedTopics.length === allTopicNames.length ? [] : [...allTopicNames],
    )
  }

  function handlePublish() {
    const scope = paperCoverage === 'full' ? 'subject' : 'topic'
    onSave?.({
      title: title || 'Untitled assessment',
      board,
      grade,
      subject,
      scope,
      mode,
      batchName,
      questionCount: selectedQuestions.length,
      durationMinutes,
      scheduledAt: scheduledAt || new Date().toISOString().slice(0, 10),
      status: 'scheduled',
      centerIds: allCenters ? institutionCenters.map((c) => c.id) : selectedCenters,
      selectedQuestionIds: selectedQuestions,
      assignedStudentIds: assignedStudents,
      createdByTutorId: 'tut-1',
      questionPaperId: selectedPaperId ?? undefined,
      paperCoverage,
      selectedTopics: paperCoverage === 'selected_topics' ? selectedTopics : selectedPaper?.topics,
      topic:
        paperCoverage === 'selected_topics' && selectedTopics.length === 1
          ? selectedTopics[0]
          : undefined,
    })
    onClose()
    setStep(1)
    setAssignedStudents([])
    setSelectedPaperId(null)
    setPaperCoverage('full')
    setSelectedTopics([])
    setTopicSearch('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-ink/40 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl my-8 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl text-foreground">Create assessment</h2>
            <p className="text-sm text-muted-foreground">
              Step {step} of 3 —{' '}
              {step === 1
                ? 'Setup, paper & topics'
                : step === 2
                  ? 'Assign students'
                  : 'Schedule & branches'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 rounded-md bg-secondary/40 border border-border px-3 py-2 text-xs text-muted-foreground">
                Scoped to <span className="font-medium text-foreground">{scopeLabel({ board, grade })}</span>
                {' '}— students only see exams matching their board and grade.
              </div>
              <label className="block md:col-span-2">
                <span className="text-xs text-muted-foreground">Assessment title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter Test — Mensuration"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                />
              </label>
              <AppSelect
                label="Board"
                value={board}
                onChange={onBoardChange}
                options={boardOptions}
                placeholder="Select board"
              />
              <AppSelect
                label="Grade"
                value={grade}
                onChange={onGradeChange}
                options={gradeOptions}
                placeholder="Select grade"
              />
              <AppSelect
                label="Subject"
                value={subject}
                onChange={setSubject}
                options={subjectOptions}
                placeholder="Select subject"
              />
              <AppSelect
                label="Batch"
                value={batchName}
                onChange={setBatchName}
                options={batchOptions}
                placeholder="Select batch"
                emptyMessage="No batches for this board and grade"
              />
              <AppSelect
                label="Mode"
                value={mode}
                onChange={(v) => setMode(v as typeof mode)}
                options={modeOptions}
                placeholder="Select mode"
              />

              <div className="md:col-span-2 pt-2 border-t border-border">
                <AppSelect
                  label="Question paper *"
                  value={selectedPaperId}
                  onChange={selectPaper}
                  options={paperOptions}
                  searchable
                  searchPlaceholder="Search papers by name or topic…"
                  placeholder="Select question paper"
                  emptyMessage={
                    scopedPapers.length === 0
                      ? 'No question papers for this board, grade, and subject'
                      : 'No papers match your search'
                  }
                />
                {scopedPapers.length === 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a paper in{' '}
                    <Link to={questionBankPath} className="text-accent hover:underline">
                      Question Bank
                    </Link>{' '}
                    for {scopeLabel({ board, grade })} · {subject}.
                  </p>
                ) : selectedPaper ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedPaper.questionIds.length} questions · {selectedPaper.totalMarks} marks ·{' '}
                    {selectedPaper.topics.length} topic{selectedPaper.topics.length !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {scopedPapers.length} paper{scopedPapers.length !== 1 ? 's' : ''} available for this
                    scope.
                  </p>
                )}

                {selectedPaper && (
                  <div className="mt-4 space-y-4">
                    <AppSelect
                      label="Full paper or topic-wise? *"
                      value={paperCoverage}
                      onChange={(v) => selectCoverage(v as 'full' | 'selected_topics')}
                      options={coverageOptions}
                      placeholder="Choose coverage"
                    />

                    {paperCoverage === 'selected_topics' && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-medium text-foreground">Select topics *</span>
                          <button
                            type="button"
                            onClick={selectAllTopics}
                            className="text-xs text-accent hover:underline shrink-0"
                          >
                            {selectedTopics.length === selectedPaper.topics.length
                              ? 'Clear all'
                              : 'Select all topics'}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Selected topics and their questions will appear in the question paper below.
                        </p>

                        <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-md px-3 py-2 mb-3">
                          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            placeholder="Search topics…"
                            className="text-sm outline-none bg-transparent w-full"
                          />
                        </div>

                        {filteredTopicCounts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No topics match your search.
                          </p>
                        ) : (
                          <ul className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin border border-border rounded-md p-2">
                            {filteredTopicCounts.map(({ topic, count }) => {
                              const selected = selectedTopics.includes(topic)
                              return (
                                <li key={topic}>
                                  <button
                                    type="button"
                                    onClick={() => toggleTopic(topic)}
                                    className={cn(
                                      'w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors',
                                      selected
                                        ? 'bg-accent/10 border border-accent/30'
                                        : 'hover:bg-secondary/50 border border-transparent',
                                    )}
                                  >
                                    {selected ? (
                                      <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground">{topic}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {count} question{count !== 1 ? 's' : ''} in this paper
                                      </p>
                                    </div>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}

                    <AssessmentPaperPreview
                      paperName={selectedPaper.name}
                      paperCoverage={paperCoverage}
                      selectedTopics={
                        paperCoverage === 'full' ? selectedPaper.topics : selectedTopics
                      }
                      questions={selectedQuestionEntries}
                      totalMarks={selectedTotalMarks}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h4 className="font-medium text-foreground">Who can attend this exam?</h4>
                </div>
                <button
                  type="button"
                  onClick={selectAllBatchStudents}
                  className="text-xs text-accent hover:underline"
                >
                  Select all in {batchName}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Only {scopeLabel({ board, grade })} students in {batchName} can be invited.
              </p>
              <p className="text-xs text-muted-foreground">
                {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} selected
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2 border border-border rounded-md p-2">
                {batchStudents.map((student) => {
                  const selected = assignedStudents.includes(student.id)
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors',
                        selected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-secondary/50',
                      )}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.batch} · readiness {student.readiness}%
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Exam duration (minutes)
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Scheduled date</span>
                  <input
                    type="date"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </label>
              </div>

              <AppCard className="!p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h4 className="font-medium text-foreground">Which branches can attend?</h4>
                </div>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allCenters}
                    onChange={(e) => handleAllCenters(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">All branches ({institutionCenters.length} centers)</span>
                </label>
                {!allCenters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {institutionCenters.map((center) => {
                      const selected = selectedCenters.includes(center.id)
                      return (
                        <button
                          key={center.id}
                          type="button"
                          onClick={() => toggleCenter(center.id)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-md border text-left text-sm transition-colors',
                            selected
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:bg-secondary/50',
                          )}
                        >
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-foreground">{center.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {center.city} · {center.studentCount} students
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </AppCard>

              <div className="bg-secondary/40 rounded-md p-4 text-sm">
                <p className="font-medium text-foreground mb-2">Summary</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>
                    {selectedQuestions.length} questions from &ldquo;{selectedPaper?.name ?? 'question paper'}&rdquo;
                    {paperCoverage === 'full'
                      ? ' (full paper)'
                      : selectedPaper && selectedTopics.length > 0
                        ? ` (${selectedTopics.length} topic${selectedTopics.length !== 1 ? 's' : ''}: ${selectedTopics.join(', ')})`
                        : ' (topic-wise — no topics selected)'}{' '}
                    · {durationMinutes} min · {mode} mode
                  </li>
                  <li>
                    Students invited: {assignedStudents.length} from {batchName}
                  </li>
                  <li>
                    Branches:{' '}
                    {allCenters
                      ? 'All'
                      : selectedCenters
                          .map((id) => institutionCenters.find((c) => c.id === id)?.name)
                          .filter(Boolean)
                          .join(', ') || 'None selected'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={
              (step === 1 &&
                (!selectedPaperId ||
                  selectedQuestions.length === 0 ||
                  (paperCoverage === 'selected_topics' && selectedTopics.length === 0))) ||
              (step === 2 && assignedStudents.length === 0)
            }
            onClick={() => (step < 3 ? setStep(step + 1) : handlePublish())}
            className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {step < 3 ? 'Continue' : 'Schedule assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}
