import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { moduleRegistry, type ModuleId } from '@/lib/modules'
import { cn } from '@/lib/cn'

interface CommandPaletteProps {
  moduleId: ModuleId
  open: boolean
  onClose: () => void
}

export function CommandPalette({ moduleId, open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo(() => {
    const nav = moduleRegistry[moduleId].nav.map((item) => ({
      id: item.href,
      label: item.label,
      href: item.href,
      group: 'Navigate',
    }))
    const extras = [
      {
        id: 'reports',
        label: 'Open reports',
        href: `/${moduleId}/reports`,
        group: 'Quick',
      },
    ].filter((e) => moduleRegistry[moduleId].nav.some((n) => n.href === e.href))
    const all = [...nav, ...extras]
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((item) => item.label.toLowerCase().includes(q))
  }, [moduleId, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) onClose()
        else document.dispatchEvent(new CustomEvent('prism:open-command'))
      }
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && items[active]) {
        e.preventDefault()
        navigate(items[active].href)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, items, active, navigate])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-ln-modal flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="absolute inset-0 glass-overlay"
            aria-label="Close command palette"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-xl glass-sheet overflow-hidden"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder="Search pages, actions, AI…"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
                aria-autocomplete="list"
              />
              <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                ESC
              </kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto py-2 scrollbar-thin" role="listbox">
              {items.length === 0 && (
                <li className="px-4 py-8 text-sm text-muted-foreground text-center">No matches</li>
              )}
              {items.map((item, idx) => (
                <li key={`${item.group}-${item.id}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      idx === active ? 'bg-indigo-50 text-foreground' : 'text-muted-foreground hover:bg-slate-50',
                    )}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      navigate(item.href)
                      onClose()
                    }}
                  >
                    {item.group === 'AI' ? (
                      <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-md bg-slate-100 shrink-0" />
                    )}
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.group}
                    </span>
                    {idx === active && <CornerDownLeft className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span className="ml-auto">Ctrl / ⌘ K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
