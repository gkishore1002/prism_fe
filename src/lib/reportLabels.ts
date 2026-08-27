import type { ReportLanguage } from '@/types'

/** Pick English or Tamil copy for report chrome (titles, labels). */
export function pickReportCopy(language: ReportLanguage, english: string, tamil: string): string {
  return language === 'ta' ? tamil : english
}

type Bilingual = { en: string; ta: string }

/** Central bilingual label dictionary for full report localization. */
export const R = {
  // Language bar
  reportLanguage: { en: 'Report language', ta: 'அறிக்கை மொழி' },
  viewInEnglish: { en: 'View in English', ta: 'ஆங்கிலத்தில் காண்க' },
  viewInTamil: { en: 'View in Tamil', ta: 'தமிழில் காண்க' },
  languageBarHint: {
    en: 'Full report — titles, tables, KPIs, and summaries switch to Tamil.',
    ta: 'முழு அறிக்கை — தலைப்புகள், அட்டவணைகள், KPIகள் மற்றும் சுருக்கங்கள் தமிழில் மாறும்.',
  },
  viewingTamil: { en: 'Viewing in Tamil', ta: 'தமிழில் காண்பிக்கப்படுகிறது' },
  tamilHowGenerated: {
    en: 'Tamil text: Vertex AI (Gemini) when enabled, otherwise rule-based Tamil from the server.',
    ta: 'தமிழ் உரை: Vertex AI (Gemini) மூலம்; இல்லையெனில் சேவையக rule-based தமிழ்.',
  },

  // Brand / hero
  brandIntelligence: { en: 'Intelligence', ta: 'நுண்ணறிவு' },
  reportKindEngine: { en: 'AI Academic Profiling Engine', ta: 'AI கல்வி சுயவிவர இயந்திரம்' },
  reportKindOverall: { en: 'Overall performance report', ta: 'ஒட்டுமொத்த செயல்திறன் அறிக்கை' },
  reportKindAssessment: { en: 'Assessment report', ta: 'தேர்வு அறிக்கை' },
  tabOverview: { en: 'Overview', ta: 'மேலோட்டம்' },
  tabAcademicReport: { en: 'Academic report', ta: 'கல்வி அறிக்கை' },
  titleOverallSection: { en: 'Overall report', ta: 'ஒட்டுமொத்த அறிக்கை' },
  descOverallSection: {
    en: 'Learning Genome overall report — cross-assessment profile and trends.',
    ta: 'ஒட்டுமொத்த Learning Genome — அனைத்து தேர்வுகளின் சுயவிவரம்.',
  },
  titleAcademicSection: { en: 'Academic reports', ta: 'கல்வி அறிக்கைகள்' },
  descAcademicSection: {
    en: 'Assessment-wise reports — one per test. View opens that assessment only.',
    ta: 'தேர்வு வாரியான அறிக்கைகள் — ஒ each test. View opens that assessment only.',
  },
  viewReport: { en: 'View', ta: 'காண்க' },
  openFullReport: { en: 'Open full report', ta: 'முழு அறிக்கை' },
  reportForStudent: { en: 'Report', ta: 'அறிக்கை' },
  reportUnavailable: { en: 'Report unavailable', ta: 'அறிக்கை கிடைக்கவில்லை' },
  reportNotFound: { en: 'Report not found', ta: 'அறிக்கை கிடைக்கவில்லை' },
  studentNotFound: { en: 'Student not found', ta: 'மாணவர் கிடைக்கவில்லை' },

  // KPI labels (shared)
  overallScore: { en: 'Overall Score', ta: 'ஒட்டுமொத்த மதிப்பெண்' },
  consistency: { en: 'Consistency', ta: 'நிலைத்தன்மை' },
  learningTrend: { en: 'Learning Trend', ta: 'கற்றல் போக்கு' },
  predictedNext: { en: 'Predicted Next', ta: 'அடுத்த முன்னறிவிப்பு' },
  confidenceScore: { en: 'Confidence Score', ta: 'நம்பிக்கை மதிப்பெண்' },
  growthPotential: { en: 'Growth Potential', ta: 'வளர்ச்சி திறன்' },
  yourScore: { en: 'Your score', ta: 'உங்கள் மதிப்பெண்' },
  rawMarks: { en: 'Raw marks', ta: 'மொத்த மதிப்பெண்கள்' },
  classAverage: { en: 'Class average', ta: 'வகுப்பு சராசரி' },
  classRank: { en: 'Class rank', ta: 'வகுப்பு தரவரிசை' },
  timeSpent: { en: 'Time Spent', ta: 'செலவிட்ட நேரம்' },
  assessments: { en: 'Assessments', ta: 'தேர்வுகள்' },

  // Nav pills
  navAssessment: { en: 'Assessment', ta: 'தேர்வு' },
  navTrend: { en: 'Trend', ta: 'போக்கு' },
  navHistory: { en: 'History', ta: 'வரலாறு' },
  navAllTests: { en: 'All tests', ta: 'அனைத்து தேர்வுகள்' },
  navSummary: { en: 'Summary', ta: 'சுருக்கம்' },
  navForecast: { en: 'Forecast', ta: 'முன்னறிவிப்பு' },
  navKnowledge: { en: 'Knowledge', ta: 'அறிவு' },
  navCards: { en: 'Cards', ta: 'அட்டைகள்' },
  navNarrative: { en: 'Narrative', ta: 'விளக்கம்' },
  navAssessmentWise: { en: 'Assessment-wise', ta: 'தேர்வு வாரியாக' },

  // Toolbar
  exportPdf: { en: 'Export PDF', ta: 'PDF ஏற்றுமதி' },
  print: { en: 'Print', ta: 'அச்சிடு' },
  buildingPdf: { en: 'Building PDF…', ta: 'PDF உருவாக்குகிறது…' },
  back: { en: 'Back', ta: 'பின்செல்' },
  reportLoadingAlert: {
    en: 'The report is still loading. Wait a moment, then try Export PDF again.',
    ta: 'அறிக்கை ஏற்றப்படுகிறது. சிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும்.',
  },
  learningGenomeReport: { en: 'Learning Genome Report', ta: 'கற்றல் Genome அறிக்கை' },

  // Section eyebrows / titles
  eyebrowAssessmentWise: { en: 'Assessment-wise · This test', ta: 'தேர்வு வாரியாக · இந்த தேர்வு' },
  eyebrowTrendMap: { en: 'Trend map', ta: 'போக்கு வரைபடம்' },
  titleSubjectAffinity: { en: 'Subject affinity & exam performance', ta: 'பாட ஈர்ப்பு & தேர்வு செயல்திறன்' },
  descSubjectAffinity: {
    en: 'Affinity from cumulative subject health. Trend and comparison charts cover every scored assessment.',
    ta: 'பாட சுகாதாரத்திலிருந்து ஈர்ப்பு. போக்கு & ஒப்பீட்டு வரைபடங்கள் அனைத்து தேர்வுகளையும் உள்ளடக்கும்.',
  },
  eyebrowExamHistory: { en: 'Exam history', ta: 'தேர்வு வரலாறு' },
  titlePastExams: { en: 'Past exam performance', ta: 'முந்தைய தேர்வு செயல்திறன்' },
  descPastExams: {
    en: 'Every scored assessment in order — overall %, subjects, and change vs the previous test.',
    ta: 'ஒவ்வொரு தேர்வும் — ஒட்டுமொத்த %, பாடங்கள், முந்தைய தேர்வுடன் ஒப்பீடு.',
  },
  eyebrowAllAssessments: { en: 'Assessment-wise · Full split-up', ta: 'தேர்வு வாரியாக · முழு பிரிப்பு' },
  titleEveryAssessment: { en: 'Every assessment in detail', ta: 'ஒவ்வொரு தேர்வும் விரிவாக' },
  descEveryAssessment: {
    en: 'Tabular subject split for each test — included in PDF export.',
    ta: 'ஒவ்வொரு தேர்வுக்கும் பாட பிரிப்பு — PDF ஏற்றுமதியில் அடங்கும்.',
  },
  eyebrowExecutive: { en: 'Executive summary', ta: 'நிர்வாக சுருக்கம்' },
  titleAiNarrative: { en: 'AI narrative', ta: 'AI விளக்கம்' },
  descLiveSummary: {
    en: 'Live summary generated from your full academic record — refreshes each view.',
    ta: 'முழு கல்வி பதிவிலிருந்து நேரடி சுருக்கம் — ஒவ்வொரு பார்வையிலும் புதுப்பிக்கப்படும்.',
  },
  descRuleSummary: {
    en: 'Summary based on your latest academic metrics.',
    ta: 'சமீபத்திய கல்வி அளவீடுகளின் அடிப்படையில் சுருக்கம்.',
  },
  eyebrowKeySignals: { en: 'Key signals', ta: 'முக்கிய சமிக்ஞைகள்' },
  titleInsightFeed: { en: 'Insight feed', ta: 'நுண்ணறிவு ஊட்டம்' },
  descInsightFeed: {
    en: 'Patterns surfaced from health, gaps, and readiness data.',
    ta: 'சுகாதாரம், இடைவெளிகள் & தயார்நிலை தரவிலிருந்து கண்டறியப்பட்ட வடிவங்கள்.',
  },
  eyebrowForecast: { en: 'Forecast', ta: 'முன்னறிவிப்பு' },
  titleTopicReadiness: { en: 'Topic predictive readiness', ta: 'தலைப்பு முன்னறிவிப்பு தயார்நிலை' },
  descTopicReadiness: {
    en: 'Likely exam % per topic if assessed soon — mastery vs predicted.',
    ta: 'விரைவில் தேர்வு செய்தால் ஒவ்வொரு தலைப்புக்கும் சாத்தியமான % — திறமை vs முன்னறிவிப்பு.',
  },
  eyebrowSummary: { en: 'Summary', ta: 'சுருக்கம்' },
  titleAssessmentNarrative: { en: 'Assessment narrative', ta: 'தேர்வு விளக்கம்' },
  descAiStored: {
    en: 'AI summary stored when this assessment was submitted.',
    ta: 'இந்த தேர்வு சமர்ப்பிக்கப்பட்டபோது AI சுருக்கம் சேமிக்கப்பட்டது.',
  },
  descRuleAssessment: {
    en: 'Rule-based summary for this assessment.',
    ta: 'இந்த தேர்வுக்கான rule-based சுருக்கம்.',
  },
  titleSubjectBreakdown: { en: 'Subject breakdown', ta: 'பாட பிரிப்பு' },
  descSubjectBreakdown: {
    en: 'Marks, percentage, grade band, and standing vs class average.',
    ta: 'மதிப்பெண்கள், சதவீதம், தரம் & வகுப்பு சராசரியுடன் ஒப்பீடு.',
  },
  eyebrowTopics: { en: 'Topics', ta: 'தலைப்புகள்' },
  titleStrongFocus: { en: 'Strong & focus areas', ta: 'வலுவான & கவன பகுதிகள்' },
  eyebrowAssessmentReports: { en: 'Assessment reports', ta: 'தேர்வு அறிக்கைகள்' },
  titleOnePerTest: { en: 'One report per test', ta: 'ஒவ்வொரு தேர்வுக்கும் ஒரு அறிக்கை' },
  descOnePerTest: {
    en: 'Quick cards — open any test for the standalone assessment report.',
    ta: 'விரைவு அட்டைகள் — எந்த தேர்வையும் திறந்து முழு அறிக்கையைப் பார்க்கவும்.',
  },
  eyebrowReports: { en: 'Reports', ta: 'அறிக்கைகள்' },
  titleNothingYet: { en: 'Nothing to show yet', ta: 'இன்னும் காட்ட எதுவும் இல்லை' },
  descNothingYet: {
    en: 'Complete assessments or enter marks to build assessment-wise tables, trend graphs, and your Learning Genome PDF.',
    ta: 'தேர்வுகளை முடிக்கவும் அல்லது மதிப்பெண்கள் உள்ளிடவும் — அட்டவணைகள், போக்கு வரைபடங்கள் & PDF உருவாகும்.',
  },
  descCompleteAssessments: {
    en: 'Complete assessments to generate assessment-wise reports.',
    ta: 'தேர்வு வாரியான அறிக்கைகளை உருவாக்க தேர்வுகளை முடிக்கவும்.',
  },
  openFullOverall: { en: 'Open full overall report →', ta: 'முழு ஒட்டுமொத்த அறிக்கை →' },

  // Panel headings
  subjectAffinity: { en: 'Subject Affinity', ta: 'பாட ஈர்ப்பு' },
  examPerformanceTrend: { en: 'Exam Performance Trend', ta: 'தேர்வு செயல்திறன் போக்கு' },
  noSubjectScores: { en: 'No subject scores yet.', ta: 'இன்னும் பாட மதிப்பெண்கள் இல்லை.' },
  trendAfterMore: { en: 'Trend appears after more assessments.', ta: 'மேலும் தேர்வுகளுக்குப் பிறகு போக்கு தோன்றும்.' },
  allAssessmentsChart: { en: 'All assessments — score vs class avg', ta: 'அனைத்து தேர்வுகள் — மதிப்பெண் vs வகுப்பு சராசரி' },
  strongTopics: { en: 'Strong topics', ta: 'வலுவான தலைப்புகள்' },
  focusTopics: { en: 'Focus topics', ta: 'கவன தலைப்புகள்' },
  noneFlagged: { en: 'None flagged', ta: 'எதுவும் குறிக்கப்படவில்லை' },
  noneIdentified: { en: 'None identified yet', ta: 'இன்னும் கண்டறியப்படவில்லை' },
  fullMetricSet: { en: 'Full Metric Set', ta: 'முழு அளவீட்டு தொகுப்பு' },
  bestExam: { en: 'Best Exam', ta: 'சிறந்த தேர்வு' },
  lowestExam: { en: 'Lowest Exam', ta: 'குறைந்த தேர்வு' },
  recoveryAbility: { en: 'Recovery Ability', ta: 'மீட்பு திறன்' },
  subjectBalance: { en: 'Subject Balance', ta: 'பாட சமநிலை' },
  velocity: { en: 'Velocity', ta: 'வேகம்' },
  examShock: { en: 'Exam Shock', ta: 'தேர்வு அதிர்ச்சி' },
  attendanceImpact: { en: 'Attendance Impact', ta: 'வருகை தாக்கம்' },
  absences: { en: 'Absences', ta: 'வராத நாட்கள்' },
  noneDetected: { en: 'None detected', ta: 'எதுவும் கண்டறியப்படவில்லை' },
  na: { en: 'N/A', ta: 'பொ/இ' },
  genomeProfile: { en: 'Learning Genome profile', ta: 'கற்றல் Genome சுயவிவரம்' },
  latestPct: { en: 'latest', ta: 'சமீபத்திய' },
  conducted: { en: 'Conducted', ta: 'நடத்தப்பட்டது' },

  // Table headers
  thSubject: { en: 'Subject', ta: 'பாடம்' },
  thMarks: { en: 'Marks', ta: 'மதிப்பெண்கள்' },
  thPercentage: { en: 'Percentage', ta: 'சதவீதம்' },
  thScore: { en: 'Score', ta: 'மதிப்பெண்' },
  thGrade: { en: 'Grade', ta: 'தரம்' },
  thVsClassAvg: { en: 'Vs class avg', ta: 'வகுப்பு சராசரி' },
  thExam: { en: 'Exam', ta: 'தேர்வு' },
  thDate: { en: 'Date', ta: 'தேதி' },
  thOverall: { en: 'Overall', ta: 'ஒட்டுமொத்தம்' },
  thSubjects: { en: 'Subjects', ta: 'பாடங்கள்' },
  thVsPrev: { en: 'Vs prev', ta: 'முந்தைய' },
  thTopic: { en: 'Topic', ta: 'தலைப்பு' },
  thMastery: { en: 'Mastery', ta: 'திறமை' },
  thPredicted: { en: 'Predicted', ta: 'முன்னறிவிப்பு' },
  thDelta: { en: 'Δ', ta: 'Δ' },
  thConfidence: { en: 'Confidence', ta: 'நம்பிக்கை' },

  // Chart legend
  chartYourScore: { en: 'Your score', ta: 'உங்கள் மதிப்பெண்' },
  chartClassAvg: { en: 'Class avg', ta: 'வகுப்பு சராசரி' },

  // Insight feed
  todaysInsights: { en: "Today's insights", ta: 'இன்றைய நுண்ணறிவு' },
  overallProfile: { en: 'OVERALL PROFILE', ta: 'ஒட்டுமொத்த சுயவிவரம்' },
  tagPriority: { en: 'Priority', ta: 'முன்னுரிமை' },
  tagStrength: { en: 'Strength', ta: 'வலிமை' },
  tagWatch: { en: 'Watch', ta: 'கவனம்' },

  // Footer
  footerGenerated: {
    en: 'Generated by {app} — Learning Genome Engine. Rule-based analytics from uploaded marks.',
    ta: '{app} — கற்றல் Genome இயந்திரம். பதிவேற்றிய மதிப்பெண்களிலிருந்து rule-based பகுப்பாய்வு.',
  },
  footerConfidential: { en: 'Confidential · For academic use only', ta: 'ரகசியம் · கல்வி பயன்பாட்டிற்கு மட்டும்' },
  studentsInCohort: { en: 'student(s) in cohort window', ta: 'மாணவர்(கள்) குழு காலத்தில்' },

  // Vs class
  vsClass: { en: 'vs class', ta: 'வகுப்பு ஒப்பீட்டில்' },

  // Loaders
  loadingOverall: { en: 'Building overall performance report…', ta: 'ஒட்டுமொத்த செயல்திறன் அறிக்கை உருவாக்குகிறது…' },
  loadingAssessment: { en: 'Loading assessment report…', ta: 'தேர்வு அறிக்கை ஏற்றுகிறது…' },
  loadingGenome: { en: 'Loading genome profile…', ta: 'Genome சுயவிவரம் ஏற்றுகிறது…' },
  loadingReports: { en: 'Loading reports…', ta: 'அறிக்கைகள் ஏற்றுகிறது…' },

  // Narrative source notes
  noteEnglishLiveAi: { en: 'English · Live AI summary', ta: 'ஆங்கிலம் · நேரடி AI சுருக்கம்' },
  noteTamilLiveAi: { en: 'Tamil · Live AI summary', ta: 'தமிழ் · நேரடி AI சுருக்கம்' },
  noteEnglishRule: { en: 'English · Rule-based', ta: 'ஆங்கிலம் · Rule-based' },
  noteTamilRule: { en: 'Tamil · Rule-based', ta: 'தமிழ் · Rule-based' },
  noteAiStored: { en: 'AI summary · stored in database', ta: 'AI சுருக்கம் · தரவுத்தளத்தில்' },
  noteEnglishAiNarrative: { en: 'English · AI-generated narrative', ta: 'ஆங்கிலம் · AI விளக்கம்' },
  noteTamilAiNarrative: { en: 'Tamil · AI-generated narrative', ta: 'தமிழ் · AI விளக்கம்' },

  // Hub defaults
  hubTitle: { en: 'Your reports', ta: 'உங்கள் அறிக்கைகள்' },
  hubSubtitle: {
    en: 'Assessment-wise results and your overall performance up to date.',
    ta: 'தேர்வு வாரியான முடிவுகள் & புதுப்பிக்கப்பட்ட ஒட்டுமொத்த செயல்திறன்.',
  },
  awaitingAssessments: { en: 'This assessment: awaiting scored assessments', ta: 'இந்த தேர்வு: மதிப்பெண் பெற்ற தேர்வுகளுக்காக காத்திருக்கிறது' },

  // Trend / status values
  improving: { en: 'Improving', ta: 'முன்னேற்றம்' },
  stable: { en: 'Stable', ta: 'நிலையான' },
  declining: { en: 'Declining', ta: 'சரிவு' },
  yes: { en: 'Yes', ta: 'ஆம்' },
  no: { en: 'No', ta: 'இல்லை' },

  // Rank / hero composed fragments
  status: { en: 'Status', ta: 'நிலை' },
  rankOf: { en: 'Rank #', ta: 'தரவரிசை #' },
  of: { en: 'of', ta: 'இல்' },
  attendance: { en: 'Attendance', ta: 'வருகை' },
  risk: { en: 'Risk', ta: 'ஆபத்து' },
  assessmentWindow: { en: 'Assessment window', ta: 'தேர்வு காலம்' },
  thisAssessment: { en: 'This assessment', ta: 'இந்த தேர்வு' },
  criticalGaps: { en: 'Critical gaps', ta: 'முக்கிய இடைவெளிகள்' },
  submitted: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  classStanding: { en: 'Class standing', ta: 'வகுப்பு நிலை' },
  batch: { en: 'Batch', ta: 'குழு' },
  scoredWindow: { en: 'scored window', ta: 'மதிப்பெண் பெற்ற காலம்' },
  subjectCount: { en: 'subject(s)', ta: 'பாடம்(கள்)' },
  awaitingMarks: { en: 'awaiting scored marks', ta: 'மதிப்பெண்களுக்காக காத்திருக்கிறது' },
  min: { en: 'min', ta: 'நிமி' },
} as const satisfies Record<string, Bilingual>

