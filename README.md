# SarcoScore — Clinical Sarcoidosis Likelihood Platform

A calm, trustworthy clinical web platform built for medical doctors to evaluate patient symptoms and laboratory findings, compute a transparent sarcoidosis likelihood percentage, and explore published case dataset insights.

## Architecture & Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling & Design System:** Tailwind CSS, warm bone (`hsl(44, 26%, 96%)`) & muted sage (`hsl(158, 26%, 36%)`) clinical palette, Google Fonts (`Petrona` serif headings + `Inter` body/eyebrows)
- **Motion & UI:** Framer Motion (`framer-motion` / `motion`), Radix UI Accordion (`@radix-ui/react-accordion`), `lucide-react`
- **Charts:** Recharts (`recharts`)
- **Scoring & Unit Tests:** Pure browser-side TypeScript in `src/lib/scoring.ts` verified with Vitest (`src/lib/scoring.test.ts`) against all `test_vectors` in `src/data/model.json`

## Pages

1. **`/` (Home):** Split hero with read-only example result card from `model.test_vectors[1]`, 3 clinical problem stat cards from `model.json`, 3-step How It Works overview, and Student Competition Team section.
2. **`/check` (Check a Patient):** Interactive client-side clinical checker with symptoms grouped by body system (`General`, `Chest`, `Skin, nose & mouth`, `Abdomen`, `Other`, `Imaging & tests`), optional quantitative laboratory inputs with normal range hints, sample preset loaders, live sticky `ResultCard`, and one-click `Print / Save as PDF`.
3. **`/insights` (What the Data Shows):** Recharts visualizations built dynamically from `model.stats` and `model.features` (Top 10 Most Frequent Findings, Points per Finding sorted horizontally, Age Groups, Time to Diagnosis per patient with dashed median reference line, and full prevalence comparison table).
4. **`/method` (How It Works):** Plain-language guide to the **points-based scoring model**: where the data comes from, how the data is organized, points for findings, points for labs, from points to %, full lab reference table, the 3-part camera analogy graphic, planned next-stage platform card, and prototype limitations.

## Local Development & Testing

```bash
# Run unit tests against model.json test vectors
npm test

# Start local development server
npm run dev

# Build static production bundle
npm run build
```

## Updating the Model (`model.json`)

Whenever cases are added or the scoring model output is regenerated, replace `src/data/model.json` and run `npm test` to verify all test vectors pass. Every page, chart, and scoring calculation reads directly from `src/data/model.json`.

