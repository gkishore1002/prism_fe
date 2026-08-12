import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as curriculumApi from '@/lib/api/curriculumApi'
import type { StudentSummary, TutorBatch } from '@/types'
import type { CurriculumBoard, CurriculumTopic } from '@/types/curriculum'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'

interface CurriculumContextValue {
  curriculum: CurriculumBoard[]
  batches: TutorBatch[]
  students: StudentSummary[]
  loading: boolean
  error: string | null
  addBoard: (name: string) => Promise<void>
  addGrade: (board: string, grade: string) => Promise<void>
  addSubject: (board: string, grade: string, subject: string) => Promise<void>
  addTopic: (board: string, grade: string, subject: string, topic: string) => Promise<void>
  addBatch: (
    batch: Omit<TutorBatch, 'id' | 'studentIds'> & { studentIds?: string[] },
  ) => Promise<string>
  addStudentToBatch: (batchId: string, name: string) => Promise<void>
  assignStudentToBatch: (studentId: string, batchId: string) => Promise<void>
  removeStudentFromBatch: (studentId: string, batchId: string) => Promise<void>
  removeBoard: (board: string) => Promise<void>
  removeGrade: (board: string, grade: string) => Promise<void>
  removeSubject: (board: string, grade: string, subject: string) => Promise<void>
  removeTopic: (board: string, grade: string, subject: string, topic: string) => Promise<void>
  removeBatch: (batchId: string) => Promise<void>
  getBatchesForScope: (board: string, grade: string) => TutorBatch[]
  getStudentsForBatch: (batchId: string) => StudentSummary[]
  loadStudentsForBatch: (batchId: string) => Promise<StudentSummary[]>
  getStudentsNotInBatch: (batchId: string) => StudentSummary[]
  /** @deprecated Use getStudentsNotInBatch — students can belong to multiple batches. */
  getUnassignedStudents: (batchId: string) => StudentSummary[]
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null)

