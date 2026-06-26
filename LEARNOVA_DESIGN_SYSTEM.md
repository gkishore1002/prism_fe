# Learnova — Design System & Architecture

> **Usage:** Attach this file to EVERY page/component you build. Paste it as context in Cursor or any AI coding tool. This ensures visual consistency across the entire platform.

---

## 1. Brand identity

- **Product name:** Learnova
- **Parent brand:** CSC Centre Learnova Software
- **Tagline:** Academic Intelligence Platform
- **One-liner:** Transforms assessments into actionable academic intelligence
- **Personality:** Bold, settled, intelligent, outcome-first — NOT an LMS or school ERP
- **Audience:** Students, Tutors, Admins (institutions: schools, coaching, tuition, training)
- **Feel:** CSC bold yellow + navy blue, premium SaaS clarity. Students see **minimal** screens; tutors/admins see **data-rich** consoles.

---

## 2. Color system (strict — do not deviate)

### Primary palette — Navy Blue (anchored on `#1E3A5F`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-navy-900` | `#0F2440` | Sidebar gradient anchor, deepest text |
| `--ln-navy-800` | `#1E3A5F` | Primary buttons, headings ← BASE |
| `--ln-navy-700` | `#2E4F7A` | Button hover, sidebar gradient mid |
| `--ln-navy-600` | `#3D6599` | Links, active states |
| `--ln-navy-500` | `#4A7AB8` | Section labels, icons |
| `--ln-navy-400` | `#6B9FD4` | Chart fills, secondary icons |
| `--ln-navy-300` | `#93B8E8` | Light accents, sparklines |
| `--ln-navy-200` | `#BFD7F7` | Light borders, tints |
| `--ln-navy-100` | `#DBEAFE` | Badge backgrounds |
| `--ln-navy-50`  | `#EFF6FF` | Ghost button bg |

### Action color — CSC Gold (CTAs, recovery, urgency)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-gold-700` | `#A88A2E` | Dark text on gold bg |
| `--ln-gold-600` | `#D4A82A` | Metric values, badge text |
| `--ln-gold-500` | `#E8C547` | Primary action buttons, logo yellow |
| `--ln-gold-400` | `#F5D76E` | Hover, accents, sidebar active icon |
| `--ln-gold-300` | `#FFE9A8` | Chart fills |
| `--ln-gold-100` | `#FFF4D6` | Badge bg, icon bg |
| `--ln-gold-50`  | `#FFFBF0` | Pipeline / plan stage bg |

### Success (Emerald)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-emerald-600` | `#059669` | Positive deltas, readiness up |
| `--ln-emerald-500` | `#10B981` | Success borders |
| `--ln-emerald-100` | `#D1FAE5` | Badge bg |
| `--ln-emerald-50`  | `#ECFDF5` | Success tint |

### Risk (Rose)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-rose-600` | `#E11D48` | Gap alerts, errors |
| `--ln-rose-500` | `#F43F5E` | Alert borders |
| `--ln-rose-100` | `#FFE4E6` | Badge bg |
| `--ln-rose-50`  | `#FFF1F2` | Risk tint |

### Intelligence (Indigo — AI insights only)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-indigo-600` | `#4F46E5` | AI accent |
| `--ln-indigo-500` | `#6366F1` | AI pulse dot |
| `--ln-indigo-100` | `#E0E7FF` | Insight card bg |
| `--ln-indigo-50`  | `#EEF2FF` | AI tint |

### Neutral surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-surface-0`   | `#FFFFFF` | Card bg, input bg |
| `--ln-surface-50`  | `#F8FAFF` | Page bg |
| `--ln-surface-100` | `#F0F4FA` | Section dividers |
| `--ln-surface-200` | `#E4EBF5` | Borders |
| `--ln-surface-300` | `#D4DEED` | Hover borders |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--ln-text-primary`   | `#1E3A5F` | Body text |
| `--ln-text-secondary`  | `#5A7291` | Descriptions |
| `--ln-text-muted`      | `#8FA3BC` | Labels, hints |
| `--ln-text-faint`      | `#B8C8D9` | Disabled |

### Gradients

| Token | Value | Usage |
|-------|-------|-------|
| `--ln-gradient-dark` | `linear-gradient(to bottom right, #0F2440, #2E4F7A, #0F2440)` | Sidebar, login hero |
| `--ln-gradient-gold` | `linear-gradient(135deg, #F5D76E, #E8C547)` | CSC logo, action buttons |
| `--ln-gradient-mesh` | Radial blue + gold on `#F8FAFF` | Login right panel |

