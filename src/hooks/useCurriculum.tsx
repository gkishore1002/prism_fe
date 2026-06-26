import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { curriculum as seedCurriculum } from '@/data/ownerMock'
import { tutorBatches as seedBatches, tutorStudents as seedStudents } from '@/data/mock'
import type { StudentSummary, TutorBatch } from '@/types'
import type { CurriculumBoard, CurriculumTopic } from '@/data/ownerMock'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'

interface CurriculumContextValue {
  curriculum: CurriculumBoard[]
  batches: TutorBatch[]
  students: StudentSummary[]
  addBoard: (name: string) => void
  addGrade: (board: string, grade: string) => void
  addSubject: (board: string, grade: string, subject: string) => void
  addTopic: (board: string, grade: string, subject: string, topic: string) => void
  addBatch: (
    batch: Omit<TutorBatch, 'id' | 'studentIds'> & { studentIds?: string[] },
  ) => string
  addStudentToBatch: (batchId: string, name: string) => void
  assignStudentToBatch: (studentId: string, batchId: string) => void
  removeStudentFromBatch: (studentId: string, batchId: string) => void
  getBatchesForScope: (board: string, grade: string) => TutorBatch[]
  getStudentsForBatch: (batchId: string) => StudentSummary[]
  getUnassignedStudents: (board: string, grade: string) => StudentSummary[]
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null)

