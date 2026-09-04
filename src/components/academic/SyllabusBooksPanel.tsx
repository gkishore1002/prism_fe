import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Loader2, Trash2, Upload, CheckCircle2, AlertCircle, Download, Eye, GitMerge } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import {
  deleteSyllabusBook,
  downloadSyllabusBookJson,
  fetchSyllabusBook,
  fetchSyllabusBooks,
  importBookTopics,
  uploadSyllabusBook,
  type SyllabusBook,
} from '@/lib/api/syllabusBooksApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'

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
  const [viewingBook, setViewingBook] = useState<SyllabusBook | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
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
        let anyJustAnalyzed = false
        setBooks((prev) => {
          const next = prev.map((book) => {
            const updated = updates.find((item) => item && item.id === book.id)
            if (updated && updated.status === 'analyzed' && book.status === 'analyzing') {
              anyJustAnalyzed = true
            }
            return updated ?? book
          })
          return next
        })
        // Refresh curriculum sidebar when a book finishes — topics are auto-added by backend
        if (anyJustAnalyzed) {
          void refreshCurriculum()
        }
      })()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [analyzingIds.join(','), refreshCurriculum])

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

  async function openBookSummary(book: SyllabusBook) {
    setViewingId(book.id)
    setError(null)
    try {
      const detail =
        book.analysisJson?.chapters?.length ? book : await fetchSyllabusBook(book.id)
      setViewingBook(detail)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load the summarized book',
      )
    } finally {
      setViewingId(null)
    }
  }

  const viewingChapters = viewingBook?.analysisJson?.chapters ?? []
  const viewingTopicCount = viewingChapters.reduce(
    (n, ch) => n + (Array.isArray(ch.topics) ? ch.topics.length : 0),
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
          Upload a textbook PDF. Vertex AI summarizes it into chapters and topics, stored as JSON.
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
              <li key={book.id} className="px-4 sm:px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.board} · {book.grade} · {book.subject}
                    {book.filename ? ` · ${book.filename}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {book.status === 'analyzed'
                      ? `${book.chapterCount} chapters · ${book.topicCount} topics stored as JSON`
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
                <div className="flex items-center gap-2 shrink-0">
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
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 disabled:opacity-40"
                      aria-label={`View summary of ${book.title}`}
                      disabled={viewingId === book.id}
                      onClick={() => void openBookSummary(book)}
                    >
                      {viewingId === book.id ? (
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
                      disabled={importingId === book.id || downloadingId === book.id || viewingId === book.id}
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
        open={Boolean(viewingBook)}
        onClose={() => setViewingBook(null)}
        title={viewingBook?.title ?? 'Summarized book'}
        description={
          viewingBook
            ? `${viewingBook.board} · ${viewingBook.grade} · ${viewingBook.subject}${
                viewingChapters.length
                  ? ` · ${viewingChapters.length} chapters · ${viewingTopicCount} topics`
                  : ''
              }`
            : undefined
        }
        size="lg"
        bodyClassName="max-h-[70vh] overflow-y-auto"
      >
        {viewingChapters.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No extracted chapters yet.
          </p>
        ) : (
          <ol className="space-y-4">
            {viewingChapters.map((ch, idx) => (
              <li key={`${ch.title}-${idx}`}>
                <p className="text-sm font-semibold text-foreground">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{idx + 1}.</span>
                  {ch.title}
                </p>
                {ch.topics?.length ? (
                  <ul className="mt-1.5 space-y-1 pl-7">
                    {ch.topics.map((topic, tIdx) => (
                      <li key={`${topic}-${tIdx}`} className="text-sm text-muted-foreground">
                        {topic}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 pl-7 text-xs text-muted-foreground">No topics extracted</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </AppModal>
    </div>
  )
}