async function loadFromApi() {
  const [curriculum, batches, students] = await Promise.all([
    curriculumApi.fetchCurriculum(),
    curriculumApi.fetchBatches(),
    curriculumApi.fetchStudents(),
  ])
  return { curriculum, batches, students }
}

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const [curriculum, setCurriculum] = useState<CurriculumBoard[]>([])
  const [batches, setBatches] = useState<TutorBatch[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated || role === 'student') return
    const isInitialLoad = curriculum.length === 0 && batches.length === 0
    if (isInitialLoad) setLoading(true)
    setError(null)
    try {
      const data = await loadFromApi()
      setCurriculum(data.curriculum)
      setBatches(data.batches)
      setStudents(data.students)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load curriculum'
      setError(message)
      throw new Error(message)
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }, [isAuthenticated, role, curriculum.length, batches.length])

  const ensureLoaded = useCallback(async () => {
    if (!isAuthenticated || role === 'student') return
    if (curriculum.length > 0 || batches.length > 0) return
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = refresh().finally(() => {
        loadPromiseRef.current = null
      })
    }
    await loadPromiseRef.current
  }, [isAuthenticated, role, curriculum.length, batches.length, refresh])

  useEffect(() => {
    if (!isAuthenticated || role === 'student') {
      setCurriculum([])
      setBatches([])
      setStudents([])
    }
  }, [isAuthenticated, role])

  const addBoard = useCallback(async (name: string) => {
    await curriculumApi.addBoard(name.trim())
    await refresh()
  }, [refresh])

  const addGrade = useCallback(async (board: string, grade: string) => {
    await curriculumApi.addGrade(board, grade.trim())
    await refresh()
  }, [refresh])

  const addSubject = useCallback(async (board: string, grade: string, subject: string) => {
    await curriculumApi.addSubject(board, grade, subject.trim())
    await refresh()
  }, [refresh])

  const addTopic = useCallback(
    async (board: string, grade: string, subject: string, topic: string) => {
      await curriculumApi.addTopic(board, grade, subject, topic.trim())
      await refresh()
    },
    [refresh],
  )

  const addBatch = useCallback(
    async (batch: Omit<TutorBatch, 'id' | 'studentIds'> & { studentIds?: string[] }) => {
      const { studentIds = [], subject, scheduleTiming, ...rest } = batch
      const created = await curriculumApi.createBatch({
        ...rest,
        subject: subject?.trim() || undefined,
        scheduleTiming: scheduleTiming?.trim() || undefined,
        studentIds,
      })
      await refresh()
      return created.id
    },
    [refresh],
  )

  const assignStudentToBatch = useCallback(
    async (studentId: string, batchId: string) => {
      await curriculumApi.assignStudentToBatchApi(batchId, studentId)
      await refresh()
    },
    [refresh],
  )

  const addStudentToBatch = useCallback(
    async (batchId: string, name: string) => {
      const batch = batches.find((b) => b.id === batchId)
      if (!batch) return
      await curriculumApi.createStudent({
        name: name.trim(),
        board: batch.board,
        grade: batch.grade,
        batch: batch.name,
      })
      await refresh()
    },
    [batches, refresh],
  )

  const removeStudentFromBatch = useCallback(
    async (studentId: string, batchId: string) => {
      await curriculumApi.removeStudentFromBatchApi(batchId, studentId)
      await refresh()
    },
    [refresh],
  )

  const removeBoard = useCallback(
    async (boardName: string) => {
      await curriculumApi.deleteBoard(boardName)
      await refresh()
    },
    [refresh],
  )

  const removeGrade = useCallback(
    async (boardName: string, gradeName: string) => {
      await curriculumApi.deleteGrade(boardName, gradeName)
      await refresh()
    },
    [refresh],
  )

  const removeSubject = useCallback(
    async (boardName: string, gradeName: string, subjectName: string) => {
      await curriculumApi.deleteSubject(boardName, gradeName, subjectName)
      await refresh()
    },
    [refresh],
  )

  const removeTopic = useCallback(
    async (boardName: string, gradeName: string, subjectName: string, topicName: string) => {
      await curriculumApi.deleteTopic(boardName, gradeName, subjectName, topicName)
      await refresh()
    },
    [refresh],
  )

  const removeBatch = useCallback(
    async (batchId: string) => {
      await curriculumApi.deleteBatch(batchId)
      await refresh()
    },
    [refresh],
  )

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

  const loadStudentsForBatch = useCallback(async (batchId: string) => {
    const list = await curriculumApi.fetchStudentsForBatch(batchId)
    const batch = batches.find((b) => b.id === batchId)
    if (batch) {
      const ids = new Set(list.map((s) => s.id))
      setStudents((prev) => {
        const kept = prev.filter((s) => !ids.has(s.id))
        return [...kept, ...list]
      })
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, studentIds: list.map((s) => s.id) } : b)),
      )
    }
    return list
  }, [batches])

  const getStudentsNotInBatch = useCallback(
    (batchId: string) => {
      const batch = batches.find((b) => b.id === batchId)
      const enrolled = new Set(batch?.studentIds ?? [])
      return students.filter((s) => !enrolled.has(s.id))
    },
    [batches, students],
  )

  const getUnassignedStudents = useCallback(
    (batchId: string) => getStudentsNotInBatch(batchId),
    [getStudentsNotInBatch],
  )

  const value = useMemo(
    () => ({
      curriculum,
      batches,
      students,
      loading,
      error,
      addBoard,
      addGrade,
      addSubject,
      addTopic,
      addBatch,
      addStudentToBatch,
      assignStudentToBatch,
      removeStudentFromBatch,
      removeBoard,
      removeGrade,
      removeSubject,
      removeTopic,
      removeBatch,
      getBatchesForScope,
      getStudentsForBatch,
      loadStudentsForBatch,
      getStudentsNotInBatch,
      getUnassignedStudents,
      refresh,
      ensureLoaded,
    }),
    [
      curriculum,
      batches,
      students,
      loading,
      error,
      addBoard,
      addGrade,
      addSubject,
      addTopic,
      addBatch,
      addStudentToBatch,
      assignStudentToBatch,
      removeStudentFromBatch,
      removeBoard,
      removeGrade,
      removeSubject,
      removeTopic,
      removeBatch,
      getBatchesForScope,
      getStudentsForBatch,
      loadStudentsForBatch,
      getStudentsNotInBatch,
      getUnassignedStudents,
      refresh,
      ensureLoaded,
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
