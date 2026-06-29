import type {
  User,
  Institution,
  AppNotification,
  AcademicHealth,
  TopicMastery,
  LearningGap,
  RecoveryStep,
  ReadinessPrediction,
  AssessmentResult,
  StudentSummary,
  ClassInsight,
  TutorBatch,
  TutorCopilotSummary,
  TutorAssessmentSchedule,
  QuestionBankEntry,
  BatchTopicWeakness,
  QuestionPaper,
  AssessmentAttendanceRecord,
  InstitutionCenter,
  StudentMasterProfile,
  QuestionUploadRow,
  InstitutionMetric,
  BoardPerformance,
  Board,
  Grade,
  Subject,
  Chapter,
  Topic,
  StudentWiseReport,
  StudyPlan,
} from '@/types'

// ─── Hierarchy ────────────────────────────────────────────────────────────────

export const boards: Board[] = [
  { id: 'cbse', name: 'CBSE', code: 'CBSE' },
  { id: 'icse', name: 'ICSE', code: 'ICSE' },
  { id: 'state', name: 'State Board', code: 'STATE' },
]

export const grades: Grade[] = [
  { id: 'g8', boardId: 'cbse', name: 'Grade 8', level: 8 },
  { id: 'g9', boardId: 'cbse', name: 'Grade 9', level: 9 },
  { id: 'g10', boardId: 'cbse', name: 'Grade 10', level: 10 },
]

export const subjects: Subject[] = [
  { id: 'math', gradeId: 'g8', name: 'Mathematics', icon: 'calculator', color: '#6366f1' },
  { id: 'science', gradeId: 'g8', name: 'Science', icon: 'flask', color: '#10b981' },
  { id: 'english', gradeId: 'g8', name: 'English', icon: 'book', color: '#f59e0b' },
  { id: 'social', gradeId: 'g8', name: 'Social Science', icon: 'globe', color: '#8b5cf6' },
]

export const chapters: Chapter[] = [
  { id: 'ch-algebra', subjectId: 'math', name: 'Algebra', order: 1 },
  { id: 'ch-geometry', subjectId: 'math', name: 'Geometry', order: 2 },
  { id: 'ch-physics', subjectId: 'science', name: 'Physics', order: 1 },
  { id: 'ch-chemistry', subjectId: 'science', name: 'Chemistry', order: 2 },
]

export const topics: Topic[] = [
  { id: 't-linear', chapterId: 'ch-algebra', name: 'Linear Equations', weight: 0.25 },
  { id: 't-quad', chapterId: 'ch-algebra', name: 'Quadratic Equations', weight: 0.2 },
  { id: 't-triangles', chapterId: 'ch-geometry', name: 'Triangles', weight: 0.3 },
  { id: 't-circles', chapterId: 'ch-geometry', name: 'Circles', weight: 0.25 },
  { id: 't-motion', chapterId: 'ch-physics', name: 'Motion & Force', weight: 0.35 },
  { id: 't-atoms', chapterId: 'ch-chemistry', name: 'Atoms & Molecules', weight: 0.3 },
]

// ─── Users ────────────────────────────────────────────────────────────────────

export const institution: Institution = {
  id: 'inst-1',
  name: 'BrightPath Academy',
  type: 'coaching',
  boardIds: ['cbse'],
  studentCount: 342,
  tutorCount: 18,
}

export const currentStudent: User = {
  id: 'stu-1',
  name: 'Arjun Mehta',
  email: 'arjun@brightpath.edu',
  role: 'student',
  institutionId: 'inst-1',
  gradeId: 'g8',
  boardId: 'cbse',
}

export const currentTutor: User = {
  id: 'tut-1',
  name: 'Priya Sharma',
  email: 'priya@brightpath.edu',
  role: 'tutor',
  institutionId: 'inst-1',
}

