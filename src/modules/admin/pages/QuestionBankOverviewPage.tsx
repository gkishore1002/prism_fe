import { Link } from 'react-router-dom'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { QuestionBankPage } from '@/components/academic/QuestionBankPage'

export function AdminQuestionBankOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Owner · View only"
        title="Tutor question bank"
        sub="Question papers and the question library are created by tutors. Owners can browse and preview — not upload or edit."
      />
      <AppCard className="mb-6 border-accent/20 bg-accent/5">
        <p className="text-sm text-muted-foreground">
          To create question papers or schedule tests, switch to the{' '}
          <Link to="/tutor/question-bank" className="text-accent hover:underline">
            Tutor portal
          </Link>
          . This view is for institute oversight only.
        </p>
      </AppCard>
      <QuestionBankPage role="admin" readOnly />
    </>
  )
}
