import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, PenLine, Trash2, Save, FileStack, RotateCcw } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import type { QuestionBankEntry } from '@/types'
import {
  clearManualPaperDraft,
  persistManualPaperDraft,
  readManualPaperDraft,
  type ManualPaperDraftQuestion,
} from '@/lib/manualPaperDraftStorage'
import { QuestionImagePicker } from '@/components/academic/QuestionImagePicker'

type DraftQuestion = Omit<QuestionBankEntry, 'id' | 'status'>

const inputClass = 'ios-input'

function newClientId() {
  return `mq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function emptyQuestion(scope?: Partial<DraftQuestion>): ManualPaperDraftQuestion {
  return {
    clientId: newClientId(),
    board: scope?.board ?? 'CBSE',
    grade: scope?.grade ?? 'Grade 8',
    subject: scope?.subject ?? 'Mathematics',
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

function validateQuestion(q: ManualPaperDraftQuestion, index: number): string | null {
  if (!q.chapter.trim() || !q.topic.trim()) {
    return `Question ${index + 1}: chapter and topic are required.`
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

interface QuestionBlockProps {
  index: number
  question: ManualPaperDraftQuestion
  boards: string[]
  curriculum: ReturnType<typeof useCurriculum>['curriculum']
  canRemove: boolean
  onChange: (patch: Partial<ManualPaperDraftQuestion>) => void
  onRemove: () => void
}

function QuestionBlock({
  index,
  question,
  boards,
  curriculum,
  canRemove,
  onChange,
  onRemove,
}: QuestionBlockProps) {
  const boardData = curriculum.find((b) => b.board === question.board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === question.grade) ?? boardData?.grades[0]
  const subjects = gradeData?.subjects.map((s) => s.name) ?? ['Mathematics']

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppDropdown
          label="Board"
          value={question.board}
          onChange={(v) => onChange({ board: v })}
          options={boards.map((b) => ({ value: b, label: b }))}
          placeholder="Board"
        />
        <AppDropdown
          label="Grade"
          value={question.grade}
          onChange={(v) => onChange({ grade: v })}
          options={(boardData?.grades ?? []).map((g) => ({ value: g.grade, label: g.grade }))}
          placeholder="Grade"
        />
        <AppDropdown
          label="Subject"
          value={question.subject}
          onChange={(v) => onChange({ subject: v })}
          options={subjects.map((s) => ({ value: s, label: s }))}
          placeholder="Subject"
        />
        <label className="block">
          <span className="text-xs text-muted-foreground">Chapter *</span>
          <input
            value={question.chapter}
            onChange={(e) => onChange({ chapter: e.target.value })}
            className={inputClass}
            placeholder="e.g. Algebra"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Topic *</span>
          <input
            value={question.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            className={inputClass}
            placeholder="e.g. Linear Equations"
          />
        </label>
        <div className="grid grid-cols-3 gap-3 md:col-span-2">
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
        <label className="block md:col-span-2">
          <span className="text-xs text-muted-foreground">
            Question text {question.textImageKey ? '(optional with photo)' : '*'}
          </span>
          <textarea
            value={question.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            className={inputClass}
            placeholder="Enter the question, or upload a photo of the formula…"
          />
        </label>
        <div className="md:col-span-2">
          <QuestionImagePicker
            label="Stem photo (formulas / diagrams)"
            imageKey={question.textImageKey}
            imageUrl={question.textImageUrl}
            onUploaded={(key, url) => onChange({ textImageKey: key, textImageUrl: url })}
            onCleared={() => onChange({ textImageKey: undefined, textImageUrl: undefined })}
          />
        </div>

        {question.questionType === 'mcq' && (
          <>
            {([
              ['optionA', 'optionAImageKey', 'optionAImageUrl', 'A'],
              ['optionB', 'optionBImageKey', 'optionBImageUrl', 'B'],
              ['optionC', 'optionCImageKey', 'optionCImageUrl', 'C'],
              ['optionD', 'optionDImageKey', 'optionDImageUrl', 'D'],
            ] as const).map(([textKey, imageKey, imageUrl, letter]) => (
              <div key={textKey} className="space-y-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Option {letter}</span>
                  <input
                    value={question[textKey] ?? ''}
                    onChange={(e) => onChange({ [textKey]: e.target.value })}
                    className={inputClass}
                    placeholder={`Text or leave blank if using photo`}
                  />
                </label>
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
          </>
        )}
      </div>
    </div>
  )
}

export function ManualQuestionEntry() {
  const { curriculum, ensureLoaded } = useCurriculum()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])
  const { addPaperFromManualQuestions } = useQuestionPapers()
  const boards = useMemo(() => curriculum.map((b) => b.board), [curriculum])

  const [paperName, setPaperName] = useState('')
  const [questions, setQuestions] = useState<ManualPaperDraftQuestion[]>(() => [emptyQuestion()])
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const stored = readManualPaperDraft()
    if (!stored) return
    setPaperName(stored.paperName)
    setQuestions(stored.questions.length > 0 ? stored.questions : [emptyQuestion()])
    setDraftSavedAt(stored.updatedAt)
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const updatedAt = persistManualPaperDraft({ paperName, questions })
      setDraftSavedAt(updatedAt)
    }, 400)
    return () => window.clearTimeout(handle)
  }, [paperName, questions])

  const updateQuestion = useCallback((clientId: string, patch: Partial<ManualPaperDraftQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.clientId === clientId ? { ...q, ...patch } : q)))
  }, [])

  const addQuestion = useCallback(() => {
    setQuestions((prev) => {
      const last = prev[prev.length - 1]
      const scope = last
        ? {
            board: last.board,
            grade: last.grade,
            subject: last.subject,
            chapter: last.chapter,
            topic: last.topic,
            difficulty: last.difficulty,
            marks: last.marks,
            questionType: last.questionType,
          }
        : undefined
      return [...prev, emptyQuestion(scope)]
    })
    setMessage(null)
  }, [])

  const removeQuestion = useCallback((clientId: string) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.clientId !== clientId)))
  }, [])

  function handleSaveDraft(e: FormEvent) {
    e.preventDefault()
    const updatedAt = persistManualPaperDraft({ paperName, questions })
    setDraftSavedAt(updatedAt)
    setMessage(`Draft saved locally (${questions.length} question${questions.length === 1 ? '' : 's'}).`)
  }

  function handleDiscardDraft() {
    clearManualPaperDraft()
    setPaperName('')
    setQuestions([emptyQuestion()])
    setDraftSavedAt(null)
    setMessage('Local draft discarded.')
  }

  async function handleSavePaper(e: FormEvent) {
    e.preventDefault()
    if (!paperName.trim()) {
      setMessage('Enter a question paper name before publishing.')
      return
    }
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i)
      if (err) {
        setMessage(err)
        return
      }
    }

    setSaving(true)
    setMessage(null)
    const savedName = paperName.trim()
    const payload = questions.map((q) => toManualInput(q))
    try {
      await addPaperFromManualQuestions(savedName, payload)
      clearManualPaperDraft()
      setPaperName('')
      setQuestions([emptyQuestion()])
      setDraftSavedAt(null)
      setMessage(`Published "${savedName}" with ${payload.length} question(s).`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save paper')
    } finally {
      setSaving(false)
    }
  }

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
              Add questions with text and/or photos (formulas, diagrams). For each stem or option,
              upload a JPEG/PNG/WebP. Your work auto-saves as a local draft — publish when ready.
            </p>
          </div>
          {draftSavedAt && (
            <p className="text-xs text-muted-foreground shrink-0">
              Draft saved {new Date(draftSavedAt).toLocaleString()}
            </p>
          )}
        </div>

        <label className="block mb-4">
          <span className="text-xs text-muted-foreground">Question paper name *</span>
          <input
            value={paperName}
            onChange={(e) => setPaperName(e.target.value)}
            placeholder="e.g. Algebra Unit Test — Batch A"
            className={inputClass}
            required
          />
        </label>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <QuestionBlock
              key={q.clientId}
              index={index}
              question={q}
              boards={boards}
              curriculum={curriculum}
              canRemove={questions.length > 1}
              onChange={(patch) => updateQuestion(q.clientId, patch)}
              onRemove={() => removeQuestion(q.clientId)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-dashed border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </AppCard>

      <AppCard>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <FileStack className="w-4 h-4" />
            Save draft locally
          </button>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Discard draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => void handleSavePaper(e)}
            className="btn btn-action w-full sm:w-auto sm:ml-auto disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing…' : `Publish paper (${questions.length})`}
          </button>
        </div>
        {message ? (
          <p
            className={
              message.startsWith('Published') || message.startsWith('Draft')
                ? 'mt-3 text-sm text-leaf'
                : 'mt-3 text-sm text-rose font-medium'
            }
            role="alert"
          >
            {message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground mt-3">
          Draft stays on this device until you publish or discard. Every question needs a paper name,
          chapter, and topic — plus text or a photo for the stem, and options A &amp; B (text or photo)
          for MCQs.
        </p>
      </AppCard>
    </div>
  )
}