export type ReportLabelKey = keyof typeof R

export function label(key: ReportLabelKey, lang: ReportLanguage): string {
  return R[key][lang]
}

export function labelsFor(lang: ReportLanguage): Record<ReportLabelKey, string> {
  const out = {} as Record<ReportLabelKey, string>
  for (const k of Object.keys(R) as ReportLabelKey[]) {
    out[k] = R[k][lang]
  }
  return out
}

export function subjectBreakdownHeaders(lang: ReportLanguage): string[] {
  return [
    label('thSubject', lang),
    label('thMarks', lang),
    label('thPercentage', lang),
    label('thScore', lang),
    label('thGrade', lang),
    label('thVsClassAvg', lang),
  ]
}

export function historyTableHeaders(lang: ReportLanguage): string[] {
  return ['#', label('thExam', lang), label('thDate', lang), label('thOverall', lang), label('thScore', lang), label('thSubjects', lang), label('thVsPrev', lang)]
}

export function forecastTableHeaders(lang: ReportLanguage): string[] {
  return [label('thTopic', lang), label('thSubject', lang), label('thMastery', lang), label('thPredicted', lang), label('thDelta', lang), label('thConfidence', lang)]
}

const HEALTH_STATUS: Record<string, Bilingual> = {
  excellent: { en: 'excellent', ta: 'சிறந்தது' },
  good: { en: 'good', ta: 'நல்லது' },
  fair: { en: 'fair', ta: 'சுமார்' },
  weak: { en: 'weak', ta: 'பலவீனம்' },
}

