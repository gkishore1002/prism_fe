import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Eye, EyeOff, Loader2, PenLine, Plus, Sparkles, Trash2 } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard'
import type { QuestionBankEntry, QuestionPaper } from '@/types'
import {
  purgeLegacyManualPaperDrafts,
  type ManualPaperDraftQuestion,
} from '@/lib/manualPaperDraftStorage'
import { QuestionImagePicker } from '@/components/academic/QuestionImagePicker'
import { MathFieldInput } from '@/components/math/MathFieldInput'
import { MathHelpButton } from '@/components/math/MathHelpButton'
import { PrismMathKeyboard } from '@/components/math/PrismMathKeyboard'
import { isMathematicsSubject } from '@/lib/mathSubject'
import type { MathInsertTarget } from '@/lib/mathlive/mathTarget'
import { mapQuestionTopics } from '@/lib/api/syllabusBooksApi'
import * as questionsApi from '@/lib/api/questionsApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { boardsMatch, getCurriculumSubjects } from '@/lib/academicScope'
import { cn } from '@/lib/cn'
import { useScrollToError } from '@/hooks/useScrollToError'
import { RequiredMark } from '@/components/ui/RequiredMark'

type DraftQuestion = Omit<QuestionBankEntry, 'id' | 'status'>

const inputClass = 'ios-input'

