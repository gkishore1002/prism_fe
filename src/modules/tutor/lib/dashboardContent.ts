export interface TutorDashboardHeroContent {
  eyebrow: string
  strongLabel: string
  needsFocusLabel: string
  expectedImprovementLabel: string
  ctaText: string
  ctaLink: string
}

export interface TutorDashboardHeroSummary {
  headline: string
  subject: string
  batchName: string
  studentCount: number
  avgScore: number
  strongTopics: string[]
  weakTopics: string[]
  expectedImprovement: number
}

export const defaultTutorDashboardHeroContent: TutorDashboardHeroContent = {
  eyebrow: 'AI Tutor Summary',
  strongLabel: 'Strong',
  needsFocusLabel: 'Needs focus',
  expectedImprovementLabel: 'Expected improvement',
  ctaText: 'Schedule follow-up test',
  ctaLink: '/tutor/assessments',
}

export const defaultTutorDashboardPageContent = {
  title: 'Tutor Copilot',
  subtitle: 'Your command center — batch health, assessments, and what to teach next.',
}

/** Catchy hero headline — tutors can override via Edit content on the dashboard */
export const defaultTutorDashboardHeadline = 'Level Up: Geometry Mastery'
