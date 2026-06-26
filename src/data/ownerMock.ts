// Owner / institute intelligence — aligned with learnova mock-data

export const ownerInstitution = {
  totalStudents: 2500,
  byBoard: [
    { board: 'CBSE', count: 1600 },
    { board: 'State Board', count: 700 },
    { board: 'ICSE', count: 200 },
  ],
  avgImprovement: 14,
  parentNPS: 62,
  retention: 91,
}

export const ownerTeachers = [
  { name: 'Mrs. Priya Nair', subject: 'Math · CBSE 8', students: 120, improved: 87, growth: 15, readiness: 11 },
  { name: 'Mr. Suresh K.', subject: 'Science · CBSE 8-10', students: 145, improved: 79, growth: 12, readiness: 9 },
  { name: 'Ms. Divya R.', subject: 'English · All', students: 210, improved: 92, growth: 18, readiness: 14 },
  { name: 'Mr. Rajan T.', subject: 'Math · State 9', students: 86, improved: 64, growth: 8, readiness: 5 },
]

export const syllabusCompletion = [
  { grade: 'CBSE 8', physics: 84, chem: 79, bio: 91, math: 86 },
  { grade: 'CBSE 9', physics: 76, chem: 72, bio: 88, math: 81 },
  { grade: 'CBSE 10', physics: 90, chem: 82, bio: 95, math: 92 },
  { grade: 'State 9', physics: 68, chem: 64, bio: 80, math: 72 },
]

export const hardestTopics = [
  { topic: 'Geometry · Coordinate', correct: 22 },
  { topic: 'Mensuration · 3D shapes', correct: 28 },
  { topic: 'Reading Comprehension · Inference', correct: 31 },
  { topic: 'Chemistry · Mole concept', correct: 34 },
  { topic: 'Physics · Optics', correct: 39 },
]

export const ownerCenters = [
  { id: 'c1', name: 'BrightPath · Andheri (HQ)', city: 'Mumbai', students: 980, avg: 78, retention: 93, nps: 64, growth: 16 },
  { id: 'c2', name: 'BrightPath · Borivali', city: 'Borivali', students: 620, avg: 74, retention: 89, nps: 58, growth: 12 },
  { id: 'c3', name: 'BrightPath · Thane', city: 'Thane', students: 410, avg: 71, retention: 86, nps: 54, growth: 9 },
  { id: 'c4', name: 'BrightPath · Pune', city: 'Pune', students: 290, avg: 69, retention: 84, nps: 51, growth: 7 },
  { id: 'c5', name: 'BrightPath · Nashik', city: 'Nashik', students: 200, avg: 66, retention: 81, nps: 47, growth: 5 },
]

export const boardReport = [
  { board: 'CBSE', students: 1600, avg: 77, improvement: 15, atRisk: 142, syllabus: 84, topSubject: 'English', weakSubject: 'Mathematics' },
  { board: 'State Board', students: 700, avg: 69, improvement: 11, atRisk: 98, syllabus: 71, topSubject: 'Social Studies', weakSubject: 'Science' },
  { board: 'ICSE', students: 200, avg: 81, improvement: 18, atRisk: 14, syllabus: 88, topSubject: 'Mathematics', weakSubject: 'Hindi' },
]

export type CurriculumTopic = { name: string; questions: number; mastery: number }
export type CurriculumSubject = { name: string; topics: CurriculumTopic[] }
export type CurriculumGrade = { grade: string; subjects: CurriculumSubject[] }
export type CurriculumBoard = { board: string; grades: CurriculumGrade[] }

