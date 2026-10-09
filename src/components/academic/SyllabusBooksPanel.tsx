import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Loader2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useCenters } from '@/hooks/useCenters'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import { GenerateMcqsFromBook } from '@/components/academic/GenerateMcqsFromBook'
import {
  deleteSyllabusBook,
  downloadSyllabusBookJson,
  fetchSyllabusBook,
  fetchSyllabusBooks,
  importBookTopics,
  updateSyllabusBookOutline,
  uploadSyllabusBook,
  type SyllabusBook,
  type SyllabusChapterDraft,
} from '@/lib/api/syllabusBooksApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { FormErrorBanner } from '@/components/ui/FormErrorBanner'
import { boardsMatch, getCurriculumSubjects, gradesMatch } from '@/lib/academicScope'

function chaptersFromBook(book: SyllabusBook): SyllabusChapterDraft[] {
  const chapters = book.analysisJson?.chapters ?? []
  return chapters.map((ch) => ({
    title: ch.title ?? '',
    topics: Array.isArray(ch.topics) ? [...ch.topics] : [],
  }))
}

export function SyllabusBooksPanel() {
  const { curriculum, ensureLoaded, refresh: refreshCurriculum } = useCurriculum()
  const { organization } = useCenters()
  const premiumAiMcq = Boolean(organization?.aiMcqFromBooks)
  const { confirm } = useConfirmModal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [books, setBooks] = useState<SyllabusBook[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<{ id: string; text: string } | null>(null)
  const [outlineBook, setOutlineBook] = useState<SyllabusBook | null>(null)
  const [outlineDraft, setOutlineDraft] = useState<SyllabusChapterDraft[]>([])
  const [outlineSaving, setOutlineSaving] = useState(false)
  const [generateBook, setGenerateBook] = useState<SyllabusBook | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [board, setBoard] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const boards = useMemo(() => curriculum.map((b) => b.board), [curriculum])
  const boardNode = curriculum.find((b) => boardsMatch(b.board, board))
  const grades = boardNode?.grades.map((g) => g.grade) ?? []
  const subjects = getCurriculumSubjects(curriculum, board, grade)

  useEffect(() => {
    if (!board && boards[0]) setBoard(boards[0])
  }, [board, boards])

  useEffect(() => {
    if (grade && grades.some((g) => gradesMatch(g, grade))) return
    if (grades[0]) setGrade(grades[0])
  }, [grade, grades])

  useEffect(() => {
    if (subject && subjects.includes(subject)) return
    setSubject(subjects[0] ?? '')
  }, [subject, subjects])

  async function refreshBooks() {
    if (!isApiEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await fetchSyllabusBooks()
      setBooks(list)
      setError(null)
      // Backfill curriculum for books that were summarized before auto-import was reliable.
      const analyzed = list.filter((b) => b.status === 'analyzed')
      if (analyzed.length > 0) {
        let added = 0
        for (const book of analyzed) {
          try {
            const result = await importBookTopics(book.id)
            added += result.topicsAdded
          } catch {
            /* ignore per-book failures */
          }
        }
        if (added > 0) {
          setImportMessage({
            id: analyzed[0].id,
            text: `✓ Synced ${added} topic${added === 1 ? '' : 's'} to curriculum`,
          })
          void refreshCurriculum()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshBooks()
  }, [])

  const analyzingIds = books.filter((b) => b.status === 'analyzing').map((b) => b.id)

  function openOutlineReview(book: SyllabusBook) {
    setOutlineBook(book)
    setOutlineDraft(chaptersFromBook(book))
  }

  useEffect(() => {
    if (analyzingIds.length === 0) return
    const timer = window.setInterval(() => {
      void (async () => {
        const updates = await Promise.all(
          analyzingIds.map(async (id) => {
            try {
              return await fetchSyllabusBook(id)
            } catch {
              return null
            }
          }),
        )
        const justAnalyzed: SyllabusBook[] = []
        setBooks((prev) => {
          const next = prev.map((book) => {
            const updated = updates.find((item) => item && item.id === book.id)
            if (updated && updated.status === 'analyzed' && book.status === 'analyzing') {
              justAnalyzed.push(updated)
            }
            return updated ?? book
          })
          return next
        })
        // Explicitly import topics into curriculum when summarize finishes (idempotent).
        if (justAnalyzed.length > 0) {
          for (const done of justAnalyzed) {
            try {
              const result = await importBookTopics(done.id)
              setImportMessage({
                id: done.id,
                text: `✓ Summarized · ${result.topicsAdded} topic${result.topicsAdded === 1 ? '' : 's'} imported to ${done.board} / ${done.grade} / ${done.subject}`,
              })
            } catch (err) {
              setImportMessage({
                id: done.id,
                text:
                  err instanceof ApiError
                    ? `✓ Summarized · topic import failed: ${err.message}`
                    : '✓ Summarized · topic import failed',
              })
            }
          }
          void refreshCurriculum()
        }
      })()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [analyzingIds.join(','), outlineBook])

  async function handleUpload() {
    if (!selectedFile || !board || !grade || !subject || uploading) return
    setUploading(true)
    setError(null)
    try {
      const created = await uploadSyllabusBook({
        file: selectedFile,
        board,
        grade,
        subject,
        title: title.trim() || undefined,
      })
      setBooks((prev) => [created, ...prev.filter((b) => b.id !== created.id)])
      setSelectedFile(null)
      setFileName('')
      setTitle('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function openBookSummary(book: SyllabusBook) {
    setOpeningId(book.id)
    setError(null)
    try {
      const detail =
        book.analysisJson?.chapters?.length ? book : await fetchSyllabusBook(book.id)
      openOutlineReview(detail)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load the summarized book',
      )
    } finally {
      setOpeningId(null)
    }
  }

  function updateChapterTitle(index: number, titleValue: string) {
    setOutlineDraft((prev) =>
      prev.map((ch, i) => (i === index ? { ...ch, title: titleValue } : ch)),
    )
  }

  function updateTopic(chapterIndex: number, topicIndex: number, value: string) {
    setOutlineDraft((prev) =>
      prev.map((ch, i) => {
        if (i !== chapterIndex) return ch
        const topics = [...ch.topics]
        topics[topicIndex] = value
        return { ...ch, topics }
      }),
    )
  }

  function addTopic(chapterIndex: number) {
    setOutlineDraft((prev) =>
      prev.map((ch, i) => (i === chapterIndex ? { ...ch, topics: [...ch.topics, ''] } : ch)),
    )
  }

  function removeTopic(chapterIndex: number, topicIndex: number) {
    setOutlineDraft((prev) =>
      prev.map((ch, i) =>
        i === chapterIndex
          ? { ...ch, topics: ch.topics.filter((_, ti) => ti !== topicIndex) }
          : ch,
      ),
    )
  }

  function addChapter() {
    setOutlineDraft((prev) => [...prev, { title: '', topics: [''] }])
  }

  function removeChapter(index: number) {
    setOutlineDraft((prev) => prev.filter((_, i) => i !== index))
  }

  function cleanedOutline(): SyllabusChapterDraft[] {
    return outlineDraft
      .map((ch) => ({
        title: ch.title.trim(),
        topics: ch.topics.map((t) => t.trim()).filter(Boolean),
      }))
      .filter((ch) => ch.title)
  }

  async function handleSaveOutline() {
    if (!outlineBook || outlineSaving) return
    const chapters = cleanedOutline()
    if (chapters.length === 0) {
      setError('Add at least one chapter with a title before saving.')
      return
    }
    setOutlineSaving(true)
    setError(null)
    try {
      const updated = await updateSyllabusBookOutline(outlineBook.id, chapters)
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
      setOutlineBook(updated)
      setOutlineDraft(chaptersFromBook(updated))
      setImportMessage({
        id: updated.id,
        text: '✓ Outline saved · new topics synced to curriculum',
      })
      void refreshCurriculum()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Save failed')
    } finally {
      setOutlineSaving(false)
    }
  }

  const topicCount = outlineDraft.reduce(
    (n, ch) => n + ch.topics.filter((t) => t.trim()).length,
    0,
  )

  if (!isApiEnabled()) {
    return (
      <AppCard>
        <p className="text-sm text-muted-foreground">Connect to the Prism API to upload syllabus books.</p>
      </AppCard>
    )
  }

  return (
    <div className="space-y-4">
      <AppCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg">Syllabus books</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a textbook PDF or TXT for a board, grade, and subject. When summarization finishes,
          chapters and topics import into curriculum automatically. Analyzed uploads are available
          under Auto questions for AI MCQ generation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <AppDropdown
            label="Board"
            value={board}
            onChange={setBoard}
            options={boards.map((b) => ({ value: b, label: b }))}
            placeholder="Board"
          />
          <AppDropdown
            label="Grade"
            value={grade}
            onChange={setGrade}
            options={grades.map((g) => ({ value: g, label: g }))}
            placeholder="Grade"
          />
          <AppDropdown
            label="Subject"
            value={subject}
            onChange={setSubject}
            options={subjects.map((s) => ({ value: s, label: s }))}
            placeholder="Subject"
          />
        </div>
        <label className="block mb-3">
          <span className="text-xs text-muted-foreground">Book title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            placeholder="Uses the file name if left blank"
          />
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setSelectedFile(file)
            setFileName(file?.name ?? '')
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border hover:bg-secondary/60"
          >
            <Upload className="w-4 h-4" />
            {fileName || 'Choose PDF'}
          </button>
          <button
            type="button"
            disabled={!selectedFile || !board || !grade || !subject || uploading}
            onClick={() => void handleUpload()}
            className="btn btn-primary text-sm px-4 py-2 disabled:opacity-40 inline-flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Summarize with Vertex AI'}
          </button>
        </div>
        {error && <FormErrorBanner message={error} className="mt-3" />}
      </AppCard>

      <AppCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading books…
          </div>
        ) : books.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground text-center">
            No syllabus books yet. Upload a PDF for the board, grade, and subject you teach.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {books.map((book) => (
              <li key={book.id} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.board} · {book.grade} · {book.subject}
                    {book.filename ? ` · ${book.filename}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {book.status === 'analyzed'
                      ? `${book.chapterCount} chapters · ${book.topicCount} topics — imported to curriculum`
                      : book.status === 'analyzing'
                        ? 'Vertex AI is summarizing… topics will import automatically'
                        : book.errorMessage || 'Summarization failed'}
                  </p>
                  {importMessage?.id === book.id && (
                    <p className="text-xs text-leaf mt-1.5 font-medium">
                      {importMessage.text}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-medium',
                      book.status === 'analyzed' && 'bg-leaf/15 text-leaf',
                      book.status === 'analyzing' && 'bg-accent/15 text-foreground',
                      book.status === 'failed' && 'bg-rose/10 text-rose',
                    )}
                  >
                    {book.status === 'analyzed' && <CheckCircle2 className="w-3 h-3" />}
                    {book.status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {book.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                    {book.status}
                  </span>
                  {book.status === 'analyzed' && (
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-md text-xs border border-border text-foreground hover:bg-secondary/70 disabled:opacity-40"
                      disabled={openingId === book.id}
                      onClick={() => void openBookSummary(book)}
                    >
                      {openingId === book.id ? 'Opening…' : 'Edit outline'}
                    </button>
                  )}
                  {book.status === 'analyzed' && premiumAiMcq && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-accent/40 bg-accent/10 text-foreground hover:bg-accent/20 disabled:opacity-40"
                      disabled={!book.hasSourceText}
                      title={
                        book.hasSourceText
                          ? 'Generate MCQs with AI'
                          : 'Re-upload this book to enable AI MCQ generation'
                      }
                      onClick={() => setGenerateBook(book)}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate MCQs
                    </button>
                  )}
                  {book.status === 'analyzed' && (
                    <button
                      type="button"
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 disabled:opacity-40"
                      aria-label={`View summary of ${book.title}`}
                      disabled={openingId === book.id}
                      onClick={() => void openBookSummary(book)}
                      title="View / edit outline"
                    >
                      {openingId === book.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {book.status === 'analyzed' && (
                    <button
                      type="button"
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 disabled:opacity-40"
                      aria-label={`Download JSON for ${book.title}`}
                      disabled={downloadingId === book.id}
                      onClick={() => {
                        setDownloadingId(book.id)
                        void downloadSyllabusBookJson(book)
                          .catch((err) => {
                            setError(
                              err instanceof Error
                                ? err.message
                                : 'Could not download the summarized JSON',
                            )
                          })
                          .finally(() => setDownloadingId(null))
                      }}
                      title="Download JSON"
                    >
                      {downloadingId === book.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-md text-muted-foreground hover:text-rose hover:bg-rose/10"
                    aria-label={`Delete ${book.title}`}
                    onClick={() => {
                      void confirm({
                        title: 'Remove syllabus book?',
                        message: `Delete "${book.title}"? Topic mapping for new papers will no longer use this outline.`,
                        confirmLabel: 'Delete',
                        variant: 'danger',
                      }).then((ok) => {
                        if (!ok) return
                        void deleteSyllabusBook(book.id).then(() =>
                          setBooks((prev) => prev.filter((b) => b.id !== book.id)),
                        )
                      })
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>

      <AppModal
        open={Boolean(outlineBook)}
        onClose={() => {
          if (outlineSaving) return
          setOutlineBook(null)
        }}
        title={outlineBook?.title ?? 'Edit book outline'}
        description={
          outlineBook
            ? `${outlineBook.board} · ${outlineBook.grade} · ${outlineBook.subject} · ${outlineDraft.length} chapters · ${topicCount} topics · save to update curriculum`
            : undefined
        }
        size="lg"
        bodyClassName="max-h-[70vh] overflow-y-auto"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="h-10 px-4 rounded-md text-sm border border-border hover:bg-secondary/60 disabled:opacity-40"
              disabled={outlineSaving}
              onClick={() => setOutlineBook(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded-md text-sm font-medium bg-ink text-paper disabled:opacity-40 inline-flex items-center gap-1.5"
              disabled={outlineSaving || outlineDraft.length === 0}
              onClick={() => void handleSaveOutline()}
            >
              {outlineSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save outline
            </button>
          </div>
        }
      >
        {outlineDraft.length === 0 ? (
          <div className="py-6 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">No extracted chapters yet.</p>
            <button
              type="button"
              onClick={addChapter}
              className="inline-flex items-center gap-1.5 text-sm text-accent"
            >
              <Plus className="w-4 h-4" />
              Add chapter
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground rounded-md border border-border bg-secondary/30 px-3 py-2">
              Topics were imported to curriculum when summarization finished. Edit names here and save
              to add any new topics.
            </p>
            <ol className="space-y-4">
              {outlineDraft.map((ch, idx) => (
                <li key={`ch-${idx}`} className="rounded-xl border border-border p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 font-mono text-xs text-muted-foreground shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      value={ch.title}
                      onChange={(e) => updateChapterTitle(idx, e.target.value)}
                      className="flex-1 h-9 border border-border rounded-md px-3 text-sm font-medium bg-background"
                      placeholder="Chapter title"
                    />
                    <button
                      type="button"
                      className="p-2 rounded-md text-muted-foreground hover:text-rose hover:bg-rose/10"
                      aria-label="Remove chapter"
                      onClick={() => removeChapter(idx)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="mt-3 space-y-2 pl-6">
                    {ch.topics.map((topic, tIdx) => (
                      <li key={`t-${idx}-${tIdx}`} className="flex items-center gap-2">
                        <input
                          value={topic}
                          onChange={(e) => updateTopic(idx, tIdx, e.target.value)}
                          className="flex-1 h-8 border border-border rounded-md px-2.5 text-sm bg-background"
                          placeholder="Topic name"
                        />
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose"
                          aria-label="Remove topic"
                          onClick={() => removeTopic(idx, tIdx)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => addTopic(idx)}
                    className="mt-2 ml-6 inline-flex items-center gap-1 text-xs text-accent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add topic
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={addChapter}
              className="inline-flex items-center gap-1.5 text-sm text-accent"
            >
              <Plus className="w-4 h-4" />
              Add chapter
            </button>
          </div>
        )}
      </AppModal>

      <GenerateMcqsFromBook
        book={generateBook}
        open={Boolean(generateBook)}
        onClose={() => setGenerateBook(null)}
        onSaved={(saved, status) => {
          setImportMessage({
            id: generateBook?.id ?? '',
            text: `✓ Saved ${saved} AI MCQ${saved === 1 ? '' : 's'} as ${status === 'draft' ? 'drafts' : 'active'}`,
          })
        }}
      />
    </div>
  )
}
