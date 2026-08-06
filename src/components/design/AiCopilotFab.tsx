import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Global floating AI copilot entry — UI shell; wires to future agent endpoints. */
export function AiCopilotFab() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <>
      <motion.button
        type="button"
        className={cn(
          'prism-ai-fab fixed bottom-5 right-5 z-ln-fab',
          'flex h-12 w-12 items-center justify-center rounded-full',
          'bg-violet-500 text-white shadow-[0_12px_40px_rgba(139,92,246,0.4)]',
          'ai-pulse focus-visible:outline-none',
        )}
        aria-label="Open Prism AI assistant"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-ln-modal flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 glass-overlay"
              aria-label="Close AI assistant"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Prism AI Copilot"
              className="relative w-full max-w-md glass-sheet overflow-hidden"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Prism AI</p>
                    <p className="text-[11px] text-muted-foreground">Academic copilot</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost p-2"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3 min-h-[180px]">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask for lesson plans, assessment drafts, weak-topic interventions, or report
                  summaries. Responses will use your institution context.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Summarize class health', 'Create a quiz', 'Suggest interventions'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraft(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <form
                className="flex items-center gap-2 p-3 border-t border-border"
                onSubmit={(e) => {
                  e.preventDefault()
                  setDraft('')
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask Prism AI…"
                  className="ios-input py-2.5 flex-1"
                />
                <button type="submit" className="btn btn-primary h-10 w-10 p-0" aria-label="Send">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
