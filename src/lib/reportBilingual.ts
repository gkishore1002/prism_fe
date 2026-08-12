import type { AssessmentReport } from '@/types'

export function fallbackAssessmentSummaryTa(report: Pick<AssessmentReport, 'assessmentTitle' | 'accuracy'>): string {
  return `${report.assessmentTitle} தேர்வில் ${report.accuracy}% மதிப்பெண்.`
}

export function fallbackOverallSummaryTa(
  studentName: string,
  health: number,
  improving: boolean,
  criticalGaps: number,
): string {
  const trend = improving ? 'முன்னேற்றம் உள்ளது' : 'கவனம் தேவை'
  return `${studentName} அவர்களின் ஒட்டுமொத்த கற்றல் சுகாதாரம் ${health}% ஆக உள்ளது. ${trend}. ${criticalGaps} முக்கிய இடைவெளிகள் கண்டறியப்பட்டுள்ளன.`
}

export function fallbackGenomeNarrativeTa(
  name: string,
  overall: number,
  rank: number,
  totalStudents: number,
): string {
  return `${name} அவர்களின் ஒட்டுமொத்த மதிப்பெண் ${overall}% ஆகும். வகுப்பில் ${rank}/${totalStudents} இடம். விரிவான பகுப்பாய்வுக்கு CSC மையத்தை அணுகவும்.`
}
