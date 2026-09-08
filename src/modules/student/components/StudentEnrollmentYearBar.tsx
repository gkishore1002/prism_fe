import { useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { AppDropdown } from '@/components/ui/AppDropdown'
import {
  academicYearsApi,
  type StudentEnrollment,
} from '@/lib/api/academicYearsApi'
import { cn } from '@/lib/cn'

const STUDENT_ENROLLMENT_KEY = 'prism.studentActiveEnrollmentId'

export function StudentEnrollmentYearBar({
  className,
  onChange,
}: {
  className?: string
  onChange?: (enrollment: StudentEnrollment | null) => void
}) {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [activeId, setActiveId] = useState<string>(
    () => sessionStorage.getItem(STUDENT_ENROLLMENT_KEY) || '',
  )

  useEffect(() => {
    let cancelled = false
    void academicYearsApi
      .myEnrollments()
      .then((rows) => {
        if (cancelled) return
        const sorted = [...rows].sort((a, b) => b.academicYear.localeCompare(a.academicYear))
        setEnrollments(sorted)
        const stored = sessionStorage.getItem(STUDENT_ENROLLMENT_KEY)
        const match = sorted.find((e) => e.id === stored)
        const current = sorted.find((e) => e.isCurrent && e.status === 'active') ?? sorted[0]
        const chosen = match ?? current
        if (chosen) {
          setActiveId(chosen.id)
          sessionStorage.setItem(STUDENT_ENROLLMENT_KEY, chosen.id)
          onChange?.(chosen)
        } else {
          onChange?.(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnrollments([])
          onChange?.(null)
        }
      })
    return () => {
      cancelled = true
    }
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (enrollments.length <= 1) {
    const only = enrollments[0]
    if (!only) return null
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Academic year {only.academicYear} · {only.grade}
        {only.batch ? ` · ${only.batch}` : ''}
      </p>
    )
  }

  const active = enrollments.find((e) => e.id === activeId) ?? enrollments[0]

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="inline-flex items-center gap-1.5 min-w-[10rem]">
        <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <AppDropdown
          value={active?.id ?? ''}
          onChange={(id) => {
            const next = enrollments.find((row) => row.id === id) ?? null
            setActiveId(id)
            sessionStorage.setItem(STUDENT_ENROLLMENT_KEY, id)
            onChange?.(next)
          }}
          fullWidth={false}
          variant="inline"
          placeholder="Academic year"
          className="min-w-[9rem]"
          options={enrollments.map((e) => ({
            value: e.id,
            label: e.academicYear,
            description: [
              e.isCurrent ? 'Current' : null,
              e.status !== 'active' ? e.status : null,
              e.grade,
            ]
              .filter(Boolean)
              .join(' · '),
          }))}
        />
      </div>
      {active && (
        <span className="text-xs text-muted-foreground">
          {active.grade}
          {active.batch ? ` · ${active.batch}` : ''}
          {active.centerName ? ` · ${active.centerName}` : ''}
        </span>
      )}
    </div>
  )
}