export const curriculum: CurriculumBoard[] = [
  {
    board: 'CBSE',
    grades: [
      {
        grade: 'Grade 8',
        subjects: [
          {
            name: 'Mathematics',
            topics: [
              { name: 'Algebra', questions: 142, mastery: 84 },
              { name: 'Geometry', questions: 118, mastery: 42 },
              { name: 'Mensuration', questions: 96, mastery: 38 },
              { name: 'Statistics', questions: 64, mastery: 69 },
              { name: 'Ratio & Proportion', questions: 72, mastery: 55 },
              { name: 'Linear Equations', questions: 88, mastery: 71 },
            ],
          },
          {
            name: 'Science',
            topics: [
              { name: 'Force & Pressure', questions: 54, mastery: 78 },
              { name: 'Cell Structure', questions: 48, mastery: 52 },
              { name: 'Sound', questions: 36, mastery: 81 },
              { name: 'Light', questions: 42, mastery: 67 },
            ],
          },
          {
            name: 'English',
            topics: [
              { name: 'Reading Comprehension', questions: 60, mastery: 79 },
              { name: 'Grammar · Tenses', questions: 80, mastery: 88 },
              { name: 'Writing · Letter', questions: 24, mastery: 72 },
            ],
          },
          {
            name: 'Social Studies',
            topics: [
              { name: 'Resources', questions: 38, mastery: 64 },
              { name: 'Modern India', questions: 44, mastery: 58 },
            ],
          },
        ],
      },
      {
        grade: 'Grade 9',
        subjects: [
          {
            name: 'Mathematics',
            topics: [
              { name: 'Polynomials', questions: 96, mastery: 72 },
              { name: 'Coordinate Geometry', questions: 78, mastery: 41 },
              { name: 'Triangles', questions: 84, mastery: 66 },
            ],
          },
          {
            name: 'Science',
            topics: [
              { name: 'Motion', questions: 62, mastery: 74 },
              { name: 'Atoms & Molecules', questions: 58, mastery: 61 },
            ],
          },
        ],
      },
      {
        grade: 'Grade 10',
        subjects: [
          {
            name: 'Mathematics',
            topics: [
              { name: 'Trigonometry', questions: 102, mastery: 76 },
              { name: 'Probability', questions: 48, mastery: 68 },
            ],
          },
          {
            name: 'Science',
            topics: [
              { name: 'Optics', questions: 72, mastery: 59 },
              { name: 'Electricity', questions: 84, mastery: 71 },
            ],
          },
        ],
      },
    ],
  },
  {
    board: 'State Board',
    grades: [
      {
        grade: 'Grade 9',
        subjects: [
          {
            name: 'Mathematics',
            topics: [
              { name: 'Algebra', questions: 84, mastery: 64 },
              { name: 'Mensuration', questions: 66, mastery: 48 },
            ],
          },
          {
            name: 'Science',
            topics: [{ name: 'Physics · Motion', questions: 48, mastery: 58 }],
          },
        ],
      },
    ],
  },
  {
    board: 'ICSE',
    grades: [
      {
        grade: 'Grade 9',
        subjects: [
          {
            name: 'Mathematics',
            topics: [
              { name: 'Mensuration', questions: 72, mastery: 76 },
              { name: 'Trigonometry', questions: 64, mastery: 82 },
            ],
          },
        ],
      },
    ],
  },
]

export const subjectStudents = [
  { name: 'Arjun Mehta', roll: '8A-04', center: 'Andheri', overall: 76, topics: { Algebra: 85, Geometry: 40, Mensuration: 35, Statistics: 70, 'Linear Equations': 62, 'Ratio & Proportion': 55 } },
  { name: 'Priya R.', roll: '8A-11', center: 'Andheri', overall: 58, topics: { Algebra: 62, Geometry: 38, Mensuration: 42, Statistics: 55, 'Linear Equations': 68, 'Ratio & Proportion': 51 } },
  { name: 'Karthik M.', roll: '8B-07', center: 'Borivali', overall: 64, topics: { Algebra: 71, Geometry: 52, Mensuration: 48, Statistics: 66, 'Linear Equations': 70, 'Ratio & Proportion': 58 } },
  { name: 'Anita S.', roll: '8B-12', center: 'Thane', overall: 71, topics: { Algebra: 78, Geometry: 60, Mensuration: 58, Statistics: 72, 'Linear Equations': 80, 'Ratio & Proportion': 65 } },
  { name: 'Rohan P.', roll: '8A-19', center: 'Andheri', overall: 82, topics: { Algebra: 91, Geometry: 74, Mensuration: 70, Statistics: 86, 'Linear Equations': 88, 'Ratio & Proportion': 80 } },
  { name: 'Meera J.', roll: '8C-02', center: 'Pune', overall: 54, topics: { Algebra: 58, Geometry: 32, Mensuration: 30, Statistics: 50, 'Linear Equations': 55, 'Ratio & Proportion': 48 } },
  { name: 'Vikram T.', roll: '8A-22', center: 'Andheri', overall: 88, topics: { Algebra: 94, Geometry: 82, Mensuration: 79, Statistics: 90, 'Linear Equations': 91, 'Ratio & Proportion': 85 } },
  { name: 'Lakshmi N.', roll: '8B-03', center: 'Borivali', overall: 69, topics: { Algebra: 74, Geometry: 55, Mensuration: 50, Statistics: 71, 'Linear Equations': 75, 'Ratio & Proportion': 62 } },
]