**Rules:** Gradients ONLY on dark contexts (sidebar, login hero). Light cards stay flat white.

---

## 3. Typography

```
Font imports:
https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

| Role | Font | Usage |
|------|------|-------|
| Display | Sora 600–700 | Titles, nav, buttons |
| Body | DM Sans 400–500 | Content, inputs |
| Data | IBM Plex Mono 500–600 | Scores, percentages |

**NEVER use:** Inter, Roboto, Poppins, or system fonts as primary.

---

## 4. Module architecture (Swotify pattern)

```
src/
├── theme/                  # Global tokens, baseTheme
├── modules/
│   ├── auth/               # Login, role selection, session
│   ├── student/            # Minimal student portal
│   ├── tutor/              # Class intelligence
│   └── admin/              # Institution console
├── components/             # Shared UI + layout
├── lib/                    # modules registry, utils
├── data/                   # Mock intelligence data
└── app/                    # Router shell
```

Each module contains:
- `{Module}Dashboard.tsx` — nested routes
- `pages/` — route screens
- `lib/nav.ts` — navigation config
- `lib/{module}Theme.ts` — role-specific tokens

---

## 5. Role design rules

| Role | Density | Primary color | Key pattern |
|------|---------|---------------|-------------|
| **Student** | **Minimal** — max 3 actions per screen | Navy + Gold | One focus, one CTA, no tables |
| **Tutor** | Data-rich | Navy | Class insights, student cards |
| **Admin** | Data-rich | Navy + Gold metrics | Institution KPIs, hierarchy |

### Student minimal rules (critical)

- **Max 4 nav items:** Home, Health, My Plan, Assessments
- **One hero metric** per screen (health % or next step)
- **No tables** on student screens
- **No more than 3 cards** visible without scrolling on dashboard
- **Outcome language:** "Fix this → +12%" not "Score: 72%"
- **No jargon:** readiness/gaps shown as plain "What to study next"

---

## 6. Component patterns

### Cards
```css
background: var(--ln-surface-0);
border: 1px solid var(--ln-surface-200);
border-radius: 14px;
```

### Left-border accent (signature pattern)
```css
border-left: 3px solid var(--ln-gold-500);  /* action */
border-left: 3px solid var(--ln-navy-500);  /* brand */
border-left: 3px solid var(--ln-rose-500);  /* risk */
border-left: 3px solid var(--ln-indigo-500); /* AI insight */
```

### Buttons

| Type | Background | Text |
|------|-----------|------|
| Primary | `--ln-navy-800` | white |
| Action (Gold) | `--ln-gold-500` | `--ln-navy-900` |
| Ghost | `--ln-navy-50` | `--ln-navy-700` |

### Sidebar
- Width: 260px
- Background: `--ln-gradient-dark`
- Active nav icon: `--ln-gold-400`
- Brand: CSC logo mark (yellow face, navy extrusion)

---

## 7. Academic hierarchy

All intelligence is built on:

**Board → Grade → Subject → Chapter → Topic → Question**

---

## 8. Semantic color mapping

| Context | Color |
|---------|-------|
| Brand / navigation | Navy |
| Actions / recovery / CTAs | Gold |
| Positive / improvement | Emerald |
| Gaps / alerts | Rose |
| AI insights | Indigo |

---

## 9. CSS variables block

```css
:root {
  --ln-navy-900: #0F2440;
  --ln-navy-800: #1E3A5F;
  --ln-navy-700: #2E4F7A;
  --ln-navy-500: #4A7AB8;
  --ln-gold-500: #E8C547;
  --ln-gold-400: #F5D76E;
  --ln-gold-100: #FFF4D6;
  --ln-surface-0: #FFFFFF;
  --ln-surface-50: #F8FAFF;
  --ln-surface-200: #E4EBF5;
  --ln-text-primary: #1E3A5F;
  --ln-gradient-dark: linear-gradient(to bottom right, #0F2440, #2E4F7A, #0F2440);
  --sidebar-w: 260px;
  --header-h: 64px;
  --radius-card: 14px;
}
```

---

## 10. Prompt template

```
Build the [PAGE NAME] page for Learnova.
Follow LEARNOVA_DESIGN_SYSTEM.md for colors, fonts, modules, and layout.
Role: [Student/Tutor/Admin]
Student pages MUST follow minimal rules (section 5).
```

---

*Learnova Design System v1.0 — CSC Centre · Bold Navy + Gold · Module architecture aligned with Swotify v2*
