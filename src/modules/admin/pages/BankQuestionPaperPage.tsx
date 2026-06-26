import { useParams } from 'react-router-dom'
import { QuestionPaperView } from '@/components/academic/QuestionPaperView'

export function AdminBankQuestionPaperPage() {
  const { paperId } = useParams<{ paperId: string }>()
  if (!paperId) return null
  return <QuestionPaperView paperId={paperId} />
}
