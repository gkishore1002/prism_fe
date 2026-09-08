import { useContext } from 'react'
import {
  AcademicYearsContext,
  type AcademicYearsContextValue,
} from '@/hooks/AcademicYearsProvider'

export { AcademicYearsProvider } from '@/hooks/AcademicYearsProvider'

export function useAcademicYears(): AcademicYearsContextValue {
  const ctx = useContext(AcademicYearsContext)
  if (!ctx) throw new Error('useAcademicYears must be used within AcademicYearsProvider')
  return ctx
}
