import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedStudyPlans, studyPlan21 } from '@/data/mock'
import type { StudyPlan, StudyPlanDay, StudyPlanTaskType } from '@/types'

interface StudyPlanContextValue {
  studyPlans: StudyPlan[]
  addStudyPlan: (plan: Omit<StudyPlan, 'id' | 'createdAt' | 'days'> & { days?: StudyPlanDay[] }) => string
  updateStudyPlan: (id: string, patch: Partial<StudyPlan>) => void
  toggleDayDone: (planId: string, dayId: string) => void
  getPlansForStudent: (studentId: string) => StudyPlan[]
  getPlansForBatch: (batchName: string) => StudyPlan[]
}

const StudyPlanContext = createContext<StudyPlanContextValue | null>(null)

function clonePlans(plans: StudyPlan[]): StudyPlan[] {
  return plans.map((p) => ({
    ...p,
    studentIds: [...p.studentIds],
    days: p.days.map((d) => ({ ...d })),
  }))
}

export function StudyPlanProvider({ children }: { children: ReactNode }) {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => clonePlans(seedStudyPlans))

  const addStudyPlan = useCallback(
    (
      plan: Omit<StudyPlan, 'id' | 'createdAt' | 'days'> & { days?: StudyPlanDay[] },
    ): string => {
      const id = `sp-${Date.now()}`
      const { days: inputDays, durationDays, ...rest } = plan
      const days =
        inputDays ??
        Array.from({ length: durationDays }, (_, i) => {
          const template = studyPlan21[i % studyPlan21.length]
          return {
            id: `spd-${Date.now()}-${i}`,
            day: i + 1,
            focus: template.focus,
            type: template.type as StudyPlanTaskType,
            mins: template.mins,
            topic: template.topic,
            done: false,
          }
        })

      const entry: StudyPlan = {
        ...rest,
        id,
        durationDays,
        days,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setStudyPlans((prev) => [entry, ...prev])
      return id
    },
    [],
  )

  const updateStudyPlan = useCallback((id: string, patch: Partial<StudyPlan>) => {
    setStudyPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const toggleDayDone = useCallback((planId: string, dayId: string) => {
    setStudyPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              days: p.days.map((d) => (d.id === dayId ? { ...d, done: !d.done } : d)),
            }
          : p,
      ),
    )
  }, [])

  const getPlansForStudent = useCallback(
    (studentId: string) =>
      studyPlans.filter(
        (p) => p.status === 'active' && p.studentIds.includes(studentId),
      ),
    [studyPlans],
  )

  const getPlansForBatch = useCallback(
    (batchName: string) => studyPlans.filter((p) => p.batchName === batchName),
    [studyPlans],
  )

  const value = useMemo(
    () => ({
      studyPlans,
      addStudyPlan,
      updateStudyPlan,
      toggleDayDone,
      getPlansForStudent,
      getPlansForBatch,
    }),
    [studyPlans, addStudyPlan, updateStudyPlan, toggleDayDone, getPlansForStudent, getPlansForBatch],
  )

  return <StudyPlanContext.Provider value={value}>{children}</StudyPlanContext.Provider>
}

export function useStudyPlans() {
  const ctx = useContext(StudyPlanContext)
  if (!ctx) throw new Error('useStudyPlans must be used within StudyPlanProvider')
  return ctx
}
