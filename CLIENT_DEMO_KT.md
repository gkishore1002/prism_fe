# Prism Frontend — Client Demo KT

**Audience:** Client walkthrough (not a developer onboarding)  
**App:** `prism_fe` at **http://localhost:5174** (or the hosted demo URL)  
**Last aligned to code:** September 2026  

Use this as a **speaker script**. Click the routes in order. Say the talking points. Skip anything marked optional if time is short.

---

## 1. One-liner (open with this)

Prism is an academic intelligence platform for coaching centres and schools. Every test is tagged to **Board → Grade → Subject → Chapter → Topic**, so results are not just a mark — they become **weak-topic diagnosis, teaching priorities, and bilingual reports** that parents collect in person at the centre (CSC).

---

## 2. Demo accounts (seeded)

Organization code for tenant users: **`DEMO001`**  
Platform console: **`SYSTEM`**

| Who to show | Org code | Email | Password | Lands on |
|-------------|----------|-------|----------|----------|
| Organization admin (owner) | `DEMO001` | `admin@demo.com` | `demo1234` | `/admin` |
| Tutor | `DEMO001` | `tutor@demo.com` | `demo1234` | `/tutor` |
| Student | `DEMO001` | `student@demo.com` | `demo1234` | `/student` |
| Platform super user | `SYSTEM` | `superuser@prism.io` | `superuser123` | `/admin/platform` |

**Login fields:** Organization → Email → Password.  
If a staff member has **more than one role** (tutor + branch admin, etc.), Prism shows a **role picker** after login. During the session they can also switch from the sidebar **Switch portal** control.

Users created in the UI log in as `{phone}@gmail.com` / phone number (unless a custom password was set).

---

## 3. Roles at a glance

Prism has **four login roles**. Admin splits into two **portals**.

| Role in product | Portal | What they run |
|-----------------|--------|----------------|
| **Platform Super User** | `/admin/platform` | Multi-tenant: organizations, onboard new institutes, platform admins |
| **Organization Admin** (owner) | `/admin` — Organization Console | Whole-chain setup, branches, settings, academic years, all students/staff |
| **Branch Admin** | `/admin` — Branch Console | Same academic tools, scoped to assigned branches. **No Settings, no Branches tab** |
| **Tutor** | `/tutor` | Content, assessments, marks, batch teaching, copilot |
| **Student** | `/student` | Take exams, see health/readiness. Full diagnostic reports are **not** in-app — they collect at CSC with a guardian |

There is **no parent login**. Parent experience is the student portal plus in-person CSC reports.

A single staff record can be **tutor and/or branch admin and/or org owner**. They pick a portal at login and can switch later.

---

## 4. Recommended 35-minute demo path

Do **not** demo menus randomly. Tell one story:

> Institute is set up → tutors build papers → students sit exams → staff see who attended → reports and CSC close the loop with parents.

| Min | Login as | Show | Why clients care |
|-----|----------|------|------------------|
| 0–2 | — | Login screen, org picker | Multi-tenant; each institute has its own code |
| 2–10 | Org admin | Dashboard → Manage → Curriculum → Settings | They can run the business without a vendor |
| 10–22 | Tutor | Question Bank → Assessments → Dashboard → Marks → Reports | Day-to-day academic engine |
| 22–28 | Student | Dashboard → Assessments → start exam (or walk through if already submitted) | What the child actually sees |
| 28–35 | Tutor or Admin | Attendance → Reports → student profile (CSC + reassignment) | Outcomes + parent process |

**If they only have 15 minutes:** Tutor (create/view paper + assessment list) → Student (dashboard + exam list) → Admin (dashboard + one student report).

**Optional 5 minutes at the end:** Super user → Organizations → Add organization.

---

## 5. Chrome that is always on (mention once)

After login, point at the **top bar** and **sidebar** so later clicks make sense.

| Control | Who sees it | What it does |
|---------|-------------|--------------|
| **Academic year switcher** | Admin + Tutor | Filters roster, assessments, reports to that year |
| **Branch switcher** | Admin + Tutor | `All branches` vs one centre. Branch admins only see assigned centres |
| **Org switcher** | Super user only | Jump between tenants |
| **Notification bell** | All | Reassignment, CSC reminders, general alerts |
| **Role / portal switcher** | Multi-role staff | Switch Organization Admin / Branch Admin / Tutor without re-login |
| **Sign out** | All | Bottom of sidebar |

