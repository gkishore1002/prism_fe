import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { Search, User, BookOpen, FileText, Layers } from 'lucide-react'
import { flattenSearchResults, searchPortal, type SearchResultItem, type SearchResultKind } from '@/lib/api/searchApi'
import { AppModal } from '@/components/ui/AppModal'
import { cn } from '@/lib/cn'

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

const kindIcons: Record<SearchResultKind, typeof Search> = {
  student: User,
  topic: Layers,
  question: BookOpen,
  paper: FileText,
}

const kindLabels: Record<SearchResultKind, string> = {
  student: 'Students',
  topic: 'Topics',
  question: 'Questions',
  paper: 'Question papers',
}

function groupByKind(items: SearchResultItem[]): Partial<Record<SearchResultKind, SearchResultItem[]>> {
  const groups: Partial<Record<SearchResultKind, SearchResultItem[]>> = {}
  for (const item of items) {
    groups[item.kind] = [...(groups[item.kind] ?? []), item]
  }
  return groups
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    setError(null)
    setActiveIndex(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const handle = window.setTimeout(() => {
      void searchPortal(trimmed)
        .then((data) => {
          setResults(flattenSearchResults(data))
          setActiveIndex(0)
        })
        .catch((e: unknown) => {
          setResults([])
          setError(e instanceof Error ? e.message : 'Search failed')
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => window.clearTimeout(handle)
  }, [open, query])

  const selectResult = useCallback(
    (item: SearchResultItem) => {
      onClose()
      navigate(item.href)
    },
    [navigate, onClose],
  )

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[activeIndex]
        if (item) selectResult(item)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, results, activeIndex, selectResult])

  if (!open) return null

  const grouped = groupByKind(results)
  let runningIndex = 0

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="md"
      hideCloseButton
      bodyClassName="!p-0"
      panelClassName="overflow-hidden rounded-[14px] border border-border"
      ariaLabel="Search"
      align="start"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students, topics, questions…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <InlineLoader size="xs" aria-label="Searching" />}
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 bg-secondary rounded font-mono-data text-muted-foreground">
          Esc
        </kbd>
      </div>

      <div className="max-h-[min(60vh,28rem)] overflow-y-auto scrollbar-thin">
          {error && (
            <p className="px-4 py-6 text-sm text-rose text-center">{error}</p>
          )}
          {!error && query.trim().length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              Type to search across your institution
            </p>
          )}
          {!error && query.trim().length > 0 && !loading && results.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {(Object.keys(grouped) as SearchResultKind[]).map((kind) => {
            const items = grouped[kind]
            if (!items?.length) return null
            const Icon = kindIcons[kind]
            return (
              <div key={kind} className="py-2">
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {kindLabels[kind]}
                </div>
                <ul>
                  {items.map((item) => {
                    const index = runningIndex++
                    const active = index === activeIndex
                    return (
                      <li key={`${item.kind}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => selectResult(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left ios-list-row',
                            active ? 'bg-secondary/80' : 'hover:bg-secondary/40',
                          )}
                        >
                          <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
                            {item.subtitle && (
                              <div className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</div>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
    </AppModal>
  )
}