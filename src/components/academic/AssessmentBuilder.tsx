import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, CheckSquare, Square, Users, Search } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { AssessmentPaperPreview } from '@/components/academic/AssessmentPaperPreview'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useAuth } from '@/hooks/useAuth'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useCenters } from '@/hooks/useCenters'
import { formatCenterLabel } from '@/lib/centerLabel'
import { fetchStudentsForBatch } from '@/lib/api/curriculumApi'
import type { StudentSummary } from '@/types'
import { questionsForPaper, totalMarksForQuestions, topicCounts } from '@/lib/questionPaperUtils'
import type { TutorAssessmentSchedule } from '@/types'
import { cn } from '@/lib/cn'
import { gradesMatch, boardsMatch, scopeLabel, studentFitsScope } from '@/lib/academicScope'

interface AssessmentBuilderProps {
  open: boolean
  onClose: () => void
  onSave?: (draft: Partial<TutorAssessmentSchedule>) => void | Promise<void>
  questionBankPath?: string
}

export function AssessmentBuilder({ open, onClose, onSave, questionBankPath = '/tutor/question-bank' }: AssessmentBuilderProps) {
  const { user } = useAuth()
  const {
    papersForAssessment,
    getPaper,
    questions,
    loading: papersLoading,
    ensureLoaded,
  } = useQuestionPapers()
  const { curriculum, batches, students, getBatchesForScope, ensureLoaded: ensureCurriculumLoaded } =
    useCurriculum()
  const { centers: institutionCenters } = useCenters({ enabled: open })
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [board, setBoard] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'practice' | 'assessment'>('assessment')
  const [batchName, setBatchName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const [paperCoverage, setPaperCoverage] = useState<'full' | 'selected_topics'>('full')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [allCenters, setAllCenters] = useState(true)
  const [assignedStudents, setAssignedStudents] = useState<string[]>([])
  const [batchStudents, setBatchStudents] = useState<StudentSummary[]>([])
  const [loadingBatchStudents, setLoadingBatchStudents] = useState(false)
  const [batchStudentsError, setBatchStudentsError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')
  const [scopeInitialized, setScopeInitialized] = useState(false)
  const [showPaperPreview, setShowPaperPreview] = useState(false)

  useEffect(() => {
    if (!open) {
      setScopeInitialized(false)
      setShowPaperPreview(false)
      setPublishError(null)
      return
    }
    void ensureCurriculumLoaded()
    void ensureLoaded()
    // Only re-run when the modal opens — not when loader callbacks change identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function pickScopeWithBatches() {
    for (const boardEntry of curriculum) {
      for (const gradeEntry of boardEntry.grades) {
        const scoped = batches.filter(
          (b) => boardsMatch(b.board, boardEntry.board) && gradesMatch(b.grade, gradeEntry.grade),
        )
        if (scoped.length > 0) {
          return {
            board: boardEntry.board,
            grade: gradeEntry.grade,
            subject: gradeEntry.subjects[0]?.name ?? '',
            batchName: scoped[0].name,
          }
        }
      }
    }
    const firstBoard = curriculum[0]
    const firstGrade = firstBoard?.grades[0]
    const fallbackBatches = firstBoard
      ? getBatchesForScope(firstBoard.board, firstGrade?.grade ?? '')
      : []
    return {
      board: firstBoard?.board ?? '',
      grade: firstGrade?.grade ?? '',
      subject: firstGrade?.subjects[0]?.name ?? '',
      batchName: fallbackBatches[0]?.name ?? '',
    }
  }

  // Initialize board/grade once when the modal opens — do not re-force after user edits
  useEffect(() => {
    if (!open || scopeInitialized || curriculum.length === 0) return
    const scope = pickScopeWithBatches()
    setBoard(scope.board)
    setGrade(scope.grade)
    setSubject(scope.subject)
    setBatchName(scope.batchName)
    setScopeInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scopeInitialized, curriculum.length])

  const boardData = useMemo(
    () => curriculum.find((b) => boardsMatch(b.board, board)),
    [curriculum, board],
  )
  const gradeData = useMemo(
    () => boardData?.grades.find((g) => gradesMatch(g.grade, grade)),
    [boardData, grade],
  )
  const scopedBatches = getBatchesForScope(board, grade)
  const availablePapers = papersForAssessment(board, grade, subject)
  const scopedPapers = availablePapers.filter(
    (p) =>
      boardsMatch(p.board, board) &&
      gradesMatch(p.grade, grade) &&
      p.subject.trim().toLowerCase() === subject.trim().toLowerCase(),
  )
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
    () =>
      scopedBatches.map((b) => {
        const meta = [b.subject, b.scheduleTiming].filter(Boolean).join(' · ')
        return {
          value: b.name,
          label: b.name,
          description: meta || `${b.studentIds.length} student${b.studentIds.length !== 1 ? 's' : ''}`,
        }
      }),
    [scopedBatches],
  )

  const paperOptions = useMemo(
    () =>
      availablePapers.map((paper) => {
        const counts = topicCounts(paper, questions)
        const matchesScope =
          boardsMatch(paper.board, board) &&
          gradesMatch(paper.grade, grade) &&
          paper.subject.trim().toLowerCase() === subject.trim().toLowerCase()
        const scopeNote = matchesScope
          ? ''
          : ` · ${scopeLabel({ board: paper.board, grade: paper.grade })} · ${paper.subject}`
        return {
          value: paper.id,
          label: paper.name,
          description: `${paper.questionIds.length} questions · ${paper.totalMarks} marks${scopeNote}${counts.length ? ` · ${counts.map((c) => c.topic).join(', ')}` : ''}`,
        }
      }),
    [availablePapers, questions, board, grade, subject],
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

  const selectedQuestions =
    selectedQuestionEntries.length > 0
      ? selectedQuestionEntries.map((q) => q.id)
      : selectedPaper?.questionIds ?? []
  const selectedTotalMarks =
    selectedQuestionEntries.length > 0
      ? totalMarksForQuestions(selectedQuestionEntries)
      : selectedPaper?.totalMarks ?? 0

  useEffect(() => {
    if (!scopeInitialized) return
    setSelectedPaperId(null)
    setPaperCoverage('full')
    setSelectedTopics([])
    setTopicSearch('')
    setShowPaperPreview(false)
  }, [board, grade, subject, scopeInitialized])

  // Keep batch name valid for the selected board+grade — never force grade back
  useEffect(() => {
    if (!scopeInitialized) return
    if (scopedBatches.length > 0 && !scopedBatches.some((b) => b.name === batchName)) {
      setBatchName(scopedBatches[0].name)
    }
    if (scopedBatches.length === 0 && batchName) {
      setBatchName('')
    }
  }, [scopedBatches, batchName, scopeInitialized])

  const selectedBatch = scopedBatches.find((b) => b.name === batchName)

  useEffect(() => {
    if (!open || !selectedBatch?.id) {
      setBatchStudents([])
      setAssignedStudents([])
      setBatchStudentsError(null)
      return
    }

    let cancelled = false
    setLoadingBatchStudents(true)
    setBatchStudentsError(null)

    void fetchStudentsForBatch(selectedBatch.id)
      .then((list) => {
        if (cancelled) return
        setBatchStudents(list)
        setAssignedStudents(list.map((s) => s.id))
      })
      .catch((e) => {
        if (cancelled) return
        setBatchStudents([])
        setAssignedStudents([])
        setBatchStudentsError(e instanceof Error ? e.message : 'Failed to load batch students')
      })
      .finally(() => {
        if (!cancelled) setLoadingBatchStudents(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, selectedBatch?.id])

  const batchStudentIdSet = useMemo(
    () => new Set(batchStudents.map((s) => s.id)),
    [batchStudents],
  )

  const extraCandidates = useMemo(() => {
    return students.filter(
      (s) =>
        studentFitsScope(s, board, grade) &&
        !batchStudentIdSet.has(s.id) &&
        !assignedStudents.includes(s.id),
    )
  }, [students, board, grade, batchStudentIdSet, assignedStudents])

  const extraInvitees = useMemo(
    () =>
      students.filter(
        (s) => assignedStudents.includes(s.id) && !batchStudentIdSet.has(s.id),
      ),
    [students, assignedStudents, batchStudentIdSet],
  )

  function addExtraStudent(studentId: string) {
    setAssignedStudents((prev) => (prev.includes(studentId) ? prev : [...prev, studentId]))
  }

  const stepLabel =
    step === 1
      ? 'Setup, paper & topics'
      : step === 2
        ? 'Assign students'
        : 'Schedule & branches'

  function selectPaper(paperId: string) {
    const paper = availablePapers.find((p) => p.id === paperId)
    if (!paper) return
    setSelectedPaperId(paperId)
    setPaperCoverage('full')
    setSelectedTopics([...paper.topics])
    if (!title.trim()) setTitle(paper.name)
  }

  function onBoardChange(next: string) {
    const data = curriculum.find((b) => boardsMatch(b.board, next))
    if (!data) return
    setBoard(data.board)
    const nextGrade = data.grades[0]?.grade ?? ''
    setGrade(nextGrade)
    setSubject(data.grades[0]?.subjects[0]?.name ?? '')
    const nextBatches = getBatchesForScope(data.board, nextGrade)
    setBatchName(nextBatches[0]?.name ?? '')
  }

  function onGradeChange(next: string) {
    const data = boardData?.grades.find((g) => gradesMatch(g.grade, next))
    if (!data) return
    setGrade(data.grade)
    setSubject(data.subjects[0]?.name ?? '')
    const nextBatches = getBatchesForScope(board, data.grade)
    setBatchName(nextBatches[0]?.name ?? '')
  }

  function onSubjectChange(next: string) {
    setSubject(next)
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

  async function handlePublish() {
    if (!batchName.trim()) {
      setPublishError('Select a batch before scheduling.')
      return
    }
    setPublishing(true)
    setPublishError(null)
    const scope = paperCoverage === 'full' ? 'subject' : 'topic'
    try {
      await onSave?.({
        title: title || 'Untitled assessment',
        board,
        grade,
        subject,
        scope,
        mode,
        batchName,
        questionCount: selectedQuestions.length,
        durationMinutes: durationMinutes || 0,
        scheduledAt: scheduledAt.trim(),
        status: 'scheduled',
        centerIds: allCenters ? institutionCenters.map((c) => c.id) : selectedCenters,
        selectedQuestionIds: selectedQuestions,
        assignedStudentIds: assignedStudents,
        createdByTutorId: user.id,
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
      setBatchStudents([])
      setSelectedPaperId(null)
      setPaperCoverage('full')
      setSelectedTopics([])
      setTopicSearch('')
      setShowPaperPreview(false)
      setPublishError(null)
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Failed to create assessment')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Create assessment"
      description={`Step ${step} of 3 — ${stepLabel}`}
      size="lg"
      bodyClassName="space-y-5"
      footerClassName="justify-between"
      footer={
        <>
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
              publishing ||
              (step === 1 &&
                (!batchName ||
                  scopedBatches.length === 0 ||
                  !selectedPaperId ||
                  selectedQuestions.length === 0 ||
                  (paperCoverage === 'selected_topics' && selectedTopics.length === 0))) ||
              (step === 2 && loadingBatchStudents) ||
              (step === 2 && batchStudents.length > 0 && assignedStudents.length === 0)
            }
            onClick={() => {
              if (step < 3) {
                setPublishError(null)
                setStep(step + 1)
                return
              }
              void handlePublish()
            }}
            className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {publishing ? 'Saving…' : step < 3 ? 'Continue' : 'Schedule assessment'}
          </button>
        </>
      }
    >
          {publishError && (
            <div className="rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
              {publishError}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-md bg-secondary/40 border border-border px-3 py-2 text-xs text-muted-foreground">
                Scoped to <span className="font-medium text-foreground">{scopeLabel({ board, grade })}</span>
                {' '}— students only see exams matching their board and grade.
              </div>

              <section className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Exam details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block sm:col-span-2">
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
                    onChange={onSubjectChange}
                    options={subjectOptions}
                    placeholder="Select subject"
                  />
                  <AppSelect
                    label="Batch"
                    value={batchName || null}
                    onChange={setBatchName}
                    options={batchOptions}
                    placeholder={scopedBatches.length === 0 ? 'No batches — create in Curriculum Setup' : 'Select batch'}
                    emptyMessage="No batches for this board and grade — add one in Curriculum Setup"
                  />
                  <AppSelect
                    label="Mode"
                    value={mode}
                    onChange={(v) => setMode(v as typeof mode)}
                    options={modeOptions}
                    placeholder="Select mode"
                  />
                </div>
                {scopedBatches.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Create batches under Curriculum Setup for {scopeLabel({ board, grade })} — they appear here
                    for assessments.
                  </p>
                )}
              </section>

              <section className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question paper
                </h3>
                <AppSelect
                  label="Question paper *"
                  value={selectedPaperId}
                  onChange={selectPaper}
                  options={paperOptions}
                  searchable
                  searchPlaceholder="Search papers by name or topic…"
                  placeholder={papersLoading ? 'Loading question papers…' : 'Select question paper'}
                  disabled={papersLoading}
                  emptyMessage="No question papers in your bank yet — create one under Question Bank"
                  searchEmptyMessage="No papers match your search"
                />
                {papersLoading ? (
                  <InlineLoader label="Loading question papers…" size="xs" className="mt-1" />
                ) : paperOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Publish a paper in{' '}
                    <Link to={questionBankPath} className="text-accent hover:underline">
                      Question Bank
                    </Link>{' '}
                    (manual entry or upload), then return here — papers appear in this list.
                  </p>
                ) : selectedPaper ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedPaper.questionIds.length} questions · {selectedPaper.totalMarks} marks ·{' '}
                    {selectedPaper.topics.length} topic{selectedPaper.topics.length !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {availablePapers.length} paper{availablePapers.length !== 1 ? 's' : ''} available
                    {scopedPapers.length > 0
                      ? ` (${scopedPapers.length} match ${scopeLabel({ board, grade })} · ${subject})`
                      : scopedPapers.length === 0
                        ? ' — includes papers from other boards, grades, or subjects'
                        : ''}
                    .
                  </p>
                )}

                {selectedPaper && (
                  <div className="space-y-3">
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

                    {selectedQuestions.length > 0 && (
                      <div className="rounded-md border border-border bg-secondary/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{selectedQuestions.length}</span> question
                            {selectedQuestions.length !== 1 ? 's' : ''} ·{' '}
                            <span className="font-medium">{selectedTotalMarks}</span> marks
                            {paperCoverage === 'selected_topics' && selectedTopics.length > 0
                              ? ` · ${selectedTopics.join(', ')}`
                              : selectedPaper.topics.length > 0
                                ? ` · ${selectedPaper.topics.join(', ')}`
                                : ''}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowPaperPreview((v) => !v)}
                            className="text-xs text-accent hover:underline shrink-0"
                          >
                            {showPaperPreview ? 'Hide preview' : 'Preview questions'}
                          </button>
                        </div>
                        {showPaperPreview && (
                          <div className="mt-3">
                            <AssessmentPaperPreview
                              paperName={selectedPaper.name}
                              paperCoverage={paperCoverage}
                              selectedTopics={
                                paperCoverage === 'full' ? selectedPaper.topics : selectedTopics
                              }
                              questions={selectedQuestionEntries}
                              totalMarks={selectedTotalMarks}
                              className="!p-3 !bg-background"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h4 className="font-medium text-foreground">Students from {batchName}</h4>
                </div>
                <button
                  type="button"
                  onClick={selectAllBatchStudents}
                  disabled={batchStudents.length === 0}
                  className="text-xs text-accent hover:underline disabled:opacity-40"
                >
                  Select all in batch
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enrolled students from{' '}
                <span className="font-medium text-foreground">{batchName}</span> load automatically.
                Uncheck to exclude someone, or add extras below for this assessment only.
              </p>
              <div className="text-xs text-muted-foreground">
                {loadingBatchStudents ? (
                  <InlineLoader label="Loading students from batch…" size="xs" />
                ) : (
                  `${assignedStudents.length} invited · ${batchStudents.length} in batch${extraInvitees.length ? ` · ${extraInvitees.length} extra` : ''}`
                )}
              </div>
              {batchStudentsError && (
                <p className="text-xs text-rose">{batchStudentsError}</p>
              )}
              <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-md p-2">
                {loadingBatchStudents ? (
                  <p className="text-sm text-muted-foreground py-6 text-center px-3">
                    Fetching students enrolled in {batchName}…
                  </p>
                ) : batchStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center px-3">
                    {batchName
                      ? `No students enrolled in ${batchName} yet. Assign them in Curriculum Setup → Batches, or add extras below.`
                      : 'Select a batch in step 1 first.'}
                  </p>
                ) : (
                  batchStudents.map((student) => {
                    const selected = assignedStudents.includes(student.id)
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
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
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">Batch member</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {extraInvitees.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Also invited (not in batch)</p>
                  <div className="space-y-2 border border-border rounded-md p-2">
                    {extraInvitees.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-md text-left bg-accent/10 border border-accent/30"
                      >
                        <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">Extra for this assessment</p>
                        </div>
                        <span className="text-xs text-muted-foreground">Remove</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {extraCandidates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-foreground">
                    Add extra students ({scopeLabel({ board, grade })})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Optional — only for this assessment; does not change batch enrollment.
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                    {extraCandidates.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => addExtraStudent(student.id)}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-md text-left text-sm hover:bg-secondary/50"
                      >
                        <span>
                          <span className="font-medium text-foreground">{student.name}</span>
                          {student.batch ? (
                            <span className="text-xs text-muted-foreground ml-2">
                              (from {student.batch})
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-accent shrink-0">Add</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Exam duration (minutes, optional)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={durationMinutes || ''}
                    placeholder="Untimed"
                    onChange={(e) =>
                      setDurationMinutes(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Scheduled date (optional)</span>
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
                            <p className="font-medium text-foreground">{formatCenterLabel(center)}</p>
                            <p className="text-xs text-muted-foreground">
                              {center.studentCount} students
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
                    · {durationMinutes > 0 ? `${durationMinutes} min` : 'Untimed'} · {mode} mode
                  </li>
                  <li>
                    Schedule: {scheduledAt.trim() ? scheduledAt : 'Not set'}
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
    </AppModal>
  )
}