Students get a **pending-assessment reminder** overlay when something is live.

---

## 6. Platform Super User

**Login:** `SYSTEM` / `superuser@prism.io` / `superuser123`  
**Home:** `/admin/platform`

### Sidebar

| Screen | Route | Demo |
|--------|-------|------|
| Organizations | `/admin/platform` | Org list, active/inactive filter, stats |
| Add organization | `/admin/platform/onboard` | Name, code, type (coaching / school / tuition / training), owner phone → `{phone}@gmail.com` |
| Platform admins | `/admin/platform/admins` | Create more super users |

### Talking points

- Prism is **one platform, many institutes**. Each org gets its own tenant.
- Opening an org (`/admin/platform/organizations/:code`) lets the operator inspect that tenant.
- Super users do **not** teach classes. Day-to-day academics live in the org.

**Skip in a short demo** unless the client is a group/franchise.

---

## 7. Organization Admin

**Login:** `DEMO001` / `admin@demo.com` / `demo1234`  
**Home:** `/admin`

### Sidebar

| Screen | Route | What to show |
|--------|-------|----------------|
| Dashboard | `/admin` | KPIs, branch health, live assessments, staff snapshot |
| Manage | `/admin/manage` | Students, Staff, **Branches** |
| Assessments | `/admin/assessments` | Create/manage tests, attendance, reassignment queue |
| Question Bank | `/admin/question-bank` | Same library as tutors (create, import, books) |
| Reports | `/admin/reports` | Class insights, student reports, subject reports, **Trends** |
| Curriculum Setup | `/admin/curriculum` | Board → Grade → Subject → Chapter → Topic + batches |
| Settings | `/admin/settings` | **Org admin only** — academic years, assessment policy, CSC policy |

### 7.1 Dashboard (`/admin`) — 2 minutes

Show: student/tutor counts, academic health, branch comparison, at-risk hints.  
**Say:** “This is the owner view — outcomes across the chain, not a question editor.”

### 7.2 Manage (`/admin/manage`)

**Students** (`/admin/manage/students`)

- Add student (phone → login email preview).
- Bulk CSV import + template download.
- View profile: Overview, Academic, Assessments, **CSC**, Activity.
- **Promote** into the next academic year (board/grade/batch/centre).
- Export CSV.
- Open **Learning Genome** reports: overall + per-assessment (EN / TA).

**Staff** (`/admin/manage/staff`)

- Create staff with checkboxes: **Organization owner**, **Branch admin**, **Tutor** (at least one).
- Assign centres + academic-year posting.
- Bulk CSV import.
- **Say:** “One person can teach and also run a branch. They choose the portal when they sign in.”

**Branches** (`/admin/manage/centers`) — org admin only

- Add centre (name + city).
- Open a centre: edit, student list, CSC urgency, export students / CSC compliance.

### 7.3 Curriculum (`/admin/curriculum`)

Walk the tree: **New board** → grade → subject → chapter → topic → **batch**.  
**Say:** “Nothing else works until this hierarchy exists. Questions, tests, and reports all hang off Board and Grade.”

Tutors **cannot** add boards/grades; they add subjects, topics, and batches under what admin defined.

### 7.4 Settings (`/admin/settings`) — org admin only

Two policy blocks:

**Assessment policy** — extension days, whether tutors may extend, admin override, rejection reason, multiple requests.

**CSC policy** — inactivity / warning thresholds, 30/14/7 day reminders, auto-disable, auto-reactivate on collection.

**Academic years card** — create `2026-27`, mark current. Header switcher follows this.

### 7.5 Assessments & Question Bank

Same builders as tutor (see §8). Admins can schedule tests institute-wide and review **access / reassignment requests**.

### 7.6 Reports (`/admin/reports`)

Tabs: **Class insights** · **Student reports** · **Subject reports** · **Trends**.  
Student deep-link: `/admin/students/:id/reports` → overall + each assessment. Bilingual narrative (English / Tamil).

---

## 8. Branch Admin

Same URLs as org admin, but:

- Sidebar label: **Branch Console**.
- **No Settings**.
- **No Branches** tab under Manage.
- Branch switcher only lists **assigned** centres.
- Data (students, tests, reports) is scoped to those branches.

