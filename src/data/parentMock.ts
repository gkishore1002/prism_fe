import { studentProfile } from '@/data/mock'

export const parentChild = {
  ...studentProfile,
  name: 'Arjun Mehta',
  school: 'Vidya Mandir Public School',
  tutorName: 'Mrs. Priya Nair',
}

export const parentComparative = {
  board: 'CBSE',
  grade: 8,
  studentAverage: 82,
  instituteAverage: 73,
  band: 'Top 40%',
  bandLabel: 'Above institute average',
}

export const parentBoardCoverage = {
  topicsCovered: 85,
  topicsMastered: 72,
  topicsPending: 15,
  subject: 'Mathematics',
}

export const parentPromotionReadiness = {
  board: 'CBSE',
  currentGrade: 8,
  score: 84,
  strong: ['Algebra', 'Arithmetic'],
  reinforce: ['Linear Equations', 'Geometry'],
}

export const parentExplanation = {
  headline: 'Geometry is the main blocker right now',
  body:
    'Arjun can solve direct geometry questions but struggles when multiple concepts are combined — especially mensuration word problems that mix area and perimeter. Focus on diagram-based practice for 15 minutes daily.',
  actions: [
    'Review chord vs tangent properties (Circles)',
    '15 diagram-based mensuration questions per day',
    'Parent check-in on daily practice consistency',
  ],
}

export const parentSchoolExamReadiness = [
  { exam: 'Quarterly Exam', subject: 'Mathematics', readiness: 82, risk: false },
  { exam: 'Quarterly Exam', subject: 'Science', readiness: 75, risk: false },
  { exam: 'Quarterly Exam', subject: 'English', readiness: 88, risk: false },
  { exam: 'Quarterly Exam', subject: 'Social Science', readiness: 58, risk: true },
]

export const parentAlerts = [
  {
    type: 'Score Drop',
    severity: 'high' as const,
    topic: 'Algebra · Linear Equations',
    detail: '72% → 48% over the last 3 tests. Word-problem translation is the pattern.',
    date: '2 days ago',
    parentNote: 'Encourage Arjun to write the equation before solving — not jump to arithmetic.',
  },
  {
    type: 'Consistency Drop',
    severity: 'medium' as const,
    topic: 'Science',
    detail: 'Accuracy varies ±22% across recent assessments.',
    date: '5 days ago',
    parentNote: 'Three sessions missed this week — consistency matters more than cramming.',
  },
  {
    type: 'Readiness Risk',
    severity: 'medium' as const,
    topic: 'Social Science',
    detail: 'Below threshold for Quarterly Exam readiness (58%).',
    date: '1 week ago',
    parentNote: 'Map-based revision for Indian geography recommended before the exam.',
  },
  {
    type: 'Missed Practice',
    severity: 'low' as const,
    topic: 'Daily plan',
    detail: '2 of 5 planned practice sessions skipped this week.',
    date: 'Yesterday',
    parentNote: 'A 20-minute daily slot after dinner works best for Arjun historically.',
  },
]
