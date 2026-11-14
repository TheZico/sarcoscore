# SarcoScore — Sarcoidosis Clinical Decision Support Platform

A clinical web platform built for medical doctors, researchers, administrators, and patients to evaluate sarcoidosis likelihood from symptoms and laboratory test results, manage clinical visits, review research cohorts, and administer scoring rules.

> **Demo Data Only:** All patient records, 14-digit Egyptian National IDs, and clinical visits are synthetic demo data. Never enter or store real patient data.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS, warm bone (`hsl(44, 26%, 96%)`) & dark sage (`hsl(158, 30%, 27%)`) clinical aesthetic, `Petrona` serif headings + `Inter` 17px body
- **Charts & Motion:** Recharts (`recharts`), Framer Motion (`framer-motion` 0.75s fade-up), `lucide-react`
- **Database & Security:** Supabase schema + Row Level Security (`supabase/schema.sql`) and programmatic RLS enforcement (`src/lib/rls.ts`, `src/lib/db.ts`) verified with Vitest (`src/lib/rls.test.ts`, `src/lib/scoring.test.ts`)

## Demo Accounts (One Per Role)

Sign in at **`/login`** (password for all accounts: `demo1234`):

| Role | Email | Home Route | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sarcoscore.demo` | `/dashboard` | Dashboard, Create & Review, Patient Profile, Research & Insights, System Management |
| **Doctor** | `doctor@sarcoscore.demo` | `/dashboard` | Dashboard, Create & Review, Patient Profile |
| **Researcher** | `researcher@sarcoscore.demo` | `/research` | Research & Insights |
| **Patient** | `patient@sarcoscore.demo` | `/my-health` | My Health (own scan & test results only) |

## Modules & Routes

1. **`/` (Public Home):** Hero (*"Helping doctors suspect sarcoidosis earlier"*), Login CTA, 3-part Camera Analogy graphic (*Research = Scene*, *Model = Lens*, *Platform = Photograph*), and PubMed/Google Scholar 30-case dataset overview.
2. **`/login` (Authentication & RLS Matrix):** Email + password login, 1-click demo role switcher, and live Row Level Security permission matrix.
3. **`/dashboard` (Dashboard — Doctor, Admin):** Search patients by name, 14-digit National ID, or Patient ID; High-risk alerts (`High` likelihood ≥60%); Recently opened files; and filterable Latest Patient Files.
4. **`/cases/new` (Create & Review — Doctor, Admin):** Two tabs for **New Patient File** (14-digit National ID validated) and **Temporary File** (no National ID), opening directly into the clinical visit scorer.
5. **`/patients/[id]` (Patient Profile — Doctor, Admin):** Editable personal info, medical history summary, doctor-recorded diagnosis, current symptoms & latest investigations/labs, interactive **"Add clinical visit"** scorer, Recharts longitudinal score trajectory chart, and visit-to-visit comparison table.
6. **`/research` (Research & Insights — Researcher, Admin):** Two tabs for **Model & Insights** (Excel/PDF case upload into the isolated `pending` review queue + frequent symptoms and examinations charts) and **Patient Case Page** (de-identified research table + CSV export).
7. **`/admin` (System Management — Admin only):** Five sections: User accounts & roles, Medical lists (Investigations, Symptoms + points, Diagnoses, Specialties), Scoring & lab ranges, Review latest 200 changes (`audit_log`), and Backup & restore with confirmation step.
8. **`/my-health` (My Health — Patient only):** Read-only personal scan and laboratory test results with dates, isolated by Row Level Security to the signed-in patient's own record (`PT-2026-001`).

## Commands

```bash
# Run Vitest unit tests (scoring test_vectors + Row Level Security)
npm test

# Start development server
npm run dev

# Build production bundle
npm run build
```