**How to demo without a second account:** create a staff member who is **branch admin only**, log out, log in as them, pick **Branch Admin** on the role screen. Or, if the demo admin also has a branch portal option, use **Switch portal**.

**Say:** “Centre heads run their branch. Owners keep chain-wide settings and new locations.”

---

## 9. Tutor

**Login:** `DEMO001` / `tutor@demo.com` / `demo1234`  
**Home:** `/tutor`

### Sidebar

| Screen | Route | What to show |
|--------|-------|----------------|
| Dashboard | `/tutor` | Copilot: what to teach next, weak topics, live tests |
| Students | `/tutor/students` | Same student master as admin (batch/branch scoped) |
| Assessments | `/tutor/assessments` | Create test, papers, attendance, reassignment |
| Marks | `/tutor/marks` | Manual / Excel marks **outside** in-app exams |
| Reports | `/tutor/reports` | Insights, student reports, subject reports, **At-risk** |
| Question Bank | `/tutor/question-bank` | Library, Create, Import, Books |
| Curriculum Setup | `/tutor/curriculum` | Subjects, topics, batches (not boards/grades) |

### 9.1 Question Bank — core content demo

Tabs:

1. **Library** — published papers (Imported / Manual / Custom). View paper, custom paper from topics, delete.
2. **Create** — **Manual question entry** (MCQ / short / long). Images per stem/option. **Math keyboard** (LaTeX) for maths subjects.
3. **Import** — Excel/CSV/JSON. Row validation, preview, **Save as question paper** (upload = one paper, not a loose dump).
4. **Books** — upload syllabus PDF/book → AI outline → approve/edit chapters/topics → import into curriculum.

**Custom paper:** pick parent paper → select topics (questions auto-check) → fine-tune → save as Custom.

### 9.2 Create assessment — 3-step builder

**Assessments → Create assessment**

| Step | Title | Fields |
|------|-------|--------|
| 1 | Setup, paper & topics | Title, board, grade, subjects, batch, mode (**Practice** vs **Assessment**), question paper, full paper vs selected topics, preview |
| 2 | Assign students | Batch roster (select all), optional extra invitees |
| 3 | Schedule & branches | Duration (optional / untimed), dates, **available until** (assessment mode), **shuffle questions and options**, which branches |

**Modes**

- **Practice:** learning; instant feedback.
- **Assessment:** formal exam; timed when duration is set; one-question exam UI; proctoring.

**Say:** “Students only see tests for **their** board and grade. Shuffle means each child gets a different order; the master paper does not change.”

From the list: view paper, **attendance** (`/tutor/assessments/:id/attendance` — invited / attended / absent, scores, CSV), delete, info.

**Reassignment panel** on the same page: pending → review (approve with extension / reject with reason). Policies come from Settings.

### 9.3 Marks (`/tutor/marks`)

For class tests **not** taken inside Prism.

- Recent activity
- Upload & template (CSV/XLSX)
- Manual spreadsheet by batch / subject / date

**Say:** “Reports combine **in-app exams** and **marks you type or upload**.”

### 9.4 Dashboard & reports

Dashboard: batch selector, copilot summary, weak-topic bars, at-risk students.  
Reports: **Class insights** (Learning Genome cohort), student list → overall + assessment reports, subject reports, **At-risk**.

---

## 10. Student

**Login:** `DEMO001` / `student@demo.com` / `demo1234`  
**Home:** `/student`

### Sidebar (only two items)

| Screen | Route | What to show |
|--------|-------|----------------|
| Dashboard | `/student` | Health ring, recovery plan, subject strip, today’s focus, trend, live exam prompt |
| Assessments | `/student/assessments` | Available / in progress / overdue / completed |

Enrollment year bar lets them view a **past year** (history only, no new live tests).

### 10.1 Taking an exam

1. Assessments → **Start** / **Resume** (button enters **fullscreen**).
2. Device is bound to the attempt (cannot finish on a second device).
3. Heartbeat + violations: leave fullscreen, tab switch, lose focus. After the limit, exam **auto-submits**.
4. MCQ / short / long; images; math rendering; optional **shuffled** order.
5. Autosave. Submit → “Thanks, wait for results” (not a full score dump).
6. Practice mode shows **instant feedback**.

