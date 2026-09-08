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
  GitMerge,
  Plus,
  X,
} from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import {
  approveSyllabusBook,
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
import { boardsMatch, gradesMatch } from '@/lib/academicScope'

type OutlineMode = 'approve' | 'edit'

function chaptersFromBook(book: SyllabusBook): SyllabusChapterDraft[] {
  const chapters = book.analysisJson?.chapters ?? []
  return chapters.map((ch) => ({
    title: ch.title ?? '',
    topics: Array.isArray(ch.topics) ? [...ch.topics] : [],
  }))
}

export function SyllabusBooksPanel() {
  const { curriculum, ensureLoaded, refresh: refreshCurriculum } = useCurriculum()
  const { confirm } = useConfirmModal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [books, setBooks] = useState<SyllabusBook[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<{ id: string; text: string } | null>(null)
  const [outlineBook, setOutlineBook] = useState<SyllabusBook | null>(null)
  const [outlineMode, setOutlineMode] = useState<OutlineMode>('edit')
  const [outlineDraft, setOutlineDraft] = useState<SyllabusChapterDraft[]>([])
  const [outlineSaving, setOutlineSaving] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
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
  const gradeNode = boardNode?.grades.find((g) => gradesMatch(g.grade, grade))
  const subjects = gradeNode?.subjects.map((s) => s.name) ?? []

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
      setBooks(await fetchSyllabusBooks())
      setError(null)
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

  function openOutlineReview(book: SyllabusBook, mode: OutlineMode) {
    setOutlineMode(mode)
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
        // Ask the user to review/edit topics before syncing curriculum
        if (justAnalyzed[0] && !outlineBook) {
          openOutlineReview(justAnalyzed[0], 'approve')
        }
      })()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [analyzingIds.join(','), outlineBook])

  async function handleImportTopics(book: SyllabusBook) {
    if (importingId) return
    setImportingId(book.id)
    setImportMessage(null)
    setError(null)
    try {
      const result = await importBookTopics(book.id)
      setImportMessage({ id: book.id, text: `✓ ${result.topicsAdded} topics synced to curriculum` })
      void refreshCurriculum()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

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

  async function openBookSummary(book: SyllabusBook, mode: OutlineMode = 'edit') {
    setOpeningId(book.id)
    setError(null)
    try {
      const detail =
        book.analysisJson?.chapters?.length ? book : await fetchSyllabusBook(book.id)
      openOutlineReview(detail, mode)
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
      setImportMessage({ id: updated.id, text: '✓ Outline saved. Import topics when ready.' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Save failed')
    } finally {
      setOutlineSaving(false)
    }
  }

  async function handleApproveOutline() {
    if (!outlineBook || outlineSaving) return
    const chapters = cleanedOutline()
    if (chapters.length === 0) {
      setError('Add at least one chapter with a title before approving.')
      return
    }
    setOutlineSaving(true)
    setError(null)
    try {
      const updated = await approveSyllabusBook(outlineBook.id, chapters)
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
      setImportMessage({
        id: updated.id,
        text: `✓ Outline approved · topics synced to curriculum`,
      })
      void refreshCurriculum()
      setOutlineBook(null)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Approve failed',
      )
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
          Upload a textbook PDF. After Vertex AI summarizes chapters and topics, review and edit them
          before approving into the curriculum.
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
        {error && <p className="text-sm text-rose mt-3">{error}</p>}
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
                      ? `${book.chapterCount} chapters · ${book.topicCount} topics — review & approve to sync curriculum`
                      : book.status === 'analyzing'
                        ? 'Vertex AI is summarizing this book…'
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
                      className="px-2.5 py-1.5 rounded-md text-xs border border-accent/40 bg-accent/10 text-foreground hover:bg-accent/15 disabled:opacity-40"
                      disabled={openingId === book.id}
                      onClick={() => void openBookSummary(book, 'approve')}
                    >
                      {openingId === book.id ? 'Opening…' : 'Review'}
                    </button>
                  )}
                  {book.status === 'analyzed' && (
                    <button
                      type="button"
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 disabled:opacity-40"
                      aria-label={`View summary of ${book.title}`}
                      disabled={openingId === book.id}
                      onClick={() => void openBookSummary(book, 'edit')}
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
                      aria-label={`Import topics to curriculum`}
                      disabled={importingId === book.id || downloadingId === book.id || openingId === book.id}
                      onClick={() => void handleImportTopics(book)}
                      title="Import topics to curriculum"
                    >
                      {importingId === book.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <GitMerge className="w-4 h-4" />
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
        title={
          outlineMode === 'approve'
            ? 'Approve book topics'
            : outlineBook?.title ?? 'Edit book outline'
        }
        description={
          outlineBook
            ? outlineMode === 'approve'
              ? `${outlineBook.title} · ${outlineBook.board} · ${outlineBook.grade} · ${outlineBook.subject}. Edit chapters/topics if needed, then approve to sync curriculum.`
              : `${outlineBook.board} · ${outlineBook.grade} · ${outlineBook.subject} · ${outlineDraft.length} chapters · ${topicCount} topics`
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
              {outlineMode === 'approve' ? 'Review later' : 'Close'}
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded-md text-sm border border-border hover:bg-secondary/60 disabled:opacity-40 inline-flex items-center gap-1.5"
              disabled={outlineSaving || outlineDraft.length === 0}
              onClick={() => void handleSaveOutline()}
            >
              {outlineSaving && outlineMode === 'edit' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              Save outline
            </button>
            {outlineMode === 'approve' && (
              <button
                type="button"
                className="h-10 px-4 rounded-md text-sm font-medium bg-ink text-paper disabled:opacity-40 inline-flex items-center gap-1.5"
                disabled={outlineSaving || outlineDraft.length === 0}
                onClick={() => void handleApproveOutline()}
              >
                {outlineSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve & sync
              </button>
            )}
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
            {outlineMode === 'approve' && (
              <p className="text-xs text-muted-foreground rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
                These topics were mapped from the uploaded book. Edit names, add or remove topics,
                then approve to save them into the curriculum.
              </p>
            )}
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
    </div>
  )
}
