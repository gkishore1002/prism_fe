import { useMemo, useState, useEffect } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Check, X, ArrowRight } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { practiceFromBank } from '@/lib/practiceFromBank'

export function StudentPracticePage() {
  const { questions, loading, ensureLoaded } = useQuestionPapers()
  const practiceQuestions = useMemo(() => practiceFromBank(questions), [questions])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<('correct' | 'wrong')[]>([])

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  if (loading && questions.length === 0) {
    return <PageLoader />
  }

  if (practiceQuestions.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Practice" title="Practice mode" sub="No practice questions available yet." />
        <AppCard className="text-center py-10">
          <p className="text-sm text-muted-foreground">Questions will appear here once your tutor uploads them.</p>
        </AppCard>
      </>
    )
  }

  const q = practiceQuestions[i]
  const done = i >= practiceQuestions.length

  if (done) {
    const correct = results.filter((r) => r === 'correct').length
    const pct = Math.round((correct / results.length) * 100)
    return (
      <>
        <PageHeader
          eyebrow="Session complete"
          title="Nice work."
          sub="Here's how this session compares to your recent average."
        />
        <div className="grid md:grid-cols-3 gap-4">
          <AppCard className="md:col-span-2 bg-ink text-paper border-ink">
            <div className="text-[10px] uppercase tracking-widest text-accent font-display font-semibold">
              Session score
            </div>
            <div className="font-mono-data text-6xl font-bold mt-2">{pct}%</div>
            <div className="text-paper/70 mt-2 font-sans text-sm">
              {correct} of {results.length} correct
            </div>
          </AppCard>
          <AppCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
              Topic accuracy
            </div>
            <div className="mt-3 space-y-3">
              {practiceQuestions.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  {results[idx] === 'correct' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="truncate">{p.topic}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setI(0)
                setPicked(null)
                setResults([])
              }}
              className="mt-6 w-full text-sm bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-display font-medium"
            >
              Practice again
            </button>
          </AppCard>
        </div>
      </>
    )
  }

  const submit = () => {
    if (picked === null) return
    const r = picked === q.correct ? 'correct' : 'wrong'
    setResults([...results, r])
  }
  const next = () => {
    setI(i + 1)
    setPicked(null)
  }
  const answered = results.length > i

  return (
    <>
      <PageHeader
        eyebrow={`Question ${i + 1} of ${practiceQuestions.length} · ${q.topic}`}
        title="Practice mode"
        sub="One question at a time. Instant feedback. No timer pressure."
      />

      <div className="max-w-3xl mx-auto">
        <div className="flex gap-1 mb-6">
          {practiceQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                idx < i ? 'bg-ink' : idx === i ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <AppCard className="p-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span className="px-2 py-0.5 bg-secondary rounded font-display">{q.difficulty}</span>
            <span className="px-2 py-0.5 bg-secondary rounded font-mono-data">{q.marks} mark</span>
          </div>
          <div className="font-display text-2xl leading-snug text-foreground">{q.q}</div>

          <div className="mt-8 space-y-3">
            {q.options.map((opt, idx) => {
              const isPicked = picked === idx
              const isCorrect = answered && idx === q.correct
              const isWrong = answered && isPicked && idx !== q.correct
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={answered}
                  onClick={() => setPicked(idx)}
                  className={`w-full text-left px-5 py-4 rounded-lg border transition flex items-center gap-3 font-sans ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : isWrong
                        ? 'border-rose-300 bg-rose-50'
                        : isPicked
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-border hover:border-blue-300'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full border border-current grid place-items-center text-xs font-mono-data">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                  {isCorrect && <Check className="ml-auto w-4 h-4 text-emerald-600" />}
                  {isWrong && <X className="ml-auto w-4 h-4 text-rose-600" />}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className="mt-6 p-4 bg-secondary/40 rounded-lg border border-border">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">Solution</div>
              <p className="text-sm text-muted-foreground font-sans">{q.solution}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-2">
            {!answered ? (
              <button
                type="button"
                onClick={submit}
                disabled={picked === null}
                className="btn btn-primary px-6 py-2.5 disabled:opacity-40 gap-2 font-display font-medium"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="bg-accent text-accent-foreground px-6 py-2.5 rounded-md inline-flex items-center gap-2 font-display font-semibold"
              >
                {i + 1 < practiceQuestions.length ? 'Next question' : 'Finish'}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </AppCard>
      </div>
    </>
  )
}