function cloneCurriculum(data: CurriculumBoard[]): CurriculumBoard[] {
  return JSON.parse(JSON.stringify(data)) as CurriculumBoard[]
}

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculum] = useState<CurriculumBoard[]>(() => cloneCurriculum(seedCurriculum))
  const [batches, setBatches] = useState<TutorBatch[]>(() =>
    seedBatches.map((b) => ({ ...b, studentIds: [...b.studentIds] })),
  )
  const [students, setStudents] = useState<StudentSummary[]>(() => [...seedStudents])

  const addBoard = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCurriculum((prev) => {
      if (prev.some((b) => b.board === trimmed)) return prev
      return [
        ...prev,
        {
          board: trimmed,
          grades: [{ grade: 'Grade 8', subjects: [{ name: 'Mathematics', topics: [] }] }],
        },
      ]
    })
  }, [])

  const addGrade = useCallback((board: string, grade: string) => {
    const trimmed = grade.trim()
    if (!trimmed) return
    setCurriculum((prev) =>
      prev.map((b) => {
        if (b.board !== board) return b
        if (b.grades.some((g) => g.grade === trimmed)) return b
        return {
          ...b,
          grades: [
            ...b.grades,
            { grade: trimmed, subjects: [{ name: 'Mathematics', topics: [] }] },
          ],
        }
      }),
    )
  }, [])

  const addSubject = useCallback((board: string, grade: string, subject: string) => {
    const trimmed = subject.trim()
    if (!trimmed) return
    setCurriculum((prev) =>
      prev.map((b) => {
        if (b.board !== board) return b
        return {
          ...b,
          grades: b.grades.map((g) => {
            if (g.grade !== grade) return g
            if (g.subjects.some((s) => s.name === trimmed)) return g
            return { ...g, subjects: [...g.subjects, { name: trimmed, topics: [] }] }
          }),
        }
      }),
    )
  }, [])

  const addTopic = useCallback(
    (board: string, grade: string, subject: string, topic: string) => {
      const trimmed = topic.trim()
      if (!trimmed) return
      setCurriculum((prev) =>
        prev.map((b) => {
          if (b.board !== board) return b
          return {
            ...b,
            grades: b.grades.map((g) => {
              if (g.grade !== grade) return g
              return {
                ...g,
                subjects: g.subjects.map((s) => {
                  if (s.name !== subject) return s
                  if (s.topics.some((t) => t.name === trimmed)) return s
                  const entry: CurriculumTopic = { name: trimmed, questions: 0, mastery: 0 }
                  return { ...s, topics: [...s.topics, entry] }
                }),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const addBatch = useCallback(
    (batch: Omit<TutorBatch, 'id' | 'studentIds'> & { studentIds?: string[] }): string => {
      const { studentIds = [], subject, ...rest } = batch
      const id = `batch-${Date.now()}`
      const newBatch: TutorBatch = {
        ...rest,
        subject: subject?.trim() || undefined,
        studentIds: [...studentIds],
        id,
      }

      setBatches((prev) => [
        ...prev.map((b) => ({
          ...b,
          studentIds: b.studentIds.filter((sid) => !studentIds.includes(sid)),
        })),
        newBatch,
      ])

      if (studentIds.length > 0) {
        setStudents((prev) =>
          prev.map((s) =>
            studentIds.includes(s.id)
              ? { ...s, batch: newBatch.name, board: newBatch.board, grade: newBatch.grade }
              : s,
          ),
        )
      }

      return id
    },
    [],
  )

  const assignStudentToBatch = useCallback((studentId: string, batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const ids = b.studentIds.includes(studentId)
            ? b.studentIds
            : [...b.studentIds, studentId]
          return { ...b, studentIds: ids }
        }
        return { ...b, studentIds: b.studentIds.filter((id) => id !== studentId) }
      }),
    )

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, batch: batch.name, board: batch.board, grade: batch.grade }
          : s,
      ),
    )
  }, [batches])

  const addStudentToBatch = useCallback(
    (batchId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const batch = batches.find((b) => b.id === batchId)
      if (!batch) return

      const id = `stu-${Date.now()}`
      const student: StudentSummary = {
        id,
        name: trimmed,
        board: batch.board,
        grade: batch.grade,
        batch: batch.name,
        centerId: 'ctr-andheri',
        academicYear: '2025-26',
        health: 70,
        status: 'good',
        readiness: 50,
        lastAssessment: '—',
        criticalGaps: 0,
        improving: true,
      }

      setStudents((prev) => [...prev, student])
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId ? { ...b, studentIds: [...b.studentIds, id] } : b,
        ),
      )
    },
    [batches],
  )

  const removeStudentFromBatch = useCallback((studentId: string, batchId: string) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, studentIds: b.studentIds.filter((id) => id !== studentId) }
          : b,
      ),
    )
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, batch: undefined } : s)),
    )
  }, [])

  const getBatchesForScope = useCallback(
    (board: string, grade: string) =>
      batches.filter((b) => boardsMatch(b.board, board) && gradesMatch(b.grade, grade)),
    [batches],
  )

  const getStudentsForBatch = useCallback(
    (batchId: string) => {
      const batch = batches.find((b) => b.id === batchId)
      if (!batch) return []
      return students.filter((s) => batch.studentIds.includes(s.id))
    },
    [batches, students],
  )

  const getUnassignedStudents = useCallback(
    (board: string, grade: string) => {
      const assigned = new Set(batches.flatMap((b) => b.studentIds))
      return students.filter(
        (s) =>
          boardsMatch(s.board ?? 'CBSE', board) &&
          gradesMatch(s.grade, grade) &&
          !assigned.has(s.id),
      )
    },
    [batches, students],
  )

  const value = useMemo(
    () => ({
      curriculum,
      batches,
      students,
      addBoard,
      addGrade,
      addSubject,
      addTopic,
      addBatch,
      addStudentToBatch,
      assignStudentToBatch,
      removeStudentFromBatch,
      getBatchesForScope,
      getStudentsForBatch,
      getUnassignedStudents,
    }),
    [
      curriculum,
      batches,
      students,
      addBoard,
      addGrade,
      addSubject,
      addTopic,
      addBatch,
      addStudentToBatch,
      assignStudentToBatch,
      removeStudentFromBatch,
      getBatchesForScope,
      getStudentsForBatch,
      getUnassignedStudents,
    ],
  )

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>
}

export function useCurriculum() {
  const ctx = useContext(CurriculumContext)
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider')
  return ctx
}

export type { CurriculumBoard, CurriculumTopic }
