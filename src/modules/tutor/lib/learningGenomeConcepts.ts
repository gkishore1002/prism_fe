export interface ConceptNotMastered {
  concept: string
  subject: string
  masteryPct: number
}

/** Illustrative cohort gaps — >50% of class below mastery threshold */
export const CONCEPTS_NOT_MASTERED: ConceptNotMastered[] = [
  { concept: 'Light', subject: 'Physics', masteryPct: 42 },
  { concept: 'Stoichiometry', subject: 'Chemistry', masteryPct: 38 },
  { concept: 'Cell Division', subject: 'Biology', masteryPct: 51 },
  { concept: 'Polynomials', subject: 'Mathematics', masteryPct: 47 },
  { concept: 'Quadratic Equations', subject: 'Mathematics', masteryPct: 44 },
  { concept: 'Mensuration', subject: 'Mathematics', masteryPct: 53 },
  { concept: 'Linear Equations', subject: 'Mathematics', masteryPct: 49 },
  { concept: 'Trigonometry', subject: 'Mathematics', masteryPct: 41 },
]