export const currentAdmin: User = {
  id: 'adm-1',
  name: 'Rajesh Kumar',
  email: 'rajesh@brightpath.edu',
  role: 'admin',
  institutionId: 'inst-1',
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications: AppNotification[] = [
  {
    id: 'n-1',
    role: 'student',
    kind: 'warning',
    title: 'Practice streak at risk',
    message: 'Complete 10 minutes of Algebra practice today to keep your streak.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
    href: '/student/assessments',
  },
  {
    id: 'n-2',
    role: 'student',
    kind: 'ai',
    title: 'AI tip for Linear Equations',
    message: 'Try isolating the variable using inverse operations step-by-step.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    read: false,
    href: '/student/reports',
  },
  {
    id: 'n-3',
    role: 'tutor',
    kind: 'info',
    title: 'New assessment submissions',
    message: 'Batch A: 12 students completed “Topic Quiz — Linear Equations”.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    href: '/tutor/assessments',
  },
  {
    id: 'n-4',
    role: 'tutor',
    kind: 'risk',
    title: 'At-risk alert',
    message: '3 students are trending down in Algebra. Review gaps and assign recovery steps.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    read: true,
    href: '/tutor/students',
  },
  {
    id: 'n-5',
    role: 'admin',
    kind: 'success',
    title: 'Attendance sync complete',
    message: 'Assessment attendance is updated for the last 7 days.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    href: '/admin/assessments',
  },
  {
    id: 'n-6',
    role: 'admin',
    kind: 'info',
    title: 'Board performance updated',
    message: 'New monthly performance metrics are available in Reports.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    href: '/admin/reports',
  },
]

// ─── Student Intelligence ───────────────────────────────────────────────────

export const studentHealth: AcademicHealth = {
  overall: 72,
  status: 'good',
  trend: 4.2,
  subjects: [
    { subjectId: 'math', subjectName: 'Mathematics', health: 68, status: 'fair', trend: 2.1 },
    { subjectId: 'science', subjectName: 'Science', health: 81, status: 'good', trend: 5.8 },
    { subjectId: 'english', subjectName: 'English', health: 76, status: 'good', trend: 3.2 },
    { subjectId: 'social', subjectName: 'Social Science', health: 63, status: 'fair', trend: -1.4 },
  ],
}

export const topicMastery: TopicMastery[] = [
  { topicId: 't-linear', topicName: 'Linear Equations', chapterName: 'Algebra', subjectName: 'Mathematics', mastery: 45, trend: -3, questionsAttempted: 28, status: 'weak' },
  { topicId: 't-quad', topicName: 'Quadratic Equations', chapterName: 'Algebra', subjectName: 'Mathematics', mastery: 72, trend: 8, questionsAttempted: 22, status: 'good' },
  { topicId: 't-triangles', topicName: 'Triangles', chapterName: 'Geometry', subjectName: 'Mathematics', mastery: 88, trend: 4, questionsAttempted: 35, status: 'excellent' },
  { topicId: 't-circles', topicName: 'Circles', chapterName: 'Geometry', subjectName: 'Mathematics', mastery: 61, trend: 1, questionsAttempted: 18, status: 'fair' },
  { topicId: 't-motion', topicName: 'Motion & Force', chapterName: 'Physics', subjectName: 'Science', mastery: 84, trend: 6, questionsAttempted: 30, status: 'good' },
  { topicId: 't-atoms', topicName: 'Atoms & Molecules', chapterName: 'Chemistry', subjectName: 'Science', mastery: 78, trend: 5, questionsAttempted: 24, status: 'good' },
]

export const learningGaps: LearningGap[] = [
  {
    id: 'gap-1',
    topicId: 't-linear',
    topicName: 'Linear Equations',
    subjectName: 'Mathematics',
    severity: 'high',
    impactOnScore: 12,
    rootCause: 'Difficulty translating word problems into equations',
    recommendedAction: 'Practice 15 word-problem sets with step-by-step modeling',
  },
  {
    id: 'gap-2',
    topicId: 't-circles',
    topicName: 'Circles',
    subjectName: 'Mathematics',
    severity: 'medium',
    impactOnScore: 6,
    rootCause: 'Inconsistent application of chord and tangent theorems',
    recommendedAction: 'Review theorem reference sheet + 10 targeted problems',
  },
  {
    id: 'gap-3',
    topicId: 't-linear',
    topicName: 'Linear Equations',
    subjectName: 'Mathematics',
    severity: 'medium',
    impactOnScore: 5,
    rootCause: 'Sign errors when isolating variables',
    recommendedAction: 'Complete sign-handling drill module (20 min)',
  },
]

export const recoveryPlan: RecoveryStep[] = [
  { id: 'r1', topicName: 'Linear Equations', subjectName: 'Mathematics', action: 'Word problem modeling practice', estimatedHours: 3, expectedGain: 18, priority: 1, completed: false },
  { id: 'r2', topicName: 'Linear Equations', subjectName: 'Mathematics', action: 'Sign handling drill module', estimatedHours: 0.5, expectedGain: 8, priority: 2, completed: false },
  { id: 'r3', topicName: 'Circles', subjectName: 'Mathematics', action: 'Chord & tangent theorem review', estimatedHours: 2, expectedGain: 12, priority: 3, completed: false },
  { id: 'r4', topicName: 'Social Science', subjectName: 'Social Science', action: 'Map-based revision for Indian geography', estimatedHours: 2, expectedGain: 10, priority: 4, completed: true },
]

export const readinessPredictions: ReadinessPrediction[] = [
  { subjectId: 'math', subjectName: 'Mathematics', currentReadiness: 68, projectedReadiness: 84, examDate: '2026-03-15', confidenceLevel: 'high' },
  { subjectId: 'science', subjectName: 'Science', currentReadiness: 81, projectedReadiness: 91, examDate: '2026-03-18', confidenceLevel: 'high' },
  { subjectId: 'english', subjectName: 'English', currentReadiness: 76, projectedReadiness: 82, examDate: '2026-03-20', confidenceLevel: 'medium' },
  { subjectId: 'social', subjectName: 'Social Science', currentReadiness: 63, projectedReadiness: 75, examDate: '2026-03-22', confidenceLevel: 'medium' },
]

export const recentAssessments: AssessmentResult[] = [
  {
    id: 'a1',
    title: 'Unit Test — Algebra',
    subjectName: 'Mathematics',
    date: '2026-06-18',
    score: 18,
    maxScore: 25,
    accuracy: 72,
    timeSpent: 42,
    weakTopics: ['Linear Equations'],
    strongTopics: ['Quadratic Equations'],
    insight: '72% score driven by Linear Equations weakness. Fixing this topic alone could raise your score to 84%.',
  },
  {
    id: 'a2',
    title: 'Chapter Quiz — Motion',
    subjectName: 'Science',
    date: '2026-06-14',
    score: 22,
    maxScore: 25,
    accuracy: 88,
    timeSpent: 28,
    weakTopics: [],
    strongTopics: ['Motion & Force'],
    insight: 'Strong performance. You\'re exam-ready for this chapter.',
  },
  {
    id: 'a3',
    title: 'Diagnostic — Geometry',
    subjectName: 'Mathematics',
    date: '2026-06-10',
    score: 15,
    maxScore: 25,
    accuracy: 60,
    timeSpent: 50,
    weakTopics: ['Circles'],
    strongTopics: ['Triangles'],
    insight: 'Triangles mastery is excellent. Circles needs focused revision — 2 hours could add 10%.',
  },
]

export const healthTrend = [
  { week: 'W1', health: 64 },
  { week: 'W2', health: 66 },
  { week: 'W3', health: 65 },
  { week: 'W4', health: 68 },
  { week: 'W5', health: 70 },
  { week: 'W6', health: 72 },
]

// ─── Institution centers (branches) ───────────────────────────────────────────

export const institutionCenters: InstitutionCenter[] = [
  { id: 'ctr-andheri', name: 'Andheri West', city: 'Mumbai', studentCount: 142, batchCount: 8 },
  { id: 'ctr-borivali', name: 'Borivali', city: 'Mumbai', studentCount: 98, batchCount: 6 },
  { id: 'ctr-thane', name: 'Thane', city: 'Thane', studentCount: 76, batchCount: 5 },
  { id: 'ctr-pune', name: 'Pune Kothrud', city: 'Pune', studentCount: 26, batchCount: 2 },
]

export const studentMasterProfiles: StudentMasterProfile[] = [
  { id: 'stu-1', name: 'Arjun Mehta', board: 'CBSE', grade: '8', batch: 'Batch A', centerId: 'ctr-andheri', academicYear: '2025-26', schoolName: 'DPS Andheri', email: 'arjun@brightpath.edu', status: 'active' },
  { id: 'stu-2', name: 'Sneha Patel', board: 'CBSE', grade: '8', batch: 'Batch A', centerId: 'ctr-andheri', academicYear: '2025-26', status: 'active' },
  { id: 'stu-3', name: 'Rohan Das', board: 'CBSE', grade: '8', batch: 'Batch A', centerId: 'ctr-borivali', academicYear: '2025-26', status: 'active' },
  { id: 'stu-4', name: 'Ananya Iyer', board: 'CBSE', grade: '8', batch: 'Batch B', centerId: 'ctr-andheri', academicYear: '2025-26', status: 'active' },
  { id: 'stu-5', name: 'Vikram Singh', board: 'CBSE', grade: '8', batch: 'Batch B', centerId: 'ctr-thane', academicYear: '2025-26', status: 'active' },
  { id: 'stu-6', name: 'Kavya Reddy', board: 'CBSE', grade: '8', batch: 'Batch C', centerId: 'ctr-borivali', academicYear: '2025-26', status: 'active' },
  { id: 'stu-7', name: 'Ishaan Kapoor', board: 'CBSE', grade: '8', batch: 'Batch A', centerId: 'ctr-pune', academicYear: '2025-26', status: 'active' },
  { id: 'stu-8', name: 'Priya Nair', board: 'CBSE', grade: '9', batch: 'Batch D', centerId: 'ctr-thane', academicYear: '2025-26', status: 'active' },
]

export const questionUploadPreview: QuestionUploadRow[] = [
  { row: 2, board: 'CBSE', grade: '8', subject: 'Mathematics', chapter: 'Algebra', topic: 'Linear Equations', difficulty: 'Medium', marks: 2, questionType: 'MCQ', text: 'Solve 3x − 5 = 10', valid: true, errors: [] },
  { row: 3, board: 'CBSE', grade: '8', subject: 'Mathematics', chapter: 'Geometry', topic: 'Mensuration', difficulty: 'Hard', marks: 3, questionType: 'MCQ', text: 'Find area of trapezium with parallel sides 8cm and 12cm', valid: true, errors: [] },
  { row: 4, board: 'CBSE', grade: '', subject: 'Mathematics', chapter: 'Algebra', topic: 'Linear Equations', difficulty: 'Easy', marks: 1, questionType: 'MCQ', text: 'What is 2 + 2?', valid: false, errors: ['Grade is required'] },
  { row: 5, board: 'CBSE', grade: '8', subject: 'Mathematics', chapter: 'Algebra', topic: 'Linear Equations', difficulty: 'Invalid', marks: 2, questionType: 'MCQ', text: 'Solve x + 1 = 5', valid: false, errors: ['Difficulty must be Easy / Medium / Hard'] },
  { row: 6, board: 'CBSE', grade: '8', subject: 'Science', chapter: 'Physics', topic: 'Motion & Force', difficulty: 'Medium', marks: 2, questionType: 'MCQ', text: 'Define acceleration', valid: true, errors: [] },
]

// ─── Tutor Intelligence ───────────────────────────────────────────────────────

export const tutorStudents: StudentSummary[] = [
  { id: 'stu-1', name: 'Arjun Mehta', grade: 'Grade 8', board: 'CBSE', batch: 'Batch A', centerId: 'ctr-andheri', academicYear: '2025-26', health: 72, status: 'good', readiness: 68, lastAssessment: '2026-06-18', criticalGaps: 1, improving: true },
  { id: 'stu-2', name: 'Sneha Patel', grade: 'Grade 8', board: 'CBSE', batch: 'Batch A', centerId: 'ctr-andheri', academicYear: '2025-26', health: 85, status: 'excellent', readiness: 88, lastAssessment: '2026-06-17', criticalGaps: 0, improving: true },
  { id: 'stu-3', name: 'Rohan Das', grade: 'Grade 8', board: 'CBSE', batch: 'Batch A', centerId: 'ctr-borivali', academicYear: '2025-26', health: 54, status: 'weak', readiness: 48, lastAssessment: '2026-06-16', criticalGaps: 3, improving: false },
  { id: 'stu-4', name: 'Ananya Iyer', grade: 'Grade 8', board: 'CBSE', batch: 'Batch B', centerId: 'ctr-andheri', academicYear: '2025-26', health: 78, status: 'good', readiness: 74, lastAssessment: '2026-06-18', criticalGaps: 1, improving: true },
  { id: 'stu-5', name: 'Vikram Singh', grade: 'Grade 8', board: 'CBSE', batch: 'Batch B', centerId: 'ctr-thane', academicYear: '2025-26', health: 61, status: 'fair', readiness: 58, lastAssessment: '2026-06-15', criticalGaps: 2, improving: false },
  { id: 'stu-6', name: 'Kavya Reddy', grade: 'Grade 8', board: 'CBSE', batch: 'Batch C', centerId: 'ctr-borivali', academicYear: '2025-26', health: 91, status: 'excellent', readiness: 93, lastAssessment: '2026-06-17', criticalGaps: 0, improving: true },
]

export const tutorCopilot: TutorCopilotSummary = {
  board: 'CBSE',
  grade: 'Grade 8',
  subject: 'Mathematics',
  batchName: 'Batch A',
  studentCount: 35,
  strongTopics: ['Algebra', 'Fractions'],
  weakTopics: ['Geometry', 'Mensuration', 'Probability'],
  nextClass: 'Mensuration Revision',
  expectedImprovement: 8,
  avgScore: 76,
}

export const tutorBatches: TutorBatch[] = [
  {
    id: 'batch-a',
    name: 'Batch A',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    studentIds: ['stu-1', 'stu-2', 'stu-3'],
    avgScore: 76,
  },
  {
    id: 'batch-b',
    name: 'Batch B',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    studentIds: ['stu-4', 'stu-5'],
    avgScore: 81,
  },
  {
    id: 'batch-c',
    name: 'Batch C',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Science',
    studentIds: ['stu-6'],
    avgScore: 74,
  },
]

export const batchTopicWeakness: BatchTopicWeakness[] = [
  { rank: 1, topic: 'Geometry', avgMastery: 52, suggestedNextClass: 'Mensuration Revision', expectedGain: 8 },
  { rank: 2, topic: 'Mensuration', avgMastery: 58, suggestedNextClass: 'Diagram-based practice', expectedGain: 6 },
  { rank: 3, topic: 'Probability', avgMastery: 64, suggestedNextClass: 'Real-world examples drill' },
]

export const tutorAssessments: TutorAssessmentSchedule[] = [
  {
    id: 'ta-1',
    title: 'Chapter Test — Mensuration',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    scope: 'chapter',
    mode: 'assessment',
    batchName: 'Batch A',
    questionCount: 25,
    durationMinutes: 45,
    scheduledAt: '2026-06-28',
    status: 'scheduled',
    centerIds: ['ctr-andheri', 'ctr-borivali'],
    selectedQuestionIds: ['q-2', 'q-3', 'q-4'],
    assignedStudentIds: ['stu-1', 'stu-2', 'stu-4'],
    createdByTutorId: 'tut-1',
    chapter: 'Geometry',
  },
  {
    id: 'ta-2',
    title: 'Topic Quiz — Linear Equations',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    scope: 'topic',
    mode: 'practice',
    batchName: 'Batch A',
    questionCount: 10,
    durationMinutes: 15,
    scheduledAt: '2026-06-25',
    status: 'live',
    centerIds: ['ctr-andheri'],
    selectedQuestionIds: ['q-1', 'q-8'],
    assignedStudentIds: ['stu-1', 'stu-2'],
    createdByTutorId: 'tut-1',
    topic: 'Linear Equations',
  },
  {
    id: 'ta-3',
    title: 'Unit Test — Algebra',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    scope: 'subject',
    mode: 'assessment',
    batchName: 'Batch A',
    questionCount: 25,
    durationMinutes: 50,
    scheduledAt: '2026-06-18',
    status: 'completed',
    classAvg: 72,
    centerIds: ['ctr-andheri', 'ctr-borivali', 'ctr-thane'],
    selectedQuestionIds: ['q-1', 'q-6'],
    assignedStudentIds: ['stu-1', 'stu-2', 'stu-4'],
    createdByTutorId: 'tut-1',
  },
  {
    id: 'ta-4',
    title: 'Diagnostic — Geometry',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    scope: 'chapter',
    mode: 'assessment',
    batchName: 'Batch B',
    questionCount: 20,
    durationMinutes: 40,
    scheduledAt: '2026-06-10',
    status: 'completed',
    classAvg: 60,
    centerIds: ['ctr-borivali'],
    selectedQuestionIds: ['q-2', 'q-3'],
    assignedStudentIds: ['stu-4', 'stu-6'],
    createdByTutorId: 'tut-1',
    chapter: 'Geometry',
  },
  {
    id: 'ta-5',
    title: 'Motion & Force Practice',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Science',
    scope: 'topic',
    mode: 'practice',
    batchName: 'Batch C',
    questionCount: 12,
    durationMinutes: 20,
    scheduledAt: '2026-06-30',
    status: 'draft',
    centerIds: [],
    selectedQuestionIds: ['q-5'],
    assignedStudentIds: ['stu-6'],
    createdByTutorId: 'tut-1',
    topic: 'Motion & Force',
  },
  {
    id: 'ta-icse-demo',
    title: 'ICSE Algebra Diagnostic',
    board: 'ICSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    scope: 'subject',
    mode: 'assessment',
    batchName: 'Batch A',
    questionCount: 20,
    durationMinutes: 40,
    scheduledAt: '2026-06-26',
    status: 'live',
    centerIds: ['ctr-andheri'],
    selectedQuestionIds: ['q-1'],
    assignedStudentIds: ['stu-1'],
    createdByTutorId: 'tut-1',
  },
]

export const tutorNameById: Record<string, string> = {
  'tut-1': 'Priya Sharma',
}

export const assessmentAttendanceByTest: Record<string, AssessmentAttendanceRecord[]> = {
  'ta-1': [
    { studentId: 'stu-1', studentName: 'Arjun Mehta', status: 'pending' },
    { studentId: 'stu-2', studentName: 'Sneha Patel', status: 'pending' },
    { studentId: 'stu-4', studentName: 'Ananya Iyer', status: 'pending' },
  ],
  'ta-2': [
    { studentId: 'stu-1', studentName: 'Arjun Mehta', status: 'attended', score: 80, timeSpentMin: 12, submittedAt: '2026-06-25 09:14' },
    { studentId: 'stu-2', studentName: 'Sneha Patel', status: 'pending' },
  ],
  'ta-3': [
    { studentId: 'stu-1', studentName: 'Arjun Mehta', status: 'attended', score: 72, timeSpentMin: 48, submittedAt: '2026-06-18 10:42' },
    { studentId: 'stu-2', studentName: 'Sneha Patel', status: 'attended', score: 88, timeSpentMin: 44, submittedAt: '2026-06-18 10:38' },
    { studentId: 'stu-4', studentName: 'Ananya Iyer', status: 'absent' },
  ],
  'ta-4': [
    { studentId: 'stu-4', studentName: 'Ananya Iyer', status: 'attended', score: 65, timeSpentMin: 38, submittedAt: '2026-06-10 11:05' },
    { studentId: 'stu-6', studentName: 'Kavya Reddy', status: 'attended', score: 55, timeSpentMin: 40, submittedAt: '2026-06-10 11:12' },
  ],
  'ta-icse-demo': [
    { studentId: 'stu-1', studentName: 'Arjun Mehta', status: 'attended', score: 68, timeSpentMin: 35, submittedAt: '2026-06-26 14:20' },
  ],
}

export function getAttendanceForAssessment(assessmentId: string, invitedIds: string[]): AssessmentAttendanceRecord[] {
  const stored = assessmentAttendanceByTest[assessmentId]
  if (stored) return stored
  return invitedIds.map((id) => {
    const profile = studentMasterProfiles.find((s) => s.id === id)
    return {
      studentId: id,
      studentName: profile?.name ?? id,
      status: 'pending' as const,
    }
  })
}

export const questionBank: QuestionBankEntry[] = [
  {
    id: 'q-1',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Algebra',
    topic: 'Linear Equations',
    difficulty: 'medium',
    marks: 2,
    questionType: 'mcq',
    text: 'Solve for x: 2x + 3 = 11',
    status: 'active',
    optionA: '4',
    optionB: '5',
    optionC: '6',
    optionD: '7',
    correctAnswer: 'A',
  },
  {
    id: 'q-2',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Geometry',
    topic: 'Mensuration',
    difficulty: 'hard',
    marks: 3,
    questionType: 'mcq',
    text: 'A cylinder has radius 7 cm and height 10 cm. Find its volume.',
    status: 'active',
  },
  {
    id: 'q-3',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Geometry',
    topic: 'Circles',
    difficulty: 'medium',
    marks: 2,
    questionType: 'mcq',
    text: 'If the diameter of a circle is 14 cm, what is its circumference?',
    status: 'active',
  },
  {
    id: 'q-4',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Statistics',
    topic: 'Probability',
    difficulty: 'easy',
    marks: 1,
    questionType: 'mcq',
    text: 'A fair die is rolled once. What is the probability of getting an even number?',
    status: 'active',
  },
  {
    id: 'q-5',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Science',
    chapter: 'Physics',
    topic: 'Motion & Force',
    difficulty: 'medium',
    marks: 2,
    questionType: 'mcq',
    text: 'A car accelerates from rest to 20 m/s in 5 seconds. Find its acceleration.',
    status: 'active',
  },
  {
    id: 'q-6',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Algebra',
    topic: 'Quadratic Equations',
    difficulty: 'hard',
    marks: 3,
    questionType: 'short',
    text: 'Find the roots of x² − 5x + 6 = 0.',
    status: 'draft',
  },
  {
    id: 'q-7',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Geometry',
    topic: 'Geometry',
    difficulty: 'medium',
    marks: 2,
    questionType: 'mcq',
    text: 'The sum of angles in a triangle is —',
    status: 'active',
    optionA: '90°',
    optionB: '180°',
    optionC: '270°',
    optionD: '360°',
    correctAnswer: 'B',
  },
  {
    id: 'q-8',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    chapter: 'Algebra',
    topic: 'Linear Equations',
    difficulty: 'easy',
    marks: 1,
    questionType: 'mcq',
    text: 'If 3x = 15, then x equals —',
    status: 'active',
    optionA: '3',
    optionB: '5',
    optionC: '12',
    optionD: '45',
    correctAnswer: 'B',
  },
  {
    id: 'q-9',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Science',
    chapter: 'Physics',
    topic: 'Force & Pressure',
    difficulty: 'medium',
    marks: 2,
    questionType: 'mcq',
    text: 'Pressure is defined as force per unit —',
    status: 'active',
  },
]

export const questionPapers: QuestionPaper[] = [
  {
    id: 'qp-1',
    name: 'Algebra Unit — Linear & Quadratic',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    questionIds: ['q-1', 'q-8'],
    topics: ['Linear Equations', 'Quadratic Equations'],
    totalMarks: 3,
    createdAt: '2026-06-20',
    createdBy: 'tut-1',
    source: 'upload',
  },
  {
    id: 'qp-2',
    name: 'Geometry Mixed Paper',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    questionIds: ['q-2', 'q-3', 'q-7'],
    topics: ['Mensuration', 'Circles', 'Geometry'],
    totalMarks: 7,
    createdAt: '2026-06-18',
    createdBy: 'tut-1',
    source: 'upload',
  },
  {
    id: 'qp-3',
    name: 'Science Physics Quick Test',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Science',
    questionIds: ['q-5', 'q-9'],
    topics: ['Motion & Force', 'Force & Pressure'],
    totalMarks: 4,
    createdAt: '2026-06-15',
    createdBy: 'tut-1',
    source: 'upload',
  },
]

export const classInsights: ClassInsight[] = [
  {
    id: 'ci-1',
    title: 'Class-wide gap in Linear Equations',
    description: '58% of students struggle with word-problem translation in Linear Equations',
    affectedStudents: 14,
    topicName: 'Linear Equations',
    subjectName: 'Mathematics',
    severity: 'high',
    suggestedIntervention: 'Conduct a 45-min group session on word-problem modeling',
  },
  {
    id: 'ci-2',
    title: 'Circles theorem confusion',
    description: 'Students consistently mix up chord and tangent properties',
    affectedStudents: 9,
    topicName: 'Circles',
    subjectName: 'Mathematics',
    severity: 'medium',
    suggestedIntervention: 'Distribute visual theorem comparison chart',
  },
  {
    id: 'ci-3',
    title: 'Rohan needs immediate attention',
    description: '3 critical gaps, declining trend over 3 weeks, readiness at 48%',
    affectedStudents: 1,
    topicName: 'Multiple',
    subjectName: 'Mathematics',
    severity: 'high',
    suggestedIntervention: 'Schedule 1-on-1 diagnostic review this week',
  },
]

// ─── Admin Intelligence ───────────────────────────────────────────────────────

export const institutionMetrics: InstitutionMetric[] = [
  { label: 'Academic Health', value: '74%', change: 3.2, trend: 'up' },
  { label: 'Active Students', value: 342, change: 12, trend: 'up' },
  { label: 'Assessments This Month', value: 1284, change: 18, trend: 'up' },
  { label: 'Avg. Improvement Rate', value: '5.8%', change: 1.1, trend: 'up' },
  { label: 'Critical Gaps', value: 47, change: -8, trend: 'down' },
  { label: 'Recovery Completion', value: '68%', change: 4.5, trend: 'up' },
]

export const boardPerformance: BoardPerformance[] = [
  { boardId: 'cbse', boardName: 'CBSE', avgHealth: 74, studentCount: 280, assessmentCount: 1050, improvementRate: 5.8 },
  { boardId: 'icse', boardName: 'ICSE', avgHealth: 78, studentCount: 42, assessmentCount: 168, improvementRate: 6.2 },
  { boardId: 'state', boardName: 'State Board', avgHealth: 69, studentCount: 20, assessmentCount: 66, improvementRate: 4.1 },
]

export const subjectHealthDistribution = [
  { subject: 'Mathematics', health: 68, students: 342 },
  { subject: 'Science', health: 76, students: 342 },
  { subject: 'English', health: 72, students: 342 },
  { subject: 'Social Science', health: 65, students: 342 },
]

export const monthlyTrend = [
  { month: 'Jan', health: 66, assessments: 890 },
  { month: 'Feb', health: 68, assessments: 920 },
  { month: 'Mar', health: 67, assessments: 1100 },
  { month: 'Apr', health: 70, assessments: 1050 },
  { month: 'May', health: 72, assessments: 1180 },
  { month: 'Jun', health: 74, assessments: 1284 },
]

// ─── Student portal (learnova-style) ───────────────────────────────────────

export const studentProfile = {
  name: 'Arjun Mehta',
  board: 'CBSE',
  grade: 8,
  batch: 'Batch A',
  streak: 5,
  healthScore: studentHealth.overall,
  improvement: 43,
  readiness: 78,
}

export const studentSubjects = studentHealth.subjects.map((s) => ({
  name: s.subjectName,
  score: s.health,
}))

export const topicBreakdown = [
  { subject: 'Mathematics', topic: 'Linear Equations', score: 45, status: 'weak' as const },
  { subject: 'Mathematics', topic: 'Quadratic Equations', score: 72, status: 'ok' as const },
  { subject: 'Mathematics', topic: 'Triangles', score: 88, status: 'strong' as const },
  { subject: 'Mathematics', topic: 'Circles', score: 61, status: 'ok' as const },
  { subject: 'Science', topic: 'Motion & Force', score: 84, status: 'strong' as const },
  { subject: 'Science', topic: 'Atoms & Molecules', score: 78, status: 'ok' as const },
  { subject: 'English', topic: 'Comprehension', score: 76, status: 'ok' as const },
  { subject: 'Social Science', topic: 'Indian Geography', score: 58, status: 'weak' as const },
]

export const improvementTrend = [
  { month: 'Jan', score: 35 },
  { month: 'Feb', score: 48 },
  { month: 'Mar', score: 61 },
  { month: 'Apr', score: 68 },
  { month: 'May', score: 72 },
  { month: 'Jun', score: 78 },
]

export const readinessBySubject = readinessPredictions.map((r) => ({
  subject: r.subjectName.split(' ')[0],
  readiness: r.currentReadiness,
  target: 'Quarterly',
}))

export const aiDiagnosis = {
  topic: learningGaps[0]?.topicName ?? 'Linear Equations',
  finding: learningGaps[0]?.rootCause ?? 'Difficulty translating word problems into equations.',
  cause: 'Weak modelling when multiple steps are required in word problems.',
  recommendation: learningGaps[0]?.recommendedAction ?? 'Practice 15 word-problem sets with step-by-step modeling.',
  expectedLift: learningGaps[0]?.impactOnScore ?? 12,
}

export const practiceQuestions = [
  {
    id: 1,
    topic: 'Algebra · Linear Eq.',
    marks: 1,
    difficulty: 'Medium',
    q: 'Solve: 2x + 5 = 17',
    options: ['x = 4', 'x = 6', 'x = 8', 'x = 11'],
    correct: 1,
    solution: '2x = 12, therefore x = 6.',
  },
  {
    id: 2,
    topic: 'Geometry · Triangles',
    marks: 1,
    difficulty: 'Medium',
    q: 'Two angles of a triangle are 55° and 65°. Find the third angle.',
    options: ['50°', '60°', '70°', '80°'],
    correct: 1,
    solution: 'Sum = 180°. Third angle = 180 − 55 − 65 = 60°.',
  },
  {
    id: 3,
    topic: 'Algebra · Word problems',
    marks: 2,
    difficulty: 'Hard',
    q: 'A number increased by 8 equals 3 times the number minus 4. Find the number.',
    options: ['4', '6', '8', '10'],
    correct: 1,
    solution: 'x + 8 = 3x − 4 → 12 = 2x → x = 6.',
  },
]

export const studyPlan21 = Array.from({ length: 21 }).map((_, i) => {
  const cycle = [
    { focus: 'Linear Equations — Word problem modeling', type: 'Revise' as const, mins: 25, topic: 'Linear Equations' },
    { focus: 'Linear Equations — 15 practice MCQs', type: 'Practice' as const, mins: 30, topic: 'Linear Equations' },
    { focus: 'Circles — Chord & tangent theorems', type: 'Revise' as const, mins: 20, topic: 'Circles' },
    { focus: 'Circles — Mixed diagram problems', type: 'Practice' as const, mins: 35, topic: 'Circles' },
    { focus: 'Triangles — Properties refresh', type: 'Revise' as const, mins: 20, topic: 'Geometry' },
    { focus: 'Triangles — Application set', type: 'Practice' as const, mins: 30, topic: 'Geometry' },
    { focus: 'Social Science — Map revision', type: 'Review' as const, mins: 40, topic: 'Geography' },
  ]
  const item = cycle[i % cycle.length]
  return {
    id: `spd-seed-${i + 1}`,
    day: i + 1,
    ...item,
    done: i < 6,
  }
})

export const seedStudyPlans: StudyPlan[] = [
  {
    id: 'sp-1',
    title: '21-day Math Recovery Plan',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    batchName: 'Batch A',
    studentIds: ['stu-1', 'stu-2', 'stu-3', 'stu-7'],
    baselineScore: 60,
    targetScore: 80,
    durationDays: 21,
    days: studyPlan21,
    status: 'active',
    createdByTutorId: 'tut-1',
    createdAt: '2026-06-01',
  },
  {
    id: 'sp-2',
    title: 'Circles Intensive — 7 days',
    board: 'CBSE',
    grade: 'Grade 8',
    subject: 'Mathematics',
    batchName: 'Batch B',
    studentIds: ['stu-4', 'stu-5'],
    baselineScore: 55,
    targetScore: 75,
    durationDays: 7,
    days: [
      { id: 'spd-2-1', day: 1, focus: 'Circle theorems — revision', type: 'Revise', mins: 25, topic: 'Circles', done: true },
      { id: 'spd-2-2', day: 2, focus: 'Chord problems — 10 MCQs', type: 'Practice', mins: 30, topic: 'Circles', done: true },
      { id: 'spd-2-3', day: 3, focus: 'Tangent & secant diagrams', type: 'Practice', mins: 35, topic: 'Circles', done: false },
      { id: 'spd-2-4', day: 4, focus: 'Mixed circles assessment', type: 'Assessment', mins: 45, topic: 'Circles', done: false },
      { id: 'spd-2-5', day: 5, focus: 'Weak area review', type: 'Review', mins: 20, topic: 'Circles', done: false },
      { id: 'spd-2-6', day: 6, focus: 'Timed practice set', type: 'Practice', mins: 40, topic: 'Circles', done: false },
      { id: 'spd-2-7', day: 7, focus: 'Final mock test', type: 'Assessment', mins: 60, topic: 'Circles', done: false },
    ],
    status: 'active',
    createdByTutorId: 'tut-1',
    createdAt: '2026-06-10',
  },
]

export const progressAlerts = [
  {
    type: 'Score Drop',
    severity: 'high' as const,
    topic: 'Linear Equations',
    detail: 'Performance dropped 72% → 48% over the last 3 tests.',
    date: '2 days ago',
  },
  {
    type: 'Consistency Drop',
    severity: 'medium' as const,
    topic: 'Science — overall',
    detail: 'Accuracy varies by ±22% across recent assessments.',
    date: '5 days ago',
  },
  {
    type: 'Readiness Risk',
    severity: 'medium' as const,
    topic: 'Circles',
    detail: 'Below threshold for Quarterly Exam readiness.',
    date: '1 week ago',
  },
  {
    type: 'Missed Practice',
    severity: 'low' as const,
    topic: 'Daily plan',
    detail: '2 planned sessions skipped this week.',
    date: '3 days ago',
  },
]

export const monthlyReports = [
  { month: 'June 2026', health: 78, improvement: 12, readiness: 85 },
  { month: 'May 2026', health: 72, improvement: 8, readiness: 80 },
  { month: 'April 2026', health: 68, improvement: 5, readiness: 74 },
  { month: 'March 2026', health: 61, improvement: 2, readiness: 68 },
]

export const studentWiseReports: StudentWiseReport[] = [
  {
    studentId: 'stu-1',
    health: 72,
    readiness: 68,
    improvement: 12,
    avgAccuracy: 74,
    status: 'good',
    criticalGaps: 1,
    strongTopics: ['Quadratic Equations', 'Triangles', 'Motion & Force'],
    weakTopics: ['Linear Equations', 'Circles'],
    recentTests: [
      { title: 'Unit Test — Algebra', date: '2026-06-18', accuracy: 72, subject: 'Mathematics' },
      { title: 'Chapter Quiz — Motion', date: '2026-06-14', accuracy: 88, subject: 'Science' },
      { title: 'Diagnostic — Geometry', date: '2026-06-10', accuracy: 60, subject: 'Mathematics' },
    ],
    insight: 'Linear Equations is the main drag — word-problem translation. Fixing it could lift overall score by ~12%.',
  },
  {
    studentId: 'stu-2',
    health: 85,
    readiness: 88,
    improvement: 15,
    avgAccuracy: 86,
    status: 'excellent',
    criticalGaps: 0,
    strongTopics: ['Algebra', 'Statistics', 'Sound'],
    weakTopics: ['Ratio & Proportion'],
    recentTests: [
      { title: 'Unit Test — Algebra', date: '2026-06-17', accuracy: 92, subject: 'Mathematics' },
      { title: 'Science Weekly', date: '2026-06-12', accuracy: 84, subject: 'Science' },
    ],
    insight: 'Consistent performer. Ready for quarterly exam with minor ratio revision.',
  },
  {
    studentId: 'stu-3',
    health: 54,
    readiness: 48,
    improvement: -3,
    avgAccuracy: 52,
    status: 'weak',
    criticalGaps: 3,
    strongTopics: ['Arithmetic'],
    weakTopics: ['Geometry', 'Mensuration', 'Linear Equations'],
    recentTests: [
      { title: 'Diagnostic — Geometry', date: '2026-06-16', accuracy: 44, subject: 'Mathematics' },
      { title: 'Unit Test — Algebra', date: '2026-06-08', accuracy: 58, subject: 'Mathematics' },
    ],
    insight: 'At-risk — declining trend. Needs intervention on Geometry and Mensuration immediately.',
  },
  {
    studentId: 'stu-4',
    health: 78,
    readiness: 74,
    improvement: 9,
    avgAccuracy: 76,
    status: 'good',
    criticalGaps: 1,
    strongTopics: ['Circles', 'English Comprehension'],
    weakTopics: ['Mensuration'],
    recentTests: [
      { title: 'Chapter Quiz — Circles', date: '2026-06-18', accuracy: 80, subject: 'Mathematics' },
    ],
    insight: 'Solid overall. Mensuration word problems need a focused 2-week drill.',
  },
  {
    studentId: 'stu-5',
    health: 61,
    readiness: 58,
    improvement: 4,
    avgAccuracy: 64,
    status: 'fair',
    criticalGaps: 2,
    strongTopics: ['Fractions'],
    weakTopics: ['Geometry', 'Probability'],
    recentTests: [
      { title: 'Batch Test — Mixed', date: '2026-06-15', accuracy: 62, subject: 'Mathematics' },
    ],
    insight: 'Inconsistent — accuracy swings ±18%. Recommend structured daily practice.',
  },
  {
    studentId: 'stu-6',
    health: 91,
    readiness: 93,
    improvement: 18,
    avgAccuracy: 90,
    status: 'excellent',
    criticalGaps: 0,
    strongTopics: ['Algebra', 'Geometry', 'Science'],
    weakTopics: [],
    recentTests: [
      { title: 'Unit Test — Algebra', date: '2026-06-17', accuracy: 96, subject: 'Mathematics' },
      { title: 'Science Unit', date: '2026-06-11', accuracy: 88, subject: 'Science' },
    ],
    insight: 'Top performer in batch. Consider advanced problem sets to maintain engagement.',
  },
  {
    studentId: 'stu-7',
    health: 70,
    readiness: 71,
    improvement: 7,
    avgAccuracy: 72,
    status: 'good',
    criticalGaps: 1,
    strongTopics: ['Linear Equations'],
    weakTopics: ['Circles'],
    recentTests: [
      { title: 'Topic Quiz — Linear Eq.', date: '2026-06-14', accuracy: 75, subject: 'Mathematics' },
    ],
    insight: 'New to Pune center — catching up well. Circles needs attention before quarterly.',
  },
  {
    studentId: 'stu-8',
    health: 82,
    readiness: 79,
    improvement: 11,
    avgAccuracy: 80,
    status: 'good',
    criticalGaps: 0,
    strongTopics: ['Algebra', 'Physics'],
    weakTopics: ['Organic Chemistry basics'],
    recentTests: [
      { title: 'Grade 9 Diagnostic', date: '2026-06-12', accuracy: 78, subject: 'Science' },
    ],
    insight: 'Grade 9 transition on track. Science breadth is the focus area for next month.',
  },
]

export function getStudentWiseReport(studentId: string): StudentWiseReport | undefined {
  return studentWiseReports.find((r) => r.studentId === studentId)
}
