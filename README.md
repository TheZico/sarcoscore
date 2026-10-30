# SarcoScore — Clinical Sarcoidosis Likelihood Platform

A calm, trustworthy clinical web platform built for medical doctors to evaluate patient symptoms and laboratory findings, compute a transparent sarcoidosis likelihood percentage, and explore published case dataset insights.

## Architecture & Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling & Design System:** Tailwind CSS, warm bone (`hsl(44, 26%, 96%)`) & muted sage (`hsl(158, 26%, 36%)`) clinical palette, Google Fonts (`Petrona` serif headings + `Inter` body/eyebrows)
- **Motion & UI:** Framer Motion (`framer-motion` / `motion`), Radix UI Accordion (`@radix-ui/react-accordion`), `lucide-react`
- **Charts:** Recharts (`recharts`)
- **Scoring & Unit Tests:** Pure browser-side TypeScript in `src/lib/scoring.ts` verified with Vitest (`src/lib/scoring.test.ts`) against all `test_vectors` in `src/data/model.json`

## Pages

1. **`/` (Home):** Full clinical marketing & overview landing page combining the warm bone/sage aesthetic (Hero with animated AI prediction card, Trust strip, 3 clinical problem stat cards from `model.json`, Features 2x3 grid, 4-step How It Works, AI Decision Support split view, Security & Privacy, Who It Is For + Competition Team, Radix FAQ Accordion, and CTA banner).
2. **`/check` (Check a Patient):** Interactive client-side clinical checker with symptoms grouped by body system (`General`, `Chest`, `Skin, nose & mouth`, `Abdomen`, `Other`, `Imaging & tests`), optional quantitative laboratory inputs with normal range hints, sample preset loaders, live sticky `ResultCard`, and one-click `Print / Save as PDF`.
3. **`/insights` (What the Data Shows):** Recharts visualizations built dynamically from `model.stats` and `model.features` (Top 10 Most Frequent Findings, Points per Finding sorted horizontally, Age Groups, Time to Diagnosis per patient with dashed median reference line, and full prevalence comparison table).
4. **`/method` (How It Works):** Plain-language explanation of finding points, laboratory severity tiers (`1/3`, `2/3`, `full`), odds-doubling probability conversion, full laboratory reference table, and prototype limitations.

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

Whenever cases are added or the full AI model output is exported, replace `src/data/model.json` and run `npm test` to verify all test vectors pass. Every page, chart, and scoring calculation reads directly from `src/data/model.json`.

