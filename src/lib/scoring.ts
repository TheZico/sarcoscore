// src/lib/scoring.ts
import model from "@/data/model.json";

export type Input = {
  symptoms: string[];
  labs: Record<string, number | undefined>;
};
export type Item = { label: string; points: number };

export interface CustomScoringOptions {
  customFeatures?: { id: string; label: string; points: number }[];
  customLabs?: {
    id: string;
    label: string;
    unit: string;
    low: number;
    high: number;
    direction: string;
    max_points: number;
  }[];
}

// Python-style rounding (round half to even) so results match the Python model exactly.
function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
}

export function labPoints(
  id: string,
  value: number,
  customLabs?: CustomScoringOptions["customLabs"]
) {
  const labsSource = customLabs ?? model.labs;
  const lab =
    labsSource.find((l) => l.id === id) ?? model.labs.find((l) => l.id === id);
  if (!lab || typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100_000) {
    return { points: 0, status: "Normal", ratio: 0 };
  }
  const ratio =
    lab.direction === "high"
      ? value / lab.high
      : value > 0
      ? lab.low / value
      : 999;
  let frac = 0;
  for (const [limit, f] of model.severity_tiers) {
    if (ratio <= limit) {
      frac = f;
      break;
    }
  }
  const points = roundHalfEven(lab.max_points * frac);
  const status =
    ratio <= 1 ? "Normal" : lab.direction === "high" ? "High" : "Low";
  return { points, status, ratio: Math.round(ratio * 100) / 100 };
}

export function score(input: Input, options?: CustomScoringOptions) {
  const featuresSource = options?.customFeatures ?? model.features;
  const labsSource = options?.customLabs ?? model.labs;

  const items: Item[] = [];
  const uniqueSymptoms = Array.from(new Set(input.symptoms ?? []));
  for (const id of uniqueSymptoms) {
    const f =
      featuresSource.find((x) => x.id === id) ??
      model.features.find((x) => x.id === id);
    if (f && f.points !== 0) items.push({ label: f.label, points: f.points });
  }
  for (const [id, v] of Object.entries(input.labs ?? {})) {
    if (
      v === undefined ||
      v === null ||
      typeof v !== "number" ||
      !Number.isFinite(v) ||
      v < 0 ||
      v > 100_000
    ) {
      continue;
    }
    const lab =
      labsSource.find((l) => l.id === id) ??
      model.labs.find((l) => l.id === id);
    if (!lab) continue;
    const r = labPoints(id, v, labsSource);
    if (r.points > 0)
      items.push({
        label: `${lab.label} ${v} ${lab.unit} (${r.status}, ${r.ratio}× limit)`,
        points: r.points,
      });
  }
  items.sort((a, b) => b.points - a.points);
  const total = items.reduce((s, i) => s + i.points, 0);
  const p0 = model.pretest_probability;
  const odds = (p0 / (1 - p0)) * Math.pow(2, total / 2);
  const probability = Math.min(odds / (1 + odds), model.probability_cap);
  const level = model.levels.find(
    (l) => probability >= l.min && probability < l.max
  )!.name;
  return { total, probability, level, items };
}
