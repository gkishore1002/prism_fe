import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { beginStudentExam } from '@/lib/examFullscreen'

/** Starts or resumes an exam from a click so the browser can enter fullscreen. */
export function ExamStartButton({
  assessmentId,
  className,
  children,
}: {
  assessmentId: string
  className?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={className}
      onClick={() => void beginStudentExam(navigate, assessmentId)}
    >
      {children}
    </button>
  )
}