export const aiBoardReport: Record<string, { headline: string; insight: string; actions: string[]; lift: number }> = {
  CBSE: {
    headline: 'CBSE cohort is improving, but Math is a structural drag.',
    insight:
      'Across 1,600 CBSE students, English drives the +15% improvement (79% mean mastery), while Math sits at 64% — pulled down by Geometry (42%) and Mensuration (38%). The drop is uniform across centers, suggesting a curriculum-delivery issue, not a teacher-specific one.',
    actions: [
      'Roll out a 3-week Geometry+Mensuration remediation across Grade 8 (all centers).',
      'Pair Mrs. Priya Nair with two new Math hires for shadow-teaching — her growth metric is 18%.',
      'Introduce diagram-first MCQ packs in the daily plan for at-risk 142 students.',
    ],
    lift: 9,
  },
  'State Board': {
    headline: 'State Board needs syllabus pace correction.',
    insight:
      'Syllabus completion is only 71% with 5 weeks to finals. Science is the weakest subject (mean 58%), with Physics-Motion dragging hardest. 98 at-risk students concentrated in Thane & Pune centers.',
    actions: [
      'Compress 2 chapters of Social Studies into integrated revision; reclaim 12 hours for Science.',
      'Deploy AI-generated topic recap cards weekly for Physics.',
      'Schedule parent-teacher meetings for the 98 at-risk students before next assessment.',
    ],
    lift: 7,
  },
  ICSE: {
    headline: 'ICSE is your flagship cohort — protect the moat.',
    insight:
      'ICSE leads with 81% average and 88% syllabus completion. Hindi is the only soft spot (mean 64%). Retention risk is minimal (14 at-risk of 200).',
    actions: [
      'Run a Hindi conversation-practice club; assign Ms. Divya R. as faculty lead.',
      'Use ICSE results in admissions marketing for next cycle.',
      'Pilot advanced-track Math enrichment for top 25% to lock loyalty.',
    ],
    lift: 4,
  },
}

export const aiCenterInsights = [
  { center: 'Andheri (HQ)', insight: 'Highest performer; surplus capacity in English. Consider hosting cross-center workshops.', flag: 'leaf' as const },
  { center: 'Borivali', insight: "Math results trending up (+4% MoM); replicate Mrs. Suja's session structure to Thane.", flag: 'leaf' as const },
  { center: 'Thane', insight: 'Retention dipped 3% — 12 parent complaints about session frequency. Action needed in 7 days.', flag: 'amber' as const },
  { center: 'Pune', insight: 'At-risk ratio (12%) is 2× institute average. Audit batch sizes and teacher load.', flag: 'rose' as const },
  { center: 'Nashik', insight: 'Smallest center but +5% YoY growth in admissions. Add 1 Math + 1 Science teacher for Q3.', flag: 'leaf' as const },
]

export const subjectAiReport: Record<string, { headline: string; insight: string; actions: string[] }> = {
  Mathematics: {
    headline: 'Math mastery is bimodal — strong in Algebra, collapses in Geometry.',
    insight:
      'The class splits into two clusters: 38% of students score >75% on Algebra/Linear Eq, while 41% drop below 50% the moment a diagram is involved. This is a visualization gap, not a computation gap.',
    actions: [
      'Switch from formula-first to figure-first teaching for Geometry & Mensuration.',
      'Assign 15 diagram-MCQs per week to the bottom cluster (auto-generated).',
      'Re-test in 3 weeks; expected lift: +14% on Geometry mean.',
    ],
  },
  Science: {
    headline: 'Conceptual subjects strong, abstract subjects weak.',
    insight:
      'Sound & Force show 78–81% mastery (hands-on demos likely helping). Cell Structure (52%) and Light (67%) — abstract/diagrammatic — lag. Same visualization gap pattern as Math Geometry.',
    actions: [
      'Introduce 3D model videos for Cell Structure & Optics chapters.',
      'Map 6 lab-style assignments to abstract chapters.',
    ],
  },
  English: {
    headline: 'Strongest subject — coast, don\'t invest more.',
    insight:
      'Grammar at 88%, Reading at 79%. No structural gaps. Marginal weakness in long-form writing but does not impact exam outcomes.',
    actions: ['Re-allocate 2 hrs/week of English to Math remediation for at-risk students.'],
  },
  'Social Studies': {
    headline: 'Recall-based, predictable — but no enrichment.',
    insight:
      'Mean 64% with low variance. Students memorize but score middling on application questions.',
    actions: ['Add 1 case-study per chapter; introduce map-based MCQs.'],
  },
}
