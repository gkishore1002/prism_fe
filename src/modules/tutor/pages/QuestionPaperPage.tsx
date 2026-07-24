import { useParams } from 'react-router-dom'
import { QuestionPaperView } from '@/components/academic/QuestionPaperView'

export function TutorQuestionPaperPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()

  if (!assessmentId) return null

  return <QuestionPaperView assessmentId={assessmentId} />
}