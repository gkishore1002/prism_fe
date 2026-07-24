export type CurriculumTopic = { name: string; questions: number; mastery: number }
export type CurriculumSubject = { name: string; topics: CurriculumTopic[] }
export type CurriculumGrade = { grade: string; subjects: CurriculumSubject[] }
export type CurriculumBoard = { board: string; grades: CurriculumGrade[] }
