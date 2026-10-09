import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { AppDropdown, AppSelectMulti } from '@/components/ui/AppDropdown'
import { Button } from '@/components/ui/Button'
import { FormErrorBanner } from '@/components/ui/FormErrorBanner'
import {
  approveMcqsFromBook,
  fetchSyllabusBook,
  generateMcqsFromBook,
  type GeneratedMcq,
  type McqDifficulty,
  type McqTopicSelection,
  type SyllabusBook,
} from '@/lib/api/syllabusBooksApi'
import { cn } from '@/lib/cn'

interface GenerateMcqsFromBookProps {
  book: SyllabusBook | null
  open: boolean
  onClose: () => void
  onSaved?: (count: number, status: 'draft' | 'active') => void
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const COUNT_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const TOPIC_SEP = '::'

function topicKey(chapter: string, topic: string): string {
  return `${chapter}${TOPIC_SEP}${topic}`
}

function parseTopicKey(key: string): McqTopicSelection | null {
  const idx = key.indexOf(TOPIC_SEP)
  if (idx <= 0) return null
  const chapter = key.slice(0, idx).trim()
  const topic = key.slice(idx + TOPIC_SEP.length).trim()
  if (!chapter || !topic) return null
  return { chapter, topic }
}

function emptyMcq(partial?: Partial<GeneratedMcq>): GeneratedMcq {
  return {
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1,
    difficulty: 'medium',
    chapter: '',
    topic: '',
    ...partial,
  }
}

export function GenerateMcqsFromBook({ book, open, onClose, onSaved }: GenerateMcqsFromBookProps) {
  const [detail, setDetail] = useState<SyllabusBook | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [selectedTopicKeys, setSelectedTopicKeys] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<McqDifficulty>('medium')
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<GeneratedMcq[]>([])
  const [generating, setGenerating] = useState(false)
  const [regenIndex, setRegenIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState<'draft' | 'active' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !book) {
      setDetail(null)
      setQuestions([])
      setError(null)
      setSuccess(null)
      return
    }
    let cancelled = false
    setLoadingBook(true)
    setError(null)
    void fetchSyllabusBook(book.id)
      .then((row) => {
        if (cancelled) return
        setDetail(row)
        const chapters = row.analysisJson?.chapters ?? []
        const firstChapter = chapters[0]?.title ?? ''
        const firstTopic = chapters[0]?.topics?.[0] ?? ''
        setSelectedChapters(firstChapter ? [firstChapter] : [])
        setSelectedTopicKeys(
          firstChapter && firstTopic ? [topicKey(firstChapter, firstTopic)] : [],
        )
        setDifficulty('medium')
        setCount(5)
        setQuestions([])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load book outline')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBook(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, book])

  const outlineChapters = useMemo(() => {
    return (detail?.analysisJson?.chapters ?? [])
      .map((ch) => ({
        title: String(ch.title ?? '').trim(),
        topics: (ch.topics ?? [])
          .map((t) => String(t ?? '').trim())
          .filter(Boolean),
      }))
      .filter((ch) => ch.title)
  }, [detail])

  const chapterOptions = useMemo(
    () => outlineChapters.map((ch) => ({ value: ch.title, label: ch.title })),
    [outlineChapters],
  )

  /** Topics only for currently selected chapters (never the full book list). */
  const topicOptions = useMemo(() => {
    if (!selectedChapters.length) return []
    const selected = new Set(selectedChapters.map((c) => c.trim()).filter(Boolean))
    const opts: { value: string; label: string; description?: string }[] = []
    for (const ch of outlineChapters) {
      if (!selected.has(ch.title)) continue
      for (const t of ch.topics) {
        opts.push({
          value: topicKey(ch.title, t),
          label: t,
          description: `Chapter: ${ch.title}`,
        })
      }
    }
    return opts
  }, [outlineChapters, selectedChapters])

  const topicOptionsForChapters = useMemo(() => {
    return (chapters: string[]) => {
      const selected = new Set(chapters.map((c) => c.trim()).filter(Boolean))
      const keys: string[] = []
      for (const ch of outlineChapters) {
        if (!selected.has(ch.title)) continue
        for (const t of ch.topics) keys.push(topicKey(ch.title, t))
      }
      return keys
    }
  }, [outlineChapters])

  const selections = useMemo(
    () =>
      selectedTopicKeys
        .map(parseTopicKey)
        .filter((s): s is McqTopicSelection => Boolean(s))
        .filter((s) => selectedChapters.includes(s.chapter)),
    [selectedTopicKeys, selectedChapters],
  )

  function handleChaptersChange(values: string[]) {
    const nextChapters = values.map((v) => v.trim()).filter(Boolean)
    setSelectedChapters(nextChapters)
    const allowed = new Set(topicOptionsForChapters(nextChapters))
    setSelectedTopicKeys((prev) => {
      const kept = prev.filter((k) => allowed.has(k))
      if (kept.length > 0) return kept
      // Nothing left from prior picks — leave empty so user chooses from new list
      return []
    })
  }

  function handleTopicsChange(values: string[]) {
    const allowed = new Set(topicOptions.map((o) => o.value))
    setSelectedTopicKeys(values.filter((k) => allowed.has(k)))
  }

  async function handleGenerate() {
    if (!book || !selections.length) return
    setGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await generateMcqsFromBook(book.id, {
        selections,
        difficulty,
        count,
      })
      setQuestions(result.questions)
      if (!result.questions.length) {
        setError('No questions returned. Try again or pick other topics.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRegenerateAll() {
    if (!book || !selections.length) return
    setGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await generateMcqsFromBook(book.id, {
        selections,
        difficulty,
        count: questions.length || count,
        avoidStems: questions.slice(0, 3).map((q) => q.text).filter(Boolean),
      })
      setQuestions(result.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRegenerateOne(index: number) {
    if (!book) return
    const current = questions[index]
    const chapter = current?.chapter || selections[0]?.chapter
    const topic = current?.topic || selections[0]?.topic
    if (!chapter || !topic) return
    setRegenIndex(index)
    setError(null)
    try {
      const result = await generateMcqsFromBook(book.id, {
        selections: [{ chapter, topic }],
        difficulty: current?.difficulty || difficulty,
        count: 1,
        avoidStems: [current?.text].filter(Boolean) as string[],
      })
      const next = result.questions[0]
      if (!next) {
        setError('Could not regenerate this question.')
        return
      }
      setQuestions((prev) => prev.map((q, i) => (i === index ? next : q)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegenIndex(null)
    }
  }

  async function handleSave(status: 'draft' | 'active') {
    if (!book || !questions.length) return
    setSaving(status)
    setError(null)
    setSuccess(null)
    try {
      const result = await approveMcqsFromBook(book.id, {
        difficulty,
        status,
        questions,
        chapter: selections[0]?.chapter,
        topic: selections[0]?.topic,
      })
      setSuccess(
        `Saved ${result.saved} MCQ${result.saved === 1 ? '' : 's'} as ${status === 'draft' ? 'drafts' : 'active'}.`,
      )
      onSaved?.(result.saved, status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  const busy = generating || regenIndex != null || saving != null
  const canGenerate = Boolean(book && selections.length && detail?.hasSourceText)

  return (
    <AppModal
      open={open}
      onClose={() => {
        if (busy) return
        onClose()
      }}
      title={book ? `Generate MCQs · ${book.title}` : 'Generate MCQs'}
      size="xl"
    >
      <div className="space-y-4">
        {error && <FormErrorBanner message={error} />}
        {success && (
          <p className="rounded-md border border-leaf/30 bg-leaf/10 px-3 py-2 text-sm text-foreground">
            {success}
          </p>
        )}

        {loadingBook ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !detail?.hasSourceText ? (
          <p className="text-sm text-muted-foreground">
            This book has no stored text for AI generation. Re-upload the PDF or TXT in the Books
            tab, then try again.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {detail.board} · {detail.grade} · {detail.subject}. Multi-select chapters and topics;
              question count is spread across the selected topics.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AppSelectMulti
                label="Chapters"
                values={selectedChapters}
                onChange={handleChaptersChange}
                options={chapterOptions}
                placeholder="Select chapters…"
                searchable
                maxLabels={3}
              />
              <AppSelectMulti
                key={`topics-${selectedChapters.join('|') || 'none'}`}
                label="Topics"
                values={selectedTopicKeys.filter((k) =>
                  topicOptions.some((o) => o.value === k),
                )}
                onChange={handleTopicsChange}
                options={topicOptions}
                placeholder={
                  selectedChapters.length
                    ? topicOptions.length
                      ? 'Select topics from selected chapters…'
                      : 'No topics in selected chapters'
                    : 'Select chapters first…'
                }
                emptyMessage={
                  selectedChapters.length
                    ? 'No topics for the selected chapters'
                    : 'Select one or more chapters to see topics'
                }
                searchable
                disabled={!selectedChapters.length}
                maxLabels={3}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AppDropdown
                label="Difficulty"
                value={difficulty}
                onChange={(v) => setDifficulty(v as McqDifficulty)}
                options={DIFFICULTY_OPTIONS}
              />
              <AppDropdown
                label="Number of questions"
                value={String(count)}
                onChange={(v) => setCount(Number(v) || 5)}
                options={COUNT_OPTIONS}
              />
              <div className="sm:col-span-2 flex items-end">
                <p className="text-xs text-muted-foreground pb-2">
                  {selections.length
                    ? `${count} question${count === 1 ? '' : 's'} across ${selections.length} topic${
                        selections.length === 1 ? '' : 's'
                      }`
                    : 'Select at least one topic to generate'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!canGenerate || busy}
                onClick={() => void handleGenerate()}
              >
                {generating && regenIndex == null ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate
              </Button>
              {questions.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleRegenerateAll()}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Regenerate all
                </Button>
              )}
            </div>

            {questions.length > 0 && (
              <div className="max-h-[min(55vh,520px)] space-y-3 overflow-y-auto pr-1">
                {questions.map((q, index) => (
                  <div
                    key={`mcq-${index}`}
                    className="rounded-lg border border-border bg-secondary/10 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Question {index + 1}
                        </p>
                        {(q.chapter || q.topic) && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[q.chapter, q.topic].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-40"
                          disabled={busy}
                          onClick={() => void handleRegenerateOne(index)}
                          title="Regenerate this question"
                        >
                          {regenIndex === index ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Regenerate
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-rose/10 hover:text-rose disabled:opacity-40"
                          disabled={busy}
                          onClick={() =>
                            setQuestions((prev) => prev.filter((_, i) => i !== index))
                          }
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <label className="block text-xs text-muted-foreground">
                      Stem
                      <textarea
                        value={q.text}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, text: e.target.value } : row,
                            ),
                          )
                        }
                        rows={2}
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const key = `option${letter}` as
                          | 'optionA'
                          | 'optionB'
                          | 'optionC'
                          | 'optionD'
                        return (
                          <label key={letter} className="block text-xs text-muted-foreground">
                            Option {letter}
                            <input
                              value={q[key]}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((row, i) =>
                                    i === index ? { ...row, [key]: e.target.value } : row,
                                  ),
                                )
                              }
                              className={cn(
                                'mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm',
                                q.correctAnswer === letter
                                  ? 'border-leaf/50'
                                  : 'border-border',
                              )}
                            />
                          </label>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="text-xs text-muted-foreground">
                        Correct
                        <select
                          value={q.correctAnswer}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((row, i) =>
                                i === index
                                  ? {
                                      ...row,
                                      correctAnswer: e.target.value as GeneratedMcq['correctAnswer'],
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
                        >
                          {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                            <option key={letter} value={letter}>
                              {letter}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Marks
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={q.marks}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((row, i) =>
                                i === index
                                  ? {
                                      ...row,
                                      marks: Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="ml-2 w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questions.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleSave('draft')}
                >
                  {saving === 'draft' ? 'Saving…' : 'Save as drafts'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleSave('active')}
                >
                  {saving === 'active' ? 'Saving…' : 'Save & publish'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppModal>
  )
}

export { emptyMcq }