**Do not** leave fullscreen mid-demo unless you want to show proctoring.

### 10.2 After the test / missed window

- Completed tests: short student message (EN + TA) when released; **full report is at CSC** (modal explains visit with parent/guardian).
- If the window closed: **Request reassignment** with a reason → tutor/admin review.
- CSC inactivity reminders can appear in notifications.

**Say:** “The child sees coaching, not a printable parent report. Detailed Learning Genome reports are collected **in the centre** so the counsellor can walk the family through them.”

---

## 11. Golden path (end-to-end story)

Use this if they ask “how does a week work?”

```
Org admin: academic year + branch + curriculum + batches
        │
        ▼
Admin/Tutor: enroll students & staff (phone logins)
        │
        ▼
Tutor: Question Bank (manual / Excel / books) → paper in Library
        │
        ▼
Tutor/Admin: Create assessment → assign batch → schedule → publish
        │
        ▼
Student: Start exam (fullscreen, optional shuffle) → submit
        │
        ▼
Tutor/Admin: Attendance + scores
        │
        ▼
Reports (insights, student overall, per-test)  EN + TA
        │
        ▼
Family visits CSC → staff logs report collection (resets inactivity)
        │
        ▼
If a student missed the window → reassignment request → approve/reject
```

---

## 12. Capability matrix (client FAQ)

| Capability | Super user | Org admin | Branch admin | Tutor | Student |
|------------|:----------:|:---------:|:------------:|:-----:|:-------:|
| Onboard new organization | Yes | — | — | — | — |
| Academic years & CSC/assessment policy | — | Yes | — | — | — |
| Add boards & grades | — | Yes | Yes* | — | — |
| Subjects, topics, batches | — | Yes | Yes | Yes | — |
| Students & staff CRUD / CSV | — | Yes | Assigned branches | Students (scoped) | — |
| Manage branch list | — | Yes | — | — | — |
| Question bank create/import | — | Yes | Yes | Yes | — |
| Create assessments | — | Yes | Yes | Yes | — |
| Marks upload | — | — | — | Yes | — |
| Take exam | — | — | — | — | Yes |
| Full Learning Genome report in app | — | Yes | Yes | Yes | CSC in person |
| Review reassignment | — | Yes | Yes | Yes | Request only |
| Log CSC report collection | — | Yes | Yes | Yes | — |

\*Branch admin uses the same curriculum screen as org admin for hierarchy under their scope; **new boards** are an institute-level admin action in the UI (`canManageBoardGrade`).

---

## 13. What to avoid on stage

| Trap | Why |
|------|-----|
| Clicking leftover `/student/reports` URLs | They **redirect** to Assessments. Student full reports are staff-side + CSC. |
| Switching academic year mid-flow | Roster and tests look “empty” if nobody is enrolled in that year. Switch back. |
| “All branches” vs one branch | Counts change; explain the filter before they think data vanished. |
| Starting a live exam without warning | Fullscreen + tab-switch can **terminate** the attempt. Use Practice mode or a disposable student. |
| Excel import with wrong columns | Show a **valid** template row; invalid rows are flagged and can be skipped. |
| Demo as super user for teaching | Super user never sees `/tutor` or `/student`. |

---

## 14. First-run (only if the DB is empty)

If `SEED_DEMO=false` and the deployment is not initialized, the app opens **`/setup`**: organization name, code, owner name, owner phone. Then login with `{phone}@gmail.com`.  
Once setup is done, `/setup` is closed. Prefer **seeded DEMO001** for client demos.

---

## 15. Suggested spoken close

> Prism gives the institute a single operating system: curriculum and people, papers and exams, and topic-level intelligence. Tutors know what to teach tomorrow. Students get a fair, proctored exam. Owners see which branches and batches are moving. Parents still come to the centre for the full report — so counselling stays human.

---

## Related

| Doc | Use |
|-----|-----|
| `prism_fe/README.md` | How to run the frontend |
| `prism_be/README.md` | API, seed flags, Docker |
| `prism_fe/PRISM_DESIGN_SYSTEM.md` | Visual language (not needed on a client call) |
| `prism_fe/BUSINESS_FLOW.md` | Older mock-era flow — **do not use** for this demo; this KT replaces it |

---

*End of client demo KT*
