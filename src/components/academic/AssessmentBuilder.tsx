import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, CheckSquare, Square, Users, Search, Shuffle } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
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
    getPapersForScope,
    getPaper,
    questions,
    loading: papersLoading,
    ensureLoaded,
  } = useQuestionPapers()
  const { curriculum, students, getBatchesForScope, ensureLoaded: ensureCurriculumLoaded } =
    useCurriculum()
  const { centers: institutionCenters, activeCenterId, isAllBranches } = useCenters({ enabled: open })
  const branchCenterId = isAllBranches ? undefined : activeCenterId
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [board, setBoard] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'practice' | 'assessment' | ''>('')
  const [batchName, setBatchName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [scheduledAt, setScheduledAt] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
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
  const [showPaperPreview, setShowPaperPreview] = useState(false)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)

  function resetForm() {
    setStep(1)
    setTitle('')
    setBoard('')
    setGrade('')
    setSubject('')
    setMode('')
    setBatchName('')
    setDurationMinutes(0)
    setScheduledAt('')
    setAvailableUntil('')
    setSelectedPaperId(null)
    setPaperCoverage('full')
    setSelectedTopics([])
    setSelectedCenters([])
    setAllCenters(true)
    setAssignedStudents([])
    setBatchStudents([])
    setLoadingBatchStudents(false)
    setBatchStudentsError(null)
    setPublishError(null)
    setPublishing(false)
    setTopicSearch('')
    setShowPaperPreview(false)
    setShuffleQuestions(false)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    void ensureCurriculumLoaded()
    void ensureLoaded()
    // Only re-run when the modal opens — not when loader callbacks change identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const boardData = useMemo(
    () => curriculum.find((b) => boardsMatch(b.board, board)),
    [curriculum, board],
  )
  const gradeData = useMemo(
    () => boardData?.grades.find((g) => gradesMatch(g.grade, grade)),
    [boardData, grade],
  )
  const scopedBatches = getBatchesForScope(board, grade)
  const scopeReady = Boolean(board && grade && subject)
  const availablePapers = scopeReady ? getPapersForScope(board, grade, subject) : []
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
        return {
          value: paper.id,
          label: paper.name,
          description: `${paper.questionIds.length} questions · ${paper.totalMarks} marks${counts.length ? ` · ${counts.map((c) => c.topic).join(', ')}` : ''}`,
        }
      }),
    [availablePapers, questions],
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
    setSelectedPaperId(null)
    setPaperCoverage('full')
    setSelectedTopics([])
    setTopicSearch('')
    setShowPaperPreview(false)
  }, [board, grade, subject])

  // Clear batch if it no longer belongs to the selected board+grade
  useEffect(() => {
    if (!batchName) return
    if (scopedBatches.length === 0 || !scopedBatches.some((b) => b.name === batchName)) {
      setBatchName('')
    }
  }, [scopedBatches, batchName])

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

    void fetchStudentsForBatch(selectedBatch.id, branchCenterId)
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
  }, [open, selectedBatch?.id, branchCenterId])

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
    setGrade('')
    setSubject('')
    setBatchName('')
  }

  function onGradeChange(next: string) {
    const data = boardData?.grades.find((g) => gradesMatch(g.grade, next))
    if (!data) return
    setGrade(data.grade)
    setSubject('')
    setBatchName('')
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
    if (!board.trim() || !grade.trim() || !subject.trim()) {
      setPublishError('Select board, grade, and subject before scheduling.')
      return
    }
    if (!batchName.trim()) {
      setPublishError('Select a batch before scheduling.')
      return
    }
    if (mode !== 'practice' && mode !== 'assessment') {
      setPublishError('Select a mode before scheduling.')
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
        availableUntil: (availableUntil || scheduledAt).trim(),
        status: 'scheduled',
        centerIds: allCenters ? institutionCenters.map((c) => c.id) : selectedCenters,
        selectedQuestionIds: selectedQuestions,
        assignedStudentIds: assignedStudents,
        createdByTutorId: user.id,
        questionPaperId: selectedPaperId ?? undefined,
        paperCoverage,
        selectedTopics: paperCoverage === 'selected_topics' ? selectedTopics : selectedPaper?.topics,
        shuffleQuestions,
        topic:
          paperCoverage === 'selected_topics' && selectedTopics.length === 1
            ? selectedTopics[0]
            : undefined,
      })
      onClose()
      resetForm()
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
                (!board ||
                  !grade ||
                  !subject ||
                  !batchName ||
                  !mode ||
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
                {board && grade ? (
                  <>
                    Scoped to{' '}
                    <span className="font-medium text-foreground">{scopeLabel({ board, grade })}</span>
                    {' '}— students only see exams matching their board and grade.
                  </>
                ) : (
                  <>Select board and grade — students only see exams matching their board and grade.</>
                )}
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
                  <AppDropdown
                    label="Board"
                    value={board || null}
                    onChange={onBoardChange}
                    options={boardOptions}
                    placeholder="Select board"
                  />
                  <AppDropdown
                    label="Grade"
                    value={grade || null}
                    onChange={onGradeChange}
                    options={gradeOptions}
                    placeholder={board ? 'Select grade' : 'Select board first'}
                    emptyMessage="Select a board to see grades"
                  />
                  <AppDropdown
                    label="Subject"
                    value={subject || null}
                    onChange={onSubjectChange}
                    options={subjectOptions}
                    placeholder={grade ? 'Select subject' : 'Select grade first'}
                    emptyMessage="Select a grade to see subjects"
                  />
                  <AppDropdown
                    label="Batch"
                    value={batchName || null}
                    onChange={setBatchName}
                    options={batchOptions}
                    placeholder={
                      !board || !grade
                        ? 'Select board and grade first'
                        : scopedBatches.length === 0
                          ? 'No batches — create in Curriculum Setup'
                          : 'Select batch'
                    }
                    emptyMessage="No batches for this board and grade — add one in Curriculum Setup"
                  />
                  <AppDropdown
                    label="Mode"
                    value={mode || null}
                    onChange={(v) => setMode(v as typeof mode)}
                    options={modeOptions}
                    placeholder="Select mode"
                  />
                </div>
                {board && grade && scopedBatches.length === 0 && (
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
                <AppDropdown
                  label="Question paper *"
                  value={selectedPaperId}
                  onChange={selectPaper}
                  options={paperOptions}
                  searchable
                  searchPlaceholder="Search papers by name or topic…"
                  placeholder={
                    papersLoading
                      ? 'Loading question papers…'
                      : !scopeReady
                        ? 'Select board, grade, and subject first'
                        : 'Select question paper'
                  }
                  disabled={papersLoading || !scopeReady}
                  emptyMessage={
                    !scopeReady
                      ? 'Select board, grade, and subject to see matching papers'
                      : `No question papers for ${scopeLabel({ board, grade })} · ${subject}`
                  }
                  searchEmptyMessage="No papers match your search"
                />
                {papersLoading ? (
                  <InlineLoader label="Loading question papers…" size="xs" className="mt-1" />
                ) : !scopeReady ? (
                  <p className="text-xs text-muted-foreground">
                    Choose board, grade, and subject — only papers for that subject are listed.
                  </p>
                ) : paperOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No papers for {scopeLabel({ board, grade })} · {subject}. Publish one in{' '}
                    <Link to={questionBankPath} className="text-accent hover:underline">
                      Question Bank
                    </Link>{' '}
                    for this subject, then return here.
                  </p>
                ) : selectedPaper ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedPaper.questionIds.length} questions · {selectedPaper.totalMarks} marks ·{' '}
                    {selectedPaper.topics.length} topic{selectedPaper.topics.length !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {availablePapers.length} paper{availablePapers.length !== 1 ? 's' : ''} for{' '}
                    {scopeLabel({ board, grade })} · {subject}.
                  </p>
                )}

                {selectedPaper && (
                  <div className="space-y-3">
                    <AppDropdown
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
                    onChange={(e) => {
                      setScheduledAt(e.target.value)
                      if (!availableUntil) setAvailableUntil(e.target.value)
                    }}
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </label>
                {mode === 'assessment' && (
                  <label className="block">
                    <span className="text-xs text-muted-foreground">
                      Available until (last day to attend)
                    </span>
                    <input
                      type="date"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    />
                  </label>
                )}
              </div>

              <label className="flex items-start gap-3 p-4 rounded-md border border-border cursor-pointer hover:bg-secondary/40">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="mt-1 rounded"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Shuffle className="w-4 h-4 text-accent" />
                    Shuffle questions and options
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Each student sees a different question and option order. The uploaded paper stays
                    the same.
                  </span>
                </span>
              </label>

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
                    {shuffleQuestions ? ' · Questions shuffled per student' : ''}
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