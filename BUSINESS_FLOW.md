# Learnova — Business Flow Document

**Product:** Learnova (Academic Intelligence Platform)  
**Document type:** Business flow — mock frontend implementation  
**Version:** 1.0  
**Date:** 25 June 2026  
**Status:** Reflects current mock application (UI only; no live backend)

---

## 1. Executive summary

Learnova turns every test a student takes into personalised, topic-level guidance. Instead of reporting only a total mark, the platform identifies weak topics, explains performance gaps, and recommends what to study next — all scoped to the correct **Board** and **Grade**.

**Core value proposition**

> Every test automatically identifies weak topics, explains why performance is low, and recommends exactly what the student should study next — mapped to Board and Grade.

---

## 2. Stakeholders and portals

| Role | Portal | Primary responsibility |
|------|--------|------------------------|
| **Institute Owner / Admin** | Institute Console | Organization setup, oversight, attendance, analytics |
| **Tutor** | Tutor Portal | Content creation, assessments, batch teaching, intervention |
| **Student** (parent view combined) | Student Portal | Take tests, view progress and reports |

### Role separation (as implemented in mock)

| Capability | Tutor | Owner / Admin | Student |
|------------|-------|---------------|---------|
| Upload Excel / create question papers | Yes | Read-only view | No |
| Create assessments | Yes | No | No |
| Take assessments | No | No | Yes |
| Test attendance tracking | No | Yes | No |
| Student-wise reports | Batch view | Institute-wide | Own reports |
| Curriculum setup | Yes | Yes | No |

**Note:** Student and parent experiences are combined in a single portal (Dashboard, Assessments, Reports). There is no separate parent login.

---

## 3. Academic data foundation

All content, assessments, and analytics follow one hierarchy:

```
Board → Grade → Subject → Chapter → Topic → Question
```

**Example**

```
CBSE
 └── Grade 8
      └── Mathematics
           └── Algebra
                └── Linear Equations
                     └── Questions
```

Every question must be tagged with Board, Grade, Subject, Chapter, and Topic. This hierarchy enables:

- Scoped assessments (students only see tests for their board and grade)
- Topic-level weak-area detection
- Curriculum browsing and question filtering
- Institute-wide and batch-level reporting

---

## 4. High-level end-to-end flow

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Institute setup │ ──► │ Content creation │ ──► │ Assessment setup  │
│ (Owner/Admin)   │     │ (Tutor)          │     │ (Tutor)           │
└─────────────────┘     └──────────────────┘     └───────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Insight &       │ ◄── │ Post-test        │ ◄── │ Test execution    │
│ oversight       │     │ diagnosis        │     │ (Student)         │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

### Phase summary

| Phase | Owner | Outcome |
|-------|-------|---------|
| **Setup** | Institute Owner | Centers, students, teachers, curriculum hierarchy configured |
| **Content** | Tutor | Question papers created from Excel upload |
| **Delivery** | Tutor | Assessments scheduled for batches and branches |
| **Execution** | Student | Tests taken (practice or timed assessment) |
| **Insight** | All roles | Reports, attendance, at-risk alerts, AI diagnosis |

---

## 5. Institute Owner / Admin flow

**Portal:** Institute Console (`/admin`)

**Purpose:** Run the organization and prove outcomes — not create day-to-day academic content.

### 5.1 Navigation areas

| Module | Route | Business purpose |
|--------|-------|------------------|
| Institution | `/admin` | Institute overview and KPIs |
| Centers | `/admin/centers` | Branch / center management |
| Students | `/admin/students` | Roster and student-wise reports |
| Test Attendance | `/admin/assessments` | Who was invited, attended, or absent |
| Tutor Content | `/admin/question-bank` | Read-only view of tutor question papers |
| Boards | `/admin/boards` | Board configuration |
| Subject Reports | `/admin/reports` | Institute-wide subject analytics |
| Curriculum Setup | `/admin/setup` | Academic hierarchy (Board → Topic) |
| Teachers | `/admin/teachers` | Tutor roster |
| Syllabus | `/admin/syllabus` | Syllabus mapping |
| AI Intelligence | `/admin/intelligence` | Institute-level AI insights |

### 5.2 Owner business process