const SEVERITY: Record<string, Bilingual> = {
  high: { en: 'high', ta: 'உயர்' },
  medium: { en: 'medium', ta: 'நடுத்தர' },
  low: { en: 'low', ta: 'குறைவு' },
}

const RISK: Record<string, Bilingual> = {
  High: { en: 'High', ta: 'உயர்' },
  Medium: { en: 'Medium', ta: 'நடுத்தர' },
  Low: { en: 'Low', ta: 'குறைவு' },
}

export function translateHealthStatus(value: string, lang: ReportLanguage): string {
  return HEALTH_STATUS[value.toLowerCase()]?.[lang] ?? value
}

export function translateSeverity(value: string, lang: ReportLanguage): string {
  return SEVERITY[value.toLowerCase()]?.[lang] ?? value
}

export function translateRisk(value: string, lang: ReportLanguage): string {
  return RISK[value]?.[lang] ?? value
}

export function translateTrendValue(value: string, lang: ReportLanguage): string {
  const lower = value.toLowerCase()
  if (lower.includes('improv')) return label('improving', lang)
  if (lower.includes('declin')) return label('declining', lang)
  if (lower.includes('stable')) return label('stable', lang)
  return value
}

export function formatSubjectCount(count: number, lang: ReportLanguage): string {
  return lang === 'ta' ? `${count} ${label('subjectCount', lang)}` : `${count} subject${count === 1 ? '' : 's'}`
}

export const reportCopy = R