function newClientId() {
  return `mq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function emptyQuestion(scope?: Partial<DraftQuestion>): ManualPaperDraftQuestion {
  return {
    clientId: newClientId(),
    board: scope?.board ?? '',
    grade: scope?.grade ?? '',
    subject: scope?.subject ?? '',
    chapter: scope?.chapter ?? '',
    topic: scope?.topic ?? '',
    difficulty: scope?.difficulty ?? 'medium',
    marks: scope?.marks ?? 2,
    questionType: scope?.questionType ?? 'mcq',
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
  }
}

/** Publish validation: chapter required (matches upload/BE); topic optional. */
function validateQuestion(q: ManualPaperDraftQuestion, index: number): string | null {
  if (!q.subject.trim()) {
    return `Question ${index + 1}: select a subject from curriculum setup.`
  }
  if (!q.chapter.trim()) {
    return `Question ${index + 1}: chapter is required to publish (topic is optional — use Update topics).`
  }
  if (!q.text.trim() && !q.textImageKey) {
    return `Question ${index + 1}: text or stem photo is required.`
  }
  if (q.questionType === 'mcq') {
    const hasA = Boolean(q.optionA?.trim() || q.optionAImageKey)
    const hasB = Boolean(q.optionB?.trim() || q.optionBImageKey)
    if (!hasA || !hasB) {
      return `Question ${index + 1}: MCQs need options A and B (text or photo).`
    }
    if (!q.correctAnswer?.trim()) {
      return `Question ${index + 1}: select the correct answer.`
    }
  }
  return null
}

function toManualInput(q: ManualPaperDraftQuestion): {
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  text: string
  difficulty: QuestionBankEntry['difficulty']
  marks: number
  questionType: QuestionBankEntry['questionType']
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  textImageKey?: string
  optionAImageKey?: string
  optionBImageKey?: string
  optionCImageKey?: string
  optionDImageKey?: string
} {
  const isMcq = q.questionType === 'mcq'
  return {
    board: q.board,
    grade: q.grade,
    subject: q.subject,
    chapter: q.chapter.trim(),
    topic: q.topic.trim(),
    text: q.text.trim() || (q.textImageKey ? '(image)' : ''),
    difficulty: q.difficulty,
    marks: Number.isFinite(q.marks) && q.marks > 0 ? q.marks : 1,
    questionType: q.questionType,
    optionA: isMcq ? q.optionA?.trim() || undefined : undefined,
    optionB: isMcq ? q.optionB?.trim() || undefined : undefined,
    optionC: isMcq ? q.optionC?.trim() || undefined : undefined,
    optionD: isMcq ? q.optionD?.trim() || undefined : undefined,
    correctAnswer: isMcq ? q.correctAnswer : undefined,
    textImageKey: q.textImageKey || undefined,
    optionAImageKey: isMcq ? q.optionAImageKey || undefined : undefined,
    optionBImageKey: isMcq ? q.optionBImageKey || undefined : undefined,
    optionCImageKey: isMcq ? q.optionCImageKey || undefined : undefined,
    optionDImageKey: isMcq ? q.optionDImageKey || undefined : undefined,
  }
}

function bankEntryToDraftQuestion(q: QuestionBankEntry): ManualPaperDraftQuestion {
  return {
    clientId: newClientId(),
    board: q.board,
    grade: q.grade,
    subject: q.subject,
    chapter: q.chapter,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    questionType: q.questionType === 'long' ? 'short' : q.questionType,
    text: q.text,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    textImageKey: q.textImageKey,
    optionAImageKey: q.optionAImageKey,
    optionBImageKey: q.optionBImageKey,
    optionCImageKey: q.optionCImageKey,
    optionDImageKey: q.optionDImageKey,
    textImageUrl: q.textImageUrl,
    optionAImageUrl: q.optionAImageUrl,
    optionBImageUrl: q.optionBImageUrl,
    optionCImageUrl: q.optionCImageUrl,
    optionDImageUrl: q.optionDImageUrl,
  }
}

function snapshotKey(
  paperName: string,
  paperBoard: string,
  paperGrade: string,
  questions: ManualPaperDraftQuestion[],
) {
  return JSON.stringify({
    paperName,
    paperBoard,
    paperGrade,
    questions: questions.map(({ clientId: _c, ...rest }) => rest),
  })
}

/** True when the user entered real work (not just default board/grade shell). */
function hasCreateWork(paperName: string, questions: ManualPaperDraftQuestion[]): boolean {
  if (paperName.trim()) return true
  if (questions.length > 1) return true
  return questions.some(
    (q) =>
      Boolean(q.subject.trim()) ||
      Boolean(q.chapter.trim()) ||
      Boolean(q.topic.trim()) ||
      Boolean(q.text.trim()) ||
      Boolean(q.textImageKey) ||
      Boolean(q.optionA?.trim()) ||
      Boolean(q.optionB?.trim()) ||
      Boolean(q.optionC?.trim()) ||
      Boolean(q.optionD?.trim()) ||
      Boolean(q.optionAImageKey) ||
      Boolean(q.optionBImageKey) ||
      Boolean(q.optionCImageKey) ||
      Boolean(q.optionDImageKey) ||
      q.difficulty !== 'medium' ||
      q.marks !== 2 ||
      q.questionType !== 'mcq' ||
      (q.correctAnswer != null && q.correctAnswer !== 'A'),
  )
}

interface QuestionBlockProps {
  index: number
  question: ManualPaperDraftQuestion
  subjects: string[]
  canRemove: boolean
  onChange: (patch: Partial<ManualPaperDraftQuestion>) => void
  onRemove: () => void
}

function QuestionBlock({
  index,
  question,
  subjects,
  canRemove,
  onChange,
  onRemove,
}: QuestionBlockProps) {
  const mathMode = isMathematicsSubject(question.subject)
  const activeMathTargetRef = useRef<MathInsertTarget | null>(null)

  function activateMathTarget(target: MathInsertTarget) {
    activeMathTargetRef.current = target
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display font-semibold text-foreground">Question {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AppDropdown
          label="Subject"
          value={question.subject}
          onChange={(v) => onChange({ subject: v })}
          options={subjects.map((s) => ({ value: s, label: s }))}
          placeholder={subjects.length ? 'Select subject' : 'No subjects in curriculum'}
          emptyMessage="Add subjects under Curriculum setup for this board and grade"
        />
        <AppDropdown
          label="Difficulty"
          value={question.difficulty}
          onChange={(v) => onChange({ difficulty: v as DraftQuestion['difficulty'] })}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
        />
        <label className="block">
          <span className="text-xs text-muted-foreground">Marks</span>
          <input
            type="number"
            min={1}
            value={question.marks}
            onChange={(e) => onChange({ marks: Number(e.target.value) })}
            className={inputClass}
          />
        </label>
        <AppDropdown
          label="Type"
          value={question.questionType}
          onChange={(v) => onChange({ questionType: v as DraftQuestion['questionType'] })}
          options={[
            { value: 'mcq', label: 'MCQ' },
            { value: 'short', label: 'Short' },
          ]}
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            Question text{' '}
            {question.textImageKey ? '(optional with photo)' : <RequiredMark />}
          </span>
          {mathMode ? <MathHelpButton align="start" /> : null}
        </div>
        {mathMode ? (
          <div className="mt-1 space-y-2">
            <MathFieldInput
              value={question.text}
              onChange={(text) => onChange({ text })}
              placeholder="Formula box — type here, then tap keys below for √, x², fractions, and more."
              aria-label={`Question ${index + 1} math editor`}
              onActivate={activateMathTarget}
            />
            <PrismMathKeyboard getTarget={() => activeMathTargetRef.current} />
          </div>
        ) : (
          <textarea
            value={question.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            className={inputClass}
            placeholder="Enter the question, or upload a photo of the formula…"
          />
        )}
      </div>

      <QuestionImagePicker
        label="Stem photo (formulas / diagrams)"
        imageKey={question.textImageKey}
        imageUrl={question.textImageUrl}
        onUploaded={(key, url) => onChange({ textImageKey: key, textImageUrl: url })}
        onCleared={() => onChange({ textImageKey: undefined, textImageUrl: undefined })}
      />

      {question.questionType === 'mcq' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              ['optionA', 'optionAImageKey', 'optionAImageUrl', 'A'],
              ['optionB', 'optionBImageKey', 'optionBImageUrl', 'B'],
              ['optionC', 'optionCImageKey', 'optionCImageUrl', 'C'],
              ['optionD', 'optionDImageKey', 'optionDImageUrl', 'D'],
            ] as const
          ).map(([textKey, imageKey, imageUrl, letter]) => (
            <div key={textKey} className="space-y-2">
              <div className="block">
                <span className="text-xs text-muted-foreground">Option {letter}</span>
                {mathMode ? (
                  <div className="mt-1">
                    <MathFieldInput
                      value={question[textKey] ?? ''}
                      onChange={(next) => onChange({ [textKey]: next })}
                      placeholder="Expression or leave blank if using photo"
                      compact
                      aria-label={`Question ${index + 1} option ${letter}`}
                      onActivate={activateMathTarget}
                    />
                  </div>
                ) : (
                  <input
                    value={question[textKey] ?? ''}
                    onChange={(e) => onChange({ [textKey]: e.target.value })}
                    className={inputClass}
                    placeholder="Text or leave blank if using photo"
                  />
                )}
              </div>
              <QuestionImagePicker
                label={`Option ${letter} photo`}
                imageKey={question[imageKey]}
                imageUrl={question[imageUrl]}
                onUploaded={(key, url) => onChange({ [imageKey]: key, [imageUrl]: url })}
                onCleared={() => onChange({ [imageKey]: undefined, [imageUrl]: undefined })}
              />
            </div>
          ))}
          <AppDropdown
            label="Correct answer"
            value={question.correctAnswer ?? 'A'}
            onChange={(v) => onChange({ correctAnswer: v })}
            options={[
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
              { value: 'D', label: 'D' },
            ]}
          />
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border/80 bg-background/50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Chapter (optional now)</span>
          <input
            value={question.chapter}
            onChange={(e) => onChange({ chapter: e.target.value })}
            className={inputClass}
            placeholder="Fill after writing questions, or before publish"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Topic (optional)</span>
          <input
            value={question.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            className={cn(inputClass, !question.topic.trim() && 'border-amber-500/40')}
            placeholder="Leave blank and use Update topics"
          />
        </label>
      </div>
    </div>
  )
}

function ManualPreviewTable({
  questions,
  mappedIds,
  onTopicChange,
}: {
  questions: ManualPaperDraftQuestion[]
  mappedIds: string[]
  onTopicChange: (clientId: string, topic: string) => void
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-border">
        <h3 className="font-display text-base text-foreground">Preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review stem, academic path, and topics before Save as draft or Publish. Edit topics inline if needed.
        </p>
      </div>
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-[1]">
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 font-semibold">#</th>
              <th className="px-4 py-2.5 font-semibold">Question</th>
              <th className="px-4 py-2.5 font-semibold">Subject / chapter</th>
              <th className="px-4 py-2.5 font-semibold">Topic</th>
              <th className="px-4 py-2.5 font-semibold">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {questions.map((q, index) => {
              const wasMapped = mappedIds.includes(q.clientId)
              return (
                <tr
                  key={q.clientId}
                  className={cn(wasMapped && 'bg-accent/[0.04]')}
                >
                  <td className="px-4 py-2.5 font-mono-data text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-2.5 max-w-sm">
                    <div className="space-y-2">
                      <p className="line-clamp-2 text-foreground">
                        {q.text || (q.textImageUrl || q.textImageKey ? 'Image question' : '—')}
                      </p>
                      {(q.textImageUrl || q.textImageKey) && q.textImageUrl ? (
                        <img
                          src={q.textImageUrl}
                          alt=""
                          className="h-14 w-auto max-w-[7rem] rounded-md border border-border object-contain bg-secondary/40"
                        />
                      ) : null}
                      {q.questionType === 'mcq' && (
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          {(
                            [
                              ['A', q.optionA],
                              ['B', q.optionB],
                              ['C', q.optionC],
                              ['D', q.optionD],
                            ] as const
                          )
                            .filter(([, t]) => t?.trim())
                            .map(([letter, text]) => (
                              <span
                                key={letter}
                                className={cn(
                                  'rounded border border-border px-1.5 py-0.5',
                                  q.correctAnswer === letter && 'border-leaf text-leaf',
                                )}
                              >
                                {letter}. {text}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <p className="text-foreground">{q.subject || '—'}</p>
                    <p className="text-xs mt-0.5">{q.chapter || 'No chapter yet'}</p>
                  </td>
                  <td className="px-4 py-2.5 min-w-[10rem]">
                    <input
                      value={q.topic}
                      onChange={(e) => onTopicChange(q.clientId, e.target.value)}
                      className={cn(
                        'h-9 w-full border rounded-md px-2.5 text-sm bg-background',
                        !q.topic.trim() ? 'border-amber-500/50' : 'border-border',
                      )}
                      placeholder="Topic"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {q.difficulty} · {q.marks} mk · {q.questionType}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export interface ManualQuestionEntryHandle {
  requestLeave: () => Promise<boolean>
  isDirty: boolean
}

export interface ManualQuestionEntryProps {
  initialPaperId?: string
  onPublished?: (paper: QuestionPaper) => void
  /** Called after Save as draft — parent should show Drafts list. */
  onDraftSaved?: (paper: QuestionPaper) => void
  onDirtyChange?: (dirty: boolean) => void
}

export const ManualQuestionEntry = forwardRef<ManualQuestionEntryHandle, ManualQuestionEntryProps>(
  function ManualQuestionEntry({ initialPaperId, onPublished, onDraftSaved, onDirtyChange }, ref) {
    const { curriculum, ensureLoaded } = useCurriculum()
    const {
      addPaperFromManualQuestions,
      publishPaper,
      removePaper,
      getPaper,
      getQuestionsByIds,
      ensureLoaded: ensurePapersLoaded,
      refresh,
    } = useQuestionPapers()

    useEffect(() => {
      void ensureLoaded()
    }, [ensureLoaded])

    useEffect(() => {
      void ensurePapersLoaded()
    }, [ensurePapersLoaded])

    const boards = useMemo(() => curriculum.map((b) => b.board), [curriculum])

    const [paperName, setPaperName] = useState('')
    const [paperBoard, setPaperBoard] = useState('')
    const [paperGrade, setPaperGrade] = useState('')
    const [questions, setQuestions] = useState<ManualPaperDraftQuestion[]>(() => [emptyQuestion()])
    const [draftId, setDraftId] = useState<string | null>(null)
    const [cleanSnapshot, setCleanSnapshot] = useState(() =>
      snapshotKey('', '', '', [emptyQuestion()]),
    )
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [mappingTopics, setMappingTopics] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [mappedIds, setMappedIds] = useState<string[]>([])
    const [message, setMessage] = useState<string | null>(null)
    const messageRef = useScrollToError<HTMLParagraphElement>(message)
    const hydratedRef = useRef<string | null>(null)
    const skipNextTabLeaveRef = useRef(false)

    const subjects = getCurriculumSubjects(curriculum, paperBoard, paperGrade)
    const boardData = curriculum.find((b) => boardsMatch(b.board, paperBoard))
    const gradeOptions = (boardData?.grades ?? []).map((g) => ({
      value: g.grade,
      label: g.grade,
    }))

    const hasWork = Boolean(draftId) || hasCreateWork(paperName, questions)
    const isDirty =
      hasWork && snapshotKey(paperName, paperBoard, paperGrade, questions) !== cleanSnapshot

    const blankTopicQuestions = useMemo(
      () => questions.filter((q) => !q.topic.trim() && (q.text.trim() || q.textImageKey)),
      [questions],
    )
    const blankTopicWithChapter = useMemo(
      () => blankTopicQuestions.filter((q) => q.chapter.trim()),
      [blankTopicQuestions],
    )

    useEffect(() => {
      onDirtyChange?.(isDirty)
    }, [isDirty, onDirtyChange])

    const markFormClean = useCallback(
      (name: string, board: string, grade: string, qs: ManualPaperDraftQuestion[]) => {
        setCleanSnapshot(snapshotKey(name, board, grade, qs))
      },
      [],
    )

    const resetForm = useCallback(() => {
      const board = boards[0] ?? ''
      const grade =
        curriculum.find((b) => boardsMatch(b.board, board))?.grades[0]?.grade ?? ''
      const next = [emptyQuestion({ board, grade, subject: '' })]
      setPaperName('')
      setPaperBoard(board)
      setPaperGrade(grade)
      setQuestions(next)
      setDraftId(null)
      setDraftSavedAt(null)
      setShowPreview(false)
      setMappedIds([])
      setMessage(null)
      hydratedRef.current = null
      markFormClean('', board, grade, next)
    }, [boards, curriculum, markFormClean])

    const applyPaperScope = useCallback(
      (board: string, grade: string) => {
        const scopedSubjects = getCurriculumSubjects(curriculum, board, grade)
        setPaperBoard(board)
        setPaperGrade(grade)
        setQuestions((prev) =>
          prev.map((q) => ({
            ...q,
            board,
            grade,
            // Keep subject only if it still exists for this board/grade; otherwise ask user to select.
            subject: scopedSubjects.some((s) => s === q.subject) ? q.subject : '',
          })),
        )
      },
      [curriculum],
    )

    // Seed board/grade from curriculum once it loads — leave subject for the user to select.
    useEffect(() => {
      if (hydratedRef.current || curriculum.length === 0) return
      if (paperBoard && paperGrade) return
      const board = curriculum[0].board
      const grade = curriculum[0].grades[0]?.grade ?? ''
      setPaperBoard(board)
      setPaperGrade(grade)
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          board: q.board || board,
          grade: q.grade || grade,
        })),
      )
    }, [curriculum, paperBoard, paperGrade])

    // Resume from server draft — fetch fresh paper + questions so Continue always hydrates.
    useEffect(() => {
      let cancelled = false
      async function hydrate() {
        if (!initialPaperId) {
          hydratedRef.current = null
          return
        }
        if (hydratedRef.current === initialPaperId) return

        try {
          await ensurePapersLoaded()
          if (cancelled) return

          let paper = getPaper(initialPaperId)
          let bankQs = paper ? getQuestionsByIds(paper.questionIds) : []

          // Always re-fetch when bank is missing rows — context can be stale after draft save.
          if (!paper || (paper.questionIds.length > 0 && bankQs.length !== paper.questionIds.length)) {
            const [qs, papers] = await Promise.all([
              questionsApi.fetchQuestions(),
              questionsApi.fetchQuestionPapers({ status: 'all' }),
            ])
            if (cancelled) return
            await refresh()
            if (cancelled) return
            paper = papers.find((p) => p.id === initialPaperId) ?? getPaper(initialPaperId)
            if (paper) {
              const byId = new Map(qs.map((q) => [q.id, q]))
              bankQs = paper.questionIds
                .map((id) => byId.get(id))
                .filter((q): q is QuestionBankEntry => Boolean(q))
            }
          }

          if (!paper) {
            setMessage('Could not load that draft paper.')
            return
          }

          const draftQs =
            bankQs.length > 0
              ? bankQs.map(bankEntryToDraftQuestion)
              : [
                  emptyQuestion({
                    board: paper.board || '',
                    grade: paper.grade || '',
                    subject: '',
                  }),
                ]
          const board = draftQs[0]?.board || paper.board || ''
          const grade = draftQs[0]?.grade || paper.grade || ''
          if (cancelled) return
          setPaperName(paper.name)
          setPaperBoard(board)
          setPaperGrade(grade)
          setQuestions(draftQs.map((q) => ({ ...q, board, grade })))
          setDraftId(paper.id)
          markFormClean(paper.name, board, grade, draftQs)
          setDraftSavedAt(paper.createdAt || new Date().toISOString())
          setMessage(
            bankQs.length > 0
              ? `Resumed draft "${paper.name}" (${bankQs.length} question${bankQs.length === 1 ? '' : 's'}).`
              : `Resumed draft "${paper.name}". Add questions, then Draft or Publish.`,
          )
          hydratedRef.current = initialPaperId
        } catch {
          if (!cancelled) setMessage('Could not load that draft paper.')
        }
      }
      void hydrate()
      return () => {
        cancelled = true
      }
    }, [initialPaperId, ensurePapersLoaded, getPaper, getQuestionsByIds, markFormClean, refresh])

    // Drop any leftover browser-local draft caches once.
    useEffect(() => {
      purgeLegacyManualPaperDrafts()
    }, [])

    // Clear subject if it is no longer valid for the selected board/grade.
    useEffect(() => {
      // Don't wipe subjects while curriculum scope is still empty (loading / unmatched).
      if (subjects.length === 0) return
      setQuestions((prev) => {
        let changed = false
        const next = prev.map((q) => {
          if (!q.subject || subjects.includes(q.subject)) return q
          changed = true
          return { ...q, subject: '' }
        })
        return changed ? next : prev
      })
    }, [subjects])

    const updateQuestion = useCallback((clientId: string, patch: Partial<ManualPaperDraftQuestion>) => {
      setQuestions((prev) => prev.map((q) => (q.clientId === clientId ? { ...q, ...patch } : q)))
    }, [])

    const addQuestion = useCallback(() => {
      setQuestions((prev) => {
        const last = prev[prev.length - 1]
        const subject =
          last?.subject && subjects.includes(last.subject) ? last.subject : ''
        return [
          ...prev,
          emptyQuestion({
            board: paperBoard,
            grade: paperGrade,
            subject,
            chapter: last?.chapter,
            difficulty: last?.difficulty,
            marks: last?.marks,
            questionType: last?.questionType,
          }),
        ]
      })
      setMessage(null)
    }, [paperBoard, paperGrade, subjects])

    const removeQuestion = useCallback((clientId: string) => {
      setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.clientId !== clientId)))
    }, [])

    const handleUpdateTopics = useCallback(async () => {
      if (mappingTopics || busy) return
      if (!isApiEnabled()) {
        setMessage('Connect to the Prism API to map topics from syllabus books.')
        return
      }
      if (blankTopicWithChapter.length === 0) {
        setMessage(
          blankTopicQuestions.length > 0
            ? 'Add a chapter on questions missing a topic, then try Update topics again.'
            : 'All questions already have a topic.',
        )
        return
      }
      setMappingTopics(true)
      setMessage(null)
      try {
        const indexByClient = new Map(questions.map((q, i) => [q.clientId, i]))
        const payload = blankTopicWithChapter.map((q) => ({
          row: (indexByClient.get(q.clientId) ?? 0) + 1,
          board: paperBoard,
          grade: paperGrade,
          subject: q.subject,
          chapter: q.chapter,
          text: q.text,
          topic: q.topic,
        }))
        const { mappings } = await mapQuestionTopics(payload)
        const byRow = new Map(mappings.map((m) => [m.row, m]))
        const newlyMapped: string[] = []
        setQuestions((prev) =>
          prev.map((q, i) => {
            const mapped = byRow.get(i + 1)
            if (!mapped?.topic?.trim()) return q
            newlyMapped.push(q.clientId)
            return {
              ...q,
              topic: mapped.topic.trim(),
              chapter: mapped.chapter?.trim() ? mapped.chapter.trim() : q.chapter,
            }
          }),
        )
        setMappedIds(newlyMapped)
        setShowPreview(true)
        setMessage(
          newlyMapped.length > 0
            ? `Mapped topics onto ${newlyMapped.length} question${newlyMapped.length === 1 ? '' : 's'} from syllabus books. Review in Preview.`
            : 'No topics were mapped. Upload an analyzed syllabus book for this board / grade / subject, then try again.',
        )
      } catch (err) {
        setMessage(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Topic mapping failed',
        )
      } finally {
        setMappingTopics(false)
      }
    }, [
      blankTopicQuestions.length,
      blankTopicWithChapter,
      busy,
      mappingTopics,
      paperBoard,
      paperGrade,
      questions,
    ])

    const saveDraft = useCallback(async () => {
      if (!paperName.trim()) {
        setMessage('Enter a question paper name before saving a draft.')
        throw new Error('Paper name required')
      }
      setBusy(true)
      setMessage(null)
      try {
        const scoped = questions.map((q) => ({ ...q, board: paperBoard, grade: paperGrade }))
        const payload = scoped.map((q) => toManualInput(q))
        const paper = await addPaperFromManualQuestions(paperName.trim(), payload, {
          status: 'draft',
          paperId: draftId ?? undefined,
        })
        skipNextTabLeaveRef.current = true
        resetForm()
        setMessage(
          `Draft saved (${questions.length} question${questions.length === 1 ? '' : 's'}). Form cleared — use Continue in Drafts to edit again.`,
        )
        onDraftSaved?.(paper)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to save draft')
        throw err
      } finally {
        setBusy(false)
      }
    }, [
      addPaperFromManualQuestions,
      draftId,
      onDraftSaved,
      paperBoard,
      paperGrade,
      paperName,
      questions,
      resetForm,
    ])

    const publishNow = useCallback(async () => {
      if (!paperName.trim()) {
        setMessage('Enter a question paper name before publishing.')
        throw new Error('Paper name required')
      }
      const scoped = questions.map((q) => ({ ...q, board: paperBoard, grade: paperGrade }))
      for (let i = 0; i < scoped.length; i++) {
        const err = validateQuestion(scoped[i], i)
        if (err) {
          setMessage(err)
          setShowPreview(true)
          throw new Error(err)
        }
      }

      setBusy(true)
      setMessage(null)
      const savedName = paperName.trim()
      const payload = scoped.map((q) => toManualInput(q))
      try {
        let paper: QuestionPaper
        if (draftId) {
          await addPaperFromManualQuestions(savedName, payload, {
            status: 'draft',
            paperId: draftId,
          })
          paper = await publishPaper(draftId)
        } else {
          paper = await addPaperFromManualQuestions(savedName, payload, { status: 'published' })
        }
        skipNextTabLeaveRef.current = true
        resetForm()
        onPublished?.(paper)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to publish paper')
        throw err
      } finally {
        setBusy(false)
      }
    }, [
      addPaperFromManualQuestions,
      draftId,
      onPublished,
      paperBoard,
      paperGrade,
      paperName,
      publishPaper,
      questions,
      resetForm,
    ])

    const cancelNow = useCallback(async () => {
      setBusy(true)
      setMessage(null)
      try {
        if (draftId) {
          await removePaper(draftId)
        }
        skipNextTabLeaveRef.current = true
        resetForm()
        setMessage('Form reset.')
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to discard draft')
        throw err
      } finally {
        setBusy(false)
      }
    }, [draftId, removePaper, resetForm])

    const { requestLeave, confirmDraft, confirmPublish, confirmCancel, markClean } =
      useUnsavedWorkGuard({
        isDirty,
        onDraft: saveDraft,
        onPublish: publishNow,
        onCancel: cancelNow,
        modalOptions: {
          title: 'Unsaved question paper',
          message: 'Save a draft, publish, or discard before leaving this page.',
          cancelLabel: 'Discard & leave',
        },
      })

    useImperativeHandle(
      ref,
      () => ({
        isDirty,
        requestLeave: async () => {
          if (skipNextTabLeaveRef.current) {
            skipNextTabLeaveRef.current = false
            markClean()
            return true
          }
          return requestLeave()
        },
      }),
      [isDirty, markClean, requestLeave],
    )

    const canCancel = isDirty || Boolean(draftId)
    const canSaveActions = hasCreateWork(paperName, questions) || Boolean(draftId)
    const canUpdateTopics = blankTopicWithChapter.length > 0 && !busy && !mappingTopics

    return (
      <div className="space-y-4">
        <AppCard>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                <PenLine className="w-5 h-5 text-accent" />
                Build question paper
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Set board and grade once for the paper. Add questions, then fill chapter/topic or use
                Update topics. Preview before you Save as draft or Publish.
              </p>
            </div>
            {draftId && draftSavedAt && (
              <p className="text-xs text-muted-foreground shrink-0">
                Draft · {new Date(draftSavedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <label className="block md:col-span-1">
              <span className="text-xs text-muted-foreground">
                Question paper name <RequiredMark />
              </span>
              <input
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                placeholder="e.g. Algebra Unit Test — Batch A"
                className={inputClass}
                required
              />
            </label>
            <AppDropdown
              label="Board (all questions)"
              value={paperBoard}
              onChange={(v) => {
                const nextGrade =
                  curriculum.find((b) => boardsMatch(b.board, v))?.grades[0]?.grade ?? ''
                applyPaperScope(v, nextGrade)
              }}
              options={boards.map((b) => ({ value: b, label: b }))}
              placeholder="Board"
            />
            <AppDropdown
              label="Grade (all questions)"
              value={paperGrade}
              onChange={(v) => applyPaperScope(paperBoard, v)}
              options={gradeOptions}
              placeholder={paperBoard ? 'Grade' : 'Select board first'}
              emptyMessage="Select a board to see grades"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-2 rounded-md text-sm hover:bg-secondary"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Edit questions' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => void handleUpdateTopics()}
              disabled={!canUpdateTopics}
              className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0 disabled:opacity-40 border-accent/40 bg-accent/10 hover:bg-accent/15"
              title={
                blankTopicQuestions.length === 0
                  ? 'All questions already have a topic'
                  : blankTopicWithChapter.length === 0
                    ? 'Add chapters on questions missing topics first'
                    : 'Map blank topics from analyzed syllabus books'
              }
            >
              {mappingTopics ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              )}
              {mappingTopics ? 'Updating topics…' : 'Update topics'}
            </button>
            <span className="text-xs text-muted-foreground">
              {questions.length} question{questions.length === 1 ? '' : 's'}
              {blankTopicQuestions.length > 0
                ? ` · ${blankTopicQuestions.length} missing topic`
                : ''}
            </span>
          </div>

          {showPreview ? (
            <ManualPreviewTable
              questions={questions}
              mappedIds={mappedIds}
              onTopicChange={(clientId, topic) => updateQuestion(clientId, { topic })}
            />
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <QuestionBlock
                  key={q.clientId}
                  index={index}
                  question={q}
                  subjects={subjects}
                  canRemove={questions.length > 1}
                  onChange={(patch) => updateQuestion(q.clientId, patch)}
                  onRemove={() => removeQuestion(q.clientId)}
                />
              ))}
            </div>
          )}

          {!showPreview && (
            <button
              type="button"
              onClick={addQuestion}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-dashed border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add question
            </button>
          )}
        </AppCard>

        <AppCard>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-2 rounded-md text-sm hover:bg-secondary"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Back to edit' : 'Preview'}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy || mappingTopics || !canSaveActions}
                onClick={() => void confirmDraft()}
                className="border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-40"
              >
                Save as draft
              </button>
              <button
                type="button"
                disabled={busy || mappingTopics}
                onClick={() => void handleUpdateTopics()}
                className="btn btn-secondary inline-flex items-center gap-1.5 disabled:opacity-40 border-accent/40 bg-accent/10"
              >
                {mappingTopics ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                )}
                Update topics
              </button>
              <button
                type="button"
                disabled={busy || mappingTopics || !canSaveActions}
                onClick={() => void confirmPublish()}
                className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-40"
              >
                {busy ? 'Working…' : 'Publish'}
              </button>
              <button
                type="button"
                disabled={busy || !canCancel}
                onClick={() => void confirmCancel()}
                className="border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
          {message ? (
            <p
              ref={messageRef}
              tabIndex={-1}
              className={
                message.startsWith('Published') ||
                message.startsWith('Draft') ||
                message.startsWith('Form') ||
                message.startsWith('Resumed') ||
                message.startsWith('Mapped')
                  ? 'mt-3 text-sm text-leaf outline-none'
                  : 'mt-3 text-sm text-rose font-medium outline-none'
              }
              role="alert"
            >
              {message}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground mt-3">
            Chapter is required to publish; topic is optional — use Update topics from syllabus books.
            Draft soft-saves to the server. Cancel resets and deletes any open draft.
            Use Save as draft to continue later from Drafts.
          </p>
        </AppCard>
      </div>
    )
  },
)