1. **Configure institute** — Set up centers, boards, and teachers.
2. **Maintain student roster** — Enroll students; open student-wise reports.
3. **Define curriculum** — Board → Grade → Subject → Topic hierarchy.
4. **Monitor test delivery** — View institute-wide assessments and attendance detail per test.
5. **Review outcomes** — Subject reports, student reports, AI intelligence dashboard.
6. **Oversight of tutor content** — Browse question papers created by tutors (read-only).

### 5.3 Test attendance flow

```
Owner opens Test Attendance
        │
        ▼
Lists all tutor-scheduled tests (institute-wide)
        │
        ▼
Clicks a test → Attendance detail page
        │
        ▼
Sees: Invited │ Attended │ Absent per student
```

---

## 6. Tutor flow

**Portal:** Tutor Portal (`/tutor`)

**Purpose:** Create academic content, deliver assessments, and act on learning gaps.

### 6.1 Navigation areas

| Module | Route | Business purpose |
|--------|-------|------------------|
| Dashboard | `/tutor` | Copilot — what to teach next |
| Batches | `/tutor/batches` | Batch management |
| Students | `/tutor/students` | Student roster and readiness |
| At-Risk | `/tutor/at-risk` | Students needing intervention |
| Assessments | `/tutor/assessments` | Create and manage tests |
| Question Bank | `/tutor/question-bank` | Upload papers and manage content |
| Curriculum Setup | `/tutor/curriculum` | Browse hierarchy; topic → questions |
| Meeting Report | `/tutor/meeting-report` | Parent meeting summaries |

---

### 6.2 Question Bank flow

The Question Bank page shows **Upload Excel** and **Question papers** on a single page.

#### Step 1 — Upload Excel → Question paper

| Step | Action | System behaviour |
|------|--------|------------------|
| 1 | Tutor uploads Excel (or CSV) | File parsed and validated row by row |
| 2 | Valid rows previewed | Invalid rows flagged; valid rows can still be saved |
| 3 | Tutor enters paper name | — |
| 4 | Tutor clicks **Save as question paper** | Valid questions saved; paper created with topics from Excel **Topic** column |

**Business rule:** Upload does **not** add loose questions to a library. Each upload becomes one **question paper**, categorized by topic.

#### Step 2 — Create custom paper (optional)

From any existing question paper, tutor can click **Create custom paper**:

| Step | Action | System behaviour |
|------|--------|------------------|
| 1 | Enter custom paper name | — |
| 2 | Select topics | Questions for selected topics are **checked automatically** |
| 3 | Fine-tune individual questions (optional) | Manual check/uncheck supported |
| 4 | Save custom paper | New paper created, tagged as **Custom paper** |

#### Step 3 — View papers

- Papers listed with topic chips (e.g. `Linear Equations (2)`)
- **View paper** opens full question paper preview
- Papers are reused when creating assessments

```
Upload Excel
     │
     ▼
Validate rows ──► Save as Question Paper (topics auto-tagged)
     │
     ▼
[Optional] Create custom paper ──► Select topics + questions ──► Save
     │
     ▼
Ready for use in Assessments
```

---

### 6.3 Assessment creation flow

Tutor opens **Assessments → Create assessment** (4-step builder).

#### Step 1 — Board and test setup

| Field | Purpose |
|-------|---------|
| Assessment title | Display name |
| Board, Grade, Subject | Academic scope |
| Batch | Target student group |
| Scope | Subject / chapter / topic-wise |
| Mode | **Practice** (flash-card, immediate feedback) or **Assessment** (timed, one question per screen) |

#### Step 2 — Select question paper

| Action | Description |
|--------|-------------|
| Choose a question paper | Papers filtered by board, grade, and subject |
| **Full question paper** | All questions from the paper included |
| **Selected topics only** | Pick specific topics; their questions included automatically |

#### Step 3 — Assign students

- Select which students in the batch can attend
- **Select all in batch** shortcut available

#### Step 4 — Schedule and branches

| Field | Purpose |
|-------|---------|
| Exam duration | Minutes |
| Scheduled date | Test date |
| Branches | All centers or specific branches |

#### Step 5 — Publish

Assessment is scheduled. Owner can track attendance; students see it in their portal.

```
Create Assessment
     │
     ├─ Step 1: Board, grade, subject, batch, mode
     │
     ├─ Step 2: Question paper
     │       ├─ Full question paper
     │       └─ Selected topics only
     │
     ├─ Step 3: Assign students
     │
     └─ Step 4: Duration, date, branches → Schedule
```

