import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Loader2, Sparkles } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { FormErrorBanner } from '@/components/ui/FormErrorBanner'
import { GenerateMcqsFromBook } from '@/components/academic/GenerateMcqsFromBook'
import { useCenters } from '@/hooks/useCenters'
import {
  fetchSyllabusBooks,
  type SyllabusBook,
} from '@/lib/api/syllabusBooksApi'
import { isApiEnabled } from '@/lib/apiClient'
import { cn } from '@/lib/cn'

/**
 * Question Bank → Auto questions.
 * Only syllabus books uploaded under Books (analyzed + source text) can be used.
 */
export function AutoQuestionGeneratorPanel({
  onGoToBooks,
}: {
  onGoToBooks?: () => void
}) {
  const { organization } = useCenters()
  const premiumAiMcq = Boolean(organization?.aiMcqFromBooks)
  const [books, setBooks] = useState<SyllabusBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [generateBook, setGenerateBook] = useState<SyllabusBook | null>(null)

  useEffect(() => {
    if (!isApiEnabled()) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchSyllabusBooks()
      .then((list) => {
        if (!cancelled) setBooks(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load syllabus books')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const readyBooks = useMemo(
    () => books.filter((b) => b.status === 'analyzed' && b.hasSourceText),
    [books],
  )

  if (!isApiEnabled()) {
    return (
      <AppCard>
        <p className="text-sm text-muted-foreground">
          Connect to the Prism API to generate questions from uploaded books.
        </p>
      </AppCard>
    )
  }

  if (!premiumAiMcq) {
    return (
      <AppCard>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg text-foreground">Auto questions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI MCQ generation from uploaded syllabus books is a premium feature. Ask your
              platform admin to enable <span className="text-foreground">AI MCQ from books</span>{' '}
              for this organization.
            </p>
          </div>
        </div>
      </AppCard>
    )
  }

  return (
    <>
      <AppCard>
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg text-foreground">Auto questions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Generate MCQs from books you uploaded under Books. Only analyzed uploads with stored
              text appear here.
            </p>
          </div>
        </div>

        {error && <FormErrorBanner message={error} className="mb-4" />}
        {flash && (
          <div className="mb-4 rounded-md border border-leaf/30 bg-leaf/10 px-3 py-2 text-sm text-foreground">
            {flash}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : readyBooks.length === 0 ? (
          <div className="rounded-lg border border-border py-10 text-center text-sm text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No uploaded books ready for generation yet.</p>
            <p className="mt-1 text-xs">
              Upload a PDF/TXT under Books, wait until status is analyzed, then return here.
            </p>
            {onGoToBooks && (
              <button
                type="button"
                onClick={onGoToBooks}
                className="mt-4 btn btn-secondary text-sm px-4 py-2"
              >
                Go to Books
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {readyBooks.map((book) => (
              <li
                key={book.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[book.board, book.grade, book.subject].filter(Boolean).join(' · ') ||
                      'Syllabus book'}
                    {book.filename ? ` · ${book.filename}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFlash(null)
                    setGenerateBook(book)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border border-accent/40',
                    'bg-accent/10 px-3 py-1.5 text-xs font-medium text-foreground',
                    'hover:bg-accent/20',
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate MCQs
                </button>
              </li>
            ))}
          </ul>
        )}
      </AppCard>

      <GenerateMcqsFromBook
        book={generateBook}
        open={Boolean(generateBook)}
        onClose={() => setGenerateBook(null)}
        onSaved={(saved, status) => {
          setFlash(
            `✓ Saved ${saved} AI MCQ${saved === 1 ? '' : 's'} as ${
              status === 'draft' ? 'drafts' : 'active'
            }`,
          )
          setGenerateBook(null)
        }}
      />
    </>
  )
}
