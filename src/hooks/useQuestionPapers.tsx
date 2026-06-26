import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { questionPapers as seedPapers, questionBank as seedBank } from '@/data/mock'
import type { QuestionBankEntry, QuestionPaper, QuestionUploadRow } from '@/types'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'
import { totalMarksForQuestions, uniqueTopics } from '@/lib/questionPaperUtils'

function normalizeGrade(grade: string): string {
  return grade.startsWith('Grade') ? grade : `Grade ${grade}`
}

function normalizeDifficulty(value: string): QuestionBankEntry['difficulty'] {
  const d = value.toLowerCase()
  if (d === 'easy' || d === 'medium' || d === 'hard') return d
  return 'medium'
}

function rowToQuestion(row: QuestionUploadRow, id: string): QuestionBankEntry {
  return {
    id,
    board: row.board,
    grade: normalizeGrade(row.grade),
    subject: row.subject,
    chapter: row.chapter,
    topic: row.topic,
    difficulty: normalizeDifficulty(row.difficulty),
    marks: row.marks,
    questionType: row.questionType.toLowerCase().includes('short') ? 'short' : 'mcq',
    text: row.text,
    status: 'active',
  }
}

function withTopics(paper: Omit<QuestionPaper, 'topics'> & { topics?: string[] }, bank: QuestionBankEntry[]): QuestionPaper {
  const qs = bank.filter((q) => paper.questionIds.includes(q.id))
  return {
    ...paper,
    topics: paper.topics ?? uniqueTopics(qs),
    totalMarks: totalMarksForQuestions(qs),
  }
}

interface QuestionPaperContextValue {
  questions: QuestionBankEntry[]
  questionPapers: QuestionPaper[]
  addPaperFromUpload: (
    name: string,
    rows: QuestionUploadRow[],
    createdBy?: string,
  ) => QuestionPaper
  createCustomPaper: (
    name: string,
    parentPaperId: string,
    questionIds: string[],
    createdBy?: string,
  ) => QuestionPaper | null
  getPaper: (id: string) => QuestionPaper | undefined
  getPapersForScope: (board: string, grade: string, subject: string) => QuestionPaper[]
  getQuestionsByIds: (ids: string[]) => QuestionBankEntry[]
}

const QuestionPaperContext = createContext<QuestionPaperContextValue | null>(null)

export function QuestionPaperProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<QuestionBankEntry[]>(() => [...seedBank])
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>(() =>
    seedPapers.map((p) => withTopics({ ...p, source: p.source ?? 'upload' }, seedBank)),
  )

  const addPaperFromUpload = useCallback(
    (name: string, rows: QuestionUploadRow[], createdBy = 'tut-1') => {
      const valid = rows.filter((r) => r.valid)
      const newQuestions = valid.map((row, i) =>
        rowToQuestion(row, `q-up-${Date.now()}-${i}`),
      )
      setQuestions((prev) => [...prev, ...newQuestions])

      const board = newQuestions[0]?.board ?? 'CBSE'
      const grade = newQuestions[0]?.grade ?? 'Grade 8'
      const subject = newQuestions[0]?.subject ?? 'Mathematics'
      const ids = newQuestions.map((q) => q.id)
      const topics = uniqueTopics(newQuestions)

      const paper: QuestionPaper = {
        id: `qp-${Date.now()}`,
        name,
        board,
        grade,
        subject,
        questionIds: ids,
        topics,
        totalMarks: totalMarksForQuestions(newQuestions),
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy,
        source: 'upload',
      }
      setQuestionPapers((prev) => [paper, ...prev])
      return paper
    },
    [],
  )

  const createCustomPaper = useCallback(
    (name: string, parentPaperId: string, questionIds: string[], createdBy = 'tut-1') => {
      const parent = questionPapers.find((p) => p.id === parentPaperId)
      if (!parent || questionIds.length === 0) return null

      const subset = questions.filter(
        (q) => parent.questionIds.includes(q.id) && questionIds.includes(q.id),
      )
      if (subset.length === 0) return null

      const paper: QuestionPaper = {
        id: `qp-${Date.now()}`,
        name,
        board: parent.board,
        grade: parent.grade,
        subject: parent.subject,
        questionIds: subset.map((q) => q.id),
        topics: uniqueTopics(subset),
        totalMarks: totalMarksForQuestions(subset),
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy,
        source: 'custom',
        parentPaperId,
      }
      setQuestionPapers((prev) => [paper, ...prev])
      return paper
    },
    [questionPapers, questions],
  )

  const getPaper = useCallback(
    (id: string) => questionPapers.find((p) => p.id === id),
    [questionPapers],
  )

  const getPapersForScope = useCallback(
    (board: string, grade: string, subject: string) =>
      questionPapers.filter(
        (p) =>
          boardsMatch(p.board, board) &&
          gradesMatch(p.grade, grade) &&
          p.subject === subject,
      ),
    [questionPapers],
  )

  const getQuestionsByIds = useCallback(
    (ids: string[]) => questions.filter((q) => ids.includes(q.id)),
    [questions],
  )

  const value = useMemo(
    () => ({
      questions,
      questionPapers,
      addPaperFromUpload,
      createCustomPaper,
      getPaper,
      getPapersForScope,
      getQuestionsByIds,
    }),
    [
      questions,
      questionPapers,
      addPaperFromUpload,
      createCustomPaper,
      getPaper,
      getPapersForScope,
      getQuestionsByIds,
    ],
  )

  return <QuestionPaperContext.Provider value={value}>{children}</QuestionPaperContext.Provider>
}

export function useQuestionPapers() {
  const ctx = useContext(QuestionPaperContext)
  if (!ctx) throw new Error('useQuestionPapers must be used within QuestionPaperProvider')
  return ctx
}
