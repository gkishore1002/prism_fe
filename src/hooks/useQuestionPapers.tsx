import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as questionsApi from '@/lib/api/questionsApi'
import type { QuestionBankEntry, QuestionPaper, QuestionUploadRow } from '@/types'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'
import { normalizeSubjectsList, subjectsOverlap } from '@/lib/formatSubjects'

type PaperWriteOptions = { status?: 'draft' | 'published'; paperId?: string }

interface QuestionPaperContextValue {
  questions: QuestionBankEntry[]
  questionPapers: QuestionPaper[]
  loading: boolean
  error: string | null
  ensureLoaded: () => Promise<void>
  addPaperFromUpload: (
    name: string,
    rows: QuestionUploadRow[],
    createdBy?: string,
    options?: PaperWriteOptions,
  ) => Promise<QuestionPaper>
  addPaperFromManualQuestions: (
    name: string,
    questions: questionsApi.ManualQuestionInput[],
    options?: PaperWriteOptions,
  ) => Promise<QuestionPaper>
  publishPaper: (paperId: string) => Promise<QuestionPaper>
  createCustomPaper: (
    name: string,
    parentPaperId: string,
    questionIds: string[],
    createdBy?: string,
  ) => Promise<QuestionPaper | null>
  getPaper: (id: string) => QuestionPaper | undefined
  getPapersForScope: (board: string, grade: string, subjects: string | string[]) => QuestionPaper[]
  papersForAssessment: (board: string, grade: string, subjects: string | string[]) => QuestionPaper[]
  getQuestionsByIds: (ids: string[]) => QuestionBankEntry[]
  removePaper: (paperId: string) => Promise<void>
  removeQuestion: (questionId: string) => Promise<void>
  refresh: () => Promise<void>
}

function isPublishedPaper(p: QuestionPaper) {
  return p.status !== 'draft'
}

const QuestionPaperContext = createContext<QuestionPaperContextValue | null>(null)

export function QuestionPaperProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([])
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    const isInitialLoad = !loaded
    if (isInitialLoad) setLoading(true)
    setError(null)
    try {
      const [qs, papers] = await Promise.all([
        questionsApi.fetchQuestions(),
        questionsApi.fetchQuestionPapers({ status: 'all' }),
      ])
      setQuestions(qs)
      const newestFirst = [...papers].sort((a, b) => {
        const aKey = a.createdAt || a.id
        const bKey = b.createdAt || b.id
        return bKey.localeCompare(aKey)
      })
      setQuestionPapers(newestFirst.map((p) => questionsApi.enrichPaper(p, qs)))
      setLoaded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load questions')
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }, [isAuthenticated, loaded])

  const ensureLoaded = useCallback(async () => {
    if (loaded || loading) return
    await refresh()
  }, [loaded, loading, refresh])

  const addPaperFromManualQuestions = useCallback(
    async (
      name: string,
      inputs: questionsApi.ManualQuestionInput[],
      options?: PaperWriteOptions,
    ) => {
      const paper = await questionsApi.createPaperFromManualQuestions(name, inputs, options)
      await refresh()
      return paper
    },
    [refresh],
  )

  const addPaperFromUpload = useCallback(
    async (
      name: string,
      rows: QuestionUploadRow[],
      _createdBy = 'tut-1',
      options?: PaperWriteOptions,
    ) => {
      const paper = await questionsApi.createPaperFromUpload(name, rows, options)
      await refresh()
      return paper
    },
    [refresh],
  )

  const publishPaper = useCallback(
    async (paperId: string) => {
      const paper = await questionsApi.publishQuestionPaper(paperId)
      await refresh()
      return paper
    },
    [refresh],
  )

  const createCustomPaper = useCallback(
    async (name: string, parentPaperId: string, questionIds: string[], _createdBy = 'tut-1') => {
      if (questionIds.length === 0) return null
      const paper = await questionsApi.createCustomPaperApi(name, parentPaperId, questionIds)
      await refresh()
      return paper
    },
    [refresh],
  )

  const removePaper = useCallback(async (paperId: string) => {
    await questionsApi.deleteQuestionPaper(paperId)
    await refresh()
  }, [refresh])

  const removeQuestion = useCallback(async (questionId: string) => {
    await questionsApi.deleteQuestion(questionId)
    await refresh()
  }, [refresh])

  const getPaper = useCallback((id: string) => questionPapers.find((p) => p.id === id), [questionPapers])

  const getPapersForScope = useCallback(
    (board: string, grade: string, subjects: string | string[]) => {
      const want = normalizeSubjectsList(Array.isArray(subjects) ? subjects : [subjects])
      return questionPapers.filter((p) => {
        if (!isPublishedPaper(p)) return false
        if (!boardsMatch(p.board, board) || !gradesMatch(p.grade, grade)) return false
        if (!want.length) return true
        const paperSubjects = normalizeSubjectsList(p.subjects, p.subject)
        return subjectsOverlap(want, paperSubjects)
      })
    },
    [questionPapers],
  )

  const papersForAssessment = useCallback(
    (board: string, grade: string, subjects: string | string[]) => {
      const scoped = getPapersForScope(board, grade, subjects)
      const scopedIds = new Set(scoped.map((p) => p.id))
      const rest = questionPapers.filter((p) => isPublishedPaper(p) && !scopedIds.has(p.id))
      return [...scoped, ...rest]
    },
    [questionPapers, getPapersForScope],
  )

  const getQuestionsByIds = useCallback(
    (ids: string[]) => questions.filter((q) => ids.includes(q.id)),
    [questions],
  )

  const value = useMemo(
    () => ({
      questions,
      questionPapers,
      loading,
      error,
      ensureLoaded,
      addPaperFromUpload,
      addPaperFromManualQuestions,
      publishPaper,
      createCustomPaper,
      getPaper,
      getPapersForScope,
      papersForAssessment,
      getQuestionsByIds,
      removePaper,
      removeQuestion,
      refresh,
    }),
    [
      questions,
      questionPapers,
      loading,
      error,
      ensureLoaded,
      addPaperFromUpload,
      addPaperFromManualQuestions,
      publishPaper,
      createCustomPaper,
      getPaper,
      getPapersForScope,
      papersForAssessment,
      getQuestionsByIds,
      removePaper,
      removeQuestion,
      refresh,
    ],
  )

  return <QuestionPaperContext.Provider value={value}>{children}</QuestionPaperContext.Provider>
}

export function useQuestionPapers() {
  const ctx = useContext(QuestionPaperContext)
  if (!ctx) throw new Error('useQuestionPapers must be used within QuestionPaperProvider')
  return ctx
}