---

### 6.4 Tutor follow-up flow

| Activity | Business outcome |
|----------|------------------|
| Dashboard / Copilot | Know what to teach next per batch |
| At-Risk | Identify students falling behind |
| Curriculum Setup | Click a topic to see related questions |
| Meeting Report | Prepare parent meeting talking points |
| Question paper preview | Review paper before or after a test |

---

## 7. Student flow

**Portal:** Student Portal (`/student`)

**Purpose:** Take assigned tests and understand personal progress (parent view included).

### 7.1 Navigation areas

| Module | Route | Business purpose |
|--------|-------|------------------|
| Dashboard | `/student` | Learning overview, readiness |
| Assessments | `/student/assessments` | Assigned tests |
| Reports | `/student/reports` | Performance and progress |

### 7.2 Student business process

1. **Login** — Student sees dashboard with upcoming assessments.
2. **Assessments** — List of tests assigned by tutor (matching board and grade).
3. **Take assessment**
   - **Practice mode:** Flash-card style, immediate feedback
   - **Assessment mode:** Timed, one question per screen
4. **Submit** — Mock AI diagnosis: weak topics, suggested focus areas.
5. **Reports** — View performance trends and readiness over time.

```
Student logs in
     │
     ▼
Dashboard (readiness, upcoming tests)
     │
     ▼
Assessments → Take test
     │
     ▼
Submit → AI topic diagnosis (mock)
     │
     ▼
Reports (progress over time)
```

---

## 8. Core content lifecycle

This is the main operational loop tutors run repeatedly:

| # | Stage | Actor | Output |
|---|-------|-------|--------|
| 1 | **Upload** | Tutor | Excel validated → Question paper saved |
| 2 | **Organize** | Tutor | Papers with topic tags; optional custom paper |
| 3 | **Assess** | Tutor | Assessment with full paper or selected topics |
| 4 | **Deliver** | Tutor | Students + branches invited |
| 5 | **Execute** | Student | Test taken (practice or assessment) |
| 6 | **Attend** | Owner | Attendance tracked institute-wide |
| 7 | **Analyze** | All | Reports, at-risk, AI diagnosis |
| 8 | **Improve** | Tutor | Adjust teaching; create new papers/tests |

---

## 9. Key business rules

| Rule | Description |
|------|-------------|
| Board & grade scoping | Students only see assessments for their board and grade |
| Upload = paper | Excel upload creates a question paper, not a loose question library |
| Topic auto-selection | Choosing a topic auto-includes its questions (custom paper & assessments) |
| Full vs partial paper | Assessments support full paper or selected topics only |
| Tutor creates, owner views | Owner has read-only access to tutor question papers |
| Combined student portal | Student and parent share one portal (no separate parent role) |
| Practice vs assessment | Practice = learning mode; Assessment = formal timed exam |
| Mock frontend only | No real API, file parsing, or live AI in this build |

---

## 10. Value chain by stakeholder

| Stakeholder | Business outcome |
|-------------|------------------|
| **Institute owner** | Better results, parent retention, admissions differentiation, teacher effectiveness data |
| **Tutor** | Less prep time, clear teaching priorities, batch weak-topic visibility |
| **Student** | Topic-level guidance beyond a single score |
| **Parent** (via student portal) | Visible progress and early warnings without a separate app |

---

## 11. Demo access (mock)

| Role | Email | Password |
|------|-------|----------|
| Owner / Admin | `rajesh@learnova.app` | `demo123` |
| Tutor | `arjun@learnova.app` | `demo123` |
| Student | `priya@learnova.app` | `demo123` |
| Generic demo | `demo@learnova.app` | `demo123` |

**Suggested demo path**

1. **Tutor** — Question Bank → upload paper → Assessments → create test (full or selected topics).
2. **Student** — Assessments → take test → view diagnosis.
3. **Owner** — Test Attendance → student report → Tutor Content (read-only).

---

## 12. Related documents

| Document | Location |
|----------|----------|
| Business Requirements (BRD v4) | `brd_full.txt` |
| Design system | `LEARNOVA_DESIGN_SYSTEM.md` |

---

## 13. Document control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 25 Jun 2026 | Initial business flow for mock frontend — question bank restructure, role separation, combined student portal |

---

*End of document*
